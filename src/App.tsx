import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import {
  ArrowRight,
  Plus,
  Bone,
  Dna,
  Gem,
  Leaf,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';
import ChatbotWidget from './components/ChatbotWidget';


// --- ANIMATION VARIANTS ---
const fadeUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const letterBlock: Variants = {
  initial: { y: 120, opacity: 0 },
  animate: { 
    y: 0, 
    opacity: 1, 
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } 
  }
};

const logoH1Variants: Variants = {
  initial: { scale: 1.03 },
  animate: {
    scale: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const headerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};


// --- MAIN APP COMPONENT ---





// --- MAIN APP COMPONENT ---
export default function App() {
  // STATE
  const [showVideo, setShowVideo] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // showVideo flips to true after 2800ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowVideo(true);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  const navLinks = [
    { label: "3D Anatomy", href: "/anatomy.html" },
    { label: "AI Advisor", href: "/anatomy.html?openAdvisor=true" },
    { label: "Capabilities", href: "#capabilities" },
    { label: "System Flow", href: "#system-flow" },
  ];

  return (
    <div className="relative w-full bg-[#fcfcfc] text-[#111] font-sans selection:bg-black selection:text-white overflow-x-hidden">
      {/* ========================================================
          SECTION 1: HERO (full viewport height)
      ======================================================== */}
      <section className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden">
        {/* 1D. BACKGROUND VIDEO */}
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              src="/assets/hero-video.mp4"
            />
          </motion.div>
        )}

        {/* 1A. HEADER (NHM Logo) */}
        <motion.header
          variants={headerVariants}
          initial="initial"
          animate="animate"
          className="relative pt-6 px-6 md:px-16 z-20 w-full"
        >
          <motion.h1
            variants={logoH1Variants}
            className="w-full flex justify-center"
          >
            <svg
              viewBox="0 0 840 100"
              fill="#111"
              className="w-full h-auto max-h-[100px] overflow-visible"
            >
              {/* Letter N (translate 0,0) */}
              <g transform="translate(0,0)">
                <motion.polygon variants={letterBlock} points="0,0 14,0 14,100 0,100" />
                <motion.polygon variants={letterBlock} points="200,0 214,0 214,100 200,100" />
                <motion.polygon variants={letterBlock} points="0,0 33,0 214,100 181,100" />
              </g>

              {/* Letter H (translate 280,0) */}
              <g transform="translate(280,0)">
                <motion.polygon variants={letterBlock} points="0,0 14,0 14,100 0,100" />
                <motion.polygon variants={letterBlock} points="200,0 214,0 214,100 200,100" />
                <motion.polygon variants={letterBlock} points="14,43 200,43 200,57 14,57" />
              </g>

              {/* Letter M (translate 560,0) */}
              <g transform="translate(560,0)">
                <motion.polygon variants={letterBlock} points="0,0 14,0 14,100 0,100" />
                <motion.polygon variants={letterBlock} points="266,0 280,0 280,100 266,100" />
                <motion.polygon variants={letterBlock} points="0,0 26,0 153,100 127,100" />
                <motion.polygon variants={letterBlock} points="254,0 280,0 153,100 127,100" />
              </g>
            </svg>
          </motion.h1>

          {/* 1B. SUB-NAV BAR */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex justify-between items-start mt-8 text-[10px] md:text-[11px] font-mono tracking-[0.2em] uppercase"
          >
            {/* Left column (15% width) */}
            <div className="w-auto md:w-[15%] flex flex-col space-y-0.5 text-gray-800">
              <div className="font-bold text-black">HEALTH ADVISORY</div>
              <div>AI SYSTEM</div>
              <div>3D ATLAS</div>
            </div>

            {/* Arrow separator (5% width, hidden on mobile) */}
            <div className="hidden md:flex md:w-[5%] justify-center pt-1">
              <ArrowRight size={14} strokeWidth={1} className="text-gray-400" />
            </div>

            {/* Center column (flex-1 on mobile, 30% on desktop) */}
            <div className="flex-1 md:w-[30%] md:flex-initial text-gray-800 leading-relaxed font-mono px-4 md:px-0">
              <div className="hidden md:block">
                <strong className="text-black">Smart Health Advisory System</strong>
                <br />
                Using AI With 3D Human Body
                <br />
                Visualization &amp; AQI Modeling.
              </div>
              <div className="block md:hidden">
                <strong className="text-black">Smart Health Advisory System</strong>
                <br />
                Using AI With 3D Human Body
                <br />
                Visualization &amp; AQI Modeling.
              </div>
            </div>

            {/* Arrow separator (5% width, hidden on mobile) */}
            <div className="hidden md:flex md:w-[5%] justify-center pt-1">
              <ArrowRight size={14} strokeWidth={1} className="text-gray-400" />
            </div>

            {/* Right column (15% width, hidden on mobile) */}
            <div className="hidden md:flex md:w-[15%] flex-col space-y-1 text-gray-800">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="hover:text-black hover:underline transition-colors flex items-center justify-between group"
                >
                  <span>{item.label}</span>
                  {item.label.includes("3D") && (
                    <span className="text-[8px] bg-black text-white px-1.5 py-0.5 rounded font-mono">3D</span>
                  )}
                </a>
              ))}
              <a
                href="/anatomy.html?openAdvisor=true"
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black text-white hover:bg-neutral-800 transition-colors text-[9px] font-mono tracking-wider w-fit"
              >
                <span>AI Advisor</span>
                <ArrowUpRight size={12} />
              </a>
            </div>

            {/* Hamburger button (far right, z-60) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex md:hidden flex-col justify-center items-end gap-[6px] z-60 p-2 cursor-pointer group"
              aria-label="Toggle navigation menu"
            >
              <span
                className={`h-[1.5px] bg-black transition-all duration-300 ${
                  isMobileMenuOpen
                    ? "w-7 rotate-45 translate-y-[3.75px]"
                    : "w-8 group-hover:w-6"
                }`}
              />
              <span
                className={`h-[1.5px] bg-black transition-all duration-300 ${
                  isMobileMenuOpen
                    ? "w-7 -rotate-45 -translate-y-[3.75px]"
                    : "w-8 group-hover:w-10"
                }`}
              />
            </button>
          </motion.div>

          {/* 1C. MOBILE MENU OVERLAY */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden absolute top-full left-0 w-full bg-[#fcfcfc] border-b border-gray-200 shadow-xl z-50 p-6 flex flex-col space-y-6 text-sm font-mono tracking-[0.2em] uppercase"
              >
                <a
                  href="/anatomy.html"
                  className="bg-black text-white px-4 py-3 rounded-md flex items-center justify-between"
                >
                  <span>⚡ 3D Human Anatomy Atlas</span>
                  <ArrowUpRight size={16} />
                </a>
                {navLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-800 hover:text-black hover:underline transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* HERO MAIN CONTENT: LEFT & RIGHT SIDEBARS */}
        <div className="relative flex-1 flex justify-between items-start w-full z-10">
          {/* 1E. LEFT SIDEBAR CONTENT */}
          <motion.div
            initial="initial"
            animate="animate"
            transition={{ staggerChildren: 0.15, delayChildren: 0.6 }}
            className="px-6 md:px-16 mt-16 sm:mt-24 md:mt-28 w-[320px] z-10 flex flex-col gap-6"
          >
            {/* Section indicator */}
            <div className="flex items-center gap-3 text-xs font-mono text-gray-800">
              <span>01</span>
              <span className="w-16 h-[1.5px] bg-black/20" />
            </div>

            {/* Headline */}
            <h2 className="text-[2.6rem] md:text-[3.8rem] font-normal tracking-tight leading-[1.05] text-[#111]">
              SMART HEALTH
              <br />
              ADVISORY
            </h2>

            {/* Description */}
            <p className="text-[13px] md:text-[14px] text-gray-700 w-[270px] leading-[1.6]">
              AI-driven health risk assessment integrated with interactive 3D human body visualization and air quality modeling.
            </p>

            {/* Dual CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
              <a
                href="/anatomy.html"
                title="Launch 3D Anatomy Atlas"
                className="group relative overflow-hidden bg-[#1a1a1a] px-5 py-3 border border-[#1a1a1a] rounded-md shadow-sm transition-all duration-300 hover:-translate-y-[0.5px] hover:shadow-[3px_3px_0px_rgba(17,17,17,0.5)] active:translate-y-0 active:shadow-none inline-flex items-center justify-center gap-2 cursor-pointer text-decoration-none"
              >
                <span className="absolute inset-0 bg-[#fcfcfc] -translate-x-[101%] group-hover:translate-x-0 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transition-transform pointer-events-none" />
                <span className="text-[14px] relative z-10">🦴</span>
                <span className="text-[12px] font-medium text-white group-hover:text-[#111] transition-colors duration-300 relative z-10 font-mono uppercase tracking-wider">
                  Open 3D Anatomy
                </span>
              </a>

              <a
                href="/anatomy.html?openAdvisor=true"
                title="Open Smart Health Advisor with AI Risk Modeling"
                className="group relative overflow-hidden bg-transparent px-5 py-3 border border-black/80 rounded-md shadow-sm transition-all duration-300 hover:-translate-y-[0.5px] hover:bg-black hover:text-white active:translate-y-0 inline-flex items-center justify-center gap-2 cursor-pointer text-decoration-none"
              >
                <span className="text-[14px] relative z-10">⚡</span>
                <span className="text-[12px] font-medium text-black group-hover:text-white transition-colors duration-300 relative z-10 font-mono uppercase tracking-wider">
                  AI Health Advisor
                </span>
              </a>
            </div>
          </motion.div>


          {/* 1F. RIGHT SIDEBAR (hidden on mobile) */}
          <motion.div
            initial="initial"
            animate="animate"
            transition={{ staggerChildren: 0.15, delayChildren: 0.9 }}
            className="w-[200px] mt-12 md:mt-20 mr-6 md:mr-16 hidden md:flex flex-col gap-6 z-10"
          >
            {/* System info */}
            <div>
              <div className="text-[10px] font-bold font-mono tracking-widest uppercase mb-1">
                AI Health Advisory
              </div>
              <div className="text-[12px] text-gray-600 leading-[1.6]">
                Explainable Risk Engine
                <br />
                AQI × Vitals × Symptoms
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-mono tracking-widest uppercase text-gray-500">
                  Body Systems
                </div>
                <div className="text-[13px] font-medium">6 Systems Mapped</div>
              </div>
              <div>
                <div className="text-[10px] font-mono tracking-widest uppercase text-gray-500">
                  Risk Factors
                </div>
                <div className="text-[13px] font-medium">4-Factor Weighted</div>
              </div>
              <div>
                <div className="text-[10px] font-mono tracking-widest uppercase text-gray-500">
                  Demo Scenarios
                </div>
                <div className="text-[13px] font-medium">5 Preloaded</div>
              </div>
            </div>

            {/* View Details button (links to 3D Simulator) */}
            <a
              href="/anatomy.html"
              title="Launch 3D Anatomy Simulator"
              className="group flex items-center gap-3 cursor-pointer text-left text-decoration-none"
            >
              <div className="w-10 h-10 rounded-full border border-gray-400 flex items-center justify-center transition-colors duration-300 group-hover:border-black group-hover:bg-[#111]">
                <Plus
                  size={16}
                  strokeWidth={1.5}
                  className="text-gray-700 group-hover:text-white transition-colors duration-300"
                />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-gray-800 group-hover:text-black transition-colors">
                Open Advisor
              </span>
            </a>
          </motion.div>

        </div>

        {/* 1G. BOTTOM-LEFT "SCROLL TO EXPLORE" */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-10 left-[2.5rem] md:left-[4rem] hidden md:flex items-center gap-4 z-10"
        >
          <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center">
            <div className="flex gap-[4px]">
              <span className="w-[1px] h-[12px] bg-gray-600" />
              <span className="w-[1px] h-[12px] bg-gray-600" />
            </div>
          </div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 font-semibold">
            Scroll to explore
          </span>
        </motion.div>
      </section>

      {/* ========================================================
          SECTION 2: SYSTEM FEATURES
      ======================================================== */}
      <section id="capabilities" className="relative w-full min-h-[75vh] md:min-h-screen bg-[#fcfcfc] flex flex-col items-center pt-24 md:pt-32 pb-0 z-20">
        {/* 2A. SECTION LABEL */}
        <div className="text-[10px] md:text-[11px] font-mono tracking-[0.2em] mb-12">
          <span className="text-gray-500">[ 02 ] </span>
          <span className="text-gray-900 font-bold uppercase">System Capabilities</span>
        </div>

        {/* 2B. MAIN HEADING */}
        <motion.h2
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="text-[2.2rem] md:text-[3.5rem] lg:text-[4.2rem] leading-[1.1] font-medium tracking-tight text-[#111] max-w-[1000px] text-center px-6"
        >
          Air quality analysis, risk assessment,{" "}
          <span className="hidden md:inline">
            <br />
          </span>
          and 3D organ visualization — unified.
        </motion.h2>

        {/* 2C. FEATURE PILLS */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.1, delayChildren: 0.3 }}
          className="flex flex-wrap justify-center gap-3 md:gap-4 mt-12 mb-10 md:mb-24 px-6"
        >
          {[
            { label: "AQI Analysis", icon: Leaf, href: "/anatomy.html" },
            { label: "AI Risk Engine", icon: Dna, href: "/anatomy.html" },
            { label: "Explainable AI", icon: BookOpen, href: "/anatomy.html" },
            { label: "Symptom Mapping", icon: Gem, href: "/anatomy.html" },
            { label: "3D Human Anatomy", icon: Bone, href: "/anatomy.html" },
          ].map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              href={href || "/anatomy.html"}
              title="Open 3D Simulator"
              className="rounded-full border border-gray-300 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider bg-white/50 backdrop-blur-sm text-gray-800 transition-all duration-300 hover:border-black hover:bg-black hover:text-white flex items-center gap-2 cursor-pointer shadow-sm text-decoration-none"
            >
              <Icon size={14} strokeWidth={2} />
              <span>{label}</span>
            </a>
          ))}
        </motion.div>

        {/* 2D. SPACER */}
        <div className="min-h-[220px] md:min-h-[450px] w-full" />

        {/* 2E. BOTTOM TEXT */}
        <div className="absolute bottom-0 left-0 w-full px-8 md:px-16 pb-8 md:pb-12 pointer-events-none flex justify-between items-center">
          <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 font-medium hidden md:block">
            EDUCATIONAL & INFORMATIONAL PURPOSE ONLY.
          </span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 font-medium hidden md:block">
            SMART HEALTH ADVISORY SYSTEM © 2026
          </span>
        </div>
      </section>


      {/* ========================================================
          SECTION 3: AQI → HEALTH → 3D PATHWAY (Dark Section)
      ======================================================== */}
      <section id="system-flow" className="relative w-full bg-[#0a0a0a] text-white flex flex-col z-30">
        {/* 3B. HEADING AREA */}
        <div className="px-8 md:px-16 pt-20 md:pt-32 mb-16 z-10 flex flex-col xl:flex-row justify-between items-start gap-8">
          {/* Main heading */}
          <h2 className="text-[1.8rem] md:text-[3rem] lg:text-[3.8rem] xl:text-[4rem] leading-[1.15] font-medium tracking-tight text-white max-w-[850px]">
            From air pollution{" "}
            <span className="inline-flex gap-2 md:gap-3 align-middle mx-2 md:mx-4 translate-y-[-4px]">
              <span className="w-10 h-10 md:w-14 md:h-14 rounded-full border border-gray-600 bg-black text-gray-400 flex items-center justify-center transition-colors duration-300 hover:bg-white hover:text-black hover:border-white cursor-pointer text-lg">
                🌫️
              </span>
              <span className="w-10 h-10 md:w-14 md:h-14 rounded-full border border-gray-600 bg-black text-gray-400 flex items-center justify-center transition-colors duration-300 hover:bg-white hover:text-black hover:border-white cursor-pointer text-lg">
                🫁
              </span>
              <span className="w-10 h-10 md:w-14 md:h-14 rounded-full border border-gray-600 bg-black text-gray-400 flex items-center justify-center transition-colors duration-300 hover:bg-white hover:text-black hover:border-white cursor-pointer text-lg">
                🧬
              </span>
            </span>{" "}
            to 3D organ risk visualization.
          </h2>

          {/* Right -- Tagline + pills */}
          <div className="xl:text-right">
            <div className="text-[9px] md:text-[10px] font-mono tracking-widest text-gray-400 uppercase mb-6 leading-relaxed">
              AQI × PM2.5 × VITALS
              <br />
              → ORGAN IMPACT → 3D ATLAS
            </div>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              {["Explainable", "Educational", "Evidence-based"].map((pill) => (
                <span
                  key={pill}
                  className="px-5 py-2 rounded-full border border-gray-600 text-[9px] font-mono tracking-widest uppercase text-gray-300 transition-colors duration-300 hover:bg-white hover:text-black hover:border-white cursor-pointer inline-flex items-center justify-center"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 3C. TWO-COLUMN PANEL: Pathway + Features */}
        <div className="h-[1px] bg-gray-800" />
        <div className="flex flex-col md:flex-row w-full z-10">
          {/* Left panel — AQI Flow */}
          <div className="w-full md:w-[35%] border-r border-gray-800 border-b md:border-b-0 min-h-[400px] md:min-h-[500px] relative flex flex-col justify-between p-8 overflow-hidden">
            <div className="text-gray-500 text-xl tracking-[0.3em] font-mono">***</div>

            {/* Pathway visualization */}
            <div className="relative w-full flex-1 flex flex-col items-center justify-center gap-3 my-6">
              {[
                { label: "AIR QUALITY (AQI)", color: "#60a5fa" },
                { label: "PM2.5 / POLLUTANTS", color: "#a78bfa" },
                { label: "RISK ASSESSMENT", color: "#f59e0b" },
                { label: "AFFECTED ORGAN", color: "#f97316" },
                { label: "3D VISUALIZATION", color: "#10b981" },
              ].map((step, i) => (
                <div key={step.label} className="flex flex-col items-center gap-1 w-full">
                  <div
                    className="px-4 py-2 rounded-md text-[10px] font-mono tracking-widest font-bold w-full text-center"
                    style={{ background: step.color + '18', color: step.color, border: `1px solid ${step.color}44` }}
                  >
                    {step.label}
                  </div>
                  {i < 4 && <div className="text-gray-600 text-sm">↓</div>}
                </div>
              ))}
            </div>

            <div className="text-[10px] font-mono tracking-widest text-[#888] uppercase">
              Core Technical Flow
            </div>
          </div>

          {/* Right panel — Feature list */}
          <div className="w-full md:w-[65%] flex flex-col">
            {/* Top bar */}
            <div className="border-b border-gray-800 p-8 text-[10px] font-mono text-gray-400 tracking-widest flex justify-between items-center">
              <span>Transparent AI — No black-box decisions.</span>
              <span className="text-white">5 Demo Scenarios</span>
            </div>

            {/* Feature list */}
            <div>
              {[
                { name: "Respiratory Risk via AQI", desc: "High PM2.5 / AQI → Lung highlight in 3D" },
                { name: "Cardiovascular Assessment", desc: "Elevated BP + palpitations → Heart focus" },
                { name: "Explainable Factor Breakdown", desc: "Vitals 35% · Symptoms 30% · AQI 25% · Lifestyle 10%" },
                { name: "Neurological Mapping", desc: "Dizziness / headache → Brain region focus" },
                { name: "Renal & Digestive Routing", desc: "Flank pain → Kidneys · Nausea → Stomach" },
              ].map((feature, idx) => {
                return (
                  <div
                    key={feature.name}
                    className="border-b border-gray-800/80 py-8 px-8 cursor-default transition-colors duration-300 flex justify-between items-center group hover:bg-white/5"
                  >
                    <div>
                      <span className="text-xl md:text-[1.6rem] font-medium tracking-tight text-white block">
                        {feature.name}
                      </span>
                      <span className="text-[11px] font-mono text-gray-500 tracking-wide mt-1 block">
                        {feature.desc}
                      </span>
                    </div>
                    <ArrowUpRight size={22} strokeWidth={1} className="text-gray-700 group-hover:text-gray-300 transition-colors" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3D. BOTTOM FOOTER */}
        <div className="h-[1px] bg-gray-800" />
        <div className="px-8 py-8 text-[10px] font-mono tracking-widest text-gray-500 uppercase bg-[#0a0a0a] flex justify-between items-center">
          <span>SMART HEALTH ADVISORY SYSTEM — COLLEGE PROJECT 2026</span>
          <a href="/anatomy.html" className="text-gray-400 hover:text-white transition-colors no-underline">
            LAUNCH 3D ADVISOR ↗
          </a>
        </div>
      </section>


      {/* Floating AI Chatbot Assistant */}
      <ChatbotWidget />
    </div>
  );
}
