/**
 * Maintenance activities — MTQ Manuel d’inspection des structures §15.8
 * Tableau 15.8-1 Activités disponibles par élément.
 *
 * Categories: preventive (1000), routine (2000), repair (3000).
 * Major rehab (5000) is excluded from general inspection recommendations.
 * `unitPrice` is reserved for future inspection selection costing.
 */

export type MaintenanceUnit = 'm²' | 'm' | 'unité' | 'heure' | '—'
export type MaintenanceCategory = 'preventive' | 'routine' | 'repair' | 'major'

export type MaintenanceActivity = {
  code: number
  description: string
  unit: MaintenanceUnit
  category: MaintenanceCategory
  /** Future: default unit price when selected at inspection */
  unitPrice?: number | null
}

export type ElementActivitySet = {
  id: string
  group: string
  element: string
  /** Appendix C schedule numbers this set applies to */
  scheduleNos: number[]
  activityCodes: number[]
}

export const MAINTENANCE_CATEGORY_LABEL: Record<MaintenanceCategory, string> = {
  preventive: 'Entretien préventif (1000)',
  routine: 'Entretien courant (2000)',
  repair: 'Réparation (3000)',
  major: 'Réfection majeure (5000)',
}

export const MAINTENANCE_ACTIVITIES: MaintenanceActivity[] = [
  { code: 1011, description: "Nettoyage sous le tablier", unit: "m", category: 'preventive', unitPrice: null },
  { code: 1012, description: "Nettoyage du dessus de tablier", unit: "m", category: 'preventive', unitPrice: null },
  { code: 1013, description: "Balayage de chaussée", unit: "m", category: 'preventive', unitPrice: null },
  { code: 1014, description: "Nettoyage de drains", unit: "unit\u00e9", category: 'preventive', unitPrice: null },
  { code: 1015, description: "Nettoyage du système de drainage", unit: "unit\u00e9", category: 'preventive', unitPrice: null },
  { code: 1016, description: "Nettoyage intérieur poutre-caisson", unit: "m", category: 'preventive', unitPrice: null },
  { code: 1017, description: "Nettoyage d'unité de fondation", unit: "unit\u00e9", category: 'preventive', unitPrice: null },
  { code: 1018, description: "Enlèvement de débris du cours d'eau", unit: "heure", category: 'preventive', unitPrice: null },
  { code: 1031, description: "Remplacement de garniture enclenchée d'un joint de tablier", unit: "m", category: 'preventive', unitPrice: null },
  { code: 1041, description: "Resurfaçage de l'enrobé", unit: "m\u00b2", category: 'preventive', unitPrice: null },
  { code: 1042, description: "Scellement de fissures de l'enrobé", unit: "m", category: 'preventive', unitPrice: null },
  { code: 1051, description: "Peinture par retouches", unit: "m\u00b2", category: 'preventive', unitPrice: null },
  { code: 1052, description: "Peinture par zone", unit: "m\u00b2", category: 'preventive', unitPrice: null },
  { code: 1061, description: "Imperméabilisation de surfaces de béton", unit: "m\u00b2", category: 'preventive', unitPrice: null },
  { code: 1062, description: "Recouvrement avec enduit de surface", unit: "m\u00b2", category: 'preventive', unitPrice: null },
  { code: 1071, description: "Enlèvement de végétation", unit: "unit\u00e9", category: 'preventive', unitPrice: null },
  { code: 1081, description: "Enlèvement de fragments de béton", unit: "heure", category: 'preventive', unitPrice: null },
  { code: 1082, description: "Sécurisation de dessous de tablier", unit: "m\u00b2", category: 'preventive', unitPrice: null },
  { code: 1083, description: "Enlèvement de strates de rouille", unit: "heure", category: 'preventive', unitPrice: null },
  { code: 1091, description: "Accès à une zone confinée", unit: "unit\u00e9", category: 'preventive', unitPrice: null },
  { code: 2001, description: "Entretien d'éléments de pont à câbles", unit: "\u2014", category: 'routine', unitPrice: null },
  { code: 2011, description: "Intervention pour panneau relatif à la sécurité", unit: "unit\u00e9", category: 'routine', unitPrice: null },
  { code: 2012, description: "Intervention pour panneau relatif à la capacité", unit: "unit\u00e9", category: 'routine', unitPrice: null },
  { code: 2051, description: "Correction d'épaulement d'un joint de tablier", unit: "m", category: 'routine', unitPrice: null },
  { code: 2052, description: "Correction d'élément en acier d'un joint de tablier", unit: "heure", category: 'routine', unitPrice: null },
  { code: 2053, description: "Déblocage d'un joint de tablier", unit: "unit\u00e9", category: 'routine', unitPrice: null },
  { code: 2071, description: "Consolidation de glissière", unit: "m", category: 'routine', unitPrice: null },
  { code: 2131, description: "Réparation temporaire de dalle", unit: "heure", category: 'routine', unitPrice: null },
  { code: 2201, description: "Remplacement de boulons/rivets", unit: "unit\u00e9", category: 'routine', unitPrice: null },
  { code: 2311, description: "Rechargement de caisson en bois", unit: "unit\u00e9", category: 'routine', unitPrice: null },
  { code: 2312, description: "Consolidation de caisson en bois", unit: "unit\u00e9", category: 'routine', unitPrice: null },
  { code: 2331, description: "Fixation de traverses en bois", unit: "m", category: 'routine', unitPrice: null },
  { code: 3001, description: "Réparation/remplacement d'élément de pont à câbles", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3005, description: "Pose/réparation d'un gabarit", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3011, description: "Enrochement", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3012, description: "Correction du cours d'eau", unit: "\u2014", category: 'repair', unitPrice: null },
  { code: 3021, description: "Stabilisation de remblai", unit: "\u2014", category: 'repair', unitPrice: null },
  { code: 3022, description: "Protection de talus", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3023, description: "Réparation de remblai", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3026, description: "Rapiéçage à l'enrobé", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3027, description: "Rapiéçage au matériau granulaire", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3031, description: "Consolidation de fondation avec sacs sable-ciment/empierrement", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3032, description: "Consolidation de fondation par l'ajout de béton", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3033, description: "Consolidation de pieu", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3034, description: "Réparation de semelle", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3035, description: "Stabilisation de fondation", unit: "\u2014", category: 'repair', unitPrice: null },
  { code: 3042, description: "Réparation/modification des blocs d'assise/butoirs", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3043, description: "Remise en position d'appareil d'appui", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3044, description: "Remplacement d'appareil d'appui", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3045, description: "Réparation d'appareil d'appui à rouleaux", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3046, description: "Remplacement d'appareil d'appui à rouleaux", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3051, description: "Remplacement d'un joint de tablier", unit: "m", category: 'repair', unitPrice: null },
  { code: 3052, description: "Joint dalle sur culée", unit: "m", category: 'repair', unitPrice: null },
  { code: 3053, description: "Élimination de joint de tablier à une pile", unit: "m", category: 'repair', unitPrice: null },
  { code: 3054, description: "Étanchement d'un joint longitudinal", unit: "m", category: 'repair', unitPrice: null },
  { code: 3061, description: "Réparation/remplacement de trottoir, chasse-roue ou bande médiane en béton", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3062, description: "Modification/ajout de drains", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3063, description: "Remplacement du système de drainage", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3064, description: "Réparation/remplacement de passerelle d'inspection", unit: "\u2014", category: 'repair', unitPrice: null },
  { code: 3065, description: "Peinturage d'un ouvrage en acier", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3066, description: "Correction du profil à l'approche", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3067, description: "Remplacement de l'enrobé", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3068, description: "Aménagement de l'approche", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3069, description: "Réparation/remplacement d'escalier", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3071, description: "Réparation de glissière", unit: "m", category: 'repair', unitPrice: null },
  { code: 3072, description: "Raccordement glissière à l'approche", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3073, description: "Remplacement/ajout de glissière", unit: "m", category: 'repair', unitPrice: null },
  { code: 3074, description: "Réparation/remplacement de glissière à l'approche", unit: "m", category: 'repair', unitPrice: null },
  { code: 3081, description: "Réparation mur de soutènement béton", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3082, description: "Réparation de mur de soutènement en maçonnerie", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3083, description: "Réparation - autres types de mur", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3084, description: "Réparation - mur de soutènement en bois ou autres matériaux", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3091, description: "Réparation de ponceau en béton armé", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3092, description: "Réparation de ponceau en acier", unit: "m", category: 'repair', unitPrice: null },
  { code: 3093, description: "Réparation de ponceau en bois", unit: "m", category: 'repair', unitPrice: null },
  { code: 3094, description: "Réparation/remplacement d'élément d'entrée/sortie d'un ponceau", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3095, description: "Réparation de ponceau en polyéthylène", unit: "m", category: 'repair', unitPrice: null },
  { code: 3106, description: "Obturation de fissures par injection", unit: "m", category: 'repair', unitPrice: null },
  { code: 3111, description: "Réparation de culée en béton", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3112, description: "Réparation de pile en béton", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3113, description: "Réparation de béquille en béton", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3114, description: "Reconstruction d'éléments d'unité de fondation en béton", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3115, description: "Réparation de fissure d'un élément en béton", unit: "m", category: 'repair', unitPrice: null },
  { code: 3121, description: "Réparation de poutre/diaphragme en béton armé", unit: "m", category: 'repair', unitPrice: null },
  { code: 3122, description: "Réparation d'extrémité de poutre en béton armé", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3124, description: "Réparation de poutre/diaphragme en béton précontraint", unit: "m", category: 'repair', unitPrice: null },
  { code: 3125, description: "Réparation de poutre-caisson en béton", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3126, description: "Reconstruction de diaphragme en béton armé", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3127, description: "Réparation d'éléments d'arc en béton armé", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3131, description: "Réparation de dalle sur poutres et de dalle épaisse", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3132, description: "Réparation de dessous dalle épaisse", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3134, description: "Reconstruction de côté extérieur de dalle", unit: "m", category: 'repair', unitPrice: null },
  { code: 3135, description: "Réparation du hourdis supérieur de poutre-caisson en béton", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3136, description: "Réparation de côté extérieur de dalle", unit: "m", category: 'repair', unitPrice: null },
  { code: 3201, description: "Réparation/remplacement d'assemblage en acier", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3211, description: "Réparation de banc en acier", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3212, description: "Réparation de béquille en acier", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3221, description: "Réparation/remplacement d'élément en acier", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3222, description: "Remplacement de membrure de poutre triangulée en acier", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3223, description: "Rehaussement de portique de poutre triangulée en acier", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3224, description: "Ajout de diaphragme/contreventement de pont acier-bois", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3231, description: "Réparation de caillebotis", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3232, description: "Remplacement de caillebotis", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3311, description: "Remplacement de caisson en bois", unit: "m", category: 'repair', unitPrice: null },
  { code: 3312, description: "Remplacement de banc en bois", unit: "m", category: 'repair', unitPrice: null },
  { code: 3314, description: "Réparation/remplacement d'assise de caisson en bois", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3315, description: "Réparation de banc en bois", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3321, description: "Remplacement d'entretoises en bois", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3322, description: "Réparation/remplacement de poutre ou diaphragme en bois", unit: "m", category: 'repair', unitPrice: null },
  { code: 3323, description: "Remplacement/ajout de longerons en bois", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3331, description: "Remplacement de plancher en bois", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3332, description: "Remplacement de platelage en bois", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3333, description: "Remplacement de platelage en lamelles de bois", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3334, description: "Réparation de plancher en bois", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3335, description: "Réparation/remplacement de trottoir/chasse-roue en bois", unit: "m", category: 'repair', unitPrice: null },
  { code: 3337, description: "Réparation de platelage en bois", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3341, description: "Réparation d'une corde de poutre triangulée en bois", unit: "m", category: 'repair', unitPrice: null },
  { code: 3342, description: "Réparation d'un poteau de poutre triangulée en bois", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3343, description: "Réparation d'une diagonale de poutre triangulée en bois", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3344, description: "Ajustement/remplacement de tirants", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3345, description: "Réparation/remplacement de contreventement en bois", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3346, description: "Réparation/remplacement de la toiture", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3347, description: "Réparation/remplacement du lambris", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3348, description: "Revêtement protecteur du lambris", unit: "m\u00b2", category: 'repair', unitPrice: null },
  { code: 3349, description: "Remplacement de corbeau en bois", unit: "unit\u00e9", category: 'repair', unitPrice: null },
  { code: 3411, description: "Réparation d'élément en maçonnerie", unit: "\u2014", category: 'repair', unitPrice: null },
]

const BY_CODE = new Map(MAINTENANCE_ACTIVITIES.map((a) => [a.code, a]))

export function activityByCode(code: number): MaintenanceActivity | undefined {
  return BY_CODE.get(code)
}

export const ELEMENT_ACTIVITY_SETS: ElementActivitySet[] = [
  { id: "cours-d-eau-et-remblai-cours-d-eau", group: "Cours d'eau et remblai", element: "Cours d'eau", scheduleNos: [500], activityCodes: [1018, 3011, 3012] },
  { id: "cours-d-eau-et-remblai-remblai", group: "Cours d'eau et remblai", element: "Remblai", scheduleNos: [501], activityCodes: [1071, 3021, 3023] },
  { id: "cours-d-eau-et-remblai-protection-de-talus", group: "Cours d'eau et remblai", element: "Protection de talus", scheduleNos: [502], activityCodes: [3022] },
  { id: "cours-d-eau-et-remblai-protection-du-lit", group: "Cours d'eau et remblai", element: "Protection du lit", scheduleNos: [500], activityCodes: [3011] },
  { id: "cul\u00e9e-fondation", group: "Culée", element: "Fondation", scheduleNos: [406, 407], activityCodes: [3021, 3023, 3031, 3032, 3033, 3034, 3035, 3115] },
  { id: "cul\u00e9e-mur-de-front", group: "Culée", element: "Mur de front", scheduleNos: [400], activityCodes: [1017, 1061, 1062, 1081, 2311, 2312, 3106, 3111, 3113, 3115, 3311, 3312, 3315, 3411] },
  { id: "cul\u00e9e-colonnes", group: "Culée", element: "Colonnes", scheduleNos: [404, 405], activityCodes: [1017, 1061, 1062, 1081, 3106, 3111, 3113, 3115, 3211, 3212, 3312, 3315] },
  { id: "cul\u00e9e-chev\u00eatre", group: "Culée", element: "Chevêtre", scheduleNos: [402], activityCodes: [1017, 1061, 1062, 1081, 2201, 3106, 3111, 3114, 3115, 3211, 3315] },
  { id: "cul\u00e9e-garde-gr\u00e8ve", group: "Culée", element: "Garde-grève", scheduleNos: [400], activityCodes: [1017, 1061, 1062, 2312, 3106, 3111, 3114, 3115, 3221, 3411] },
  { id: "cul\u00e9e-blocs-d-assise", group: "Culée", element: "Blocs d'assise", scheduleNos: [306], activityCodes: [1017, 1061, 1062, 3042, 3314] },
  { id: "cul\u00e9e-corbeaux", group: "Culée", element: "Corbeaux", scheduleNos: [309], activityCodes: [2201, 3221, 3349] },
  { id: "cul\u00e9e-appareils-d-appui", group: "Culée", element: "Appareils d'appui", scheduleNos: [300, 301, 302, 303, 304, 305], activityCodes: [2201, 3043, 3044, 3045, 3046] },
  { id: "cul\u00e9e-butoirs", group: "Culée", element: "Butoirs", scheduleNos: [307, 308], activityCodes: [1017, 1061, 1062, 3042] },
  { id: "cul\u00e9e-mur-en-aile-en-retour", group: "Culée", element: "Mur en aile/en retour", scheduleNos: [401], activityCodes: [1017, 1061, 1062, 2311, 2312, 3111, 3114, 3115, 3311, 3411] },
  { id: "cul\u00e9e-assise", group: "Culée", element: "Assise", scheduleNos: [400, 406], activityCodes: [1017, 1061, 1062, 3106, 3111, 3115, 3211, 3314, 3411] },
  { id: "pile-fondation", group: "Pile", element: "Fondation", scheduleNos: [406, 407], activityCodes: [3031, 3032, 3033, 3034, 3035, 3115] },
  { id: "pile-f\u00fbt-mur-de-pile", group: "Pile", element: "Fût / mur de pile", scheduleNos: [403], activityCodes: [1017, 1061, 1062, 1081, 2001, 2201, 2311, 2312, 3106, 3112, 3113, 3115, 3201, 3311, 3411] },
  { id: "pile-colonnes-bancs", group: "Pile", element: "Colonnes/bancs", scheduleNos: [404, 405], activityCodes: [1017, 1061, 1062, 1081, 2001, 2201, 3106, 3112, 3113, 3115, 3201, 3211, 3212, 3312, 3315] },
  { id: "pile-chev\u00eatre", group: "Pile", element: "Chevêtre", scheduleNos: [402], activityCodes: [1017, 1061, 1062, 1081, 2201, 3106, 3112, 3114, 3115, 3211, 3315] },
  { id: "pile-blocs-d-assise", group: "Pile", element: "Blocs d'assise", scheduleNos: [306], activityCodes: [1017, 1061, 1062, 3042, 3314] },
  { id: "pile-corbeaux", group: "Pile", element: "Corbeaux", scheduleNos: [309], activityCodes: [2201, 3221, 3349] },
  { id: "pile-appareils-d-appui", group: "Pile", element: "Appareils d'appui", scheduleNos: [300, 301, 302, 303, 304, 305], activityCodes: [2201, 3043, 3044, 3045, 3046] },
  { id: "pile-butoirs", group: "Pile", element: "Butoirs", scheduleNos: [307, 308], activityCodes: [1017, 1061, 1062, 3042] },
  { id: "pile-assise", group: "Pile", element: "Assise", scheduleNos: [402, 406], activityCodes: [1017, 1061, 1062, 3106, 3112, 3115, 3211, 3314, 3411] },
  { id: "platelage-surface-de-roulement", group: "Platelage", element: "Surface de roulement", scheduleNos: [1], activityCodes: [1012, 1013, 1041, 1042, 2011, 3026, 3067, 3331, 3334] },
  { id: "platelage-syst\u00e8me-de-drainage", group: "Platelage", element: "Système de drainage", scheduleNos: [230, 505], activityCodes: [1014, 1015, 3062, 3063] },
  { id: "platelage-c\u00f4t\u00e9-ext\u00e9rieur", group: "Platelage", element: "Côté extérieur", scheduleNos: [200], activityCodes: [1012, 1061, 1062, 1081, 1082, 3106, 3134, 3136] },
  { id: "platelage-platelage-dalle", group: "Platelage", element: "Platelage / dalle", scheduleNos: [200], activityCodes: [1011, 1012, 1013, 1061, 1062, 1081, 1082, 2131, 2331, 3106, 3131, 3132, 3135, 3221, 3231, 3232, 3331, 3332, 3333, 3334, 3337] },
  { id: "poutre-\u00e0-\u00e2me-pleine-poutre-caisson-poutres", group: "Poutre à âme pleine / poutre-caisson", element: "Poutres", scheduleNos: [201, 202], activityCodes: [1011, 1016, 1061, 1062, 1081, 1083, 2201, 3063, 3106, 3121, 3122, 3124, 3125, 3201, 3221, 3322] },
  { id: "poutre-\u00e0-\u00e2me-pleine-poutre-caisson-diaphragme", group: "Poutre à âme pleine / poutre-caisson", element: "Diaphragme", scheduleNos: [213, 214], activityCodes: [1016, 2201, 3106, 3121, 3125, 3126, 3201, 3221] },
  { id: "poutre-triangul\u00e9e-corde-membrures", group: "Poutre triangulée", element: "Corde / membrures", scheduleNos: [203], activityCodes: [1011, 1012, 2201, 3221, 3222, 3341, 3342, 3343] },
  { id: "poutre-triangul\u00e9e-assemblages", group: "Poutre triangulée", element: "Assemblages", scheduleNos: [203], activityCodes: [1011, 1012, 2201, 3201] },
  { id: "arc-arc-tympan", group: "Arc", element: "Arc / tympan", scheduleNos: [204, 205, 207], activityCodes: [1011, 1012, 1061, 1062, 1081, 3106, 3127, 3221, 3222] },
  { id: "arc-suspentes-montants", group: "Arc", element: "Suspentes/montants", scheduleNos: [206, 209], activityCodes: [1011, 1012, 1061, 1062, 2201, 3127, 3221, 3222] },
  { id: "pont-suspendu-haubans-c\u00e2bles-et-accessoires", group: "Pont suspendu / haubans", element: "Câbles et accessoires", scheduleNos: [208, 209], activityCodes: [2001, 3001] },
  { id: "pont-suspendu-haubans-massif-d-ancrage", group: "Pont suspendu / haubans", element: "Massif d'ancrage", scheduleNos: [400, 406], activityCodes: [1061, 1062, 3106, 3111, 3114, 3115] },
  { id: "structure-de-tablier-entretoises-longerons", group: "Structure de tablier", element: "Entretoises / longerons", scheduleNos: [211, 212], activityCodes: [1011, 1081, 2201, 3106, 3121, 3201, 3221, 3321, 3323] },
  { id: "contreventement-contreventements-diaphragmes", group: "Contreventement", element: "Contreventements / diaphragmes", scheduleNos: [213, 214], activityCodes: [1011, 1061, 1062, 1081, 1083, 2201, 3065, 3121, 3124, 3126, 3201, 3221, 3224, 3322, 3345] },
  { id: "joint-joints-de-tablier", group: "Joint", element: "Joints de tablier", scheduleNos: [100, 101, 102, 103, 104, 105, 106, 107, 108], activityCodes: [1031, 2051, 2052, 2053, 3026, 3051, 3052, 3053, 3054] },
  { id: "chasse-roue-trottoir-trottoir", group: "Chasse-roue / trottoir", element: "Trottoir", scheduleNos: [4], activityCodes: [1061, 1062, 3026, 3061, 3335] },
  { id: "chasse-roue-trottoir-chasse-roue-kerbs", group: "Chasse-roue / trottoir", element: "Chasse-roue / kerbs", scheduleNos: [3], activityCodes: [1061, 1062, 3026, 3061, 3221, 3335] },
  { id: "dispositif-de-retenue-glissi\u00e8re-garde-fous", group: "Dispositif de retenue", element: "Glissière / garde-fous", scheduleNos: [2], activityCodes: [1061, 1062, 1081, 2071, 3071, 3073] },
  { id: "protection-contre-la-corrosion-acier-structural", group: "Protection contre la corrosion", element: "Acier structural", scheduleNos: [201, 202, 203, 404, 405], activityCodes: [1051, 1052, 3065] },
  { id: "approche-transition-de-la-chauss\u00e9e", group: "Approche", element: "Transition de la chaussée", scheduleNos: [1, 501], activityCodes: [1042, 2011, 2012, 3005, 3026, 3027, 3061, 3066] },
  { id: "approche-syst\u00e8me-de-drainage", group: "Approche", element: "Système de drainage", scheduleNos: [505], activityCodes: [1015, 3068] },
  { id: "approche-glissi\u00e8re-d-approche", group: "Approche", element: "Glissière d'approche", scheduleNos: [2], activityCodes: [3072, 3074] },
  { id: "ponceau-mur-de-t\u00eate", group: "Ponceau", element: "Mur de tête", scheduleNos: [606], activityCodes: [3094, 3115, 3411] },
  { id: "ponceau-mur-d-aile", group: "Ponceau", element: "Mur d'aile", scheduleNos: [605], activityCodes: [3094, 3115, 3411] },
  { id: "ponceau-fondation", group: "Ponceau", element: "Fondation", scheduleNos: [607, 610], activityCodes: [1071, 3023, 3031, 3032, 3034] },
  { id: "ponceau-radier-invert", group: "Ponceau", element: "Radier / invert", scheduleNos: [604], activityCodes: [3091, 3092, 3093, 3095] },
  { id: "ponceau-barrel-vo\u00fbte", group: "Ponceau", element: "Barrel / voûte", scheduleNos: [600, 601, 602, 603], activityCodes: [3091, 3092, 3093, 3095, 3106, 3115, 3411] },
  { id: "ponceau-abutment-culvert", group: "Ponceau", element: "Abutment (culvert)", scheduleNos: [609], activityCodes: [3094, 3115, 3411] },
  { id: "mur-de-sout\u00e8nement-fondation", group: "Mur de soutènement", element: "Fondation", scheduleNos: [705], activityCodes: [3031, 3032, 3034, 3035] },
  { id: "mur-de-sout\u00e8nement-mur", group: "Mur de soutènement", element: "Mur", scheduleNos: [700, 701], activityCodes: [1018, 1061, 1062, 1071, 1081, 2312, 3022, 3023, 3081, 3082, 3084, 3115] },
  { id: "syst\u00e8me-d-acc\u00e8s-passerelle-main-courante", group: "Système d'accès", element: "Passerelle / main courante", scheduleNos: [800, 803], activityCodes: [3064, 3221] },
  { id: "structure-activit\u00e9s-globales", group: "Structure", element: "Activités globales", scheduleNos: [], activityCodes: [1091, 2011, 2012, 2052, 3005, 3011, 3022, 3042, 3044, 3051, 3052, 3053, 3061, 3062, 3064, 3065, 3067, 3068, 3073, 3074, 3094, 3114, 3126, 3224, 3335, 3349] },
]

/** Activities available for an Appendix C schedule number. */
export function activitiesForSchedule(scheduleNo: number): MaintenanceActivity[] {
  const codes = new Set<number>()
  for (const set of ELEMENT_ACTIVITY_SETS) {
    if (set.scheduleNos.includes(scheduleNo)) {
      for (const c of set.activityCodes) codes.add(c)
    }
  }
  return [...codes]
    .map((c) => BY_CODE.get(c))
    .filter((a): a is MaintenanceActivity => !!a)
    .sort((a, b) => a.code - b.code)
}

/** Element activity sets that match a schedule number (for grouping UI). */
export function activitySetsForSchedule(scheduleNo: number): ElementActivitySet[] {
  return ELEMENT_ACTIVITY_SETS.filter((s) => s.scheduleNos.includes(scheduleNo))
}

export function activitiesForSet(set: ElementActivitySet): MaintenanceActivity[] {
  return set.activityCodes
    .map((c) => BY_CODE.get(c))
    .filter((a): a is MaintenanceActivity => !!a)
}

