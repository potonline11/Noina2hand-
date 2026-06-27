/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum MemberTier {
  NORMAL = 'Normal',
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  DIAMOND = 'Diamond'
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  tier: MemberTier;
  sponsorId: string | null; // ID of the member who introduced this member
  leftDownlineId?: string | null; // Binary left tree position (optional, for visual network representation)
  rightDownlineId?: string | null; // Binary right tree position
  personalSales: number; // in THB
  groupSales: number; // Total sales from this member and all downlines in THB
  commissionEarned: number; // Total commission received in THB
  joinedDate: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number; // in THB
  bv: number; // Business Volume points (e.g., 1 BV = 1 THB or calculated separately)
  image: string; // Dynamic simulated image descriptor
  color: string;
  image_url?: string;
  imageUrl?: string;
}

export interface Transaction {
  id: string;
  memberId: string;
  memberName: string;
  productId: string;
  productName: string;
  amount: number;
  commissionDistributed: Array<{
    memberId: string;
    memberName: string;
    tier: MemberTier;
    amount: number;
    role: 'Sponsor' | 'Upline';
  }>;
  timestamp: string;
}
