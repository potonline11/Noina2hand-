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
  cachedAccessToken = safeLocalStorage.getItem('phonetwork_manual_access_token');
} catch (e) {
  console.warn('Failed to load manual access token', e);
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
    // Persist login state briefly in memory, if refreshed we will trigger popup again when they want to action.
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
  const trimmed = urlOrId.trim();
  if (!trimmed) return '';
  
  // Regex to match "https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit..."
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
};

/**
 * Check if sheet exists and can be accessed
 */
export const fetchSpreadsheetMetadata = async (spreadsheetId: string, token: string): Promise<any> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `ไม่สามารถเข้าถึง Google Sheet ดึงข้อมูลไม่สำเร็จ (${response.status})`);
  }

  return response.json();
};

/**
 * Initialize / Create Products and Orders sheets if they don't exist
 */
export const initializeSpreadsheetStructure = async (spreadsheetId: string, token: string, defaultProducts: Product[]): Promise<void> => {
  // First, verify current sheets in spreadsheet
  const meta = await fetchSpreadsheetMetadata(spreadsheetId, token);
  const sheets = meta.sheets || [];
  const existingTitles = sheets.map((s: any) => s.properties.title);

  const requests: any[] = [];

  // Add "Products" sheet if missing
  if (!existingTitles.includes('Products')) {
    requests.push({
      addSheet: {
        properties: {
          title: 'Products',
          gridProperties: { rowCount: 100, columnCount: 10 }
        }
      }
    });
  }

  // Add "Orders" sheet if missing
  if (!existingTitles.includes('Orders')) {
    requests.push({
      addSheet: {
        properties: {
          title: 'Orders',
          gridProperties: { rowCount: 1000, columnCount: 15 }
        }
      }
    });
  }

  // Execute sheet creation
  if (requests.length > 0) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
    if (!res.ok) {
      throw new Error('ไม่สามารถเพิ่มแท็บแผ่นงาน Products / Orders ใหม่ใน Google Sheet ได้');
    }
  }

  // Populate headers and standard data
  // 1. Products Headers and data
  const productsHeaders = [['ID', 'ชื่อสินค้า (Name)', 'แบรนด์ (Brand)', 'ราคา (Price)', 'คะแนน BV (BV)', 'ไอคอนภาพ (Image)', 'สีการ์ด (Color)']];
  const productsRows = defaultProducts.map(p => [
    p.id,
    p.name,
    p.brand,
    p.price,
    p.bv,
    p.image || '📱',
    p.color || 'from-slate-700 to-slate-900'
  ]);

  const updateValuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const dataUpdates = [
    {
      range: 'Products!A1:G100',
      values: [...productsHeaders, ...productsRows]
    },
    {
      range: 'Orders!A1:J1',
      values: [['Order ID', 'วันเวลา (Timestamp)', 'รหัสลูกค้า (Member ID)', 'ชื่อลูกค้า (Customer Name)', 'สินค้าที่สั่ง (Product)', 'จำนวนที่สั่ง (Quantity)', 'ราคาต่อชิ้น (Price)', 'ราคารวม (Total Price)', 'คะแนน BV รวม (Total BV)', 'ผู้แนะนำ / สปอนเซอร์ (Sponsor)']]
    }
  ];

  const updateRes = await fetch(updateValuesUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: dataUpdates
    })
  });

  if (!updateRes.ok) {
    throw new Error('ไม่สามารถตั้งค่าคอลัมน์มาตรฐานให้กับชีตได้');
  }
};

/**
 * Pull products list from Products sheet tab
 */
export const pullProductsFromSheet = async (spreadsheetId: string, token: string): Promise<Product[]> => {
  const range = 'Products!A2:G200'; // Pull up to 200 products
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('ไม่พบแผ่นงานชื่อ "Products" ใน Google Sheet นี้ กรุณารันปุ่มสร้างตารางมาตรฐานก่อน');
    }
    throw new Error('ไม่สามารถดึงข้อมูลสินค้าจากช่องตาราง Products ได้');
  }

  const data = await response.json();
  const rows = data.values || [];

  const parsedProducts: Product[] = rows.map((row: any, index: number) => {
    const id = row[0] || `p-sheet-${index + 1}`;
    const name = row[1] || 'สินค้าไม่มีชื่อ';
    const brand = row[2] || '';
    const price = Math.max(0, parseInt(row[3]) || 0);
    const bv = Math.max(0, parseInt(row[4]) || Math.round(price * 0.01));
    const image = row[5] || '📦';
    const color = row[6] || 'from-slate-700 to-slate-900';

    return {
      id,
      name,
      brand,
      price,
      bv,
      image,
      color
    };
  });

  return parsedProducts;
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
  const range = 'Orders!A:J';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const totalAmount = product.price * quantity;
  const totalBV = product.bv * quantity;
  const sponsorName = seller.sponsorId || 'ไม่มีผู้แนะนำ';

  const row = [
    tx.id,
    tx.timestamp,
    seller.id,
    seller.name,
    product.name,
    quantity,
    product.price,
    totalAmount,
    totalBV,
    sponsorName
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [row]
    })
  });

  if (!response.ok) {
    console.error('Failed to append order to Google Sheets:', await response.text());
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
