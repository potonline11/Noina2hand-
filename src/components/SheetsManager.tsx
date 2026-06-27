import React, { useState, useEffect } from 'react';
import { 
  Database, 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  Link as LinkIcon, 
  LogOut, 
  ExternalLink,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Smartphone,
  ArrowRight,
  Copy,
  Check,
  Github,
  Key,
  FileCode,
  X,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  googleSignIn, 
  googleSignOut, 
  getAccessToken, 
  getLinkedSheetConfig, 
  saveLinkedSheetConfig, 
  extractSpreadsheetId, 
  fetchSpreadsheetMetadata, 
  initializeSpreadsheetStructure, 
  pullProductsFromSheet,
  initGoogleAuth,
  setManualAccessToken,
  saveLinkedSheetConfigToFirestore,
  getLinkedSheetConfigFromFirestore,
  saveProductsToFirestore,
  getProductsFromFirestore
} from '../lib/googleSheets';
import { INITIAL_PRODUCTS } from '../mockData';
import { Product } from '../types';
import { safeLocalStorage } from '../lib/safeStorage';

interface SheetsManagerProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setTickerMessage: React.Dispatch<React.SetStateAction<string>>;
}

export default function SheetsManager({ products, setProducts, setTickerMessage }: SheetsManagerProps) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [sheetUrlOrId, setSheetUrlOrId] = useState('');
  const [linkedConfig, setLinkedConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    success?: boolean;
    message?: string;
    productsCount?: number;
    sheetTitle?: string;
    hasProductsTab?: boolean;
    hasOrdersTab?: boolean;
  }>({});

  // Help recovery layout state
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [isZipModalOpen, setIsZipModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Apps Script Web App API state
  const [appsScriptUrl, setAppsScriptUrl] = useState(() => {
    return safeLocalStorage.getItem('phonetwork_apps_script_url') || 'https://script.google.com/macros/s/AKfycbxule5YPjMRzd0NTxWrb0xDEJ7ZzqgLPTat_LaMQpX38-KzcF3d3-cQ7zr3MNcwaUtY4A/exec';
  });
  const [isAppsScriptLoading, setIsAppsScriptLoading] = useState(false);
  const [appsScriptError, setAppsScriptError] = useState<string | null>(null);
  const [appsScriptSuccess, setAppsScriptSuccess] = useState<string | null>(null);

  // Detect if running on a custom domain (such as noinashop.business)
  const isCustomDomain = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    !window.location.hostname.endsWith('run.app') && 
    !window.location.hostname.endsWith('firebaseapp.com') && 
    !window.location.hostname.endsWith('web.app');

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch('/api/download-zip', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`ดาวน์โหลดไม่สำเร็จ (สถานะ: ${response.status})`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('ติดสิทธิ์การเข้าถึง (Authentication Required). เนื่องจากหน้าเว็บนี้ทำงานใน iframe ของ Google AI Studio, การดาวน์โหลดโดยตรงบางครั้งอาจถูกบล็อกสิทธิ์\n\nวิธีแก้ไข: กรุณาคลิกปุ่ม "เปิดในแท็บใหม่" (Open in new tab) ที่ปุ่มวงกลมมีลูกศรด้านขวาบนของหน้าจอแอปพลิเคชันพรีวิว เพื่อเปิดแอปเป็นหน้าจอเต็ม จากนั้นเข้าเมนู Google Sheets และกดดาวน์โหลด .ZIP อีกครั้ง จะสามารถดาวน์โหลดได้ปกติ 100% ครับ!');
      }

      const blob = await response.blob();
      
      if (blob.size < 20000) {
        const text = await blob.text();
        if (text.includes('302 Found') || text.includes('<html>')) {
          throw new Error('ติดสิทธิ์การเข้าถึง (Authentication Required). กรุณาคลิกเปิดหน้าจอแอปพลิเคชันเป็นแท็บใหม่ (Open in new tab) ที่ปุ่มไอคอนสี่เหลี่ยมลูกศรชี้ออกด้านบนพรีวิวแอป เพื่อเข้าสู่ระบบในแท็บใหม่โดยตรง แล้วกดดาวน์โหลดอีกครั้งครับ');
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'phonetwork-source.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Download error:', error);
      setDownloadError(error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ในการดาวน์โหลดไฟล์ ZIP');
    } finally {
      setIsDownloading(false);
    }
  };
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [copiedProductsHeader, setCopiedProductsHeader] = useState(false);
  const [copiedOrdersHeader, setCopiedOrdersHeader] = useState(false);

  useEffect(() => {
    // Helper to sanitize/auto-correct config on load
    const sanitizeConfig = (cfg: any) => {
      if (!cfg) return null;
      const originalId = cfg.spreadsheetId || '';
      const correctedId = extractSpreadsheetId(cfg.spreadsheetUrl || originalId);
      const hasWrongUrl = cfg.spreadsheetUrl && extractSpreadsheetId(cfg.spreadsheetUrl) !== correctedId;

      if (correctedId !== originalId || hasWrongUrl) {
        return {
          spreadsheetId: correctedId,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${correctedId}/edit`
        };
      }
      return cfg;
    };

    // 1. Check existing Linked sheet config
    const config = getLinkedSheetConfig();
    if (config) {
      const sanitized = sanitizeConfig(config);
      if (sanitized && (sanitized.spreadsheetId !== config.spreadsheetId || sanitized.spreadsheetUrl !== config.spreadsheetUrl)) {
        saveLinkedSheetConfig(sanitized);
        saveLinkedSheetConfigToFirestore(sanitized);
      }
      setLinkedConfig(sanitized);
      setSheetUrlOrId(sanitized ? sanitized.spreadsheetUrl : '');
    } else {
      getLinkedSheetConfigFromFirestore().then((remoteConfig) => {
        if (remoteConfig) {
          const sanitized = sanitizeConfig(remoteConfig);
          saveLinkedSheetConfig(sanitized);
          if (sanitized && (sanitized.spreadsheetId !== remoteConfig.spreadsheetId || sanitized.spreadsheetUrl !== remoteConfig.spreadsheetUrl)) {
            saveLinkedSheetConfigToFirestore(sanitized);
          }
          setLinkedConfig(sanitized);
          setSheetUrlOrId(sanitized ? sanitized.spreadsheetUrl : '');
        }
      });
    }

    // 2. Init Auth listener
    const unsubscribe = initGoogleAuth(
      (currentUser, cachedToken) => {
        setUser(currentUser);
        setToken(cachedToken);
      },
      () => {
        try {
          const manualToken = safeLocalStorage.getItem('phonetwork_manual_access_token');
          if (manualToken) {
            setToken(manualToken);
            setUser({
              displayName: 'นักพัฒนา (Manual Token)',
              email: 'oauth-token@manually-pasted.local',
              photoURL: null
            });
            return;
          }
        } catch {}
        setUser(null);
        setToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) return;
    const cleanToken = manualTokenInput.trim();
    try {
      setManualAccessToken(cleanToken);
      setToken(cleanToken);
      setUser({
        displayName: 'นักพัฒนา (Manual Token)',
        email: 'oauth-token@manually-pasted.local',
        photoURL: null
      });
      setTickerMessage('🔑 เชื่อมต่อด้วยเซสชันคีย์แบบกำหนดเองแล้ว!');
      setSyncStatus({
        success: true,
        message: 'เชื่อมโยง Access Token ด้วยตนเองสำเร็จ!'
      });
      
      const id = extractSpreadsheetId(sheetUrlOrId);
      if (id) {
        await handleVerifyAndSync(id, cleanToken);
      }
    } catch (err: any) {
      setSyncStatus({
        success: false,
        message: 'กรอกคีย์ขัดข้อง: ' + (err.message || String(err))
      });
    }
  };

  // Sync / test spreadsheet after auth or linking
  const handleVerifyAndSync = async (spreadsheetId: string, currentToken: string) => {
    setIsLoading(true);
    setSyncStatus({ message: '⏳ กำลังเข้าตรวจค้นสารสนเทศสเปรดชีตและวิเคราะห์แท็บงาน...' });
    
    try {
      const meta = await fetchSpreadsheetMetadata(spreadsheetId, currentToken);
      const sheetTitle = meta.properties.title;
      const sheets = meta.sheets || [];
      const titles = sheets.map((s: any) => s.properties.title);
      
      const hasProductsTab = titles.includes('Products');
      const hasOrdersTab = titles.includes('Orders');

      let productsPulled: Product[] = [];
      let successMessage = `เชื่อมโยงสเปรดชีต "${sheetTitle}" สำเร็จ`;
      let hasPullError = false;
      let pullErrorMessage = '';
      
      if (hasProductsTab) {
        try {
          productsPulled = await pullProductsFromSheet(spreadsheetId, currentToken);
          if (productsPulled.length > 0) {
            setProducts(productsPulled);
            // Save to safeLocalStorage and Firestore
            safeLocalStorage.setItem('phonetwork_products', JSON.stringify(productsPulled));
            await saveProductsToFirestore(productsPulled);
            successMessage += ` และดึงรายการสินค้า ${productsPulled.length} รายการสำเร็จเรียบร้อย!`;
          } else {
            successMessage += ` (⚠️ สเปรดชีตเชื่อมต่อได้สำเร็จ แต่พบข้อมูลว่างเปล่าหรือไม่มีรายการสินค้าในแท็บ "Products")`;
          }
        } catch (pullError: any) {
          console.warn('Silent product pull error:', pullError);
          hasPullError = true;
          pullErrorMessage = pullError.message || String(pullError);
          successMessage += ` (❌ แต่ดึงสินค้าไม่สำเร็จ: ${pullErrorMessage})`;
        }
      }

      setSyncStatus({
        success: !hasPullError,
        message: successMessage,
        sheetTitle,
        productsCount: productsPulled.length,
        hasProductsTab,
        hasOrdersTab
      });

      setTickerMessage(`🟢 ซิงค์ Google Sheets "${sheetTitle}" สำเร็จเรียบร้อย!`);
    } catch (err: any) {
      console.error('Verify and Sync Error:', err);
      let errMsg = err.message || 'เกิดข้อผิดพลาดในการเชื่อมบัญชีท่อส่งข้อมูลสเปรดชีต';
      
      if (errMsg.includes('404')) {
        const loggedInEmail = user?.email || 'pnmall4u@gmail.com';
        errMsg = `ไม่สามารถเข้าถึง Google Sheet ดึงข้อมูลไม่สำเร็จ (404 Not Found)\n\n` +
                 `💡 สาเหตุหลัก:\n` +
                 `บัญชี Google ที่ท่านเชื่อมโยงอยู่ขณะนี้ (${loggedInEmail}) ไม่มีสิทธิ์เข้าถึงหรือแก้ไขสเปรดชีตนี้\n\n` +
                 `🛠️ วิธีแก้ไขง่ายๆ:\n` +
                 `1. เปิดหน้า Google Sheets ของท่าน (สเปรดชีตที่คุณระบุ)\n` +
                 `2. คลิกปุ่ม "แชร์" (Share) ที่มุมขวาบนของแผ่นงาน Google Sheets\n` +
                 `3. เพิ่มอีเมล "${loggedInEmail}" ให้เป็น "ผู้แก้ไข" (Editor)\n` +
                 `4. หรือในช่อง "การเข้าถึงทั่วไป" (General access) เปลี่ยนจาก "จำกัด" (Restricted) ให้เป็น "ทุกคนที่มีลิงก์" (Anyone with the link) และปรับสิทธิ์ด้านขวาเป็น "ผู้แก้ไข" (Editor)\n\n` +
                 `จากนั้นกลับมากดปุ่ม "ซิงค์ซ้ำ/ดึงข้อมูลชีต" อีกครั้งเพื่อดึงข้อมูลได้ทันทีครับ!`;
      }
      
      setSyncStatus({
        success: false,
        message: errMsg
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setTickerMessage('✅ เชื่อมต่อบัญชี Google ของคุณสำเร็จแล้ว');
        
        // If there was already a spreadsheet ID linked, verify and sync immediately
        const id = extractSpreadsheetId(sheetUrlOrId);
        if (id) {
          await handleVerifyAndSync(id, result.accessToken);
        }
      }
    } catch (err: any) {
      console.error('Google Sign-In caught error:', err);
      let errMsg = 'การยืนยันตัวตน Google ไม่ตอบสนองหรือถูกยกเลิก';
      if (isCustomDomain) {
        errMsg = `❌ การยืนยันตัวตน Google ไม่ตอบสนอง เนื่องจากท่านใช้งานระบบหลังบ้านผ่านโดเมนส่วนตัว (${window.location.hostname}) ซึ่งไม่ได้รับการอนุญาตโดเมน (Authorized Domains) ใน Firebase Auth ของโปรเจกต์ AI Studio\n\n` +
                 `💡 วิธีแก้ไขง่ายๆ 2 ช่องทางเพื่อทำการดึง/ซิงค์ชีต:\n` +
                 `ช่องทางที่ 1 (แนะนำ - อัปเดตทุกหน้าอัตโนมัติ): ให้ท่านเปิดแอปพลิเคชันผ่านลิงก์พรีวิวพัฒนา (.run.app) จากนั้นล็อกอินและกดดึงชีตที่ลิงก์พัฒนา ข้อมูลสินค้าทั้งหมดจะซิงค์เซฟลง Cloud Firestore ตัวเดียวกัน ทำให้ข้อมูลบนโดเมน ${window.location.hostname} ของท่านได้รับการอัปเดตตรงกันทันที!\n\n` +
                 `ช่องทางที่ 2 (บายพาส): ล็อกอินบนลิงก์พรีวิว (.run.app) -> คัดลอกรหัส Access Token ที่ปรากฏ -> นำรหัสดังกล่าวมาป้อนใส่ช่อง "ทางเลือกที่ 2. เชื่อมโทเค็นสิทธิ์แบบใส่เองคีย์" ด้านบนของหน้านี้เพื่อทำงานต่อได้ทันทีครับ`;
      }
      setSyncStatus({
        success: false,
        message: errMsg
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await googleSignOut();
    setManualAccessToken(null);
    setUser(null);
    setToken(null);
    setSyncStatus({});
    setTickerMessage('🔒 ออกจากระบบท่อส่ง Google Sheets แล้ว');
  };

  const handleLinkSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrlOrId.trim()) return;

    if (!token) {
      setSyncStatus({
        success: false,
        message: 'กรุณาทำการเข้าสู่ระบบ Google Account ด้านซ้ายก่อนทำการคลิกรวบรวมเชื่อมโยงสเปรดชีต'
      });
      return;
    }

    const id = extractSpreadsheetId(sheetUrlOrId);
    if (!id) {
      setSyncStatus({
        success: false,
        message: 'คุณป้อน ID สเปรดชีตไม่เข้าลักษณะตามฟอร์ม'
      });
      return;
    }

    // Save configuration
    const config = {
      spreadsheetId: id,
      spreadsheetUrl: sheetUrlOrId.trim().startsWith('http') ? sheetUrlOrId.trim() : `https://docs.google.com/spreadsheets/d/${id}/edit`
    };
    saveLinkedSheetConfig(config);
    await saveLinkedSheetConfigToFirestore(config);
    setLinkedConfig(config);

    // Verify and pulls data
    await handleVerifyAndSync(id, token);
  };

  const handleInitializeStructure = async () => {
    if (!token || !linkedConfig) return;
    setIsLoading(true);
    setSyncStatus({ message: '⏳ กำลังสร้างแท็บสินค้าProducts และ ตารางยอดซื้อOrders ลงชีตโดยอัตโนมัติ...' });
    
    try {
      await initializeSpreadsheetStructure(linkedConfig.spreadsheetId, token, INITIAL_PRODUCTS);
      setTickerMessage('🆕 สร้างตารางโครงสร้าง Products & Orders ลง Google Sheet สำเร็จแล้ว!');
      // Re-evaluate
      await handleVerifyAndSync(linkedConfig.spreadsheetId, token);
    } catch (err: any) {
      setSyncStatus({
        success: false,
        message: err.message || 'โครงสร้างการเขียนขัดข้อง ประเมินความปลอดภัยจาก Google Sheets API'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshProducts = async () => {
    if (!token || !linkedConfig) return;
    setIsLoading(true);
    try {
      const pulled = await pullProductsFromSheet(linkedConfig.spreadsheetId, token);
      if (pulled && pulled.length > 0) {
        setProducts(pulled);
        safeLocalStorage.setItem('phonetwork_products', JSON.stringify(pulled));
        await saveProductsToFirestore(pulled);
        setSyncStatus(prev => ({
          ...prev,
          success: true,
          message: `🔄 ดึงรายการสินค้าเรียบร้อย! ${pulled.length} รายการปัจจุบัน`,
          productsCount: pulled.length
        }));
        setTickerMessage('🎯 อัปเดตคลังระดับราคาสินค้าจาก Google Sheet เรียบร้อย!');
      } else {
        setSyncStatus(prev => ({
          ...prev,
          success: false,
          message: '⚠️ ดึงสินค้าเสร็จสิ้น แต่มิอาจพบแถวข้อมูลใด ๆ ในแท็บ Products'
        }));
      }
    } catch (err: any) {
      setSyncStatus(prev => ({
        ...prev,
        success: false,
        message: 'ผิดพลาดการ Refresh: ' + (err.message || String(err))
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToMockfile = () => {
    safeLocalStorage.removeItem('phonetwork_products');
    setProducts([]);
    setSyncStatus(prev => ({
      ...prev,
      message: '🧹 ล้างแคชรายการสินค้าเรียบร้อยแล้ว'
    }));
    setTickerMessage('🧹 ล้างแคชรายการสินค้าและปิดฐานข้อมูลจำลองเรียบร้อย!');
  };

  const handleFetchFromAppsScript = async (customUrl?: string) => {
    const targetUrl = (customUrl || appsScriptUrl).trim();
    if (!targetUrl) {
      setAppsScriptError('กรุณากรอกลิงก์ Google Apps Script API');
      return;
    }

    setIsAppsScriptLoading(true);
    setAppsScriptError(null);
    setAppsScriptSuccess(null);

    try {
      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`ไม่สามารถดึงข้อมูลได้ (สถานะตอบกลับ: ${response.status})`);
      }
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('รูปแบบข้อมูล JSON ที่ได้รับไม่ถูกต้อง (ระบบต้องการรูปแบบอาเรย์ของข้อมูลสินค้า)');
      }

      const mappedProducts = data.map((item: any) => {
        const getBrandStyling = (brandName: string) => {
          const b = (brandName || '').toLowerCase();
          if (b.includes('apple') || b.includes('iphone')) {
            return { color: 'from-slate-800 to-slate-950', image: '📱' };
          }
          if (b.includes('samsung')) {
            return { color: 'from-blue-900 to-indigo-950', image: '🤖' };
          }
          if (b.includes('oppo') || b.includes('vivo')) {
            return { color: 'from-teal-800 to-emerald-950', image: '📸' };
          }
          if (b.includes('xiaomi') || b.includes('redmi')) {
            return { color: 'from-orange-800 to-red-950', image: '🔥' };
          }
          return { color: 'from-slate-900 to-indigo-950', image: '📦' };
        };

        const styling = getBrandStyling(item.brand);

        return {
          id: item.id ? String(item.id) : Math.random().toString(36).substring(2, 9),
          name: item.name || 'สินค้าไร้ชื่อ',
          brand: item.brand || 'Other',
          price: Number(item.price) || 0,
          bv: Number(item.bv) || 0,
          image: styling.image,
          color: styling.color,
          image_url: item.image_url || item.imageUrl || ''
        };
      });

      if (mappedProducts.length > 0) {
        setProducts(mappedProducts);
        safeLocalStorage.setItem('phonetwork_products', JSON.stringify(mappedProducts));
        safeLocalStorage.setItem('phonetwork_apps_script_url', targetUrl);
        await saveProductsToFirestore(mappedProducts);

        setAppsScriptSuccess(`ดึงข้อมูลสำเร็จ! ซิงค์สินค้าเข้าฐานข้อมูลจำนวน ${mappedProducts.length} รุ่นเรียบร้อยแล้ว และหน้าเว็บอัปเดตอัตโนมัติทันทีครับ`);
        setTickerMessage(`🎯 อัปเดตข้อมูลระดับผลิตภัณฑ์ผ่าน Google Apps Script Web App API เรียบร้อย! (${mappedProducts.length} รายการ)`);
      } else {
        throw new Error('ไม่พบสินค้าที่สมบูรณ์ในอาเรย์ข้อมูลที่ดึงมา');
      }

    } catch (err: any) {
      console.error('Error fetching from Apps Script Web App API:', err);
      setAppsScriptError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมโยงกับ API กรุณาตรวจความถูกต้องของ URL และอนุญาตสิทธิ์เป็น Everyone');
    } finally {
      setIsAppsScriptLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Box */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl animate-fade-in">
        <div className="flex items-center gap-3 text-left">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-101 tracking-tight">ระบบสนับสนุนการทำงาน Google Sheets (Sheets Core Support)</h2>
            <p className="text-slate-400 text-sm">ดาวน์โหลดซอร์สโค้ดเพื่อเปิดหน้าล็อกอิน Google Sheets บนระบบความปลอดภัย หรือใส่โทเค็นสิทธิ์เชื่อมโดยตรง</p>
          </div>
        </div>
        <div className="bg-indigo-500/10 px-3.5 py-1.5 rounded-full border border-indigo-500/20 text-indigo-400 text-xs font-bold font-mono">
          ● REAL-TIME EXTENSION ENGAGEMENT ACTIVE
        </div>
      </div>

      {/* 2. Developer Export Utilities Section (Grid of 2 options) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {/* Method 1 Code Export Card */}
        <div className="relative group bg-slate-950/70 border border-indigo-500/10 hover:border-indigo-500/30 p-6 rounded-2xl space-y-4 transition duration-200">
          <div className="flex justify-between items-start">
            <span className="p-1 px-2.5 bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 text-[9px] uppercase font-mono font-black rounded-md">วิธีที่ 1 สำหรับผู้พัฒนา</span>
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileCode className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
              <span>ดาวน์โหลดซอร์สโค้ดดิ้ง (.ZIP)</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              บีบอัดไฟล์ React + Vite + Tailwind CSS ข้อมูลระบบทั้งหมดเพื่อนำไปรันบน VS Code / เครื่องของคุณ และเชื่อมต่อสำเร็จอย่างปลอดภัยได้ทันที
            </p>
          </div>
          <button
            onClick={() => setIsZipModalOpen(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 duration-150 cursor-pointer animate-fade-in"
          >
            <span>สร้างและดาวน์โหลด Source .ZIP (ด่วน)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Method 2 Repo cloning */}
        <div className="relative group bg-slate-950/70 border border-emerald-500/10 hover:border-emerald-500/30 p-6 rounded-2xl space-y-4 transition duration-200">
          <div className="flex justify-between items-start">
            <span className="p-1 px-2.5 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[9px] uppercase font-mono font-black rounded-md">วิธีที่ 2 สำหรับสายอัปขึ้นเว็บ</span>
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Github className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
              <span>สร้างคลังเก็บโค้ดลง GitHub ของตนเอง</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              คุณสามารถนำไฟล์การพัฒนาของแอปนี้ไปทริกเกอร์ Import Repository ด้วยฟังก์ชัน GitHub เพื่อส่งขึ้นระบบคลาวด์และใช้งานผ่าน Vercel / Netlify
            </p>
          </div>
          <button
            onClick={() => setIsGithubModalOpen(true)}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 duration-150 cursor-pointer"
          >
            <span>เปิดหน้าสร้างคลังใหม่บน GitHub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Google Apps Script Web App API Section */}
      <div className="bg-slate-950 border border-indigo-500/20 p-6 rounded-3xl text-left space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/15 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Cpu className="w-5 h-5 animate-pulse text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-101 uppercase tracking-widest flex items-center gap-1.5 flex-wrap">
                <span>ดึงข้อมูลสินค้าผ่าน Google Apps Script Web App API</span>
                <span className="p-0.5 px-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-mono rounded-md font-bold uppercase tracking-wider">ด่วน / ไม่ใช้สิทธิ์ซับซ้อน</span>
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">เชื่อมโยง API ของคุณเพื่อดาวน์โหลดผลิตภัณฑ์เข้ามาแสดงผลบน UI การ์ดสินค้า และกระจายข้อมูลแบบเรียลไทม์ทันที</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-850/80 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="ป้อน URL ของ Google Apps Script Web App API (https://script.google.com/macros/s/.../exec)"
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-full bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 text-[11px] text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <button
              onClick={() => handleFetchFromAppsScript()}
              disabled={isAppsScriptLoading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs transition duration-150 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {isAppsScriptLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังดึงข้อมูล...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                  <span>ดึงข้อมูลสินค้า & อัปเดตทันที</span>
                </>
              )}
            </button>
          </div>

          {appsScriptError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-xs flex items-start gap-2 animate-fade-in font-sans">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{appsScriptError}</span>
            </div>
          )}

          {appsScriptSuccess && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl text-xs flex items-start gap-2 animate-fade-in font-sans">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{appsScriptSuccess}</span>
            </div>
          )}

          {/* Tips for User */}
          <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
            <p className="font-extrabold text-indigo-400 flex items-center gap-1">💡 คำแนะนำสำหรับการเชื่อมต่อ Apps Script API:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 mt-1 leading-relaxed">
              <li>เปิดสิทธิ์สเปรดชีตของคุณ และสร้างสคริปต์ Web App (<code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded font-mono">doGet</code>) ส่งกลับข้อมูลในรูปแบบ <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded font-mono">[{`{ id, brand, name, price, bv, image_url }`}]</code></li>
              <li>ตอนสั่ง Deployment ในหน้าต่าง Apps Script ต้องตั้งค่า <strong className="text-slate-300">"Execute as: Me"</strong> และ <strong className="text-slate-300">"Who has access: Anyone"</strong> เพื่อให้ระบบหน้าเว็บสามารถดึงข้อมูลข้ามโดเมนได้เสรีครับ</li>
              <li>ข้อมูลสินค้าทั้งหมดจะถูกซิงก์เก็บเข้าสู่ Firebase และคลัง Local Storage เมื่อผู้ใช้งานคนใดเปิดแอปนี้ ข้อมูลสินค้าของคุณจะแสดงผลอัตโนมัติแบบเรียลไทม์!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Important Recovery Advice (Popups block solutions) */}
      <div className="bg-slate-950 border border-red-500/20 p-6 rounded-3xl text-left space-y-5">
        <div className="space-y-1.5">
          <h3 className="text-sm font-extrabold text-red-400 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>คำแนะนำที่สำคัญ: เหตุใดหน้าจอ "ไม่ตอบสนอง" หรือหน้าต่าง Popup ล็อกอินหาย?</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            เนื่องจากในสภาพแวดล้อมโปรแกรมจำลอง <b>AI Studio (iFrame Sandbox)</b> ระบบบราวเซอร์จะทำการบล็อกโฮสต์หน้าต่างป๊อปอัพเพื่อเหตุผลความปลอดภัยสูงสุด ทำให้แอปไม่สามารถแสดงล็อกอินของบัญชี Google ได้โดยสะดวก หากพบอาการดังกล่าว นี่คือ <b>2 ทางเลือกในการแก้ไขปัญหาอย่างง่ายได้ผล 100%:</b>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Box 1: Open in a new tab */}
          <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-900 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>ทางเลือกที่ 1. เปิดแอปนี้ในแท็บใหม่ของบราวเซอร์ (แนะนำ!)</span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                เพียงคลิกปุ่มด้านล่างเพื่อเข้าทำรายการบนเว็บแยกส่วนอิสระจาก iFrame ส่งผลให้หน้าต่าง Google Account ป๊อปอัพเด้งเข้าสู่ระบบความปลอดภัยได้อย่างคล่องตัว ล็อกอินเสร็จได้ทันที
              </p>
            </div>
            
            <a 
              href={window.location.href} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 duration-150 cursor-pointer text-center font-bold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดระบบในแท็บใหม่แยกอิสระ</span>
            </a>
          </div>

          {/* Box 2: Manual Access Token Input */}
          <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-900 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs font-black text-indigo-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>ทางเลือกที่ 2. เชื่อมโทเค็นสิทธิ์แบบใส่เองคีย์ (สำหรับนักพัฒนา)</span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                หากพบว่าหน้าล็อกอิน Google Account ค้างหรือไม่ขยับ สามารถก๊อปปี้รหัสโทเค็นสิทธิ์ (Gmail OAuth Access Token) ป้อนเข้าระบบหลักด้านล่าง เพื่อยืนยันเชื่อมต่อแบบบายพาสได้ทันที
              </p>
            </div>

            <form onSubmit={handleManualTokenSubmit} className="space-y-2.5">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  required
                  placeholder="ป้อนรหัส OAuth Access Token..."
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="bg-slate-950 flex-1 px-3 py-2 rounded-xl border border-slate-800 text-[11px] text-slate-101 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-slate-950 text-[11px] font-black px-4 py-2 rounded-xl transition active:scale-95 duration-150 cursor-pointer font-bold"
                >
                  กรอกอนุญาตสิทธิ์
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 4. Active Connection Hub with google accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        {/* Left column: Login State and User information */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-900 p-6 rounded-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 text-[10px] uppercase font-mono font-black rounded-md">การรักษาความปลอดภัย (Auth)</span>
              <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-widest">สถานะบัญชีการล็อกอิน</h3>
            </div>

            {user ? (
              <div className="bg-slate-905 p-5 rounded-2xl border border-slate-850 space-y-4 text-left">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full border-2 border-indigo-500 overflow-hidden bg-indigo-950 flex items-center justify-center font-black text-white">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Google Profile" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      user.email?.charAt(0).toUpperCase() || 'G'
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-101">{user.displayName || 'บัญชีประสานความปลอดภัย'}</h4>
                    <p className="text-[10px] text-indigo-400 font-mono">{user.email || 'manual-auth@sheets.api'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono font-black text-[9px] bg-emerald-500/5 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/10">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>สิทธิ์การเชื่อมต่อ API ของท่านได้รับการอนุญาตแล้ว</span>
                </div>

                {token && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400">🔑 รหัส Token สิทธิ์รับเข้าใช้ (คัดลอกส่วนตัวเพื่อเก็บสำรอง):</p>
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        readOnly 
                        value={token} 
                        onFocus={(e) => e.target.select()}
                        className="bg-slate-900 border border-slate-800 text-[9px] text-slate-300 font-mono px-3 py-1.5 rounded-lg flex-1 focus:outline-none" 
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(token);
                          setTickerMessage('📋 คัดลอกรหัส Access Token สำหรับ Bypass ใส่ Iframe แล้ว!');
                        }}
                        className="bg-indigo-500 hover:bg-indigo-400 text-slate-950 px-2.5 py-1 rounded-lg text-[10px] font-black transition active:scale-95 cursor-pointer"
                      >
                        คัดลอกคีย์
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-950 p-5 rounded-2xl border border-dashed border-slate-800 text-center py-6 space-y-4">
                {isCustomDomain && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-left text-amber-200 space-y-2">
                    <div className="flex items-center gap-1.5 font-extrabold text-amber-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>ตรวจพบโดเมนส่วนตัว: {window.location.hostname}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-300/90 font-sans">
                      เนื่องจากแอปทำงานบนโดเมนส่วนตัว ความปลอดภัยของ Firebase/Google จะปฏิเสธการล็อกอินด้วยปุ่มปกติ (unauthorized-domain) เสมอ
                    </p>
                    <div className="pt-2 space-y-1.5 border-t border-amber-500/10 text-[10.5px]">
                      <p className="font-bold text-amber-400">💡 วิธีแก้ไขแนะนำ:</p>
                      <ul className="list-decimal pl-4 space-y-1 text-slate-300 font-sans">
                        <li>ไปที่หน้าพัฒนาของ AI Studio (ลงท้ายด้วย <span className="font-mono text-amber-300">.run.app</span>)</li>
                        <li>ล็อกอินและซิงค์ชีตที่นั่น ข้อมูลจะเซฟลงคลาวด์ Firestore เดียวกันโดยอัตโนมัติ!</li>
                        <li>หรือคัดลอกรหัส <span className="font-bold text-indigo-400">Access Token</span> จากหน้าต่างนั้นมาใส่กล่อง Bypass ด้านบนได้ทันที</li>
                      </ul>
                    </div>
                  </div>
                )}
                <p className="text-xs text-slate-500 font-medium mb-1">กรุณาล็อกอิน Google Account หรือใช้ปุ่มบายพาสด้านบน</p>
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="mx-auto flex items-center gap-3 px-5 py-3 bg-white hover:bg-slate-150 text-slate-900 rounded-2xl font-black text-xs shadow-md active:scale-95 transition cursor-pointer border border-slate-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>Sign in with Google Account</span>
                </button>
              </div>
            )}
          </div>

          {user && (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2 border border-slate-900 hover:border-slate-800 rounded-xl text-xs text-slate-550 hover:text-red-400 font-bold transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>ตัดสัญญาณการเชื่อมโยงออก (Disconnect Account)</span>
            </button>
          )}
        </div>

        {/* Right column: Google Sheet Config parameters */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-900 p-6 rounded-2xl space-y-6">
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-mono font-black rounded-md">การเลือกเอกสาร (Linked Sheet)</span>
              <h3 className="text-sm font-extrabold text-slate-101 uppercase tracking-widest">การผูกระบุตารางปลายทาง</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              ระบุ URL สเปรดชีต ของท่านที่ต้องการใช้ทำงานเพื่อให้ระบบเชื่อมโยงและซิงค์คัดกรองข้อมูลโครงสร้างได้ถูกต้อง
            </p>

            <form onSubmit={handleLinkSheet} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-550">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="แปะ URL Google Sheets ของท่านที่เข้าสิทธิ์แก้ไขได้..."
                    value={sheetUrlOrId}
                    onChange={(e) => setSheetUrlOrId(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-slate-900 pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 text-slate-101 text-xs font-medium focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 inline-flex align-middle cursor-pointer font-bold"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{linkedConfig ? 'ซิงค์ซ้ำ' : 'ยืนยันผูกสเปรดชีต'}</span>
                </button>
              </div>
            </form>

            <div className="bg-slate-900/30 p-3.5 rounded-2xl border border-slate-900/60 text-[11px] text-slate-500 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-1 font-bold text-slate-400">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>คู่มือการสตรีมตารางอย่างง่ายได้ผล:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1">
                <li>เปิดชีตขึ้นมาใหม่ผ่าน <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-0.5 font-bold">Google Sheets</a> เพื่อใช้เก็บฐานข้อมูล</li>
                <li>ตั้งชื่อชีตและคัดลอกเบราว์เซอร์ URL มาผูกเพื่อเชื่อมต่อ</li>
              </ul>
            </div>

            {syncStatus.message && (
              <div className={`p-4 rounded-xl border text-xs text-left ${
                syncStatus.success === true 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : syncStatus.success === false
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}>
                <div className="flex items-start gap-2">
                  <span className="text-sm">
                    {syncStatus.success === true ? '✅' : syncStatus.success === false ? '❌' : '⏳'}
                  </span>
                  <div className="flex-1 space-y-2">
                    <p className="font-semibold">{syncStatus.message}</p>
                    
                    <div className="flex flex-wrap gap-2 pt-1">
                      {!syncStatus.hasProductsTab && syncStatus.success && (
                        <button
                          onClick={handleInitializeStructure}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-lg bg-indigo-500 text-slate-950 hover:bg-indigo-400 font-bold text-[10px] flex items-center gap-1 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>สร้างตารางแม่แบบอัตโนมัติ</span>
                        </button>
                      )}

                      {syncStatus.hasProductsTab && (
                        <button
                          onClick={handleRefreshProducts}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 font-bold text-[10px] flex items-center gap-1 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>ดึงสินค้าราคาจากชีตล่าสุด</span>
                        </button>
                      )}

                      <button
                        onClick={handleResetToMockfile}
                        className="px-3 py-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 font-bold text-[10px] border border-rose-900/30 transition active:scale-95 cursor-pointer"
                      >
                        ล้างข้อมูลสินค้า (ลบแคช)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Google Sheets Data Column Templates (Visual Row-1 columns layout) */}
      <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 text-left space-y-6">
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-slate-101 uppercase tracking-widest flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <span>แม่แบบคอลัมน์ตาราง Google Sheets โครงสร้างสเปรดชีตสำหรับการผูก</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            ตารางของคุณต้องระบุหัวคอลัมน์ในแถวที่ 1 (Row 1) ด้วยรหัสคำศัพท์เหล่านี้ให้ครบถ้วน เพื่อให้โปรแกรมสตรีมดึงและเขียนบันทึกสินค้าข้อมูลสายงานได้อย่างไร้กังวล
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Products Schema Table Template */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center bg-slate-950/80 p-2.5 px-4 rounded-xl">
              <div>
                <h4 className="text-xs font-black text-indigo-400">1. แผ่นงานแท็บ "Products" (ข้อมูลสินค้าและคะแนน)</h4>
                <p className="text-[10px] text-slate-500">สำหรับจัดสรรรายการสินค้าหลัก, ราคาจัดจำหน่าย, และคะแนน BV</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('ID\tชื่อสินค้า (Name)\tแบรนด์ (Brand)\tราคา (Price)\tคะแนน BV (BV)\tไอคอนภาพ (Image)');
                  setCopiedProductsHeader(true);
                  setTimeout(() => setCopiedProductsHeader(false), 2005);
                }}
                className={`text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all duration-150 cursor-pointer ${
                  copiedProductsHeader 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20'
                }`}
              >
                {copiedProductsHeader ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copy สำเร็จ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>คัดลอกแถวหัวข้อโค้ด</span>
                  </>
                )}
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-900">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-950/65 font-mono text-[10px] text-slate-450 border-b border-slate-900">
                    <th className="p-2 px-3 border-r border-slate-900/80 text-left w-14">คอลัมน์</th>
                    <th className="p-2 px-3 border-r border-slate-900/80 text-left">คำศัพท์หัวข้อหลัก (Row 1)</th>
                    <th className="p-2 px-3 text-left">ลักษณะประเภทรายละเอียดข้อมูล</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300 divide-y divide-slate-900">
                  <tr>
                    <td className="p-2 px-3 font-mono font-bold text-center border-r border-slate-900 bg-slate-950/20">A</td>
                    <td className="p-2 px-3 border-r border-slate-900 font-bold font-mono text-emerald-400">ID</td>
                    <td className="p-2 px-3 text-slate-400">รหัสข้อมูลสินค้าแบบห้ามซ้ำ เช่น <code className="bg-slate-950 text-slate-300 px-1 rounded">p1</code></td>
                  </tr>
                  <tr>
                    <td className="p-2 px-3 font-mono font-bold text-center border-r border-slate-900 bg-slate-950/20">B</td>
                    <td className="p-2 px-3 border-r border-slate-900 font-bold font-mono text-emerald-400">ชื่อสินค้า (Name)</td>
                    <td className="p-2 px-3 text-slate-400">ชื่อโปรโมตโทรศัพท์หรือโปรเจ็กต์สะสมคะแนนสายงาน</td>
                  </tr>
                  <tr>
                    <td className="p-2 px-3 font-mono font-bold text-center border-r border-slate-900 bg-slate-950/20">C</td>
                    <td className="p-2 px-3 border-r border-slate-900 font-bold font-mono text-emerald-400">แบรนด์ (Brand)</td>
                    <td className="p-2 px-3 text-slate-400">ผู้ผลิตสินค้าหลัก เช่น Apple, Samsung, Oppo</td>
                  </tr>
                  <tr>
                    <td className="p-2 px-3 font-mono font-bold text-center border-r border-slate-900 bg-slate-950/20">D</td>
                    <td className="p-2 px-3 border-r border-slate-900 font-bold font-mono text-emerald-400">ราคา (Price)</td>
                    <td className="p-2 px-3 text-slate-400">จำนวนมูลค่าราคาสินค้าเป็นตัวเลขตัวเลขเปล่าๆ เช่น 48900</td>
                  </tr>
                  <tr>
                    <td className="p-2 px-3 font-mono font-bold text-center border-r border-slate-900 bg-slate-950/20">E</td>
                    <td className="p-2 px-3 border-r border-slate-900 font-bold font-mono text-emerald-400">คะแนน BV (BV)</td>
                    <td className="p-2 px-3 text-slate-400">คะแนนนมูลค่าสปอนเซอร์ในการคำนวณผลกู้สายงาน</td>
                  </tr>
                  <tr>
                    <td className="p-2 px-3 font-mono font-bold text-center border-r border-slate-900 bg-slate-950/20">F</td>
                    <td className="p-2 px-3 border-r border-slate-900 font-bold font-mono text-emerald-400">ไอคอนภาพ (Image)</td>
                    <td className="p-2 px-3 text-slate-400">อิโมจิสินค้า หรือ URL ลิงก์รูปสำหรับแสดง</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Orders Schema Table Template */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center bg-slate-950/80 p-2.5 px-4 rounded-xl">
              <div>
                <h4 className="text-xs font-black text-emerald-400">2. แผ่นงานแท็บ "Orders" (ข้อมูลบัญชียอดขาย)</h4>
                <p className="text-[10px] text-slate-500">สำหรับบันทึกประวัติการจำลองธุรกรรมขายจริงเข้าระบบสเปรดชีต</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('Order ID\tวันเวลา (Timestamp)\tรหัสลูกค้า (Member ID)\tชื่อลูกค้า (Customer Name)\tสินค้าที่สั่ง (Product)\tจำนวนที่สั่ง (Quantity)\tราคาต่อชิ้น (Price)\tราคารวม (Total Price)\tคะแนน BV รวม (Total BV)\tผู้แนะนำ / สปอนเซอร์ (Sponsor)');
                  setCopiedOrdersHeader(true);
                  setTimeout(() => setCopiedOrdersHeader(false), 2005);
                }}
                className={`text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all duration-150 cursor-pointer ${
                  copiedOrdersHeader 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20'
                }`}
              >
                {copiedOrdersHeader ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copy สำเร็จ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>คัดลอกพาดหัวข้อ (Row 1)</span>
                  </>
                )}
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-900">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-950/65 font-mono text-[10px] text-slate-450 border-b border-slate-900">
                    <th className="p-2 px-3 border-r border-slate-900/80 text-left w-14">คอลัมน์</th>
                    <th className="p-2 px-3 border-r border-slate-900/80 text-left">คำศัพท์หัวข้อหลัก (Row 1)</th>
                    <th className="p-2 px-3 text-left">ลักษณะประเภทรายละเอียดข้อมูล</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300 divide-y divide-slate-900">
                  <tr>
                    <td className="p-2 px-3 font-mono font-bold text-center border-r border-slate-900 bg-slate-950/20">A</td>
                    <td className="p-2 px-3 border-r border-slate-900 font-bold font-mono text-indigo-400">Order ID</td>
                    <td className="p-2 px-3 text-slate-450">รหัสคำสั่งซื้อธุรกรรม เช่น <code className="bg-slate-950 text-slate-300 px-1 rounded">tx-xxxx</code></td>
                  </tr>
                  <tr>
                    <td className="p-2 px-3 font-mono font-bold text-center border-r border-slate-900 bg-slate-950/20">B</td>
                    <td className="p-2 px-3 border-r border-slate-900 font-bold font-mono text-indigo-400">วันเวลา (Timestamp)</td>
                    <td className="p-2 px-3 text-slate-450">วันที่ทำธุรกรรม เช่น <code className="bg-slate-950 text-slate-300 px-1 rounded">2026-06-23 14:20</code></td>
                  </tr>
                  <tr>
                    <td className="p-2 px-3 font-mono font-bold text-center border-r border-slate-900 bg-slate-950/20">C</td>
                    <td className="p-2 px-3 border-r border-slate-900 font-bold font-mono text-indigo-400">รหัสลูกค้า (Member ID)</td>
                    <td className="p-2 px-3 text-slate-450">รหัสผู้ทำยอดจัดซื้อสะสม เช่น <code className="bg-slate-950 text-slate-300 px-1 rounded">MEM-001</code></td>
                  </tr>
                  <tr>
                    <td className="p-2 px-3 font-mono font-bold text-center border-r border-slate-900 bg-slate-950/20">D</td>
                    <td className="p-2 px-3 border-r border-slate-900 font-bold font-mono text-indigo-400">ชื่อลูกค้า (Customer Name)</td>
                    <td className="p-2 px-3 text-slate-450">ชื่อของลูกค้าผู้ดำเนินการสายสัมพันธ์</td>
                  </tr>
                  <tr>
                    <td className="p-2 px-3 font-mono font-bold text-center border-r border-slate-900 bg-slate-950/20">E</td>
                    <td className="p-2 px-3 border-r border-slate-900 font-bold font-mono text-indigo-400">สินค้าที่สั่ง (Product)</td>
                    <td className="p-2 px-3 text-slate-450">รหัสหรือรายละเอียดสเปกสินค้าหลัก</td>
                  </tr>
                  <tr>
                    <td className="p-2 px-3 font-mono font-bold text-center border-r border-slate-900 bg-slate-950/20">F</td>
                    <td className="p-2 px-3 border-r border-slate-900 font-bold font-mono text-indigo-400">จำนวนที่สั่ง (Quantity)</td>
                    <td className="p-2 px-3 text-slate-455">จำนวนชิ้นที่ซื้อ (ตัวเลขจำลอง เช่น 2)</td>
                  </tr>
                  <tr>
                    <td className="p-2 px-3 font-mono font-bold text-center border-r border-slate-900 bg-slate-950/20">G</td>
                    <td className="p-2 px-3 border-r border-slate-900 font-bold font-mono text-indigo-400">ราคาต่อชิ้น (Price)</td>
                    <td className="p-2 px-3 text-slate-455">ราคาเครื่องเดี่ยว เช่น 43900</td>
                  </tr>
                  <tr>
                    <td className="p-2 px-3 font-mono font-bold text-center border-r border-slate-900 bg-slate-950/20">H</td>
                    <td className="p-2 px-3 border-r border-slate-900 font-bold font-mono text-indigo-400">ราคารวม (Total Price)</td>
                    <td className="p-2 px-3 text-slate-455">ยอดจ่ายสุทธิ เช่น 87800</td>
                  </tr>
                  <tr>
                    <td className="p-2 px-3 font-mono font-bold text-center border-r border-slate-900 bg-slate-950/20">I</td>
                    <td className="p-2 px-3 border-r border-slate-900 font-bold font-mono text-indigo-400">คะแนน BV รวม (Total BV)</td>
                    <td className="p-2 px-3 text-slate-455">คะแนนสะสมสายงานผลลัพธ์สปอนเซอร์รวม</td>
                  </tr>
                  <tr>
                    <td className="p-2 px-3 font-mono font-bold text-center border-r border-slate-900 bg-slate-950/20">J</td>
                    <td className="p-2 px-3 border-r border-slate-900 font-bold font-mono text-indigo-400">ผู้แนะนำ / สปอนเซอร์ (Sponsor)</td>
                    <td className="p-2 px-3 text-slate-455">รหัสสมาชิกผู้เป็นสปอนเซอร์อ้างอิงลำดับขั้น</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Product Synchronizer Preview Table (only if products exist) */}
      <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 text-left space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 items-center justify-center rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 flex">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-101 uppercase tracking-widest">รายการสินค้าที่เปิดใช้งานสะสมคะแนน (คลังสินค้าปัจจุบัน)</h3>
              <p className="text-xs text-slate-400 font-medium">สินค้ารายการเหล่านี้จะถูกจำลองแสดงผลในหน้าร้านค้า หน้าจำลองยอดขาย และคำนวณ BV สายงาน</p>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            สินค้าที่โหลดใช้งาน {products.length} ชิ้น
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-900 text-slate-400 font-mono text-[10px] h-9 uppercase">
                <th className="text-left font-bold pb-2">รหัสสินค้า (Product ID)</th>
                <th className="text-left font-bold pb-2">รายละเอียดรายการสินค้า</th>
                <th className="text-left font-bold pb-2">แบรนด์ตัวสินค้า</th>
                <th className="text-right font-bold pb-2">ราคาจัดจำหน่าย (THB)</th>
                <th className="text-right font-bold pb-2">คะแนนปันสปอนเซอร์ (BV)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 font-medium">
              {products.map((prod) => (
                <tr key={prod.id} className="h-12 hover:bg-slate-900/20 text-slate-300">
                  <td className="text-left font-mono font-bold text-slate-500">{prod.id}</td>
                  <td className="text-left text-slate-101 font-sans">
                    <span className="mr-2">{prod.image}</span>
                    {prod.name}
                  </td>
                  <td className="text-left text-slate-400">{prod.brand || '-'}</td>
                  <td className="text-right text-emerald-400 font-bold font-mono">฿{prod.price.toLocaleString()}</td>
                  <td className="text-right text-indigo-400 font-bold font-mono">{prod.bv.toLocaleString()} BV</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals wrapped in AnimatePresence */}
      <AnimatePresence>
        {/* ZIP Download Modal */}
        {isZipModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full text-left space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-101">การดาวน์โหลดรหัสซอร์สโค้ดดิ้ง (.ZIP)</h3>
                </div>
                <button 
                  onClick={() => setIsZipModalOpen(false)}
                  className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed font-sans space-y-4 pt-2">
                <p>
                  คุณสามารถทำการดาวน์โหลดซอร์สโค้ดของแอปพลิเคชัน <b>Phonetwork</b> นี้ทั้งหมดเพื่อนำไปรันบนคอมพิวเตอร์ของคุณได้อย่างอิสระโดยตรงผ่านเว็บแอปนี้ได้ทันที หรือทำตามวิธีดาวน์โหลดสำรองด้านล่าง:
                </p>

                {/* Direct Download Action */}
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="font-extrabold text-indigo-400">⚡ ดาวน์โหลดด่วนผ่านเว็บ</p>
                    <p className="text-[10px] text-slate-400">ระบบจะทำการบีบอัดไฟล์ล่าสุดและดาวน์โหลดเข้าเครื่องของคุณทันที</p>
                  </div>
                  <button
                    onClick={handleDownloadZip}
                    disabled={isDownloading}
                    className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition duration-150 text-center inline-flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 font-bold"
                  >
                    {isDownloading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileCode className="w-4 h-4" />
                    )}
                    <span>{isDownloading ? 'กำลังบีบอัดไฟล์...' : 'ดาวน์โหลดไฟล์ .ZIP'}</span>
                  </button>
                </div>

                {downloadError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex gap-3 text-xs">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 leading-relaxed">
                      <p className="font-extrabold text-rose-300">⚠️ ตรวจพบข้อจำกัดของเบราว์เซอร์</p>
                      <p className="whitespace-pre-line">{downloadError}</p>
                    </div>
                  </div>
                )}

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 font-mono text-[10.5px]">
                  <p className="text-slate-400">วิธีสำรองผ่าน AI Studio:</p>
                  <ol className="list-decimal pl-4 text-slate-300 space-y-1">
                    <li>คลิกไอคอนฟันเฟือง (Settings) ที่มุมขวาบนของ AI Studio</li>
                    <li>เลือกเมนู <b>"Export to ZIP"</b> เพื่อดาวน์โหลดรหัสซอร์สโค้ดล่าสุด</li>
                    <li>แตกไฟล์ และพิมพ์คำสั่ง <code className="bg-slate-900 px-1 rounded text-emerald-400">npm install</code> แล้วตามด้วย <code className="bg-slate-900 px-1 rounded text-emerald-400">npm run dev</code></li>
                  </ol>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  onClick={() => setIsZipModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition active:scale-95 cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* GitHub Export Modal */}
        {isGithubModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full text-left space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                    <Github className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-101">การสร้างคลังโมดูลการอัปโหลดลง GitHub</h3>
                </div>
                <button 
                  onClick={() => setIsGithubModalOpen(false)}
                  className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed font-sans space-y-4 pt-2">
                <p>
                  คุณสามารถนำซอร์สโค้ดจากระบบขึ้นเก็บไว้ที่บัญชี <b>GitHub</b> ของคุณได้อย่างคล่องตัวเพื่อเชื่อม Deploy ขึ้น <b>Vercel, Netlify หรือ Cloud Run</b>:
                </p>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 font-mono text-[10.5px]">
                  <p className="text-slate-400">ขั้นตอนการ Clone & Import ยอดนิยม:</p>
                  <ol className="list-decimal pl-4 text-slate-300 space-y-1">
                    <li>สร้างโปรเจกต์ว่างบนหน้าเว็บ GitHub</li>
                    <li>เปิดใช้งานปุ่ม GitHub ในมุมตั้งค่า AI Studio เพื่อให้เชื่อม Repo ได้รวดเร็ว</li>
                    <li>นำ URL บัญชีที่ผูกเปิดไปกด Import เข้าที่หน้าความสัมพันธ์ Vercel / Netlify เพื่อเปิดเชื่อมเว็บบล็อก</li>
                  </ol>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  onClick={() => setIsGithubModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition active:scale-95 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <a
                  href="https://github.com/new/import"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition active:scale-95 duration-150 text-center inline-flex items-center gap-1 cursor-pointer font-bold"
                >
                  <span>เข้าใจแล้ว ไป GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
