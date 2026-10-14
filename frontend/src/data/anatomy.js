// ─── Systems ───────────────────────────────────────────────────────────────────
export const SYSTEMS = {
  skin:        { name: 'Body silhouette',    short: 'Skin',        color: '#d89b8f', defaultVisible: true },
  skeleton:    { name: 'Skeletal system',    short: 'Skeleton',    color: '#e6dfc7', defaultVisible: true },
  organs:      { name: 'Major organs',       short: 'Organs',      color: '#e85d75', defaultVisible: true },
  circulatory: { name: 'Circulatory system', short: 'Vessels',     color: '#df4d64', defaultVisible: true },
  muscular:    { name: 'Muscular system',    short: 'Muscles',     color: '#c0392b', defaultVisible: false },
  nervous:     { name: 'Nervous system',     short: 'Nerves',      color: '#f1c40f', defaultVisible: false },
  respiratory: { name: 'Respiratory system', short: 'Respiratory', color: '#00bcd4', defaultVisible: false },
  digestive:   { name: 'Digestive system',   short: 'Digestive',   color: '#e67e22', defaultVisible: false },
  urinary:     { name: 'Urinary system',     short: 'Urinary',     color: '#8e44ad', defaultVisible: false },
  endocrine:   { name: 'Endocrine system',   short: 'Endocrine',   color: '#27ae60', defaultVisible: false },
};

// ─── Organ Info ────────────────────────────────────────────────────────────────
export const ORGAN_INFO = {
  brain: {
    name: 'Brain', system: 'Nervous system', color: '#ef9aaa', region: 'head',
    summary: 'The body\'s command center, coordinating sensation, movement, memory, emotion, and vital automatic functions.',
    fact: 'It contains roughly 86 billion neurons and uses about 20% of the body\'s resting energy.',
  },
  heart: {
    name: 'Heart', system: 'Circulatory system', color: '#d93652', region: 'chest',
    summary: 'A muscular four-chambered pump that circulates blood through the lungs and the rest of the body.',
    fact: 'At rest, an adult heart commonly beats 60-100 times per minute.',
  },
  lungs: {
    name: 'Lungs', system: 'Respiratory system', color: '#e9939e', region: 'chest',
    summary: 'Paired organs that exchange oxygen and carbon dioxide between inhaled air and the bloodstream.',
    fact: 'The right lung has three lobes; the smaller left lung has two to make room for the heart.',
  },
  liver: {
    name: 'Liver', system: 'Digestive system', color: '#8c3541', region: 'abdomen',
    summary: 'A large metabolic organ that processes nutrients, produces bile, stores energy, and detoxifies the blood.',
    fact: 'The liver can regenerate significant lost tissue, although repeated injury can overwhelm this ability.',
  },
  stomach: {
    name: 'Stomach', system: 'Digestive system', color: '#d87971', region: 'abdomen',
    summary: 'A muscular sac that mechanically mixes food and begins chemical digestion using acid and enzymes.',
    fact: 'Its protective mucus layer helps keep gastric acid from damaging the stomach wall.',
  },
  kidneys: {
    name: 'Kidneys', system: 'Urinary system', color: '#99505d', region: 'abdomen',
    summary: 'Paired organs that filter blood, balance fluids and electrolytes, and help regulate blood pressure.',
    fact: 'Each kidney contains around a million microscopic filtering units called nephrons.',
  },
  intestines: {
    name: 'Intestines', system: 'Digestive system', color: '#d99070', region: 'abdomen',
    summary: 'The small intestine absorbs most nutrients; the large intestine absorbs water and forms stool.',
    fact: 'The adult small intestine is several metres long, folded compactly within the abdomen.',
  },
};

// ─── System -> Organ IDs ───────────────────────────────────────────────────────
export const SYSTEM_ORGANS = {
  circulatory: ['heart'],
  respiratory: ['lungs'],
  digestive:   ['liver', 'stomach', 'intestines'],
  nervous:     ['brain'],
  urinary:     ['kidneys'],
  endocrine:   ['brain', 'kidneys', 'liver'],
  muscular:    [],
  organs:      ['brain', 'heart', 'lungs', 'liver', 'stomach', 'kidneys', 'intestines'],
  skeleton:    [],
  skin:        [],
};

// ─── Region Info ───────────────────────────────────────────────────────────────
export const REGION_INFO = {
  head: {
    label: 'Head', emoji: String.fromCodePoint(0x1F9E0),
    summary: 'Houses the brain, skull, cranial nerves, and sensory organs. Controls cognition, vision, hearing, and all vital processes.',
    systems: ['Nervous system', 'Skeletal system'], organs: ['brain'],
    cameraBox: { min: [-0.5, 2.5, -0.5], max: [0.5, 3.9, 0.5] },
  },
  neck: {
    label: 'Neck', emoji: String.fromCodePoint(0x1FAC1),
    summary: 'Contains C1-C7 vertebrae, carotid arteries, jugular veins, trachea, esophagus, and major nerve plexuses.',
    systems: ['Skeletal system', 'Circulatory system'], organs: [],
    cameraBox: { min: [-0.4, 2.3, -0.3], max: [0.4, 3.1, 0.3] },
  },
  chest: {
    label: 'Chest', emoji: String.fromCodePoint(0x2764),
    summary: 'Contains the heart, lungs, great vessels, and ribcage. Controls oxygenation and systemic circulation.',
    systems: ['Circulatory system', 'Respiratory system', 'Skeletal system'], organs: ['heart', 'lungs'],
    cameraBox: { min: [-1.0, 0.8, -0.5], max: [1.0, 2.4, 0.6] },
  },
  abdomen: {
    label: 'Abdomen', emoji: String.fromCodePoint(0x1FAC0),
    summary: 'Houses liver, stomach, intestines, kidneys, and spleen. Primary site of digestion, filtration, and metabolism.',
    systems: ['Digestive system', 'Urinary system'], organs: ['liver', 'stomach', 'kidneys', 'intestines'],
    cameraBox: { min: [-1.0, -0.5, -0.5], max: [1.0, 1.0, 0.6] },
  },
  left_arm: {
    label: 'L.Arm', emoji: String.fromCodePoint(0x1F4AA),
    summary: 'Includes deltoid, biceps, triceps, forearm extensors/flexors. Controls reaching, grasping, and fine motor tasks.',
    systems: ['Muscular system', 'Skeletal system'], organs: [],
    cameraBox: { min: [-1.5, 0.0, -0.3], max: [-0.5, 2.5, 0.3] },
  },
  right_arm: {
    label: 'R.Arm', emoji: String.fromCodePoint(0x1F4AA),
    summary: 'Includes deltoid, biceps, triceps, forearm extensors/flexors. Controls reaching, grasping, and fine motor tasks.',
    systems: ['Muscular system', 'Skeletal system'], organs: [],
    cameraBox: { min: [0.5, 0.0, -0.3], max: [1.5, 2.5, 0.3] },
  },
  left_leg: {
    label: 'L.Leg', emoji: String.fromCodePoint(0x1F9B5),
    summary: 'Quadriceps, hamstrings, gastrocnemius, and tibialis groups. Primary locomotion, weight-bearing, and postural stability.',
    systems: ['Muscular system', 'Skeletal system'], organs: [],
    cameraBox: { min: [-0.8, -3.5, -0.3], max: [-0.1, 0.2, 0.3] },
  },
  right_leg: {
    label: 'R.Leg', emoji: String.fromCodePoint(0x1F9B5),
    summary: 'Quadriceps, hamstrings, gastrocnemius, and tibialis groups. Primary locomotion, weight-bearing, and postural stability.',
    systems: ['Muscular system', 'Skeletal system'], organs: [],
    cameraBox: { min: [0.1, -3.5, -0.3], max: [0.8, 0.2, 0.3] },
  },
};

// ─── Bone name -> Region mapping ──────────────────────────────────────────────
export function boneNameToRegion(boneName = '') {
  const n = boneName.toLowerCase();
  if (/skull|cranium|mandible|maxilla|zygomatic|frontal|parietal|temporal|occipital|nasal|lacrimal|hyoid/.test(n)) return 'head';
  if (/cervical|atlas|axis/.test(n)) return 'neck';
  if (/rib|sternum|clavicle|scapula|thoracic/.test(n)) return 'chest';
  if (/pelvis|sacrum|coccyx|ilium|ischium|pubis|lumbar/.test(n)) return 'abdomen';
  if (/\.l$|\.l\./.test(n) && /(humerus|radius|ulna|carpal|metacarpal|phalanx)/.test(n)) return 'left_arm';
  if (/(humerus|radius|ulna|carpal|metacarpal)/.test(n)) return 'right_arm';
  if (/\.l$|\.l\./.test(n) && /(femur|tibia|fibula|patella|tarsal|metatarsal)/.test(n)) return 'left_leg';
  if (/(femur|tibia|fibula|patella|tarsal|metatarsal)/.test(n)) return 'right_leg';
  return 'chest';
}

export const DEFAULT_VISIBILITY = Object.fromEntries(
  Object.entries(SYSTEMS).map(([key, value]) => [key, value.defaultVisible]),
);

export const DEFAULT_SKIN_OPACITY = .3;
export const defaultLayerOpacity = system => system === 'skin' ? DEFAULT_SKIN_OPACITY : 1;

export const DISCLAIMER = 'This simplified visualization is for education only. It is not a diagnostic tool and does not replace professional medical advice.';

