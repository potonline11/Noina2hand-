/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Member, MemberTier, Product, Transaction } from './types';
import { INITIAL_MEMBERS, INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, TIER_CONFIG } from './mockData';
import NetworkTree from './components/NetworkTree';
import MemberManager from './components/MemberManager';
import SalesSimulator from './components/SalesSimulator';
import { HomeView, AboutUsView, ProductsBVView, MarketingPlanView, ContactUsView } from './components/PublicPages';
import { 
  Users, 
  Smartphone, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  Activity, 
  ChevronRight, 
  FileSpreadsheet, 
  Award,
  BookOpen,
  PieChart as PieIcon,
  Play,
  HeartHandshake,
  LogIn,
  LogOut,
  UserCheck,
  Copy,
  MapPin,
  Info,
  CheckCircle,
  HelpCircle,
  Clock,
  X,
  Mail,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { safeLocalStorage, safeSessionStorage } from './lib/safeStorage';
import { getLinkedSheetConfig, getAccessToken, appendOrderToSheet, pullProductsFromSheet, getLinkedSheetConfigFromFirestore, getProductsFromFirestore, saveLinkedSheetConfig, saveProductsToFirestore } from './lib/googleSheets';
import SheetsManager from './components/SheetsManager';
import {
  isSupabaseConfigured,
  dbFetchMembers,
  dbSignUpMember,
  dbLogInMember,
  dbCreateProductOrder,
  dbUpdateMemberSales,
  dbResetDatabases
} from './supabase';
import { sendOrderNotifications } from './lib/NotificationService';


export default function App() {
  // ----------------------------------------------------
  // Persistent States
  // ----------------------------------------------------
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = safeLocalStorage.getItem('phonetwork_members');
      return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
    } catch {
      return INITIAL_MEMBERS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = safeLocalStorage.getItem('phonetwork_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [currentUser, setCurrentUser] = useState<Member | null>(() => {
    try {
      const saved = safeLocalStorage.getItem('phonetwork_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = safeLocalStorage.getItem('phonetwork_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab ] = useState<'dashboard' | 'network' | 'members' | 'sales' | 'showcase' | 'notifications' | 'sheets'>('dashboard');
  const [mainTab, setMainTab] = useState<'home' | 'about' | 'products' | 'marketing' | 'contact' | 'member_zone'>('home');
  const [tickerMessage, setTickerMessage] = useState<string>('ยินดีต้อนรับเข้าสู่ระบบจัดการเครือข่าย Phonetwork');
  const [sponsorForNewMember, setSponsorForNewMember] = useState<string | null>(null);

  // Referral / Marketing states
  const [referredSponsor, setReferredSponsor] = useState<Member | null>(null);
  const [copiedReferral, setCopiedReferral] = useState(false);

  // Authentication Dialog states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerSponsorId, setRegisterSponsorId] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [justRegisteredMember, setJustRegisteredMember] = useState<Member | null>(null);

  // Ordering Dialog states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState('');
  const [orderMemberId, setOrderMemberId] = useState('');
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Notification logs state
  const [notificationLogs, setNotificationLogs] = useState<any[]>([]);
  const [testCustName, setTestCustName] = useState('');
  const [testCustPhone, setTestCustPhone] = useState('');
  const [testProductIdx, setTestProductIdx] = useState(0);
  const [testShippingAddr, setTestShippingAddr] = useState('');
  const [testStatusMsg, setTestStatusMsg] = useState('');
  const [testIsSending, setTestIsSending] = useState(false);

  useEffect(() => {
    try {
      const logs = safeSessionStorage.getItem('phonetwork_notification_logs');
      if (logs) {
        setNotificationLogs(JSON.parse(logs));
      }
    } catch (e) {
      console.warn(e);
    }
  }, [activeTab]);


  // Sync to outer local persistence
  useEffect(() => {
    try {
      safeLocalStorage.setItem('phonetwork_members', JSON.stringify(members));
    } catch (e) {
      // Ignored
    }
  }, [members]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem('phonetwork_products', JSON.stringify(products));
    } catch (e) {
      // Ignored
    }
  }, [products]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem('phonetwork_transactions', JSON.stringify(transactions));
    } catch (e) {
      // Ignored
    }
  }, [transactions]);

  useEffect(() => {
    try {
      if (currentUser) {
        safeLocalStorage.setItem('phonetwork_current_user', JSON.stringify(currentUser));
      } else {
        safeLocalStorage.removeItem('phonetwork_current_user');
      }
    } catch (e) {
      // Ignored
    }
  }, [currentUser]);

  // Load globally linked sheet config and products from Firestore on mount
  useEffect(() => {
    const initializeGlobalData = async () => {
      try {
        // 1. Try to load config & products from Firestore (shared database)
        const remoteConfig = await getLinkedSheetConfigFromFirestore();
        const remoteProducts = await getProductsFromFirestore();

        if (remoteConfig) {
          saveLinkedSheetConfig(remoteConfig);
          console.log('Successfully loaded shared Google Sheet config from Firestore:', remoteConfig.spreadsheetId);
        }

        // 2. Try to pull fresh products from Google Sheet if we are connected
        const config = remoteConfig || getLinkedSheetConfig();
        if (config && config.spreadsheetId) {
          let token = safeLocalStorage.getItem('phonetwork_manual_access_token') || safeLocalStorage.getItem('phonetwork_google_access_token');
          if (!token) {
            token = await getAccessToken();
          }

          if (token) {
            try {
              const pulled = await pullProductsFromSheet(config.spreadsheetId, token);
              if (pulled && pulled.length > 0) {
                setProducts(pulled);
                safeLocalStorage.setItem('phonetwork_products', JSON.stringify(pulled));
                await saveProductsToFirestore(pulled);
                console.log(`Successfully pulled fresh products from Google Sheets on load: ${pulled.length} items.`);
                return; // Done
              }
            } catch (sheetErr) {
              console.warn('Failed to pull fresh products from Google Sheet on load, will fall back:', sheetErr);
            }
          }
        }

        // 3. Fallback: If sheet pull failed or not connected, use the cached Firestore products
        if (remoteProducts && remoteProducts.length > 0) {
          setProducts(remoteProducts);
          safeLocalStorage.setItem('phonetwork_products', JSON.stringify(remoteProducts));
          console.log(`Successfully loaded ${remoteProducts.length} cached products from Firestore.`);
          return;
        }

        // 4. Double Fallback: check local storage
        const localSaved = safeLocalStorage.getItem('phonetwork_products');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (parsed && parsed.length > 0) {
            setProducts(parsed);
          }
        }
      } catch (err) {
        console.warn('Google Sheets background auto-sync or Firestore fetch failed:', err);
      }
    };

    initializeGlobalData();
  }, []);

  // Keep a dynamic live ticker simulating sales or greetings
  useEffect(() => {
    const tips = [
      '🔥 ยอดปัง! คุณธรณินทร์ เพิ่งแนะนำสมาชิกใหม่ในตำแหน่ง Gold !',
      '📱 ข่าวประกาศ: iPhone 15 Pro Max ประจำสัปดาห์ครองอันดับมือถือทำคะแนน BV สูงสุด',
      '📈 สมาชิกก้าวหน้า: ยอดขายคอมมิชชันเครือข่ายจ่ายออกเพิ่มแตะ ฿245,600 แล้ววันนี้ !',
      '💎 Diamond Perks: มอบสระยอดขาย Global Pool 2% ทุกช่วงสิ้นไตรมาส',
      '⚡ เทปสอนงาน: ร่วมสัมมนาออนไลน์สร้างสายงาน Binary เวลา 19.30 น. คืนนี้',
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % tips.length;
      setTickerMessage(tips[index]);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic MLM aggregates & statistics calculations
  const totalMembersCount = members.length;
  // Initialize with a standard cumulative organization sales base + any simulated live order transactions
  const totalSalesOverall = 2189000 + transactions.reduce((acc, t) => acc + t.amount, 0);
  const totalCommissionsPaid = members.reduce((acc, m) => acc + m.commissionEarned, 0);

  const diamondCount = members.filter(m => m.tier === MemberTier.DIAMOND).length;
  const goldCount = members.filter(m => m.tier === MemberTier.GOLD).length;

  const tiersCount = {
    [MemberTier.NORMAL]: members.filter(m => m.tier === MemberTier.NORMAL).length,
    [MemberTier.BRONZE]: members.filter(m => m.tier === MemberTier.BRONZE).length,
    [MemberTier.SILVER]: members.filter(m => m.tier === MemberTier.SILVER).length,
    [MemberTier.GOLD]: members.filter(m => m.tier === MemberTier.GOLD).length,
    [MemberTier.DIAMOND]: members.filter(m => m.tier === MemberTier.DIAMOND).length,
  };

  // ==========================================
  // ON-MOUNT DATABASE & REFERRAL CAPTURE
  // ==========================================
  useEffect(() => {
    async function loadInitialDatabase() {
      try {
        const dbM = await dbFetchMembers();
        if (dbM && dbM.length > 0) {
          setMembers(dbM);
          // Update local copy of currentUser if applicable to reflect new totals
          const savedUser = safeLocalStorage.getItem('phonetwork_current_user');
          if (savedUser) {
            const parsed = JSON.parse(savedUser) as Member;
            const updatedProfile = dbM.find(m => m.id === parsed.id);
            if (updatedProfile) {
              setCurrentUser(updatedProfile);
            }
          }
        }
      } catch (err) {
        console.warn('Could not sync init members from Supabase', err);
      }
    }
    loadInitialDatabase();

    // Catch Referral Link Sponsor ID from URL (?ref=xxx)
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      const cleanRef = refCode.trim().toLowerCase();
      dbFetchMembers().then((allM) => {
        const matched = allM.find(m => 
          m.id.toLowerCase() === cleanRef || 
          m.phone.replace(/[^0-9]/g, '') === cleanRef.replace(/[^0-9]/g, '') ||
          m.name.toLowerCase().includes(cleanRef)
        );
        if (matched) {
          setReferredSponsor(matched);
          setRegisterSponsorId(matched.id);
          setIsRegisterModalOpen(true); // Pop register modal instantly to assist them!
          setTickerMessage(`🎯 ระบบตรวจจับลิงก์แนะนำของ: คุณ ${matched.name.split(' ')[0]} กรุณากรอกรหัสสมัครสมาชิกได้เลย`);
        }
      });
    }
  }, []);

  // ==========================================
  // REAL CLIENT DB HANDLERS (LOG IN, SIGN UP, CREATE ORDERS)
  // ==========================================
  const handleAuthLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!loginPhone.trim() || !loginPassword.trim()) {
      setAuthError('กรุณากรอกเบอร์โทรและรหัสผ่านให้ครบถ้วน');
      return;
    }
    const res = await dbLogInMember(loginPhone, loginPassword);
    if (res.success && res.member) {
      setCurrentUser(res.member);
      setIsLoginModalOpen(false);
      setLoginPhone('');
      setLoginPassword('');
      setTickerMessage(`🔓 คุณสปอนเซอร์ ${res.member.name.split(' ')[0]} ล็อกอินเข้าสู่สายงานระบบสำเร็จแล้ว !`);
      setMainTab('member_zone');
      // Reload current list from db/local
      const refreshedList = await dbFetchMembers();
      setMembers(refreshedList);
    } else {
      setAuthError(res.error || 'เบอร์โทรศัพท์หรือรหัสผ่านจำลองไม่ถูกต้อง');
    }
  };

  const handleAuthRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!registerName.trim() || !registerPhone.trim() || !registerPassword.trim()) {
      setAuthError('กรุณากรอกข้อมูลส่วนตัวและรหัสผ่านให้ครบถ้วน');
      return;
    }
    const sponsorId = registerSponsorId.trim() || null;
    const res = await dbSignUpMember(registerName, registerPhone, registerPassword, sponsorId);
    if (res.success && res.member) {
      // Auto Login & Session Retention
      setCurrentUser(res.member);
      setJustRegisteredMember(res.member);
      setRegisterSuccess(true);
      setMainTab('member_zone');
      
      // Clear fields for subsequent triggers
      setRegisterName('');
      setRegisterPhone('');
      setRegisterPassword('');
      setRegisterSponsorId('');
      setReferredSponsor(null);
      
      setTickerMessage(`🎉 สมัครสมาชิกสายงาน PHO NETWORK สำเร็จ! ยินดีต้อนรับคุณ ${res.member.name}`);
      
      // Reload members list in the background
      const refreshedList = await dbFetchMembers();
      setMembers(refreshedList);
    } else {
      setAuthError(res.error || 'การสมัครสมาชิกล้มเหลว');
    }
  };

  const handleRequestLogout = () => {
    setCurrentUser(null);
    try {
      safeLocalStorage.removeItem('phonetwork_current_user');
    } catch (e) {
      // Ignored
    }
    setTickerMessage('🔒 คุณออกจากระบบ Phonetwork สำเร็จแล้ว');
    setMainTab('home');
  };

  const handleBuyNowTrigger = (product: Product) => {
    setSelectedProduct(product);
    setOrderQuantity(1);
    setShippingAddress('');
    setOrderError('');
    setOrderSuccess(false);
    
    // Auto-fill purchaser ID if logged in
    if (currentUser) {
      setOrderMemberId(currentUser.id);
    } else if (members.length > 0) {
      setOrderMemberId(members[members.length - 1].id);
    } else {
      setOrderMemberId('');
    }
    
    setIsOrderModalOpen(true);
  };

  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError('');
    if (!selectedProduct) return;
    if (!shippingAddress.trim()) {
      setOrderError('กรุณากรอกข้อมูลที่อยู่จัดส่งให้ละเอียด');
      return;
    }
    if (!orderMemberId) {
      setOrderError('กรุณาระบุรหัสผู้ซื้อที่ต้องการลงบิลสะสมยอด');
      return;
    }

    const purchaser = members.find(m => m.id === orderMemberId);
    if (!purchaser) {
      setOrderError('ไม่พบรหัสสมาชิกนี้ในระบบสายงาน Phonetwork');
      return;
    }

    const res = await dbCreateProductOrder(
      orderMemberId,
      purchaser.name,
      selectedProduct,
      orderQuantity,
      shippingAddress
    );

    if (res.success && res.order) {
      setOrderSuccess(true);
      // Process MLM Commissions and Sales automatically
      handleRecordSale(orderMemberId, selectedProduct.id, orderQuantity);
      
      // Trigger Email & LINE notifications asynchronously
      sendOrderNotifications({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        brand: selectedProduct.brand,
        price: selectedProduct.price,
        quantity: orderQuantity,
        totalPrice: selectedProduct.price * orderQuantity,
        bv: selectedProduct.bv * orderQuantity,
        shippingAddress: shippingAddress,
        orderMemberId: orderMemberId,
        purchaserName: purchaser.name
      }).catch(err => {
        console.error("Failed to send background order notifications:", err);
      });

      // Notify
      setTickerMessage(`📦 คำสั่งซื้อ ${selectedProduct.name} บันทึกประวัติลง Supabase สำเร็จ!`);
      setCopiedAccount(false);
    } else {
      setOrderError(res.error || 'เกิดปัญหาขัดข้อง: บันทึกข้อมูลใบสั่งสินค้าล้มเหลว');
    }
  };

  const handleTriggerManualNotificationTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCustName.trim()) {
      setTestStatusMsg('❌ กรุณากรอกชื่อลูกค้าสำหรับการทดสอบ');
      return;
    }
    
    setTestIsSending(true);
    setTestStatusMsg('⏳ กำลังยิงสัญญาณแจ้งเตือนเข้าระบบอีเมลและเตรียมโครงสร้าง LINE...');
    
    const targetProd = products[testProductIdx] || products[0];
    const dummyAddress = `ชื่อผู้รับ: คุณ ${testCustName.trim()}\nเบอร์โทรศัพท์: ${testCustPhone.trim() || '089-999-9999'}\nที่อยู่จัดส่ง: 999/99 อาคารพะเน็ตเวิร์ค แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900\n(หมายเหตุจากการกดส่งทดสอบระบบแจ้งเตือนออเดอร์โดยตรง)`;
    
    try {
      const res = await sendOrderNotifications({
        productId: targetProd.id,
        productName: targetProd.name,
        brand: targetProd.brand,
        price: targetProd.price,
        quantity: 1,
        totalPrice: targetProd.price,
        bv: targetProd.bv,
        shippingAddress: dummyAddress,
        orderMemberId: currentUser ? currentUser.id : 'M999999',
        purchaserName: currentUser ? currentUser.name : 'ผู้ส่งผลทดสอบระบบ'
      });
      
      if (res.emailSent) {
        setTestStatusMsg(`✅ จัดส่งรายงานสรุปยอดเข้าเมล pnmall4u@gmail.com สำเร็จแล้ว! (ช่องทาง: ${res.emailChannel})`);
        setTickerMessage(`📧 ยิงทดสอบระบบสรุปยอดออเดอร์ส่งตรง pnmall4u@gmail.com สัญญาณพาสสำเร็จ!`);
      } else {
        setTestStatusMsg(`⚠️ ระบบพาสข้อความเรียบร้อย (โครงสร้าง LINE API/EmailJS Payload ได้จัดเตรียมเพื่อส่งต่อสำเร็จ)`);
      }
      
      // Reload logs
      const updatedLogs = safeSessionStorage.getItem('phonetwork_notification_logs');
      if (updatedLogs) {
        setNotificationLogs(JSON.parse(updatedLogs));
      }
    } catch (err: any) {
      setTestStatusMsg(`❌ เกิดข้อผิดพลาดทางเทคนิค: ${err.message || err}`);
    } finally {
      setTestIsSending(false);
    }
  };


  // ----------------------------------------------------
  // MLM Core Logical Calculations
  // ----------------------------------------------------
  
  // 1. Calculate cascading commission up the chain upon product purchase
  const handleRecordSale = (memberId: string, productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    const seller = members.find(m => m.id === memberId);
    if (!product || !seller) return;

    const saleAmount = product.price * quantity;
    const distributedCommissionsList: Transaction['commissionDistributed'] = [];

    // Temporary lists to update members locally
    const updatedMembersMap = new Map<string, Member>(members.map(m => [m.id, { ...m }]));
    
    // Update Personal Sales for the direct seller immediately
    const updatedSeller = updatedMembersMap.get(memberId);
    if (updatedSeller) {
      updatedSeller.personalSales += saleAmount;
      updatedSeller.groupSales += saleAmount;
    }

    // Direct Benefit payout for direct seller
    const directSellerRate = TIER_CONFIG[seller.tier].directCommission;
    const sellerCommission = saleAmount * (directSellerRate / 100);

    if (updatedSeller) {
      updatedSeller.commissionEarned += sellerCommission;
    }

    distributedCommissionsList.push({
      memberId: seller.id,
      memberName: seller.name,
      tier: seller.tier,
      amount: sellerCommission,
      role: 'Sponsor' // Direct Seller holds first level benefit
    });

    // Cascading parent uplines volume increment and overrides
    let currentSponsorId = seller.sponsorId;
    let depth = 1;
    let tempSponsorId = currentSponsorId;
    const visited = new Set<string>();

    while (tempSponsorId && depth <= 5) {
      if (visited.has(tempSponsorId)) break;
      visited.add(tempSponsorId);

      const parent = updatedMembersMap.get(tempSponsorId);
      if (!parent) break;

      // Update Group sales for all ancestors
      parent.groupSales += saleAmount;

      // Calculate indirect overrides based on upline's tier privileges for depth
      const parentTierConfig = TIER_CONFIG[parent.tier];
      if (parentTierConfig.indirectLevels >= depth) {
        const indirectRate = parentTierConfig.indirectRate;
        const indirectCommissionAmt = saleAmount * (indirectRate / 100);
        parent.commissionEarned += indirectCommissionAmt;

        distributedCommissionsList.push({
          memberId: parent.id,
          memberName: parent.name,
          tier: parent.tier,
          amount: indirectCommissionAmt,
          role: 'Upline'
        });
      }

      // Check auto-promotion rule!
      // If of a certain group sales point, members automatically upgrade tier
      const currentTier = parent.tier;
      const totalMemberPoints = parent.personalSales + parent.groupSales;

      let targetTier: MemberTier = currentTier;
      
      if (totalMemberPoints >= TIER_CONFIG[MemberTier.DIAMOND].minSalesToPromote) {
        targetTier = MemberTier.DIAMOND;
      } else if (totalMemberPoints >= TIER_CONFIG[MemberTier.GOLD].minSalesToPromote) {
        targetTier = MemberTier.GOLD;
      } else if (totalMemberPoints >= TIER_CONFIG[MemberTier.SILVER].minSalesToPromote) {
        targetTier = MemberTier.SILVER;
      } else if (totalMemberPoints >= TIER_CONFIG[MemberTier.BRONZE].minSalesToPromote) {
        targetTier = MemberTier.BRONZE;
      }

      if (targetTier !== currentTier) {
        parent.tier = targetTier;
      }

      tempSponsorId = parent.sponsorId || '';
      depth++;
    }

    // Set new states
    const finalMembersList = Array.from(updatedMembersMap.values());
    setMembers(finalMembersList);
    dbUpdateMemberSales(finalMembersList); // Push sales updates, commissions, and auto-promoted ranks to Supabase!

    // If active logged-in member changed their personal/group stats, keep their active profile synced
    if (currentUser) {
      const updatedProfile = finalMembersList.find(m => m.id === currentUser.id);
      if (updatedProfile) {
        setCurrentUser(updatedProfile);
      }
    }

    // Create a physical transaction object record
    const date = new Date();
    const formattedDate = date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0') + ' ' + 
      String(date.getHours()).padStart(2, '0') + ':' + 
      String(date.getMinutes()).padStart(2, '0') + ':' + 
      String(date.getSeconds()).padStart(2, '0');

    const newTx: Transaction = {
      id: 't' + (transactions.length + 1) + '-' + Math.floor(Math.random() * 9000 + 1000),
      memberId,
      memberName: seller.name,
      productId,
      productName: product.name,
      amount: saleAmount,
      commissionDistributed: distributedCommissionsList,
      timestamp: formattedDate
    };

    setTransactions([newTx, ...transactions]);
    setTickerMessage(`⚡ ปิดบิลสำเร็จ! คุณ ${seller.name.split(' ')[0]} ขาย ${product.name} ยอดขยับ ฿${saleAmount.toLocaleString()}`);

    // Google Sheets Push Integration Integration
    const gSheetConfig = getLinkedSheetConfig();
    getAccessToken().then(token => {
      if (gSheetConfig && token) {
        appendOrderToSheet(gSheetConfig.spreadsheetId, token, newTx, seller, product, quantity)
          .then(() => {
            setTickerMessage(prev => prev + ' 🟢 ซิงค์ประวัติซื้อลง Google Sheet แล้ว');
          })
          .catch(err => {
            console.error('Failed to append to Google Sheets:', err);
          });
      }
    }).catch(err => {
      console.warn('OAuth token fetch was omitted during sheet append:', err);
    });
  };

  // 2. Add New Member
  const handleAddMember = (fields: Omit<Member, 'id' | 'personalSales' | 'groupSales' | 'commissionEarned' | 'joinedDate'>) => {
    const date = new Date();
    const joinedStr = date.toISOString().split('T')[0];
    const newId = 'm' + (members.length + 1);

    const newMember: Member = {
      id: newId,
      name: fields.name,
      phone: fields.phone,
      tier: fields.tier,
      sponsorId: fields.sponsorId,
      personalSales: 0,
      groupSales: 0,
      commissionEarned: 0,
      joinedDate: joinedStr
    };

    const updatedList = [...members, newMember];
    setMembers(updatedList);
    dbUpdateMemberSales(updatedList);
    setTickerMessage(`🎉 ขอบพระคุณและต้อนรับคุณ ${fields.name.split(' ')[0]} เข้าร่วมเครือข่ายตำแหน่ง ${fields.tier}`);
  };

  // 3. Edit Member Info
  const handleEditMember = (updated: Member) => {
    const updatedList = members.map(m => m.id === updated.id ? updated : m);
    setMembers(updatedList);
    dbUpdateMemberSales(updatedList);
    setTickerMessage(`✍️ อัปเดตคุณสมบัติของท่านสมาชิก ${updated.name.split(' ')[0]} เรียบร้อยแล้ว`);
  };

  // 4. Delete Member
  const handleDeleteMember = (id: string) => {
    const updatedList = members.filter(m => m.id !== id);
    setMembers(updatedList);
    dbUpdateMemberSales(updatedList);
    setTickerMessage(`🗑️ นำชื่อสมาชิกออกจากสายงานเรียบร้อย`);
  };

  // 5. Select deep node for tree view
  const handleSelectMemberForNetwork = (id: string) => {
    // Optionally focus network tab
    setActiveTab('network');
  };

  // 6. Request to sponsor someone as direct sponsor
  const handleAddDownlineClick = (sponsorId: string) => {
    setSponsorForNewMember(sponsorId);
    setActiveTab('members');
  };

  // 7. Reset simulated transaction logs & recalculate standard database / state values
  const handleResetSales = async () => {
    try {
      await dbResetDatabases();
      safeLocalStorage.removeItem('phonetwork_members');
      safeLocalStorage.removeItem('phonetwork_transactions');
      safeLocalStorage.removeItem('phonetwork_current_user');
      setMembers(INITIAL_MEMBERS);
      setTransactions(INITIAL_TRANSACTIONS);
      setCurrentUser(null);
      setTickerMessage('🔄 รีเซตข้อมูลยอดขายและโครงสร้างสายงานผู้แทนจำหน่ายสำเร็จ');
    } catch (err) {
      console.warn('Reset failed:', err);
      setMembers(INITIAL_MEMBERS);
      setTransactions(INITIAL_TRANSACTIONS);
      setCurrentUser(null);
    }
  };

  // 8. Custom SVG Line Chart Calculations
  const chartWidth = 500;
  const chartHeight = 120;
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'];
  
  // Calculate dynamic sales trend based on simulation data
  const dynamicJuneSales = transactions.reduce((sum, t) => sum + t.amount, 0);
  const calculatedTrendSales = [320000, 640000, 980000, 1420000, 1850000, Math.max(2189000, dynamicJuneSales)];
  
  const minSale = Math.min(...calculatedTrendSales);
  const maxSale = Math.max(...calculatedTrendSales);
  const range = (maxSale - minSale) || 1;

  const points = calculatedTrendSales.map((sale, idx) => {
    const x = (idx / (calculatedTrendSales.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - ((sale - minSale) / range) * (chartHeight - 30) - 15;
    return { x, y, sale, label: months[idx] };
  });

  const svgPathStr = points.reduce((str, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${str} L ${pt.x} ${pt.y}`;
  }, '');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white" id="main-phonetwork-app">
      {/* 1. TOP ANNOUNCEMENT / REAL-TIME TICKER RAIL */}
      <div className="bg-slate-900 border-b border-indigo-950 px-4 py-2 text-xs relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <Activity className="w-3.5 h-3.5" />
            LIVE FEED
          </div>
          
          <div className="flex-1 overflow-hidden">
            <motion.p
              key={tickerMessage}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              className="text-slate-300 font-medium whitespace-nowrap text-ellipsis overflow-hidden"
            >
              {tickerMessage}
            </motion.p>
          </div>

          <div className="shrink-0 hidden sm:block">
            {isSupabaseConfigured ? (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-1 px-3 rounded-full text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                เซิร์ฟเวอร์: เชื่อมต่อ Real Supabase Cloud สำเร็จ
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-500/90 py-1 px-3 rounded-full text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                ฐานข้อมูล: โหมดทดลองจำลองออฟไลน์ (Demo)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. APP LOGO AND HEADER TITLE */}
      <header className="border-b border-slate-900/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 animate-fade-in" id="app-main-navbar">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-3">
              <div onClick={() => setMainTab('home')} className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-400 to-indigo-600 p-[1px] shadow-lg shadow-indigo-500/10 cursor-pointer">
                <div className="w-full h-full rounded-[15px] bg-slate-950 flex items-center justify-center text-xl font-black">
                  ✨
                </div>
              </div>
              <div onClick={() => setMainTab('home')} className="cursor-pointer">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-slate-100 tracking-tight">PHO</span>
                  <span className="bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent font-extrabold text-lg tracking-tight">NETWORK</span>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-full font-bold border border-indigo-500/15">PLATFORM v2.5</span>
                </div>
                <p className="text-slate-400 text-[11px] md:text-xs">ระบบสปอนเซอร์ & จัดการรางวัลธุรกิจค้าปลีกโทรศัพท์มือถือครบวงจร</p>
              </div>
            </div>

            {/* Mobile login indicator if on mobile */}
            <div className="flex lg:hidden items-center gap-2">
              {!currentUser ? (
                <button
                  onClick={() => { setAuthError(''); setIsLoginModalOpen(true); }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 active:scale-95 transition-all text-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5 inline mr-1" /> เข้าสู่ระบบ
                </button>
              ) : (
                <button
                  onClick={handleRequestLogout}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-900 text-slate-500 active:scale-95 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Primary Top Navbar Navigation */}
          <nav className="flex flex-wrap items-center justify-center gap-1 md:gap-1.5 w-full lg:w-auto" id="nav-tabs-wrapper">
            <button
              onClick={() => setMainTab('home')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
                mainTab === 'home'
                  ? 'bg-gradient-to-r from-indigo-650 to-indigo-805 text-white font-black shadow-md border-indigo-550/20 shadow-indigo-500/10'
                  : 'text-slate-400 border-transparent hover:text-slate-205 hover:bg-slate-900/50'
              }`}
            >
              🏠 หน้าแรก
            </button>
            <button
              onClick={() => setMainTab('about')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
                mainTab === 'about'
                  ? 'bg-gradient-to-r from-indigo-650 to-indigo-805 text-white font-black shadow-md border-indigo-550/20 shadow-indigo-500/10'
                  : 'text-slate-400 border-transparent hover:text-slate-205 hover:bg-slate-900/50'
              }`}
            >
              🏢 เกี่ยวกับเรา
            </button>
            <button
              onClick={() => setMainTab('products')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
                mainTab === 'products'
                  ? 'bg-gradient-to-r from-indigo-650 to-indigo-805 text-white font-black shadow-md border-indigo-550/20 shadow-indigo-500/10'
                  : 'text-slate-400 border-transparent hover:text-slate-205 hover:bg-slate-900/50'
              }`}
            >
              📱 สินค้าและระบบ BV
            </button>
            <button
              onClick={() => setMainTab('marketing')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
                mainTab === 'marketing'
                  ? 'bg-gradient-to-r from-indigo-650 to-indigo-805 text-white font-black shadow-md border-indigo-550/20 shadow-indigo-500/10'
                  : 'text-slate-400 border-transparent hover:text-slate-205 hover:bg-slate-900/50'
              }`}
            >
              📊 แผนการตลาด
            </button>
            <button
              onClick={() => setMainTab('contact')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
                mainTab === 'contact'
                  ? 'bg-gradient-to-r from-indigo-650 to-indigo-805 text-white font-black shadow-md border-indigo-550/20 shadow-indigo-500/10'
                  : 'text-slate-400 border-transparent hover:text-slate-205 hover:bg-slate-900/50'
              }`}
            >
              ✉️ ติดต่อเรา
            </button>
            <button
              onClick={() => setMainTab('member_zone')}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
                mainTab === 'member_zone'
                  ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-550/20 border-indigo-400'
                  : 'text-indigo-400 bg-indigo-500/5 border-indigo-500/10 hover:text-indigo-300 hover:bg-indigo-950/25'
              }`}
            >
              👥 {currentUser ? '💼 ระบบหลังบ้าน' : '🔑 เข้าหลังบ้าน / ล็อกอิน'}
            </button>
          </nav>

          {/* Authentication & User Session Indicator Widget (Desktop view) */}
          <div className="hidden lg:flex items-center gap-2">
            {!currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setAuthError(''); setIsLoginModalOpen(true); }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 text-slate-300 transition-all cursor-pointer flex items-center gap-1.5 animate-fade-in"
                >
                  <LogIn className="w-3.5 h-3.5" /> เข้าสู่ระบบ
                </button>
                <button
                  onClick={() => { setAuthError(''); setIsRegisterModalOpen(true); }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-505 hover:to-indigo-650 text-white shadow-md shadow-indigo-505/15 transition-all cursor-pointer flex items-center gap-1.5 animate-fade-in"
                >
                  <Users className="w-3.5 h-3.5" /> สมัครสมาชิกใหม่
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 animate-fade-in">
                <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="text-left font-sans">
                    <span className="text-[9px] text-slate-500 block leading-none font-bold uppercase">สวัสดีผู้ร่วมสายงาน</span>
                    <span className="text-xs font-extrabold text-indigo-300">
                      {currentUser.name.split(' ')[0]} [{currentUser.tier}]
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleRequestLogout}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-red-500/10 border border-slate-900 hover:border-red-500/20 text-slate-500 hover:text-red-400 transition-all cursor-pointer flex items-center gap-1.5"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2.5 Secondary Header for active user dashboard panel and referral linking copy */}
        {currentUser && (
          <div className="bg-indigo-950/20 border-t border-slate-900 px-4 py-2.5 text-xs animate-fade-in">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-slate-400">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1 text-slate-300 font-bold">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" /> สถิติส่วนตัวของคุณ:
                </span>
                <span className="font-mono">ยอดขายส่วนตน: <strong className="text-amber-400">฿{currentUser.personalSales.toLocaleString()}</strong></span>
                <span className="font-mono">ยอดทีมสปอนเซอร์: <strong className="text-cyan-400">฿{currentUser.groupSales.toLocaleString()}</strong></span>
                <span className="font-mono">ค่าบริหารสายงานสะสม: <strong className="text-emerald-400">฿{currentUser.commissionEarned.toLocaleString()}</strong></span>
              </div>

              {/* Personal Referral link copy section */}
              <div className="flex items-center gap-2 bg-slate-950/85 px-3 py-1.5 rounded-xl border border-slate-900 w-full md:w-auto justify-between md:justify-start">
                <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1 font-sans">
                  🔗 ลิงก์สปอนเซอร์แนะนำของคุณ:
                </span>
                <span className="font-mono text-indigo-300 select-all font-bold text-[11px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-900">
                  {`${window.location.origin}${window.location.pathname}?ref=${currentUser.id}`}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?ref=${currentUser.id}`);
                    setCopiedReferral(true);
                    setTimeout(() => setCopiedReferral(false), 2000);
                  }}
                  className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 font-bold text-[10px] text-white hover:text-white transition-all cursor-pointer flex items-center gap-1 font-sans"
                >
                  {copiedReferral ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-emerald-300 animate-pulse" /> คัดลอกแล้ว!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> คัดลอกลิงก์ แนะแนวทีม
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 3. MAIN CONTAINER BODY */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {/* PUBLIC PAGE VIEWS */}
          {mainTab === 'home' && (
            <motion.div
              key="home-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <HomeView 
                products={products} 
                onBuyNow={handleBuyNowTrigger} 
                setMainTab={setMainTab} 
                setIsRegisterModalOpen={setIsRegisterModalOpen} 
              />
            </motion.div>
          )}

          {mainTab === 'about' && (
            <motion.div
              key="about-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AboutUsView />
            </motion.div>
          )}

          {mainTab === 'products' && (
            <motion.div
              key="products-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ProductsBVView 
                products={products} 
                onBuyNow={handleBuyNowTrigger} 
              />
            </motion.div>
          )}

          {mainTab === 'marketing' && (
            <motion.div
              key="marketing-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <MarketingPlanView />
            </motion.div>
          )}

          {mainTab === 'contact' && (
            <motion.div
              key="contact-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ContactUsView />
            </motion.div>
          )}

          {mainTab === 'member_zone' && !currentUser && (
            <motion.div
              key="unauthenticated-prompt"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-md mx-auto bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden my-8"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
              <div className="w-16 h-16 bg-indigo-650/15 text-indigo-400 rounded-2xl flex items-center justify-center text-4xl mx-auto animate-pulse">
                🔑
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-101 tracking-tight">ระบบหลังบ้านเฉพาะสมาชิกสายงาน</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  กรุณากรอกข้อมูลเข้าสู่ระบบจำลองสายงาน หรือลงทะเบียนสมาชิกใหม่ผ่านลิงก์แนะนำสปอนเซอร์ตัวแทน เพื่อเปิดการใช้งานระบบผังต้นไม้สองซีกอัจฉริยะ ระบบคิดโบนัสคอมมิชชันสะสมสะล้าง และแดชบอร์ดสรุปแบบเรียลไทม์
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => { setAuthError(''); setIsLoginModalOpen(true); }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-500 hover:to-indigo-650 text-white font-extrabold text-xs transition duration-200 cursor-pointer active:scale-95 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4.5 h-4.5" /> ล็อกอินเข้าสู่สายงานที่สมัครแล้ว
                </button>
                <button
                  onClick={() => { setAuthError(''); setIsRegisterModalOpen(true); }}
                  className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-850 hover:text-white border border-slate-800 text-slate-400 text-xs font-bold transition cursor-pointer"
                >
                  <Users className="w-4.5 h-4.5 inline mr-1.5" /> สมัครเข้าร่วมแนะแนวทีมงานใหม่
                </button>
              </div>
            </motion.div>
          )}

          {mainTab === 'member_zone' && currentUser && (
            <div className="space-y-6">
              {/* Backoffice Inner Controls Header and Internal Navigation Bar */}
              <div className="bg-slate-900/30 p-4.5 rounded-2xl border border-slate-850/80 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 text-left animate-fade-in">
                <div className="space-y-1">
                  <span className="text-[10px] bg-indigo-505/10 text-indigo-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono border border-indigo-500/10">
                    💼 Member Controls Central Desk
                  </span>
                  <h2 className="text-base font-extrabold text-slate-101 tracking-tight">โต๊ะจัดการขยายสายงานและจำลองถอนยอดแชริ่ง</h2>
                </div>
                
                <div className="text-[11px] text-slate-500 font-mono hidden xl:block">
                  สถานะสายงาน: พารามิเตอร์เกื้อกูล Binary Double Engine
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded-2xl border border-slate-900/80 flex flex-wrap gap-1 md:gap-1.5 animate-fade-in">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
                    activeTab === 'dashboard'
                      ? 'bg-gradient-to-r from-slate-900 to-slate-855 text-indigo-305 border-indigo-500/20 shadow-inner font-black'
                      : 'text-slate-400 border-transparent hover:text-slate-205 hover:bg-slate-900/40'
                  }`}
                >
                  📊 โต๊ะแดชบอร์ดสรุปยอด
                </button>
                <button
                  onClick={() => setActiveTab('network')}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
                    activeTab === 'network'
                      ? 'bg-gradient-to-r from-slate-900 to-slate-855 text-indigo-305 border-indigo-500/20 shadow-inner font-black'
                      : 'text-slate-400 border-transparent hover:text-slate-205 hover:bg-slate-900/40'
                  }`}
                >
                  🌲 ผังโครงสร้างสายงาน
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
                    activeTab === 'members'
                      ? 'bg-gradient-to-r from-slate-900 to-slate-855 text-indigo-305 border-indigo-500/20 shadow-inner font-black'
                      : 'text-slate-400 border-transparent hover:text-slate-205 hover:bg-slate-900/40'
                  }`}
                >
                  👥 รายชื่อสมาชิก ({totalMembersCount})
                </button>
                <button
                  onClick={() => setActiveTab('sales')}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
                    activeTab === 'sales'
                      ? 'bg-gradient-to-r from-slate-900 to-slate-855 text-indigo-305 border-indigo-500/20 shadow-inner font-black'
                      : 'text-slate-400 border-transparent hover:text-slate-205 hover:bg-slate-900/40'
                  }`}
                >
                  💰 คีย์ยอดและจำลองจ่าย
                </button>
                <button
                  onClick={() => setActiveTab('showcase')}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
                    activeTab === 'showcase'
                      ? 'bg-gradient-to-r from-slate-900 to-slate-855 text-indigo-305 border-indigo-500/20 shadow-inner font-black'
                      : 'text-slate-400 border-transparent hover:text-slate-205 hover:bg-slate-900/40'
                  }`}
                >
                  📱 ตารางตัวอย่างรุ่นมือถือทั้งหมด
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
                    activeTab === 'notifications'
                      ? 'bg-gradient-to-r from-slate-900 to-slate-855 text-indigo-305 border-indigo-500/20 shadow-inner font-black'
                      : 'text-slate-400 border-transparent hover:text-slate-205 hover:bg-slate-900/40'
                  }`}
                >
                  🔔 ระบบแจ้งเตือนออเดอร์
                </button>
                <button
                  onClick={() => setActiveTab('sheets')}
                  className={`px-4.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
                    activeTab === 'sheets'
                      ? 'bg-gradient-to-r from-slate-900 to-slate-855 text-indigo-305 border-indigo-300 border-indigo-500/20 shadow-inner font-black'
                      : 'text-slate-400 border-transparent hover:text-slate-205 hover:bg-slate-900/40'
                  }`}
                >
                  🟢 ตั้งค่า Google Sheets
                </button>
              </div>

              {/* TAB 1: EXECUTIVE DASHBOARD */}
              {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* BENTO STATISTICS OVERVIEW GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Sale count overall */}
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full opacity-60 pointer-events-none" />
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">ยอดขายสะสมทั้งองค์กร (CV)</span>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-3xl font-black font-mono text-indigo-400">
                      ฿{totalSalesOverall.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">THB</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-500">
                    <span className="text-emerald-400 font-mono font-bold font-semibold">↑ Real-Time</span>
                    <span>อัตราเติบโตแบบก้าวกระโดด</span>
                  </div>
                </div>

                {/* Total Paid commissions */}
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full opacity-60 pointer-events-none" />
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">คอมมิชชันทีมจ่ายคืนสะสม</span>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-3xl font-black font-mono text-amber-400 animate-pulse">
                      ฿{totalCommissionsPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-500">
                    <span>เฉลี่ยคืน</span>
                    <span className="text-slate-300 font-bold">{((totalCommissionsPaid / (totalSalesOverall || 1)) * 100).toFixed(1)}%</span>
                    <span>ของยอดจำหน่ายทั้งหมด</span>
                  </div>
                </div>

                {/* Team count members */}
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full opacity-60 pointer-events-none" />
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">พันธมิตรนักธุรกิจรวม</span>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-3xl font-black font-mono text-emerald-400">
                      {totalMembersCount}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">รหัส</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-500">
                    <span>ในตำแหน่งมงกุฎ Diamond และ Gold:</span>
                    <span className="text-emerald-400 font-extrabold">{diamondCount + goldCount} คน</span>
                  </div>
                </div>

                {/* Tiers summary indicators */}
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md relative overflow-hidden group flex flex-col justify-between">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">ความเสถียรและสเปกส่วนแบ่ง</span>
                  
                  <div className="grid grid-cols-5 gap-1.5 mt-3">
                    {/* Normal */}
                    <div className="text-center font-mono p-1 rounded bg-slate-950/50">
                      <span className="text-[9px] text-slate-500 block">Normal</span>
                      <strong className="text-xs text-slate-400">{tiersCount[MemberTier.NORMAL] || 0}</strong>
                    </div>
                    {/* Bronze */}
                    <div className="text-center font-mono p-1 rounded bg-orange-500/5">
                      <span className="text-[9px] text-orange-500/70 block">Bronze</span>
                      <strong className="text-xs text-orange-400">{tiersCount[MemberTier.BRONZE] || 0}</strong>
                    </div>
                    {/* Silver */}
                    <div className="text-center font-mono p-1 rounded bg-cyan-500/5">
                      <span className="text-[9px] text-cyan-500/70 block">Silver</span>
                      <strong className="text-xs text-cyan-400">{tiersCount[MemberTier.SILVER] || 0}</strong>
                    </div>
                    {/* Gold */}
                    <div className="text-center font-mono p-1 rounded bg-amber-500/5">
                      <span className="text-[9px] text-amber-500/70 block">Gold</span>
                      <strong className="text-xs text-amber-400">{tiersCount[MemberTier.GOLD] || 0}</strong>
                    </div>
                    {/* Diamond */}
                    <div className="text-center font-mono p-1 rounded bg-fuchsia-500/5">
                      <span className="text-[9px] text-fuchsia-500/70 block">Diam.</span>
                      <strong className="text-xs text-fuchsia-400">{tiersCount[MemberTier.DIAMOND] || 0}</strong>
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-slate-500 mt-2 text-right italic">
                    ขยับตำแหน่งแบบอัตโนมัติ (Dynamic Auto-Tiering)
                  </div>
                </div>

              </div>

              {/* CORE DASHBOARD GRAPHICS (CUSTOM SVG GRAPH AND EXCLUSIVE COMPACT INFOGRAPHIC BENTO CLUSTERS) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Sales Monthly Chart */}
                <div className="lg:col-span-7 bg-slate-950 border border-slate-900 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[340px]">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-900 mb-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-400" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-200">กราฟวิเคราะห์ยอดขายสะสมรายเดือน</h4>
                          <p className="text-slate-500 text-[11px]">ดิ่งประเมินแนวโน้มและการไต่ระดับขั้นบันได Phonetwork</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> ยอดจำหน่ายสะสม (CV)
                      </div>
                    </div>

                    {/* Pure Responsive Custom SVG Line Chart */}
                    <div className="relative w-full h-[150px] mt-4">
                      <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="overflow-visible">
                        {/* Grids */}
                        <line x1="20" y1="15" x2={chartWidth - 20} y2="15" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />
                        <line x1="20" y1="55" x2={chartWidth - 20} y2="55" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />
                        <line x1="20" y1="95" x2={chartWidth - 20} y2="95" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />
                        
                        {/* Area gradient under path */}
                        <defs>
                          <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        
                        {svgPathStr && (
                          <>
                            {/* Area path */}
                            <path
                              d={`${svgPathStr} L ${points[points.length - 1].x} ${chartHeight - 15} L ${points[0].x} ${chartHeight - 15} Z`}
                              fill="url(#chart-area-grad)"
                            />
                            {/* Line path */}
                            <motion.path
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1 }}
                              d={svgPathStr}
                              fill="none"
                              stroke="url(#line-glow)"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                            />
                            
                            {/* Rainbow gradient on stroke for luxurious looks */}
                            <linearGradient id="line-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#818cf8" />
                              <stop offset="50%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#f59e0b" />
                            </linearGradient>
                          </>
                        )}

                        {/* Interactive dots plotting */}
                        {points.map((pt, index) => (
                          <g key={index} className="group/dot cursor-pointer">
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="5"
                              className="fill-slate-950 stroke-indigo-400 stroke-2 hover:r-7 transition-all"
                            />
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="10"
                              className="fill-indigo-500/10 group-hover/dot:fill-indigo-500/20 stroke-none transition-all"
                            />
                            
                            {/* Pop and hover state details */}
                            <text
                              x={pt.x}
                              y={pt.y - 12}
                              textAnchor="middle"
                              className="text-[9px] fill-emerald-400 font-bold font-mono opacity-0 group-hover/dot:opacity-100 transition-opacity bg-slate-900 py-1"
                            >
                              ฿{pt.sale.toLocaleString()}
                            </text>
                            
                            {/* Axis Label */}
                            <text
                              x={pt.x}
                              y={chartHeight - 2}
                              textAnchor="middle"
                              className="text-[9px] fill-slate-500 font-semibold"
                            >
                              {pt.label}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-900/30 p-3 rounded-xl border border-slate-900/60 mt-4">
                    <span className="text-[10px] text-slate-500 italic block">
                      *ยอดขายสรุปแบบสะสมเชิงเส้นตามเวลาจริง (Linear Accumulative Growth Metrics)
                    </span>
                    <button 
                      onClick={() => {
                        setActiveTab('sales');
                        // Show visual tip
                      }} 
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" /> ทดลองกรอกยอดซื้อขายสด
                    </button>
                  </div>
                </div>

                {/* Member Tiers Strategy Breakdown */}
                <div className="lg:col-span-5 bg-slate-950 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between min-h-[340px]">
                  <div>
                    <div className="flex items-center gap-2 pb-4 border-b border-slate-900 mb-4">
                      <PieIcon className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">สัดส่วนผู้แทนค้าจำหน่ายทั้งสิ้น</h4>
                        <p className="text-slate-500 text-[11px]">สัดส่วนร้อยละของสมาชิกผู้สำเร็จคุณสมบัติ 5 ระดับชั้น</p>
                      </div>
                    </div>

                    {/* Horizontal Visual Stack Bars */}
                    <div className="space-y-3.5 mt-5">
                      {Object.values(MemberTier).map((tier) => {
                        const count = tiersCount[tier] || 0;
                        const percent = totalMembersCount > 0 ? (count / totalMembersCount) * 100 : 0;
                        const config = TIER_CONFIG[tier];
                        
                        return (
                          <div key={tier} className="space-y-1">
                            <div className="flex justify-between text-xs items-center">
                              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                                <span className={`w-2 h-2 rounded-full bg-gradient-to-tr ${config.gradient}`} />
                                {tier} ({config.name})
                              </span>
                              <span className="text-slate-400 font-mono text-[11px]">
                                <strong>{count}</strong> คน ({percent.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-900/80 rounded-full overflow-hidden border border-slate-800/10">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 0.8 }}
                                className={`h-full bg-gradient-to-r ${config.gradient}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-950/15 border border-indigo-900/30 rounded-xl mt-4">
                    <div className="flex gap-2 text-xs">
                      <span className="text-base select-none">💎</span>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        <strong>กติกาพิเศษ</strong>: มุ่งสู่ตำแหน่ง <strong>Diamond</strong> เมื่อสะสมยอดขายส่วนตัวและกลุ่มทีมงานสะสมรวมแตะ ฿1,500,000 รับลิขสิทธิ์โบนัสส่วนแบ่งพูล 2% ทันที !
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* RECENT SALES AND COMMISSIONS LEDGER */}
              <div className="bg-slate-900/20 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-200">บันทึกธุรกรรมล่าสุดในสายงาน (Network Ledger Stream)</h3>
                    <p className="text-slate-500 text-xs">รายงานการซื้อขาย ค่าคอมมิชชัน และการปันผลสู่สมาชิกแบบสตรีมสด</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('sales')}
                    className="text-xs bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    + คีย์บิลขายเพิ่ม
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {transactions.slice(0, 6).map((tx) => (
                    <div key={tx.id} className="bg-slate-950/90 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] bg-slate-900 font-mono text-slate-500 py-0.5 px-1.5 rounded border border-slate-800">
                            บิล: {tx.id}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{tx.timestamp}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-2xl pt-1 bg-slate-900 p-2 rounded-xl">📱</span>
                          <div>
                            <strong className="text-slate-200 text-xs block">{tx.memberName}</strong>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              ซื้อขายเครื่อง: {tx.productName}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-900 pt-3 mt-4 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-slate-500 block">มูลค่าปิดบิลค้าปลีก</span>
                          <span className="text-sm font-bold text-slate-300 font-mono">฿{tx.amount.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-emerald-400 block">คอมมิชชันปันออกรวม</span>
                          <span className="text-sm font-extrabold text-emerald-400 font-mono">
                            +฿{tx.commissionDistributed.reduce((a, b) => a + b.amount, 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {transactions.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-600 text-sm">
                      บิลธุรกรรมของเครือข่ายว่างเปล่าอยู่ตอนนนี้ ลองขยับไปบันทึกสตรีมการขายที่แท็บด้านบน
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: INTERACTIVE NETWORK SPONSOR TREE */}
          {activeTab === 'network' && (
            <motion.div
              key="network-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <NetworkTree 
                members={members} 
                onSelectMember={handleSelectMemberForNetwork}
                onAddDownlineClick={handleAddDownlineClick}
              />
            </motion.div>
          )}

          {/* TAB 3: MEMBER DIRECTORY & REGISTRY */}
          {activeTab === 'members' && (
            <motion.div
              key="members-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MemberManager 
                members={members}
                onAddMember={handleAddMember}
                onEditMember={handleEditMember}
                onDeleteMember={handleDeleteMember}
                onSelectMember={handleSelectMemberForNetwork}
                sponsorSuggestId={sponsorForNewMember}
                onClearSponsorSuggest={() => setSponsorForNewMember(null)}
              />
            </motion.div>
          )}

          {/* TAB 4: REAL-TIME COMMISSIONS SALES SIMULATOR */}
          {activeTab === 'sales' && (
            <motion.div
              key="sales-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SalesSimulator 
                members={members}
                products={products}
                transactions={transactions}
                onRecordSale={handleRecordSale}
                onResetSales={handleResetSales}
              />
            </motion.div>
          )}

          {/* TAB 5: PRODUCTS REFERENCE COLLECTION GRAPHICS */}
          {activeTab === 'showcase' && (
            <motion.div
              key="showcase-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                  <Smartphone className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100 tracking-tight">โบรชัวร์รุ่นมือถือและคะแนนทางธุรกิจ (Business Volume)</h2>
                  <p className="text-slate-400 text-sm">ลิสต์สมาร์ตโฟนยอดฮิตสำหรับการขายส่งดิ่งระดับ พร้อมแสดงค่าแต้มสะสมบิลเพื่อคิดพาร์ทคอมมิชชันสะสม</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((prod) => (
                  <div key={prod.id} className="bg-slate-950 border border-slate-850 hover:border-slate-700/60 p-6 rounded-2xl transition-all duration-200 flex flex-col justify-between group">
                    <div>
                      {/* Interactive stylized simulated image box */}
                      <div className={`w-full h-40 rounded-xl bg-gradient-to-br ${prod.color} flex items-center justify-center text-6xl shadow-inner relative overflow-hidden mb-4 select-none`}>
                        <div className="absolute inset-0 bg-slate-950/20 mix-blend-overlay" />
                        <span className="transform group-hover:scale-110 transition-transform duration-300">{prod.image}</span>
                        
                        <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-indigo-400 font-mono tracking-wider border border-indigo-500/10">
                          {prod.brand.toUpperCase()}
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">สมาร์ตโฟนเรืองธง ประกันศูนย์แท้ 1 ปีเต็ม รองรับสัญญาณเครือข่าย 5G เต็มสปีด</p>
                    </div>

                    <div className="mt-6 border-t border-slate-900 pt-4 flex justify-between items-center mb-3">
                      <div>
                        <span className="text-[10px] text-slate-500 block">ราคาจำหน่ายปลีกทอง</span>
                        <strong className="text-lg font-bold text-slate-100 font-mono">฿{prod.price.toLocaleString()}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-indigo-400 block">คะแนนยอดขายแนะนำ</span>
                        <strong className="text-sm font-extrabold text-emerald-400 font-mono">{prod.bv.toLocaleString()} BV</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuyNowTrigger(prod)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-500 hover:to-indigo-650 text-white font-extrabold text-xs transition-all duration-200 cursor-pointer active:scale-95 shadow-md shadow-indigo-505/10 flex items-center justify-center gap-1.5"
                    >
                      <Smartphone className="w-3.5 h-3.5" /> สั่งซื้อสินค้า / ซื้อเลย
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900/20 p-5 rounded-xl border border-slate-800/80 max-w-2xl mx-auto text-center space-y-3">
                <HeartHandshake className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-200">วิธีคำนวณยอดกลุ่มสะสมและส่วนแบ่งคอมมิชชัน</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                  เมื่อสมาชิกใต้สายงานของคุณคีย์ปิดบิลสินค้าจากโบรชัวร์รุ่นมือถือใดยอดขายบิลปลีกทั้งหมดจะคิดคะแนนเข้าทีมงาน (Group Sales) ดิ่งลอยขึ้นสู่อัพไลน์ทั้งหมด 100% ครบวงจรอัตโนมัติ
                </p>
              </div>
            </motion.div>
          )}

          {/* TAB 6: NOTIFICATIONS MANAGEMENT CENTER */}
          {activeTab === 'notifications' && (
            <motion.div
              key="notifications-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Header Box */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-505/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                    <Mail className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-101 tracking-tight">ระบบจัดส่งการแจ้งเตือนออเดอร์ (Notification Hub)</h2>
                    <p className="text-slate-400 text-sm">อัปเกรดความเร็วระดับ VIP แทนระบบ LINE Notify เดิม ส่งตรงรายงานยอดออเดอร์และใบปลูกแต้มสมาชิกเข้าสู่ระบบข้อความส่วนตัวและเมล</p>
                  </div>
                </div>
                <div className="bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                  ● Status: ดำเนินงานพร้อมใช้งานจริง 100%
                </div>
              </div>

              {/* Grid with Details and Configuration */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                
                {/* Manual testing section (Col-5) */}
                <div className="lg:col-span-5 bg-slate-950 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-900 pb-2">
                      🧪 แผงคีย์จำลองส่งข้อความออเดอร์ (Live Testing)
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      กดจำลองเหตุการณ์ส่งสัญญาณออเดอร์เพื่อตรวจสอบว่าระบบอีเมลและ LINE ยิงเชื่อมต่อเข้าปลายทางสำเร็จหรือไม่
                    </p>

                    <form onSubmit={handleTriggerManualNotificationTest} className="space-y-3">
                      <div>
                        <label className="block text-[10px] text-slate-450 uppercase font-mono mb-1 font-bold">ชื่อลูกค้าผู้สั่งซื้อ</label>
                        <input
                          type="text"
                          required
                          value={testCustName}
                          onChange={(e) => setTestCustName(e.target.value)}
                          placeholder="เช่น คุณ สมชาย ไพศาล"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-450 uppercase font-mono mb-1 font-bold">เบอร์โทรศัพท์มือถือ</label>
                        <input
                          type="text"
                          required
                          value={testCustPhone}
                          onChange={(e) => setTestCustPhone(e.target.value)}
                          placeholder="เช่น 089-123-4567"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-450 uppercase font-mono mb-1 font-bold">เลือกประเภทสินค้าที่ต้องการจำลองออเดอร์</label>
                        <select
                          value={testProductIdx}
                          onChange={(e) => setTestProductIdx(parseInt(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-600"
                        >
                          {products.map((prod, idx) => (
                            <option key={prod.id} value={idx}>
                              {prod.name} (฿{prod.price.toLocaleString()} | {prod.bv} BV)
                            </option>
                          ))}
                        </select>
                      </div>

                      {testStatusMsg && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300 font-mono leading-relaxed select-text">
                          {testStatusMsg}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={testIsSending}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs transition duration-200 cursor-pointer disabled:opacity-50"
                      >
                        {testIsSending ? 'กำลังยิงสัญญาณ...' : '🚀 ยิงส่งรายงานสรุปยอดเข้า pnmall4u@gmail.com'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Info summary section (Col-7) */}
                <div className="lg:col-span-7 bg-slate-950 border border-slate-850 p-6 rounded-2xl space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-900 pb-2">
                       🛠️ รายละเอียดพารามิเตอร์การวางระบบสื่อสาร
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Delivery target */}
                      <div className="flex items-start gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400 font-bold text-xs">A</div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-slate-200 block">อีเมลสรุปคำสั่งซื้อตัวจริง (Inbox Receiver)</span>
                          <span className="text-xs text-emerald-400 font-mono select-all">pnmall4u@gmail.com</span>
                          <span className="text-[10px] text-slate-500 block leading-relaxed mt-1">ระบบจัดพาสสรุปยอดยังปลายทางโดยตรง (ฟังก์ชัน FormSubmit ไฮบริดดักรับปลายทาง 100% เรียบร้อย)</span>
                        </div>
                      </div>

                      {/* Custom credentials info */}
                      <div className="flex items-start gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 font-bold text-xs">B</div>
                        <div className="text-left space-y-1">
                          <span className="text-xs font-bold text-slate-200 block">โครงขยาย custom ผ่าน EmailJS สำหรับแบรนดิ้งคุณพี่</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-[9px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400 font-mono inline-block">VITE_EMAILJS_SERVICE_ID</span>
                            <span className="text-[9px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400 font-mono inline-block">VITE_EMAILJS_TEMPLATE_ID</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal pt-1">
                            สามารถลงทะเบียนตัวละครของตัวเองจาก EmailJS นำมาสวมทับที่ไฟล์ `.env` ได้ทันที โค้ดของ Phonetwork รองรับการแปลงร่างเป็นของส่วนตัวของคุณพี่อย่างไร้ความกังวล
                          </p>
                        </div>
                      </div>

                      {/* Line Webhook skeleton info */}
                      <div className="flex items-start gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-500 font-bold text-xs">C</div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-slate-200 block">ระบบส่งไลน์ Messaging API Webhook</span>
                          <span className="text-[10px] text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded border border-amber-500/10 font-mono">https://api.line.me/v2/bot/message/push</span>
                          <p className="text-[10px] text-slate-500 leading-normal mt-1.5">
                            พัฒนาโครงสร้างชุดข้อความ Flex Message คลุมด้วยรหัสความปลอดภัย OAuth Bearer Token เรียบร้อยแล้ว หากมีบัญชี LINE OA สามารถนำ Channel Access Token มาใส่เพื่อปล่อยสัญญาณสดได้เลย
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Logs database history list */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 space-y-4 text-left">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                      📊 ประวัติสัญญาณการจัดส่งสรุปข้อมูลออเดอร์ในเซสชันนี้
                    </h3>
                    <p className="text-xs text-slate-500">
                      แสดงรายการล็อกบันทึกเวลามีการยิงส่งแจ้งเตือนสำเร็จ (จะรีเซ็ตเมื่อปิดเบราว์เซอร์หรือปิดแท็บ)
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      safeSessionStorage.removeItem('phonetwork_notification_logs');
                      setNotificationLogs([]);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-800 rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    🧹 ล้างประวัติล็อก
                  </button>
                </div>

                {notificationLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 space-y-2">
                    <Info className="w-8 h-8 mx-auto text-indigo-400/60" />
                    <p className="text-xs font-bold">ยังไม่มีข้อมูลแจ้งเตือนที่ยิงสัญญาณสั่งงานในเที่ยวนี้</p>
                    <p className="text-[11px] text-slate-600">กรุณาลองกดคีย์ซื้อของในหน้าร้านค้า หรือใช้แผงด้านบนกด ทดสอบส่งยอดด่วนระบบ</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-400 uppercase font-mono text-[10px] h-9">
                          <th className="text-left font-bold pb-2">เวลาจัดส่ง</th>
                          <th className="text-left font-bold pb-2">คุณลูกค้า</th>
                          <th className="text-left font-bold pb-2">สินค้า</th>
                          <th className="text-right font-bold pb-2">ยอดวงเงินประเมิน</th>
                          <th className="text-center font-bold pb-2">อีเมลส่ง pnmall4u@gmail.com</th>
                          <th className="text-center font-bold pb-2">ระบบส่ง LINE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60 font-mono">
                        {notificationLogs.map((log, index) => (
                          <tr key={index} className="h-11 hover:bg-slate-900/20 text-slate-300">
                            <td className="text-left text-slate-500 font-bold">{log.timestamp}</td>
                            <td className="text-left font-sans font-medium text-slate-100">คุณ {log.customerName} ({log.customerPhone})</td>
                            <td className="text-left text-slate-300 font-sans">{log.product}</td>
                            <td className="text-right text-amber-450 font-bold">฿{log.amount?.toLocaleString()}</td>
                            <td className="text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                log.emailStatus === 'SENT' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
                              }`}>
                                {log.emailStatus === 'SENT' ? `${log.emailChannel}` : 'ล้มเหลว'}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="px-2 py-0.5 rounded text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                                {log.lineStatus === 'SENT' ? 'ส่งสำเร็จ (OA)' : 'พาสพารามเสร็จ'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {activeTab === 'sheets' && (
            <motion.div
              key="sheets-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SheetsManager 
                products={products}
                setProducts={setProducts}
                setTickerMessage={setTickerMessage}
              />
            </motion.div>
          )}

            </div>
          )}

        </AnimatePresence>
      </main>

      {/* 4. FOOTER CREDITS */}
      <footer className="border-t border-slate-900 mt-16 bg-slate-950/80 backdrop-blur-md py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Phonetwork Enterprise. สงวนลิขสิทธิ์ทั้งหมด</p>
          <p className="font-mono text-[10px] text-slate-650">ระบบจำลองสายงานขยายเครือข่ายและเกื้อกูลยอดขาย Binary 100%</p>
        </div>
      </footer>

      <AnimatePresence>
        {/* LOGIN MODAL */}
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            {/* Window */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 relative z-10 shadow-2xl overflow-hidden"
            >
              {/* Decorative light peak */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
              
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                    <LogIn className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-101 tracking-tight">เข้าสู่สายงานระบบ</h3>
                    <p className="text-[11px] text-slate-500 font-medium">ป้อนรหัสเพื่อจำลองการเข้ารหัสต้นสาย</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLoginModalOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {authError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-500 text-xs flex items-start gap-2 mb-4">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthLoginSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider font-mono">เบอร์โทรศัพท์ประจำตัว</label>
                  <input
                    type="tel"
                    required
                    placeholder="เช่น 0812345678"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/85 rounded-xl px-3.5 py-2.5 text-xs text-slate-101 placeholder:text-slate-650 focus:outline-none focus:border-indigo-600 transition"
                  />
                  <p className="text-[10px] text-slate-600 mt-1 font-mono">สามารถใช้เบอร์ที่มีในระบบทดสอบได้ทันที</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider font-mono">รหัสผ่านลับ (Password)</label>
                  <input
                    type="password"
                    required
                    placeholder="ป้อนรหัสความปลอดภัยจำลอง"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/85 rounded-xl px-3.5 py-2.5 text-xs text-slate-101 placeholder:text-slate-650 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition duration-200 cursor-pointer active:scale-95 shadow-md shadow-indigo-600/15 flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" /> ตรวจสอบสายงาน & ตกลงเข้าใช้
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-800/60 text-center">
                <span className="text-[11px] text-slate-550">ยังไม่มีผังสายงานในระบบใช่ไหม? </span>
                <button
                  onClick={() => {
                    setIsLoginModalOpen(false);
                    setAuthError('');
                    setIsRegisterModalOpen(true);
                  }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-extrabold cursor-pointer"
                >
                  คลิกที่นี่เพื่อสมัครสมาชิกใหม่
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* REGISTER MODAL */}
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsRegisterModalOpen(false);
                setRegisterSuccess(false);
                setJustRegisteredMember(null);
                setAuthError('');
              }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            {/* Window */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
              
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-101 tracking-tight">
                      {registerSuccess ? 'สมทบสายงานสำเร็จ!' : 'ขึ้นทะเบียนสมทบสายงาน'}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {registerSuccess ? 'สรุปข้อมูลขึ้นทะเบียนเรียบร้อย' : 'สมัครแนะนำตรงและสืบสายสปอนเซอร์'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsRegisterModalOpen(false);
                    setRegisterSuccess(false);
                    setJustRegisteredMember(null);
                    setAuthError('');
                  }}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {registerSuccess && justRegisteredMember ? (
                <div className="space-y-4.5 text-center animate-fade-in text-slate-200">
                  <div className="w-14 h-14 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/35 shadow-lg shadow-emerald-500/10">
                    <CheckCircle className="w-8 h-8 animate-bounce" />
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-emerald-450 tracking-tight">ขึ้นทะเบียนข้อมูลลงผังเรียบร้อย!</h4>
                    <p className="text-[10.5px] text-slate-400 leading-normal px-2">
                      ระบบได้จัดสิทธิ์เกื้อกูลยอดขายและคอมมิชชันทีมให้เรียลไทม์แล้ว
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 text-left space-y-2.5">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-900/85">
                      <span className="text-[9.5px] uppercase font-bold text-slate-500 font-mono tracking-widest">พาร์ทเนอร์ลงทะเบียน</span>
                      <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase">
                        {justRegisteredMember.tier}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-1.5 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-550 block">รหัสสาขาของคุณ</span>
                        <strong className="font-mono font-black text-slate-200 block truncate">{justRegisteredMember.id}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-550 block">เบอร์รหัสล็อกอิน</span>
                        <strong className="font-mono font-black text-slate-200 block truncate">{justRegisteredMember.phone}</strong>
                      </div>
                      <div className="col-span-2 border-t border-slate-900/60 pt-1.5">
                        <span className="text-[10px] text-slate-550 block">ชื่อพาร์ทเนอร์</span>
                        <span className="font-bold text-indigo-300 text-[13px]">{justRegisteredMember.name}</span>
                      </div>
                      <div className="col-span-2 border-t border-slate-900/60 pt-1.5">
                        <span className="text-[10px] text-slate-550 block">ผู้แนะนำสปอนเซอร์</span>
                        <span className="font-mono text-[11px] text-amber-500 font-semibold">
                          {justRegisteredMember.sponsorId ? `คุณ ${justRegisteredMember.sponsorId}` : 'สายหลักตรงเดี่ยว (Root Direct)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Electronic Notification Slip */}
                  <div className="bg-gradient-to-r from-slate-950 to-indigo-950/10 border border-indigo-500/10 p-3.5 rounded-xl text-left space-y-2">
                    <div className="flex items-center gap-1.5 text-indigo-400">
                      <Mail className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wider font-mono">ยืนยันจัดส่งอีเมลแจ้งสิทธิ์</span>
                    </div>
                    <p className="text-[10.5px] text-slate-450 leading-relaxed font-sans">
                      📧 ระบบ Phonetwork ได้ดำเนินการจัดส่งอีเมลแจ้งสิทธิ์สายงานและใบจัดสายผู้แนะนำตอบรับอัตโนมัติ ไปยังเมลของแอดมินหลัก (<strong className="text-slate-300 select-all font-mono font-normal">pnmall4u@gmail.com</strong>) และระบบผู้แนะนำเพื่อยืนยันเครือข่ายเรียบร้อยแล้ว!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterModalOpen(false);
                      setRegisterSuccess(false);
                      setJustRegisteredMember(null);
                      setAuthError('');
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-650 to-indigo-800 hover:from-indigo-600 hover:to-indigo-700 text-white font-extrabold text-xs transition duration-200 cursor-pointer text-center active:scale-95 shadow-md shadow-indigo-650/10"
                  >
                    ตกลง / เข้าสู่บอร์ดทำงานของฉัน
                  </button>
                </div>
              ) : (
                <>
                  {referredSponsor && (
                    <div className="bg-amber-500/10 border border-amber-500/15 text-amber-500 p-4 rounded-xl text-xs mb-4 flex items-start gap-2 text-left leading-relaxed">
                      <span className="text-base shrink-0">🎯</span>
                      <div>
                        <p className="font-extrabold">สมัครภายใต้รหัสแนะนำ:</p>
                        <p className="text-[11px] text-amber-500/90 font-medium font-sans">
                          คุณ <strong>{referredSponsor.name}</strong> ({referredSponsor.tier} | Sponsor ID: {referredSponsor.id}) ระบบตรวจจับ URL แนะนำอัตโนมัติสำเร็จ
                        </p>
                      </div>
                    </div>
                  )}

                  {authError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-500 text-xs flex items-start gap-2 mb-4">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <form onSubmit={handleAuthRegisterSubmit} className="space-y-4 text-left">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider font-mono">ชื่อ-นามสกุลจริงของคุณ</label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น คุณธราดล รักษ์ดี"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-101 placeholder:text-slate-650 focus:outline-none focus:border-indigo-600 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider font-mono">เบอร์โทรติดต่อ (ใช้แทนรหัสล็อกอิน)</label>
                      <input
                        type="tel"
                        required
                        placeholder="เช่น 0841234567"
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-101 placeholder:text-slate-650 focus:outline-none focus:border-indigo-600 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider font-mono">รหัสผ่านล็อกอินจัดสายงาน</label>
                      <input
                        type="password"
                        required
                        placeholder="ป้อนรหัสความปลอดภัยจริง"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-101 placeholder:text-slate-650 focus:outline-none focus:border-indigo-600 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider font-mono">รหัสอัพไลน์ผู้แนะนำเดิม (Sponsor ID)</label>
                      <input
                        type="text"
                        placeholder="เว้นว่างได้ หรือระบุ m1, m2 หรือ ID อื่นๆ"
                        value={registerSponsorId}
                        onChange={(e) => setRegisterSponsorId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-101 placeholder:text-slate-650 focus:outline-none focus:border-indigo-600 transition font-mono"
                      />
                      <p className="text-[10px] text-slate-600 mt-1">หากละเว้นไว้คุณจะเป็นนักสถิติต้นสายเดี่ยวหลัก (Root Direct Creator)</p>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs transition duration-200 cursor-pointer active:scale-95 shadow-md shadow-emerald-505/10 flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> ลงผังเกณฑ์สายงานและสมรสยอดขาย
                    </button>
                  </form>

                  <div className="mt-5 pt-4 border-t border-slate-800/60 text-center">
                    <span className="text-[11px] text-slate-550">เคยขึ้นทะเบียนผังแล้วใช่ไหม? </span>
                    <button
                      onClick={() => {
                        setIsRegisterModalOpen(false);
                        setAuthError('');
                        setIsLoginModalOpen(true);
                      }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-extrabold cursor-pointer"
                    >
                      คลิกเข้าสู่ระบบได้เลย
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}

        {/* ORDER / CHECKOUT MODAL */}
        {isOrderModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOrderModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            {/* Window */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl overflow-hidden text-left"
            >
              {/* Top gradient peak bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-pink-500 to-amber-500" />
              
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                    <Smartphone className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-100 tracking-tight">สั่งซื้อดิ่งเปิดบิลสะสมค่าทีม</h3>
                    <p className="text-[11px] text-slate-500 font-medium">บันทึกใบสั่งซื้อพร้อมจัดสิทธิ์คอมมิชชันแนะแนวเรียลไทม์</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOrderModalOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {orderSuccess ? (
                <div className="py-6 text-center space-y-5 animate-fade-in text-slate-200">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                    <CheckCircle className="w-10 h-10 animate-bounce" />
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-base font-extrabold text-emerald-400 tracking-tight">สั่งซื้อสำเร็จ!</h4>
                    <p className="text-xs text-slate-400 px-2 leading-relaxed">
                      กรุณาโอนเงินชำระค่าสินค้ามาที่ พร้อมเพย์ เพื่อดำเนินการคีย์รับและบันทึกสายงานจัดสิทธิ์ผลประโยชน์แนะแนวเรียลไทม์
                    </p>
                  </div>

                  {/* Payment Details Card */}
                  <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-850/80 text-left space-y-3.5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
                    
                    <div className="flex justify-between items-center animate-pulse">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">ช่องทางการชำระเงิน</span>
                      <span className="text-[10px] font-black text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-400/20 font-sans">
                        พร้อมเพย์ (PromptPay)
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 block leading-none">เลขที่บัญชี / เบอร์โทรศัพท์</span>
                      <div className="flex justify-between items-center gap-2">
                        <strong className="text-lg font-black text-amber-400 font-mono tracking-wider selection:bg-amber-400 selection:text-slate-950">
                          081-160-1092
                        </strong>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('081-160-1092');
                            setCopiedAccount(true);
                            setTimeout(() => setCopiedAccount(false), 2000);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-indigo-400 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          {copiedAccount ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span>คัดลอกสำเร็จ!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>คัดลอกเลขบัญชี</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-900/80 pt-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block leading-none mb-1">ชื่อบัญชีผู้รับโอน</span>
                        <span className="font-semibold text-slate-200">คุณ ไวพจน์ โสมภา</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block leading-none mb-1">ยอดเงินโอนสะสม</span>
                        <strong className="text-xs font-bold text-slate-100 font-mono">
                          ฿{(selectedProduct.price * orderQuantity).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-normal px-2">
                    💡 ระบบเครือข่าย Phonetwork ได้ต่อแต้มสะสม <span className="text-emerald-400 font-bold font-mono">{(selectedProduct.bv * orderQuantity).toLocaleString()} BV</span> เข้าสายงานของท่าน เรียบร้อยแล้ว
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOrderModalOpen(false);
                        setSelectedProduct(null);
                        setOrderSuccess(false);
                        setCopiedAccount(false);
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-500 hover:to-indigo-650 text-white font-extrabold text-xs transition duration-200 cursor-pointer active:scale-95 text-center"
                    >
                      ตกลง / ปิดหน้าต่างนี้
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePlaceOrderSubmit} className="space-y-4">
                  {/* Selected Product overview card */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedProduct.color} flex items-center justify-center text-3xl shrink-0`}>
                      {selectedProduct.image}
                    </div>
                    <div>
                      <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest font-mono block leading-none">{selectedProduct.brand}</span>
                      <h4 className="text-xs font-extrabold text-slate-100 mt-1">{selectedProduct.name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">฿{selectedProduct.price.toLocaleString()} | {selectedProduct.bv} BV / ชิ้น</p>
                    </div>
                  </div>

                  {orderError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-500 text-xs flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{orderError}</span>
                    </div>
                  )}

                  {/* Quantity and Member attribution choice */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 mb-1.5 uppercase font-mono tracking-wider">จำนวนเครื่องที่สั่งซื้อ</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        required
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-650 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 mb-1.5 uppercase font-mono tracking-wider">จับบิลสะสมให้กับ</label>
                      <select
                        value={orderMemberId}
                        onChange={(e) => setOrderMemberId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-660"
                      >
                        <option value="">-- เลือกสมาชิก --</option>
                        {currentUser && (
                          <option value={currentUser.id}>ชื่อคุณเอง: {currentUser.name} ({currentUser.id})</option>
                        )}
                        {members.filter(m => currentUser ? m.id !== currentUser.id : true).map(m => (
                          <option key={m.id} value={m.id}>คุณ {m.name} ({m.id} | {m.tier})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Address Text Area */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" /> ข้อมูลและที่อยู่สำหรับใช้จัดส่งตัวเครื่องจริง
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="กรุณากรอกชื่อผู้รับ เบอร์โทรศัพท์ และที่อยู่จัดส่งให้ครบถ้วน..."
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-101 placeholder:text-slate-650 focus:outline-none focus:border-indigo-600 transition"
                    />
                  </div>

                  {/* Final Calculation Block */}
                  <div className="bg-indigo-950/20 rounded-2xl border border-indigo-950/40 p-3.5 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>ราคารวมโทรศัพท์มือถือ ({orderQuantity} เครื่อง):</span>
                      <strong className="font-mono text-slate-200 font-bold">฿{(selectedProduct.price * orderQuantity).toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>คะแนนแนะแนวทอดสายส่ง (+):</span>
                      <strong className="font-mono text-emerald-400 font-extrabold">{(selectedProduct.bv * orderQuantity).toLocaleString()} BV</strong>
                    </div>
                    <div className="border-t border-slate-800/60 pt-2 flex justify-between text-xs items-center">
                      <span className="text-slate-300 font-bold">ยอดจำหน่ายพร้อมจัดบิลเก็บเงินปลายทาง:</span>
                      <span className="font-mono text-amber-400 font-bold text-sm bg-amber-400/5 px-2.5 py-1 rounded-lg border border-amber-500/10">
                        ฿{(selectedProduct.price * orderQuantity).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsOrderModalOpen(false)}
                      className="w-1/3 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 hover:text-white border border-slate-800 text-slate-450 text-xs font-bold transition cursor-pointer"
                    >
                      ยกเลิกรายการ
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-500 hover:to-indigo-650 text-white font-extrabold text-xs transition duration-200 cursor-pointer active:scale-95 shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" /> ยืนยันการสั่งซื้อชำระเงิน
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

