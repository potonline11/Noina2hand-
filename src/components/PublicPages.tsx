import React, { useState } from 'react';
import { 
  Smartphone, CheckCircle, MessageSquare, Send, Users, Award, 
  DollarSign, MapPin, TrendingUp, Target, Compass, ShieldCheck, 
  Mail, Phone, ArrowRight, Search, SlidersHorizontal, Sparkles, 
  ChevronRight, HeartHandshake, Zap, BarChart3, Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  bv: number;
  image: string;
  color: string;
}

interface PublicPagesProps {
  products: Product[];
  onBuyNow: (product: Product) => void;
  currentUser: any;
  setMainTab: (tab: 'home' | 'about' | 'products' | 'marketing' | 'contact' | 'member_zone') => void;
  setIsLoginModalOpen: (open: boolean) => void;
  setIsRegisterModalOpen: (open: boolean) => void;
}

export const HomeView: React.FC<Pick<PublicPagesProps, 'products' | 'onBuyNow' | 'setMainTab' | 'setIsRegisterModalOpen'>> = ({ 
  products, onBuyNow, setMainTab, setIsRegisterModalOpen 
}) => {
  return (
    <div className="space-y-16 animate-fade-in">
      {/* HERO BANNER SECTION */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 p-8 md:p-14 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_45%)]" />
        
        <div className="space-y-6 max-w-2xl relative z-10 text-left">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 py-1.5 px-3.5 rounded-full text-xs font-bold font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} /> 
            เปลี่ยนมือถือของคุณเป็นเครื่องมือทำเงินทวีคูณ
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-101 leading-tight tracking-tight">
            พลิกโฉมการค้าปลีก <br />
            <span className="bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              สู่ระบบเครือข่ายอัจฉริยะ
            </span>
          </h1>
          
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
            PHO NETWORK ร่วมรวมสมาร์ตโฟนแบรนด์ดังระดับโลก ประกันศูนย์แท้ 100% 
            มาดิ่งระดับพร้อมระบบเกื้อกูลสายงานแบบทวิภาค (Binary Double Engine) 
            จ่ายคะแนน Group BV ให้ลูกทีมรับผลกำไรเติบโตรวดเร็วที่สุดในประเทศ
          </p>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
            <button
              onClick={() => setMainTab('products')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-500 hover:to-indigo-650 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2 group active:scale-95 text-nowrap"
            >
              ดูสมาร์ตโฟนระบบ BV <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-white font-bold text-sm border border-slate-800 transition shadow-inner text-nowrap"
            >
              สมัครร่วมแนะแนวเครือข่าย
            </button>
          </div>
        </div>

        {/* Dynamic mockup visuals of smartphones package with floating badges */}
        <div className="relative w-full max-w-sm lg:w-[350px] aspect-square flex items-center justify-center">
          <div className="absolute w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          
          {/* Main phone body representation */}
          <div className="relative w-44 h-72 rounded-[40px] bg-slate-950 border-[5px] border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden group">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-800 rounded-full z-10" />
            <div className="h-full w-full bg-gradient-to-b from-indigo-900/30 to-slate-950 p-4 flex flex-col justify-end text-left relative">
              <div className="absolute top-10 left-4 text-emerald-400 font-black text-2xl font-mono animate-pulse">
                +1,250 BV
              </div>
              <div>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded-full">PREMIUM 5G</span>
                <h4 className="text-xs font-black text-slate-101 mt-1 font-sans">iPhone 15 Pro Max</h4>
                <p className="text-[10px] text-amber-400 font-black font-mono">฿42,500</p>
              </div>
            </div>
          </div>

          {/* Floating dynamic status item 1 */}
          <div className="absolute -top-3 -right-3 bg-slate-900 border border-emerald-500/35 p-3 rounded-2xl flex items-center gap-2.5 shadow-lg shadow-emerald-950/20 animate-bounce" style={{ animationDuration: '6s' }}>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[9px] text-slate-500 font-bold">คอมมิชชันแชร์ริ่ง</p>
              <h5 className="text-xs font-black text-slate-200">matching 20%</h5>
            </div>
          </div>

          {/* Floating dynamic status item 2 */}
          <div className="absolute -bottom-2 -left-4 bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-2.5 shadow-lg shadow-indigo-950/20 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[9px] text-slate-500 font-bold">ผู้แนะแนวสายงานตรง</p>
              <h5 className="text-xs font-black text-slate-200">+5 สายลึก</h5>
            </div>
          </div>
        </div>
      </section>

      {/* CORE BUSINESS METRICS & HIGHLIGHTED STATISTICS */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">Real-Time Business Pulse Indicators</h2>
          <p className="text-2xl font-extrabold text-slate-100 tracking-tight">สถิติความก้าวหน้าและการขับเคลื่อนแพลตฟอร์ม</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/30 border border-slate-800/80 p-5 rounded-2xl text-left hover:border-slate-700/50 transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-500 block font-bold leading-none font-sans uppercase">ยอดจำหน่ายสะสมรวม (Platform Volume)</span>
            <strong className="text-2xl font-black text-slate-102 font-mono block mt-2">฿18,490,000+</strong>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> เติบโต +42% ในรอบเดือนนี้
            </p>
          </div>

          <div className="bg-slate-900/30 border border-slate-800/80 p-5 rounded-2xl text-left hover:border-slate-700/50 transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-500 block font-bold leading-none font-sans uppercase">จำนวนนักเครือข่ายขยายผล (Partners)</span>
            <strong className="text-2xl font-black text-slate-102 font-mono block mt-2">1,840+ คน</strong>
            <p className="text-[11px] text-indigo-400 mt-1 flex items-center gap-1 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" /> มีสมาชิกคัดลอกแนะนำใหม่ทุกวัน
            </p>
          </div>

          <div className="bg-slate-900/30 border border-slate-800/80 p-5 rounded-2xl text-left hover:border-slate-700/50 transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-500 block font-bold leading-none font-sans uppercase">โบนัสแมทชิ่งเกื้อกูลที่โอนจ่ายจริงแล้ว</span>
            <strong className="text-2xl font-black text-slate-102 font-mono block mt-2">฿4,250,000+</strong>
            <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" /> คิดคำนวณและโอนถอนเรียลไทม์
            </p>
          </div>

          <div className="bg-slate-900/30 border border-slate-800/80 p-5 rounded-2xl text-left hover:border-slate-700/50 transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Building className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-500 block font-bold leading-none font-sans uppercase">สถาบันคลังและจุดศูนย์ซ่อมรับประกัน</span>
            <strong className="text-2xl font-black text-slate-102 font-mono block mt-2">10 สาขาหลัก</strong>
            <p className="text-[11px] text-indigo-400 mt-1 flex items-center gap-1 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" /> ส่งเครื่องทั่วประเทศรวดเร็ว 1-2 วัน
            </p>
          </div>
        </div>
      </section>

      {/* CORE ADVANTAGES & KEY SYSTEM BENEFITS */}
      <section className="bg-slate-950 rounded-2xl border border-slate-850 p-8 md:p-10 space-y-8 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-2xl space-y-2">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono">Platform Strengths & Safeguards</span>
          <h2 className="text-2xl font-extrabold text-slate-103 tracking-tight">ทำไมต้องจับมือและขยายสายงานร่วมกับ PHO NETWORK</h2>
          <p className="text-slate-450 text-xs sm:text-sm">สร้างหลักประกันทางความมั่งคั่งและก้าวผ่านขีดจำกัดของการค้าทั่วไปด้วยโทรศัพท์มือถือเครื่องเดียว</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-101">รับประกันเครื่องศูนย์ไทย นำส่งออร์เดอร์ดิ่งทั่วไทย</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                จัดส่งตรงถึงหน้าบ้าน บรรจุในหีบห่อกันกระแทกอย่างดี พร้อมรับประกันความเสียหาย และรองรับการเก็บเงินปลายทาง เพิ่มความน่าเชื่อถือให้กับผู้ซื้อสูงสุด
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-500/15 border border-indigo-505/20 text-indigo-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-101">ระบบ Binary Double-Leg ขยายรวดเร็วแบบสองทิศ</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                อัพไลน์ด้านบนสามารถดิ่งช่วยโยนลูกตรงลงฝั่งซ้าย-ขวาอย่างทั่วถึง ช่วยเกื้อกูลประคับประคองผู้สมัครใหม่ให้สะสม Group BV ต่อยอดขึ้น Bronze/Silver ง่ายขึ้น
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/15 border border-amber-505/20 text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-101">ตำแหน่งเกียรติยศและโบนัสกองกลาง Leadership Pool</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                ตั้งแต่ GOLD เป็นต้นไป รับส่วนแบ่งยอดขายจากค่ายมือถือพันธมิตรทั่วโลก 2% ตลอดชีพ สะล้างระบบแชร์แบบเดิม ๆ ให้เห็นผลเติบโตมั่นคงเป็นกอบเป็นกำ
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-cyan-500/15 border border-cyan-505/20 text-cyan-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-101">ระบบสปอนเซอร์ & จัดบิลสะสมยอดตรงเรียลไทม์</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                คัดลอกลิงก์ส่วนบุคคล ส่งสมัครผ่านระบบออนไลน์ สมาชิกเลือกจับบิลเพิ่มคะแนนเข้าบัญชีของตนเองหรือช่วยทีมงานใต้สายได้อย่างยืดหยุ่นเต็มพิกัด
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTED FEATURED PRODUCTS SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="text-left space-y-1">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Smartphone Best Sellers</span>
            <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">สินค้าขายดีไฮไลท์ประจำเดือน</h2>
          </div>
          <button
            onClick={() => setMainTab('products')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            เปิดดูโบรชัวร์สินค้าทั้งหมด <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 3).map((prod) => (
            <div key={prod.id} className="bg-slate-900/40 border border-slate-800 hover:border-slate-750/70 p-5 rounded-2xl transition duration-200 flex flex-col justify-between group">
              <div>
                <div className={`w-full h-36 rounded-xl bg-gradient-to-br ${prod.color} flex items-center justify-center text-5xl relative overflow-hidden mb-4 select-none`}>
                  <div className="absolute inset-0 bg-slate-950/20 mix-blend-overlay" />
                  <span className="transform group-hover:scale-105 transition-transform duration-300">{prod.image}</span>
                  <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-indigo-400 font-mono tracking-wider border border-indigo-500/10">
                    {prod.brand.toUpperCase()}
                  </div>
                </div>

                <div className="text-left">
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                    {prod.name}
                  </h3>
                  <p className="text-[11px] text-slate-450 mt-1 line-clamp-1">เครื่องแท้ประกัน 1 ปี เข้าเคลมแบรนด์ได้ทุกศูนย์ทั่วไทย</p>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-800 pt-3 flex justify-between items-center mb-3 text-left">
                <div>
                  <span className="text-[9px] text-slate-550 block">ราคาส่งดิ่งปลีก</span>
                  <strong className="text-base font-bold text-slate-200 font-mono">฿{prod.price.toLocaleString()}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-indigo-450 block">คะแนนสะสมสาย</span>
                  <strong className="text-xs font-black text-emerald-400 font-mono">{prod.bv.toLocaleString()} BV</strong>
                </div>
              </div>

              <button
                onClick={() => onBuyNow(prod)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-650 to-indigo-805 hover:from-indigo-600 hover:to-indigo-750 text-white font-extrabold text-xs transition duration-200 cursor-pointer active:scale-95 shadow-md shadow-indigo-600/5 flex items-center justify-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" /> สั่งซื้อพร้อมสะสม BV
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};


export const AboutUsView: React.FC = () => {
  return (
    <div className="space-y-12 animate-fade-in text-left">
      {/* CORPORATE BANNER */}
      <section className="bg-gradient-to-b from-indigo-950/20 via-slate-900/30 to-slate-950 border border-slate-850 rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative">
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 py-1 px-3 rounded-full text-[10px] font-bold font-mono">
            <Compass className="w-3 h-3 animate-spin" style={{ animationDuration: '8s' }} /> ความน่าเชื่อถือสูงสุดทางเทคโนโลยีเครือข่าย
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-101 tracking-tight">เกี่ยวกับสหกรณ์ PHO NETWORK จำกัด</h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            พวกเราเริ่มต้นจากจุดประสงค์เดียวคือ ยุติการผูกขาดผลกำไรสมาร์ตโฟนจากรายใหญ่ แล้วนำส่งผลตอบแทนทางห่วงโซ่การกระจายส่งเครื่องกลับคืนสู่บุคคลทั่วไป และนักจัดการตลาดอย่างเป็นธรรม โปร่งใสตรวจสอบได้ผ่านระบบฐานข้อมูลแบบกระจายศูนย์
          </p>
        </div>
        <div className="w-24 h-24 lg:w-32 lg:h-32 shrink-0 rounded-3xl bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center text-4xl lg:text-6xl animate-pulse">
          🏢
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* VISION */}
        <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full pointer-events-none" />
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-101 mb-2">วิสัยทัศน์องค์กร (Vision statement)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            มุ่งมั่นพัฒนาและยกระดับโครงสร้างธุรกิจค้าอุปกรณ์ไอทีและสมาร์ตโฟนในภูมิภาคเอเชียตะวันออกเฉียงใต้ ให้เชื่อมต่อกับโครงข่ายสปอนเซอร์อิมแพคระดับโลก ผลักดันให้ผู้คนทั่วไปสามารถสร้างฐานรายได้เสริมอย่างยั่งยืนจากที่บ้านของตนเอง 100%
          </p>
        </div>

        {/* MISSION */}
        <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full pointer-events-none" />
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-101 mb-2">พันธกิจของเรา (Mission Statement)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            - สรรหาและคัดเลือกโทรศัพท์มือถือที่มีสเปกที่ดีที่สุด คุณภาพยอดเยี่ยม มาจัดจำหน่ายโดยตัดส่วนแบ่งพ่อค้าคนกลาง<br />
            - คิดโบนัสแบ่งปันสายงานที่มั่นคงผ่านระบบวิเคราะห์ Binary Engine อัจฉริยะ<br />
            - ซัพพอร์ตการรับประกันสินค้าและการขนส่งที่มีมาตรฐานระดับมืออาชีพสากล
          </p>
        </div>
      </div>

      {/* CORE VALUES */}
      <section className="bg-slate-950 p-8 rounded-2xl border border-slate-850 space-y-6">
        <h3 className="text-base font-extrabold text-slate-101 text-center">จริยธรรมและค่านิยมหลัก (Corporate Values)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="text-3xl">🤝</div>
            <h4 className="text-xs font-bold text-slate-200">ความโปร่งใส่ (Transparency)</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">ทุกคะแนนและ Group PV ตรวจสอบย้อนหลังได้จริง บันทึกและวิเคราะห์ค่าคอมมิชชันตามข้อกำหนดแผนรายได้แบบเรียลไทม์</p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl">🏅</div>
            <h4 className="text-xs font-bold text-slate-200">เกื้อกูลผู้ร่วมทาง (Mutual Growth)</h4>
            <p className="text-[11px] text-slate-505 leading-relaxed">สปอนเซอร์โยนสายงานลึกแบบไร้จุดขีดจำกัด ช่วยพยุงและขยายเครือข่ายส่งต่อยอดขายแก่พาร์ทเนอร์ท่านล่างให้มีกำลังใจมั่นคง</p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl">🚀</div>
            <h4 className="text-xs font-bold text-slate-200">นวัตกรรมล้ำหน้านำสมัย (Innovation First)</h4>
            <p className="text-[11px] text-slate-505 leading-relaxed">ลิงก์สมัครอัจฉริยะ คีย์จำลองสั่งชำระเงิน ตลอดจนแดชบอร์ดแสดงผลผ่านมือถือ สะดวก รวดเร็ว ไหลลื่นไม่มีสะดุด</p>
          </div>
        </div>
      </section>
    </div>
  );
};


export const ProductsBVView: React.FC<Pick<PublicPagesProps, 'products' | 'onBuyNow'>> = ({ 
  products, onBuyNow 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState<'PRICE_ASC' | 'PRICE_DESC' | 'BV_DESC' | 'DEFAULT'>('DEFAULT');

  // Filter unique brands
  const brands = ['ALL', ...Array.from(new Set(products.map(p => p.brand.toUpperCase())))];

  // Perform filtering & sorting
  const processedProducts = products
    .filter(prod => {
      const matchSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          prod.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBrand = brandFilter === 'ALL' || prod.brand.toUpperCase() === brandFilter;
      return matchSearch && matchBrand;
    })
    .sort((a, b) => {
      if (sortOption === 'PRICE_ASC') return a.price - b.price;
      if (sortOption === 'PRICE_DESC') return b.price - a.price;
      if (sortOption === 'BV_DESC') return b.bv - a.bv;
      return 0; // default order
    });

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-850 backdrop-blur-md">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-101 tracking-tight">โบรชัวร์รุ่นมือถือและคะแนนทางธุรกิจ (Business Volume)</h2>
          <p className="text-slate-450 text-xs">คุณสามารถเลือกสั่งซื้อสมาร์ตโฟนเพื่อสร้างยอดบิลส่วนตน หรือเลือกรุ่นมือถือสะสมคะแนนขยายสายงานได้ทันที</p>
        </div>
        <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-505/20 text-indigo-400 py-1.5 px-3 rounded-xl text-xs font-bold font-mono">
          <Smartphone className="w-4 h-4 animate-pulse" /> สินค้าแท้เข้าหน้าคู่ค้าแบรนด์ 100%
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-900">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="ค้นหาชื่อรุ่น / แบรนด์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 font-sans"
          />
        </div>

        {/* Brand filter selection */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-600 font-sans"
          >
            {brands.map(b => (
              <option key={b} value={b}>{b === 'ALL' ? 'คัดกรองด้วยแบรนด์: ทั้งหมด' : b}</option>
            ))}
          </select>
        </div>

        {/* Sorting selection */}
        <div>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-600 font-sans"
          >
            <option value="DEFAULT">เรียงลำดับ: มีผลต่อความนิยมสูงสุด</option>
            <option value="PRICE_ASC">เรียงตามราคา: น้อยไปหามาก</option>
            <option value="PRICE_DESC">เรียงตามราคา: มากไปหาน้อย</option>
            <option value="BV_DESC">เรียงตามคะแนนสินค้า: BV มากที่สุด</option>
          </select>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      {products.length === 0 ? (
        <div className="bg-slate-900/40 border border-indigo-500/20 p-8 sm:p-12 rounded-2xl text-center space-y-4 max-w-2xl mx-auto shadow-xl">
          <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto text-3xl">
            📊
          </div>
          <div className="space-y-2">
            <h4 className="text-base font-extrabold text-indigo-300">ยังไม่ได้เชื่อมต่อหรือดึงข้อมูลสินค้าจาก Google Sheets</h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              ระบบได้ทำการปิดส่วนดึงสินค้าจากฐานข้อมูลจำลอง (mock database) เรียบร้อยแล้ว เพื่อใช้ข้อมูลสินค้าจากแผ่นงานสเปรดชีตของคุณโดยตรงเป็นแหล่งอ้างอิงข้อมูลแหล่งเดียว
            </p>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-850/80 text-left text-xs space-y-2.5 max-w-md mx-auto">
            <p className="font-extrabold text-amber-400">วิธีดำเนินการดึงข้อมูลสินค้า:</p>
            <ul className="list-decimal list-inside text-slate-400 space-y-1.5 text-[11px] leading-relaxed">
              <li>คลิกแท็บ <span className="text-indigo-400 font-bold">"เชื่อมต่อ Google Sheets"</span> ด้านบนของเมนู</li>
              <li>ล็อกอิน Google Account และระบุลิงก์สเปรดชีตของคุณให้ถูกต้อง</li>
              <li>กดปุ่ม <span className="text-indigo-400 font-bold">"ดึงข้อมูล / ซิงค์ข้อมูลสินค้าล่าสุด"</span> ระบบจะทำการดาวน์โหลดสินค้าเข้ามาแสดงผลที่นี่ทันทีครับ</li>
            </ul>
          </div>
        </div>
      ) : processedProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedProducts.map((prod) => (
            <div key={prod.id} className="bg-slate-950 border border-slate-850 hover:border-slate-800/80 p-6 rounded-2xl transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className={`w-full h-40 rounded-xl bg-gradient-to-br ${prod.color} flex items-center justify-center text-6xl shadow-inner relative overflow-hidden mb-4 select-none`}>
                  <div className="absolute inset-0 bg-slate-950/20 mix-blend-overlay" />
                  <span className="transform group-hover:scale-105 transition-transform duration-300">{prod.image}</span>
                  <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-indigo-400 font-mono tracking-wider border border-indigo-550/10">
                    {prod.brand.toUpperCase()}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-101 group-hover:text-amber-400 transition-colors">
                  {prod.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">โมเดลศูนย์แท้ประกันความพอใจสูงสุด 1 ปี พร้อมบริการออเดอร์ดิ่งเก็บเงินปลายทาง</p>
              </div>

              <div className="mt-5 border-t border-slate-900 pt-4 flex justify-between items-center mb-4">
                <div>
                  <span className="text-[10px] text-slate-500 block">ราคาส่งดิ่งปลีก</span>
                  <strong className="text-lg font-bold text-slate-101 font-mono">฿{prod.price.toLocaleString()}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-indigo-400 block">คะแนนสะสมขยาย</span>
                  <strong className="text-sm font-extrabold text-emerald-400 font-mono">{prod.bv.toLocaleString()} BV</strong>
                </div>
              </div>

              <button
                onClick={() => onBuyNow(prod)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-500 hover:to-indigo-650 text-white font-extrabold text-xs transition-all duration-200 cursor-pointer active:scale-95 shadow-md shadow-indigo-605/10 flex items-center justify-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" /> สั่งซื้อปลายทางเพื่อสะสม BV
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/10 border border-slate-850 p-12 rounded-2xl text-center text-slate-500 space-y-2">
          <Smartphone className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-350">ไม่พบสมาร์ตโฟนรหัสดังกล่าวในรายการ</h4>
          <p className="text-xs text-slate-500">กรุณาลองปรับเปลี่ยนเงื่อนไขคีย์จำกัดการค้นหาใหม่อีกครั้ง</p>
        </div>
      )}
    </div>
  );
};


export const MarketingPlanView: React.FC = () => {
  const [personalBV, setPersonalBV] = useState<number>(1000);
  const [leftBV, setLeftBV] = useState<number>(12000);
  const [rightBV, setRightBV] = useState<number>(15000);
  const [tierBonusRate, setTierBonusRate] = useState<number>(15); // percent

  // calculate pairing estimates
  const weakerLeg = Math.min(leftBV, rightBV);
  const matchedCommissions = (weakerLeg * (tierBonusRate / 100));
  const personalSponsorCom = (personalBV * 0.1); 
  const totalEstimates = matchedCommissions + personalSponsorCom;

  return (
    <div className="space-y-12 animate-fade-in text-left">
      {/* HEADER BANNER */}
      <section className="bg-gradient-to-r from-slate-950 to-indigo-950 border border-indigo-950 p-6 sm:p-8 rounded-2xl flex items-center justify-between gap-4">
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-indigo-400 font-mono uppercase tracking-wider">Passive Income Multiplication Plan</span>
          <h1 className="text-2xl font-extrabold text-slate-101 tracking-tight">แผนรายได้และโบนัสทวิภาค Binary Booster</h1>
          <p className="text-slate-400 text-xs sm:text-sm">ขยายผลความมั่นใจด้วยระบบคะแนนสายลอยขึ้นสู่อัพไลน์ 100% ไร้สิ้นสุดระดับชั้น</p>
        </div>
        <div className="hidden sm:flex w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl items-center justify-center text-3xl">
          💰
        </div>
      </section>

      {/* CORE 5 Tiers Breakdown GRAPHIC */}
      <section className="space-y-6">
        <div className="space-y-1 text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">5 Progression Levels</span>
          <h2 className="text-lg font-extrabold text-slate-200">ห้าขั้นและตารางผลตอบแทนคุณสายแนะแนว</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900/30 border border-slate-800 p-4.5 rounded-2xl space-y-2.5 relative">
            <div className="absolute top-0 right-3 bg-slate-800 text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded-b-md">Lv.1</div>
            <strong className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-bold block w-max uppercase tracking-wider font-mono">MEMBER</strong>
            <h4 className="text-sm font-black text-slate-100">สมัครปั๊มเริ่มต้น</h4>
            <div className="text-[11px] text-slate-400 space-y-1 leading-relaxed">
              <p>• สะสมขั้นต้น: <strong className="text-indigo-400">0+ BV</strong></p>
              <p>• รับแนะแนวตรง: <strong className="text-emerald-400">10%</strong> ของยอดซื้อ</p>
              <p>• โบนัสฝั่งอ่อน: <strong className="text-slate-500">-</strong></p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-4.5 rounded-2xl space-y-2.5 relative">
            <div className="absolute top-0 right-3 bg-amber-500/10 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded-b-md">Lv.2</div>
            <strong className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md font-bold block w-max uppercase tracking-wider font-mono">BRONZE</strong>
            <h4 className="text-sm font-black text-slate-100">สร้างโครงข่ายฐาน</h4>
            <div className="text-[11px] text-slate-400 space-y-1 leading-relaxed">
              <p>• สะสมขั้นต้น: <strong className="text-indigo-400">1,000 BV</strong></p>
              <p>• รับแนะแนวตรง: <strong className="text-emerald-400">10%</strong></p>
              <p>• โบนัสฝั่งอ่อน: <strong className="text-emerald-300">12% match</strong></p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-4.5 rounded-2xl space-y-2.5 relative">
            <div className="absolute top-0 right-3 bg-cyan-500/10 text-cyan-400 text-[9px] font-bold px-1.5 py-0.5 rounded-b-md">Lv.3</div>
            <strong className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-md font-bold block w-max uppercase tracking-wider font-mono">SILVER</strong>
            <h4 className="text-sm font-black text-slate-100">ผู้นำระดับกลาง</h4>
            <div className="text-[11px] text-slate-400 space-y-1 leading-relaxed">
              <p>• สะสมขั้นต้น: <strong className="text-indigo-400">5,000 BV</strong></p>
              <p>• รับแนะแนวตรง: <strong className="text-emerald-400">10%</strong></p>
              <p>• โบนัสฝั่งอ่อน: <strong className="text-emerald-300">15% match</strong></p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-4.5 rounded-2xl space-y-2.5 relative">
            <div className="absolute top-0 right-3 bg-indigo-500/10 text-indigo-400 text-[9px] font-bold px-1.5 py-0.5 rounded-b-md">Lv.4</div>
            <strong className="text-xs bg-indigo-505/10 text-indigo-400 px-2 py-0.5 rounded-md font-bold block w-max uppercase tracking-wider font-mono">GOLD</strong>
            <h4 className="text-sm font-black text-slate-101">ผู้บริหารภูมิภาค</h4>
            <div className="text-[11px] text-slate-400 space-y-1 leading-relaxed">
              <p>• สะสมขั้นต้น: <strong className="text-indigo-400">10,500 BV</strong></p>
              <p>• รับแนะแนวตรง: <strong className="text-emerald-400">10%</strong></p>
              <p>• โบนัสฝั่งอ่อน: <strong className="text-emerald-300">18% match</strong></p>
              <p>• ส่วนแบ่งกองกลาง: <strong className="text-amber-400">1% pool</strong></p>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-indigo-500/20 p-4.5 rounded-2xl space-y-2.5 relative shadow-lg shadow-indigo-950/20">
            <div className="absolute top-0 right-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-b-md">Lv.5</div>
            <strong className="text-xs bg-gradient-to-r from-pink-500 to-indigo-500 text-white px-2 py-0.5 rounded-md font-bold block w-max uppercase tracking-wider font-mono">DIAMOND</strong>
            <h4 className="text-sm font-black text-slate-101">เกียรติยศสูงสุด</h4>
            <div className="text-[11px] text-slate-400 space-y-1 leading-relaxed">
              <p>• สะสมขั้นต้น: <strong className="text-indigo-400">25,000 BV</strong></p>
              <p>• รับแนะแนวตรง: <strong className="text-emerald-400">10%</strong></p>
              <p>• โบนัสฝั่งอ่อน: <strong className="text-emerald-305 font-bold">20% match</strong></p>
              <p>• ส่วนแบ่งกองกลาง: <strong className="text-amber-450 font-bold">2% pool</strong></p>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE COMPENSATION MATCHING CALCULATOR */}
      <section className="bg-slate-950 rounded-3xl border border-slate-850 p-6 md:p-8 space-y-6 relative overflow-hidden" id="compensation-matching-calc">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none" />
        
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
              <BarChart3 className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-base font-extrabold text-slate-101 tracking-tight">เครื่องคิดปันผลจำลอง (Binary Income Matching Calculator)</h3>
          </div>
          <p className="text-slate-450 text-xs">ระบุสมมติฐานยอดขายใต้สายงานแบบสองซีก เพื่อตรวจสอบยอดส่วนแบ่งรางวัลสูงสุดสะสม</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Controls column */}
          <div className="md:col-span-3 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">ยอดบิลสะสมตนเอง (BV)</label>
                <input
                  type="number"
                  value={personalBV}
                  onChange={(e) => setPersonalBV(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">คะแนนสายฝั่งซ้าย (Left BV)</label>
                <input
                  type="number"
                  value={leftBV}
                  onChange={(e) => setLeftBV(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">คะแนนสายฝั่งขวา (Right BV)</label>
                <input
                  type="number"
                  value={rightBV}
                  onChange={(e) => setRightBV(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Slider choice for Tiers Rate Selection */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">เลือกสิทธิผู้แนะแนวตามค่าตำแหน่ง:</span>
                <span className="font-mono text-indigo-400 font-extrabold">{tierBonusRate}% (ตำแหน่งเทียบเท่า {tierBonusRate === 12 ? 'Bronze' : tierBonusRate === 15 ? 'Silver' : tierBonusRate === 18 ? 'Gold' : 'Diamond'})</span>
              </div>
              <div className="flex gap-2">
                {[12, 15, 18, 20].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setTierBonusRate(rate)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                      tierBonusRate === rate 
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-350'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results column */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="text-left space-y-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold leading-none font-sans">คำนวณฝั่งอ่อนสะสมสูงสุด</span>
                <strong className="text-lg font-mono text-slate-200 mt-1 block">฿{weakerLeg.toLocaleString()} CV</strong>
              </div>
              <div className="border-t border-slate-800/80 pt-3">
                <span className="text-[10px] text-indigo-400 block font-sans">โบนัสจับคู่ (Pairing Match)</span>
                <strong className="text-lg text-emerald-400 font-mono font-black">฿{matchedCommissions.toLocaleString()}</strong>
              </div>
              <div className="border-t border-slate-800/80 pt-3">
                <span className="text-[10px] text-slate-500 block font-sans">โบนัสส่วนตัว (Personal 10%)</span>
                <strong className="text-xs text-slate-300 font-mono font-bold">฿{personalSponsorCom.toLocaleString()}</strong>
              </div>
            </div>

            <div className="bg-indigo-950/20 p-3 rounded-lg border border-indigo-500/10 text-left">
              <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none font-sans">ยอดรับปันผลสุทธิโดยประมาณ</span>
              <strong className="text-base font-black text-amber-400 mt-1.5 block font-mono">฿{totalEstimates.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};


export const ContactUsView: React.FC = () => {
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setSenderName('');
    setSenderPhone('');
    setSubject('');
    setMessage('');
    setTimeout(() => {
      setShowToast(false);
    }, 4500);
  };

  return (
    <div className="space-y-12 animate-fade-in text-left">
      {/* HEADER HERO */}
      <section className="bg-gradient-to-br from-slate-950 to-indigo-950/40 border border-slate-850 p-6 sm:p-10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-[10px] bg-indigo-550/15 text-indigo-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider font-mono">Contact & Support Channels</span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-101 tracking-tight">ช่องทางติดต่อพาร์ทเนอร์สากล</h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            มีข้อสงสัยเกี่ยวกับผลคิดแมทชิ่ง สั่งซื้อโทรศัพท์มือถือ หรือสอบถามขั้นตอนการทำ Referral Link? เจ้าหน้าที่ยินดีให้บริการตอบคำถามตลอด 24 ชั่วโมง
          </p>
        </div>
        <div className="w-20 h-20 bg-indigo-550/10 text-indigo-400 rounded-3xl flex items-center justify-center text-4xl animate-pulse">
          ✉️
        </div>
      </section>

      {/* TOAST Green Notify bar */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-xl text-emerald-400 text-xs flex items-center gap-2.5 font-bold"
          >
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>✨ ขอบคุณสำหรับข้อมูลสอบถาม! ทางแพลตฟอร์ม PHO NETWORK ได้รับเรื่องของคุณแล้ว เจ้าหน้าที่จะส่งสายโทรติดต่อกลับด่วนที่สุด</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Contact info channels */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/20 border border-slate-850 rounded-2xl p-6 space-y-6">
            <h3 className="text-base font-extrabold text-slate-101 border-b border-slate-900 pb-2 flex items-center gap-2">
              <Building className="w-4.5 h-4.5 text-indigo-400" /> สำนักงานใหญ่
            </h3>

            <div className="space-y-4 text-xs text-slate-400">
              <div className="flex gap-3">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>บจก. โฟเน็ตเวิร์ก แพลตฟอร์ม เอ็นเตอร์ไพรส์</strong><br />
                  125 อาคารสปอนเซอร์พลาซ่า ชั้น 15 ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพมหานคร 10400
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                <p>ฝ่ายบริการข้อมูลสายตรง: <strong>02-888-9999</strong></p>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <p>อีเมล์ทีมเทคนิคซัพพอร์ต: <strong>support@phonetwork.enterprise.co.th</strong></p>
              </div>
            </div>
          </div>

          {/* Graphical stylized embedded MapMockup */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4.5 relative overflow-hidden aspect-video flex flex-col justify-between">
            <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center opacity-30 select-none">
              <div className="w-full h-full bg-[radial-gradient(circle_at_center,indigo-500/10_1px,transparent_1px)] bg-[size:16px_16px]" />
            </div>
            
            <div className="relative z-10 text-left">
              <span className="text-[9px] bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">Live Simulation Map</span>
              <h5 className="text-xs font-black text-slate-200 mt-2">แผนที่สำนักงานพญาไท</h5>
            </div>

            <div className="relative z-10 flex items-center justify-center py-6">
              <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500 animate-ping absolute" />
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-base shadow-lg shadow-indigo-600/40 relative z-10 text-white font-extrabold font-mono">
                📍
              </div>
            </div>

            <span className="relative z-10 text-[9px] text-slate-500 text-center font-mono block">BTS สนามเป้า: รถไฟฟ้าทางออกพลาซ่า 150 เมตร</span>
          </div>
        </div>

        {/* Form panel */}
        <div className="lg:col-span-3 bg-slate-900/20 border border-slate-850 p-6 rounded-2xl">
          <h3 className="text-base font-extrabold text-slate-101 mb-4 flex items-center gap-2">
            <Send className="w-4.5 h-4.5 text-indigo-400" /> ฝากข้อความสอบถามแผนกบริการ
          </h3>

          <form onSubmit={handleSubmitInquiry} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase font-mono tracking-wider">ชื่อของคุณ-ผู้สอบถาม</label>
                <input
                  type="text"
                  required
                  placeholder="ตัวอย่าง: คุณเก่งกาจ รักสายงาน"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-600 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase font-mono tracking-wider">เบอร์โทรศัพท์สำหรับโทรกลับ</label>
                <input
                  type="tel"
                  required
                  placeholder="ตัวอย่าง: 081-234-5678"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-600 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase font-mono tracking-wider">หัวข้อประเด็นเรื่องราว</label>
              <input
                type="text"
                required
                placeholder="ตัวอย่าง: สนใจสมัครพาร์ทเนอร์ตำแหน่ง Bronze แต่ไม่มีสปอนเซอร์แนะนำ"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-600 font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase font-mono tracking-wider">รายละเอียดข้อความเพิ่มเติม</label>
              <textarea
                required
                rows={4}
                placeholder="กรุณากรอกข้อมูลสอบถามเพิ่มเติมความยาวสั้นตามประสงค์..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-101 placeholder:text-slate-600 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-500 hover:to-indigo-650 text-white font-extrabold text-xs transition active:scale-95 shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> ส่งประเด็นสอบถามถึงผู้ดูแลระบบ
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
