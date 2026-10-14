import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Wind,
  Brain,
  Bone,
  Droplets,
  Heart,
  Sparkles,
  X,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Zap,
} from 'lucide-react';

const BASE = import.meta.env.BASE_URL;

interface OrganSystem {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  category: 'vital' | 'regulatory' | 'structural';
  categoryLabel: string;
  targetOrgan: string;
  deepLink: string;
  icon: typeof Heart;
  accentColor: string;
  normalRange: string;
  aqiSensitivity: 'High' | 'Very High' | 'Moderate';
  summary: string;
  clinicalMetrics: { label: string; value: string; unit: string }[];
  pathologyRisks: string[];
  advisoryTip: string;
}

const ORGAN_SYSTEMS: OrganSystem[] = [
  {
    id: 'cardiovascular',
    code: 'SYSTEM 01 • HEMODYNAMICS',
    name: 'Cardiovascular System',
    subtitle: 'Heart, Coronary Arteries & Microvascular Network',
    category: 'vital',
    categoryLabel: 'Vital Core',
    targetOrgan: 'heart',
    deepLink: `${BASE}anatomy.html?select=heart&openAdvisor=true`,
    icon: Heart,
    accentColor: 'from-rose-500/20 to-red-600/10 border-rose-500/30 text-rose-400',
    normalRange: 'HR: 60–100 bpm • BP: 120/80 mmHg',
    aqiSensitivity: 'Very High',
    summary:
      'Powers continuous systemic circulation through an arterial and capillary network spanning nearly 60,000 miles. High ambient PM2.5 crosses pulmonary membranes, triggering vascular inflammation, arterial stiffness, and acute myocardial strain.',
    clinicalMetrics: [
      { label: 'Resting Heart Rate', value: '60–100', unit: 'bpm' },
      { label: 'Systolic / Diastolic', value: '120 / 80', unit: 'mmHg' },
      { label: 'Cardiac Output', value: '4.8–5.2', unit: 'L/min' },
      { label: 'Stroke Volume', value: '70', unit: 'mL/beat' },
    ],
    pathologyRisks: [
      'PM2.5 microvascular endothelial inflammation',
      'Hypertensive vascular strain during AQI spikes',
      'Tachycardia induced by hypoxemic stress',
    ],
    advisoryTip:
      'Maintain aerobic activity, monitor blood pressure regularly, and limit outdoor exertion when local AQI exceeds 100.',
  },
  {
    id: 'respiratory',
    code: 'SYSTEM 02 • GAS EXCHANGE',
    name: 'Respiratory System',
    subtitle: 'Lungs, Tracheobronchial Tree & Alveolar Diffusion',
    category: 'vital',
    categoryLabel: 'Vital Core',
    targetOrgan: 'lungs',
    deepLink: `${BASE}anatomy.html?select=lungs&openAdvisor=true`,
    icon: Wind,
    accentColor: 'from-cyan-500/20 to-sky-600/10 border-cyan-500/30 text-cyan-400',
    normalRange: 'SpO₂: ≥95% • Resp Rate: 12–20 bpm',
    aqiSensitivity: 'Very High',
    summary:
      'Facilitates vital alveolar-capillary O₂/CO₂ exchange across 300 million micro-sacs. The primary anatomical barrier directly exposed to ambient air pollutants including PM2.5, PM10, nitrogen dioxide, and ground-level ozone.',
    clinicalMetrics: [
      { label: 'Oxygen Saturation', value: '≥ 95', unit: '%' },
      { label: 'Respiratory Rate', value: '12–20', unit: 'breaths/min' },
      { label: 'Vital Capacity', value: '4.5–5.0', unit: 'Liters' },
      { label: 'Alveolar Area', value: '100', unit: 'm²' },
    ],
    pathologyRisks: [
      'Alveolar-capillary barrier breakdown from PM2.5',
      'Bronchial hyperreactivity & asthma exacerbations',
      'Hypoxemic desaturation in hazardous atmospheric smog',
    ],
    advisoryTip:
      'Utilize HEPA indoor filtration during high air pollution days and track SpO₂ closely if respiratory symptoms emerge.',
  },
  {
    id: 'nervous',
    code: 'SYSTEM 03 • NEURO-REGULATION',
    name: 'Nervous & Cranial System',
    subtitle: 'Brain, Cerebrospinal Fluid & Neural Network',
    category: 'regulatory',
    categoryLabel: 'Regulatory',
    targetOrgan: 'brain',
    deepLink: `${BASE}anatomy.html?select=brain&openAdvisor=true`,
    icon: Brain,
    accentColor: 'from-violet-500/20 to-purple-600/10 border-violet-500/30 text-violet-400',
    normalRange: 'Cerebral Perfusion • 7–9 hrs Sleep Baseline',
    aqiSensitivity: 'High',
    summary:
      'Coordinates sensory perception, voluntary motor commands, and autonomic vital functions. Ultrafine airborne particulates can penetrate the olfactory bulb and blood-brain barrier, triggering chronic neuroinflammatory pathways.',
    clinicalMetrics: [
      { label: 'Neuron Count', value: '86', unit: 'Billion' },
      { label: 'Cerebral Blood Flow', value: '750', unit: 'mL/min' },
      { label: 'Resting Sleep Need', value: '7.5–9', unit: 'hrs/night' },
      { label: 'Signal Conduction', value: '120', unit: 'm/s' },
    ],
    pathologyRisks: [
      'Neuroinflammatory response to particulate matter',
      'Autonomic dysregulation & elevated cortisol',
      'Sleep deprivation impairing glymphatic clearance',
    ],
    advisoryTip:
      'Prioritize structured sleep cycles, practice stress-reducing autonomic breathwork, and maintain hydration to support cognitive recovery.',
  },
  {
    id: 'musculoskeletal',
    code: 'SYSTEM 04 • BIOMECHANICAL FRAME',
    name: 'Musculoskeletal System',
    subtitle: '206 Articulated Bones, Joints & Skeletal Architecture',
    category: 'structural',
    categoryLabel: 'Structural',
    targetOrgan: 'skeleton',
    deepLink: `${BASE}anatomy.html?select=skeleton`,
    icon: Bone,
    accentColor: 'from-amber-500/20 to-orange-600/10 border-amber-500/30 text-amber-400',
    normalRange: '206 Articulated Bones • Biomechanical Balance',
    aqiSensitivity: 'Moderate',
    summary:
      'Provides structural protection for visceral organs, levers for locomotion, and mineral storage for calcium and phosphorus. Visualized in full 3D with anatomical bone group isolation and joint kinematic inspection.',
    clinicalMetrics: [
      { label: 'Articulated Bones', value: '206', unit: 'bones' },
      { label: 'Axial Skeleton', value: '80', unit: 'bones' },
      { label: 'Appendicular Core', value: '126', unit: 'bones' },
      { label: 'Body Mass Support', value: '100', unit: '%' },
    ],
    pathologyRisks: [
      'Sedentary posture loading cervical and lumbar spine',
      'Bone mineral density loss without weight-bearing stimulus',
      'Joint cartilage degeneration from repetitive biomechanical stress',
    ],
    advisoryTip:
      'Incorporate daily mobility drills and progressive resistance training to promote bone mineral density and postural ergonomics.',
  },
  {
    id: 'digestive',
    code: 'SYSTEM 05 • METABOLIC CORE',
    name: 'Digestive & Hepatic Core',
    subtitle: 'Stomach, Hepatic Filtration & Enteric Balance',
    category: 'regulatory',
    categoryLabel: 'Regulatory',
    targetOrgan: 'stomach',
    deepLink: `${BASE}anatomy.html?select=stomach&openAdvisor=true`,
    icon: Activity,
    accentColor: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/30 text-emerald-400',
    normalRange: 'Hydration: >2.5L • Balanced Glycemic Index',
    aqiSensitivity: 'Moderate',
    summary:
      'Directs nutrient digestion, energy conversion, systemic biochemical synthesis, and hepatic detoxification. Chronic physiological stress and poor hydration impair enteric mucosal barriers and metabolic homeostasis.',
    clinicalMetrics: [
      { label: 'GI Tract Length', value: '9', unit: 'meters' },
      { label: 'Daily Hydration Goal', value: '2.5–3.2', unit: 'Liters' },
      { label: 'Liver Blood Flow', value: '1.4', unit: 'L/min' },
      { label: 'Metabolic Enzymes', value: '500+', unit: 'reactions' },
    ],
    pathologyRisks: [
      'Systemic oxidative stress accelerating metabolic syndrome',
      'Dehydration impairing gastric mucosal protection',
      'Hepatic strain from elevated toxic metabolite load',
    ],
    advisoryTip:
      'Stay consistently hydrated with at least 2.5–3 liters of water daily and prioritize whole anti-inflammatory foods rich in antioxidants.',
  },
  {
    id: 'renal',
    code: 'SYSTEM 06 • FLUID & ELECTROLYTES',
    name: 'Renal & Excretory System',
    subtitle: 'Kidneys, Nephron Cascade & Systemic Filtration',
    category: 'regulatory',
    categoryLabel: 'Regulatory',
    targetOrgan: 'kidneys',
    deepLink: `${BASE}anatomy.html?select=kidneys&openAdvisor=true`,
    icon: Droplets,
    accentColor: 'from-blue-500/20 to-indigo-600/10 border-blue-500/30 text-blue-400',
    normalRange: 'GFR: ≥90 mL/min • Fluid Balance',
    aqiSensitivity: 'High',
    summary:
      'Filters approximately 180 liters of blood plasma daily through over 2 million nephrons. Regulates systemic fluid volume, electrolyte concentrations, acid-base equilibrium, and long-term arterial blood pressure control.',
    clinicalMetrics: [
      { label: 'Nephrons per Kidney', value: '1.0–1.2', unit: 'Million' },
      { label: 'Glomerular Filtration', value: '125', unit: 'mL/min' },
      { label: 'Daily Plasma Filtered', value: '180', unit: 'Liters' },
      { label: 'Blood Volume Regulation', value: '100', unit: '%' },
    ],
    pathologyRisks: [
      'Hypertensive microvascular damage in renal glomeruli',
      'Acute dehydration exacerbating electrolyte imbalances',
      'Heavy metal air pollutant bioaccumulation stressing nephrons',
    ],
    advisoryTip:
      'Maintain optimal electrolyte intake, avoid chronic NSAID overuse, and monitor fluid balance during humid or high-temperature days.',
  },
];

export default function OrganSystemsGallery() {
  const [selectedSystem, setSelectedSystem] = useState<OrganSystem | null>(null);
  const [filter, setFilter] = useState<'all' | 'vital' | 'regulatory' | 'structural'>('all');

  const filteredSystems =
    filter === 'all'
      ? ORGAN_SYSTEMS
      : ORGAN_SYSTEMS.filter((s) => s.category === filter);

  return (
    <div className="w-full">
      {/* SECTION HEADER */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/10 text-gray-700 text-[11px] font-mono tracking-widest uppercase mb-3">
            <Sparkles size={12} className="text-cyan-600" />
            <span>Interactive Biomedical Atlas</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight text-gray-900">
            Physiological Organ Systems
          </h2>
          <p className="mt-2 text-sm md:text-base text-gray-600 max-w-2xl font-light">
            Explore 6 primary anatomical systems integrated into our 3D WebGL simulator.
            Each system correlates personal vitals with ambient air pollution (AQI) risk modeling.
          </p>
        </div>

        {/* CATEGORY TABS */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Systems' },
            { id: 'vital', label: 'Vital Core' },
            { id: 'regulatory', label: 'Regulatory' },
            { id: 'structural', label: 'Structural' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as typeof filter)}
              className={`rounded-full px-4 py-1.5 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-white/80 text-gray-600 hover:bg-black/5 hover:text-black border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SYSTEMS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSystems.map((system) => {
          const Icon = system.icon;
          return (
            <motion.div
              key={system.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="group relative rounded-2xl bg-white border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:border-gray-400 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Header: Code & Category */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 font-semibold">
                    {system.code}
                  </span>
                  <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                    {system.categoryLabel}
                  </span>
                </div>

                {/* Icon & Title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <Icon size={22} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-black transition-colors">
                      {system.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{system.subtitle}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 leading-relaxed mb-5 font-light line-clamp-3">
                  {system.summary}
                </p>

                {/* Clinical Metric Pill */}
                <div className="rounded-xl bg-gray-50 border border-gray-200/80 p-3 mb-5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-gray-500">Normal Range:</span>
                    <span className="font-semibold text-gray-800">{system.normalRange}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-gray-500">AQI Sensitivity:</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                      <AlertTriangle size={11} />
                      {system.aqiSensitivity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedSystem(system)}
                  className="flex-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-3 text-xs font-mono uppercase tracking-wider transition-colors text-center cursor-pointer"
                >
                  System Details
                </button>
                <a
                  href={system.deepLink}
                  title="Explore in 3D WebGL Atlas"
                  className="rounded-xl bg-black hover:bg-gray-800 text-white p-2.5 transition-colors flex items-center justify-center cursor-pointer shadow-sm text-decoration-none"
                >
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedSystem && (
          <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-2xl rounded-3xl bg-white border border-gray-200 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedSystem(null)}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close details"
              >
                <X size={18} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[11px] font-mono tracking-widest uppercase text-gray-500 font-semibold">
                  {selectedSystem.code}
                </span>
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                  {selectedSystem.categoryLabel}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight">
                {selectedSystem.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-6">{selectedSystem.subtitle}</p>

              {/* Summary */}
              <p className="text-sm text-gray-700 leading-relaxed font-light mb-6">
                {selectedSystem.summary}
              </p>

              {/* 4 Clinical Metrics */}
              <div className="mb-6">
                <h4 className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                  <Zap size={14} className="text-cyan-600" />
                  Key Physiological Metrics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {selectedSystem.clinicalMetrics.map((m) => (
                    <div
                      key={m.label}
                      className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center"
                    >
                      <div className="text-[10px] font-mono text-gray-500 mb-1">{m.label}</div>
                      <div className="text-base font-semibold text-gray-900">{m.value}</div>
                      <div className="text-[10px] font-mono text-gray-400">{m.unit}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pathology & Environmental Vulnerabilities */}
              <div className="mb-6">
                <h4 className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-600" />
                  Environmental & Pathology Vulnerabilities
                </h4>
                <ul className="space-y-2">
                  {selectedSystem.pathologyRisks.map((risk, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-gray-700 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI Clinical Advisory */}
              <div className="mb-8 p-4 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-950 text-xs leading-relaxed flex items-start gap-3">
                <ShieldCheck size={18} className="text-cyan-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold mb-1 text-cyan-900 font-mono uppercase tracking-wider text-[11px]">
                    Clinical & Lifestyle Advisory
                  </div>
                  <div className="text-cyan-800">{selectedSystem.advisoryTip}</div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={selectedSystem.deepLink}
                  className="flex-1 rounded-xl bg-black hover:bg-gray-800 text-white py-3 px-4 text-xs font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md text-decoration-none"
                >
                  <span>Launch 3D Organ Simulation</span>
                  <ArrowUpRight size={14} />
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedSystem(null)}
                  className="rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 py-3 px-6 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
