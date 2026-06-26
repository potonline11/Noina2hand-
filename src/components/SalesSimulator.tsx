/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member, Product, Transaction, MemberTier } from '../types';
import { INITIAL_PRODUCTS, TIER_CONFIG } from '../mockData';
import { ShoppingBag, ArrowRight, DollarSign, Award, Zap, Coins, Sparkles, TrendingUp, RefreshCw, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SalesSimulatorProps {
  members: Member[];
  products: Product[];
  transactions: Transaction[];
  onRecordSale: (memberId: string, productId: string, quantity: number) => void;
  onResetSales: () => void;
}

export default function SalesSimulator({
  members,
  products,
  transactions,
  onRecordSale,
  onResetSales
}: SalesSimulatorProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[1]?.id || members[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [simulationTrace, setSimulationTrace] = useState<any[] | null>(null);

  React.useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  // For visual card selected state
  const selectedMember = members.find(m => m.id === selectedMemberId);
  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Real-time pricing
  const totalAmount = selectedProduct ? selectedProduct.price * quantity : 0;
  const totalBV = selectedProduct ? selectedProduct.bv * quantity : 0;

  // Run instant dry-run calculation before submitting to teach users how commissions will split!
  React.useEffect(() => {
    if (!selectedMember || !selectedProduct) {
      setSimulationTrace(null);
      return;
    }

    // DRY RUN MLM CALCULATOR
    const trace = [];
    let currentSponsorId = selectedMember.sponsorId;
    let depth = 1;
    const saleAmount = selectedProduct.price * quantity;

    // Direct commission is calculated for the immediate sponsor (or self if no sponsor, but usually direct sponsor based on their tier)
    if (!currentSponsorId) {
      trace.push({
        level: 0,
        memberId: selectedMember.id,
        name: selectedMember.name,
        tier: selectedMember.tier,
        rate: TIER_CONFIG[selectedMember.tier].directCommission,
        amount: saleAmount * (TIER_CONFIG[selectedMember.tier].directCommission / 100),
        role: 'ผู้ขายยอดตรง (Direct Seller Bonus)',
        note: `รับคอมมิชชันสินค้าตรงสำหรับตนเองโดยไม่มีสายงานผู้แนะนำ`
      });
    } else {
      // Direct seller gets self direct bonus if custom system allows, else sponsor gets Direct, downline gets portion
      // Let's implement: Active Seller gets Direct self bonus (100% of their direct tier rate)
      const sellerRate = TIER_CONFIG[selectedMember.tier].directCommission;
      trace.push({
        level: 0,
        memberId: selectedMember.id,
        name: selectedMember.name,
        tier: selectedMember.tier,
        rate: sellerRate,
        amount: saleAmount * (sellerRate / 100),
        role: 'ผู้จำหน่าย (Direct Sales Benefit)',
        note: `รับโบนัสส่วนตัวตามตำแหน่งระดับ ${selectedMember.tier}`
      });

      // Now cascade up to Sponsors
      let tempSponsorId = currentSponsorId;
      const traversedIds = new Set<string>();

      while (tempSponsorId && depth <= 5) {
        const parent = members.find(m => m.id === tempSponsorId);
        if (!parent || traversedIds.has(tempSponsorId)) break;
        traversedIds.add(tempSponsorId);

        const parentConfig = TIER_CONFIG[parent.tier];
        // If parent has qualified levels for downline overrides
        if (parentConfig.indirectLevels >= depth) {
          const overrideRate = parentConfig.indirectRate;
          const overrideAmt = saleAmount * (overrideRate / 100);

          trace.push({
            level: depth,
            memberId: parent.id,
            name: parent.name,
            tier: parent.tier,
            rate: overrideRate,
            amount: overrideAmt,
            role: `Upline ระดับชั้นที่ ${depth} สปอนเซอร์`,
            note: `ค่าบริหารสายงานความลึกระดับ ${parent.tier} ได้รับสิทธิ์สูงสุดความลึก ${parentConfig.indirectLevels} ชั้น`
          });
        } else {
          trace.push({
            level: depth,
            memberId: parent.id,
            name: parent.name,
            tier: parent.tier,
            rate: 0,
            amount: 0,
            role: `Upline ระดับชั้นที่ ${depth} (ไม่ผ่านคุณสมบัติ)`,
            note: `สิทธิประโยชน์ไม่พอมารองรับความลึกระดับนี้ (ต้องมีระดับ ${nextLevelRequirement(depth)} ขึ้นไป)`
          });
        }

        tempSponsorId = parent.sponsorId || '';
        depth++;
      }
    }

    setSimulationTrace(trace);
  }, [selectedMemberId, selectedProductId, quantity, members]);

  // Helper helper to say what level is needed
  const nextLevelRequirement = (depth: number) => {
    if (depth <= 1) return MemberTier.BRONZE;
    if (depth <= 2) return MemberTier.SILVER;
    if (depth <= 3) return MemberTier.GOLD;
    return MemberTier.DIAMOND;
  };

  const handleSaleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !selectedProductId) return;

    onRecordSale(selectedMemberId, selectedProductId, quantity);

    // Give visual sparkle triggers
    setQuantity(1);
    
    // Play subtle sound or show alert
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx) {
      const v = audioCtx.createOscillator();
      const u = audioCtx.createGain();
      v.connect(u);
      v.frequency.value = 523.25; // C5 note celebrate
      v.type = 'sine';
      u.connect(audioCtx.destination);
      u.gain.setValueAtTime(0.1, audioCtx.currentTime);
      v.start();
      u.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
      v.stop(audioCtx.currentTime + 0.5);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Simulation Form Panel */}
      <div className="lg:col-span-5 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                กรอกข้อมูลบันทึกขายเพื่อกระจายรายได้
              </h3>
              <p className="text-slate-400 text-xs">จำลองและคีย์ปิดการขายโทรศัพท์มือถือ เพื่อดูการไหลของคอมมิชชัน</p>
            </div>
            
            <button
              onClick={onResetSales}
              className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold border border-red-500/20 flex items-center gap-1 transition-colors"
              title="ล้างยอดขายและรีเซ็ตทดลองใหม่"
            >
              <RefreshCw className="w-3.5 h-3.5" /> รีเซ็ตยอดจำลอง
            </button>
          </div>

          <form onSubmit={handleSaleRecordSubmit} className="space-y-4">
            {/* 1. SELECT MEMBER WHO SOLD */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold block">1. เลือกตัวแทนผู้ปิดการขาย (Seller)</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 py-3 px-3.5 rounded-xl text-slate-200 text-sm outline-none cursor-pointer transition-colors"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.tier})</option>
                ))}
              </select>

              {/* Mini card detail of selected seller */}
              {selectedMember && (
                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-900 flex items-center justify-between text-xs mt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-slate-300 font-medium">{selectedMember.name.split(' ')[0]}</span>
                    <span className="text-slate-500">ID: {selectedMember.id}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${TIER_CONFIG[selectedMember.tier].color}`}>
                    {selectedMember.tier}
                  </span>
                </div>
              )}
            </div>

            {/* 2. SELECT SMARTPHONE PRODUCT */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold block">2. เลือกโทรศัพท์มือถือรุ่นที่ขายได้</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {products.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => setSelectedProductId(prod.id)}
                    className={`flex items-center justify-between border p-2.5 rounded-xl text-left transition-all ${
                      selectedProductId === prod.id
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.15)] text-slate-100'
                        : 'border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-xl">{prod.image}</span>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{prod.name}</h4>
                        <span className="text-[10px] text-slate-500 select-none">{prod.brand}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400 font-mono">฿{prod.price.toLocaleString()}</div>
                      <div className="text-[9px] text-indigo-400 font-mono">{prod.bv.toLocaleString()} BV</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. DEFINE QUANTITY */}
            <div className="grid grid-cols-2 gap-3 pb-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold block">3. จำนวนเครื่องที่จำหน่าย</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 p-2.5 rounded-xl text-slate-200 text-sm outline-none font-semibold text-center font-mono"
                />
              </div>

              <div className="bg-slate-950 p-2 rounded-xl border border-slate-850 flex flex-col justify-center items-center text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">มูลค่ายอดรวมบิล</span>
                <span className="text-base font-bold text-indigo-400 font-mono">฿{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* RECORD BUTTON */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-indigo-500 hover:from-emerald-600 hover:to-indigo-600 text-slate-900 hover:text-white font-black py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10 active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <Coins className="w-5 h-5" />
              บันทึกยอดส่งเข้าเครือข่ายเรียลไทม์
            </button>
          </form>
        </div>

        {/* Informative Perks Card regarding selected seller Tier */}
        {selectedMember && (
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1.5 mt-4">
            <span className="text-xs text-slate-400 font-semibold block flex items-center gap-1">
              <Award className="w-4 h-4 text-emerald-400 animate-bounce" /> สเปกทรูสิทธิ์คอมมิชชันระดับ {selectedMember.tier}:
            </span>
            <div className="text-xs text-slate-400 space-y-1 font-sans">
              <div className="flex justify-between">
                <span>สิทธิ์ส่วนบุคคลเบนฟิตตรง:</span>
                <strong className="text-white font-mono">{TIER_CONFIG[selectedMember.tier].directCommission}%</strong>
              </div>
              <div className="flex justify-between">
                <span>ความลึกเครือข่ายลึก:</span>
                <strong className="text-white font-mono">{TIER_CONFIG[selectedMember.tier].indirectLevels} ชั้น</strong>
              </div>
              <div className="flex justify-between">
                <span>อัตราผู้บริหารชั้นลึก:</span>
                <strong className="text-emerald-400 font-mono">{TIER_CONFIG[selectedMember.tier].indirectRate}% ต่อชั้น</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-Time Commission Trace Stream Panel */}
      <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
        {/* Real-time cascading projection visualization */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800/90 p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-indigo-950/60 mb-4">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" /> คาดการณ์สายการจัดสรรค่าคอมมิชชันสะสม (Commission Cascading Flow)
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">Real-time simulator</span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              <AnimatePresence mode="popLayout">
                {simulationTrace && simulationTrace.map((row, index) => (
                  <motion.div
                    key={row.memberId + '-' + index}
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.98, opacity: 0 }}
                    className={`flex items-start justify-between border p-3 rounded-xl transition-all ${
                      row.amount > 0
                        ? 'border-indigo-500/20 bg-indigo-500/5'
                        : 'border-slate-900 bg-slate-950/40 opacity-50'
                    }`}
                  >
                    <div className="flex gap-3 overflow-hidden">
                      <div className="text-base pt-1">
                        {row.level === 0 ? '👤' : `🪜`}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{row.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${TIER_CONFIG[row.tier as MemberTier].color}`}>
                            {row.tier}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{row.role}</span>
                        <p className="text-[9px] text-slate-500 italic mt-0.5">{row.note}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 block font-mono">อัตรารายได้: {row.rate}%</span>
                      <span className={`text-sm font-bold font-mono ${row.amount > 0 ? 'text-amber-400' : 'text-slate-600'}`}>
                        ฿{row.amount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {!simulationTrace && (
                <div className="py-20 text-center text-slate-600 text-xs">
                  เลือกสินค้าและตัวแทนขายเพื่อคำนวณการกระจายคอมมิชชันย้อนพาร์ทดิ่งสายงานทีมงาน
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center bg-slate-900/10 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <div>
                <span className="text-[10px] text-slate-500 block">คอมมิชชันจ่ายออกรวมสายงานบิลนี้</span>
                <span className="text-base font-extrabold text-amber-400 font-mono">
                  ฿{simulationTrace 
                    ? simulationTrace.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })
                    : '0.00'
                  }
                </span>
              </div>
            </div>
            
            <div className="text-right text-[10px] text-slate-500 font-mono">
              โมเดลธุรกิจเครือข่ายสิทธิ์ Phonetwork
            </div>
          </div>
        </div>

        {/* Ledger Stream Tracker of recent transactions */}
        <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-xl flex flex-col space-y-3">
          <span className="text-[11px] text-slate-500 font-extrabold uppercase tracking-widest block">
            แถบความเคลื่อนไหวธุรกรรมสดย้อนหลัง 3 ละลอก (Recent Ledger Transactions)
          </span>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {transactions.slice(0, 3).map((tx) => (
              <div key={tx.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="text-base bg-indigo-950/20 p-1.5 rounded border border-indigo-900 text-indigo-400">📱</span>
                  <div className="overflow-hidden">
                    <span className="text-slate-300 font-bold block whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">{tx.memberName}</span>
                    <span className="text-slate-500 text-[10px] block font-medium">จำหน่าย: {tx.productName} (฿{tx.amount.toLocaleString()})</span>
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="text-emerald-400 font-black block font-mono">
                    +฿{(tx.commissionDistributed.reduce((a, b) => a + b.amount, 0)).toLocaleString()}
                  </span>
                  <span className="text-slate-500 text-[9px] block font-mono">{tx.timestamp.split(' ')[1]}</span>
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <div className="text-center py-4 text-slate-600 text-xs italic">
                ยังไม่มีการบันทึกทำธุรกรรมการขายในระบบจำลองตัวนี้
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
