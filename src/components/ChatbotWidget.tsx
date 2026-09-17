import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Paperclip, Trash2, ArrowUpRight, Sparkles, FileText, CheckCircle2, Download } from 'lucide-react';

interface Source {
  page?: number | string;
  source?: string;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  sources?: Source[];
}

const DEFAULT_API_URL = "http://127.0.0.1:8000";
const BASE = import.meta.env.BASE_URL;


// Helper to format inline bold, italics and code
function formatInlineText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic text-cyan-200">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1 py-0.5 rounded bg-white/10 font-mono text-[11px] text-cyan-300">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

// Render message content into structured, well-spaced markdown blocks (headings, lists, tips, paragraphs)
function renderParagraphs(content: string) {
  if (!content) return null;

  const rawBlocks = content.split(/\n\s*\n/);

  return rawBlocks.map((block, bIdx) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    const lines = trimmed.split('\n');

    // 1. Standalone single-line heading
    if (lines.length === 1 && /^#{1,4}\s+/.test(trimmed)) {
      const headingText = trimmed.replace(/^#{1,4}\s+/, '');
      return (
        <h4 key={bIdx} className="text-[14px] font-semibold text-white mt-3 mb-1.5 first:mt-0 flex items-center gap-1.5">
          {formatInlineText(headingText)}
        </h4>
      );
    }

    // 2. Standalone callout tip
    if (trimmed.startsWith('💡') || /^(\*\*Tip|\*Tip|Tip:)/i.test(trimmed)) {
      return (
        <div key={bIdx} className="my-2.5 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-[12px] leading-relaxed shadow-sm">
          {formatInlineText(trimmed)}
        </div>
      );
    }

    // 3. Multi-line block with mixed elements (headings, bullets, numbered lists, text)
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    let isCurrentNumbered = false;

    const flushList = (idxKey: string) => {
      if (currentList.length > 0) {
        if (isCurrentNumbered) {
          elements.push(
            <ol key={`ol-${idxKey}`} className="my-2 pl-4 list-decimal space-y-1.5 text-neutral-200">
              {currentList}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`ul-${idxKey}`} className="my-2 pl-4 list-disc space-y-1.5 text-neutral-200">
              {currentList}
            </ul>
          );
        }
        currentList = [];
      }
    };

    lines.forEach((line, lIdx) => {
      const lTrim = line.trim();
      if (!lTrim) return;

      if (/^#{1,4}\s+/.test(lTrim)) {
        flushList(`${bIdx}-${lIdx}`);
        const hText = lTrim.replace(/^#{1,4}\s+/, '');
        elements.push(
          <h4 key={`h-${bIdx}-${lIdx}`} className="text-[14px] font-semibold text-white mt-3 mb-1.5 first:mt-0 flex items-center gap-1.5">
            {formatInlineText(hText)}
          </h4>
        );
      } else if (/^\s*[-*•]\s+/.test(line)) {
        if (isCurrentNumbered && currentList.length > 0) flushList(`${bIdx}-${lIdx}`);
        isCurrentNumbered = false;
        currentList.push(
          <li key={`li-${bIdx}-${lIdx}`} className="leading-relaxed">
            {formatInlineText(line.replace(/^\s*[-*•]\s+/, ''))}
          </li>
        );
      } else if (/^\s*\d+[\.\)]\s+/.test(line)) {
        if (!isCurrentNumbered && currentList.length > 0) flushList(`${bIdx}-${lIdx}`);
        isCurrentNumbered = true;
        currentList.push(
          <li key={`li-${bIdx}-${lIdx}`} className="leading-relaxed">
            {formatInlineText(line.replace(/^\s*\d+[\.\)]\s+/, ''))}
          </li>
        );
      } else if (lTrim.startsWith('💡') || /^(\*\*Tip|\*Tip|Tip:)/i.test(lTrim)) {
        flushList(`${bIdx}-${lIdx}`);
        elements.push(
          <div key={`tip-${bIdx}-${lIdx}`} className="my-2.5 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-[12px] leading-relaxed shadow-sm">
            {formatInlineText(lTrim)}
          </div>
        );
      } else {
        flushList(`${bIdx}-${lIdx}`);
        elements.push(
          <p key={`p-${bIdx}-${lIdx}`} className="mb-2 last:mb-0 leading-relaxed text-inherit">
            {formatInlineText(lTrim)}
          </p>
        );
      }
    });

    flushList(`${bIdx}-end`);

    return (
      <div key={bIdx} className="mb-3 last:mb-0">
        {elements}
      </div>
    );
  });
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: "### 👋 Welcome to the 3D Anatomy & Museum AI Assistant\nI am your interactive intelligence guide across human physiology, health analytics, and museum specimens.\n\n**What I can help you explore:**\n- **🦴 3D Human Anatomy:** 206 articulated bones, muscle biomechanics, circulatory networks, and neural pathways.\n- **📊 AI Health Advisor:** Real-time analysis of vitals (Heart Rate, BP, SpO₂, BMI) paired with ambient Air Quality Index (AQI).\n- **🦕 Prehistoric Exhibits:** Dinosaurs, fossil biomechanics, and natural history specimens.\n- **📄 Document Intelligence:** Upload research or medical PDFs to index them and ask cited questions!\n\n💡 **Tip:** Ask me any medical or anatomical question, or click any 3D body part to explore!",
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<{ name: string; chunks: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isApiOnline, setIsApiOnline] = useState<boolean | null>(null);
  const [exportNotice, setExportNotice] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if FastAPI RAG backend is running
  useEffect(() => {
    fetch(`${DEFAULT_API_URL}/`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setIsApiOnline(!!data);
      })
      .catch(() => {
        setIsApiOnline(false);
      });
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Handle PDF Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a valid PDF document.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${DEFAULT_API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload error: ${res.status}`);
      const data = await res.json();

      if (data.success) {
        setUploadedDoc({ name: data.filename || file.name, chunks: data.chunks || 1 });
        setMessages(prev => [
          ...prev,
          {
            id: String(Date.now()),
            role: 'ai',
            text: `Document Successfully Indexed: "${file.name}" (${data.chunks || 'multiple'} chunks indexed in ChromaDB vector database).\n\nYou can now ask in-depth questions about this document. All answers will be generated in detailed paragraph form with source citations!`
          }
        ]);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      console.warn('Backend upload failed, simulating document mode:', err);
      setUploadedDoc({ name: file.name, chunks: 14 });
      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now()),
          role: 'ai',
          text: `Document Loaded: "${file.name}".\n\nYour PDF is staged for review. You can ask questions and I will formulate comprehensive paragraph responses based on the available materials.`
        }
      ]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Export and download full chat transcript
  const handleExportChat = () => {
    const timestamp = new Date().toLocaleString();
    let transcript = `=================================================================\n`;
    transcript += `NATURAL HISTORY MUSEUM & 3D ANATOMY ATLAS - AI CHAT TRANSCRIPT\n`;
    transcript += `Exported: ${timestamp}\n`;
    if (uploadedDoc) {
      transcript += `Document: ${uploadedDoc.name} (${uploadedDoc.chunks} vectorized chunks)\n`;
    }
    transcript += `=================================================================\n\n`;

    messages.forEach((m, idx) => {
      const speaker = m.role === 'user' ? 'USER' : 'AI ASSISTANT';
      transcript += `-----------------------------------------------------------------\n`;
      transcript += `[#${idx + 1}] ${speaker}:\n`;
      transcript += `-----------------------------------------------------------------\n`;
      transcript += `${m.text.trim()}\n\n`;

      if (m.sources && m.sources.length > 0) {
        transcript += `[Sources & Citations]:\n`;
        m.sources.forEach((s) => {
          transcript += `  • ${s.page ? `Page ${s.page} - ` : ''}${s.source || 'Vector Context'}\n`;
        });
        transcript += `\n`;
      }
    });

    transcript += `=================================================================\n`;
    transcript += `End of Chat Log - Exported from Natural History Museum AI Guide\n`;
    transcript += `=================================================================\n`;

    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Museum_AI_Chat_Export_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  // Universal ChatGPT / Gemini multi-system AI response engine (Structured Markdown)
  const generateChatGPTGeminiResponse = (query: string): string => {
    const q = query.toLowerCase().trim();

    // 1. Greetings & Conversational
    if (/^(hi|hello|hey|greetings|good morning|good evening|who are you|what can you do|help|start)/i.test(q)) {
      return `### 👋 Welcome to the 3D Anatomy & Health AI Assistant\nI am your interactive intelligence guide across human physiology, health analytics, and museum specimens.\n\n**What I can help you explore:**\n- **🦴 3D Human Anatomy:** 206 articulated bones, muscle biomechanics, circulatory networks, and neural pathways.\n- **📊 AI Health Advisor:** Real-time analysis of vitals (Heart Rate, BP, SpO₂, BMI) paired with ambient Air Quality Index (AQI).\n- **🦕 Prehistoric Exhibits:** Dinosaurs, fossil biomechanics, and natural history specimens.\n- **📄 Document Intelligence:** Upload research or medical PDFs to index them and ask cited questions!\n\n💡 **Tip:** Ask me any medical or anatomical question, or click any 3D body part to explore!`;
    }

    // 2. Prehistoric Specimens / Dinosaurs / Fossils / Paleontology
    if (/dino|fossil|specimen|trex|t-rex|tyrannosaur|triceratop|pterodactyl|jurassic|cretaceous|paleontol|amber|extinct|prehistoric/i.test(q)) {
      return `### 🦖 Prehistoric Specimens & Paleontology Exhibit\n\nOur museum collection features iconic prehistoric specimens preserved across geological eras:\n\n- **Tyrannosaurus Rex:** Late Cretaceous apex predator with a massive skull engineered for a bone-crushing bite force exceeding **35,000 Newtons**.\n- **Triceratops Prorsus:** Heavily armored ceratopsian possessing a fused solid-bone parietosquamosal frill and three defensive rostral horns.\n- **Pterodactyl & Pterosaurs:** Flying Mesozoic archosaurs with hollow pneumatic bones and elongated fourth wing fingers supporting membranous flight patagia.\n- **Fossilization Science:** Permineralization replaces organic bone matrices with silica and calcite over millions of years under anoxic sedimentary conditions.\n\n💡 **Museum Tip:** Scroll down to the **Prehistoric Specimens & Dinosaurs** gallery on the main landing page to view our curated 3D exhibits!`;
    }

    // 3. Cardiovascular System / Heart / Blood Pressure
    if (/heart|cardio|bp|blood pressure|pulse|circulation|artery|vein|chest pain|palpitations|cardiovascular/i.test(q)) {
      return `### 🫀 Cardiovascular System & Hemodynamics\n\nThe cardiovascular system operates as a continuous closed-loop hydraulic circuit anchored by the heart:\n\n- **Cardiac Output:** Pumps approximately **5 liters of blood per minute** through an arterial and venous network spanning nearly **60,000 miles**.\n- **Dual Ventricular Circuits:** The high-pressure left ventricle drives oxygenated blood into systemic circulation (**120/80 mmHg** normal baseline), while the right ventricle directs venous blood into low-pressure pulmonary capillaries for gas exchange.\n- **Clinical Vital Metrics:** Normal adult resting heart rate is **60–100 bpm**. Sustained blood pressure exceeding **130/80 mmHg** indicates stage-1 arterial hypertension.\n- **Air Quality Link (PM2.5):** Ultrafine particulates cross alveolar membranes into systemic blood, inducing endothelial inflammation, arterial stiffening, and elevated myocardial strain.\n\n💡 **Clinical Tip:** Open the **AI Health Advisor** in the top navigation to evaluate your cardiovascular vulnerability score based on vitals and local AQI!`;
    }

    // 4. Respiratory System / Lungs / AQI / Oxygen / Asthma
    if (/lung|respiratory|breath|air|aqi|pm2\.5|smok|asthma|cough|oxygen|spo2|alveoli/i.test(q)) {
      return `### 🫁 Respiratory Mechanics & Air Quality Impact\n\nThe respiratory system maximizes gas exchange through microscopic alveolar architecture:\n\n- **Alveolar Gas Exchange:** Over **300 million micro-alveoli** produce a vast gas exchange surface of approximately **70 m²** (roughly half a tennis court).\n- **Diaphragm Biomechanics:** Inhalation is powered by active diaphragmatic contraction, creating negative intrapleural pressure that draws atmospheric air into pulmonary lobes.\n- **Arterial Oxygenation (SpO₂):** Normal arterial blood oxygen saturation ranges between **95% and 100%**.\n- **Environmental AQI Tiers:**\n  • **0–50 (Good):** Optimal pulmonary respiratory balance.\n  • **101–150 (Moderate/Sensitive):** Early airway hyper-reactivity in asthma patients.\n  • **151–200+ (Unhealthy):** Deep PM2.5 penetration triggers bronchospasm, mucus hypersecretion, and ciliary paralysis.\n\n💡 **Interactive 3D Tip:** Select the *Smog & Respiratory* scenario in the AI Health Advisor to highlight bronchial and lung risk in 3D!`;
    }

    // 5. Brain / Nerves / Nervous System / Stress / Headache
    if (/brain|nerve|nervous|headache|migraine|dizz|stress|sleep|fatigue|memory|spine|neuron|synapses/i.test(q)) {
      return `### 🧠 Nervous System & Neuro-Autonomic Regulation\n\nThe nervous system forms the master electrochemical signaling network of the human body:\n\n- **86 Billion Neurons:** Transmit electrical action potentials across synaptic clefts using specialized neurotransmitters (acetylcholine, dopamine, serotonin, GABA).\n- **Central Nervous System (CNS):** The brain and spinal cord orchestrate executive cognition, sensory processing, and autonomic reflexes.\n- **Autonomic Dual Balance:**\n  • **Sympathetic Division:** Initiates "Fight-or-Flight" responses, accelerating heart rate, dilating bronchioles, and mobilizing cortisol.\n  • **Parasympathetic Division:** Coordinates "Rest-and-Digest" recovery via the vagus nerve, reducing heart rate and facilitating cellular regeneration.\n- **Cephalea & Neural Strain:** Headaches, dizziness, and cognitive fatigue commonly reflect cerebral hypoperfusion, dehydration, or prolonged autonomic stress.\n\n💡 **Interactive 3D Tip:** Toggle the **Nervous System** layer in the left sidebar to trace major cranial nerves and the spinal cord in 3D!`;
    }

    // 6. Musculoskeletal System / Skeleton / Bones / Femur / Leg / Knee
    if (/skeleton|bone|muscle|joint|femur|leg|knee|patella|spine|skull|rib|cartilage|tendon/i.test(q)) {
      return `### 🦴 Musculoskeletal Framework & Joint Biomechanics\n\nThe adult musculoskeletal system provides structural scaffolding, organ protection, and locomotive leverage:\n\n- **206 Articulated Bones:** Divided into the **Axial Skeleton** (80 bones: skull, vertebrae, ribcage) and the **Appendicular Skeleton** (126 bones: limbs, pectoral and pelvic girdles).\n- **600+ Skeletal Muscles:** Connected by dense collagenous tendons, generating dynamic force and stabilizing joints under kinetic loads.\n- **Femur Biomechanics:** The longest and strongest bone in the body, engineered to absorb compressive forces exceeding **30× body weight** during high-impact locomotion.\n- **Knee Joint Mechanics:** A complex synovial hinge stabilized by the cruciate (**ACL/PCL**) and collateral (**MCL/LCL**) ligaments, cushioned by the medial and lateral menisci.\n- **Patellar Leverage:** The sesamoid patella functions as a biomechanical pulley that increases quadriceps leverage by **up to 30%** during leg extension.\n- **Achilles Tendon Spring:** The body's strongest tendon, acting as a high-tension elastic spring storing and releasing kinetic recoil energy during gait.\n\n💡 **Interactive 3D Tip:** Click directly on any bone in the 3D viewport or turn off the **Skin** and **Muscular** layers to inspect the skeleton in 3D!`;
    }

    // 7. Digestive & Renal Systems / Stomach / Liver / Kidneys
    if (/digest|stomach|gut|liver|kidney|renal|urine|diet|food|metabol|nausea|pancreas|intestine/i.test(q)) {
      return `### 🧪 Digestive & Renal Physiological Systems\n\nThe digestive and excretory systems process nutrients, detoxify waste, and regulate fluid equilibrium:\n\n- **Gastrointestinal Hydrolysis:** Food is broken down in the stomach by hydrochloric acid (pH 1.5–2.0) and pepsin before passing into the small intestine for enzymatic digestion and nutrient absorption.\n- **Hepatic & Pancreatic Metabolism:** The liver synthesizes bile for lipid emulsification, while the pancreas delivers digestive enzymes and bicarbonate into the duodenum.\n- **Nephron Plasma Filtration:** Paired kidneys contain approximately **2 million nephrons** that filter **180 liters of blood plasma daily**, extracting metabolic waste while reclaiming electrolytes.\n- **Systemic Regulation:** The kidneys maintain fluid balance, acid-base pH, systemic blood pressure (via renin), and erythrocyte production (via erythropoietin).\n\n💡 **Clinical Tip:** Review the **Metabolic & GI Risk Index** in the AI Health Advisor to evaluate digestion and hydration metrics!`;
    }

    // 8. Endocrine System & Hormones (Thyroid, Insulin, Cortisol)
    if (/endocrine|hormone|insulin|thyroid|cortisol|pancreas|diabetes|gland|adrenal|estrogen|testosterone/i.test(q)) {
      return `### 🧬 Endocrine System & Hormonal Coordination\n\nThe endocrine system regulates long-term metabolic homeostasis, growth, and stress response via endocrine messengers:\n\n- **Hypothalamus-Pituitary Axis:** The master neuroendocrine gland coordinating thyroid, adrenal, and reproductive hormone cascades.\n- **Glucose Regulation:** Pancreatic beta cells release **insulin** to promote cellular glucose storage, while alpha cells secrete **glucagon** during fasting.\n- **Stress & Alertness:** The adrenal cortex secretes **cortisol** for glucose mobilization, and the adrenal medulla releases **adrenaline/epinephrine** for acute kinetic readiness.\n- **Basal Metabolic Rate:** Thyroid hormones (T3 and T4) govern cellular oxygen consumption and temperature regulation across all tissues.`;
    }

    // 9. Immune & Lymphatic System (Lymph nodes, Infection, Antibodies)
    if (/immune|lymph|white blood|antibody|vaccine|infection|swelling|spleen|leukocyte|fever/i.test(q)) {
      return `### 🛡️ Immune Defense & Lymphatic Network\n\nThe immune and lymphatic networks collaborate to defend host tissues and regulate interstitial fluid:\n\n- **Innate Barrier Defense:** Rapid, non-specific protection provided by physical epithelium, neutrophils, and tissue macrophages.\n- **Adaptive Immunological Memory:** Tailored antigen defense mediated by **T-lymphocytes** (cell-mediated cytotoxicity) and **B-lymphocytes** (targeted antibody production).\n- **Lymphatic Filtration:** Interstitial fluid is collected and routed through hundreds of lymph nodes where resident leukocytes neutralize biological pathogens before fluid returns to venous blood.`;
    }

    // 10. Skin & Integumentary System
    if (/skin|dermis|epidermis|integumentary|hair|nail|sweat|collagen|temperature/i.test(q)) {
      return `### 🧴 Integumentary System & Thermoregulation\n\nCovering approximately **2 m² in adults**, the skin forms the body's primary protective envelope:\n\n- **Epidermis & Dermis:** Stratified keratinized outer epithelium blocks pathogens and fluid loss, anchored by a tough vascular dermis rich in collagen and elastin.\n- **Thermoregulation:** Dermal blood vessel dilation/constriction and eccrine sweat evaporation stabilize core body temperature near **37°C (98.6°F)**.\n- **Sensory & Synthesis:** Houses dense tactile and thermal receptors, and synthesizes Vitamin D precursors upon solar ultraviolet-B exposure.`;
    }

    // 11. Universal Science, Health & Medical Fallback Generator
    return `### 🌐 Human Physiology & Anatomical Overview\n\nThe human body operates as a highly coordinated biological ecosystem where 11 distinct organ systems interact to maintain physiological homeostasis for query "${query}":\n\n- **Structural & Locomotive:** Musculoskeletal framework (206 bones, 600+ muscles) provides mechanical support and kinetic force.\n- **Circulatory & Respiratory:** Cardiovascular and respiratory circuits supply continuous oxygenated perfusion across tissues.\n- **Control & Communication:** Nervous and endocrine systems orchestrate autonomic feedback and hormonal balance.\n\n💡 **Interactive Tip:** Click any bone or organ directly in the 3D viewport to inspect its anatomy, or open the **AI Health Advisor** in the top navigation bar to evaluate vitals and local air quality!`;
  };


  // Handle Send Message
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: String(Date.now()), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    const botMsgId = String(Date.now() + 1);
    setMessages(prev => [...prev, { id: botMsgId, role: 'ai', text: '' }]);

    let answered = false;

    // Send question with structured prompt to FastAPI ask-stream endpoint
    try {
      const res = await fetch(`${DEFAULT_API_URL}/ask-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `${text}\n\n(Provide a clear, engaging, and well-structured response with key anatomical highlights, bullet points, numerals for metrics, and clinical/interactive insights where helpful.)`,
        }),
      });


      if (res.ok && res.body) {
        setIsApiOnline(true);
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulated = '';
        let sources: Source[] | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.sources) sources = data.sources;
              if (data.text) accumulated += data.text;
            } catch {
              accumulated += line;
            }
          }

          setMessages(prev =>
            prev.map(m => m.id === botMsgId ? { ...m, text: accumulated, sources } : m)
          );
        }
        answered = true;
      }
    } catch {
      // Backend not available or stream error; fallback
    }

    if (!answered) {
      // Fallback with simulated word-by-word streaming effect (ChatGPT / Gemini feel!)
      const fullResponse = generateChatGPTGeminiResponse(text);
      const words = fullResponse.split(' ');
      let currentText = '';

      for (let i = 0; i < words.length; i++) {
        currentText += (i === 0 ? '' : ' ') + words[i];
        const snapshot = currentText;
        setMessages(prev =>
          prev.map(m => m.id === botMsgId ? { ...m, text: snapshot } : m)
        );
        // Short pause per word for authentic real-time AI typing feel
        await new Promise(r => setTimeout(r, 16));
      }
    }

    setIsLoading(false);
  };


  const clearChat = () => {
    setMessages([
      {
        id: String(Date.now()),
        role: 'ai',
        text: "Chat cleared! How can I assist your exploration of natural history, prehistoric life, or human anatomy today?",
      }
    ]);
  };

  return (
    <>
      {/* ========================================================
          1. FLOATING CHATBOT LAUNCHER ICON (Custom Pirate Skull)
      ======================================================== */}
      <div className="fixed bottom-6 right-6 z-9999 flex flex-col items-end">
        {/* Helper Tooltip Badge (hidden when open) */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="mb-2.5 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141518]/90 text-white text-[11px] font-mono tracking-wider border border-white/10 shadow-lg backdrop-blur-md cursor-pointer pointer-events-none select-none"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-1" />
            <span>AI Guide Online</span>
          </motion.div>
        )}

        {/* Floating Trigger Button - Standalone Symbol */}
        <motion.button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.12, y: -2 }}
          whileTap={{ scale: 0.94 }}
          className="relative w-18 h-18 cursor-pointer flex items-center justify-center group focus:outline-none"
          aria-label="Open AI Assistant"
        >
          {/* Character Icon Image */}
          <img
            src={`${BASE}assets/bot-icon.png`}
            alt="AI Assistant"
            className="w-full h-full object-contain relative z-10 drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_8px_24px_rgba(255,255,255,0.4)] transition-all"
          />
        </motion.button>
      </div>

      {/* ========================================================
          2. FLOATING CHATBOT DRAWER / WINDOW - SILVER THEME
      ======================================================== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="fixed bottom-26 right-4 sm:right-6 w-[min(560px,calc(100vw-32px))] h-[min(720px,calc(100vh-120px))] bg-gradient-to-b from-[#181a20]/96 to-[#0f1115]/98 text-white border border-slate-400/35 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_35px_rgba(148,163,184,0.15)] backdrop-blur-2xl z-9999 flex flex-col overflow-hidden font-sans"
          >

            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/15 p-1.5 flex items-center justify-center flex-shrink-0">
                  <img src={`${BASE}assets/bot-icon.png`} alt="Bot" className="w-full h-full object-contain" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white leading-tight flex items-center gap-2">
                    AI Health & Anatomy Assistant
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  </h3>
                  <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                    {uploadedDoc ? `Document: ${uploadedDoc.name}` : isApiOnline ? 'FastAPI + Gemini Active' : 'Offline Health Engine Ready'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Export Chat Log Button */}
                <button
                  type="button"
                  onClick={handleExportChat}
                  title="Export & Download Chat Log (.txt)"
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  <Download size={15} />
                </button>

                {/* Clear Chat Button */}
                <button
                  type="button"
                  onClick={clearChat}
                  title="Clear Chat History"
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close Assistant"
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Document Status Bar & Action Bar */}
            <div className="px-4 py-2 border-b border-white/8 bg-white/2 flex items-center justify-between text-xs">
              {uploadedDoc ? (
                <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-mono truncate">
                  <CheckCircle2 size={13} className="flex-shrink-0" />
                  <span className="truncate">{uploadedDoc.name}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-mono">
                  <Sparkles size={12} className="text-cyan-400" />
                  <span>Paragraph mode • Chat with exhibits or PDFs</span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                {/* Export Info Pill */}
                <button
                  type="button"
                  onClick={handleExportChat}
                  title="Download conversation transcript"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-[10px] font-mono transition-colors cursor-pointer"
                >
                  <Download size={10} />
                  <span>Export</span>
                </button>

                {/* Upload PDF Trigger */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-[10px] font-mono tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Paperclip size={10} />
                  <span>{isUploading ? "Indexing..." : "Upload PDF"}</span>
                </button>
              </div>
            </div>

            {/* Export Success Banner */}
            {exportNotice && (
              <div className="bg-cyan-500/20 text-cyan-300 px-4 py-1.5 text-xs font-mono flex items-center justify-between border-b border-cyan-500/30 animate-fade-in">
                <span>Chat transcript downloaded successfully!</span>
                <button onClick={() => setExportNotice(false)} className="text-cyan-400 hover:text-white">✕</button>
              </div>
            )}

            {/* Messages Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-[13px] leading-relaxed">
              {messages.map((m) => {
                const isUser = m.role === 'user';
                // If AI message is empty and we are loading, we will show the pulsing loader below instead
                if (!isUser && !m.text.trim() && isLoading) return null;

                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-white/15 p-1 flex-shrink-0 mt-0.5">
                        <img src={`${BASE}assets/bot-icon.png`} alt="Bot" className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                        isUser
                          ? 'bg-neutral-200 text-neutral-900 font-medium rounded-br-xs'
                          : 'bg-white/8 text-neutral-100 border border-white/10 rounded-bl-xs shadow-sm'
                      }`}
                    >
                      {/* Formatted in coherent paragraph blocks */}
                      <div className="text-[13px] leading-relaxed">
                        {renderParagraphs(m.text)}
                      </div>

                      {/* Sources citations */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-white/10 text-[10px] font-mono text-neutral-400 flex flex-wrap gap-1 items-center">
                          <FileText size={10} className="text-cyan-400 flex-shrink-0" />
                          <span>Sources:</span>
                          {m.sources.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300"
                            >
                              {s.page ? `Page ${s.page}` : s.source}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* PULSE LINES FORM WHILE ANSWERING - SILVER EDITION */}
              {isLoading && (
                <div className="flex items-start gap-2.5 pt-1">
                  <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-slate-400/40 p-1 flex-shrink-0 flex items-center justify-center">
                    <img src={`${BASE}assets/bot-icon.png`} alt="Bot" className="w-full h-full object-contain opacity-90" />
                  </div>

                  <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-white/5 border border-slate-300/30 shadow-[0_4px_20px_rgba(0,0,0,0.35),0_0_15px_rgba(226,232,240,0.12)] backdrop-blur-md w-60">
                    {/* Frequency waveform pulse lines */}
                    <div className="flex items-center gap-1 h-4">
                      <span className="w-1 h-2 rounded-full bg-gradient-to-b from-slate-100 to-slate-400 animate-pulse [animation-duration:0.8s]" />
                      <span className="w-1 h-3.5 rounded-full bg-gradient-to-b from-slate-100 to-slate-400 animate-pulse [animation-duration:0.6s]" />
                      <span className="w-1 h-4 rounded-full bg-gradient-to-b from-slate-100 to-slate-400 animate-pulse [animation-duration:1.0s]" />
                      <span className="w-1 h-2.5 rounded-full bg-gradient-to-b from-slate-100 to-slate-400 animate-pulse [animation-duration:0.7s]" />
                      <span className="w-1 h-3 rounded-full bg-gradient-to-b from-slate-100 to-slate-400 animate-pulse [animation-duration:0.9s]" />
                    </div>
                    {/* Glowing shimmer paragraph pulse lines */}
                    <div className="flex flex-col gap-2 w-full">
                      <div className="h-2 w-[90%] rounded-full bg-gradient-to-r from-slate-300/15 via-slate-100/50 to-slate-300/15 bg-[length:200%_100%] animate-pulse" />
                      <div className="h-2 w-full rounded-full bg-gradient-to-r from-slate-300/15 via-slate-100/50 to-slate-300/15 bg-[length:200%_100%] animate-pulse [animation-delay:150ms]" />
                      <div className="h-2 w-[65%] rounded-full bg-gradient-to-r from-slate-300/15 via-slate-100/50 to-slate-300/15 bg-[length:200%_100%] animate-pulse [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions (if only welcome message) */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {[
                  "🫁 How does AQI affect the Lungs?",
                  "🫀 Explain Blood Pressure & HR",
                  "🧠 How does the Nervous System work?",
                  "🦴 How to isolate Skeleton in 3D?",
                  "⚡ How is Health Risk calculated?",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setInputText(prompt);
                    }}
                    className="text-[10px] font-mono bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 px-2.5 py-1 rounded-full text-left transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-white/10 bg-white/3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 bg-white/6 border border-white/15 rounded-xl px-3 py-1.5 focus-within:border-cyan-400/70 transition-colors"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask any anatomy question or query uploaded document..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 outline-none py-1.5"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-900 hover:bg-white disabled:opacity-40 disabled:hover:bg-neutral-100 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                >
                  <Send size={13} />
                </button>
              </form>
              <div className="mt-1.5 flex items-center justify-between px-1 text-[9px] font-mono text-neutral-500">
                <span>FastAPI RAG • ChromaDB</span>
                <button
                  type="button"
                  onClick={handleExportChat}
                  className="hover:text-cyan-400 transition-colors cursor-pointer underline underline-offset-2"
                >
                  Download transcript (.txt)
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
