/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Member, MemberTier, Product, Transaction } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'iPhone 15 Pro Max',
    brand: 'Apple',
    price: 48900,
    image: '📱',
    color: 'from-slate-700 to-slate-900',
  },
  {
    id: 'p2',
    name: 'Galaxy S24 Ultra',
    brand: 'Samsung',
    price: 46900,
    image: '🤖',
    color: 'from-blue-700 to-indigo-950',
  },
  {
    id: 'p3',
    name: 'Xiaomi 14 Ultra',
    brand: 'Xiaomi',
    price: 40990,
    image: '📷',
    color: 'from-zinc-800 to-black',
  },
  {
    id: 'p4',
    name: 'ROG Phone 8 Pro',
    brand: 'Asus',
    price: 37990,
    image: '🎮',
    color: 'from-red-600 to-red-950',
  },
  {
    id: 'p5',
    name: 'Oppo Reno11 Pro 5G',
    brand: 'Oppo',
    price: 19990,
    image: '✨',
    color: 'from-teal-600 to-cyan-900',
  },
].map(p => ({
  ...p,
  bv: Math.round(p.price * 0.01)
})) as Product[];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm1',
    name: 'กิตติศักดิ์ เลิศเกียรติ (คุณกฤต)',
    phone: '081-234-5678',
    tier: MemberTier.DIAMOND,
    sponsorId: null,
    personalSales: 245000,
    groupSales: 2189000,
    commissionEarned: 164000,
    joinedDate: '2026-01-10',
  },
  {
    id: 'm2',
    name: 'ธรณินทร์ พงษ์สิทธิ์ (คุณนิน)',
    phone: '089-876-5432',
    tier: MemberTier.GOLD,
    sponsorId: 'm1',
    personalSales: 120000,
    groupSales: 940000,
    commissionEarned: 74200,
    joinedDate: '2026-02-15',
  },
  {
    id: 'm3',
    name: 'พิมพ์ชนก เสนีย์ (คุณพิมพ์)',
    phone: '086-444-1122',
    tier: MemberTier.GOLD,
    sponsorId: 'm1',
    personalSales: 98000,
    groupSales: 710000,
    commissionEarned: 58500,
    joinedDate: '2026-02-18',
  },
  {
    id: 'm4',
    name: 'สรวิชญ์ สังข์แก้ว (คุณปาล์ม)',
    phone: '084-555-6677',
    tier: MemberTier.SILVER,
    sponsorId: 'm2',
    personalSales: 65000,
    groupSales: 350000,
    commissionEarned: 22000,
    joinedDate: '2026-03-01',
  },
  {
    id: 'm5',
    name: 'ชลธิชา ศรีแสง (คุณฝน)',
    phone: '082-999-8811',
    tier: MemberTier.SILVER,
    sponsorId: 'm2',
    personalSales: 72000,
    groupSales: 420000,
    commissionEarned: 26800,
    joinedDate: '2026-03-05',
  },
  {
    id: 'm6',
    name: 'วรุตม์ เจริญพร (คุณเจ)',
    phone: '085-333-4455',
    tier: MemberTier.BRONZE,
    sponsorId: 'm3',
    personalSales: 45000,
    groupSales: 180000,
    commissionEarned: 9500,
    joinedDate: '2026-03-12',
  },
  {
    id: 'm7',
    name: 'ณัฐกฤตา ดีเลิศ (คุณกิ๊ฟ)',
    phone: '080-111-2233',
    tier: MemberTier.NORMAL,
    sponsorId: 'm3',
    personalSales: 22000,
    groupSales: 22000,
    commissionEarned: 1100,
    joinedDate: '2026-04-01',
  },
  {
    id: 'm8',
    name: 'อัครพล ชนะภัย (คุณแม็ค)',
    phone: '087-777-6655',
    tier: MemberTier.BRONZE,
    sponsorId: 'm5',
    personalSales: 48000,
    groupSales: 110000,
    commissionEarned: 6200,
    joinedDate: '2026-04-10',
  },
  {
    id: 'm9',
    name: 'สิรินทรา มีสุข (คุณแอน)',
    phone: '083-222-9988',
    tier: MemberTier.NORMAL,
    sponsorId: 'm5',
    personalSales: 15000,
    groupSales: 15000,
    commissionEarned: 750,
    joinedDate: '2026-04-15',
  },
  {
    id: 'm10',
    name: 'ภานุพงศ์ นพคุณ (คุณบาส)',
    phone: '089-111-0011',
    tier: MemberTier.NORMAL,
    sponsorId: 'm6',
    personalSales: 12000,
    groupSales: 12000,
    commissionEarned: 600,
    joinedDate: '2026-05-01',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    memberId: 'm10',
    memberName: 'ภานุพงศ์ นพคุณ (คุณบาส)',
    productId: 'p5',
    productName: 'Oppo Reno11 Pro 5G',
    amount: 19990,
    commissionDistributed: [
      { memberId: 'm6', memberName: 'วรุตม์ เจริญพร (คุณเจ)', tier: MemberTier.BRONZE, amount: 999.5, role: 'Sponsor' },
      { memberId: 'm3', memberName: 'พิมพ์ชนก เสนีย์ (คุณพิมพ์)', tier: MemberTier.GOLD, amount: 399.8, role: 'Upline' },
      { memberId: 'm1', memberName: 'กิตติศักดิ์ เลิศเกียรติ (คุณกฤต)', tier: MemberTier.DIAMOND, amount: 199.9, role: 'Upline' }
    ],
    timestamp: '2026-06-12 09:12:00',
  },
  {
    id: 't2',
    memberId: 'm8',
    memberName: 'อัครพล ชนะภัย (คุณแม็ค)',
    productId: 'p1',
    productName: 'iPhone 15 Pro Max',
    amount: 48900,
    commissionDistributed: [
      { memberId: 'm5', memberName: 'ชลธิชา ศรีแสง (คุณฝน)', tier: MemberTier.SILVER, amount: 4890, role: 'Sponsor' },
      { memberId: 'm2', memberName: 'ธรณินทร์ พงษ์สิทธิ์ (คุณนิน)', tier: MemberTier.GOLD, amount: 1467, role: 'Upline' },
      { memberId: 'm1', memberName: 'กิตติศักดิ์ เลิศเกียรติ (คุณกฤต)', tier: MemberTier.DIAMOND, amount: 978, role: 'Upline' }
    ],
    timestamp: '2026-06-12 10:45:00',
  },
  {
    id: 't3',
    memberId: 'm4',
    memberName: 'สรวิชญ์ สังข์แก้ว (คุณปาล์ม)',
    productId: 'p2',
    productName: 'Galaxy S24 Ultra',
    amount: 46900,
    commissionDistributed: [
      { memberId: 'm2', memberName: 'ธรณินทร์ พงษ์สิทธิ์ (คุณนิน)', tier: MemberTier.GOLD, amount: 7035, role: 'Sponsor' },
      { memberId: 'm1', memberName: 'กิตติศักดิ์ เลิศเกียรติ (คุณกฤต)', tier: MemberTier.DIAMOND, amount: 1876, role: 'Upline' }
    ],
    timestamp: '2026-06-12 11:30:00',
  }
];

export const TIER_CONFIG = {
  [MemberTier.NORMAL]: {
    name: 'Normal Member',
    color: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    accentColor: 'slate',
    gradient: 'from-slate-400 to-slate-600',
    glow: 'shadow-slate-500/10',
    directCommission: 5, // 5%
    indirectLevels: 0,
    indirectRate: 0,
    minSalesToPromote: 0,
    perks: ['รับคอมมิชชันส่วนตัว 5%', 'เข้าใช้ระบบแอพพลิเคชันฟรี'],
  },
  [MemberTier.BRONZE]: {
    name: 'Bronze Platinum',
    color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    accentColor: 'orange',
    gradient: 'from-amber-600 to-orange-700',
    glow: 'shadow-orange-500/20',
    directCommission: 10, // 10%
    indirectLevels: 1, // 1 level down
    indirectRate: 2, // 2%
    minSalesToPromote: 30000,
    perks: ['รับคอมมิชชันส่วนตัว 10%', 'ค่าบริหารสายงานสปอนเซอร์ชั้นที่ 1 (2%)', 'กลุ่มสัมมนาพื้นฐานงานขาย'],
  },
  [MemberTier.SILVER]: {
    name: 'Silver Executive',
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    accentColor: 'cyan',
    gradient: 'from-sky-400 to-cyan-600',
    glow: 'shadow-cyan-500/30',
    directCommission: 15, // 15%
    indirectLevels: 2, // 2 levels down
    indirectRate: 3, // 3% split/each level
    minSalesToPromote: 100000,
    perks: ['รับคอมมิชชันส่วนตัว 15%', 'ค่าบริหารสายงานลึก 2 ชั้นย่อย (ชั้นละ 3%)', 'รับสิทธิ์สุ่มแจกนำเสนอรายชื่อผู้มุ่งหวังจากระบบส่วนกลาง'],
  },
  [MemberTier.GOLD]: {
    name: 'Gold President',
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    accentColor: 'amber',
    gradient: 'from-yellow-400 via-amber-500 to-yellow-600',
    glow: 'shadow-amber-500/40',
    directCommission: 20, // 20%
    indirectLevels: 3,
    indirectRate: 4, // 4% for generation overrides
    minSalesToPromote: 500000,
    perks: ['รับคอมมิชชันส่วนตัว 20%', 'ค่าบริหารสายงานลึก 3 ชั้นย่อย (ชั้นละ 4%)', 'ทริปท่องเที่ยวในประเทศประจำปี ฟรี 2 ที่นั่ง', 'โบนัสส่วนแบ่งยอดขายทั้งประเทศ 1%'],
  },
  [MemberTier.DIAMOND]: {
    name: 'Crown Diamond',
    color: 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20',
    accentColor: 'fuchsia',
    gradient: 'from-fuchsia-400 via-indigo-500 to-cyan-400',
    glow: 'shadow-fuchsia-500/50 animate-pulse',
    directCommission: 25, // 25%
    indirectLevels: 5,
    indirectRate: 5, // 5% overrides up to 5 levels
    minSalesToPromote: 1500000,
    perks: ['รับคอมมิชชันส่วนตัวสูงสุด 25%', 'ค่าบริหารสายงานลึกถึง 5 ชั้นทีม (ชั้นละ 5%)', 'โบนัสส่วนแบ่งสระยอดขายทั่วโลก (Global Pool) 2%', 'รถยนต์ผู้บริหารประจำตำแหน่ง', 'เกียรติยศสูงสุดและสิทธิพิเศษคณะกรรมการ'],
  },
};
