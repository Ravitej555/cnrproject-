# SMART HEALTH ADVISORY SYSTEM
## Using AI With 3D Human Body Visualization

> **College Project — AI-Assisted Health Risk Assessment — Interactive 3D Anatomy**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://ravitej555.github.io/cnrproject-/)
[![GitHub Actions](https://img.shields.io/badge/Deployment-Automated-blue?style=for-the-badge&logo=githubactions)](https://github.com/Ravitej555/cnrproject-/actions)

### 🌐 Live Demo URLs:
* **Interactive 3D Web Application:** [https://ravitej555.github.io/cnrproject-/](https://ravitej555.github.io/cnrproject-/)
* **Direct 3D Anatomy Atlas:** [https://ravitej555.github.io/cnrproject-/anatomy.html](https://ravitej555.github.io/cnrproject-/anatomy.html)
* **Direct AI Health Advisor Dashboard:** [https://ravitej555.github.io/cnrproject-/anatomy.html?openAdvisor=true](https://ravitej555.github.io/cnrproject-/anatomy.html?openAdvisor=true)

---


## 1. Project Title

**Smart Health Advisory System Using AI with 3D Human Body Visualization**

---

## 2. Problem Statement

Air pollution (AQI, PM2.5) and lifestyle-related health risks are growing global concerns. Most health tools either:
- Focus only on vitals without environmental context, or
- Show generic health information without personalization or 3D visualization

There is a need for an integrated educational platform that connects environmental air quality data, physiological vitals, and reported symptoms to relevant body system risks, and displays them interactively on a 3D human anatomy model.

---

## 3. Objective

To develop an AI-assisted smart health advisory system that:

1. Takes user health inputs (vitals, symptoms, AQI, lifestyle)
2. Runs a transparent, explainable risk assessment
3. Identifies the primary affected body system and organ
4. Focuses the camera on that organ in the 3D human body model
5. Highlights the organ with a risk-colored glow
6. Provides actionable health recommendations

---

## 4. Proposed Solution

A single-page web application combining:

- React landing page with project overview and system features
- Three.js 3D anatomy simulator (anatomy.html) with full organ/skeleton interaction
- AI-assisted health risk engine (modular, explainable, rule-based)
- Smart Health Advisor modal with patient profile, vitals, AQI, symptoms, and lifestyle inputs
- Event-based AI to 3D bridge (anatomy:apply-ai-advisory custom event)
- Assessment History with "View in 3D" replay functionality

---

## 5. Features

| Feature | Description |
|---|---|
| 3D Human Anatomy | Interactive male anatomy model with skeleton, organs, skin, circulatory system |
| Organ Selection | Click any organ/bone to inspect; camera focuses and pans |
| Anatomy Search | Search all 200+ named bones and organs |
| Layer Controls | Toggle skin/skeleton/organs/vessels visibility and opacity |
| Health Advisor | Full health form: age, gender, height, weight, vitals, AQI, symptoms, lifestyle |
| Live BMI Calculator | Auto-computes BMI from height/weight with classification |
| AQI Analysis | Air Quality Index to respiratory/cardiovascular risk contribution |
| AI Risk Engine | Transparent 4-factor weighted scoring (0-100 scale) |
| Explainable AI | Factor breakdown: Vitals 35% - Symptoms 30% - AQI 25% - Lifestyle 10% |
| 3D Organ Focus | AI result to camera focus + organ highlight in 3D body |
| History | Save and replay past assessments with 3D focus |
| Demo Scenarios | 5 one-click preloaded demo scenarios for presentations |

---

## 6. System Architecture

`
Landing Page (React)                    3D Anatomy Simulator
      |                                        |
      +-- /anatomy.html ------------------>    +-- Three.js Scene
      |                                         +-- HumanModel.js
Smart Health Advisor (Modal)                    |    +-- Skeleton (GLB)
      |                                         |    +-- Skin (GLB)
      +-- Health Form                           |    +-- Organs (GLB)
      |    +-- Patient Profile + BMI            +-- OrbitControls
      |    +-- Vitals                           +-- Raycaster
      |    +-- AQI Slider                       +-- Event Listener
      |    +-- Symptom Picker                        |
      |    +-- Lifestyle                             v
      |                                  anatomy:apply-ai-advisory
AI Health Engine (src/ai/)                       |
      +-- healthRules.js     -------->       Camera Focus
      +-- symptomAnalysis.js              Organ Highlight
      +-- riskEngine.js                   Inspector Update
      +-- healthAdvisor.js
      +-- historyService.js
`

---

## 7. AI Methodology

This system uses a transparent, weighted rule-based health risk assessment engine. It does NOT use a trained machine learning model (educational version).

### Risk Scoring Formula

`
Risk Score (0-100) =
    Environmental AQI Score  * 0.25   (25%)
  + Vitals Deviation Score   * 0.35   (35%)
  + Symptom Burden Score     * 0.30   (30%)
  + Lifestyle Risk Score     * 0.10   (10%)
  * Synergy Multiplier (up to +25% for AQI + respiratory symptoms)
`

### Risk Tiers

| Score | Level | Color |
|---|---|---|
| 0-25 | LOW | Green |
| 26-50 | MODERATE | Amber |
| 51-75 | HIGH | Orange |
| 76-100 | URGENT | Red |

---

## 8. AQI Analysis

| AQI Range | Category | Health Impact |
|---|---|---|
| 0-50 | Good | Little to no risk |
| 51-100 | Moderate | Sensitive groups may be affected |
| 101-150 | Unhealthy for Sensitive Groups | Respiratory effects in at-risk individuals |
| 151-200 | Unhealthy | Everyone may experience adverse effects |
| 201-300 | Very Unhealthy | Significant respiratory and cardiovascular effects |
| 301+ | Hazardous | Emergency conditions - entire population affected |

---

## 9. Explainable AI

Every result includes:
1. Overall risk score (0-100) with tier classification
2. Factor breakdown - contribution % from each input category
3. Biometric observations - specific vital deviations that increased the score
4. AQI category description - contextual explanation of current air quality
5. Targeted recommendations - based on specific risk factors identified
6. Warning signs - red flags that warrant urgent attention
7. 3D organ focus - visual confirmation of the most affected organ

---

## 10. 3D Anatomy Integration

### Event Bridge

`javascript
window.dispatchEvent(new CustomEvent('anatomy:apply-ai-advisory', {
  detail: {
    organ: 'lungs',      // target organ ID
    region: 'chest',     // camera focus region
    system: 'respiratory',
    score: 68,
    level: 'HIGH',
    systemName: 'Respiratory System'
  }
}));
`

### Organ to System Mapping

| AI System | 3D Organ | Camera Region |
|---|---|---|
| respiratory | lungs | chest |
| circulatory | heart | chest |
| nervous | brain | head |
| digestive | stomach | abdomen |
| urinary | kidneys | abdomen |
| muscular | skeleton | chest |

---

## 11. Technology Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + TypeScript |
| 3D Engine | Three.js 0.179 |
| Animations | Framer Motion (motion/react) |
| Styling | Tailwind CSS 4 + vanilla CSS |
| Build Tool | Vite 6 |
| 3D Controls | Three.js OrbitControls |
| 3D Assets | GLB/GLTF (BodyParts3D CC-BY-SA) |
| 3D Compression | Draco mesh compression |
| AI Engine | Custom rule-based (JavaScript) |
| Persistence | localStorage (assessment history) |

---

## 12. Project Structure

`
human-body-simulator-main/
+-- anatomy.html              <- 3D Anatomy Simulator entry point
+-- index.html                <- Landing page entry point
+-- package.json
+-- src/
|   +-- App.tsx               <- Landing page (React)
|   +-- main.js               <- 3D scene orchestrator (Three.js)
|   +-- ui.js                 <- Anatomy UI renderer
|   +-- styles.css            <- All CSS for anatomy simulator
|   +-- ai/
|   |   +-- healthRules.js    <- AQI levels, vitals ranges, symptoms
|   |   +-- symptomAnalysis.js<- Symptom to system mapping
|   |   +-- riskEngine.js     <- 4-factor weighted risk calculator
|   |   +-- healthAdvisor.js  <- Main controller + 5 demo scenarios
|   |   +-- AdvisorModal.js   <- Full advisor UI
|   |   +-- historyService.js <- localStorage assessment history
|   +-- anatomy/
|   |   +-- HumanModel.js     <- 3D model builder + animations
|   |   +-- regions.js        <- highlightRegion, focusRegion
|   |   +-- SkeletonAsset.js  <- GLB skeleton loader
|   |   +-- AnatomyAsset.js   <- GLB organs/skin loader
|   +-- data/
|       +-- anatomy.js        <- ORGAN_INFO, REGION_INFO, SYSTEMS
+-- public/
|   +-- assets/               <- 3D GLB assets
+-- tools/
    +-- FEMALE_ANATOMY_GUIDE.md
`

---

## 13. Installation

`ash
# Download/clone the project, then:
npm install
npm run dev
`

---

## 14. How to Run

`ash
npm run dev
`

- **Landing page**: http://localhost:5173
- **3D Anatomy Simulator**: http://localhost:5173/anatomy.html

To use the Smart Health Advisor:
1. Open http://localhost:5173/anatomy.html
2. Click **AI Health Advisor** in the top bar
3. Fill in health parameters or click a demo preset
4. Click **Run AI Health Risk Assessment**
5. Click **Highlight [ORGAN] in 3D Body** to visualize

---

## 15. Demo Scenarios

| # | Scenario | Expected Outcome |
|---|---|---|
| 1 | Healthy Baseline | LOW RISK - no highlights |
| 2 | Severe Smog and Respiratory | HIGH/URGENT - Lungs highlighted |
| 3 | Cardiovascular and Hypertension | HIGH - Heart highlighted |
| 4 | Gastrointestinal and Acid Motility | MODERATE - Stomach highlighted |
| 5 | High-Risk Multi-System Alert | URGENT - Primary system highlighted |

---

## 16. Limitations

- AI engine is rule-based / heuristic - not a trained ML model
- No real-time sensor data integration (manual input only)
- History stored in browser localStorage only
- AQI values are manually entered (no live API in this version)
- Not validated against clinical datasets

---

## 17. Future Enhancements

1. Replace heuristic engine with a trained ML model (Random Forest, XGBoost)
2. Live AQI from OpenAQ or WAQI API by location
3. Backend + Database (FastAPI + PostgreSQL) for persistent records
4. Wearable integration for real vital signs
5. Gender-specific 3D visualization
6. Multi-language support

---

## 18. Medical Disclaimer

> **This system is for educational and informational purposes only.**
>
> It is NOT a medical diagnostic tool and does NOT replace professional medical advice, diagnosis, or treatment.
>
> All risk assessments are generated by a transparent rule-based educational engine.
> They do not constitute medical diagnoses.
>
> If you have health concerns, please consult a licensed medical professional.
> Never use this system to delay or replace emergency medical care.

---

## Credits

- **Skeleton asset**: Open3Dmodel - CC BY-SA 4.0
- **Skin and organ assets**: BodyParts3D, The Database Center for Life Science - CC BY-SA 2.1 Japan
- **3D Engine**: Three.js (MIT License)
- **UI Framework**: React 19 (MIT License)

---

*Smart Health Advisory System - College Project 2026*
