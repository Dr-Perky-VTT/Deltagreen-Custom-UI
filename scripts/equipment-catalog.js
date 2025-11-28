// equipment-catalog.js
// Canonical list of Delta Green weapons, gear, services, vehicles
// + EXPENSES view renderer

// ---------------------------------------------------------------------------
// Expense levels
// ---------------------------------------------------------------------------

export const EXPENSE_LEVELS = [
  "None",
  "Incidental",
  "Standard",
  "Unusual",
  "Major",
  "Extreme"
];

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const WEAPON_CATEGORIES = {
  HAND_TO_HAND: "hand_to_hand",
  FIREARM: "firearm",
  HEAVY: "heavy_weapon",
  DEMOLITION: "demolition",
  ARTILLERY: "artillery",
  LESS_LETHAL: "less_lethal",
  OTHER: "other"
};

export const GEAR_CATEGORIES = {
  ARMOR: "armor",
  RESEARCH: "research",
  COMMUNICATIONS: "communications",
  SURVEILLANCE: "surveillance",
  EMERGENCY: "emergency",
  BREAKING: "breaking",
  WEAPON_MODS: "weapon_mods",
  RESTRAINTS: "restraints",
  TRANSPORTATION: "transportation",
  LODGING: "lodging",
  COVERS: "covers",
  STORAGE: "storage",
  LIGHTING: "lighting",
  OTHER: "other"
};

export const SERVICE_CATEGORIES = {
  RESEARCH: "research",
  PROFESSIONAL: "professional",
  TRANSPORT: "transport",
  LODGING: "lodging",
  COVER: "cover",
  STORAGE: "storage",
  CRIMINAL: "criminal",
  OTHER: "other"
};

// ---------------------------------------------------------------------------
// Weapons
// ---------------------------------------------------------------------------

export const WEAPONS = [
  // === Hand-to-Hand Weapons ===
  {
    name: "Unarmed attack",
    category: WEAPON_CATEGORIES.HAND_TO_HAND,
    skill: "Unarmed Combat",
    damage: "1D4-1",
    baseRange: null,
    lethality: null,
    ammoCapacity: null,
    armorPiercing: null,
    expense: "None",
    notes: ""
  },
  {
    name: "Brass knuckles / heavy flashlight / steel-toe boots",
    category: WEAPON_CATEGORIES.HAND_TO_HAND,
    skill: "Unarmed Combat",
    damage: "1D4",
    baseRange: null,
    lethality: null,
    ammoCapacity: null,
    armorPiercing: null,
    expense: "Incidental",
    notes: ""
  },
  {
    name: "Garotte",
    category: WEAPON_CATEGORIES.HAND_TO_HAND,
    skill: "Unarmed Combat",
    damage: "special",
    baseRange: null,
    lethality: null,
    ammoCapacity: null,
    armorPiercing: null,
    expense: "Incidental",
    notes: "Works only from surprise. Pins and silences target; 1D6 damage per round until escape or death. Kevlar garotte can cut flexible cuffs."
  },
  {
    name: "Knife",
    category: WEAPON_CATEGORIES.HAND_TO_HAND,
    skill: "Melee Weapons",
    damage: "1D4",
    baseRange: null,
    lethality: null,
    ammoCapacity: null,
    armorPiercing: 3,
    expense: "Incidental",
    notes: ""
  },
  {
    name: "Hatchet",
    category: WEAPON_CATEGORIES.HAND_TO_HAND,
    skill: "Melee Weapons",
    damage: "1D4",
    baseRange: null,
    lethality: null,
    ammoCapacity: null,
    armorPiercing: null,
    expense: "Incidental",
    notes: ""
  },
  {
    name: "Large knife / combat dagger",
    category: WEAPON_CATEGORIES.HAND_TO_HAND,
    skill: "Melee Weapons",
    damage: "1D6",
    baseRange: null,
    lethality: null,
    ammoCapacity: null,
    armorPiercing: 3,
    expense: "Incidental",
    notes: ""
  },
  {
    name: "Club / nightstick / baton / collapsible baton",
    category: WEAPON_CATEGORIES.HAND_TO_HAND,
    skill: "Melee Weapons",
    damage: "1D6",
    baseRange: null,
    lethality: null,
    ammoCapacity: null,
    armorPiercing: null,
    expense: "Incidental",
    notes: ""
  },
  {
    name: "Machete / tomahawk / sword",
    category: WEAPON_CATEGORIES.HAND_TO_HAND,
    skill: "Melee Weapons",
    damage: "1D8",
    baseRange: null,
    lethality: null,
    ammoCapacity: null,
    armorPiercing: null,
    expense: "Incidental",
    notes: ""
  },
  {
    name: "Baseball bat / rifle butt",
    category: WEAPON_CATEGORIES.HAND_TO_HAND,
    skill: "Melee Weapons",
    damage: "1D8",
    baseRange: null,
    lethality: null,
    ammoCapacity: null,
    armorPiercing: null,
    expense: "Incidental",
    notes: ""
  },
  {
    name: "Spear / fixed bayonet",
    category: WEAPON_CATEGORIES.HAND_TO_HAND,
    skill: "Melee Weapons",
    damage: "1D8",
    baseRange: null,
    lethality: null,
    ammoCapacity: null,
    armorPiercing: 3,
    expense: "Incidental",
    notes: ""
  },
  {
    name: "Wood axe",
    category: WEAPON_CATEGORIES.HAND_TO_HAND,
    skill: "Melee Weapons",
    damage: "1D10",
    baseRange: null,
    lethality: null,
    ammoCapacity: null,
    armorPiercing: null,
    expense: "Incidental",
    notes: ""
  },
  {
    name: "Large sword",
    category: WEAPON_CATEGORIES.HAND_TO_HAND,
    skill: "Melee Weapons",
    damage: "1D10",
    baseRange: null,
    lethality: null,
    ammoCapacity: null,
    armorPiercing: null,
    expense: "Standard",
    notes: ""
  },
  {
    name: "Two-handed sword",
    category: WEAPON_CATEGORIES.HAND_TO_HAND,
    skill: "Melee Weapons",
    damage: "1D12",
    baseRange: null,
    lethality: null,
    ammoCapacity: null,
    armorPiercing: null,
    expense: "Standard",
    notes: "Requires special training."
  },

  // === Tear Gas and Pepper Spray ===
  {
    name: "Pepper spray keychain",
    category: WEAPON_CATEGORIES.LESS_LETHAL,
    skill: "DEX×5",
    damage: null,
    baseRange: "1 m",
    lethality: null,
    ammoCapacity: 1,
    armorPiercing: null,
    expense: "Incidental",
    notes: "-20% penalty to victim for 1 hour. Single target."
  },
  {
    name: "Pepper spray can",
    category: WEAPON_CATEGORIES.LESS_LETHAL,
    skill: "DEX×5",
    damage: null,
    baseRange: "3 m",
    lethality: null,
    ammoCapacity: 12,
    armorPiercing: null,
    expense: "Incidental",
    notes: "-20% penalty to victims for 1 hour. Up to 2 targets."
  },
  {
    name: "Tear gas grenade (thrown)",
    category: WEAPON_CATEGORIES.LESS_LETHAL,
    skill: "Athletics",
    damage: null,
    baseRange: "20 m",
    lethality: null,
    ammoCapacity: 1,
    armorPiercing: null,
    expense: "Incidental",
    notes: "Radius 10 m. -40% penalty for 1 hour. RESTRICTED; requires special training."
  },
  {
    name: "Tear gas grenade (launched)",
    category: WEAPON_CATEGORIES.LESS_LETHAL,
    skill: "Heavy Weapons",
    damage: null,
    baseRange: "50 m",
    lethality: null,
    ammoCapacity: 1,
    armorPiercing: null,
    expense: "Incidental",
    notes: "Radius 10 m. -40% penalty for 1 hour. RESTRICTED."
  },

  // === Stun Grenades ===
  {
    name: "Flash-bang grenade (thrown)",
    category: WEAPON_CATEGORIES.LESS_LETHAL,
    skill: "Athletics",
    damage: null,
    baseRange: "20 m",
    lethality: null,
    ammoCapacity: 1,
    armorPiercing: null,
    expense: "Incidental",
    notes: "Radius 10 m. -40% penalty; lasts 1D6 turns. Radius halved outdoors. RESTRICTED; requires special training."
  },
  {
    name: "Flash-bang grenade (launched)",
    category: WEAPON_CATEGORIES.LESS_LETHAL,
    skill: "Heavy Weapons",
    damage: null,
    baseRange: "50 m",
    lethality: null,
    ammoCapacity: 1,
    armorPiercing: null,
    expense: "Incidental",
    notes: "Radius 10 m. -40% penalty; lasts 1D6 turns. Radius halved outdoors. RESTRICTED."
  },

  // === Electroshock Weapons ===
  {
    name: "Stun gun",
    category: WEAPON_CATEGORIES.LESS_LETHAL,
    skill: "DEX×5",
    damage: null,
    baseRange: "1 m",
    lethality: null,
    ammoCapacity: 10,
    armorPiercing: null,
    expense: "Incidental",
    notes: "-20% penalty for 1D20 turns."
  },
  {
    name: "Shock baton",
    category: WEAPON_CATEGORIES.LESS_LETHAL,
    skill: "DEX×5",
    damage: null,
    baseRange: "1 m",
    lethality: null,
    ammoCapacity: 200,
    armorPiercing: null,
    expense: "Incidental",
    notes: "-20% penalty for 1D20 turns."
  },
  {
    name: "CED pistol",
    category: WEAPON_CATEGORIES.LESS_LETHAL,
    skill: "Firearms",
    damage: null,
    baseRange: "4 m",
    lethality: null,
    ammoCapacity: 4,
    armorPiercing: null,
    expense: "Standard",
    notes: "-20% penalty for 1D20 turns. Requires special training."
  },

  // === Firearms ===
  {
    name: "Light pistol",
    category: WEAPON_CATEGORIES.FIREARM,
    skill: "Firearms",
    damage: "1D8",
    baseRange: "10 m",
    lethality: null,
    ammoCapacity: 7,
    armorPiercing: null,
    expense: "Standard",
    notes: "Revolver capacity 6. Examples: .22 LR, .32 ACP, .380 ACP, .38 Special."
  },
  {
    name: "Medium pistol",
    category: WEAPON_CATEGORIES.FIREARM,
    skill: "Firearms",
    damage: "1D10",
    baseRange: "15 m",
    lethality: null,
    ammoCapacity: 15,
    armorPiercing: null,
    expense: "Standard",
    notes: "Revolver capacity 6. Examples: 9×19mm, .357 Magnum, .40 S&W, .45 ACP."
  },
  {
    name: "Heavy pistol",
    category: WEAPON_CATEGORIES.FIREARM,
    skill: "Firearms",
    damage: "1D12",
    baseRange: "20 m",
    lethality: null,
    ammoCapacity: 10,
    armorPiercing: null,
    expense: "Standard",
    notes: "Revolver capacity 6. Examples: 10×25mm Auto, .44 Magnum, .50 AE."
  },
  {
    name: "Shotgun (shot)",
    category: WEAPON_CATEGORIES.FIREARM,
    skill: "Firearms",
    damage: "2D8",
    baseRange: "75 m",
    lethality: null,
    ammoCapacity: 5,
    armorPiercing: null,
    expense: "Standard",
    notes: "Half damage beyond base range. 12-gauge examples: Mossberg 500, Remington 870, Ruger Red Label."
  },
  {
    name: "Shotgun (slug)",
    category: WEAPON_CATEGORIES.FIREARM,
    skill: "Firearms",
    damage: "2D8",
    baseRange: "75 m",
    lethality: null,
    ammoCapacity: 5,
    armorPiercing: null,
    expense: "Standard",
    notes: "Damage reduced to 2D6 beyond base range."
  },
  {
    name: "Shotgun (nonlethal)",
    category: WEAPON_CATEGORIES.FIREARM,
    skill: "Firearms",
    damage: "1D6 and Stunned",
    baseRange: "10 m",
    lethality: null,
    ammoCapacity: 5,
    armorPiercing: null,
    expense: "Standard",
    notes: ""
  },
  {
    name: "Light rifle / carbine",
    category: WEAPON_CATEGORIES.FIREARM,
    skill: "Firearms",
    damage: "1D12",
    baseRange: "100 m",
    lethality: "10%",
    ammoCapacity: "10 or 30",
    armorPiercing: 3,
    expense: "Standard",
    notes: "RESTRICTED if capable of full auto. Use lethality on bursts. Examples: 5.45×39mm, 5.56 NATO (AR-15, M4, SCAR-L). 7.62×39mm or .30-30 do 1D12+1."
  },
  {
    name: "Submachine gun (SMG)",
    category: WEAPON_CATEGORIES.FIREARM,
    skill: "Firearms",
    damage: "1D10",
    baseRange: "50 m",
    lethality: "10%",
    ammoCapacity: 30,
    armorPiercing: null,
    expense: "Unusual",
    notes: "RESTRICTED if capable of full auto. Use lethality on bursts."
  },
  {
    name: "Heavy rifle",
    category: WEAPON_CATEGORIES.FIREARM,
    skill: "Firearms",
    damage: "1D12+2",
    baseRange: "150 m",
    lethality: "10%",
    ammoCapacity: "10 or 20",
    armorPiercing: 5,
    expense: "Unusual",
    notes: "RESTRICTED if capable of full auto. Use lethality on bursts. Examples: 7.62 NATO, 7.62×54mm, .30-06."
  },
  {
    name: "Very heavy rifle",
    category: WEAPON_CATEGORIES.FIREARM,
    skill: "Firearms",
    damage: null,
    baseRange: "250 m",
    lethality: "20%",
    ammoCapacity: 10,
    armorPiercing: 5,
    expense: "Major",
    notes: "Examples: .408 CheyTac, .50 BMG."
  },

  // === Heavy Weapons ===
  {
    name: "Hand grenade",
    category: WEAPON_CATEGORIES.HEAVY,
    skill: "Athletics",
    damage: null,
    baseRange: "20 m",
    lethality: "15%",
    ammoCapacity: 1,
    armorPiercing: null,
    expense: "Incidental",
    notes: "Kill radius 10 m. RESTRICTED. Examples: M67, RGO."
  },
  {
    name: "Rocket-propelled grenade (RPG)",
    category: WEAPON_CATEGORIES.HEAVY,
    skill: "Heavy Weapons",
    damage: null,
    baseRange: "200 m",
    lethality: "30%",
    ammoCapacity: 1,
    armorPiercing: 20,
    expense: "Standard",
    notes: "Kill radius 10 m. RESTRICTED. Examples: M72 LAW, RPG-7V, AT4."
  },
  {
    name: "Handheld flamethrower",
    category: WEAPON_CATEGORIES.HEAVY,
    skill: "Heavy Weapons",
    damage: null,
    baseRange: "5 m",
    lethality: "10%",
    ammoCapacity: 20,
    armorPiercing: null,
    expense: "Unusual",
    notes: "Kill radius 1 m. Example: Ion XM42."
  },
  {
    name: "Military flamethrower",
    category: WEAPON_CATEGORIES.HEAVY,
    skill: "Heavy Weapons",
    damage: null,
    baseRange: "10 m",
    lethality: "10%",
    ammoCapacity: 5,
    armorPiercing: null,
    expense: "Unusual",
    notes: "Kill radius 2 m. RESTRICTED. Example: M9A1-7."
  },
  {
    name: "General-purpose machine gun (GPMG)",
    category: WEAPON_CATEGORIES.HEAVY,
    skill: "Heavy Weapons",
    damage: null,
    baseRange: "300 m",
    lethality: "15%",
    ammoCapacity: 100,
    armorPiercing: 3,
    expense: "Major",
    notes: "Lethality per burst. RESTRICTED. Examples: FN MAG/M240, PKM, M60."
  },
  {
    name: "Grenade launcher (GL)",
    category: WEAPON_CATEGORIES.HEAVY,
    skill: "Heavy Weapons",
    damage: null,
    baseRange: "150 m",
    lethality: "15%",
    ammoCapacity: 1,
    armorPiercing: null,
    expense: "Major",
    notes: "Kill radius 10 m. Revolver-type GL capacity 6. RESTRICTED. Examples: M203, M320, Milkor M32, M79."
  },
  {
    name: "Grenade machine gun (GMG)",
    category: WEAPON_CATEGORIES.HEAVY,
    skill: "Heavy Weapons",
    damage: null,
    baseRange: "300 m",
    lethality: "15%",
    ammoCapacity: 30,
    armorPiercing: null,
    expense: "Major",
    notes: "Kill radius 10 m. RESTRICTED. If firing 5-round burst, lethality 20%. Examples: H&K GMG, MK 19, AGS-17."
  },
  {
    name: "Heavy machine gun (HMG)",
    category: WEAPON_CATEGORIES.HEAVY,
    skill: "Heavy Weapons",
    damage: null,
    baseRange: "400 m",
    lethality: "20%",
    ammoCapacity: 100,
    armorPiercing: 5,
    expense: "Major",
    notes: "Lethality per burst. RESTRICTED. Examples: Browning M2HB, DShKM, NSV."
  },
  {
    name: "Light machine gun (LMG)",
    category: WEAPON_CATEGORIES.HEAVY,
    skill: "Heavy Weapons",
    damage: null,
    baseRange: "200 m",
    lethality: "10%",
    ammoCapacity: "100 or 200",
    armorPiercing: 3,
    expense: "Major",
    notes: "Lethality per burst. RESTRICTED. Examples: FN MINIMI/M249 SAW, RPK."
  },
  {
    name: "Autocannon",
    category: WEAPON_CATEGORIES.HEAVY,
    skill: "Heavy Weapons",
    damage: null,
    baseRange: "400 m",
    lethality: "30%",
    ammoCapacity: 100,
    armorPiercing: 5,
    expense: "Extreme",
    notes: "Kill radius 3 m. RESTRICTED. Examples: M242 Bushmaster, 2A70."
  },
  {
    name: "Minigun",
    category: WEAPON_CATEGORIES.HEAVY,
    skill: "Heavy Weapons",
    damage: null,
    baseRange: "300 m",
    lethality: "20%",
    ammoCapacity: 4000,
    armorPiercing: 5,
    expense: "Extreme",
    notes: "Kill radius 3 m when using long spray. RESTRICTED. Examples: GAU-17/A, M134, GShG-7.62."
  },

  // === Demolitions ===
  {
    name: "ANFO explosive",
    category: WEAPON_CATEGORIES.DEMOLITION,
    skill: "Demolitions",
    damage: null,
    baseRange: null,
    lethality: "30%",
    ammoCapacity: null,
    armorPiercing: null,
    expense: "Incidental",
    notes: "Ammonium nitrate fuel oil. Requires Science (Chemistry) and Demolitions. Kill radius 20 m."
  },
  {
    name: "C4 plastic explosive block (570 g)",
    category: WEAPON_CATEGORIES.DEMOLITION,
    skill: "Demolitions",
    damage: null,
    baseRange: null,
    lethality: "30%",
    ammoCapacity: null,
    armorPiercing: null,
    expense: "Incidental",
    notes: "Kill radius 2 m. RESTRICTED. Example: M112."
  },
  {
    name: "Improvised explosive device (IED)",
    category: WEAPON_CATEGORIES.DEMOLITION,
    skill: "Demolitions",
    damage: null,
    baseRange: null,
    lethality: "15%",
    ammoCapacity: null,
    armorPiercing: null,
    expense: "Incidental",
    notes: "Kill radius 10 m. RESTRICTED though ingredients usually are not. Example: pipe bomb. Larger bomb vest: 30% lethality, 20 m kill radius."
  },
  {
    name: "Large IED",
    category: WEAPON_CATEGORIES.DEMOLITION,
    skill: "Demolitions",
    damage: null,
    baseRange: null,
    lethality: "60%",
    ammoCapacity: null,
    armorPiercing: null,
    expense: "Standard",
    notes: "Kill radius 75 m. RESTRICTED though ingredients usually are not. Example: car bomb."
  },
  {
    name: "Explosively-formed penetrator mine",
    category: WEAPON_CATEGORIES.DEMOLITION,
    skill: "Demolitions",
    damage: null,
    baseRange: null,
    lethality: "25%",
    ammoCapacity: 20,
    armorPiercing: null,
    expense: "Standard",
    notes: "Kill radius 10 m. RESTRICTED. Example: M21."
  },

  // === Artillery ===
  {
    name: "General-purpose bomb",
    category: WEAPON_CATEGORIES.ARTILLERY,
    skill: "Artillery",
    damage: null,
    baseRange: "Air-dropped",
    lethality: "70%",
    ammoCapacity: null,
    armorPiercing: 10,
    expense: "Unusual",
    notes: "Kill radius 100 m. RESTRICTED. Requires special training. Examples: MK 82, FAB-250."
  },
  {
    name: "Heavy mortar",
    category: WEAPON_CATEGORIES.ARTILLERY,
    skill: "Artillery",
    damage: null,
    baseRange: "4 km",
    lethality: "35%",
    ammoCapacity: 1,
    armorPiercing: 5,
    expense: "Major",
    notes: "Kill radius 50 m. RESTRICTED. Examples: M120, 2B11 Sani."
  },
  {
    name: "Light mortar",
    category: WEAPON_CATEGORIES.ARTILLERY,
    skill: "Artillery",
    damage: null,
    baseRange: "2 km",
    lethality: "20%",
    ammoCapacity: 1,
    armorPiercing: null,
    expense: "Major",
    notes: "Kill radius 25 m. RESTRICTED. Examples: M224, Hirtenberger M6."
  },
  {
    name: "Anti-tank guided missile (ATGM)",
    category: WEAPON_CATEGORIES.ARTILLERY,
    skill: "Artillery",
    damage: null,
    baseRange: "4 km",
    lethality: "45%",
    ammoCapacity: null,
    armorPiercing: 25,
    expense: "Extreme",
    notes: "Kill radius 50 m. RESTRICTED. Examples: AGM-114 Hellfire, 9M120 Ataka."
  },
  {
    name: "Artillery gun / howitzer",
    category: WEAPON_CATEGORIES.ARTILLERY,
    skill: "Artillery",
    damage: null,
    baseRange: "5 km",
    lethality: "50%",
    ammoCapacity: 1,
    armorPiercing: 10,
    expense: "Extreme",
    notes: "Kill radius 100 m. RESTRICTED. Examples: M109, M777, 2A65 Msta-B, 2S19 Msta-S."
  },
  {
    name: "Cruise missile",
    category: WEAPON_CATEGORIES.ARTILLERY,
    skill: "Artillery",
    damage: null,
    baseRange: "100 km",
    lethality: "80%",
    ammoCapacity: null,
    armorPiercing: 15,
    expense: "Extreme",
    notes: "Kill radius 150 m. RESTRICTED. Requires special training. Examples: BGM-109 Tomahawk, Kh-55SM."
  }
];

// ---------------------------------------------------------------------------
// Gear – physical items only (things that can be in inventory)
// ---------------------------------------------------------------------------

export const GEAR = [
  // === Body Armor ===
  {
    name: "Riot helmet",
    category: GEAR_CATEGORIES.ARMOR,
    expense: "Standard",
    armorRating: 1,
    notes: "Adds to other armor. Effective only against melee, thrown weapons, and unarmed attacks. Cannot be concealed."
  },
  {
    name: "Kevlar helmet",
    category: GEAR_CATEGORIES.ARMOR,
    expense: "Standard",
    armorRating: 1,
    notes: "Adds to other armor. Cannot be concealed."
  },
  {
    name: "Kevlar vest",
    category: GEAR_CATEGORIES.ARMOR,
    expense: "Standard",
    armorRating: 3,
    notes: "If worn under clothes, noticing it requires an Alertness test."
  },
  {
    name: "Reinforced Kevlar vest",
    category: GEAR_CATEGORIES.ARMOR,
    expense: "Unusual",
    armorRating: 4,
    notes: "If worn under clothes, noticing it requires an Alertness test at +20%."
  },
  {
    name: "Tactical body armor",
    category: GEAR_CATEGORIES.ARMOR,
    expense: "Unusual",
    armorRating: 5,
    notes: "Cannot be concealed."
  },
  {
    name: "Bomb suit",
    category: GEAR_CATEGORIES.ARMOR,
    expense: "Extreme",
    armorRating: 10,
    notes: "Already includes helmet. Cannot be concealed."
  },

  // === Communications and Computers (physical) ===
  {
    name: "Burner phone",
    category: GEAR_CATEGORIES.COMMUNICATIONS,
    expense: "Incidental",
    notes: ""
  },
  {
    name: "Short-range walkie-talkie or early mobile phone",
    category: GEAR_CATEGORIES.COMMUNICATIONS,
    expense: "Incidental",
    notes: ""
  },
  {
    name: "Script kiddie hacking software",
    category: GEAR_CATEGORIES.COMMUNICATIONS,
    expense: "Incidental",
    notes: "Requires Computer Science. Failed Luck roll means it is faulty."
  },
  {
    name: "Earpiece communicator set",
    category: GEAR_CATEGORIES.COMMUNICATIONS,
    expense: "Standard",
    notes: ""
  },
  {
    name: "Ordinary computer",
    category: GEAR_CATEGORIES.COMMUNICATIONS,
    expense: "Standard",
    notes: ""
  },
  {
    name: "Tablet computer or smartphone",
    category: GEAR_CATEGORIES.COMMUNICATIONS,
    expense: "Standard",
    notes: ""
  },
  {
    name: "3D printer (plastic)",
    category: GEAR_CATEGORIES.COMMUNICATIONS,
    expense: "Standard",
    notes: ""
  },
  {
    name: "Satellite phone",
    category: GEAR_CATEGORIES.COMMUNICATIONS,
    expense: "Unusual",
    notes: ""
  },
  {
    name: "Powerful computer",
    category: GEAR_CATEGORIES.COMMUNICATIONS,
    expense: "Major",
    notes: ""
  },
  {
    name: "Cutting-edge encryption or data-mining software",
    category: GEAR_CATEGORIES.COMMUNICATIONS,
    expense: "Major",
    notes: "RESTRICTED. Requires Computer Science or special training (INT)."
  },
  {
    name: "Advanced data-analysis software",
    category: GEAR_CATEGORIES.COMMUNICATIONS,
    expense: "Major",
    notes: "Requires Computer Science or special training (INT)."
  },
  {
    name: "3D printer (metal)",
    category: GEAR_CATEGORIES.COMMUNICATIONS,
    expense: "Major",
    notes: ""
  },
  {
    name: "Portable IMSI catcher for cell surveillance",
    category: GEAR_CATEGORIES.COMMUNICATIONS,
    expense: "Major",
    notes: "RESTRICTED. Requires Computer Science or special training (INT). 2 km range (200 m wearable). Vehicular model 30 km as Extreme expense."
  },
  // === Weapon Mods ===
   {
    name: "Holographic sight",
    category: GEAR_CATEGORIES.WEAPON_MODS,
    expense: "Standard",
    notes: "Gives a +20% bonus to hit as long as your Agent has taken no damage since their last action."
  },
  {
    name: "Night vision sight",
    category: GEAR_CATEGORIES.WEAPON_MODS,
    expense: "Standard",
    notes: "Allows aiming in reduced light such as starlight out to 400 m; runs for 100 hours and doubles a firearm’s base range at night if your Agent spent the previous turn taking the Aim action."
  },
  {
    name: "Sound suppressor",
    category: GEAR_CATEGORIES.WEAPON_MODS,
    expense: "Standard",
    notes: "RESTRICTED. Requires an Alertness test to hear a shot beyond a wall or door. An especially quiet suppressed shot, such as a light pistol, imposes a –20% penalty to hear."
  },
  {
    name: "Targeting laser",
    category: GEAR_CATEGORIES.WEAPON_MODS,
    expense: "Standard",
    notes: "Gives a +20% bonus to hit as long as your Agent has taken no damage since their last action. Does not require raising the gun to the eyes. Useful to 200 m, runs for 100 hours. Also available as an Unusual expense with an infrared mode only visible with NVGs or night-vision sights."
  },
  {
    name: "Telescopic sight",
    category: GEAR_CATEGORIES.WEAPON_MODS,
    expense: "Standard",
    notes: "Doubles a firearm’s base range if your Agent spent the previous turn taking the Aim action."
  },
  {
    name: "Advanced Combat Optical Gunsight (ACOG)",
    category: GEAR_CATEGORIES.WEAPON_MODS,
    expense: "Unusual",
    notes: "Combines the effects of a holographic sight and a telescopic sight."
  },
  {
    name: "Thermal Weapon Sight (TWS)",
    category: GEAR_CATEGORIES.WEAPON_MODS,
    expense: "Unusual",
    notes: "Allows aiming in complete darkness out to 400 m; runs for 2 hours and doubles a firearm’s base range if your Agent spent the previous turn taking the Aim action."
  },
  {
    name: "\"Ghost gun\" machine: heavy-duty desktop 3D printer with software",
    category: GEAR_CATEGORIES.WEAPON_MODS,
    expense: "Major",
    notes: "Mills an aluminum lower receiver for a firearm. Other parts can be purchased as an Unusual expense. Assembly requires an INT×5 or Craft (Gunsmithing) test; on a failure, the gun is unreliable (see JUNK rules)."
  },
  // === Restraints ===
  {
    name: "Flexible cuffs",
    category: GEAR_CATEGORIES.RESTRAINTS,
    expense: "Incidental",
    notes: "Requires blade or scissors to cut. Zip-tie used as cuffs can be broken with STR×5 at +20%."
  },
  {
    name: "Handcuffs",
    category: GEAR_CATEGORIES.RESTRAINTS,
    expense: "Incidental",
    notes: "Require cuff key, special training with lockpicks or Craft (Locksmith), or DEX×5 at -20% to wriggle out."
  },

  // === Breaking & Entering ===
  {
    name: "Lockpick kit",
    category: GEAR_CATEGORIES.BREAKING,
    expense: "Incidental",
    notes: "Requires special training (DEX)."
  },
  {
    name: "Halligan forcible-entry tool",
    category: GEAR_CATEGORIES.BREAKING,
    expense: "Standard",
    notes: "Allows STR test to get through a hard barrier."
  },
  {
    name: "Lockpick gun",
    category: GEAR_CATEGORIES.BREAKING,
    expense: "Standard",
    notes: "Works only on simple tumbler locks."
  },

  // === Emergency and Survival ===
  {
    name: "Individual first aid kit",
    category: GEAR_CATEGORIES.EMERGENCY,
    expense: "Incidental",
    notes: "Adds +20% to a single First Aid roll."
  },
  {
    name: "Small fire extinguisher (CO2)",
    category: GEAR_CATEGORIES.EMERGENCY,
    expense: "Incidental",
    notes: "Douses a small fire. Can be used with DEX×5 to spray an animal in the face to make it run away."
  },
  {
    name: "Handheld GPS",
    category: GEAR_CATEGORIES.EMERGENCY,
    expense: "Incidental",
    notes: "Does not require a radio signal. Battery life 14–25 hours."
  },
  {
    name: "Basic camping gear",
    category: GEAR_CATEGORIES.EMERGENCY,
    expense: "Incidental",
    notes: "Daypack, bivy sack, survival blanket, button compass, flashlight, matches, meal bars, water purification tablets. Grants +20% Survival for 3 days."
  },
  {
    name: "Personal protective equipment (PPE)",
    category: GEAR_CATEGORIES.EMERGENCY,
    expense: "Incidental",
    armorRating: 2,
    notes: "Apron, goggles, gloves, breath mask. Provides 2 Armor against chemical and acid splashes and fumes."
  },
  {
    name: "Heavy-duty fire extinguisher",
    category: GEAR_CATEGORIES.EMERGENCY,
    expense: "Standard",
    notes: "Douses a room-sized fire."
  },
  {
    name: "Gas mask",
    category: GEAR_CATEGORIES.EMERGENCY,
    expense: "Standard",
    notes: "Effective against airborne hazards."
  },
  {
    name: "HAZMAT suit",
    category: GEAR_CATEGORIES.EMERGENCY,
    expense: "Standard",
    notes: "Effective against airborne or contact hazards. Requires 30 minutes to don safely."
  },
  {
    name: "First responder medical kit",
    category: GEAR_CATEGORIES.EMERGENCY,
    expense: "Standard",
    notes: "Bandages, IV kits, meds, etc. Adds +20% to four First Aid rolls."
  },
  {
    name: "Extended camping gear",
    category: GEAR_CATEGORIES.EMERGENCY,
    expense: "Standard",
    notes: "Large pack, sleeping bag, tent, compass, headlamp, stove, etc. Grants +20% Survival for 14 days."
  },
  {
    name: "SCUBA gear",
    category: GEAR_CATEGORIES.EMERGENCY,
    expense: "Unusual",
    notes: "Requires special training (Swim)."
  },
  {
    name: "Polypropylene barrel filled with acid",
    category: GEAR_CATEGORIES.EMERGENCY,
    expense: "Unusual",
    notes: "Sufficient to reduce a corpse to sludge. Wear PPE."
  },

  // === Surveillance ===
  {
    name: "Simple directional microphone",
    category: GEAR_CATEGORIES.SURVEILLANCE,
    expense: "Incidental",
    notes: "10 m range in typical urban conditions."
  },
  {
    name: "Bug detector",
    category: GEAR_CATEGORIES.SURVEILLANCE,
    expense: "Standard",
    notes: ""
  },
  {
    name: "Fiber optic scope",
    category: GEAR_CATEGORIES.SURVEILLANCE,
    expense: "Standard",
    notes: ""
  },
  {
    name: "GPS jammer",
    category: GEAR_CATEGORIES.SURVEILLANCE,
    expense: "Standard",
    notes: ""
  },
  {
    name: "Voice-activated recorder",
    category: GEAR_CATEGORIES.SURVEILLANCE,
    expense: "Standard",
    notes: ""
  },
  {
    name: "Directional microphone with acoustic software",
    category: GEAR_CATEGORIES.SURVEILLANCE,
    expense: "Standard",
    notes: "20 m range in typical urban conditions. Advanced versions have 50 m range as Unusual expense."
  },
  {
    name: "Basic open-market drone",
    category: GEAR_CATEGORIES.SURVEILLANCE,
    expense: "Standard",
    notes: "Requires special training (DEX)."
  },
  {
    name: "Audio jammer (RF/cellular)",
    category: GEAR_CATEGORIES.SURVEILLANCE,
    expense: "Unusual",
    notes: ""
  },
  {
    name: "GPS tracking device",
    category: GEAR_CATEGORIES.SURVEILLANCE,
    expense: "Unusual",
    notes: ""
  },
  {
    name: "Advanced drone",
    category: GEAR_CATEGORIES.SURVEILLANCE,
    expense: "Unusual",
    notes: "Requires Pilot (Drone) skill."
  },
  {
    name: "Ground-penetrating radar",
    category: GEAR_CATEGORIES.SURVEILLANCE,
    expense: "Major",
    notes: "About the size of a lawn mower; requires special training (INT)."
  },
  {
    name: "Military-grade drone",
    category: GEAR_CATEGORIES.SURVEILLANCE,
    expense: "Extreme",
    notes: "Requires Pilot (Drone). Can carry weapons."
  },

  // === Lighting and Vision ===
  {
    name: "Large flashlight",
    category: GEAR_CATEGORIES.LIGHTING,
    expense: "Incidental",
    notes: "Useful to 100 m. Runs for 10 hours."
  },
  {
    name: "Tactical light or weapon light",
    category: GEAR_CATEGORIES.LIGHTING,
    expense: "Incidental",
    notes: "Useful to 50 m. Runs for 1 hour. Available with IR or UV filters. IR only visible with NVGs; UV reveals bodily fluids, special inks, etc."
  },
  {
    name: "Ordinary binoculars",
    category: GEAR_CATEGORIES.LIGHTING,
    expense: "Incidental",
    notes: "×10 magnification; allows Alertness tests at greater distance."
  },
  {
    name: "Civilian night vision goggles",
    category: GEAR_CATEGORIES.LIGHTING,
    expense: "Standard",
    notes: "Allows operating in reduced light. Runs for 100 hours. Most Driving, Pilot, and ranged attacks at -20%. Penalty avoided with IR targeting laser."
  },
  {
    name: "Advanced binoculars or telescope",
    category: GEAR_CATEGORIES.LIGHTING,
    expense: "Standard",
    notes: "×20 magnification; allows Alertness tests at greater distance."
  },
  {
    name: "Powerful telescope",
    category: GEAR_CATEGORIES.LIGHTING,
    expense: "Unusual",
    notes: "×50 magnification; allows Alertness tests at greater distance."
  },
  {
    name: "Military-grade night vision goggles",
    category: GEAR_CATEGORIES.LIGHTING,
    expense: "Major",
    notes: "RESTRICTED. Allows operating in reduced light with no penalty for most skills. -20% only when fine detail perception is required."
  }
];

// ---------------------------------------------------------------------------
// Services – non-physical expenditures (tickets, lodging, research, covers…)
// ---------------------------------------------------------------------------

export const SERVICES = [
  // === Research & Academic Support ===
  {
    name: "Access to pay-for-use journals and publications",
    category: SERVICE_CATEGORIES.RESEARCH,
    expense: "Incidental",
    notes: ""
  },
  {
    name: "Expert advice from professional or academic",
    category: SERVICE_CATEGORIES.RESEARCH,
    expense: "Incidental",
    notes: ""
  },
  {
    name: "Credentials for unescorted entry into restricted site",
    category: SERVICE_CATEGORIES.RESEARCH,
    expense: "Standard",
    notes: ""
  },
  {
    name: "Independent verification from academic expert",
    category: SERVICE_CATEGORIES.RESEARCH,
    expense: "Standard",
    notes: ""
  },
  {
    name: "Specialized scientific equipment or artifacts for testing",
    category: SERVICE_CATEGORIES.RESEARCH,
    expense: "Major",
    notes: ""
  },

  // === Hacking / Technical Crime Services ===
  {
    name: "Hire a hacker to defeat basic encryption",
    category: SERVICE_CATEGORIES.CRIMINAL,
    expense: "Unusual",
    notes: "Requires Computer Science or Criminology to find a reliable one if the task is illegal."
  },
  {
    name: "Hire a hacker to defeat advanced encryption",
    category: SERVICE_CATEGORIES.CRIMINAL,
    expense: "Major",
    notes: "Requires Criminology to find a reliable one if the task is illegal."
  },
  {
    name: "Exclusive use of a dedicated communications satellite",
    category: SERVICE_CATEGORIES.PROFESSIONAL,
    expense: "Extreme",
    notes: "RESTRICTED. Requires Computer Science or special training (INT)."
  },
    // === Off-the-Books Medical Care ===
  {
    name: "Off-the-books first aid, no questions asked",
    category: SERVICE_CATEGORIES.CRIMINAL,
    expense: "Standard",
    notes: "Requires Criminology to find a medical professional of loose ethics."
  },
  {
    name: "Off-the-books drugs or minor surgery, no questions asked",
    category: SERVICE_CATEGORIES.CRIMINAL,
    expense: "Unusual",
    notes: "Requires Criminology to find a medical professional of loose ethics."
  },
  {
    name: "Off-the-books major surgery, no questions asked",
    category: SERVICE_CATEGORIES.CRIMINAL,
    expense: "Major",
    notes: "Requires Criminology to find a medical professional of loose ethics."
  },
  {
    name: "Bribe an incinerator, crematorium, or furnace worker to look the other way while you burn a corpse",
    category: SERVICE_CATEGORIES.CRIMINAL,
    expense: "Major",
    notes: "Requires Criminology to find a worker willing to cooperate."
  },
// === Law Enforcement – Official Requisition Only ===
{
  name: "[LAW ENFORCEMENT] Access to unclassified but restricted files such as criminal or financial records",
  category: SERVICE_CATEGORIES.REQUISITION_LAW,
  expense: "Incidental",
  notes: "OFFICIAL REQUISITION – Law Enforcement. Must relate to an official investigation; if not, a failed Luck roll draws official review."
},
{
  name: "[LAW ENFORCEMENT] Holding a prisoner for 24 hours with no questions asked",
  category: SERVICE_CATEGORIES.REQUISITION_LAW,
  expense: "Standard",
  notes: "OFFICIAL REQUISITION – Law Enforcement. Must relate to an official investigation; if not, a failed Luck roll draws official review."
},
{
  name: "[LAW ENFORCEMENT] Use for a day of an agency-owned sedan, patrol vehicle, or SUV",
  category: SERVICE_CATEGORIES.REQUISITION_LAW,
  expense: "Standard",
  notes: "OFFICIAL REQUISITION – Law Enforcement. Vehicle pulled from an agency motor pool."
},
{
  name: "[LAW ENFORCEMENT] Acquiring data from an unrelated case",
  category: SERVICE_CATEGORIES.REQUISITION_LAW,
  expense: "Standard",
  notes: "OFFICIAL REQUISITION – Law Enforcement. Pulling files from another investigation."
},
{
  name: "[LAW ENFORCEMENT] Drone surveillance of a specific suspect for a day or two",
  category: SERVICE_CATEGORIES.REQUISITION_LAW,
  expense: "Unusual",
  notes: "OFFICIAL REQUISITION – Law Enforcement. Automatically elicits official review."
},
{
  name: "[LAW ENFORCEMENT] Use for a day of an agency-owned quad runner, patrol boat, or small specialized craft",
  category: SERVICE_CATEGORIES.REQUISITION_LAW,
  expense: "Unusual",
  notes: "OFFICIAL REQUISITION – Law Enforcement. Specialized vehicles only."
},
{
  name: "[LAW ENFORCEMENT] Deployment of 2–5 local uniformed police",
  category: SERVICE_CATEGORIES.REQUISITION_LAW,
  expense: "Unusual",
  notes: "OFFICIAL REQUISITION – Law Enforcement. Automatically elicits official review."
},
{
  name: "[LAW ENFORCEMENT] Surveillance data from an ongoing case",
  category: SERVICE_CATEGORIES.REQUISITION_LAW,
  expense: "Unusual",
  notes: "OFFICIAL REQUISITION – Law Enforcement. Access to live surveillance on an existing case."
},
{
  name: "[LAW ENFORCEMENT] Order a wiretap",
  category: SERVICE_CATEGORIES.REQUISITION_LAW,
  expense: "Unusual",
  notes: "OFFICIAL REQUISITION – Law Enforcement. Requires appropriate warrants and approvals."
},
{
  name: "[LAW ENFORCEMENT] Armored SUV requisitioned for a week",
  category: SERVICE_CATEGORIES.REQUISITION_LAW,
  expense: "Unusual",
  notes: "OFFICIAL REQUISITION – Law Enforcement. Short-term assignment of an armored vehicle."
},
{
  name: "[LAW ENFORCEMENT] Call in a regional FBI SWAT team for a raid",
  category: SERVICE_CATEGORIES.REQUISITION_LAW,
  expense: "Extreme",
  notes: "OFFICIAL REQUISITION – Law Enforcement. Automatically elicits official review."
},

// === Intelligence – Official Requisition Only ===
{
  name: "[INTELLIGENCE] Access to another agency's classified files (not related to national security)",
  category: SERVICE_CATEGORIES.REQUISITION_INTEL,
  expense: "Unusual",
  notes: "OFFICIAL REQUISITION – Intelligence. Includes digital communications data from systems like NarusInsight (FBI) or XKeyscore (NSA)."
},
{
  name: "[INTELLIGENCE] Drone flyover or surveillance over a specific site",
  category: SERVICE_CATEGORIES.REQUISITION_INTEL,
  expense: "Unusual",
  notes: "OFFICIAL REQUISITION – Intelligence. Automatically elicits official review."
},
{
  name: "[INTELLIGENCE] Holding a prisoner at a \"black site\" for 48 hours",
  category: SERVICE_CATEGORIES.REQUISITION_INTEL,
  expense: "Major",
  notes: "OFFICIAL REQUISITION – Intelligence. An Agent must already know of the black site."
},
{
  name: "[INTELLIGENCE] Clearance to be present during an interrogation or debriefing",
  category: SERVICE_CATEGORIES.REQUISITION_INTEL,
  expense: "Major",
  notes: "OFFICIAL REQUISITION – Intelligence. Grants observer/participant status at a sensitive interrogation."
},
{
  name: "[INTELLIGENCE] Sophisticated fake documents",
  category: SERVICE_CATEGORIES.REQUISITION_INTEL,
  expense: "Major",
  notes: "OFFICIAL REQUISITION – Intelligence. High-quality false identities or travel papers."
},
{
  name: "[INTELLIGENCE] Access to classified files related to national security (no \"need to know\")",
  category: SERVICE_CATEGORIES.REQUISITION_INTEL,
  expense: "Major",
  notes: "OFFICIAL REQUISITION – Intelligence. Technically espionage; can result in firing and/or prosecution if detected."
},
{
  name: "[INTELLIGENCE] Extended drone or satellite surveillance over a specific site",
  category: SERVICE_CATEGORIES.REQUISITION_INTEL,
  expense: "Extreme",
  notes: "OFFICIAL REQUISITION – Intelligence. Automatically elicits official review."
},
{
  name: "[INTELLIGENCE] Call in support from a covert operative team in the area",
  category: SERVICE_CATEGORIES.REQUISITION_INTEL,
  expense: "Extreme",
  notes: "OFFICIAL REQUISITION – Intelligence. Automatically elicits official review."
},

// === Military – Official Requisition Only ===
{
  name: "[MILITARY] Seat on an already scheduled support flight (Space-A)",
  category: SERVICE_CATEGORIES.REQUISITION_MIL,
  expense: "Incidental",
  notes: "OFFICIAL REQUISITION – Military. Hitched ride on existing military airlift."
},
{
  name: "[MILITARY] Call in a special operations team for security or evacuation",
  category: SERVICE_CATEGORIES.REQUISITION_MIL,
  expense: "Extreme",
  notes: "OFFICIAL REQUISITION – Military. Automatically elicits official review."
},
{
  name: "[MILITARY] Helicopter support (transport or surveillance)",
  category: SERVICE_CATEGORIES.REQUISITION_MIL,
  expense: "Extreme",
  notes: "OFFICIAL REQUISITION – Military. Automatically elicits official review."
},
{
  name: "[MILITARY] Missile strike",
  category: SERVICE_CATEGORIES.REQUISITION_MIL,
  expense: "Extreme",
  notes: "OFFICIAL REQUISITION – Military. Automatically elicits official review; will not be performed on American soil."
},

// === Public Safety – Official Requisition Only ===
{
  name: "[PUBLIC SAFETY] Credentials for unescorted entry into a restricted site",
  category: SERVICE_CATEGORIES.REQUISITION_PUBLIC_SAFETY,
  expense: "Standard",
  notes: "OFFICIAL REQUISITION – Public Safety. Temporary credentials for secure facilities."
},
{
  name: "[PUBLIC SAFETY] Access to sensitive files outside the Agent's specialty",
  category: SERVICE_CATEGORIES.REQUISITION_PUBLIC_SAFETY,
  expense: "Standard",
  notes: "OFFICIAL REQUISITION – Public Safety. Cross-agency or cross-department file access."
},
{
  name: "[PUBLIC SAFETY] Request for local law enforcement to make an arrest (with justification)",
  category: SERVICE_CATEGORIES.REQUISITION_PUBLIC_SAFETY,
  expense: "Standard",
  notes: "OFFICIAL REQUISITION – Public Safety. Automatically elicits official review."
},
{
  name: "[PUBLIC SAFETY] Warrant for access to an industrial site for alleged environmental crimes",
  category: SERVICE_CATEGORIES.REQUISITION_PUBLIC_SAFETY,
  expense: "Unusual",
  notes: "OFFICIAL REQUISITION – Public Safety. Automatically elicits official review."
},
{
  name: "[PUBLIC SAFETY] Temporarily shut down a site for investigation of environmental crimes",
  category: SERVICE_CATEGORIES.REQUISITION_PUBLIC_SAFETY,
  expense: "Major",
  notes: "OFFICIAL REQUISITION – Public Safety. Automatically elicits official review."
},
{
  name: "[PUBLIC SAFETY] Quarantine a single location",
  category: SERVICE_CATEGORIES.REQUISITION_PUBLIC_SAFETY,
  expense: "Major",
  notes: "OFFICIAL REQUISITION – Public Safety. Automatically elicits official review; see QUARANTINES rules."
},
{
  name: "[PUBLIC SAFETY] Quarantine an area",
  category: SERVICE_CATEGORIES.REQUISITION_PUBLIC_SAFETY,
  expense: "Major",
  notes: "OFFICIAL REQUISITION – Public Safety. Automatically elicits official review; see QUARANTINES rules."
},
  // === Transportation (tickets / charters) ===
  {
    name: "Same-day bus ticket",
    category: SERVICE_CATEGORIES.TRANSPORT,
    expense: "Incidental",
    notes: ""
  },
  {
    name: "Car or SUV rented for a week",
    category: SERVICE_CATEGORIES.TRANSPORT,
    expense: "Standard",
    notes: ""
  },
  {
    name: "Same-day interstate plane or train ticket",
    category: SERVICE_CATEGORIES.TRANSPORT,
    expense: "Standard",
    notes: ""
  },
  {
    name: "Same-day international plane ticket (developed world)",
    category: SERVICE_CATEGORIES.TRANSPORT,
    expense: "Unusual",
    notes: ""
  },
  {
    name: "Chartered helicopter (one trip)",
    category: SERVICE_CATEGORIES.TRANSPORT,
    expense: "Unusual",
    notes: ""
  },
  {
    name: "Same-day international plane ticket (developing world)",
    category: SERVICE_CATEGORIES.TRANSPORT,
    expense: "Major",
    notes: ""
  },
  {
    name: "Chartered jet (one trip)",
    category: SERVICE_CATEGORIES.TRANSPORT,
    expense: "Extreme",
    notes: ""
  },

  // === Lodgings ===
  {
    name: "Night or two at a cheap motel",
    category: SERVICE_CATEGORIES.LODGING,
    expense: "Incidental",
    notes: ""
  },
  {
    name: "Week at a motel or short-term apartment",
    category: SERVICE_CATEGORIES.LODGING,
    expense: "Standard",
    notes: ""
  },
  {
    name: "Week at a fine hotel",
    category: SERVICE_CATEGORIES.LODGING,
    expense: "Unusual",
    notes: ""
  },
  {
    name: "Week at an exclusive resort",
    category: SERVICE_CATEGORIES.LODGING,
    expense: "Major",
    notes: ""
  },
  {
    name: "Private accommodations at most exclusive locations",
    category: SERVICE_CATEGORIES.LODGING,
    expense: "Extreme",
    notes: ""
  },

  // === Covers and Legends ===
  {
    name: "Forged passport or identification documents",
    category: SERVICE_CATEGORIES.COVER,
    expense: "Unusual",
    notes: "Requires official requisition or Criminology to find a reliable source."
  },
  {
    name: "Forged passport from G-7 country",
    category: SERVICE_CATEGORIES.COVER,
    expense: "Major",
    notes: "Requires official requisition or Criminology to find a reliable source."
  },
  {
    name: "New identity",
    category: SERVICE_CATEGORIES.COVER,
    expense: "Extreme",
    notes: "Requires official requisition or Criminology to find a reliable source."
  },

  // === Storage rentals ===
  {
    name: "Public storage unit (one month)",
    category: SERVICE_CATEGORIES.STORAGE,
    expense: "Incidental",
    notes: ""
  },
  {
    name: "Public storage unit (one year)",
    category: SERVICE_CATEGORIES.STORAGE,
    expense: "Standard",
    notes: ""
  },
  {
    name: "Large public storage unit (one year)",
    category: SERVICE_CATEGORIES.STORAGE,
    expense: "Unusual",
    notes: ""
  }
];

// ---------------------------------------------------------------------------
// Vehicle catalog
// ---------------------------------------------------------------------------

export const VEHICLE_CATEGORIES = {
  GROUND: "ground",
  WATER: "water",
  AIR: "air"
};

export const VEHICLES = [
  // === Ground Vehicles ===
  {
    name: "Motorcycle",
    category: VEHICLE_CATEGORIES.GROUND,
    hp: "15–20",
    armor: 0,
    speed: "Fast",
    expense: "Major",
    notes: ""
  },
  {
    name: "Sedan",
    category: VEHICLE_CATEGORIES.GROUND,
    hp: "25–30",
    armor: 3,
    speed: "Average",
    expense: "Major",
    notes: ""
  },
  {
    name: "Pickup or SUV",
    category: VEHICLE_CATEGORIES.GROUND,
    hp: "30–35",
    armor: 3,
    speed: "Average",
    expense: "Major",
    notes: ""
  },
  {
    name: "Armored SUV",
    category: VEHICLE_CATEGORIES.GROUND,
    hp: "35",
    armor: 10,
    speed: "Average",
    expense: "Extreme",
    notes: ""
  },
  {
    name: "Humvee",
    category: VEHICLE_CATEGORIES.GROUND,
    hp: "40",
    armor: 3,
    speed: "Average",
    expense: "Extreme",
    notes: ""
  },
  {
    name: "Armored Humvee",
    category: VEHICLE_CATEGORIES.GROUND,
    hp: "40",
    armor: 10,
    speed: "Slow",
    expense: "Extreme",
    notes: ""
  },
  {
    name: "Semi truck",
    category: VEHICLE_CATEGORIES.GROUND,
    hp: "45",
    armor: 3,
    speed: "Slow",
    expense: "Extreme",
    notes: ""
  },
  {
    name: "MRAP armored vehicle",
    category: VEHICLE_CATEGORIES.GROUND,
    hp: "60",
    armor: 20,
    speed: "Slow",
    expense: "Extreme",
    notes: ""
  },
  {
    name: "Armored personnel carrier",
    category: VEHICLE_CATEGORIES.GROUND,
    hp: "80",
    armor: 20,
    speed: "Slow",
    expense: "Extreme",
    notes: ""
  },
  {
    name: "Mid-20th century tank",
    category: VEHICLE_CATEGORIES.GROUND,
    hp: "90",
    armor: 20,
    speed: "Slow",
    expense: "Extreme",
    notes: ""
  },
  {
    name: "Modern tank",
    category: VEHICLE_CATEGORIES.GROUND,
    hp: "100",
    armor: 25,
    speed: "Slow",
    expense: "Extreme",
    notes: ""
  },

  // === Water Vehicles ===
  {
    name: "Combat rubber raiding craft",
    category: VEHICLE_CATEGORIES.WATER,
    hp: "10",
    armor: 0,
    speed: "Slow",
    expense: "Unusual",
    notes: ""
  },
  {
    name: "Rigid-hulled inflatable boat",
    category: VEHICLE_CATEGORIES.WATER,
    hp: "20",
    armor: 0,
    speed: "Slow",
    expense: "Major",
    notes: ""
  },
  {
    name: "River patrol boat",
    category: VEHICLE_CATEGORIES.WATER,
    hp: "30",
    armor: 0,
    speed: "Slow",
    expense: "Extreme",
    notes: ""
  },
  {
    name: "Speed boat",
    category: VEHICLE_CATEGORIES.WATER,
    hp: "25",
    armor: 0,
    speed: "Average",
    expense: "Extreme",
    notes: ""
  },

  // === Air Vehicles ===
  {
    name: "Civilian helicopter",
    category: VEHICLE_CATEGORIES.AIR,
    hp: "20",
    armor: 0,
    speed: "Average",
    expense: "Extreme",
    notes: ""
  },
  {
    name: "Commuter plane",
    category: VEHICLE_CATEGORIES.AIR,
    hp: "25",
    armor: 0,
    speed: "Average",
    expense: "Extreme",
    notes: ""
  },
  {
    name: "Police helicopter",
    category: VEHICLE_CATEGORIES.AIR,
    hp: "30",
    armor: 0,
    speed: "Fast",
    expense: "Extreme",
    notes: ""
  },
  {
    name: "Attack helicopter",
    category: VEHICLE_CATEGORIES.AIR,
    hp: "30",
    armor: 10,
    speed: "Fast",
    expense: "Extreme",
    notes: ""
  },
  {
    name: "Passenger jet",
    category: VEHICLE_CATEGORIES.AIR,
    hp: "50",
    armor: 0,
    speed: "Special",
    expense: "Extreme",
    notes: ""
  },
  {
    name: "Fighter jet",
    category: VEHICLE_CATEGORIES.AIR,
    hp: "40",
    armor: 0,
    speed: "Special",
    expense: "Extreme",
    notes: ""
  }
];

// ---------------------------------------------------------------------------
// ExpensesManager – render the EXPENSES view from this catalog
// ---------------------------------------------------------------------------

export class ExpensesManager {
  static init() {
    Hooks.on("renderDeltaGreenUI", () => this.render());
  }

  // ---------- main render ----------

  static render() {
    const container = document.getElementById("dg-expenses-body");
    if (!container) return;

    const filterExpense = document.getElementById("dg-expense-filter-expense");
    const filterType = document.getElementById("dg-expense-filter-type");
    const filterSearch = document.getElementById("dg-expense-filter-search");

    this._ensureExpenseFilterOptions(filterExpense);

    const entries = this._collectEntries();

    const state = {
      expense: filterExpense?.value || "",
      type: filterType?.value || "",
      search: filterSearch?.value?.toLowerCase() || ""
    };

    const rerender = () => {
      state.expense = filterExpense?.value || "";
      state.type = filterType?.value || "";
      state.search = filterSearch?.value?.toLowerCase() || "";
      this._renderBody(container, entries, state);
    };

    if (filterExpense && !filterExpense.dataset.dgExpensesWired) {
      filterExpense.addEventListener("change", rerender);
      filterExpense.dataset.dgExpensesWired = "1";
    }
    if (filterType && !filterType.dataset.dgExpensesWired) {
      filterType.addEventListener("change", rerender);
      filterType.dataset.dgExpensesWired = "1";
    }
    if (filterSearch && !filterSearch.dataset.dgExpensesWired) {
      filterSearch.addEventListener("input", rerender);
      filterSearch.dataset.dgExpensesWired = "1";
    }

    this._renderBody(container, entries, state);
  }

  static _ensureExpenseFilterOptions(selectEl) {
    if (!selectEl) return;
    if (selectEl.dataset.dgExpensesPopulated === "1") return;

    const any = selectEl.querySelector("option[value='']");
    selectEl.innerHTML = "";
    if (any) selectEl.appendChild(any);

    for (const level of EXPENSE_LEVELS) {
      const opt = document.createElement("option");
      opt.value = level;
      opt.textContent = level.toUpperCase();
      selectEl.appendChild(opt);
    }

    selectEl.dataset.dgExpensesPopulated = "1";
  }

  // ---------- data collection ----------

  static _collectEntries() {
    const out = [];

    const add = (srcArray, typeLabel) => {
      if (!Array.isArray(srcArray)) return;
      for (const item of srcArray) {
        if (!item) continue;
        const expense = item.expense || "None";
        out.push({
          name: item.name || "UNKNOWN",
          expense,
          type: typeLabel, // WEAPON | GEAR | SERVICE | VEHICLE
          category: item.category || null,
          notes: item.notes || ""
        });
      }
    };

    add(WEAPONS, "WEAPON");
    add(GEAR, "GEAR");
    add(SERVICES, "SERVICE");
    add(VEHICLES, "VEHICLE");

    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }

  // ---------- render body ----------

  static _renderBody(container, allEntries, state) {
    const { expense, type, search } = state;

    const filtered = allEntries.filter((entry) => {
      if (expense && entry.expense !== expense) return false;
      if (type && entry.type !== type) return false;
      if (search && !entry.name.toLowerCase().includes(search)) return false;
      return true;
    });

    if (!filtered.length) {
      container.innerHTML =
        `<p style="opacity: 0.7; font-size: 10px;">NO MATCHING ENTRIES.</p>`;
      return;
    }

    const grouped = {};
    for (const level of EXPENSE_LEVELS) {
      grouped[level] = [];
    }
    grouped["__OTHER__"] = [];

    for (const entry of filtered) {
      if (grouped[entry.expense]) {
        grouped[entry.expense].push(entry);
      } else {
        grouped["__OTHER__"].push(entry);
      }
    }

    const blocks = [];

    for (const level of EXPENSE_LEVELS) {
      const bucket = grouped[level];
      if (!bucket || !bucket.length) continue;
      blocks.push(this._renderExpenseBlock(level, bucket));
    }

    if (grouped["__OTHER__"].length) {
      blocks.push(this._renderExpenseBlock("Other", grouped["__OTHER__"]));
    }

    container.innerHTML = blocks.join("");
  }

  static _renderExpenseBlock(level, entries) {
    entries.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type.localeCompare(b.type);
    });

    const rows = entries
      .map((entry) => {
        const typeTag = `<span class="dg-tag">${entry.type}</span>`;
        const noteAttr = entry.notes
          ? ` title="${this._escapeAttr(entry.notes)}"`
          : "";
        const categoryLabel = entry.category
          ? this._prettyLabel(entry.category)
          : "";

        const subLabel = categoryLabel
          ? `<span style="font-size: 9px; opacity: 0.7;">${categoryLabel}</span>`
          : "";

        return `
        <li class="dg-expense-row"${noteAttr}>
          <div class="dg-expense-name">
            ${entry.name}
            ${subLabel ? `<br>${subLabel}` : ""}
          </div>
          ${typeTag}
        </li>
      `;
      })
      .join("");

    return `
      <div class="dg-expense-block">
        <div class="dg-subtitle">${level.toUpperCase()}</div>
        <ul class="dg-results-list dg-expenses-list">
          ${rows}
        </ul>
      </div>
    `;
  }

  // ---------- helpers ----------

  static _prettyLabel(key) {
    if (!key) return "";
    return String(key)
      .replace(/^.*\./, "")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  static _escapeAttr(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

// Register once when the world starts up
Hooks.once("init", () => {
  ExpensesManager.init();
});
