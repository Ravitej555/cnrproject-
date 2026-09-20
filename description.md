# SMART HEALTH ADVISORY SYSTEM USING AI
## Comprehensive 3D Human Anatomy Visualization & Environmental Risk Modeling

### 🌐 Live Demo URLs:
* **Interactive 3D Web Application:** [https://ravitej555.github.io/cnrproject-/](https://ravitej555.github.io/cnrproject-/)
* **Direct 3D Anatomy Atlas:** [https://ravitej555.github.io/cnrproject-/anatomy.html](https://ravitej555.github.io/cnrproject-/anatomy.html)
* **Direct AI Health Advisor Dashboard:** [https://ravitej555.github.io/cnrproject-/anatomy.html?openAdvisor=true](https://ravitej555.github.io/cnrproject-/anatomy.html?openAdvisor=true)

---


## 1. Executive Summary & Project Overview

The **Smart Health Advisory System Using AI** is an advanced interactive biomedical informatics web application. It bridges personal biometrics, environmental air pollution intelligence, and medical risk modeling with realistic, hardware-accelerated **3D Human Anatomy Visualization**.

The platform is designed to educate, empower, and assist individuals in comprehending how physiological parameters (such as Heart Rate, Blood Pressure, SpO₂, Body Temperature, and Respiratory Rate), lifestyle habits, and ambient air pollutants (Air Quality Index - AQI, PM2.5, PM10, CO, NO₂, O₃) interact dynamically to influence health across 11 human organ systems. 

Unlike conventional diagnostic tools or black-box health portals, this system provides:
* **Multi-Factorial Heuristic Risk Engine:** Computes an explainable Risk Score (0–100) and stratified Risk Level (Low, Moderate, High, Urgent).
* **Multi-System Attribution Matrix:** Quantifies exact proportional contributions from Hemodynamics, Symptoms, Environmental Air Quality, and Lifestyle.
* **3D Anatomical Correlation & Organ Highlighting:** Seamlessly navigates the user directly to the targeted organ (e.g., Lungs, Heart, Brain, Stomach, Kidneys) within an interactive Three.js 3D human body model.
* **Paragraph-Form AI Advisory Generation:** Synthesizes actionable, prose-based health advice tailored directly to patient metrics without cryptic medical shorthand or bullet lists.
* **AI Chatbot Guide:** Provides multi-system anatomy and medical explanations, interactive click-to-explain structure exploration, and RAG document indexing (FastAPI + ChromaDB ready).

---

## 2. Core Architectural Components

The codebase is organized into four interconnected functional layers:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                            │
│  React 19 Landing Page (App.tsx)   ◄──►   3D Anatomy WebGL (anatomy.html)│
│  Tailwind CSS v4 & Motion                 Three.js Real-time Viewport   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                       AI HEALTH ADVISORY ENGINE                         │
│  AdvisorModal.js         healthAdvisor.js        riskEngine.js          │
│  (Interactive Dashboard) (Scenario Presets)     (Factorial Algorithm)  │
│          ▲                        ▲                       ▲             │
│          │                        │                       │             │
│  healthRules.js          historyService.js       symptomAnalysis.js     │
│  (Clinical Normal Ranges)(Local Storage Logs)    (Cross-Synergy Model)  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                        3D ANATOMY RENDERING CORE                        │
│  HumanModel.js (Three.js Scene)        SkeletonAsset.js (Bones)         │
│  AnatomyAsset.js (Organ GLB Mesh)      materials.js & alignment.js     │
│  Draco Compressed Meshes               Raycasting & OrbitControls       │
└─────────────────────────────────────────────────────────────────────────┘
```

### A. Frontend Application & Landing Experience (`src/App.tsx`, `index.html`)
* **Modern Interface:** Powered by **React 19**, **Tailwind CSS v4**, and **Motion** (Framer Motion).
* **Cinematic Video & Audio-visual Presentation:** Showcases system capabilities, project roadmap, and multi-system flowcharts.
* **Seamless Navigation:** Direct entry points to the 3D Anatomy Atlas and the standalone AI Health Advisor dashboard.

### B. 3D Human Anatomy Simulator (`anatomy.html`, `src/main.js`, `src/ui.js`)
* **Three.js WebGL Engine:** Renders anatomically accurate human models with skin opacity toggling, individual organ isolations, skeletal system visualization, circulatory vessels, and cranial structures.
* **Draco Decoder Integration:** Enables ultra-fast decompression and smooth 60 FPS rendering of complex 3D meshes (`.glb`).
* **Camera & Coordinate Alignment:** Implements smooth perspective shifts, raycasting selection, hierarchical tree filtering, and dynamic multi-angle camera focus.
* **Bidirectional Event Bus:** Listens for `anatomy:select-part` and handles `onHighlightOrgan` triggers sent from the AI Advisor.

### C. AI Health Advisor & Clinical Risk Engine (`src/ai/`)
1. **`riskEngine.js`:**
   * **Multi-factorial Scoring:** Computes total risk score based on:
     * **Physiological Vitals (35% weight):** Heart rate deviations, hypoxemic SpO₂, systolic/diastolic hypertension, tachypnea, and hyperthermia.
     * **Symptom Presentation (30% weight):** Cross-system symptom burden analysis.
     * **Environmental AQI & PM2.5 (25% weight):** Atmospheric pollution tier modeling.
     * **Lifestyle & Habits (10% weight):** Tobacco inhalation, physical activity levels, hydration, and sleep duration.
   * **Cross-Factor Synergy Multipliers:** Applies risk amplification (e.g., hazardous AQI combined with respiratory symptoms amplifies pulmonary risk by 25%).
   * **Paragraph-Form Advisory Generator:** Produces 3 cohesive prose paragraphs covering the overall risk, the primary affected organ system, and actionable lifestyle/clinical recommendations.
2. **`healthRules.js`:**
   * Contains clinical normal ranges for vitals, AQI tier brackets (0–500 scale), and organ system mapping definitions.
3. **`symptomAnalysis.js`:**
   * Evaluates user symptoms and calculates weighted burdens across all physiological systems.
4. **`healthAdvisor.js`:**
   * Pre-loads 5 comprehensive clinical demonstration scenarios (Healthy Baseline, Smog & Respiratory, Cardiovascular Alert, GI & Metabolic, Multi-System Emergency).
5. **`AdvisorModal.js`:**
   * Renders the glassmorphism dashboard overlay with real-time biometric chip indicators, AQI sliders, symptom selectors, risk donuts, and 3D focus triggers.
6. **`historyService.js`:**
   * Preserves historical assessment records in `localStorage` for longitudinal tracking.
7. **`aqiService.js`:**
   * Powers real-time city-based atmospheric intelligence via Open-Meteo & Copernicus CAMS without hardcoded values or API keys. Resolves user-searched cities to geographical coordinates and feeds live US EPA AQI, PM2.5, PM10, CO, NO₂, O₃, and SO₂ directly into the risk engine.

### D. AI Assistant Chatbot (`src/components/ChatbotWidget.tsx`, `anatomy.html`)
* **Dual Runtime Engine:**
  * **Online RAG Engine:** Connects to a FastAPI + ChromaDB backend for document search and PDF question answering.
  * **Offline Knowledge Engine:** Built-in rule and regex matching covering all 11 body systems, answering questions in full prose paragraphs.
* **Real-time Word Streaming & Pulse Frequency Visualizer:** Modern AI typing animations and exportable chat transcript logs.

---

## 3. Technology Stack

| Category | Technology / Library | Version / Specification |
| :--- | :--- | :--- |
| **Frontend Framework** | React | 19.0.1 |
| **Language** | TypeScript / JavaScript (ES2022) | TypeScript ~5.8.2 |
| **Build & Bundling** | Vite | 6.2.3 / 6.4.3 |
| **3D Graphics Engine** | Three.js | 0.179.1 |
| **Mesh Compression** | Google Draco 3D Decoder | WebAssembly / JS |
| **Styling & Design** | Tailwind CSS v4 | 4.1.14 |
| **Motion & Animation** | Motion (Framer Motion) | 12.23.24 |
| **Iconography** | Lucide React | 0.546.0 |

---

## 4. Directory Structure (Cleaned & Optimized)

```
human-body-simulator-main/
├── index.html                      # React entry HTML
├── anatomy.html                    # 3D Human Anatomy & Simulator HTML
├── package.json                    # Dependencies & scripts
├── package-lock.json               # Locked dependency tree
├── tsconfig.json                   # TypeScript compiler configuration
├── vite.config.ts                  # Vite build & bundler configuration
├── README.md                       # Repository readme
├── description.md                  # Comprehensive project technical documentation
├── Project_Explanation_Mentor_Guide.docx # Detailed project guide for academic mentors
├── public/                         # Static deployment assets
│   ├── assets/
│   │   ├── bot-icon.png            # AI assistant avatar
│   │   └── hero-video.mp4          # Landing page background video
│   ├── data/
│   │   ├── anatomy_map.json        # Anatomical organ system mapping
│   │   └── body_regions.json       # Anatomical body region definitions
│   ├── draco/                      # Three.js Draco decoders
│   │   ├── draco_decoder.js
│   │   ├── draco_decoder.wasm
│   │   └── draco_wasm_wrapper.js
│   ├── licenses/                   # Open-source and 3D asset licenses
│   └── models/                     # Draco-compressed 3D glTF models
│       ├── anatomy-organs.glb      # Internal organs 3D mesh
│       ├── anatomy-skin.glb        # External skin 3D mesh
│       └── overview-skeleton.glb   # Complete skeleton 3D mesh
├── scripts/                        # Automated validation scripts
│   ├── validate-assets.mjs         # 3D model bounding-box & node integrity check
│   └── validate-dist.mjs           # Production legal notice verifier
└── src/                            # Application source code
    ├── App.tsx                     # Landing page application component
    ├── main.tsx                    # React client mounting entry
    ├── main.js                     # Three.js 3D anatomy runtime orchestrator
    ├── ui.js                       # 3D viewport UI controls & layer filters
    ├── index.css                   # Tailwind CSS styling
    ├── styles.css                  # 3D viewer, inspector & dialog styling
    ├── overflow.css                # Viewport overflow & focus handling
    ├── ai/                         # AI Health Advisory Engine
    │   ├── AdvisorModal.js         # Interactive dashboard dialog & results UI
    │   ├── aqiService.js           # Real-time city search & air quality API client (Open-Meteo & Copernicus CAMS)
    │   ├── healthAdvisor.js        # Demonstration scenarios & main runner
    │   ├── healthRules.js          # Clinical ranges, AQI tiers & systems
    │   ├── historyService.js       # LocalStorage assessment tracking
    │   ├── riskEngine.js           # Multi-factorial risk algorithm & paragraph generator
    │   └── symptomAnalysis.js      # Symptom mapping & cross-system synergy
    ├── anatomy/                    # 3D Model Asset & Node Management
    │   ├── AnatomyAsset.js         # Organ GLB loaders & node traversal
    │   ├── HumanModel.js           # High-level model assembly
    │   ├── SkeletonAsset.js        # Skeleton geometry & bone indexing
    │   ├── alignment.js            # Precise anatomical coordinate registration
    │   ├── assetSemantics.js       # Semantic organ node identifiers
    │   ├── gltfBounds.js           # Bounding volume computation
    │   ├── materials.js            # PBR materials, shaders & organ colors
    │   ├── regions.js              # Body region definitions & groupings
    │   └── skeletonNodes.js        # Axial and appendicular skeleton hierarchy
    ├── components/
    │   └── ChatbotWidget.tsx       # Floating AI chatbot with streaming & document upload
    ├── data/
    │   └── anatomy.js              # Structure lookup tables & descriptions
    └── utils/
        ├── camera.js               # Smooth camera transitions & perspectives
        └── state.js                # Anatomy viewer state manager
```

---


## 5. How to Run the Project

### Prerequisites
* **Node.js:** v18.0.0 or higher
* **npm:** v9.0.0 or higher

### Installation & Execution
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# The application will be accessible at:
# http://localhost:5173/
# http://localhost:5173/anatomy.html
```

### Production Build & Preview
```bash
# Build production bundle
npm run build

# Preview built application
npm run preview
```

---

## 6. Educational & Medical Disclaimer

> **IMPORTANT DISCLAIMER:**
> The Smart Health Advisory System Using AI is an educational simulation, academic demonstration, and health-literacy platform. The risk scores, factor attributions, and generated advisories are produced by heuristic algorithms and generative logic. They do not constitute formal medical diagnosis, clinical prognosis, or treatment recommendations. Always consult a licensed healthcare professional for any medical symptoms or conditions.
