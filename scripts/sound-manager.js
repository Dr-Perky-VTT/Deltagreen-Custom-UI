// sound-manager.js
import { GEAR_CATEGORIES } from "./equipment-catalog.js";

/**
 * One sound group per canonical WEAPONS entry.
 * Each group has:
 *  - key: used in settings IDs
 *  - label: shown in the Settings config
 *  - weapons: array of exact weapon names this group applies to
 */
export const WEAPON_SOUND_GROUPS = {
  // ---------------------------------------------------------------------------
  // MELEE / HAND-TO-HAND
  // ---------------------------------------------------------------------------
  MELEE_UNARMED: {
    key: "meleeUnarmed",
    label: "Unarmed attack",
    weapons: ["Unarmed attack"]
  },
  MELEE_IMPROVISED_STRIKE: {
    key: "meleeImprovisedStrike",
    label: "Brass knuckles /  heavy flashlight / steel-toe boots",
    weapons: ["Brass knuckles / heavy flashlight / steel-toe boots"]
  },
  MELEE_GAROTTE: {
    key: "meleeGarotte",
    label: "Garotte",
    weapons: ["Garotte"]
  },
  MELEE_KNIFE: {
    key: "meleeKnife",
    label: "Knife / Spear / fixed bayonet",
    weapons: ["Knife / Spear / fixed bayonet"]
  },
  MELEE_HATCHET: {
    key: "meleeHatchet",
    label: "Hatchet / Wood axe",
    weapons: ["Hatchet / Wood axe"]
  },
  MELEE_LARGE_KNIFE: {
    key: "meleeLargeKnife",
    label: "Large knife / combat dagger",
    weapons: ["Large knife / combat dagger"]
  },
  MELEE_CLUB: {
    key: "meleeClub",
    label: "Club / nightstick / baton / collapsible baton",
    weapons: ["Club / nightstick / baton / collapsible baton"]
  },
  MELEE_MACHETE: {
    key: "meleeMachete",
    label: "Machete / tomahawk / sword",
    weapons: ["Machete / tomahawk / sword"]
  },
  MELEE_BASEBALL_BAT: {
    key: "meleeBaseballBat",
    label: "Baseball bat / rifle butt",
    weapons: ["Baseball bat / rifle butt"]
  },
  MELEE_LARGE_SWORD: {
    key: "meleeLargeSword",
    label: "Large sword / Two-handed sword",
    weapons: ["Large sword / Two-handed sword"]
  },


  // ---------------------------------------------------------------------------
  // LESS-LETHAL: PEPPER SPRAY / TEAR GAS
  // ---------------------------------------------------------------------------
  LESS_LETHAL_PEPPER_KEYCHAIN: {
    key: "lessLethalPepperKeychain",
    label: "Pepper spray keychain",
    weapons: ["Pepper spray keychain"]
  },
  LESS_LETHAL_PEPPER_CAN: {
    key: "lessLethalPepperCan",
    label: "Pepper spray can",
    weapons: ["Pepper spray can"]
  },
  LESS_LETHAL_TEAR_THROWN: {
    key: "lessLethalTearThrown",
    label: "Tear gas grenade (thrown)",
    weapons: ["Tear gas grenade (thrown)"]
  },
  LESS_LETHAL_TEAR_LAUNCHED: {
    key: "lessLethalTearLaunched",
    label: "Tear gas grenade (launched)",
    weapons: ["Tear gas grenade (launched)"]
  },

  // ---------------------------------------------------------------------------
  // LESS-LETHAL: FLASH-BANGS
  // ---------------------------------------------------------------------------
  LESS_LETHAL_FLASHBANG_THROWN: {
    key: "lessLethalFlashbangThrown",
    label: "Flash-bang grenade (thrown)",
    weapons: ["Flash-bang grenade (thrown)"]
  },
  LESS_LETHAL_FLASHBANG_LAUNCHED: {
    key: "lessLethalFlashbangLaunched",
    label: "Flash-bang grenade (launched)",
    weapons: ["Flash-bang grenade (launched)"]
  },

  // ---------------------------------------------------------------------------
  // LESS-LETHAL: STUN GUNS / CED
  // ---------------------------------------------------------------------------
  LESS_LETHAL_STUN_GUN: {
    key: "lessLethalStunGun",
    label: "Stun gun",
    weapons: ["Stun gun"]
  },
  LESS_LETHAL_SHOCK_BATON: {
    key: "lessLethalShockBaton",
    label: "Shock baton",
    weapons: ["Shock baton"]
  },
  LESS_LETHAL_CED_PISTOL: {
    key: "lessLethalCedPistol",
    label: "CED pistol",
    weapons: ["CED pistol"]
  },

  // ---------------------------------------------------------------------------
  // FIREARMS: PISTOLS
  // ---------------------------------------------------------------------------
  FIREARM_LIGHT_PISTOL: {
    key: "firearmLightPistol",
    label: "Light pistol",
    weapons: ["Light pistol"]
  },
  FIREARM_MEDIUM_PISTOL: {
    key: "firearmMediumPistol",
    label: "Medium pistol",
    weapons: ["Medium pistol"]
  },
  FIREARM_HEAVY_PISTOL: {
    key: "firearmHeavyPistol",
    label: "Heavy pistol",
    weapons: ["Heavy pistol"]
  },

  // ---------------------------------------------------------------------------
  // FIREARMS: SHOTGUNS
  // ---------------------------------------------------------------------------
  FIREARM_SHOTGUN_SHOT: {
    key: "firearmShotgunShot",
    label: "Shotgun (shot)",
    weapons: ["Shotgun (shot)"]
  },
  FIREARM_SHOTGUN_SLUG: {
    key: "firearmShotgunSlug",
    label: "Shotgun (slug)",
    weapons: ["Shotgun (slug)"]
  },
  FIREARM_SHOTGUN_NONLETHAL: {
    key: "firearmShotgunNonlethal",
    label: "Shotgun (nonlethal)",
    weapons: ["Shotgun (nonlethal)"]
  },

  // ---------------------------------------------------------------------------
  // FIREARMS: RIFLES / SMG
  // ---------------------------------------------------------------------------
  FIREARM_LIGHT_RIFLE: {
    key: "firearmLightRifle",
    label: "Light rifle / carbine",
    weapons: ["Light rifle / carbine"]
  },
  FIREARM_HEAVY_RIFLE: {
    key: "firearmHeavyRifle",
    label: "Heavy rifle",
    weapons: ["Heavy rifle"]
  },
  FIREARM_VERY_HEAVY_RIFLE: {
    key: "firearmVeryHeavyRifle",
    label: "Very heavy rifle",
    weapons: ["Very heavy rifle"]
  },
  FIREARM_SMG: {
    key: "firearmSmg",
    label: "Submachine gun (SMG)",
    weapons: ["Submachine gun (SMG)"]
  },

  // ---------------------------------------------------------------------------
  // HEAVY WEAPONS: GRENADES / LAUNCHERS
  // ---------------------------------------------------------------------------
  HEAVY_HAND_GRENADE: {
    key: "heavyHandGrenade",
    label: "Hand grenade",
    weapons: ["Hand grenade"]
  },
  HEAVY_RPG: {
    key: "heavyRpg",
    label: "Rocket-propelled grenade (RPG)",
    weapons: ["Rocket-propelled grenade (RPG)"]
  },
  HEAVY_GRENADE_LAUNCHER: {
    key: "heavyGrenadeLauncher",
    label: "Grenade launcher (GL)",
    weapons: ["Grenade launcher (GL)"]
  },
  HEAVY_GMG: {
    key: "heavyGmg",
    label: "Grenade machine gun (GMG)",
    weapons: ["Grenade machine gun (GMG)"]
  },

  // ---------------------------------------------------------------------------
  // HEAVY WEAPONS: FLAMETHROWERS
  // ---------------------------------------------------------------------------
  HEAVY_HANDHELD_FLAMETHROWER: {
    key: "heavyHandheldFlamethrower",
    label: "Handheld flamethrower",
    weapons: ["Handheld flamethrower"]
  },
  HEAVY_MILITARY_FLAMETHROWER: {
    key: "heavyMilitaryFlamethrower",
    label: "Military flamethrower",
    weapons: ["Military flamethrower"]
  },

  // ---------------------------------------------------------------------------
  // HEAVY WEAPONS: MACHINE GUNS
  // ---------------------------------------------------------------------------
  HEAVY_GPMG: {
    key: "heavyGpmg",
    label: "General-purpose machine gun (GPMG)",
    weapons: ["General-purpose machine gun (GPMG)"]
  },
  HEAVY_HMG: {
    key: "heavyHmg",
    label: "Heavy machine gun (HMG)",
    weapons: ["Heavy machine gun (HMG)"]
  },
  HEAVY_LMG: {
    key: "heavyLmg",
    label: "Light machine gun (LMG)",
    weapons: ["Light machine gun (LMG)"]
  },
  HEAVY_MINIGUN: {
    key: "heavyMinigun",
    label: "Minigun",
    weapons: ["Minigun"]
  },

  // ---------------------------------------------------------------------------
  // DEMOLITIONS / IED
  // ---------------------------------------------------------------------------
  DEMO_ANFO: {
    key: "demoAnfo",
    label: "ANFO explosive",
    weapons: ["ANFO explosive"]
  },
  DEMO_C4_BLOCK: {
    key: "demoC4Block",
    label: "C4 plastic explosive block (570 g)",
    weapons: ["C4 plastic explosive block (570 g)"]
  },
  DEMO_IED: {
    key: "demoIed",
    label: "Improvised explosive device (IED)",
    weapons: ["Improvised explosive device (IED)"]
  },
  DEMO_LARGE_IED: {
    key: "demoLargeIed",
    label: "Large IED",
    weapons: ["Large IED"]
  },
  DEMO_EFP_MINE: {
    key: "demoEfpMine",
    label: "Explosively-formed penetrator mine",
    weapons: ["Explosively-formed penetrator mine"]
  },

  // ---------------------------------------------------------------------------
  // ARTILLERY / BIG ORDNANCE
  // ---------------------------------------------------------------------------
  ARTY_GENERAL_PURPOSE_BOMB: {
    key: "artilleryGeneralPurposeBomb",
    label: "General-purpose bomb",
    weapons: ["General-purpose bomb"]
  },
  ARTY_HEAVY_MORTAR: {
    key: "artilleryHeavyMortar",
    label: "Heavy mortar",
    weapons: ["Heavy mortar"]
  },
  ARTY_LIGHT_MORTAR: {
    key: "artilleryLightMortar",
    label: "Light mortar",
    weapons: ["Light mortar"]
  },
  ARTY_ATGM: {
    key: "artilleryAtgm",
    label: "Anti-tank guided missile (ATGM)",
    weapons: ["Anti-tank guided missile (ATGM)"]
  },
  ARTY_HOWITZER: {
    key: "artilleryGunHowitzer",
    label: "Artillery gun / howitzer",
    weapons: ["Artillery gun / howitzer"]
  },
  ARTY_CRUISE_MISSILE: {
    key: "artilleryCruiseMissile",
    label: "Cruise missile",
    weapons: ["Cruise missile"]
  },
  ARTY_AUTOCANNON: {
    key: "artilleryAutocannon",
    label: "Autocannon",
    weapons: ["Autocannon"]
  }
};

// Reverse lookup: weapon name -> group key
const WEAPON_NAME_TO_GROUP_KEY = {};
for (const groupId of Object.keys(WEAPON_SOUND_GROUPS)) {
  const group = WEAPON_SOUND_GROUPS[groupId];
  for (const wName of group.weapons) {
    WEAPON_NAME_TO_GROUP_KEY[wName] = group.key;
  }
}
// Map group key -> isFirearm (we treat FIREARM_* groups as small arms)
const GROUP_KEY_IS_FIREARM = {};
for (const groupId of Object.keys(WEAPON_SOUND_GROUPS)) {
  const group = WEAPON_SOUND_GROUPS[groupId];
  const isFirearm = groupId.startsWith("FIREARM_");
  GROUP_KEY_IS_FIREARM[group.key] = isFirearm;
}
/**
 * WeaponSoundManager:
 *  - registers 4 sound slots per group (semi, semiSupp, auto, autoSupp)
 *  - resolves correct sound for a given attack (by weapon, mode, suppressor)
 *  - plays it at configured volume
 */
export class WeaponSoundManager {
  // Make sure we don't wire the hook twice
  static _collapseHooked = false;

  /**
   * Call once during module init.
   *
   * Registers:
   *   weaponVolume
   *   weaponSound_<groupKey>_semi
   *   weaponSound_<groupKey>_semiSupp
   *   weaponSound_<groupKey>_auto
   *   weaponSound_<groupKey>_autoSupp
   */
   // Inside WeaponSoundManager
static _resolveSoundPath(settingKey, defaultPath = null) {
  const MODULE_ID = DeltaGreenUI.ID || "deltagreen-custom-ui";
  const fullKey = `${MODULE_ID}.${settingKey}`;

  try {
    // If this specific sound setting was never registered,
    // just use the default path and do NOT call game.settings.get.
    const registry = game.settings?.settings;
    if (!registry || !registry.has(fullKey)) {
      // Optional: debug-only log
      // console.debug(`DG UI | Weapon sound setting not registered: ${fullKey} (using default)`);
      return defaultPath;
    }

    const value = game.settings.get(MODULE_ID, settingKey);
    if (typeof value === "string" && value.trim().length) {
      return value.trim();
    }

    return defaultPath;
  } catch (err) {
    console.warn(
      `Delta Green UI | WeaponSoundManager._resolveSoundPath failed for ${fullKey}, using default.`,
      err
    );
    return defaultPath;
  }
}

  static registerSettings() {
    const moduleId = "deltagreen-custom-ui";

    // Global volume
    game.settings.register(moduleId, "weaponVolume", {
      name: "Weapon SFX Volume",
      hint: "Volume for weapon sounds played by the Delta Green Custom UI.",
      scope: "client",
      config: true,
      type: Number,
      range: { min: 0, max: 1, step: 0.05 },
      default: 0.8
    });

    // One audio file picker per group.
    //  - FIREARM_* groups get 4 variants (semi, semiSupp, auto, autoSupp)
    //  - everything else gets a single sound field.
    for (const groupId of Object.keys(WEAPON_SOUND_GROUPS)) {
      const group = WEAPON_SOUND_GROUPS[groupId];
      const gKey = group.key;
      const label = group.label || gKey;
      const isFirearm = groupId.startsWith("FIREARM_");

      if (isFirearm) {
        const makeKey = (suffix) => `weaponSound_${gKey}_${suffix}`;

        const variants = [
          {
            suffix: "semi",
            name: `Weapon SFX – ${label} (Single / Semi)`,
            hint: "Sound for single or semi-auto shots."
          },
          {
            suffix: "semiSupp",
            name: `Weapon SFX – ${label} (Single / Semi, Suppressed)`,
            hint: "Sound for single or semi-auto shots with a suppressor."
          },
          {
            suffix: "auto",
            name: `Weapon SFX – ${label} (Auto / Burst)`,
            hint: "Sound for automatic or burst fire."
          },
          {
            suffix: "autoSupp",
            name: `Weapon SFX – ${label} (Auto / Burst, Suppressed)`,
            hint: "Sound for automatic or burst fire with a suppressor."
          }
        ];

        for (const v of variants) {
          game.settings.register(moduleId, makeKey(v.suffix), {
            name: v.name,
            hint: v.hint,
            scope: "world",
            config: true,
            type: String,
            default: "",
            filePicker: "audio"
          });
        }
      } else {
        game.settings.register(moduleId, `weaponSound_${gKey}`, {
          name: `Weapon SFX – ${label}`,
          hint: "Sound to play when this weapon group is used.",
          scope: "world",
          config: true,
          type: String,
          default: "",
          filePicker: "audio"
        });
      }
    }

    // After registering all settings, hook the settings sheet once
    this._wireSettingsCollapsingHook();
  }

  /**
   * Hook the settings sheet so we can collapse weapon SFX variants.
   * Works on both old (renderSettingsConfig) and new (renderClientSettings) names.
   */
  /**
   * Hook the Settings windows so we can collapse weapon SFX variants.
   * Called once from registerSettings().
   */
  static _wireSettingsCollapsingHook() {
    if (this._collapseHooked) return;
    this._collapseHooked = true;

    const handler = () => {
      try {
        this._decorateWeaponSoundSettings();
      } catch (err) {
        console.warn(
          "Delta Green UI | WeaponSoundManager UI collapse error:",
          err
        );
      }
    };

    // Classic “Game Settings / Configure Settings” window
    Hooks.on("renderSettingsConfig", handler);

    // Foundry 12/13 Client Settings window
    Hooks.on("renderClientSettings", handler);
  }

  /**
   * Find all weaponSound_* settings in the current document and group the
   * firearm variants:
   *   weaponSound_<base>_(semi|semiSupp|auto|autoSupp)
   *
   * Example full key:
   *   "deltagreen-custom-ui.weaponSound_firearmLightPistol_semi"
   */
  static _decorateWeaponSoundSettings() {
    // Look for any setting input whose name contains "weaponSound_"
    const inputs = document.querySelectorAll('input[name*="weaponSound_"]');
    if (!inputs.length) return;

    const groups = {};

    for (const input of inputs) {
      // Each row is a .form-group around the label + input
      const row = input.closest(".form-group");
      if (!row) continue;

      // If this row is already inside our subsettings wrapper, skip it so we
      // don’t re-nest on subsequent renders.
      if (row.closest(".dg-weaponsfx-subsettings")) continue;

      const fullName = input.getAttribute("name") || "";
      // Pull out the tail: weaponSound_<base>_(semi|semiSupp|auto|autoSupp)
      const match = fullName.match(
        /weaponSound_(.+)_(semi|semiSupp|auto|autoSupp)$/
      );
      if (!match) continue;

      const baseKey = match[1];   // e.g. "firearmLightPistol"
      const variant = match[2];   // "semi", "semiSupp", "auto", "autoSupp"

      if (!groups[baseKey]) {
        groups[baseKey] = { rows: {}, order: [] };
      }
      groups[baseKey].rows[variant] = row;
      if (!groups[baseKey].order.includes(variant)) {
        groups[baseKey].order.push(variant);
      }
    }

    // Nothing matched → nothing to do
    if (!Object.keys(groups).length) return;

    // Inject a tiny style block once
    if (!document.getElementById("dg-weaponsfx-settings-style")) {
      const style = document.createElement("style");
      style.id = "dg-weaponsfx-settings-style";
      style.textContent = `
        .dg-weaponsfx-toggle {
          margin-left: 8px;
          font-size: 11px;
          cursor: pointer;
          text-transform: uppercase;
          opacity: 0.85;
        }
        .dg-weaponsfx-toggle:hover {
          text-decoration: underline;
        }
        .dg-weaponsfx-subsettings {
          margin-left: 1.5em;
          padding-left: 0.5em;
          border-left: 1px dashed var(--color-border-dark, #444);
          margin-top: -4px;
        }
      `;
      document.head.appendChild(style);
    }

    for (const [baseKey, group] of Object.entries(groups)) {
      const rows = group.rows;

      // Pick SEMI row as the visible header if possible
      const headerRow = rows.semi || rows.auto || Object.values(rows)[0];
      if (!headerRow) continue;

      // Extra variants (these go inside the collapsible)
      const extraVariants = ["semiSupp", "auto", "autoSupp"].filter(
        (v) => rows[v] && rows[v] !== headerRow
      );
      if (!extraVariants.length) continue;

      const parent = headerRow.parentElement;
      if (!parent) continue;

      // Wrapper that will contain the extra rows
      const wrapper = document.createElement("div");
      wrapper.classList.add("dg-weaponsfx-subsettings");
      wrapper.style.display = "none";
      parent.insertBefore(wrapper, headerRow.nextSibling);

      for (const v of extraVariants) {
        wrapper.appendChild(rows[v]);
      }

      // Add a tiny "[+ Show variants]" toggle to the header label
      const label = headerRow.querySelector("label");
      if (!label) continue;

      const toggle = document.createElement("a");
      toggle.classList.add("dg-weaponsfx-toggle");
      toggle.textContent = "[+ Show variants]";
      let open = false;

      toggle.addEventListener("click", (ev) => {
        ev.preventDefault();
        open = !open;
        wrapper.style.display = open ? "" : "none";
        toggle.textContent = open
          ? "[-] Hide variants"
          : "[+ Show variants]";
      });

      label.appendChild(toggle);
    }
  }
// ---------------------------------------------------------------------------
  // SOUND RESOLUTION + SUPPRESSOR LOGIC
  // ---------------------------------------------------------------------------

  static play({ actor = null, weapon = null, mode = "semi" } = {}) {
    if (!weapon) return;

    try {
      const src = this._resolveSoundPath({ actor, weapon, mode });
      if (!src) return;

      const volume =
        game.settings?.get("deltagreen-custom-ui", "weaponVolume") ?? 0.8;

      AudioHelper.play(
        {
          src,
          volume,
          autoplay: true,
          loop: false
        },
        true
      );
    } catch (err) {
      console.error("Delta Green UI | WeaponSoundManager.play error:", err);
    }
  }

  static _resolveSoundPath({ actor, weapon, mode }) {
    const moduleId = "deltagreen-custom-ui";
    const name = weapon?.name || "";
    const groupKey = WEAPON_NAME_TO_GROUP_KEY[name];

    if (!groupKey) return null;

    const isFirearm = GROUP_KEY_IS_FIREARM[groupKey] === true;

    // ---------- NON-FIREARMS: single sound ----------
    if (!isFirearm) {
      const singleKey = `weaponSound_${groupKey}`;
      const singlePath = game.settings.get(moduleId, singleKey);
      if (singlePath && typeof singlePath === "string" && singlePath.trim().length) {
        return singlePath.trim();
      }

      // Backward compat: old *_semi setting
      const legacyKey = `weaponSound_${groupKey}_semi`;
      const legacyPath = game.settings.get(moduleId, legacyKey);
      if (legacyPath && typeof legacyPath === "string" && legacyPath.trim().length) {
        return legacyPath.trim();
      }

      return null;
    }

    // ---------- FIREARMS: semi / auto + suppressed variants ----------
    const suppressed = this._isSuppressed(actor, weapon);

    let variant =
      mode === "auto"
        ? (suppressed ? "autoSupp" : "auto")
        : (suppressed ? "semiSupp" : "semi");

    const mkKey = (suffix) => `weaponSound_${groupKey}_${suffix}`;
    const candidates = [variant];

    if (variant === "autoSupp") {
      candidates.push("auto", "semiSupp", "semi");
    } else if (variant === "auto") {
      candidates.push("semi");
    } else if (variant === "semiSupp") {
      candidates.push("semi");
    }

    for (const suf of candidates) {
      const path = game.settings.get(moduleId, mkKey(suf));
      if (path && typeof path === "string" && path.trim().length) {
        return path.trim();
      }
    }

    return null;
  }

  static isFirearmWeapon(weapon) {
    if (!weapon) return false;
    const name = weapon.name || "";
    const groupKey = WEAPON_NAME_TO_GROUP_KEY[name];
    if (!groupKey) return false;
    return GROUP_KEY_IS_FIREARM[groupKey] === true;
  }

  static _isSuppressed(actor, weapon) {
    const wSys = weapon?.system || weapon?.data?.data || {};
    const wName = (weapon?.name || "").toLowerCase();

    if (wSys.suppressed === true || wSys.silenced === true) return true;

    if (
      wName.includes("suppressor") ||
      wName.includes("silencer") ||
      wName.includes("sound suppressor")
    ) {
      return true;
    }

    if (!actor) return false;

    const items = actor.items?.contents ?? actor.items ?? [];

    for (const item of items) {
      const nm = (item.name || "").toLowerCase();
      const sys = item.system || item.data?.data || {};

      const nameLooksLikeSuppressor =
        nm.includes("suppressor") ||
        nm.includes("silencer") ||
        nm.includes("sound suppressor");

      if (!nameLooksLikeSuppressor) continue;

      const hasEquipFlag =
        Object.prototype.hasOwnProperty.call(sys, "equipped") ||
        Object.prototype.hasOwnProperty.call(sys, "equip") ||
        Object.prototype.hasOwnProperty.call(sys, "carried") ||
        Object.prototype.hasOwnProperty.call(sys, "isEquipped");

      if (!hasEquipFlag) return true;

      const equipped =
        sys.equipped === true ||
        sys.equip === true ||
        sys.carried === true ||
        sys.isEquipped === true;

      if (equipped) return true;
    }

    return false;
  }
}
