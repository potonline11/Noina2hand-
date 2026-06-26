/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member, MemberTier } from '../types';
import { TIER_CONFIG } from '../mockData';
import { Search, UserPlus, SlidersHorizontal, Edit2, Trash2, X, Check, Eye, AlertCircle, Phone, User, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MemberManagerProps {
  members: Member[];
  onAddMember: (newMember: Omit<Member, 'id' | 'personalSales' | 'groupSales' | 'commissionEarned' | 'joinedDate'>) => void;
  onEditMember: (updatedMember: Member) => void;
  onDeleteMember: (id: string) => void;
  onSelectMember: (id: string) => void;
  sponsorSuggestId?: string | null;
  onClearSponsorSuggest?: () => void;
}

export default function MemberManager({
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onSelectMember,
  sponsorSuggestId,
  onClearSponsorSuggest
}: MemberManagerProps) {
  // Filter States
  const [search, setSearch] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'joinedDate' | 'groupSales' | 'commissionEarned'>('joinedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // New Member Form States
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTier, setNewTier] = useState<MemberTier>(MemberTier.NORMAL);
  const [newSponsorId, setNewSponsorId] = useState<string>('');

  // Edit Mode States
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // If a sponsor is suggested (from clicking "สปอนเซอร์ทีมสายงานเพิ่ม" in the network tree)
  React.useEffect(() => {
    if (sponsorSuggestId) {
      setNewSponsorId(sponsorSuggestId);
      setIsAdding(true);
      if (onClearSponsorSuggest) {
        onClearSponsorSuggest();
      }
    }
  }, [sponsorSuggestId]);

  // Form submission: Add Member
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    onAddMember({
      name: newName,
      phone: newPhone,
      tier: newTier,
      sponsorId: newSponsorId || null
    });

    // Reset Form
    setNewName('');
    setNewPhone('');
    setNewTier(MemberTier.NORMAL);
    setNewSponsorId('');
    setIsAdding(false);
  };

  // Trigger edit of a member
  const startEdit = (m: Member) => {
    setEditingMember({ ...m });
  };

  // Save edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      if (!editingMember.name.trim() || !editingMember.phone.trim()) {
        alert('กรุณากรอกชื่อและเบอร์โทรให้ถูกต้อง');
        return;
      }
      onEditMember(editingMember);
      setEditingMember(null);
    }
  };

  // Filtering & Sorting results
  const processedMembers = members
    .filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search) || m.id.toLowerCase().includes(search.toLowerCase());
      const matchTier = selectedTierFilter === 'ALL' || m.tier === selectedTierFilter;
      return matchSearch && matchTier;
    })
    .sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'joinedDate') {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      }

      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

  const getTierBadge = (tier: MemberTier) => {
    const config = TIER_CONFIG[tier];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.color}`}>
        {tier}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Quick Filters bar */}
      <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/85 backdrop-blur-md flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              การจัดการและรายชื่อสมาชิก
            </h3>
            <p className="text-slate-400 text-xs">แก้ไข สมัครใหม่ และค้นหาสมาชิกเครือข่ายธุรกิจของคุณได้อย่างสะดวก</p>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            {isAdding ? 'ปิดฟอร์มสมัคร' : 'สมัครสมาชิกใหม่'}
          </button>
        </div>

        {/* New Member Registration Accordion Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleAddSubmit} className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 mt-2 space-y-4">
                <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-900">
                  <UserPlus className="w-4 h-4" /> ฟอร์มสมัครสมาชิกร่วมทัพส่งมือถือมือใหม่
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold block">ชื่อ-นามสกุลผู้สมัคร</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น สมชาย มีความสุข (คุณทัช)"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-slate-200 text-sm outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold block">เบอร์โทรศัพท์</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น 089-123-4567"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-slate-200 text-sm outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold block">ระดับตำแหน่งสมาชิกแรกรับ</label>
                    <select
                      value={newTier}
                      onChange={(e) => setNewTier(e.target.value as MemberTier)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 p-2.5 rounded-lg text-slate-300 text-sm outline-none cursor-pointer"
                    >
                      {Object.values(MemberTier).map(tier => (
                        <option key={tier} value={tier}>{tier} (ค่าเริ่มต้นยอด ฿{TIER_CONFIG[tier].minSalesToPromote.toLocaleString()})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-indigo-400 font-semibold block">ผู้สปอนเซอร์แนะนำ (Sponsor / Upline)</label>
                    <select
                      value={newSponsorId}
                      onChange={(e) => setNewSponsorId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 p-2.5 rounded-lg text-slate-300 text-sm outline-none cursor-pointer"
                    >
                      <option value="">-- เป็นแม่ทีมสปอนเซอร์สูงสุด --</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.tier})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold rounded-lg transition-colors border border-slate-800"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-md shadow-emerald-500/10"
                  >
                    บันทึกสมัครสมาชิก
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Input, Tier Filters Grid & Sorting Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-800/80 pt-4 mt-2">
          {/* Text search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="ค้นหาตามชื่อ, ID หรือเบอร์โทร..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 pl-9 pr-4 text-slate-200 text-xs outline-none transition-colors"
            />
          </div>

          {/* Tier Filters Group */}
          <div className="flex flex-wrap gap-1.5 items-center justify-start md:col-span-2">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mr-1">ระดับชั้น:</span>
            {['ALL', ...Object.values(MemberTier)].map((tierName) => (
              <button
                key={tierName}
                onClick={() => setSelectedTierFilter(tierName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedTierFilter === tierName
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tierName}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced sorting widgets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/45 p-3 rounded-xl border border-slate-800/50">
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">จัดเรียงตาม:</span>
            
            <button
              onClick={() => {
                if (sortBy === 'joinedDate') {
                  setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('joinedDate');
                  setSortOrder('desc');
                }
              }}
              className={`px-2.5 py-1 text-xs rounded transition-all font-semibold ${sortBy === 'joinedDate' ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-800/50' : 'text-slate-400 hover:text-slate-200'}`}
            >
              วันที่สมัคร {sortBy === 'joinedDate' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
            </button>

            <button
              onClick={() => {
                if (sortBy === 'groupSales') {
                  setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('groupSales');
                  setSortOrder('desc');
                }
              }}
              className={`px-2.5 py-1 text-xs rounded transition-all font-semibold ${sortBy === 'groupSales' ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-800/50' : 'text-slate-400 hover:text-slate-200'}`}
            >
              ยอดขายสายงานทั้งหมด {sortBy === 'groupSales' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
            </button>

            <button
              onClick={() => {
                if (sortBy === 'commissionEarned') {
                  setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('commissionEarned');
                  setSortOrder('desc');
                }
              }}
              className={`px-2.5 py-1 text-xs rounded transition-all font-semibold ${sortBy === 'commissionEarned' ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-800/50' : 'text-slate-400 hover:text-slate-200'}`}
            >
              ค่าคอมรับสะสม {sortBy === 'commissionEarned' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
            </button>
          </div>

          <span className="text-[11px] text-slate-500 text-right">
            แสดง {processedMembers.length} จาก {members.length} คน
          </span>
        </div>
      </div>

      {/* Member Directory Grid Output */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/40 text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-4 px-5 text-left">สมาชิก (Member)</th>
                <th className="py-4 px-4 text-center">ระดับตำแหน่ง</th>
                <th className="py-4 px-4 text-right">ยอดส่วนตัว</th>
                <th className="py-4 px-4 text-right">ยอดเครือข่ายทีมงาน</th>
                <th className="py-4 px-4 text-right">ค่าคอมมิชชันสะสม</th>
                <th className="py-4 px-4 text-center">วันที่เข้าร่วม</th>
                <th className="py-4 px-5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-200">
              {processedMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-900/30 transition-colors group">
                  {/* Name and avatar info */}
                  <td className="py-4 px-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-400 text-xs">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200">{member.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-slate-500 text-[11px] font-mono">{member.phone}</span>
                        <span className="text-[10px] text-slate-600 font-mono">ID: {member.id}</span>
                      </div>
                    </div>
                  </td>

                  {/* Tier Badge */}
                  <td className="py-4 px-4 text-center">
                    {getTierBadge(member.tier)}
                  </td>

                  {/* Personal sales */}
                  <td className="py-4 px-4 text-right font-semibold text-slate-300 font-mono">
                    ฿{member.personalSales.toLocaleString()}
                  </td>

                  {/* Group sales */}
                  <td className="py-4 px-4 text-right font-bold text-emerald-400 font-mono">
                    ฿{member.groupSales.toLocaleString()}
                  </td>

                  {/* Commission */}
                  <td className="py-4 px-4 text-right font-bold text-amber-400 font-mono">
                    ฿{member.commissionEarned.toLocaleString()}
                  </td>

                  {/* Join Date */}
                  <td className="py-4 px-4 text-center text-xs text-slate-400 font-mono">
                    {member.joinedDate}
                  </td>

                  {/* Actions buttons */}
                  <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => onSelectMember(member.id)}
                      title="ดูผังสายงานทีม"
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 hover:text-indigo-300 hover:bg-slate-850 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => startEdit(member)}
                      title="แก้ไขข้อมูลยศและตำแหน่ง"
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-500 hover:text-amber-400 hover:bg-slate-850 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`คุณต้องการลบคุณ ${member.name} ออกจากระบบเครือข่ายหรือไม่?`)) {
                          onDeleteMember(member.id);
                        }
                      }}
                      title="ลบสปอนเซอร์รายชื่อ"
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-red-500 hover:text-red-400 hover:bg-slate-850 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {processedMembers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 text-sm">
                    ไม่พบข้อมูลสมาชิกในระบบ ยินดีต้อนรับสู่แดชบอร์ดใหม่แกะกล่อง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Member Modal Overlay */}
      <AnimatePresence>
        {editingMember && (
          <motion.div
            key="edit-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setEditingMember(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-4 text-amber-400">
                <Edit2 className="w-4 h-4" /> ปรับปรุงแก้ข้อมูลพันธมิตร
              </h3>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold block">ชื่อ-สกุล สมาชิก</label>
                  <input
                    type="text"
                    required
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-slate-200 text-sm outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold block">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    required
                    value={editingMember.phone}
                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-slate-200 text-sm outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold block">เลื่อนขั้น / ปรับระดับยศสมาชิก</label>
                  <select
                    value={editingMember.tier}
                    onChange={(e) => setEditingMember({ ...editingMember, tier: e.target.value as MemberTier })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 p-2.5 rounded-lg text-slate-200 text-sm outline-none cursor-pointer"
                  >
                    {Object.values(MemberTier).map(tier => (
                      <option key={tier} value={tier}>{tier} (เลื่อนทันที)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold block">เปลี่ยนสายการสปอนเซอร์ (คีย์ผู้แนะนำ)</label>
                  <select
                    value={editingMember.sponsorId || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, sponsorId: e.target.value || null })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 p-2.5 rounded-lg text-sm text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="">-- เป็นสัญชาติแม่สูงสุด (ไม่มีผู้แนะนำ) --</option>
                    {members
                      .filter(m => m.id !== editingMember.id)
                      .map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.tier})</option>
                      ))}
                  </select>
                </div>

                {/* Simulated fields */}
                <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-850 text-xs">
                  <div>
                    <span className="text-slate-500 block">ยอดขายส่วนตัว</span>
                    <span className="text-slate-300 font-bold block">฿{editingMember.personalSales.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ค่าคอมมิชชันสะสม</span>
                    <span className="text-emerald-400 font-bold block">฿{editingMember.commissionEarned.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold rounded-lg transition-colors"
                  >
                    ยกเลิกเสร็จสิ้น
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-md"
                  >
                    ยึดบันทึกแก้ไข
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
