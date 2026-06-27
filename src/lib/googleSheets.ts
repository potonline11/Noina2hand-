import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Transaction, Member } from '../types';
import { safeLocalStorage } from './safeStorage';

// 1. Initialize Firebase App securely (avoid double initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const provider = new GoogleAuthProvider();
// Add Google Sheets scopes
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

// Flag to track sign-in status
let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize cachedAccessToken from localStorage if present
try {
  cachedAccessToken = safeLocalStorage.getItem('phonetwork_manual_access_token') || safeLocalStorage.getItem('phonetwork_google_access_token');
} catch (e) {
  console.warn('Failed to load access token', e);
}

export const setManualAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      safeLocalStorage.setItem('phonetwork_manual_access_token', token);
    } else {
      safeLocalStorage.removeItem('phonetwork_manual_access_token');
    }
  } catch (e) {
    console.error('Failed to set manual access token', e);
  }
};

// Auth State Callback Management
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // We have a user session, but the access token needs to be refreshed or loaded via sign-in popup.
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      // Keep manual access token valid even if Firebase auth is not signed in
      if (cachedAccessToken) {
        if (onAuthSuccess) {
          // Provide a dummy virtual user or ignore Firebase's state for manual token
          const dummyUser = {
            displayName: 'นักพัฒนา (Manual Token)',
            email: 'oauth-token@manually-pasted.local',
            photoURL: null
          } as unknown as User;
          onAuthSuccess(dummyUser, cachedAccessToken);
        }
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

// Sign-In Function
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('ไม่ได้รับ Access Token จาก Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    try {
      safeLocalStorage.setItem('phonetwork_google_access_token', credential.accessToken);
    } catch (e) {
      console.warn('Failed to save google access token', e);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleSignOut = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  try {
    safeLocalStorage.removeItem('phonetwork_google_access_token');
  } catch (e) {
    console.warn('Failed to remove google access token', e);
  }
};

// ==========================================
// Google Sheets API Helpers
// ==========================================

export interface SheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

// Persist the linked Spreadsheet configuration
export const getLinkedSheetConfig = (): SheetConfig | null => {
  try {
    const data = safeLocalStorage.getItem('phonetwork_linked_sheet');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const saveLinkedSheetConfig = (config: SheetConfig | null) => {
  try {
    if (config) {
      safeLocalStorage.setItem('phonetwork_linked_sheet', JSON.stringify(config));
    } else {
      safeLocalStorage.removeItem('phonetwork_linked_sheet');
    }
  } catch (e) {
    console.error('Failed to save Google Sheet config:', e);
  }
};

/**
 * Extract spreadsheet ID from Google Sheets URL or raw ID
 */
export const extractSpreadsheetId = (urlOrId: string): string => {
  let trimmed = urlOrId.trim();
  if (!trimmed) return '';
  
  // Regex to match "https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit..."
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    trimmed = match[1];
  }

  // Auto-correct template/example URL typo:
  // Match only specific, known variations of the user's spreadsheet ID typos (to prevent false-positives on custom user sheets)
  const lower = trimmed.toLowerCase();
  if (
    trimmed === '1UL93q_PpKGIZocvcD6ShLwbDJP-nU1emB5-hvQOL1' ||
    trimmed === '1UL93q_PpKGIZocvcD6ShLwbDJP-nU1emB5-hvQOLt-A' ||
    trimmed === '1UL93q_PpKGIZocvcD6ShLwbDJP-nU1emB5-hvQOLt' ||
    (trimmed.length >= 40 && trimmed.startsWith('1UL93q_PpKGIZocvcD6ShLwbDJP-nU1emB5-') && (lower.endsWith('h') || lower.includes('hvqo')))
  ) {
    return '1UL93q_PpKGIZocvcD6ShLwbDJP-nU1emB5-hvQOLT_A';
  }

  return trimmed;
};

/**
 * Check if sheet exists and can be accessed
 */
export const fetchSpreadsheetMetadata = async (spreadsheetId: string, token: string): Promise<any> => {
  const response = await fetch('/api/sheets/metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ spreadsheetId, accessToken: token })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `ไม่สามารถเข้าถึง Google Sheet ดึงข้อมูลไม่สำเร็จ (${response.status})`);
  }

  return response.json();
};

/**
 * Initialize / Create Products and Orders sheets if they don't exist
 */
export const initializeSpreadsheetStructure = async (spreadsheetId: string, token: string, defaultProducts: Product[]): Promise<void> => {
  const response = await fetch('/api/sheets/init', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ spreadsheetId, accessToken: token, defaultProducts })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'ไม่สามารถตั้งค่าโครงสร้างชีตได้');
  }
};

/**
 * Automatically create a brand new spreadsheet on user's drive and populate it
 */
export const createNewSpreadsheetOnDrive = async (token: string, defaultProducts: Product[]): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const response = await fetch('/api/sheets/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ accessToken: token, defaultProducts })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'ไม่สามารถสร้างสเปรดชีตใหม่ได้');
  }

  return response.json();
};

/**
 * Pull products list from Products sheet tab
 */
export const pullProductsFromSheet = async (spreadsheetId: string, token: string): Promise<Product[]> => {
  const response = await fetch('/api/sheets/pull-products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ spreadsheetId, accessToken: token })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'ไม่สามารถดึงข้อมูลสินค้าจากช่องตาราง Products ได้');
  }

  const data = await response.json();
  return data.products || [];
};

/**
 * Append transaction details to the Orders sheet tab
 */
export const appendOrderToSheet = async (
  spreadsheetId: string, 
  token: string, 
  tx: Transaction, 
  seller: Member, 
  product: Product, 
  quantity: number
): Promise<void> => {
  const response = await fetch('/api/sheets/append-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ spreadsheetId, accessToken: token, tx, seller, product, quantity })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Failed to append order to Google Sheets via backend:', errorData.error);
  }
};

// ==========================================
// Firestore Shared Storage Helpers
// ==========================================

export const saveLinkedSheetConfigToFirestore = async (config: SheetConfig | null) => {
  try {
    const docRef = doc(db, 'config', 'sheets');
    if (config) {
      await setDoc(docRef, {
        spreadsheetId: config.spreadsheetId,
        spreadsheetUrl: config.spreadsheetUrl,
        updatedAt: new Date().toISOString()
      });
    } else {
      await setDoc(docRef, {
        spreadsheetId: '',
        spreadsheetUrl: '',
        updatedAt: new Date().toISOString()
      });
    }
  } catch (e) {
    console.error('Failed to save sheet config to Firestore:', e);
  }
};

export const getLinkedSheetConfigFromFirestore = async (): Promise<SheetConfig | null> => {
  try {
    const docRef = doc(db, 'config', 'sheets');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.spreadsheetId) {
        return {
          spreadsheetId: data.spreadsheetId,
          spreadsheetUrl: data.spreadsheetUrl || ''
        };
      }
    }
    return null;
  } catch (e) {
    console.error('Failed to fetch sheet config from Firestore:', e);
    return null;
  }
};

export const saveProductsToFirestore = async (productsList: Product[]) => {
  try {
    const docRef = doc(db, 'config', 'products');
    await setDoc(docRef, {
      list: productsList,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error('Failed to save products to Firestore:', e);
  }
};

export const getProductsFromFirestore = async (): Promise<Product[]> => {
  try {
    const docRef = doc(db, 'config', 'products');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.list || [];
    }
    return [];
  } catch (e) {
    console.error('Failed to fetch products from Firestore:', e);
    return [];
  }
};
