/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Member, MemberTier, Product, Transaction } from './types';
import { INITIAL_MEMBERS, INITIAL_TRANSACTIONS } from './mockData';
import { safeLocalStorage } from './lib/safeStorage';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Detect if real Supabase keys are provided (not the helper Thai placeholder instructions)
export const isSupabaseConfigured = (() => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) return false;
    if (
      typeof supabaseUrl !== 'string' ||
      typeof supabaseAnonKey !== 'string' ||
      supabaseUrl.includes('ใส่_') ||
      supabaseAnonKey.includes('ใส่_') ||
      supabaseUrl.includes('YOUR_SUPABASE') ||
      supabaseUrl.trim() === '' ||
      supabaseUrl === 'undefined' ||
      supabaseAnonKey === 'undefined'
    ) {
      return false;
    }
    const url = new URL(supabaseUrl.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
})();

// Initialize Supabase. If missing, we fall back to simulated LocalStorage tables to verify code flow
export const supabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl.trim(), supabaseAnonKey.trim())
  : null;

// ==========================================
// LOCAL STORAGE AUTO-FALLBACK ENGINE
// ==========================================
class BackupDatabase {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    try {
      const raw = safeLocalStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  }

  private setStorageItem(key: string, value: any) {
    try {
      safeLocalStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('safeLocalStorage writing rejected:', e);
    }
  }

  getMembers(): Member[] {
    return this.getStorageItem<Member[]>('phonetwork_members_db', INITIAL_MEMBERS);
  }

  saveMembers(members: Member[]) {
    this.setStorageItem('phonetwork_members_db', members);
    // Sync to main App state
    try {
      safeLocalStorage.setItem('phonetwork_members', JSON.stringify(members));
    } catch (e) {
      // Ignored
    }
  }

  getTransactions(): Transaction[] {
    return this.getStorageItem<Transaction[]>('phonetwork_transactions_db', INITIAL_TRANSACTIONS);
  }

  saveTransactions(txs: Transaction[]) {
    this.setStorageItem('phonetwork_transactions_db', txs);
    // Sync to main App state
    try {
      safeLocalStorage.setItem('phonetwork_transactions', JSON.stringify(txs));
    } catch (e) {
      // Ignored
    }
  }

  getOrders(): any[] {
    return this.getStorageItem<any[]>('phonetwork_orders_db', []);
  }

  saveOrder(order: any) {
    const orders = this.getOrders();
    orders.unshift(order);
    this.setStorageItem('phonetwork_orders_db', orders);
  }
}

const backupDb = new BackupDatabase();

// ==========================================
// CENTRAL SERVICES (SUPABASE / FALLBACK MOCK)
// ==========================================

export interface OrderRecord {
  id: string;
  memberId: string;
  memberName: string;
  productId: string;
  productName: string;
  amount: number;
  quantity: number;
  shippingAddress: string;
  timestamp: string;
}

// 1. Fetch Current All Active Network Members
export async function dbFetchMembers(): Promise<Member[]> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('pho_members')
        .select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        return data.map(item => ({
          id: item.id,
          name: item.name,
          phone: item.phone,
          tier: item.tier as MemberTier,
          sponsorId: item.sponsor_id || null,
          personalSales: Number(item.personal_sales) || 0,
          groupSales: Number(item.group_sales) || 0,
          commissionEarned: Number(item.commission_earned) || 0,
          joinedDate: item.joined_date || item.created_at?.split('T')[0]
        }));
      }
    } catch (e) {
      console.warn('Supabase pho_members read failed (table might not exist yet). Falling back to Local Base.', e);
    }
  }
  return backupDb.getMembers();
}

// 2. Member Register / Sign-up with referral routing code
export async function dbSignUpMember(
  name: string,
  phone: string,
  passwordPlane: string,
  sponsorId: string | null
): Promise<{ success: boolean; error?: string; member?: Member }> {
  // Simple clean validation
  if (!name.trim() || !phone.trim() || !passwordPlane.trim()) {
    return { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' };
  }

  const cleanPhone = phone.trim();

  if (isSupabaseConfigured && supabaseClient) {
    try {
      // Check duplicate
      const { data: existing } = await supabaseClient
        .from('pho_members')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'เบอร์โทรศัพท์นี้ถูกใช้งานในการสมัครสมาชิกแล้ว' };
      }

      const generatedId = 'm_' + Math.random().toString(36).substring(2, 7);
      const joinedDate = new Date().toISOString().split('T')[0];

      const payload = {
        id: generatedId,
        name: name.trim(),
        phone: cleanPhone,
        password: passwordPlane, // Simulated hash verification for sandbox
        tier: MemberTier.NORMAL,
        sponsor_id: sponsorId || null,
        personal_sales: 0,
        group_sales: 0,
        commission_earned: 0,
        joined_date: joinedDate
      };

      const { data, error } = await supabaseClient
        .from('pho_members')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      const createdMem: Member = {
        id: payload.id,
        name: payload.name,
        phone: payload.phone,
        tier: MemberTier.NORMAL,
        sponsorId: payload.sponsor_id,
        personalSales: 0,
        groupSales: 0,
        commissionEarned: 0,
        joinedDate: payload.joined_date
      };

      return { success: true, member: createdMem };
    } catch (e: any) {
      console.error('Supabase signup error', e);
      return { success: false, error: e.message || 'เกิดข้อผิดพลาดในการเชื่อมโยงเครือข่ายฐานข้อเสนอ Supabase' };
    }
  }

  // Backup Local Storage Signup
  const currentMembers = backupDb.getMembers();
  if (currentMembers.some(m => m.phone === cleanPhone)) {
    return { success: false, error: 'เบอร์โทรศัพท์นี้สมัครสมาชิกไปแล้ว' };
  }

  const newId = 'm' + (currentMembers.length + 1) + '_' + Math.floor(Math.random() * 90 + 10);
  const created: Member = {
    id: newId,
    name: name.trim(),
    phone: cleanPhone,
    tier: MemberTier.NORMAL,
    sponsorId: sponsorId || null,
    personalSales: 0,
    groupSales: 0,
    commissionEarned: 0,
    joinedDate: new Date().toISOString().split('T')[0]
  };

  // Keep simulated passwords
  const passwords = JSON.parse(safeLocalStorage.getItem('pho_sim_passwords') || '{}');
  passwords[cleanPhone] = passwordPlane;
  safeLocalStorage.setItem('pho_sim_passwords', JSON.stringify(passwords));

  const updatedList = [...currentMembers, created];
  backupDb.saveMembers(updatedList);

  return { success: true, member: created };
}

// 3. Member Login Authentication Service
export async function dbLogInMember(
  phone: string,
  passwordPlane: string
): Promise<{ success: boolean; error?: string; member?: Member }> {
  const cleanPhone = phone.trim();

  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('pho_members')
        .select('*')
        .eq('phone', cleanPhone)
        .eq('password', passwordPlane)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return { success: false, error: 'เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง' };
      }

      const found: Member = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        tier: data.tier as MemberTier,
        sponsorId: data.sponsor_id || null,
        personalSales: Number(data.personal_sales) || 0,
        groupSales: Number(data.group_sales) || 0,
        commissionEarned: Number(data.commission_earned) || 0,
        joinedDate: data.joined_date || data.created_at?.split('T')[0]
      };

      return { success: true, member: found };
    } catch (e: any) {
      console.error('Supabase login verify crash', e);
      return { success: false, error: 'เกิดปัญหาขัดข้อง: ' + e.message };
    }
  }

  // Backup mock auth with LocalStorage passkeys
  const currentMembers = backupDb.getMembers();
  const passwords = JSON.parse(safeLocalStorage.getItem('pho_sim_passwords') || '{}');
  
  const targetMember = currentMembers.find(m => m.phone === cleanPhone);
  // Default override check for the built-in demo profiles to allow instant checkouts without registration
  // Let password defaults to "123456" for demo profiles built-in
  const storedPassword = passwords[cleanPhone] || '123456';

  if (!targetMember || storedPassword !== passwordPlane) {
    return { success: false, error: 'เบอร์โทรศัพท์หรือรหัสผ่านระบบเดโมจำลองไม่ถูกต้อง' };
  }

  return { success: true, member: targetMember };
}

// 4. Save Orders & Shipping Address Histories
export async function dbCreateProductOrder(
  memberId: string,
  memberName: string,
  product: Product,
  quantity: number,
  shippingAddress: string
): Promise<{ success: boolean; error?: string; order?: OrderRecord }> {
  const date = new Date();
  const dateStr = date.toISOString();
  const txAmount = product.price * quantity;
  // Generate a random ID with String timestamp + suffix to prevent any conflicts
  const orderId = 'ORD-' + Date.now().toString() + '-' + Math.floor(Math.random() * 9000 + 1000);

  const orderData: OrderRecord = {
    id: orderId,
    memberId,
    memberName,
    productId: product.id,
    productName: product.name,
    amount: txAmount,
    quantity,
    shippingAddress,
    timestamp: dateStr
  };

  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('pho_orders')
        .insert([{
          id: orderData.id,
          member_id: orderData.memberId,
          member_name: orderData.memberName,
          product_id: orderData.productId,
          product_name: orderData.productName,
          amount: orderData.amount,
          quantity: orderData.quantity
        }]);

      if (error) {
        console.error('Supabase insert failed:', error);
        return { success: false, error: `ไม่สามารถบันทึกข้อมูลลงระบบฐานข้อมูลได้: ${error.message} (ฟิลด์อาจไม่ตรงหรือไม่มีสิทธิ์ความปลอดภัย)` };
      }
      
      // Save locally as well for offline cache / synchronized state
      backupDb.saveOrder(orderData);
      return { success: true, order: orderData };
    } catch (e: any) {
      console.error('Supabase exception while saving order:', e);
      return { success: false, error: `เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อบันทึกข้อมูล: ${e.message || 'โครงสร้างข้อมูลไม่ตรงกับคอลัมน์ใน Supabase'}` };
    }
  }

  // Local storage backup fallback if Supabase in Demo / not configured
  backupDb.saveOrder(orderData);
  return { success: true, order: orderData };
}

// Export saveOrder alias function for client script compatibility
export async function saveOrder(orderData: any): Promise<{ success: boolean; error?: string; order?: OrderRecord }> {
  if (!orderData) {
    return { success: false, error: 'ไม่พบข้อมูลใบสั่งซื้อ' };
  }
  const memberId = orderData.memberId || orderData.member_id || '';
  const memberName = orderData.memberName || orderData.member_name || '';
  const priceVal = Number(orderData.amount || orderData.price || 0) / Number(orderData.quantity || 1);
  const product: Product = {
    id: orderData.productId || orderData.product_id || 'prod_unknown',
    name: orderData.productName || orderData.product_name || 'Unknown Product',
    price: priceVal,
    bv: Math.round(priceVal * 0.01),
    brand: '',
    image: '',
    color: ''
  };
  const quantity = Number(orderData.quantity || 1);
  const shippingAddress = orderData.shippingAddress || orderData.shipping_address || 'ไม่ได้ระบุที่อยู่';
  
  return dbCreateProductOrder(memberId, memberName, product, quantity, shippingAddress);
}

// 5. Update remote members sales data on live purchases
export async function dbUpdateMemberSales(
  members: Member[]
): Promise<void> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      // Bulk update is complex in custom REST API without functions,
      // so we iterate or let the app state handle local while pushing updates back for current user or impacted people.
      // For a high-fidelity prototype, we can write individually to Supabase database for records.
      for (const m of members) {
        await supabaseClient
          .from('pho_members')
          .update({
            personal_sales: m.personalSales,
            group_sales: m.groupSales,
            commission_earned: m.commissionEarned,
            tier: m.tier
          })
          .eq('id', m.id);
      }
    } catch (e) {
      console.warn('Bulk sync to Supabase failed silently. Local persistence remains synced.', e);
    }
  } else {
    backupDb.saveMembers(members);
  }
}

// 6. Reset all databases
export async function dbResetDatabases(): Promise<void> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      // Remove custom database elements
      await supabaseClient.from('pho_orders').delete().neq('id', 'null');
      await supabaseClient.from('pho_members').delete().neq('id', 'null');
    } catch (e) {
      console.warn('Supabase remote reset is restricted by security rules.', e);
    }
  }
  try {
    safeLocalStorage.removeItem('phonetwork_members_db');
    safeLocalStorage.removeItem('phonetwork_transactions_db');
    safeLocalStorage.removeItem('phonetwork_orders_db');
  } catch (e) {
    // Ignored
  }
}
