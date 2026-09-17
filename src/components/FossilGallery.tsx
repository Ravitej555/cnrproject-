import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, ZoomIn, Layers, ArrowUpRight } from 'lucide-react';

const BASE = import.meta.env.BASE_URL;

interface Specimen {
  id: string;
  code: string;
  name: string;
  commonName: string;
  category: 'dinosaur' | 'mammal' | 'marine';
  categoryLabel: string;
  period: string;
  timeline: string;
  length: string;
  diet: string;
  image: string;
  description: string;
  highlights: string[];
}

const SPECIMENS: Specimen[] = [
  {
    id: 'trex',
    code: 'SPECIMEN 01 • THEROPODA',
    name: 'Tyrannosaurus Rex',
    commonName: 'Apex Predator Dinosaur',
    category: 'dinosaur',
    categoryLabel: 'Dinosaur',
    period: 'Late Cretaceous',
    timeline: '68 – 66 Million Years Ago',
    length: '12.3 meters',
    diet: 'Carnivore',
    image: `${BASE}assets/01.png`,
    description:
      'The iconic bipedal theropod featuring an enormous skull balanced by a heavy tail, massive rear limbs, and one of the highest recorded bite forces among terrestrial animals.',
    highlights: ['Pneumatized cranial bone structure', 'Bite force ~35,000 Newtons', 'Serrated 30cm teeth'],
  },
  {
    id: 'mosasaur',
    code: 'SPECIMEN 03 • MOSASAURIDAE',
    name: 'Mosasaurus / Tylosaurus',
    commonName: 'Marine Apex Predator Dinosaur',
    category: 'dinosaur',
    categoryLabel: 'Aquatic Dinosaur',
    period: 'Late Cretaceous',
    timeline: '82 – 66 Million Years Ago',
    length: '14.2 meters',
    diet: 'Carnivore (Piscivore)',
    image: `${BASE}assets/03.png`,
    description:
      'A ferocious marine reptile that ruled prehistoric Cretaceous oceans with modified paddle-like limbs, a streamlined hydrofoil body, and double-hinged jaws capable of swallowing large prey whole.',
    highlights: ['Hydrodynamic paddle limb anatomy', 'Pterygoid palate teeth row', 'Propulsive fluke tail'],
  },
  {
    id: 'pterodactyl',
    code: 'SPECIMEN 06 • PTEROSAURIA',
    name: 'Pteranodon Longiceps',
    commonName: 'Winged Sky Reptile',
    category: 'dinosaur',
    categoryLabel: 'Flying Reptile',
    period: 'Late Cretaceous',
    timeline: '86 – 84 Million Years Ago',
    length: 'Wingspan 6.5 meters',
    diet: 'Piscivore',
    image: `${BASE}assets/06.png`,
    description:
      'A majestic flying reptile equipped with an aerodynamic cranial crest, ultralight hollow bones, and a membranous skin wing supported by an elongated fourth finger.',
    highlights: ['Ultralight hollow skeletal bones', 'Aerodynamic balance head crest', 'Toothless fish-catching beak'],
  },
  {
    id: 'mammoth',
    code: 'SPECIMEN 05 • PROBOSCIDEA',
    name: 'Mammuthus Primigenius',
    commonName: 'Woolly Mammoth',
    category: 'mammal',
    categoryLabel: 'Ice Age Mammal',
    period: 'Pleistocene Epoch',
    timeline: '300,000 – 4,000 Years Ago',
    length: '3.4 meters (Shoulder Height)',
    diet: 'Herbivore',
    image: `${BASE}assets/05.png`,
    description:
      'The legendary ice age herbivore adapted to arctic tundra with massive curved ivory tusks, multi-layered fur coats, and specialized flat high-crowned molars for crushing tundra grasses.',
    highlights: ['Spiral curved defense tusks', 'Massive high-crowned grinding molars', 'Cold-adapted cranial profile'],
  },
  {
    id: 'trilobite',
    code: 'SPECIMEN 02 • TRILOBITA',
    name: 'Paradoxides / Redlichiida',
    commonName: 'Primitive Marine Arthropod',
    category: 'marine',
    categoryLabel: 'Cambrian Fossil',
    period: 'Cambrian to Permian',
    timeline: '521 – 252 Million Years Ago',
    length: '18 centimeters',
    diet: 'Detritivore / Scavenger',
    image: `${BASE}assets/02.png`,
    description:
      'Among the earliest known arthropods with a segmented, three-lobed exoskeleton made of calcite. Their fossilized molts provide crucial benchmark markers for geological stratigraphy.',
    highlights: ['Calcite crystal compound eyes', 'Tri-lobed articulated thorax', 'First major organism with mineralized shells'],
  },
  {
    id: 'ammonite',
    code: 'SPECIMEN 04 • AMMONOIDEA',
    name: 'Asteroceras Obtusum',
    commonName: 'Spiral Chambered Cephalopod',
    category: 'marine',
    categoryLabel: 'Mesozoic Fossil',
    period: 'Early Jurassic to Cretaceous',
    timeline: '240 – 66 Million Years Ago',
    length: '28 cm diameter',
    diet: 'Carnivore / Planktonic',
    image: `${BASE}assets/04.png`,
    description:
      'Extinct cephalopods with coiled, chambered shells. They regulated their ocean depth by adjusting fluid levels in their internal septa chambers via an organic tube called a siphuncle.',
    highlights: ['Logarithmic spiral shell geometry', 'Hydrostatic buoyancy chambers', 'Complex fractal suture patterns'],
  },
];

export default function FossilGallery() {
  const [filter, setFilter] = useState<'all' | 'dinosaur' | 'mammal' | 'marine'>('all');
  const [activeSpecimen, setActiveSpecimen] = useState<Specimen | null>(null);

  const filteredSpecimens = filter === 'all'
    ? SPECIMENS
    : SPECIMENS.filter((s) => s.category === filter);

  return (
    <div className="w-full max-w-6xl mx-auto my-8 px-4 font-sans">
      {/* Exhibit Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-gray-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-gray-500 uppercase">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>NATURAL HISTORY MUSEUM ARCHIVES</span>
            <span>•</span>
            <span className="font-semibold text-black">SPECIMEN VAULT</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-[#111] mt-1.5 flex items-center gap-2">
            Prehistoric Anatomical Specimens
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-black/5 text-gray-700 border border-black/5 font-normal">
              6 Cataloged
            </span>
          </h3>
          <p className="text-sm text-gray-600 max-w-2xl mt-2 leading-relaxed">
            Exploration of ancient skeletal mechanics, evolutionary biology, and fossilized structural anatomy preserved from the original museum exhibition collection.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All (6)' },
            { id: 'dinosaur', label: 'Dinosaurs & Reptiles (3)' },
            { id: 'mammal', label: 'Mammals (1)' },
            { id: 'marine', label: 'Marine Fossils (2)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-white/80 text-gray-600 hover:text-black border border-gray-200 hover:border-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Specimens */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {filteredSpecimens.map((specimen) => (
            <motion.div
              layout
              key={specimen.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4 }}
              onClick={() => setActiveSpecimen(specimen)}
              className="group relative flex flex-col bg-white rounded-3xl border border-gray-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden cursor-pointer"
            >
              {/* Top Tag Bar */}
              <div className="px-6 pt-5 pb-2 flex items-center justify-between z-10">
                <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">
                  {specimen.code}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200/60 uppercase">
                  {specimen.categoryLabel}
                </span>
              </div>

              {/* Specimen Showcase Window */}
              <div className="relative w-full h-56 px-6 flex items-center justify-center overflow-hidden">
                {/* Radial ambient backlight */}
                <div className="absolute inset-0 bg-radial from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <motion.img
                  src={specimen.image}
                  alt={specimen.name}
                  className="max-h-48 max-w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.12)] group-hover:scale-106 group-hover:drop-shadow-[0_16px_32px_rgba(0,0,0,0.18)] transition-all duration-500"
                  loading="lazy"
                />

                {/* Inspect Overlay Badge */}
                <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/80 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-mono flex items-center gap-1.5 shadow-md pointer-events-none">
                  <ZoomIn size={11} />
                  <span>Inspect Specimen</span>
                </div>
              </div>

              {/* Bottom Details */}
              <div className="p-6 pt-3 mt-auto bg-gradient-to-b from-transparent to-gray-50/50 border-t border-gray-100">
                <div className="text-[11px] font-mono text-amber-700 tracking-wider uppercase font-medium">
                  {specimen.period}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mt-0.5 group-hover:text-black transition-colors">
                  {specimen.name}
                </h4>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                  {specimen.description}
                </p>

                <div className="mt-4 pt-3 border-t border-gray-100/80 flex items-center justify-between text-[11px] font-mono text-gray-500">
                  <span>{specimen.timeline}</span>
                  <span className="text-black group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Modal Specimen Dossier */}
      <AnimatePresence>
        {activeSpecimen && (
          <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 pb-4 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-amber-700 uppercase font-medium">
                    {activeSpecimen.code} • {activeSpecimen.period}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-0.5">
                    {activeSpecimen.name}
                  </h3>
                  <div className="text-xs text-gray-500 font-mono">
                    {activeSpecimen.commonName} • {activeSpecimen.timeline}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSpecimen(null)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Image Viewport */}
              <div className="relative w-full h-72 bg-gradient-to-b from-gray-50 via-white to-gray-100/50 p-8 flex items-center justify-center overflow-hidden border-b border-gray-100">
                <img
                  src={activeSpecimen.image}
                  alt={activeSpecimen.name}
                  className="max-h-full max-w-full object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300"
                />
              </div>

              {/* Modal Content Details */}
              <div className="p-6 overflow-y-auto space-y-4">
                <div>
                  <div className="text-xs font-mono tracking-wider text-gray-400 uppercase font-semibold mb-1">
                    Anatomical Description
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {activeSpecimen.description}
                  </p>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-mono uppercase text-gray-400 block">Length / Scale</span>
                    <span className="text-xs font-semibold text-gray-900">{activeSpecimen.length}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-mono uppercase text-gray-400 block">Dietary Profile</span>
                    <span className="text-xs font-semibold text-gray-900">{activeSpecimen.diet}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-mono uppercase text-gray-400 block">Taxonomy</span>
                    <span className="text-xs font-semibold text-gray-900">{activeSpecimen.categoryLabel}</span>
                  </div>
                </div>

                {/* Key Biological Features */}
                <div>
                  <div className="text-xs font-mono tracking-wider text-gray-400 uppercase font-semibold mb-2">
                    Key Morphological Features
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    {activeSpecimen.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-[11px] font-mono text-gray-500">
                <span>NATURAL HISTORY MUSEUM CURATION</span>
                <button
                  type="button"
                  onClick={() => setActiveSpecimen(null)}
                  className="px-4 py-1.5 rounded-full bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
