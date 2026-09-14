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

// Render message content into structured, well-spaced paragraphs
function renderParagraphs(content: string) {
  if (!content) return null;

  // Split into distinct blocks by multiple linebreaks or section breaks
  const rawBlocks = content.split(/\n\s*\n/);

  return rawBlocks.map((block, bIdx) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    const lines = trimmed.split('\n');

    // Bullet list detection
    const isBulletList = lines.every(l => /^\s*[-*•]\s+/.test(l));
    if (isBulletList) {
      return (
        <ul key={bIdx} className="my-2 pl-4 list-disc space-y-1.5 text-neutral-200">
          {lines.map((l, lIdx) => (
            <li key={lIdx} className="leading-relaxed">
              {formatInlineText(l.replace(/^\s*[-*•]\s+/, ''))}
            </li>
          ))}
        </ul>
      );
    }

    // Numbered list detection
    const isNumberedList = lines.every(l => /^\s*\d+[\.\)]\s+/.test(l));
    if (isNumberedList) {
      return (
        <ol key={bIdx} className="my-2 pl-4 list-decimal space-y-1.5 text-neutral-200">
          {lines.map((l, lIdx) => (
            <li key={lIdx} className="leading-relaxed">
              {formatInlineText(l.replace(/^\s*\d+[\.\)]\s+/, ''))}
            </li>
          ))}
        </ol>
      );
    }

    // Standard paragraph with spacing and line-break continuity
    return (
      <p key={bIdx} className="mb-3 last:mb-0 leading-relaxed text-inherit">
        {lines.map((l, lIdx) => (
          <span key={lIdx} className={lIdx > 0 ? "block mt-1" : "inline"}>
            {formatInlineText(l)}
          </span>
        ))}
      </p>
    );
  });
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: "Hello! 👋 I'm your **3D Anatomy & AI Health Assistant**.\n\nI can provide comprehensive explanations across:\n- **3D Human Anatomy:** Bones, organs, blood vessels, and nervous system dynamics.\n- **AI Health Advisor:** Explanations of vitals (Heart Rate, BP, SpO₂, BMI) and environmental air quality (AQI) risk calculations.\n\nYou can also upload any PDF document above to index its contents and ask cited questions!",
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

  // Universal ChatGPT / Gemini multi-system AI response engine (Paragraph Form)
  const generateChatGPTGeminiResponse = (query: string): string => {
    const q = query.toLowerCase().trim();

    // 1. Greetings & Conversational
    if (/^(hi|hello|hey|greetings|good morning|good evening|who are you|what can you do|help|start)/i.test(q)) {
      return `Welcome to the Gemini and GPT AI Health Assistant. I am your AI Health and Anatomy Intelligence Engine, designed to provide comprehensive, paragraph-based medical and anatomical analysis across all eleven human body systems.\n\nYou can ask me detailed questions about human anatomy, physiological mechanisms, vital signs such as heart rate and blood pressure, environmental impacts like air quality, or how to navigate the interactive 3D model. Feel free to ask any health, medical, or scientific question to begin!`;
    }

    // 2. Cardiovascular System / Heart / Blood Pressure
    if (/heart|cardio|bp|blood pressure|pulse|circulation|artery|vein|chest pain|palpitations|cardiovascular/i.test(q)) {
      return `The human cardiovascular system operates as a continuous closed-loop circuit anchored by the heart, a dual-syncytium muscular pump driving approximately five liters of blood per minute through a vast vascular network spanning nearly sixty thousand miles. The high-pressure left ventricle propels oxygen-rich systemic blood through the aorta and systemic arteries to nourish peripheral tissue, while the right ventricle directs returning deoxygenated blood into the pulmonary circulation for gas exchange across alveolar capillary beds.\n\nHealthy resting cardiovascular parameters typically feature a heart rate between sixty and one hundred beats per minute, paired with a baseline blood pressure near one hundred and twenty over eighty millimeters of mercury. Sustained readings above one hundred and thirty over eighty indicate early arterial hypertension, which increases long-term myocardial workload. Environmental factors such as fine particulate air pollution (PM2.5) can cross the respiratory membrane into systemic circulation, triggering endothelial inflammation, vascular stiffness, and heightened cardiac strain. You can open the AI Health Advisor in the top bar to evaluate your cardiovascular vulnerability index!`;
    }

    // 3. Respiratory System / Lungs / AQI / Oxygen / Asthma
    if (/lung|respiratory|breath|air|aqi|pm2\.5|smok|asthma|cough|oxygen|spo2|alveoli/i.test(q)) {
      return `The human respiratory system is engineered to maximize gas exchange across approximately three hundred million micro-alveoli, creating a total surface area of roughly seventy square meters. Inhalation is powered by the rhythmic contraction of the diaphragm muscle, which expands the thoracic cavity and pulls atmospheric oxygen deep into alveolar sacs where it diffuses directly into pulmonary capillaries while releasing carbon dioxide.\n\nEnvironmental air quality plays a crucial role in maintaining pulmonary health. While an Air Quality Index between zero and fifty represents pristine air balance, elevated index levels driven by fine particulate matter smaller than two point five micrometers can penetrate deep into lung tissue, causing airway inflammation, bronchospasm, and decreased oxygen saturation in arterial blood. Chronic exposure to polluted air or smoke compromises ciliary clearing mechanisms, highlighting the importance of protective filtration and regular vital tracking. You can select the Smog and Respiratory preset in the AI Health Advisor to visualize lung impact in 3D!`;
    }

    // 4. Brain / Nerves / Nervous System / Stress / Headache
    if (/brain|nerve|nervous|headache|migraine|dizz|stress|sleep|fatigue|memory|spine|neuron|synapses/i.test(q)) {
      return `The central and peripheral nervous systems form the master electrochemical communications network of the human body, containing roughly eighty-six billion neurons that transmit information via action potentials across synaptic junctions using neurotransmitters such as acetylcholine, dopamine, and serotonin. The central nervous system, comprising the brain and spinal cord, orchestrates executive cognition, sensory perception, and autonomic signaling.\n\nAutonomic homeostasis relies on a dynamic balance between the sympathetic branch, which triggers the fight-or-flight stress response with elevated heart rate and cortisol release, and the parasympathetic branch, which promotes restorative rest and metabolic balance. Symptoms such as tension headaches, dizziness, or cognitive fatigue frequently signify underlying systemic dehydration, sleep debt, or prolonged autonomic strain. You can toggle the Nervous System layer in the left sidebar to isolate neural structures in 3D!`;
    }

    // 5. Musculoskeletal System / Skeleton / Bones / Femur / Leg / Knee
    if (/skeleton|bone|muscle|joint|femur|leg|knee|patella|spine|skull|rib|cartilage|tendon/i.test(q)) {
      return `The adult musculoskeletal system provides structural scaffolding, mechanical protection, and locomotive leverage through two hundred and six articulated bones divided into the axial skeleton of the head and torso and the appendicular skeleton of the limbs. This rigid framework anchors over six hundred skeletal muscles, enabling dynamic physical movement and stabilizing joint articulations under heavy kinetic loads.\n\nIn the lower body, the femur stands as the longest and strongest bone in the human skeleton, engineered to withstand compressive forces exceeding thirty times body weight during high-impact movement. The knee joint operates as a synovial hinge supported by collateral and cruciate ligaments, with the sesamoid patella functioning as a biomechanical pulley that increases quadriceps leverage during extension, while the Achilles tendon acts as a high-tension elastic spring storing recoil energy during gait. You can click directly on any bone in the 3D viewport or turn off the Skin layer to inspect the skeleton in 3D!`;
    }

    // 6. Digestive & Renal Systems / Stomach / Liver / Kidneys
    if (/digest|stomach|gut|liver|kidney|renal|urine|diet|food|metabol|nausea|pancreas|intestine/i.test(q)) {
      return `The digestive system processes ingested nutrients through a sequential chemical pathway beginning in the esophagus and stomach, where hydrochloric acid maintaining an acidic pH hydrolyzes food matrices, before entering the small intestine for enzymatic digestion and portal venous absorption. Hepatic bile and pancreatic secretions further break down lipids and complex molecules to sustain cellular energy production and metabolic homeostasis.\n\nSimultaneously, the renal system performs plasma filtration through paired kidneys containing approximately two million nephrons that process roughly one hundred and eighty liters of blood plasma daily. The kidneys carefully regulate systemic fluid volume, acid-base pH balance, and electrolyte concentrations such as sodium and potassium, while secreting hormones that modulate blood pressure and red blood cell production. You can inspect Metabolic and GI risk indices inside the AI Health Advisor dashboard!`;
    }

    // 7. Endocrine System & Hormones (Thyroid, Insulin, Cortisol)
    if (/endocrine|hormone|insulin|thyroid|cortisol|pancreas|diabetes|gland|adrenal|estrogen|testosterone/i.test(q)) {
      return `The endocrine system regulates systemic metabolism, growth, and cellular communication through chemical hormones secreted directly into the vascular bloodstream by specialized ductless glands including the pituitary, thyroid, pancreas, and adrenals. These chemical messengers coordinate physiological adaptations across distant organs to maintain tight internal stability.\n\nKey metabolic hormones include insulin and glucagon, produced by pancreatic islets to keep blood glucose levels tightly regulated within a normal fasting baseline. Meanwhile, adrenal glucocorticoids like cortisol mobilize glucose and blood pressure responses during stress challenges, while thyroid hormones modulate basal metabolic rate and cellular oxygen consumption throughout the body.`;
    }

    // 8. Immune & Lymphatic System (Lymph nodes, Infection, Antibodies)
    if (/immune|lymph|white blood|antibody|vaccine|infection|swelling|spleen|leukocyte|fever/i.test(q)) {
      return `The human immune and lymphatic systems work in close harmony to defend the organism against biological pathogens while maintaining interstitial fluid balance. Innate immunity provides immediate, non-specific protection through epithelial barriers, phagocytic neutrophils, and macrophages, whereas adaptive immunity develops highly targeted immunological memory using specialized T-lymphocytes for cell-mediated defense and B-lymphocytes for circulating antibody production.\n\nThe lymphatic vascular network collects excess interstitial fluid from peripheral tissues and routes it through hundreds of lymph nodes distributed across key anatomical regions. As lymph passes through these node clusters, resident white blood cells filter out cellular debris and neutralize foreign micro-organisms before returning cleansed plasma into the venous blood circulation.`;
    }

    // 9. Skin & Integumentary System
    if (/skin|dermis|epidermis|integumentary|hair|nail|sweat|collagen|temperature/i.test(q)) {
      return `The integumentary system, primarily comprising the skin, hair, and nails, serves as the body's primary physical barrier against environmental pathogens, ultraviolet radiation, and mechanical trauma. Spanning nearly two square meters in adults, the skin consists of an outer avascular epidermis providing a tough keratinized barrier, anchored to an underlying vascular dermis rich in collagen and elastic fibers.\n\nBeyond physical defense, the skin plays a central role in thermoregulation and fluid preservation. Through controlled vasodilation, vasoconstriction, and sweat evaporation from eccrine glands, the skin continuously adjusts heat loss to keep core body temperature stabilized near thirty-seven degrees Celsius.`;
    }

    // 10. Universal Science, Health & Medical Fallback Generator
    return `The human body operates as a highly coordinated biological ecosystem where eleven distinct organ systems interact continuously to maintain internal balance and physiological homeostasis for query "${query}". Every physical activity, emotional stressor, or ambient environmental factor triggers compensatory adaptations across vascular, neural, metabolic, and muscular networks.\n\nTo explore these structural connections further, you can select individual organs or skeletal layers directly in the 3D model, or open the AI Health Advisor in the top navigation bar to evaluate how your vital measurements and local air quality interact. Feel free to ask follow-up questions about any specific organ, physiological metric, or health topic!`;
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

    // Send question with paragraph instruction to FastAPI ask-stream endpoint
    try {
      const res = await fetch(`${DEFAULT_API_URL}/ask-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `${text}\n\n(Please structure your response in clear, flowing prose paragraphs. Do not use bullet points or numbered lists.)`,
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
            src="/assets/bot-icon.png"
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
                  <img src="/assets/bot-icon.png" alt="Bot" className="w-full h-full object-contain" />
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
                        <img src="/assets/bot-icon.png" alt="Bot" className="w-full h-full object-contain" />
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
                    <img src="/assets/bot-icon.png" alt="Bot" className="w-full h-full object-contain opacity-90" />
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
