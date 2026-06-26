/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member, MemberTier } from '../types';
import { TIER_CONFIG } from '../mockData';
import { Network, ArrowUp, ArrowDown, UserPlus, Info, Search, Phone, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NetworkTreeProps {
  members: Member[];
  onSelectMember: (memberId: string) => void;
  onAddDownlineClick: (sponsorId: string) => void;
}

export default function NetworkTree({ members, onSelectMember, onAddDownlineClick }: NetworkTreeProps) {
  const [selectedCenterId, setSelectedCenterId] = useState<string>('m1'); // Start with top leader Custom m1
  const [searchQuery, setSearchQuery] = useState('');

  // Find the focused member
  const centerMember = members.find(m => m.id === selectedCenterId) || members[0];

  // Find direct uplines/sponsors
  const sponsor = members.find(m => m.id === centerMember.sponsorId);

  // Find direct downlines (sponsored by center member)
  const downlines = members.filter(m => m.sponsorId === centerMember.id);

  // Filter members for search dropdown
  const filteredSearchList = searchQuery
    ? members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.phone.includes(searchQuery))
    : [];

  const handleSelectSearchedMember = (id: string) => {
    setSelectedCenterId(id);
    onSelectMember(id);
    setSearchQuery('');
  };

  const getTierBadge = (tier: MemberTier) => {
    const config = TIER_CONFIG[tier];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border ${config.color}`}>
        <Zap className="w-3 h-3 fill-current" />
        {tier}
      </span>
    );
  };

  const getTierGlowStyle = (tier: MemberTier) => {
    switch (tier) {
      case MemberTier.DIAMOND: return 'border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.2)] bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/40';
      case MemberTier.GOLD: return 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20';
      case MemberTier.SILVER: return 'border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)] bg-solid';
      case MemberTier.BRONZE: return 'border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)] bg-solid';
      default: return 'border-slate-700 shadow-sm bg-solid';
    }
  };

  // Helper properties to estimate promotion progress
  const tierConfig = TIER_CONFIG[centerMember.tier];
  const nextTiersMap: Record<MemberTier, MemberTier | null> = {
    [MemberTier.NORMAL]: MemberTier.BRONZE,
    [MemberTier.BRONZE]: MemberTier.SILVER,
    [MemberTier.SILVER]: MemberTier.GOLD,
    [MemberTier.GOLD]: MemberTier.DIAMOND,
    [MemberTier.DIAMOND]: null,
  };
  const nextTier = nextTiersMap[centerMember.tier];
  const nextTierConfig = nextTier ? TIER_CONFIG[nextTier] : null;
  const progressRatio = nextTierConfig
    ? Math.min((centerMember.personalSales + centerMember.groupSales) / nextTierConfig.minSalesToPromote, 1)
    : 1;

  return (
    <div className="space-y-6" id="network-tree-section">
      {/* Visual Navigation Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <Network className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">ผังเครือข่ายทีมขายแบบโต้ตอบ</h2>
            <p className="text-slate-400 text-sm">ค้นหา เจาะลึกสายงานสปอนเซอร์ และขยายทีมขายของคุณได้เรียลไทม์</p>
          </div>
        </div>

        {/* Live Search Member Auto-Suggest */}
        <div className="relative w-full md:w-80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสมาชิก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-4 text-slate-200 text-sm outline-none transition-colors"
            />
          </div>
          
          <AnimatePresence>
            {searchQuery && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute z-20 w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-800"
              >
                {filteredSearchList.length > 0 ? (
                  filteredSearchList.map(member => (
                    <button
                      key={member.id}
                      onClick={() => handleSelectSearchedMember(member.id)}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-600/10 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="text-slate-200 text-sm font-semibold">{member.name}</div>
                        <div className="text-slate-400 text-xs">{member.phone}</div>
                      </div>
                      {getTierBadge(member.tier)}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-slate-500 text-xs text-center">ไม่พบรายชื่อที่ค้นหา</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modern Interactive Organizational Graph View */}
      <div className="relative bg-slate-950 rounded-3xl border border-slate-800/80 p-6 md:p-10 overflow-hidden min-h-[550px] flex flex-col justify-between">
        {/* Subtle decorative grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        {/* 1. UPLINE LEVEL */}
        <div className="flex justify-center mb-8 relative z-10">
          {sponsor ? (
            <div className="flex flex-col items-center">
              <div className="text-xs text-indigo-400 font-bold mb-2 flex items-center gap-1 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                <ArrowUp className="w-3 h-3" /> ผู้สปอนเซอร์ (Upline)
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  setSelectedCenterId(sponsor.id);
                  onSelectMember(sponsor.id);
                }}
                className={`flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl hover:border-slate-700 transition-all text-left shadow-lg`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs">
                  {sponsor.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{sponsor.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400 font-mono">{sponsor.phone}</span>
                    <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1 rounded font-medium border border-indigo-500/10">คลิกขยับเกน</span>
                  </div>
                </div>
                <div className="ml-2">
                  {getTierBadge(sponsor.tier)}
                </div>
              </motion.button>
              
              {/* Down arrow connecting to main card */}
              <div className="w-[2px] h-6 bg-gradient-to-b from-indigo-500/50 to-emerald-500 mt-2" />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="text-[10px] text-fuchsia-400 font-bold mb-2 flex items-center gap-1 uppercase tracking-wider bg-fuchsia-500/10 px-2 py-0.5 rounded-full border border-fuchsia-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> ต้นสายสูงสุด (Supreme Founder)
              </div>
              <div className="h-10" />
            </div>
          )}
        </div>

        {/* 2. CHOSEN CENTER MEMBER (Focus Node) */}
        <div className="flex justify-center my-4 relative z-10">
          <motion.div
            key={centerMember.id}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className={`w-full max-w-lg rounded-2xl border p-6 bg-slate-900/90 relative ${getTierGlowStyle(centerMember.tier)} transition-all`}
          >
            {/* Visual shine badge for diamond/gold */}
            {centerMember.tier === MemberTier.DIAMOND && (
              <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-sm font-semibold shadow-lg shadow-fuchsia-500/40 animate-pulse">
                👑
              </span>
            )}
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tierConfig.gradient} flex items-center justify-center text-slate-900 text-xl font-black`}>
                  {centerMember.name.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-1">
                    {centerMember.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-400 text-sm flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {centerMember.phone}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">ID: {centerMember.id}</span>
                  </div>
                </div>
              </div>
              <div>
                {getTierBadge(centerMember.tier)}
              </div>
            </div>

            {/* Segment: Member stats inside visual container */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-800/80">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/40">
                <span className="text-xs text-slate-400 block mb-1">ยอดขายส่วนตัว (Personal Sales)</span>
                <span className="text-base font-bold text-slate-200">
                  ฿{centerMember.personalSales.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">ยอดสะสมตั้งแต่อัพเกรด</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/40">
                <span className="text-xs text-indigo-400 block mb-1">ยอดขายทีมงาน (Group Sales)</span>
                <span className="text-base font-bold text-emerald-400">
                  ฿{centerMember.groupSales.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-500/70 block">คำนวณร่วมกันทั้งเครือข่าย</span>
              </div>
            </div>

            {/* Target promotion progress bar */}
            {nextTier && nextTierConfig && (
              <div className="mt-5 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">เป้าหมายเลื่อนขั้นสู่ <strong className="text-slate-100">{nextTier}</strong></span>
                  <span className="text-indigo-400 font-mono font-semibold">{(progressRatio * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressRatio * 100}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full bg-gradient-to-r ${TIER_CONFIG[nextTier].gradient}`} 
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>สะสม: ฿{(centerMember.personalSales + centerMember.groupSales).toLocaleString()}</span>
                  <span>เป้าหมายขั้นต่ำ: ฿{nextTierConfig.minSalesToPromote.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Display active perks */}
            <div className="mt-4 p-3 bg-indigo-950/10 border border-slate-800 rounded-xl space-y-1">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-400" /> สิทธิพิเศษเฉพาะคุณตอนนี้:
              </span>
              <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                {tierConfig.perks.slice(0, 2).map((perk, i) => (
                  <li key={i}>{perk}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Downlines connector segment */}
        <div className="flex justify-center relative">
          <div className="w-[2px] h-6 bg-gradient-to-b from-emerald-500 to-indigo-500/40" />
        </div>

        {/* 3. DOWNLINES LEVEL (Direct Children) */}
        <div className="mt-2 relative z-10">
          <div className="text-center text-xs font-bold text-emerald-400 mb-4 flex items-center justify-center gap-1 uppercase tracking-wider bg-emerald-500/10 py-1 px-3 rounded-full border border-emerald-500/20 w-fit mx-auto">
            <ArrowDown className="w-3.5 h-3.5" /> สายงานทีมสปอนเซอร์ตรง (Direct Downlines - Level 1)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-center">
            {downlines.map((member) => (
              <motion.div
                key={member.id}
                whileHover={{ scale: 1.03, y: -2 }}
                onClick={() => {
                  setSelectedCenterId(member.id);
                  onSelectMember(member.id);
                }}
                className="bg-slate-900 border border-slate-800 hover:border-slate-600/80 p-4 rounded-xl text-left cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <h5 className="font-semibold text-slate-200 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[130px]" title={member.name}>
                      {member.name}
                    </h5>
                    {getTierBadge(member.tier)}
                  </div>
                  <span className="text-slate-500 text-xs block mb-3 font-mono">{member.phone}</span>
                </div>

                <div className="border-t border-slate-800/80 pt-2.5 mt-2 flex justify-between text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">ยอดเครือข่าย</span>
                    <span className="font-bold text-slate-300">฿{member.groupSales.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block font-medium">ค่าคอมสะสม</span>
                    <span className="text-emerald-400 font-bold">฿{member.commissionEarned.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-3 text-[10px] text-center text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-lg py-1 transition-colors">
                  คลิกเพื่อเจาะลึก
                </div>
              </motion.div>
            ))}

            {/* Expand / Recruit member box */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              onClick={() => onAddDownlineClick(centerMember.id)}
              className="bg-slate-950 border border-dashed border-slate-800 hover:border-indigo-500/50 p-4 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center group min-h-[120px]"
            >
              <div className="p-3 bg-indigo-500/5 group-hover:bg-indigo-500/10 rounded-full border border-indigo-500/10 group-hover:border-indigo-500/30 text-indigo-400 transition-colors mb-2">
                <UserPlus className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-slate-300 text-xs tracking-tight group-hover:text-indigo-300 transition-colors">
                สปอนเซอร์ทีมสายงานเพิ่ม
              </h5>
              <span className="text-[10px] text-slate-500 mt-1">สมัครสมาชิกต่อจากคุณ {centerMember.name.split(' ')[0]}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
