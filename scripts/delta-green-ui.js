/**
 * Delta Green Player UI
 * Module for Foundry VTT creating a CRT-style user interface
 * tweaked from the work of Zéphyr-JDR by Dr. Perky
 */

// Module imports
import { UIComponents } from "./ui-components.js";
import { RecordsManager } from "./records-manager.js";
import { MailSystem } from "./mail-system.js";
import { JournalManager } from "./journal-manager.js";
import { RollsManager } from "./rolls-manager.js";
import { InventoryManager } from "./inventory-manager.js";
import { PsycheManager } from "./psyche-manager.js";
import { ColorThemeManager } from "./color-theme-manager.js";
import { BankingManager } from "./banking-manager.js";
import { CombatManager } from "./combat-manager.js";
import { HealthManager } from "./health-manager.js";
import { WeaponSoundManager } from "./sound-manager.js";
import { TimeManager } from "./time-manager.js";

// Use the namespaced Handlebars helpers (avoids global deprecation warnings)
const { renderTemplate, loadTemplates } = foundry.applications.handlebars;

// ---------------------------------------------------------------------------
// Shared font list so settings UI + CRT dropdown stay in sync
// ---------------------------------------------------------------------------
const DG_FONT_CHOICES = [
  { key: "DG Cordata PPC-400",    label: "Module Default (Cordata PPC-400)" },
  { key: "DG IBM VGA 9x16-2x",     label: "IBM VGA 9x16-2x" },
  { key: "DG Rainbow100 re 66",    label: "Rainbow100 re 66" },
  { key: "DG Rainbow100 re 132",   label: "Rainbow100 re 132" },
  { key: "DG Tandy1K-II 200L",     label: "Tandy1K-II 200L" },
  { key: "DG Tandy1K-II 200L-2x",  label: "Tandy1K-II 200L-2x" },
  { key: "DG Tandy1K-II 200L-2y",  label: "Tandy1K-II 200L-2y" },

  { key: "DG ToshibaSat 8x8",      label: "ToshibaSat 8x8" },
  { key: "DG ToshibaSat 8x14",     label: "ToshibaSat 8x14" },
  { key: "DG ToshibaSat 8x16",     label: "ToshibaSat 8x16" },
  { key: "DG ToshibaSat 9x8",      label: "ToshibaSat 9x8" },
  { key: "DG ToshibaSat 9x14",     label: "ToshibaSat 9x14" },
  { key: "DG ToshibaSat 9x16",     label: "ToshibaSat 9x16" },
  { key: "DG ToshibaTxL1 8x16",    label: "ToshibaTxL1 8x16" },
  { key: "DG ToshibaTxL2 8x16",    label: "ToshibaTxL2 8x16" },

  { key: "DG Acer VGA 8x8",        label: "Acer VGA 8x8" },
  { key: "DG Acer VGA 8x8-2y",     label: "Acer VGA 8x8-2y" },
  { key: "DG Acer VGA 9x8",        label: "Acer VGA 9x8" },
  { key: "DG Acer710 CGA",         label: "Acer710 CGA" },
  { key: "DG Acer710 CGA-2y",      label: "Acer710 CGA-2y" },
  { key: "DG Acer710 Mono",        label: "Acer710 Mono" },

  { key: "DG ACM VGA 8x8",         label: "ACM VGA 8x8" },
  { key: "DG ACM VGA 8x14",        label: "ACM VGA 8x14" },
  { key: "DG ACM VGA 8x16",        label: "ACM VGA 8x16" },
  { key: "DG ACM VGA 9x8",         label: "ACM VGA 9x8" },
  { key: "DG ACM VGA 9x14",        label: "ACM VGA 9x14" },
  { key: "DG ACM VGA 9x16",        label: "ACM VGA 9x16" },

  { key: "DG AMI EGA 8x8",         label: "AMI EGA 8x8" },
  { key: "DG AMI EGA 8x8-2y",      label: "AMI EGA 8x8-2y" },
  { key: "DG AMI EGA 8x14",        label: "AMI EGA 8x14" },
  { key: "DG AMI EGA 9x14",        label: "AMI EGA 9x14" },

  { key: "DG Amstrad PC",          label: "Amstrad PC" },
  { key: "DG Amstrad PC-2y",       label: "Amstrad PC-2y" },

  { key: "DG Apricot 200L",        label: "Apricot 200L" },
  { key: "DG Apricot 200L-2y",     label: "Apricot 200L-2y" },
  { key: "DG Apricot Mono",        label: "Apricot Mono" },
  { key: "DG ApricotPortable",     label: "ApricotPortable" },
  { key: "DG ApricotXenC",         label: "ApricotXenC" },

  { key: "DG ATI 8x8",             label: "ATI 8x8" },
  { key: "DG ATI 8x8-2y",          label: "ATI 8x8-2y" },
  { key: "DG ATI 8x14",            label: "ATI 8x14" },
  { key: "DG ATI 8x16",            label: "ATI 8x16" },
  { key: "DG ATI 9x8",             label: "ATI 9x8" },
  { key: "DG ATI 9x14",            label: "ATI 9x14" },
  { key: "DG ATI 9x16",            label: "ATI 9x16" },
  { key: "DG ATI SmallW 6x8",      label: "ATI SmallW 6x8" },

  { key: "DG ATT PC6300",          label: "ATT PC6300" },
  { key: "DG ATT PC6300-2x",       label: "ATT PC6300-2x" },

  { key: "DG CL EagleII 8x16",     label: "CL EagleII 8x16" },
  { key: "DG CL EagleII 9x16",     label: "CL EagleII 9x16" },
  { key: "DG CL EagleIII 8x16",    label: "CL EagleIII 8x16" },
  { key: "DG CL EagleIII 9x16",    label: "CL EagleIII 9x16" },

  { key: "DG CompaqThin 8x8",      label: "CompaqThin 8x8" },
  { key: "DG CompaqThin 8x14",     label: "CompaqThin 8x14" },
  { key: "DG CompaqThin 8x16",     label: "CompaqThin 8x16" },

  { key: "DG Compis",              label: "Compis" },
  { key: "DG Copam BIOS",          label: "Copam BIOS" },
  { key: "DG Copam BIOS-2y",       label: "Copam BIOS-2y" },
  { key: "DG Cordata PPC-21",      label: "Cordata PPC-21" },
  { key: "DG Cordata PPC-400",     label: "Cordata PPC-400" },

  { key: "DG DG One",              label: "DG One" },
  { key: "DG DG One bold",         label: "DG One bold" },
  { key: "DG DG One-2y",           label: "DG One-2y" },
  { key: "DG DG One-2y bold",      label: "DG One-2y bold" },

  { key: "DG DTK BIOS",            label: "DTK BIOS" },
  { key: "DG DTK BIOS-2y",         label: "DTK BIOS-2y" }
];

// ---------------------------------------------------------------------------
// Merge DG CRT fonts + Foundry's CONFIG.fontDefinitions into one choice list
// ---------------------------------------------------------------------------
function buildCrtFontChoices() {
  const choices = {
    "": "Module Default (DG One / Cordata)"
  };

  // 1) DG-specific CRT bitmap fonts
  for (const font of DG_FONT_CHOICES) {
    choices[font.key] = `${font.label} (DG)`;
  }

  // 2) Foundry-wide font definitions (system + other modules)
  try {
    const defs = CONFIG?.fontDefinitions || {};
    for (const [key, def] of Object.entries(defs)) {
      if (!key) continue;
      // Don't overwrite DG entries if names collide
      if (choices[key]) continue;

      let label = key;

      if (def) {
        // Prefer a string .label if present
        if (typeof def.label === "string" && def.label.trim()) {
          label = def.label.trim();
        }
        // Fallback: string .editor, but only if it's actually a string, not boolean
        else if (typeof def.editor === "string" && def.editor.trim()) {
          label = def.editor.trim();
        }
        // Fallback: first font's family name
        else if (Array.isArray(def.fonts) && def.fonts.length > 0) {
          const fam = def.fonts[0]?.family;
          if (typeof fam === "string" && fam.trim()) {
            label = fam.trim();
          }
        }
      }

      choices[key] = `${label} (System)`;
    }
  } catch (err) {
    console.warn("Delta Green UI | Error reading CONFIG.fontDefinitions for CRT fonts:", err);
  }

  return choices;
}

/* ----------------------------------------------------------------------------
 * Seed a default typed skill on brand-new agent/npc actors (not imports)
 * ------------------------------------------------------------------------- */
Hooks.on("preCreateActor", (actor, creationData, options, userId) => {
  if (creationData?.system) return; // duplicated/imported, don't override
  const type = creationData?.type ?? actor?.type;
  if (!["agent", "npc"].includes(type)) return;

  actor.updateSource({
    "system.typedSkills.tskill_01": {
      label: game.i18n.localize("DG.TypeSkills.Subskills.Painting"),
      group: game.i18n.localize("DG.TypeSkills.Art"),
      proficiency: 0,
      failure: false
    }
  });
});

/* ----------------------------------------------------------------------------
 * Main module class
 * ------------------------------------------------------------------------- */
export class DeltaGreenUI {
  static ID = "deltagreen-custom-ui";
  static refreshIntervalId = null;
  static isLoadingEntries = false;
  static lastSuccessfulLoad = 0;
  static consecutiveErrors = 0;
  static currentView = null; // track which dropdown view is open

  // z-index for the CRT bar; popups will be forced ABOVE this
  static zIndex = 30;
  static timeHudInterval = null;
  // Available base themes in rotation order
  static THEMES = ["amber", "green", "blue", "purple", "red", "white"];

  /* ----------------------------------------------------------------------- */
  /*  ACTOR HELPERS                                                          */
  /* ----------------------------------------------------------------------- */

  // -------------------------- TOKEN COMPASS -------------------------- //

  static _injectTokenCompass() {
    if (document.getElementById("dg-token-compass")) return;

    const wrap = document.createElement("div");
    wrap.id = "dg-token-compass";
    wrap.innerHTML = `
      <div class="dg-compass-grid">
        <button class="dg-compass-btn dg-compass-nw" data-dx="-1" data-dy="-1">↖</button>
        <button class="dg-compass-btn dg-compass-n"  data-dx="0"  data-dy="-1">↑</button>
        <button class="dg-compass-btn dg-compass-ne" data-dx="1"  data-dy="-1">↗</button>
        <button class="dg-compass-btn dg-compass-w"  data-dx="-1" data-dy="0">←</button>
        <button class="dg-compass-btn dg-compass-c"  disabled>·</button>
        <button class="dg-compass-btn dg-compass-e"  data-dx="1"  data-dy="0">→</button>
        <button class="dg-compass-btn dg-compass-sw" data-dx="-1" data-dy="1">↙</button>
        <button class="dg-compass-btn dg-compass-s"  data-dx="0"  data-dy="1">↓</button>
        <button class="dg-compass-btn dg-compass-se" data-dx="1"  data-dy="1">↘</button>
      </div>
    `;
    document.body.appendChild(wrap);
    DeltaGreenUI.applyLayoutSettings?.();

    // Wire click -> move token one grid cell
    $(document)
      .off("click.dgCompass", "#dg-token-compass .dg-compass-btn")
      .on("click.dgCompass", "#dg-token-compass .dg-compass-btn", async (ev) => {
        const btn = ev.currentTarget;
        if (btn.classList.contains("dg-compass-c")) return;
        const dx = Number(btn.dataset.dx || 0);
        const dy = Number(btn.dataset.dy || 0);
        await DeltaGreenUI._nudgeControlledToken(dx, dy);
      });
  }

  static async _nudgeControlledToken(dx, dy) {
    try {
      if (!canvas?.ready) return;
      const controlled = canvas.tokens.controlled;
      if (!controlled?.length) {
        ui.notifications.warn("Select a token to move.");
        return;
      }

      const token = controlled[0];
      const gridSize = canvas.grid?.size || 100;

      const newX = token.document.x + dx * gridSize;
      const newY = token.document.y + dy * gridSize;

      await token.document.update({ x: newX, y: newY });
    } catch (err) {
      console.error("Delta Green UI | Error moving token via compass:", err);
      ui.notifications.error("Error moving token.");
    }
  }

  // Current actor = controlled token (single) or user's assigned character
  static _getCurrentActor() {
    try {
      if (canvas && canvas.tokens && canvas.tokens.controlled?.length === 1) {
        return canvas.tokens.controlled[0].actor;
      }
    } catch (_e) {}
    return game.user?.character || null;
  }

  // Small helper: 3rd + 4th word of the name, with fallbacks
  static _getShortAgentName(actor) {
    if (!actor) return "NO AGENT SELECTED";
    const fullName = (actor.name || "UNKNOWN").trim();
    const parts = fullName.split(/\s+/).filter(Boolean);

    let shortName = "UNKNOWN";
    if (parts.length >= 4) {
      shortName = `${parts[2]} ${parts[3]}`; // 3rd + 4th
    } else if (parts.length === 3) {
      shortName = `${parts[1]} ${parts[2]}`; // 2nd + 3rd
    } else if (parts.length === 2) {
      shortName = `${parts[0]} ${parts[1]}`; // both
    } else if (parts.length === 1) {
      shortName = parts[0];
    }

    return shortName.toUpperCase();
  }

  // Format world clock as mm/dd/yy HH:MM:SS
  static _formatWorldClock(date) {
    if (!(date instanceof Date)) return "";

    const pad = (n) => String(n).padStart(2, "0");
    const dd = pad(date.getDate());
    const mm = pad(date.getMonth() + 1);
    const yy = String(date.getFullYear()).slice(-2);
    const hh = pad(date.getHours());
    const mi = pad(date.getMinutes());
    const ss = pad(date.getSeconds());

    return `${mm}/${dd}/${yy} ${hh}:${mi}:${ss}`;
  }

  // Map numeric track → vague descriptor + level
  static _statusDescriptor(kind, value, max) {
    if (value == null || max == null || max <= 0) {
      return { text: "UNKNOWN", level: "neutral" };
    }

    const ratio = value / max;
    let level;
    if (ratio >= 0.75) level = "good";
    else if (ratio >= 0.5) level = "warn";
    else level = "bad";

    const vocab =
      {
        hp: {
          good: "STABLE",
          warn: "HURT",
          bad: "CRITICAL"
        },
        wp: {
          good: "FOCUSED",
          warn: "STRAINED",
          bad: "SPENT"
        },
        san: {
          good: "GROUNDED",
          warn: "FRAYED",
          bad: "FRAGILE"
        }
      }[kind] || {
        good: "OK",
        warn: "LOW",
        bad: "CRITICAL"
      };

    return { text: vocab[level], level };
  }

  // Layout toggles: skillbar + token D-pad + mini roll feed
  static applyLayoutSettings() {
    try {
      const showSkillBar      = game.settings.get("deltagreen-custom-ui", "showSkillBar");
      const showTokenDpad     = game.settings.get("deltagreen-custom-ui", "showTokenDpad");
      const showMiniRollFeed  = game.settings.get("deltagreen-custom-ui", "showMiniRollFeed");

      const root = document.documentElement;

      root.classList.toggle("dg-hide-skillbar",      !showSkillBar);
      root.classList.toggle("dg-hide-token-dpad",    !showTokenDpad);
      root.classList.toggle("dg-hide-mini-rollfeed", !showMiniRollFeed);
    } catch (err) {
      console.error("Delta Green UI | applyLayoutSettings error", err);
    }
  }

  /* ----------------------------------------------------------------------- */
  /*  TOP-RIGHT STATUS BAR (NAME + HP/WP/SAN VAGUE TEXT + TIME HUD)          */
  /* ----------------------------------------------------------------------- */

  // HP / WP / SAN TOP BAR — HP/WP use same data lookup as MailSystem.refreshHpWpPanel,
  // SAN uses same ratio logic as MailSystem._refreshSanButtonStatus
  static updateTopStatusBar(actorArg = null) {
    const agentEl = document.getElementById("dg-status-agent");
    const hpEl    = document.getElementById("dg-status-hp");
    const wpEl    = document.getElementById("dg-status-wp");
    const sanEl   = document.getElementById("dg-status-san");
    const timeEl  = document.getElementById("dg-status-time");

    // If the status bar isn't in the DOM yet, bail quietly
    if (!agentEl && !hpEl && !wpEl && !sanEl && !timeEl) return;

    const current = actorArg || this._getCurrentActor();

    if (!current) {
      if (agentEl) agentEl.textContent = "AGENT: NONE";
      if (hpEl)    hpEl.textContent    = "HP: N/A";
      if (wpEl)    wpEl.textContent    = "WP: N/A";
      if (sanEl)   sanEl.textContent   = "SAN: N/A";
    } else {
      if (agentEl) {
        agentEl.textContent = `AGENT: ${this._getShortAgentName(current)}`;
      }
    }

    // ---- HP / WP: same property lookup as MailSystem.refreshHpWpPanel ----
    if (current) {
      const hpCurrent = Number(
        foundry.utils.getProperty(current, "system.hp.value") ??
        foundry.utils.getProperty(current, "system.health.value") ??
        0
      );
      const hpMax = Number(
        foundry.utils.getProperty(current, "system.hp.max") ??
        foundry.utils.getProperty(current, "system.health.max") ??
        foundry.utils.getProperty(current, "system.hp.value") ??
        0
      );

      const wpCurrent = Number(
        foundry.utils.getProperty(current, "system.wp.value") ?? 0
      );
      const wpMax = Number(
        foundry.utils.getProperty(current, "system.wp.max") ??
        foundry.utils.getProperty(current, "system.wp.value") ??
        0
      );

      const hpDesc = this._statusDescriptor("hp",  hpCurrent, hpMax);
      const wpDesc = this._statusDescriptor("wp",  wpCurrent, wpMax);

      // ---- SAN: same ratio logic as MailSystem._refreshSanButtonStatus ----
      let sanDesc;
      try {
        const sanCurrent = Number(
          foundry.utils.getProperty(current, "system.sanity.value") ?? 0
        );
        const sanMax = Number(
          foundry.utils.getProperty(current, "system.sanity.max") ?? 99
        );
        const breakingPoint = Number(
          foundry.utils.getProperty(
            current,
            "system.sanity.currentBreakingPoint"
          )
        );

        if (
          Number.isFinite(sanCurrent) &&
          Number.isFinite(breakingPoint) &&
          breakingPoint > 0
        ) {
          const ratio = sanCurrent / breakingPoint;
          let text;
          let level;

          if (ratio >= 1.5) {
            text = "GROUNDED";
            level = "good";
          } else if (ratio >= 1.1) {
            text = "STABLE";
            level = "good";
          } else if (ratio >= 0.8) {
            text = "FRAYED";
            level = "warn";
          } else if (ratio >= 0.5) {
            text = "UNRAVELLING";
            level = "warn";
          } else {
            text = "COMPROMISED";
            level = "bad";
          }

          sanDesc = { text, level };
        } else {
          // Fallback to generic descriptor if BP info is missing
          sanDesc = this._statusDescriptor("san", sanCurrent, sanMax);
        }
      } catch (e) {
        console.warn("Delta Green UI | SAN descriptor fallback:", e);
        // Fallback with whatever we can read
        const sanCurrent = Number(
          foundry.utils.getProperty(current, "system.sanity.value") ?? 0
        );
        const sanMax = Number(
          foundry.utils.getProperty(current, "system.sanity.max") ?? 99
        );
        sanDesc = this._statusDescriptor("san", sanCurrent, sanMax);
      }

      const apply = (el, label, desc) => {
        if (!el || !desc) return;
        el.textContent = `${label}: ${desc.text}`;
        el.classList.remove("dg-status-good", "dg-status-warn", "dg-status-bad");
        if (desc.level === "good") el.classList.add("dg-status-good");
        else if (desc.level === "warn") el.classList.add("dg-status-warn");
        else if (desc.level === "bad") el.classList.add("dg-status-bad");
      };

      apply(hpEl,  "HP",  hpDesc);
      apply(wpEl,  "WP",  wpDesc);
      apply(sanEl, "SAN", sanDesc);
    }

    // --- TIME HUD: controlled by GM settings -------------------------------
    try {
      if (timeEl) {
        const hudMode = game.settings.get(this.ID, "timeHudMode") || "operation";
        const timeTabEnabled = game.settings.get(this.ID, "enableTimeTab") !== false;

        // If TIME tab is disabled and HUD mode is "operation",
        // automatically fall back to local client time.
        const effectiveMode =
          !timeTabEnabled && hudMode === "operation" ? "local" : hudMode;

        if (effectiveMode === "hidden") {
          timeEl.textContent = "";
        } else if (effectiveMode === "local") {
          // Client local time
          timeEl.textContent = this._formatWorldClock(new Date());
        } else {
          // Operation time via TimeManager (fallback to local if missing)
          if (TimeManager?.getCurrentWorldDate) {
            const nowWorld = TimeManager.getCurrentWorldDate();
            timeEl.textContent = this._formatWorldClock(nowWorld);
          } else {
            timeEl.textContent = this._formatWorldClock(new Date());
          }
        }
      }
    } catch (err) {
      console.error("Delta Green UI | Error updating HUD time:", err);
      if (timeEl) timeEl.textContent = "";
    }
  }

  /* ----------------------------------------------------------------------- */
  /*  FLOATING BOTTOM HOTBAR (MAIL-SYSTEM SKILLS + WEAPONS)                  */
  /* ----------------------------------------------------------------------- */

  // This just creates DOM with .dg-mail-base-skillbar + #dg-weapon-hotbar.
  // MailSystem handles click logic + hiding based on actual skills.
  static buildBottomHotbar() {
    // Create once
    let wrapper = document.getElementById("dg-bottom-hotbar");
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = "dg-bottom-hotbar";
      wrapper.innerHTML = `
      <div id="dg-bottom-hotbar-inner">
        <!-- HEADER: collapse button -->
        <div id="dg-bottom-skillbar-header">
          <button id="dg-bottom-skill-toggle" class="dg-button dg-bottom-toggle">
            SKILLS ▲
          </button>
        </div>

        <!-- EVERYTHING THAT SHOULD COLLAPSE GOES IN HERE -->
        <div id="dg-bottom-skillbar">
          <!-- STAT / LUCK HOTBAR -->
          <div class="dg-mail-skillbar dg-mail-statbar">
            <button class="dg-button dg-stat-roll-btn" data-stat="str">STRENGTH</button>
            <button class="dg-button dg-stat-roll-btn" data-stat="con">CONSTITUTION</button>
            <button class="dg-button dg-stat-roll-btn" data-stat="dex">DEXTERITY</button>
            <button class="dg-button dg-stat-roll-btn" data-stat="int">INTELLIGENCE</button>
            <button class="dg-button dg-stat-roll-btn" data-stat="pow">POWER</button>
            <button class="dg-button dg-stat-roll-btn" data-stat="cha">CHARISMA</button>
            <button id="dg-luck-roll-btn" class="dg-button">LUCK</button>
          </div>

          <!-- BASE SKILL HOTBAR (buttons will hide if <10%) -->
          <div class="dg-mail-skillbar dg-mail-base-skillbar">
            <button class="dg-button dg-skill-roll-btn" data-skill="accounting">ACCOUNTING</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="alertness">ALERTNESS</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="anthropology">ANTHROPOLOGY</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="archeology">ARCHEOLOGY</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="artillery">ARTILLERY</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="athletics">ATHLETICS</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="bureaucracy">BUREAUCRACY</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="computer_science">COMPUTER SCIENCE</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="criminology">CRIMINOLOGY</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="demolitions">DEMOLITIONS</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="disguise">DISGUISE</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="dodge">DODGE</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="drive">DRIVE</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="firearms">FIREARMS</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="first_aid">FIRST AID</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="forensics">FORENSICS</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="heavy_machiner">HEAVY MACHINERY</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="heavy_weapons">HEAVY WEAPONS</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="history">HISTORY</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="humint">HUMINT</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="law">LAW</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="medicine">MEDICINE</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="melee_weapons">MELEE</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="navigate">NAVIGATE</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="occult">OCCULT</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="persuade">PERSUADE</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="pharmacy">PHARMACY</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="psychotherapy">PSYCHOTHERAPY</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="ride">RIDE</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="search">SEARCH</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="sigint">SIGINT</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="stealth">STEALTH</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="surgery">SURGERY</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="survival">SURVIVAL</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="swim">SWIM</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="unarmed_combat">UNARMED COMBAT</button>
            <button class="dg-button dg-skill-roll-btn" data-skill="unnatural">UNNATURAL</button>
            <!-- Typed-skill buttons get appended here -->
          </div>

          <!-- MODIFIER BAR -->
          <div class="dg-mail-skillbar dg-mail-modbar">
            <button class="dg-button dg-mod-btn" data-mod="-40">-40</button>
            <button class="dg-button dg-mod-btn" data-mod="-20">-20</button>
            <button class="dg-button dg-mod-btn" data-mod="-10">-10</button>
            <button class="dg-button dg-mod-btn" data-mod="0">0</button>
            <button class="dg-button dg-mod-btn" data-mod="10">+10</button>
            <button class="dg-button dg-mod-btn" data-mod="20">+20</button>
            <button class="dg-button dg-mod-btn" data-mod="40">+40</button>
          </div>
        </div>

        <!-- WEAPON HOTBAR (now tied to the same toggle) -->
        <div class="dg-mail-skillbar dg-mail-weaponbar">
          <div id="dg-weapon-hotbar"></div>
        </div>
      </div>
    `;
      document.body.appendChild(wrapper);
    }

    // (Re)bind toggle handler so it keeps working after re-render
    $(document)
      .off("click.dgBottomSkillToggle", "#dg-bottom-skill-toggle")
      .on("click.dgBottomSkillToggle", "#dg-bottom-skill-toggle", (ev) => {
        ev.preventDefault();
        const bar = document.getElementById("dg-bottom-skillbar");
        const weaponBar = document.querySelector(".dg-mail-weaponbar");
        const btn = ev.currentTarget;
        if (!bar || !btn) return;

        const isHidden =
          bar.style.display === "none" ||
          getComputedStyle(bar).display === "none";

        if (isHidden) {
          // Expand: show skills + weapons
          bar.style.display = "";
          if (weaponBar) weaponBar.style.display = "";
          btn.textContent = "SKILLS ▼"; // expanded
        } else {
          // Collapse: hide skills + weapons
          bar.style.display = "none";
          if (weaponBar) weaponBar.style.display = "none";
          btn.textContent = "SKILLS ▲"; // collapsed
        }
      });
  }

  static refreshBottomHotbar() {
    try {
      // Ensure it exists
      this.buildBottomHotbar();

      // Let MailSystem drive visibility + typed skills + weapons
      if (MailSystem && typeof MailSystem.refreshSkillHotbar === "function") {
        MailSystem.refreshSkillHotbar();
      }
      if (MailSystem && typeof MailSystem.refreshTypedSkillButtons === "function") {
        MailSystem.refreshTypedSkillButtons();
      }
      if (MailSystem && typeof MailSystem.refreshWeaponHotbar === "function") {
        MailSystem.refreshWeaponHotbar();
      }
    } catch (e) {
      console.error("Delta Green UI | Error refreshing bottom hotbar:", e);
    }
  }

  /**
   * Cycle to the next theme in THEMES and apply it.
   * Also updates the stored setting so the choice sticks.
   */
  static async cycleTheme() {
    try {
      const current = game.settings.get(this.ID, "theme") || "amber";
      const idx = this.THEMES.indexOf(current);
      const next =
        idx === -1
          ? this.THEMES[0]
          : this.THEMES[(idx + 1) % this.THEMES.length];

      await game.settings.set(this.ID, "theme", next);
      this.applyTheme(next);

      ui.notifications?.info?.(`CRT THEME: ${next.toUpperCase()}`);
    } catch (e) {
      console.error("Delta Green UI | Error cycling theme:", e);
      ui.notifications?.error?.("Error changing CRT theme.");
    }
  }

  /* ----------------------------------------------------------------------- */
  /*  MINI CHAT / ROLL FEED WINDOW (BOTTOM-LEFT)                             */
  /* ----------------------------------------------------------------------- */

  static _injectMiniChatWindow() {
    if (document.getElementById("dg-mini-chat")) return;

    const wrap = document.createElement("div");
    wrap.id = "dg-mini-chat";
    wrap.innerHTML = `
      <div id="dg-mini-chat-header">
        <span id="dg-mini-chat-title">ROLL FEED</span>
        <button id="dg-mini-chat-toggle" class="dg-button dg-mini-chat-toggle">
          ▾
        </button>
      </div>
      <div id="dg-mini-chat-body"></div>
    `;
    document.body.appendChild(wrap);
    DeltaGreenUI.applyLayoutSettings?.();

    // Toggle collapse/expand
    $(document)
      .off("click.dgMiniChatToggle", "#dg-mini-chat-toggle")
      .on("click.dgMiniChatToggle", "#dg-mini-chat-toggle", (ev) => {
        ev.preventDefault();
        const body = document.getElementById("dg-mini-chat-body");
        const btn = ev.currentTarget;
        if (!body || !btn) return;

        const isHidden =
          body.style.display === "none" ||
          getComputedStyle(body).display === "none";

        if (isHidden) {
          body.style.display = "";
          btn.textContent = "▾"; // expanded (arrow down)
        } else {
          body.style.display = "none";
          btn.textContent = "▴"; // collapsed (arrow up)
        }
      });
  }

  /**
   * Mini roll feed: mirror the RollsManager (same source as the ROLLS view).
   * Ignores arguments and just reads RollsManager.rolls.
   */
  static updateMiniChatWindow(_messages = null) {
    try {
      const body = document.getElementById("dg-mini-chat-body");
      if (!body) return;

      body.innerHTML = "";

      // Require RollsManager + some rolls
      if (!RollsManager || !Array.isArray(RollsManager.rolls) || !RollsManager.rolls.length) {
        body.innerHTML = `<div class="dg-mini-chat-entry dg-placeholder">NO ROLLS YET</div>`;
        return;
      }

      // Last few rolls only (keep it tight)
      const recent = RollsManager.rolls.slice(-6);

      for (const entryData of recent) {
        const entry = document.createElement("div");
        entry.className = "dg-mini-chat-entry";

        // Sender like ROLLS window
        const sender = document.createElement("div");
        sender.classList.add("dg-rolls-sender");
        sender.textContent = entryData.sender;
        entry.appendChild(sender);

        // Content is same HTML RollsManager uses (.dg-roll-result, etc.)
        const content = document.createElement("div");
        content.classList.add("dg-rolls-content");
        content.innerHTML = entryData.content || "";
        entry.appendChild(content);

        body.appendChild(entry);
      }

      body.scrollTop = body.scrollHeight;
    } catch (err) {
      console.error("Delta Green UI | Error updating mini chat window:", err);
    }
  }

  /* ------------------------------- Journals ------------------------------- */

  /**
   * Build a folder tree node (recursive) for journals.
   * Journals themselves are rendered as clickable items that route to JournalManager.openPageInCrt.
   */
  static _buildJournalFolderTree(folder, journals) {
    const childFolders = game.folders
      .filter(
        (f) =>
          (f.type === "JournalEntry" || f.type === "Journal") &&
          f.folder?.id === folder.id
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );

    const ownJournals = journals
      .filter((j) => j.folder?.id === folder.id)
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );

    return {
      folder,
      journals: ownJournals,
      children: childFolders.map((f) =>
        this._buildJournalFolderTree(f, journals)
      )
    };
  }

  static _journalNodeHasContent(node) {
    if (!node) return false;
    if (node.journals && node.journals.length > 0) return true;
    if (!node.children || !node.children.length) return false;
    return node.children.some((child) => this._journalNodeHasContent(child));
  }

  /**
   * Render a single folder node (and recurse into its children).
   * Clicking a journal entry calls JournalManager.openPageInCrt(journal.id).
   */
  static _renderJournalFolderNode(node, $container) {
    const $li = $(`
      <li class="dg-folder-node dg-journal-folder" data-folder-id="${node.folder.id}">
        <div class="dg-folder-header">
          <span class="dg-folder-toggle">[+]</span>
          <span class="dg-folder-name">${node.folder.name}</span>
        </div>
        <ul class="dg-folder-contents"></ul>
      </li>`);

    $container.append($li);
    const $contents = $li.children(".dg-folder-contents");

    // Start collapsed
    $contents.hide();

    // Add journals in this folder
    node.journals.forEach((journal) => {
      const $item = $(`
        <li class="dg-result-item dg-journal-entry" data-journal-id="${journal.id}">
          ${journal.name}
        </li>`);
      $item.on("click", () => {
        if (JournalManager?.openPageInCrt) {
          JournalManager.openPageInCrt(journal.id);
        } else if (journal.sheet) {
          journal.sheet.render(true);
        }
      });
      $contents.append($item);
    });

    // Recurse into child folders
    node.children.forEach((childNode) => {
      this._renderJournalFolderNode(childNode, $contents);
    });

    // Toggle behavior – also refresh dropdown height so the menu expands/shrinks correctly
    $li.children(".dg-folder-header").on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const $header = $(this);
      const $node = $header.closest("li.dg-folder-node");
      const $contents = $node.children(".dg-folder-contents");
      const $toggle = $header.find(".dg-folder-toggle");
      const isVisible = $contents.is(":visible");

      $contents.slideToggle(150, () => {
        DeltaGreenUI.refreshDropdownHeight($node[0]);
      });

      $toggle.text(isVisible ? "[+]" : "[-]");
    });
  }

  /* ------------------------------- Settings ------------------------------- */

  static init() {
    console.log("Delta Green UI | init");
    this.registerSettings();
    this.initHooks();
  }

  static registerSettings() {
    // --- GM: per-tab visibility for players --------------------------------
    game.settings.register(this.ID, "enableBankingTab", {
      name: "Enable Banking Tab for Players",
      hint: "If disabled, the BANK tab is hidden for non-GM users.",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
      restricted: true, // GM-only
      onChange: () => {
        if (game.ready) DeltaGreenUI.applyTabVisibility?.();
      }
    });

    game.settings.register(this.ID, "enableTimeTab", {
      name: "Enable Time Tab for Players",
      hint: "If disabled, the TIME tab is hidden for non-GM users.",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
      restricted: true,
      onChange: () => {
        if (game.ready) {
          DeltaGreenUI.applyTabVisibility?.();
          DeltaGreenUI.updateTopStatusBar?.();
        }
      }
    });

    // --- GM: HUD clock behavior --------------------------------------------
    game.settings.register(this.ID, "timeHudMode", {
      name: "HUD Clock Mode",
      hint: "Controls what the top-right clock shows.",
      scope: "world",
      config: true,
      type: String,
      default: "operation",
      choices: {
        operation: "Operation Time (Time Manager)",
        local: "Local Real Time",
        hidden: "Hidden (no clock)"
      },
      restricted: true,
      onChange: () => DeltaGreenUI.updateTopStatusBar?.()
    });

    game.settings.register("deltagreen-custom-ui", "showSkillBar", {
      name: "Show DG Skill Hotbar",
      hint: "Display the bottom DG skill hotbar overlay.",
      scope: "client",
      config: true,
      type: Boolean,
      default: true,
      onChange: () => {
        DeltaGreenUI.applyLayoutSettings?.();
      }
    });

    game.settings.register("deltagreen-custom-ui", "showTokenDpad", {
      name: "Show DG Token D-Pad",
      hint: "Display the DG token compass / D-pad controls.",
      scope: "client",
      config: true,
      type: Boolean,
      default: true,
      onChange: () => {
        DeltaGreenUI.applyLayoutSettings?.();
      }
    });

    game.settings.register("deltagreen-custom-ui", "showMiniRollFeed", {
      name: "Show DG Mini Roll Feed",
      hint: "Display the mini roll feed window in the bottom-left.",
      scope: "client",
      config: true,
      type: Boolean,
      default: true,
      onChange: () => {
        DeltaGreenUI.applyLayoutSettings?.();
      }
    });

    game.settings.register(this.ID, "scanlineIntensity", {
      name: "CRT Scanline Intensity",
      hint: "Controls opacity of the CRT scanline overlay (0 = off, 100 = very strong).",
      scope: "client",
      config: true,
      type: Number,
      default: 40, // ~0.40 opacity
      range: { min: 0, max: 100, step: 5 },
      onChange: (value) => {
        DeltaGreenUI.applyScanlineIntensity?.(value);
      }
    });

    // UPDATED: multi-color theme selector
    game.settings.register(this.ID, "theme", {
      name: "Interface Theme",
      hint: "Choose the base color theme for the CRT interface",
      scope: "client",
      config: true,
      type: String,
      default: "amber",
      choices: {
        amber: "Amber (Classic)",
        green: "Green (Matrix)",
        blue: "Blue (Cold CRT)",
        purple: "Purple (Violet CRT)",
        red: "Red (Alert)",
        white: "White (Monochrome)"
      },
      onChange: (value) => this.applyTheme(value)
    });

    game.settings.register(this.ID, "enableWebView", {
      name: "Enable Web View",
      hint: "Enable the WEB button to display web pages in the interface",
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
      onChange: (value) => this.toggleWebViewVisibility(value)
    });

    game.settings.register(this.ID, "webViewUrl", {
      name: "Web View URL",
      hint: "URL of the web page to display (e.g., https://miro.com/board/...)",
      scope: "world",
      config: true,
      type: String,
      default: "",
      onChange: (value) => this.updateWebViewUrl(value)
    });

    // Per-player color overrides
    ColorThemeManager.registerSettings();
    WeaponSoundManager.registerSettings();

    // CRT font choice per client (DG CRT fonts + any fonts registered in Foundry)
    const fontChoices = buildCrtFontChoices();

    game.settings.register(this.ID, "crtFont", {
      name: "CRT Font",
      hint: "Preferred CRT font for this client (DG CRT fonts + system fonts from Foundry)",
      scope: "client",
      config: true,
      type: String,
      choices: fontChoices,
      default: "",
      onChange: (value) => this.applyFont(value)
    });
  }

  /* ------------------------------- Hooks ---------------------------------- */

  static initHooks() {
    Hooks.on("ready", () => this.onReady());

    // Foundry V13+ uses renderChatMessageHTML (HTMLElement instead of jQuery)
    Hooks.on("renderChatMessageHTML", (message, html, data) => {
      const $html = html instanceof jQuery ? html : $(html);

      // If the CRT isn’t active, this hook does nothing
      if (!this.isInterfaceActive()) return;

      setTimeout(() => {
        MailSystem.renderChatMessage(message, $html, data);
        DeltaGreenUI.updateRollsLastResult?.(message, $html, data);
        DeltaGreenUI.updateMiniChatWindow(); // keep mini roll feed in sync with RollsManager
      }, 0);

      if (message.flavor && message.flavor.includes("Unregistered Activity")) {
        this.styleRollMessage($html);
      }
    });

    // Track "last viewed" time for actor sheets (for LAST ENTRIES ordering)
    Hooks.on("renderActorSheet", (sheet) => {
      const actor = sheet.actor;
      if (!actor) return;
      actor.setFlag(DeltaGreenUI.ID, "lastViewed", Date.now()).catch(() => {});
    });

    // Keep LAST ENTRIES in sync
    Hooks.on("createActor", () => {
      this.loadLastEntries();
      this._kickDeferredRefresh();
    });

    Hooks.on("updateActor", (actor) => {
      if (!this.isInterfaceActive()) return;

      this.loadLastEntries();
      this._kickDeferredRefresh();

      // Actor HUD updates (top bar + hotbar) go through MailSystem, debounced
      if (actor && MailSystem && typeof MailSystem._scheduleActorRefresh === "function") {
        MailSystem._scheduleActorRefresh(actor);
      }
    });

    Hooks.on("deleteActor", () => {
      this.loadLastEntries();
      this._kickDeferredRefresh();
    });

    // Changing controlled token should schedule a *single* debounced refresh
    Hooks.on("controlToken", (token, controlled) => {
      if (!this.isInterfaceActive()) return;
      if (!controlled || !token?.actor) return;

      if (MailSystem && typeof MailSystem._scheduleActorRefresh === "function") {
        MailSystem._scheduleActorRefresh(token.actor);
      } else {
        // Fallback if MailSystem is missing or old
        this.updateTopStatusBar();
        this.refreshBottomHotbar();
      }
    });
  }

  /* ------------------------------- Ready ---------------------------------- */

  static async onReady() {
    console.log("Delta Green UI | onReady");

    try {
      // 1) Theme + font immediately (safe)
      const theme = game.settings.get(this.ID, "theme");
      this.applyTheme(theme);

      const crtFont = game.settings.get(this.ID, "crtFont") || "";
      this.applyFont(crtFont);

      // 1b) Apply layout visibility (skillbar + D-pad + mini roll feed)
      this.applyLayoutSettings();

      // 2) Ensure PC Records folder exists BEFORE anything can create actors
      await this.createPCRecordsFolder();

      // 3) Load all partial templates first (verifies they exist)
      await this.loadTemplates();

      // 4) Render main interface into DOM so subsequent UI init has elements
      const rendered = await this.renderInterface();
      if (!rendered) return;

      // 5) Ensure popups (journals, items, etc.) always sit above the CRT
      this.enforcePopupZIndex();

      // Scanline intensity
      const scanIntensity = game.settings.get(this.ID, "scanlineIntensity");
      this.applyScanlineIntensity(scanIntensity);

      // 6) Now that DOM exists, init feature modules
      UIComponents.init();
      RecordsManager.init();
      MailSystem.init();
      JournalManager.init();
      InventoryManager.init();
      PsycheManager.init();
      BankingManager.init();
      CombatManager.init();
      HealthManager.init();
      TimeManager.init?.();
      // NOTE: RollsManager.init() is NOT called here; it self-inits on "ready"

      // 7) CRT is always available
      setTimeout(() => {
        if ($("#dg-crt-container").length) {
          $("#dg-crt-container").show();
          game.user.setFlag(this.ID, "interfaceActive", true);

          // NEW: mark that CRT overlay is visible for everyone
          $("body").addClass("dg-crt-on");

          // Players: hide core UI, add overlay class
          if (!game.user.isGM) {
            $("body").addClass("dg-crt-active");
            this.hideFoundryCoreUi();
          } else {
            // GM: never hide core UI, never use dg-crt-active
            $("body").removeClass("dg-crt-active");
          }

          this.updateTopStatusBar();
          this.refreshBottomHotbar();
          this.loadLastEntries();
          this.moveDiceTrayToMail();
          this._injectTokenCompass();
          this._injectMiniChatWindow();
          this.updateMiniChatWindow(); // draw mini roll feed once UI is live

          if (!DeltaGreenUI.timeHudInterval) {
            DeltaGreenUI.timeHudInterval = setInterval(() => {
              if (!DeltaGreenUI.isInterfaceActive()) return;
              DeltaGreenUI.updateTopStatusBar();
            }, 1000);
          }
        } else {
          console.error("Delta Green UI | Container not found after render");
          ui.notifications.error("Error activating Delta Green UI interface");
        }
      }, 400);
    } catch (error) {
      console.error("Delta Green UI | Error in onReady:", error);
      ui.notifications.error("Error initializing Delta Green UI");
    }
  }

  /* --------------------------- Web View toggles --------------------------- */

  static toggleWebViewVisibility(enabled) {
    const $webButton = $("#dg-web-button");
    if ($webButton.length) enabled ? $webButton.show() : $webButton.hide();
  }

  static updateWebViewUrl(url) {
    if (!this.validateWebUrl(url)) return;
    const $inlineFrame = $("#dg-web-frame-inline");
    if ($inlineFrame.length) $inlineFrame.attr("src", url);
    const $windowFrame = $("#dg-web-frame");
    if ($windowFrame.length) $windowFrame.attr("src", url);
  }

  static validateWebUrl(url) {
    if (!url || typeof url !== "string") return false;
    try {
      new URL(url);
      return url.startsWith("http://") || url.startsWith("https://");
    } catch (_) {
      return false;
    }
  }

  /**
   * Hide certain tabs/views for non-GM users based on GM settings.
   * GM always sees all tabs.
   */
/**
 * Hide Banking / Time tabs for everyone when disabled.
 * GM still controls the setting, but the visibility applies to GM and players.
 */
/**
 * Hide Banking / Time tabs when disabled.
 * Visibility rules apply equally to GM and players.
 */
static applyTabVisibility() {
  try {
    const bankingEnabled = game.settings.get(this.ID, "enableBankingTab") !== false;
    const timeEnabled    = game.settings.get(this.ID, "enableTimeTab")    !== false;

    const $bankingMenu = $('.dg-menu-item[data-view="banking"]');
    const $bankingView = $('#dg-view-banking');

    const $timeMenu = $('.dg-menu-item[data-view="time"]');
    const $timeView = $('#dg-view-time');

    // ---------------- BANKING ----------------
    if (bankingEnabled) {
      // Show the menu item; let CSS + .active control the panel visibility
      $bankingMenu.show();
      // Clear any inline display override from previous .hide() calls
      $bankingView.css("display", "");
    } else {
      $bankingMenu.hide();
      // Hide the panel and make sure it can't be the active view
      $bankingView.hide().removeClass("active");
      if (this.currentView === "banking") {
        this.currentView = null;
      }
    }

    // ---------------- TIME -------------------
    if (timeEnabled) {
      $timeMenu.show();
      $timeView.css("display", "");
    } else {
      $timeMenu.hide();
      $timeView.hide().removeClass("active");
      if (this.currentView === "time") {
        this.currentView = null;
      }
    }

    // If whatever was open just got disabled, close the dropdown cleanly
    const $content = $("#dg-crt-content");
    if (!this.currentView && $content.hasClass("dg-open")) {
      $("#dg-crt-menu .dg-menu-item").removeClass("active");
      $(".dg-view").removeClass("active");
      $content
        .removeClass("dg-open")
        .slideUp(150, () => this.adjustDropdownHeight());
    } else {
      // Otherwise just re-measure in case visible content changed
      this.adjustDropdownHeight();
    }
  } catch (err) {
    console.error("Delta Green UI | applyTabVisibility error", err);
  }
}

  /* -------------------------------- Theme --------------------------------- */

  static applyTheme(theme) {
    const key = theme || "amber";

    // Maintain body classes for potential CSS hooks
    const themeClasses = [
      "dg-theme-amber",
      "dg-theme-green",
      "dg-theme-blue",
      "dg-theme-purple",
      "dg-theme-red",
      "dg-theme-white"
    ];

    const $body = $("body");
    $body.removeClass(themeClasses.join(" "));
    $body.addClass(`dg-theme-${key}`);

    // Delegate the actual CSS variable work to the ColorThemeManager
    ColorThemeManager.applyTheme(key);

    this.updateDynamicElements();
  }

static applyFont(fontKey) {
  try {
    const root = document.documentElement;
    if (!root) return;

    const key = (fontKey || "").trim();
    const container = document.getElementById("dg-crt-container");

    // Empty -> use CSS default (your DG fallback in CSS)
    if (!key) {
      root.style.removeProperty("--dg-crt-font-family");
      if (container) container.classList.remove("dg-crt-font-custom");
    } else {
      let family = key;

      // If this key exists in CONFIG.fontDefinitions, prefer its "family"
      try {
        const def = CONFIG?.fontDefinitions?.[key];
        if (def && Array.isArray(def.fonts) && def.fonts.length > 0) {
          const first = def.fonts[0];
          if (first?.family) {
            family = first.family;
          }
        }
      } catch (err) {
        console.warn(
          "Delta Green UI | Error resolving font family from CONFIG.fontDefinitions:",
          err
        );
      }

      // Final CSS stack: chosen family → system UI → monospace
      const cssVal = `'${family}', system-ui, monospace`;
      root.style.setProperty("--dg-crt-font-family", cssVal);
      if (container) container.classList.add("dg-crt-font-custom");
    }

    // Keep CRT dropdown in sync if it's present
    const select = document.getElementById("dg-font-select");
    if (select) select.value = key;
  } catch (e) {
    console.error("Delta Green UI | Error applying CRT font:", e);
  }
}

  static applyScanlineIntensity(value) {
    try {
      const v = Number(value);
      const clamped = Number.isNaN(v)
        ? 40
        : Math.max(0, Math.min(100, v));

      const opacity = clamped / 100;
      const root = document.documentElement;

      // Drive it via CSS variable so the overlay can use it
      root.style.setProperty("--dg-scanline-opacity", opacity.toString());

      // Convenience class for "completely off"
      if (clamped === 0) {
        document.body.classList.add("dg-scanlines-off");
      } else {
        document.body.classList.remove("dg-scanlines-off");
      }
    } catch (err) {
      console.error("Delta Green UI | Error applying scanline intensity:", err);
    }
  }

  static initFontDropdown() {
    const select = document.getElementById("dg-font-select");
    if (!select) return;

    // Current setting value
    const current = (game.settings.get(this.ID, "crtFont") || "").trim();

    // Clear whatever is there
    select.innerHTML = "";

    // Use the same choices as the module setting
    const choices = buildCrtFontChoices();
    for (const [key, label] of Object.entries(choices)) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = label;
      if (key === current) opt.selected = true;
      select.appendChild(opt);
    }

    // Make sure the CSS variable matches current selection
    this.applyFont(current);

    // Wire change → save setting + apply
    select.addEventListener("change", async (event) => {
      const key = event.target.value || "";
      try {
        await game.settings.set(this.ID, "crtFont", key);
        this.applyFont(key);
      } catch (err) {
        console.error("Delta Green UI | Error saving CRT font setting:", err);
        ui.notifications?.error?.("Error saving CRT font choice.");
      }
    });
  }

  static updateDynamicElements() {
    if (!this.isInterfaceActive()) return;
    // Keep dynamic elements (like last entries) in sync with theme/active state
    this.forceDisplayLastEntries();
    this.updateTopStatusBar();
    this.refreshBottomHotbar();
  }

  /* ------------------------------ Login Button ---------------------------- */

  // Login button fully removed; kept as an empty stub for backward safety.
  static addLoginButton() {
    // no-op
  }

  static openInterface() {
    const container = $("#dg-crt-container");
    if (!container.length) {
      this.renderInterface()
        .then(() => {
          $("#dg-crt-container").show();
          game.user.setFlag(this.ID, "interfaceActive", true);

          // CRT visible for everyone
          $("body").addClass("dg-crt-on");

          if (!game.user.isGM) {
            $("body").addClass("dg-crt-active");
            this.hideFoundryCoreUi();
          } else {
            $("body").removeClass("dg-crt-active");
          }

          this.moveDiceTrayToMail();
        })
        .catch((e) => {
          console.error("Delta Green UI | Error rendering interface:", e);
          ui.notifications.error("Error rendering Delta Green UI interface");
        });
      return;
    }

    if (!container.is(":visible")) {
      container.show();
      game.user.setFlag(this.ID, "interfaceActive", true);

      // CRT visible for everyone
      $("body").addClass("dg-crt-on");

      if (!game.user.isGM) {
        $("body").addClass("dg-crt-active");
        this.hideFoundryCoreUi();
      } else {
        $("body").removeClass("dg-crt-active");
      }

      this.moveDiceTrayToMail();
      this.updateTopStatusBar();
      this.refreshBottomHotbar();
      this._injectTokenCompass();
    }
  }

  /* --------------------------- RECENT JOURNAL ENTRIES --------------------- */

  static getRecentJournals(limit = 5) {
    const coll = game.journal?.contents ?? game.journal ?? [];
    const docs = Array.from(coll);

    const withTimestamps = docs
      .map((entry) => {
        const ts = Number(entry.getFlag(DeltaGreenUI.ID, "lastViewed") || 0);
        return { entry, ts };
      })
      .filter((row) => row.ts > 0);

    withTimestamps.sort((a, b) => b.ts - a.ts);
    return withTimestamps.slice(0, limit).map((row) => row.entry);
  }

  static loadLastJournals() {
    const container = document.getElementById("dg-last-journals-list");
    if (!container) return;

    container.innerHTML = "";

    const recent = this.getRecentJournals(5);

    if (!recent.length) {
      container.innerHTML =
        '<li class="dg-placeholder">NO RECENT JOURNAL ENTRIES</li>';
      return;
    }

    for (const entry of recent) {
      const li = document.createElement("li");
      li.classList.add("dg-result-item");
      li.dataset.journalId = entry.id;

      const title = entry.name || "Untitled Journal";
      li.textContent = title;

      li.addEventListener("click", (ev) => {
        ev.preventDefault();
        try {
          if (JournalManager?.openPageInCrt) {
            JournalManager.openPageInCrt(entry.id);
          } else if (entry.sheet) {
            entry.sheet.render(true);
          }
        } catch (err) {
          console.error(
            "Delta Green UI | Error opening journal from recent list",
            err
          );
        }
      });

      container.append(li);
    }
  }

  static forceDisplayLastJournals() {
    if (!this.isInterfaceActive()) return;
    const $list = $("#dg-last-journals-list");
    if (!$list.length) return;
    this.loadLastJournals();
  }

  /* -------------------- PC Records folder helpers ------------------------ */

  static _getPCRecordsFolder() {
    // Case-insensitive match on "PC Records"
    return game.folders.find((f) => {
      if (f.type !== "Actor") return false;
      const name = (f.name || "").trim().toLowerCase();
      return name === "pc records";
    });
  }

  static _getPCRecordsFolderIds() {
    const root = this._getPCRecordsFolder();
    if (!root) return new Set();

    const ids = new Set();
    const stack = [root];

    // Depth-first walk of all subfolders under PC Records
    while (stack.length) {
      const folder = stack.pop();
      if (!folder || ids.has(folder.id)) continue;
      ids.add(folder.id);
      const children = game.folders.filter(
        (f) => f.type === "Actor" && f.folder?.id === folder.id
      );
      stack.push(...children);
    }

    return ids;
  }

  /* ----------------------- Ensure PC Records Folder ----------------------- */

  static async createPCRecordsFolder() {
    let folder = this._getPCRecordsFolder();
    if (!folder) {
      folder = await Folder.create({
        name: "PC Records",
        type: "Actor",
        parent: null,
        color: "#33ff33"
      });
      console.log('Delta Green UI | "PC Records" folder created');
    }
    return folder;
  }

  /* ------------------------------ Toggle UI ------------------------------- */

  static toggleInterface() {
    const container = $("#dg-crt-container");
    if (!container.length) {
      this.renderInterface().then(() => {
        $("#dg-crt-container").show();
        game.user.setFlag(this.ID, "interfaceActive", true);

        // CRT visible for everyone
        $("body").addClass("dg-crt-on");

        if (!game.user.isGM) {
          $("body").addClass("dg-crt-active");
          this.hideFoundryCoreUi();
        } else {
          $("body").removeClass("dg-crt-active");
        }

        this.moveDiceTrayToMail();
      });
      return;
    }

    if (container.is(":visible")) {
      // Turn CRT overlay off
      DeltaGreenUI.moveDiceTrayBackToChat();
      container.hide();
      game.user.setFlag(this.ID, "interfaceActive", false);

      // CRT no longer visible
      $("body").removeClass("dg-crt-on");

      if (!game.user.isGM) {
        $("body").removeClass("dg-crt-active");
        this.showFoundryCoreUi();
      }

      if (this.refreshIntervalId) {
        clearInterval(this.refreshIntervalId);
        this.refreshIntervalId = null;
      }
    } else {
      // Turn CRT overlay on; Foundry UI stays as-is for GM, hidden for players
      container.show();
      game.user.setFlag(this.ID, "interfaceActive", true);
      MailSystem.resetMessages();
      this.forceDisplayLastEntries();
      this.moveDiceTrayToMail();

      // CRT visible for everyone
      $("body").addClass("dg-crt-on");

      if (!game.user.isGM) {
        $("body").addClass("dg-crt-active");
        this.hideFoundryCoreUi();
      } else {
        $("body").removeClass("dg-crt-active");
      }

      this.updateTopStatusBar();
      this.refreshBottomHotbar();
      this._injectTokenCompass();
    }
  }

  static isInterfaceActive() {
    return game.user.getFlag(this.ID, "interfaceActive") === true;
  }

  static isGameMaster() {
    return game.user.isGM;
  }

  /* ---------------------------- Render Interface -------------------------- */

  static async renderInterface() {
    try {
      const template = await renderTemplate(
        `modules/${this.ID}/templates/main-interface.html`,
        {
          userId: game.user.id,
          playerName: game.user.name
        }
      );

      if ($("#dg-crt-container").length) $("#dg-crt-container").remove();
      $("body").append(template);

      const isWebViewEnabled = game.settings.get(this.ID, "enableWebView");
      if (isWebViewEnabled) $("#dg-web-button").show();
      else $("#dg-web-button").hide();

      // Inject subviews
      const paths = [
        ["#dg-view-records",   `modules/${this.ID}/templates/records-view.html`],
        ["#dg-view-mail",      `modules/${this.ID}/templates/mail-view.html`],
        ["#dg-view-journal",   `modules/${this.ID}/templates/journal-view.html`],
        ["#dg-view-scene",     `modules/${this.ID}/templates/scene-view.html`],
        ["#dg-view-web",       `modules/${this.ID}/templates/web-view.html`],
        ["#dg-view-inventory", `modules/${this.ID}/templates/inventory-view.html`],
        ["#dg-view-rolls",     `modules/${this.ID}/templates/rolls-view.html`],
        ["#dg-view-psyche",    `modules/${this.ID}/templates/psyche-view.html`],
        ["#dg-view-banking",   `modules/${this.ID}/templates/banking-view.html`],
        ["#dg-view-sound",     `modules/${this.ID}/templates/sound-view.html`],
        ["#dg-view-combat",    `modules/${this.ID}/templates/combat-view.html`],
        ["#dg-view-time",      `modules/${this.ID}/templates/time-view.html`]
      ];

      for (const [sel, url] of paths) {
        try {
          const resp = await fetch(url);
          if (resp.ok) {
            const html = await resp.text();
            $(sel).html(html);
          }
        } catch (e) {
          console.error("DG UI | Template inject error:", url, e);
        }
      }

      // Detached window template (for WEB view overlay)
      try {
        const ww = await fetch(
          `modules/${this.ID}/templates/web-window.html`
        );
        if (ww.ok) {
          $("body").append(await ww.text());
          this.initWebWindowEvents();
        }
      } catch (e) {
        console.error("DG UI | Web window inject error:", e);
      }

      if (!$("#dg-crt-container").length) {
        ui.notifications.error("Error creating Delta Green UI interface");
        return false;
      }

      const theme = game.settings.get(this.ID, "theme");
      const crtFont = game.settings.get(this.ID, "crtFont") || "";

      // Top-docked program bar: full width, auto height
      $("#dg-crt-container").css({
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        height: "auto",
        margin: 0,
        padding: 0,
        zIndex: this.zIndex
      });

      // Dropdown starts closed & collapsed
      $("#dg-crt-content")
        .hide()
        .removeClass("dg-open")
        .css({ height: "0px" });
      $(".dg-view").removeClass("active");
      this.currentView = null;

      this.applyTheme(theme);
      $("#dg-crt-container").hide();
      this.applyFont(crtFont);

      this.initInterfaceEvents();
      this.initFontDropdown();
      this.applyTabVisibility();
      this.updateAgentName();
      this.forceDisplayLastEntries();
      this.loadLastEntries();
      this.loadPlayersList();
      this.loadSceneInfo();
      this.updateTopStatusBar();

      // Build floating bottom hotbar & populate once
      this.buildBottomHotbar();
      this.refreshBottomHotbar();
      this._injectMiniChatWindow();
      this.updateMiniChatWindow(); // draw mini roll feed after templates load
      this.injectAudioControls();
      // Journal recent list – safe to call; no-ops if element missing
      this.loadLastJournals();

      if (TimeManager && typeof TimeManager.refresh === "function") {
        TimeManager.refresh();
      }

      setTimeout(() => this.forceDisplayLastEntries(), 1000);

      // CUSTOM HOOK so MailSystem & others know the UI DOM is ready
      Hooks.callAll("renderDeltaGreenUI");

      if (game.user.getFlag(this.ID, "interfaceActive") === true) {
        setTimeout(() => this.openInterface(), 500);
      }

      return true;
    } catch (error) {
      console.error("Delta Green UI | Error rendering interface:", error);
      ui.notifications.error("Error rendering Delta Green UI interface");
      return false;
    }
  }

  /* ------------------------- Interface Event Wiring ----------------------- */

  static initInterfaceEvents() {
    // MAIN MENU CLICK HANDLER
    $("#dg-crt-menu").on("click", ".dg-menu-item", function () {
      const view = $(this).data("view");

      // Tell the HealthManager which view is active so it can hide/show itself
      if (HealthManager && typeof HealthManager.showForView === "function") {
        HealthManager.showForView(view);
      }

      // --- special buttons that don't use the dropdown panel ---
      if (view === "settings") {
        game.settings.sheet.render(true);
        return;
      }

      if (view === "web") {
        // WEB is a floating window, not a dropdown view
        DeltaGreenUI.toggleWebWindow();
        return;
      }

      if (view === "health") {
        // Make sure the health panel refreshes when opened
        if (HealthManager && typeof HealthManager.refresh === "function") {
          HealthManager.refresh();
        }
      }

      // TIME view – ensure layout exists + state is in sync
      if (view === "time") {
        if (TimeManager && typeof TimeManager.refresh === "function") {
          TimeManager.refresh();
        }
      }

      // --- views that live inside the dropdown panel ---
      const $content = $("#dg-crt-content");
      const $this = $(this);

      const isSameView =
        DeltaGreenUI.currentView === view && $content.is(":visible");

      // Clicking the same menu item again closes the dropdown
      if (isSameView) {
        DeltaGreenUI.currentView = null;
        $(".dg-menu-item").removeClass("active");
        $(".dg-view").removeClass("active");

        $content
          .removeClass("dg-open")
          .slideUp(150, () => DeltaGreenUI.adjustDropdownHeight());
        return;
      }

      // Switch to new view
      DeltaGreenUI.currentView = view;

      $(".dg-menu-item").removeClass("active");
      $this.addClass("active");

      $(".dg-view").removeClass("active");

      const $viewEl = $(`#dg-view-${view}`);
      if ($viewEl.length) $viewEl.addClass("active");

      // Open dropdown if needed
      if (!$content.is(":visible")) {
        $content
          .addClass("dg-open")
          .slideDown(150, () => DeltaGreenUI.adjustDropdownHeight());
      } else {
        DeltaGreenUI.adjustDropdownHeight();
      }

      // View-specific loading
      if (view === "records")   RecordsManager.loadRecords();
      if (view === "mail")      MailSystem.loadMessages();
      if (view === "journal") {
        DeltaGreenUI.loadJournals();
        DeltaGreenUI.loadLastJournals();
      }
      if (view === "access")    DeltaGreenUI.loadPlayersList();
      if (view === "system") {
        DeltaGreenUI.forceDisplayLastEntries();
        DeltaGreenUI.loadLastJournals();
      }
      if (view === "rolls")     DeltaGreenUI.loadRollsView();
      if (view === "scene")     DeltaGreenUI.loadSceneFeed();
      if (view === "inventory") InventoryManager.refresh();
      if (view === "psyche")    PsycheManager.refresh();
      if (view === "banking")   BankingManager.refresh();
      if (view === "time")      TimeManager.refresh?.();

      // Let layout settle then re-adjust height to content
      setTimeout(() => DeltaGreenUI.adjustDropdownHeight(), 100);
    });

    // OPEN AGENT SHEET
    $("#dg-view-agent-sheet").on("click", () => {
      const actor = game.user.character;
      if (actor) actor.sheet.render(true);
      else ui.notifications.warn(game.i18n.localize("DGUI.NoCharacterAssigned"));
    });

    // QUICK RECORDS SEARCH BUTTON
    $("#dg-search-records-btn").on("click", () => {
      $('.dg-menu-item[data-view="records"]').trigger("click");
    });

    // THEME CYCLE BUTTON
    $(document).on("click", "#dg-theme-cycle-btn", (ev) => {
      ev.preventDefault();
      DeltaGreenUI.cycleTheme();
    });

    // HEALTH PANEL CLOSE BUTTON (safe to leave even if unused)
    $(document)
      .off("click.dgHealthClose", "#dg-view-health .dg-panel-close[data-action='close']")
      .on("click.dgHealthClose", "#dg-view-health .dg-panel-close[data-action='close']", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        const $active = $(".dg-menu-item.active");
        if ($active.length) {
          $active.trigger("click");
        } else {
          DeltaGreenUI.currentView = null;
          $(".dg-view").removeClass("active");
          const $content = $("#dg-crt-content");
          $content
            .removeClass("dg-open")
            .slideUp(150, () => DeltaGreenUI.adjustDropdownHeight());
        }
      });
  }

  /* ------------------------- Dropdown height helper ---------------------- */

  static adjustDropdownHeight() {
    const el = document.getElementById("dg-crt-content");
    if (!el) return;

    if (el.classList.contains("dg-open")) {
      el.style.height = "";
    } else {
      el.style.height = "0px";
    }
  }

  static refreshDropdownHeight(targetEl = null) {
    this.adjustDropdownHeight();

    if (!targetEl) return;

    const content = document.getElementById("dg-crt-content");
    if (!content) return;

    try {
      const contentRect = content.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      const isBelow = targetRect.bottom > contentRect.bottom;
      const isAbove = targetRect.top < contentRect.top;

      if (isBelow || isAbove) {
        targetEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    } catch (_) {
      // ignore scroll errors
    }
  }

  /* ---------------------------- Quick Indicators -------------------------- */

  static updateAgentName() {
    const actor = game.user.character;
    $("#dg-current-agent-name").text(
      actor ? actor.name : "NO AGENT ASSIGNED"
    );
  }

  static forceDisplayLastEntries() {
    if (!this.isInterfaceActive()) return;
    const $list = $("#dg-last-entries-list");
    if (!$list.length) return;

    $list.css({ padding: "10px" });
    if ($list.children().length === 0) this.loadLastEntries();
  }

  static loadPlayersList() {
    const $list = $("#dg-players-list");
    if (!$list.length) {
      UIComponents.updatePlayersList();
      return;
    }

    $list.empty();
    const players = game.users.filter((u) => u.active && !u.isGM);
    if (players.length) {
      players.forEach((player) => {
        const characterName = player.character
          ? player.character.name
          : "NO AGENT ASSIGNED";
        $list.append(
          `<li class="dg-result-item" data-user-id="${player.id}">${player.name} - ${characterName}</li>`
        );
      });
    } else {
      $list.append(
        '<li class="dg-result-item dg-no-entries">No active players found</li>'
      );
    }
  }

  static toggleToActiveScene() {
    try {
      const activeScene = game.scenes.active;
      if (!activeScene) {
        ui.notifications.error("Aucune scène active trouvée");
        return;
      }
      // Hide CRT and show scene
      $("#dg-crt-container").hide();
      DeltaGreenUI.moveDiceTrayBackToChat();
      game.user.setFlag(this.ID, "interfaceActive", false);

      if (!game.user.isGM) {
        $("body").removeClass("dg-crt-active");
        $("body").removeClass("dg-crt-on");
        this.showFoundryCoreUi();
      } else {
        $("body").removeClass("dg-crt-on");
      }

      activeScene.view();
    } catch (error) {
      console.error(
        "Delta Green UI | Error toggling to active scene:",
        error
      );
      ui.notifications.error("Erreur lors de l'affichage de la scène");
    }
  }

  static loadSceneInfo() {
    try {
      const activeScene = game.scenes.active;
      $("#dg-scene-name").text(
        activeScene ? activeScene.name : "No active scene"
      );
      $("#dg-go-to-scene")
        .off("click")
        .on("click", () => this.toggleToActiveScene());

      const $satActive = $("#dg-satellite-active");
      if ($satActive.length) {
        $satActive.text(
          activeScene ? activeScene.name : "NO ACTIVE SCENE"
        );
      }
    } catch (error) {
      console.error("Delta Green UI | Error loading scene info:", error);
      $("#dg-scene-name").text("Error loading scene");
    }
  }

  // NEW: build Satellite Feed list for scene view
  static loadSceneFeed() {
    try {
      const $list = $("#dg-satellite-list");
      const $activeLabel = $("#dg-satellite-active");
      if (!$list.length) return;

      $list.empty();

      const allScenes = Array.from(game.scenes ?? []);

      const scenes = game.user.isGM
        ? allScenes
        : allScenes.filter((scene) => {
            const isOnNav = scene.active || scene.navigation;
            if (!isOnNav) return false;

            let canObserve = false;
            try {
              if (typeof scene.testUserPermission === "function") {
                canObserve = scene.testUserPermission(
                  game.user,
                  CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
                );
              } else {
                const own = scene.ownership || {};
                const userLevel = own[game.user.id] ?? own.default ?? 0;
                canObserve =
                  userLevel >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER;
              }
            } catch (_) {
              canObserve = false;
            }
            return canObserve;
          });

      if (!scenes.length) {
        $list.append(
          '<li class="dg-result-item dg-no-entries">NO AVAILABLE FEEDS</li>'
        );
        if ($activeLabel.length) {
          $activeLabel.text("NO ACTIVE SCENE");
        }
        return;
      }

      const activeScene = game.scenes.active || null;

      if ($activeLabel.length) {
        $activeLabel.text(
          activeScene ? activeScene.name : "NO ACTIVE SCENE"
        );
      }

      scenes.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, {
          sensitivity: "base"
        })
      );

      for (const scene of scenes) {
        const isActive = activeScene && scene.id === activeScene.id;
        const $item = $(`
          <li class="dg-result-item dg-satellite-scene" data-scene-id="${scene.id}">
            ${scene.name}
          </li>`);

        if (isActive) {
          $item.addClass("dg-selected");
        }

        $item.on("click", async (ev) => {
          ev.preventDefault();
          try {
            await scene.view();
            if ($activeLabel.length) {
              $activeLabel.text(scene.name || "UNKNOWN SCENE");
            }
            $list.find(".dg-satellite-scene").removeClass("dg-selected");
            $item.addClass("dg-selected");
          } catch (err) {
            console.error("Delta Green UI | Error switching scene:", err);
            ui.notifications.error("Error switching satellite feed");
          }
        });

        $list.append($item);
      }
    } catch (err) {
      console.error("Delta Green UI | Error loading satellite feed:", err);
      const $list = $("#dg-satellite-list");
      if ($list.length) {
        $list
          .empty()
          .append(
            '<li class="dg-result-item dg-no-entries">Error loading feeds</li>'
          );
      }
    }
  }

  /* ------------------------- LAST ENTRIES (main screen) ------------------- */

  static loadLastEntries() {
    try {
      // 🔹 Fast bail: don’t do anything if the CRT overlay isn’t active
      if (!this.isInterfaceActive()) return;

      // 1) Make sure we actually have a list element
      let $list = $("#dg-last-entries-list");

      // If it doesn't exist yet, try to create it under the "LAST ENTRIES" section
      if (!$list.length) {
        const $section = $(".dg-section").filter(function () {
          const title = $(this)
            .find(".dg-section-title")
            .text()
            .trim()
            .toUpperCase();
          return title === "LAST ENTRIES";
        });

        if (!$section.length) {
          return;
        }

        $list = $('<ul class="dg-results-list" id="dg-last-entries-list"></ul>');
        $section.append($list);
      }

      $list.empty().css({ padding: "10px" });

      const folderIds = RecordsManager._getPcRecordsFolderIds
        ? RecordsManager._getPcRecordsFolderIds()
        : new Set();

      if (!folderIds.size) {
        $list.append(
          '<li class="dg-result-item dg-no-entries">No PC records found</li>'
        );
        return;
      }

      const allActors = game.actors.filter(
        (a) => a.folder && folderIds.has(a.folder.id)
      );

      if (!allActors.length) {
        $list.append(
          '<li class="dg-result-item dg-no-entries">No PC records found</li>'
        );
        return;
      }

      const recentActors = allActors
        .slice()
        .sort((a, b) => {
          const aLast = Number(a.getFlag(this.ID, "lastViewed") || 0);
          const bLast = Number(b.getFlag(this.ID, "lastViewed") || 0);
          if (aLast !== bLast) return bLast - aLast;

          const aUpdated = Number(a.updateTime || a._source?.sort || 0);
          const bUpdated = Number(b.updateTime || b._source?.sort || 0);
          return bUpdated - aUpdated;
        })
        .slice(0, 5);

      recentActors.forEach((actor) => {
        let firstName = "";
        let middleName = "";
        let surname = "";
        let displayName = actor.name || "Unknown Record";

        try {
          firstName = actor.getFlag(this.ID, "firstName") || "";
          middleName = actor.getFlag(this.ID, "middleName") || "";
          surname =
            actor.getFlag(this.ID, "surname") ||
            actor.name ||
            "UNKNOWN";

          const parts = [];
          if (surname) parts.push(surname);
          if (firstName || middleName) {
            parts.push("-");
            if (firstName) parts.push(firstName);
            if (middleName) parts.push(middleName);
          }

          const text = parts.join(" ").trim();
          if (text) displayName = text;
        } catch (_) {
          // fall back to actor.name
        }

        $list.append(
          `<li class="dg-result-item" data-actor-id="${actor.id}">${displayName}</li>`
        );
      });

      $list
        .find(".dg-result-item[data-actor-id]")
        .off("click")
        .on("click", function () {
          const actorId = $(this).data("actor-id");
          const actor = game.actors.get(actorId);
          if (!actor) return;

          const $recordsTab = $('.dg-menu-item[data-view="records"]');
          if ($recordsTab.length) $recordsTab.trigger("click");

          setTimeout(() => {
            RecordsManager.openRecord(actorId);
          }, 25);
        });
    } catch (error) {
      console.error("Delta Green UI | Error loading last entries:", error);
      const $list = $("#dg-last-entries-list");
      if ($list.length) {
        $list
          .empty()
          .append(
            '<li class="dg-result-item dg-no-entries">Error loading entries</li>'
          );
      }
    }
  }

  /* ------------------------------ Journals UI ----------------------------- */

  static loadJournals() {
    try {
      const $list = $("#dg-journals-list");
      if (!$list.length) return;

      $list.empty();

      $("#dg-create-journal-btn")
        .off("click")
        .on("click", () => JournalManager.createNewJournalInCrt());

      const coll = game.journal?.contents ?? game.journal ?? [];
      const accessibleJournals = Array.from(coll).filter((j) => j.visible);

      if (!accessibleJournals.length) {
        $list.append(
          '<li class="dg-result-item dg-no-entries">No journals found</li>'
        );
        return;
      }

      const rootJournals = accessibleJournals
        .filter((j) => !j.folder)
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, {
            sensitivity: "base"
          })
        );

      rootJournals.forEach((journal) => {
        const $item = $(`
          <li class="dg-result-item dg-journal-entry" data-journal-id="${journal.id}">
            ${journal.name}
          </li>`);
        $item.on("click", () => {
          JournalManager.openPageInCrt(journal.id);
        });
        $list.append($item);
      });

      const topFolders = game.folders
        .filter(
          (f) =>
            (f.type === "JournalEntry" || f.type === "Journal") &&
            !f.folder
        )
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, {
            sensitivity: "base"
          })
        );

      topFolders.forEach((folder) => {
        const node = this._buildJournalFolderTree(
          folder,
          accessibleJournals
        );
        if (this._journalNodeHasContent(node)) {
          this._renderJournalFolderNode(node, $list);
        }
      });

      if ($list.children().length === 0) {
        $list.append(
          '<li class="dg-result-item dg-no-entries">No journals found</li>'
        );
      }
    } catch (error) {
      console.error("Delta Green UI | Error loading journals:", error);
      const $list = $("#dg-journals-list");
      if ($list.length) {
        $list
          .empty()
          .append(
            '<li class="dg-result-item dg-no-entries">Error loading journals</li>'
          );
      }
    }
  }

  static async createNewJournal() {
    try {
      if (!game.user.can("JOURNAL_CREATE")) {
        ui.notifications.warn(
          "Vous n'avez pas les permissions pour créer un journal"
        );
        return;
      }

      const journalData = {
        name: "New Journal Entry",
        content: `<h1>Nouveau Journal</h1><p>Créé le ${new Date().toLocaleString()}</p><p>Contenu à remplir...</p>`,
        ownership: {
          [game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
        }
      };

      const journal = await JournalEntry.create(journalData);
      if (journal) {
        ui.notifications.info(
          `Journal "${journal.name}" créé avec succès`
        );
        this.loadJournals();
        setTimeout(() => {
          JournalManager.openPageInCrt(journal.id);
        }, 100);
      }
    } catch (error) {
      console.error("Delta Green UI | Error creating journal:", error);
      ui.notifications.error("Erreur lors de la création du journal");
    }
  }

  /* --------------------------- Roll Styling ------------------------------- */

  static styleRollMessage(html) {
    try {
      const rollTotal = html.find(".dice-total");
      if (!rollTotal.length) return;
      const totalValue = rollTotal.text().trim();
      const customRollHTML = `
        <div class="dg-roll-result">
          <div class="dg-roll-value">${totalValue}</div>
        </div>`;
      rollTotal.closest(".dice-roll").html(customRollHTML);
    } catch (error) {
      console.error("Delta Green UI | Error styling roll message:", error);
    }
  }

  /* ----------------------------- Web Window ------------------------------- */

  static initWebWindowEvents() {
    // Clear any old handlers in our namespace so we don't double-bind
    $(document).off(".dgWebWindow");

    const $overlay = $("#dg-web-overlay");
    const $window  = $("#dg-web-window");

    // If the HTML isn't there yet, just bail quietly
    if (!$overlay.length || !$window.length) return;

    // ---------------- CLOSE VIA BUTTON (X) ----------------
    $(document).on("click.dgWebWindow", "#dg-web-window-close", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      $overlay.hide();
    });

    // ---------------- CLOSE BY CLICKING BACKDROP ---------
    // Only close if the click is directly on the overlay, not inside the window
    $overlay.on("click.dgWebWindow", (ev) => {
      if ($(ev.target).is("#dg-web-overlay")) {
        $overlay.hide();
      }
    });
  }

  static toggleWebWindow() {
    const $overlay = $("#dg-web-overlay");
    if (!$overlay.length) return;

    const isEnabled = game.settings.get(this.ID, "enableWebView");
    if (!isEnabled) {
      ui.notifications.warn(
        "Web View is disabled. Enable it in module settings."
      );
      return;
    }

    const webUrl = game.settings.get(this.ID, "webViewUrl");
    if (!webUrl || !this.validateWebUrl(webUrl)) {
      ui.notifications.warn("No valid URL configured for Web View.");
      return;
    }

    // Make sure iframe has the right URL
    const $windowFrame = $("#dg-web-frame");
    if ($windowFrame.length) $windowFrame.attr("src", webUrl);

    // Show / hide the overlay; size is now handled purely by CSS
    if ($overlay.is(":visible")) {
      $overlay.hide();
    } else {
      $overlay.css("display", "flex");
    }
  }

  // ----------------------- AUDIO CONTROLS + TICKER ----------------------- //

  static injectAudioControls() {
    if (document.getElementById("dg-audio-controls")) return;

    const systemView = document.getElementById("dg-view-sound");
    if (!systemView) return;

    const wrap = document.createElement("div");
    wrap.id = "dg-audio-controls";
    wrap.classList.add("dg-section");
    wrap.innerHTML = `
      <div class="dg-section-title">AUDIO CONTROL</div>

      <div id="dg-audio-ticker" class="dg-audio-line">
        NOW PLAYING: &mdash;
      </div>

      <div class="dg-audio-row">
        <span class="dg-audio-label">MASTER</span>
        <input id="dg-audio-master" type="range" min="0" max="1" step="0.05" value="1">
        <span id="dg-audio-master-val" class="dg-audio-val">100%</span>
      </div>

      <div class="dg-audio-row">
        <span class="dg-audio-label">PLAYLIST</span>
        <input id="dg-audio-playlist" type="range" min="0" max="1" step="0.05">
        <span id="dg-audio-playlist-val" class="dg-audio-val"></span>
      </div>

      <div class="dg-audio-row">
        <span class="dg-audio-label">AMBIENT</span>
        <input id="dg-audio-ambient" type="range" min="0" max="1" step="0.05">
        <span id="dg-audio-ambient-val" class="dg-audio-val"></span>
      </div>

      <div class="dg-audio-row">
        <span class="dg-audio-label">INTERFACE</span>
        <input id="dg-audio-interface" type="range" min="0" max="1" step="0.05">
        <span id="dg-audio-interface-val" class="dg-audio-val"></span>
      </div>
    `;

    systemView.appendChild(wrap);

    // Helper to format 0–1 as "XX%"
    const pct = (v) => `${Math.round((Number(v) || 0) * 100)}%`;

    // Baseline volumes for MASTER scaling (snapshot when master is first moved)
    let masterBaseline = null;

    // Sync sliders from current settings
    const syncFromSettings = () => {
      const playlist = game.settings.get("core", "globalPlaylistVolume") ?? 0.5;
      const ambient  = game.settings.get("core", "globalAmbientVolume")  ?? 0.5;
      const iface    = game.settings.get("core", "globalInterfaceVolume") ?? 0.5;

      const sMaster   = document.getElementById("dg-audio-master");
      const sPlaylist = document.getElementById("dg-audio-playlist");
      const sAmbient  = document.getElementById("dg-audio-ambient");
      const sIface    = document.getElementById("dg-audio-interface");

      const vMaster   = document.getElementById("dg-audio-master-val");
      const vPlaylist = document.getElementById("dg-audio-playlist-val");
      const vAmbient  = document.getElementById("dg-audio-ambient-val");
      const vIface    = document.getElementById("dg-audio-interface-val");

      if (sPlaylist) sPlaylist.value = playlist;
      if (sAmbient)  sAmbient.value  = ambient;
      if (sIface)    sIface.value    = iface;

      if (vPlaylist) vPlaylist.textContent = pct(playlist);
      if (vAmbient)  vAmbient.textContent  = pct(ambient);
      if (vIface)    vIface.textContent    = pct(iface);

      // Master starts at 100% (no scaling) and resets baseline
      if (sMaster) sMaster.value = 1;
      if (vMaster) vMaster.textContent = "100%";
      masterBaseline = null;
    };

    syncFromSettings();

    // Wire sliders → Foundry settings (per-channel)
    const bind = (sliderId, labelId, settingKey) => {
      const slider = document.getElementById(sliderId);
      const label  = document.getElementById(labelId);
      if (!slider) return;

      slider.addEventListener("input", async (ev) => {
        const v = Number(ev.target.value || 0);
        if (label) label.textContent = pct(v);

        // Manual tweak breaks the old baseline; next master drag will re-snapshot
        masterBaseline = null;

        try {
          await game.settings.set("core", settingKey, v);
        } catch (err) {
          console.error("DG UI | Error updating audio setting", settingKey, err);
        }
      });
    };

    bind("dg-audio-playlist", "dg-audio-playlist-val", "globalPlaylistVolume");
    bind("dg-audio-ambient",  "dg-audio-ambient-val",  "globalAmbientVolume");
    bind("dg-audio-interface","dg-audio-interface-val","globalInterfaceVolume");

    // MASTER slider: scales all three channels, preserving their ratios
    const masterSlider = document.getElementById("dg-audio-master");
    const masterLabel  = document.getElementById("dg-audio-master-val");

    if (masterSlider) {
      masterSlider.addEventListener("input", async (ev) => {
        const raw = Number(ev.target.value || 0);
        const factor = Math.max(0, Math.min(1, raw));
        if (masterLabel) masterLabel.textContent = pct(factor);

        // Snapshot baseline once at the start of this drag
        if (!masterBaseline) {
          masterBaseline = {
            playlist: Number(game.settings.get("core", "globalPlaylistVolume") ?? 0.5),
            ambient:  Number(game.settings.get("core", "globalAmbientVolume")  ?? 0.5),
            iface:    Number(game.settings.get("core", "globalInterfaceVolume") ?? 0.5)
          };
        }

        const channels = [
          {
            key: "globalPlaylistVolume",
            base: masterBaseline.playlist,
            sliderId: "dg-audio-playlist",
            labelId: "dg-audio-playlist-val"
          },
          {
            key: "globalAmbientVolume",
            base: masterBaseline.ambient,
            sliderId: "dg-audio-ambient",
            labelId: "dg-audio-ambient-val"
          },
          {
            key: "globalInterfaceVolume",
            base: masterBaseline.iface,
            sliderId: "dg-audio-interface",
            labelId: "dg-audio-interface-val"
          }
        ];

        for (const ch of channels) {
          const newVal = Math.max(0, Math.min(1, ch.base * factor));
          const s = document.getElementById(ch.sliderId);
          const l = document.getElementById(ch.labelId);

          if (s) s.value = newVal;
          if (l) l.textContent = pct(newVal);

          try {
            await game.settings.set("core", ch.key, newVal);
          } catch (err) {
            console.error("DG UI | Error updating audio setting", ch.key, err);
          }
        }
      });

      // Optional: double-click MASTER to resync from settings (reset back to 100%)
      masterSlider.addEventListener("dblclick", () => {
        syncFromSettings();
      });
    }

    // Initial ticker draw + lightweight polling to keep it updated
    this.updateAudioTicker?.();
    if (!this._audioTickerInterval) {
      this._audioTickerInterval = setInterval(() => {
        if (this.isInterfaceActive()) this.updateAudioTicker();
      }, 1000);
    }
  }

  static updateAudioTicker() {
    const el = document.getElementById("dg-audio-ticker");
    if (!el) return;

    const coll = game.playlists?.contents ?? game.playlists ?? [];
    const playing = [];

    for (const pl of coll) {
      const sounds = pl.sounds ?? [];
      for (const s of sounds) {
        // Foundry playlist sounds expose a "playing" flag
        if (s.playing) playing.push({ playlist: pl, sound: s });
      }
    }

    if (!playing.length) {
      el.textContent = "NOW PLAYING: —";
      return;
    }

    const { playlist, sound } = playing[0];
    const name = sound.name || "Untitled";
    const plName = playlist.name || "Playlist";

    // --- Time formatting bit ---
    let timePart = "";
    try {
      // Underlying audio object (Howler/HTML5) attached by Foundry
      const audio = sound.sound;

      // Use Foundry’s formatter if it exists, otherwise fallback
      const format =
        ui.playlists?.constructor?.formatTimestamp ??
        ((seconds) => {
          const s = Math.max(0, Math.floor(Number(seconds) || 0));
          const m = Math.floor(s / 60);
          const r = s % 60;
          return `${m}:${r.toString().padStart(2, "0")}`;
        });

      if (audio) {
        const currentSeconds = Number(audio.currentTime || 0);
        const durationSeconds = Number(audio.duration || 0);

        const currentText = format(currentSeconds);
        const durationText = durationSeconds ? format(durationSeconds) : "--:--";

        // Append " 0:18/4:28" style
        timePart = ` ${currentText}/${durationText}`;
      }
    } catch (e) {
      // If anything blows up, just skip time and show name only
      console.error("DG UI | audio ticker time error:", e);
    }

    if (playing.length === 1) {
      el.textContent = `NOW PLAYING: ${name} (${plName})${timePart}`;
    } else {
      el.textContent = `NOW PLAYING: ${name} (+${playing.length - 1} more)${timePart}`;
    }
  }

  /* ------------------------------- Templates ------------------------------ */

  static async loadTemplates() {
    try {
      const templatePaths = [
        `modules/${this.ID}/templates/records-view.html`,
        `modules/${this.ID}/templates/mail-view.html`,
        `modules/${this.ID}/templates/journal-view.html`,
        `modules/${this.ID}/templates/scene-view.html`,
        `modules/${this.ID}/templates/web-view.html`,
        `modules/${this.ID}/templates/web-window.html`,
        `modules/${this.ID}/templates/rolls-view.html`,
        `modules/${this.ID}/templates/inventory-view.html`,
        `modules/${this.ID}/templates/psyche-view.html`,
        `modules/${this.ID}/templates/sound-view.html`,
        `modules/${this.ID}/templates/combat-view.html`,
        `modules/${this.ID}/templates/time-view.html`
      ];

      for (const path of templatePaths) {
        try {
          const response = await fetch(path);
          if (!response.ok)
            console.error(`Delta Green UI | Template not found: ${path}`);
        } catch (error) {
          console.error(
            `Delta Green UI | Error checking template: ${path}`,
            error
          );
        }
      }

      await loadTemplates(templatePaths);
      return true;
    } catch (error) {
      console.error("Delta Green UI | Error loading templates:", error);
      ui.notifications.error("Error loading Delta Green UI templates");
      return false;
    }
  }

  /* --------------------------- Dice Tray Helpers -------------------------- */

  static moveDiceTrayToMail() {
    if (!window.CONFIG || !CONFIG.DICETRAY || !CONFIG.DICETRAY.element) return;
    const mailInput = document.querySelector("#dg-message-input");
    if (mailInput) {
      mailInput.insertAdjacentElement("afterend", CONFIG.DICETRAY.element);
    }
  }

  static moveDiceTrayBackToChat() {
    if (!window.CONFIG || !CONFIG.DICETRAY || !CONFIG.DICETRAY.element) return;
    const chatInput =
      document.querySelector("textarea.chat-input") ||
      document.getElementById("chat-message");
    if (chatInput) {
      chatInput.insertAdjacentElement("afterend", CONFIG.DICETRAY.element);
    }
  }

  // ----------------------------- ROLLS VIEW ----------------------------- //

  static loadRollsView() {
    // Prefer letting RollsManager own the header so naming stays consistent
    if (RollsManager && typeof RollsManager._updateActorHeader === "function") {
      RollsManager._updateActorHeader();
      return;
    }

    // Fallback: do a local header update with 3rd+4th naming
    const nameEl = document.getElementById("dg-rolls-actor-name");
    if (!nameEl) return;

    const actor =
      canvas?.tokens?.controlled?.[0]?.actor ||
      game.user?.character ||
      null;

    if (!actor) {
      nameEl.textContent = "LOGGED IN: NO AGENT SELECTED";
      return;
    }

    const fullName = (actor.name || "UNKNOWN").trim();
    const parts = fullName.split(/\s+/).filter(Boolean);

    let shortName = "UNKNOWN";
    if (parts.length >= 4) {
      shortName = `${parts[2]} ${parts[3]}`; // 3rd + 4th
    } else if (parts.length === 3) {
      shortName = `${parts[1]} ${parts[2]}`; // 2nd + 3rd
    } else if (parts.length === 2) {
      shortName = `${parts[0]} ${parts[1]}`; // both
    } else if (parts.length === 1) {
      shortName = parts[0];
    }

    nameEl.textContent = `LOGGED IN: ${shortName.toUpperCase()}`;
  }

  /* --------------------------- Core UI Hiding ----------------------------- */

  static hideFoundryCoreUi() {
    // Only hide core UI for players, never for the GM
    if (game.user.isGM) return;

    $("#ui-top").hide();
    $("#ui-left").hide();
    $("#ui-right").hide();
    $("#players").hide();
    $("#hotbar").hide();
    $("#navigation").hide();
    $("#logo").hide();
    $("#sidebar").hide();
    $("#controls").hide();
  }

  static showFoundryCoreUi() {
    // Only show/restore core UI for players; GM is never touched
    if (game.user.isGM) return;

    $("#ui-top").show();
    $("#ui-left").show();
    $("#ui-right").show();
    $("#players").show();
    $("#hotbar").show();
    $("#navigation").show();
    $("#logo").show();
    $("#sidebar").show();
    $("#controls").show();
  }

  static _kickDeferredRefresh() {
    setTimeout(() => {
      this.loadLastEntries();
      this.forceDisplayLastEntries();
      // Actor HUD (status bar + hotbar) is now handled by MailSystem._scheduleActorRefresh
    }, 500);
  }

  /* --------------------------- Popup z-index fix --------------------------- */

  /**
   * Make sure all Foundry window-app popups (journals, items, actors, dialogs)
   * always display above the CRT bar by forcing a higher z-index.
   */
  static enforcePopupZIndex() {
    const styleId = "dg-crt-popup-z-fix";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;

    style.textContent = `
      /* ------------------------------------------------------------------
       * Foundry windows & UI always ABOVE CRT
       * ------------------------------------------------------------------ */

      /* All pop-up windows: actor sheets, journal sheets, dialogs, configs */
      .window-app,
      .app.window-app,
      .dialog,
      .filepicker,
      .sidebar-popout {
        z-index: 19000 !important;
      }

      /* Core UI chrome (if visible) */
      #ui-top,
      #ui-left,
      #ui-right,
      #navigation,
      #sidebar,
      #controls,
      #logo,
      #players,
      #hotbar {
        z-index: 19000 !important;
      }

      /* Canvas overlays that should still be above CRT */
      #token-hud,
      #hud,
      #context-menu,
      #tooltip {
        z-index: 19000 !important;
      }
    `;

    document.head.appendChild(style);
  }
}

/* ----------------------------------------------------------------------------
 * Module initialization
 * ------------------------------------------------------------------------- */
Hooks.once("init", () => {
  DeltaGreenUI.init();
});

/* ----------------------------------------------------------------------------
 * Dice Tray integration: prefer DG mail input when present
 * ------------------------------------------------------------------------- */
Hooks.once("ready", () => {
  if (!window.CONFIG || !CONFIG.DICETRAY) return;

  Object.defineProperty(CONFIG.DICETRAY, "textarea", {
    get() {
      return (
        document.querySelector("#dg-message-input") ||
        document.querySelector("textarea.chat-input") ||
        document.getElementById("chat-message")
      );
    }
  });

  // Safe to call even if CRT not open yet; it just won't find elements
  DeltaGreenUI.applyLayoutSettings();
});
