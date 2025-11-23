// health-manager.js
// RAW-focused health + willpower helper for Delta Green in Foundry.
// - Shows HP / WP for the controlled token (or user's assigned character)
// - Buttons for core RAW healing routines
// - Generic helpers for Lethality, fire, cold, suffocation, etc.

import { DeltaGreenUI } from "./delta-green-ui.js";

export class HealthManager {
  static initialized = false;
  static panelId = "dg-health-panel";

  /* ------------------------------------------------------------------------ */
  /* INIT                                                                     */
  /* ------------------------------------------------------------------------ */

  static init() {
    if (this.initialized) return;
    this.initialized = true;

    // Build the panel after the CRT UI DOM exists
    this._createPanel();
    this.refresh();

    // Make sure initial visibility matches the current view
    this.showForView(DeltaGreenUI.currentView || null);

    // Keep panel in sync with token / actor changes
    Hooks.on("controlToken", () => this.refresh());
    Hooks.on("updateActor", (actor, data, options, userId) => {
      if (game.user.id === userId) this.refresh();
    });

    // Optional: if you ever add a subpanel registry, this will hook into it
    if (DeltaGreenUI?.registerSubpanel) {
      DeltaGreenUI.registerSubpanel("health", {
        label: "Health/WP",
        toggle: () => this.toggle()
      });
    }
  }

  /* ------------------------------------------------------------------------ */
  /* PANEL DOM                                                                */
  /* ------------------------------------------------------------------------ */

  static _createPanel() {
    if (document.getElementById(this.panelId)) return;

    // Prefer mounting inside the HEALTH view so it shows in the dropdown.
    const container =
      document.getElementById("dg-view-health") ||
      document.getElementById("dg-main-panel") ||
      document.body;

    const wrapper = document.createElement("section");
    wrapper.id = this.panelId;
    // IMPORTANT: start hidden so it doesn't appear on every view
    wrapper.classList.add("dg-section", "dg-health-panel", "hidden");

    wrapper.innerHTML = `
<!-- health-view.html -->
<div id="dg-health-root">
  <div class="dg-section">
    <div class="dg-section-title">
      HEALTH &amp; WILLPOWER
      <span class="dg-mail-actor-name" data-field="actor-name">
        LOGGED IN: NO AGENT SELECTED
      </span>
    </div>

    <div class="dg-health-layout">
      <!-- FULL-WIDTH SUMMARY ROW -->
      <div class="dg-health-summary">
        <div class="dg-health-actor-line">
          <span class="dg-label">Actor:</span>
          <span class="dg-value" data-field="actor-name-inline">—</span>
        </div>

        <div class="dg-health-stat-line">
          <span class="dg-label">HP</span>
          <span class="dg-value" data-field="hp-value">—</span>
          <span>/</span>
          <span class="dg-value" data-field="hp-max">—</span>
        </div>

        <div class="dg-health-stat-line">
          <span class="dg-label">WP</span>
          <span class="dg-value" data-field="wp-value">—</span>
          <span>/</span>
          <span class="dg-value" data-field="wp-max">—</span>
        </div>
      </div>

      <!-- TWO-COLUMN BODY -->
      <div class="dg-health-columns">
        <!-- LEFT COLUMN: HEALING RAW -->
        <div class="dg-health-column dg-health-left">
          <div class="dg-health-section">
            <div class="dg-section-subtitle">HEALING (RAW BUTTONS)</div>

            <div class="dg-subsection">
              <div class="dg-subtitle">
                Resuscitation (First Aid within CON minutes)
              </div>
              <div class="dg-button-row">
                <button
                  type="button"
                  class="dg-button"
                  data-action="heal-resus-success"
                >
                  RESUS: SUCCESS (1D4 HP)
                </button>
                <button
                  type="button"
                  class="dg-button"
                  data-action="heal-resus-crit"
                >
                  RESUS: CRIT (2D4 HP)
                </button>
              </div>
            </div>

            <div class="dg-subsection">
              <div class="dg-subtitle">
                Stabilization (First Aid on dying Agent)
              </div>
              <div class="dg-button-row">
                <button
                  type="button"
                  class="dg-button"
                  data-action="heal-stab-success"
                >
                  STABILIZE: SUCCESS (1D4 HP)
                </button>
                <button
                  type="button"
                  class="dg-button"
                  data-action="heal-stab-crit"
                >
                  STABILIZE: CRIT (2D4 HP)
                </button>
                <button
                  type="button"
                  class="dg-button"
                  data-action="heal-stab-fumble"
                >
                  STABILIZE: FUMBLE (1D4 DMG)
                </button>
              </div>
            </div>

            <div class="dg-subsection">
              <div class="dg-subtitle">
                Treatment (Hospital / Aid Station, weekly)
              </div>
              <div class="dg-button-row">
                <button
                  type="button"
                  class="dg-button"
                  data-action="heal-treat-success"
                >
                  TREATMENT: SUCCESS (1D4 HP)
                </button>
                <button
                  type="button"
                  class="dg-button"
                  data-action="heal-treat-crit"
                >
                  TREATMENT: CRIT (2D4 HP)
                </button>
                <button
                  type="button"
                  class="dg-button"
                  data-action="heal-treat-fumble"
                >
                  TREATMENT: FUMBLE (1D4 DMG)
                </button>
              </div>
            </div>

            <div class="dg-subsection">
              <div class="dg-subtitle">
                Recuperation (CON×5 daily in safe rest)
              </div>
              <div class="dg-button-row">
                <button
                  type="button"
                  class="dg-button"
                  data-action="heal-recup-success"
                >
                  RECUPERATION: SUCCESS (+1 HP)
                </button>
                <button
                  type="button"
                  class="dg-button"
                  data-action="heal-recup-crit"
                >
                  RECUPERATION: CRIT (1D4 HP)
                </button>
                <button
                  type="button"
                  class="dg-button"
                  data-action="heal-recup-fumble"
                >
                  RECUPERATION: FUMBLE (-1 HP)
                </button>
              </div>
            </div>

            <div class="dg-subsection">
              <div class="dg-subtitle">
                Complications (after Treatment, strenuous activity)
              </div>
              <div class="dg-button-row">
                <button
                  type="button"
                  class="dg-button"
                  data-action="heal-complications"
                >
                  COMPLICATIONS TICK (1D4 DMG)
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: OTHER THREATS + WP -->
        <div class="dg-health-column dg-health-right">
          <div class="dg-health-section">
            <div class="dg-section-subtitle">OTHER THREATS (RAW HELPERS)</div>

            <div class="dg-subsection">
              <div class="dg-subtitle">
                Generic Lethality (poison, major fire, falls, impacts, etc.)
              </div>
              <div class="dg-button-row">
                <button
                  type="button"
                  class="dg-button"
                  data-action="lethality-roll"
                >
                  LETHALITY ROLL (PROMPT %)
                </button>
              </div>
            </div>

            <div class="dg-subsection">
              <div class="dg-subtitle">Fire (per turn of exposure)</div>
              <div class="dg-button-row">
                <button
                  type="button"
                  class="dg-button"
                  data-action="fire-minor"
                >
                  FIRE: MINOR (1 DMG)
                </button>
                <button
                  type="button"
                  class="dg-button"
                  data-action="fire-moderate"
                >
                  FIRE: MODERATE (1D6 DMG)
                </button>
                <button
                  type="button"
                  class="dg-button"
                  data-action="fire-large"
                >
                  FIRE: LARGE (2D6 DMG)
                </button>
              </div>
            </div>

            <div class="dg-subsection">
              <div class="dg-subtitle">Cold / Suffocation Ticks</div>
              <div class="dg-button-row">
                <button
                  type="button"
                  class="dg-button"
                  data-action="cold-tick"
                >
                  COLD TICK (1D8 DMG)
                </button>
                <button
                  type="button"
                  class="dg-button"
                  data-action="suffocation-fail"
                >
                  SUFFOCATION: FAIL (1D6 DMG)
                </button>
                <button
                  type="button"
                  class="dg-button"
                  data-action="suffocation-success"
                >
                  SUFFOCATION: SUCCESS (1 DMG)
                </button>
              </div>
            </div>

            <div class="dg-subsection">
              <div class="dg-subtitle">Generic HP Damage / Healing</div>
              <div class="dg-button-row">
                <button
                  type="button"
                  class="dg-button"
                  data-action="generic-dmg"
                >
                  APPLY CUSTOM DAMAGE
                </button>
                <button
                  type="button"
                  class="dg-button"
                  data-action="generic-heal"
                >
                  APPLY CUSTOM HEALING
                </button>
              </div>
            </div>
          </div>

          <div class="dg-health-section">
            <div class="dg-section-subtitle">WILLPOWER QUICK ADJUST</div>
            <div class="dg-button-row">
              <button
                type="button"
                class="dg-button"
                data-action="wp-minus-1"
              >
                WP -1
              </button>
              <button
                type="button"
                class="dg-button"
                data-action="wp-plus-1"
              >
                WP +1
              </button>
              <button
                type="button"
                class="dg-button"
                data-action="wp-minus-1d4"
              >
                WP -1D4
              </button>
              <button
                type="button"
                class="dg-button"
                data-action="wp-plus-1d4"
              >
                WP +1D4
              </button>
            </div>
          </div>
        </div>
      </div> <!-- /.dg-health-columns -->
       <div class="dg-mail-skillbar dg-mail-statbar">	   
       <button class="dg-button dg-skill-roll-btn" data-skill="first_aid">FIRST AID</button>
       <button class="dg-button dg-skill-roll-btn" data-skill="medicine">MEDICINE</button>
	   <button class="dg-button dg-skill-roll-btn" data-skill="pharmacy">PHARMACY</button>
	   <button class="dg-button dg-skill-roll-btn" data-skill="surgery">SURGERY</button>
	   <button class="dg-button dg-stat-roll-btn" data-stat="con">CONSTITUTION</button>
	   </div></div>   <!-- /.dg-health-layout -->
  </div>
</div>
    `;

    container.appendChild(wrapper);
    this._activateListeners(wrapper);
  }

  static _activateListeners(html) {
    html.addEventListener("click", async (ev) => {
      const btn = ev.target.closest("button");
      if (!btn) return;

      const action = btn.dataset.action;
      if (!action) return;

      const actor = this._getCurrentActor();
      if (!actor) {
        ui.notifications?.warn("No controlled token / actor found.");
        return;
      }

      switch (action) {
        /* Healing RAW */
        case "heal-resus-success":
          await this._healRoll(actor, "1d4", { label: "Resuscitation (Success)" });
          break;
        case "heal-resus-crit":
          await this._healRoll(actor, "2d4", { label: "Resuscitation (Critical Success)" });
          break;

        case "heal-stab-success":
          await this._healRoll(actor, "1d4", { label: "Stabilization (Success)" });
          break;
        case "heal-stab-crit":
          await this._healRoll(actor, "2d4", { label: "Stabilization (Critical Success)" });
          break;
        case "heal-stab-fumble":
          await this._damageRoll(actor, "1d4", { label: "Stabilization (Fumble)" });
          break;

        case "heal-treat-success":
          await this._healRoll(actor, "1d4", { label: "Treatment (Success)" });
          break;
        case "heal-treat-crit":
          await this._healRoll(actor, "2d4", { label: "Treatment (Critical Success)" });
          break;
        case "heal-treat-fumble":
          await this._damageRoll(actor, "1d4", { label: "Treatment (Fumble)" });
          break;

        case "heal-recup-success":
          await this._applyHpDelta(actor, +1, { label: "Recuperation (Success)" });
          break;
        case "heal-recup-crit":
          await this._healRoll(actor, "1d4", { label: "Recuperation (Critical Success)" });
          break;
        case "heal-recup-fumble":
          await this._applyHpDelta(actor, -1, { label: "Recuperation (Fumble)" });
          break;

        case "heal-complications":
          await this._damageRoll(actor, "1d4", { label: "Complications after Treatment" });
          break;

        /* Other threats helpers */
        case "lethality-roll":
          await this._handleLethality(actor);
          break;

        case "fire-minor":
          await this._damageRoll(actor, "1", { label: "Fire (Minor Intensity)" });
          break;
        case "fire-moderate":
          await this._damageRoll(actor, "1d6", { label: "Fire (Moderate Intensity)" });
          break;
        case "fire-large":
          await this._damageRoll(actor, "2d6", { label: "Fire (Large Intensity)" });
          break;

        case "cold-tick":
          await this._damageRoll(actor, "1d8", { label: "Cold Exposure Tick" });
          break;

        case "suffocation-fail":
          await this._damageRoll(actor, "1d6", { label: "Suffocation Tick (Failed CON×5)" });
          break;
        case "suffocation-success":
          await this._damageRoll(actor, "1", { label: "Suffocation Tick (Successful CON×5)" });
          break;

        case "generic-dmg":
          await this._genericDamagePrompt(actor);
          break;
        case "generic-heal":
          await this._genericHealPrompt(actor);
          break;

        /* Willpower */
        case "wp-minus-1":
          await this._applyWpDelta(actor, -1, { label: "WP -1" });
          break;
        case "wp-plus-1":
          await this._applyWpDelta(actor, +1, { label: "WP +1" });
          break;
        case "wp-minus-1d4":
          await this._wpRoll(actor, "-1d4", { label: "WP -1d4" });
          break;
        case "wp-plus-1d4":
          await this._wpRoll(actor, "1d4", { label: "WP +1d4" });
          break;
      }
    });
  }

  /* ------------------------------------------------------------------------ */
  /* CORE HELPERS                                                             */
  /* ------------------------------------------------------------------------ */

  static _getCurrentActor() {
    const token = canvas?.tokens?.controlled?.[0];
    if (token?.actor) return token.actor;
    // In v10+, game.user.character is already an Actor document
    if (game.user?.character) return game.user.character;
    return null;
  }

  static refresh() {
    const panel = document.getElementById(this.panelId);
    if (!panel) return;

    const actor = this._getCurrentActor();
    const nameField = panel.querySelector("[data-field='actor-name']");
    const inlineName = panel.querySelector("[data-field='actor-name-inline']");
    const hpVal = panel.querySelector("[data-field='hp-value']");
    const hpMax = panel.querySelector("[data-field='hp-max']");
    const wpVal = panel.querySelector("[data-field='wp-value']");
    const wpMax = panel.querySelector("[data-field='wp-max']");

    if (!actor) {
      if (nameField) nameField.textContent = "LOGGED IN: NO AGENT SELECTED";
      if (inlineName) inlineName.textContent = "—";
      if (hpVal) hpVal.textContent = "—";
      if (hpMax) hpMax.textContent = "—";
      if (wpVal) wpVal.textContent = "—";
      if (wpMax) wpMax.textContent = "—";
      return;
    }

    const { hpCurrent, hpMaximum } = this._getHpData(actor);
    const { wpCurrent, wpMaximum } = this._getWpData(actor);

    const actorName = actor.name ?? "—";
    if (nameField) nameField.textContent = `LOGGED IN: ${actorName}`;
    if (inlineName) inlineName.textContent = actorName;
    if (hpVal) hpVal.textContent = hpCurrent ?? "—";
    if (hpMax) hpMax.textContent = hpMaximum ?? "—";
    if (wpVal) wpVal.textContent = wpCurrent ?? "—";
    if (wpMax) wpMax.textContent = wpMaximum ?? "—";
  }

  static toggle() {
    const panel = document.getElementById(this.panelId);
    if (!panel) return;
    panel.classList.toggle("hidden");
  }

  /**
   * Central place to decide when the panel is visible:
   * - view === "health"  -> show
   * - anything else      -> hide
   */
  static showForView(view) {
    const panel = document.getElementById(this.panelId);
    if (!panel) return;

    if (view === "health") {
      panel.classList.remove("hidden");
    } else {
      panel.classList.add("hidden");
    }
  }

  /* --- HP data paths ------------------------------------------------------ */

  static _getHpData(actor) {
    const candidates = [
      { cur: "system.health.value", max: "system.health.max" },
    ];

    for (const c of candidates) {
      const cur = foundry.utils.getProperty(actor, c.cur);
      if (cur !== undefined) {
        return {
          hpCurrent: cur,
          hpMaximum: foundry.utils.getProperty(actor, c.max),
          hpPath: c.cur,
          hpMaxPath: c.max
        };
      }
    }

    return {
      hpCurrent: undefined,
      hpMaximum: undefined,
      hpPath: "system.hp.value",
      hpMaxPath: "system.hp.max"
    };
  }

  static _getWpData(actor) {
    const candidates = [
      { cur: "system.wp.value", max: "system.wp.max" },
      { cur: "system.attributes.wp.value", max: "system.attributes.wp.max" }
    ];

    for (const c of candidates) {
      const cur = foundry.utils.getProperty(actor, c.cur);
      if (cur !== undefined) {
        return {
          wpCurrent: cur,
          wpMaximum: foundry.utils.getProperty(actor, c.max),
          wpPath: c.cur,
          wpMaxPath: c.max
        };
      }
    }

    return {
      wpCurrent: undefined,
      wpMaximum: undefined,
      wpPath: "system.wp.value",
      wpMaxPath: "system.wp.max"
    };
  }

  /* --- HP / WP mutation --------------------------------------------------- */

  static async _applyHpDelta(actor, delta, { label = "HP Adjust" } = {}) {
    const { hpCurrent, hpMaximum, hpPath } = this._getHpData(actor);
    if (hpCurrent === undefined) {
      ui.notifications?.error("Could not find HP field on actor.");
      return;
    }

    const max = hpMaximum ?? hpCurrent;
    const newVal = foundry.utils.clamp(hpCurrent + delta, 0, max);

    await actor.update({ [hpPath]: newVal });

    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<strong>${label}</strong>: HP ${hpCurrent} &rarr; ${newVal} (Δ ${delta > 0 ? "+" : ""}${delta})`
    });

    this.refresh();
  }

  static async _applyWpDelta(actor, delta, { label = "WP Adjust" } = {}) {
    const { wpCurrent, wpMaximum, wpPath } = this._getWpData(actor);
    if (wpCurrent === undefined) {
      ui.notifications?.error("Could not find WP field on actor.");
      return;
    }

    const max = wpMaximum ?? wpCurrent;
    const newVal = foundry.utils.clamp(wpCurrent + delta, 0, max);

    await actor.update({ [wpPath]: newVal });

    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<strong>${label}</strong>: WP ${wpCurrent} &rarr; ${newVal} (Δ ${delta > 0 ? "+" : ""}${delta})`
    });

    this.refresh();
  }

  /* --- Roll wrappers ------------------------------------------------------ */

  static async _healRoll(actor, formula, { label = "Healing" } = {}) {
    const roll = await (new Roll(formula)).evaluate({ async: true });
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${label} (healing roll)`
    });
    const amount = Number(roll.total) || 0;
    if (amount === 0) return;
    await this._applyHpDelta(actor, amount, { label });
  }

  static async _damageRoll(actor, formula, { label = "Damage" } = {}) {
    const roll = await (new Roll(formula)).evaluate({ async: true });
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${label} (damage roll)`
    });
    const amount = Number(roll.total) || 0;
    if (amount === 0) return;
    await this._applyHpDelta(actor, -amount, { label });
  }

  static async _wpRoll(actor, formula, { label = "WP Adjust" } = {}) {
    const roll = await (new Roll(formula.replace("-", ""))).evaluate({ async: true });
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${label} (WP roll)`
    });
    const raw = Number(roll.total) || 0;
    const amount = formula.startsWith("-") ? -raw : raw;
    if (amount === 0) return;
    await this._applyWpDelta(actor, amount, { label });
  }

  /* ------------------------------------------------------------------------ */
  /* LETHALITY                                                                */
  /* ------------------------------------------------------------------------ */

  static async _handleLethality(actor) {
    const lethalityStr = await Dialog.prompt({
      title: "Lethality Rating",
      content: `<p>Enter Lethality rating as a percentage (e.g. <code>10</code> for 10%):</p>
                <input type="number" name="lethality" value="10" min="1" max="100" style="width:100%">`,
      label: "Roll",
      callback: html => {
        const input = html[0].querySelector("input[name='lethality']");
        return input?.value;
      },
      rejectClose: true
    });

    if (!lethalityStr) return;
    const lethality = Number(lethalityStr);
    if (Number.isNaN(lethality) || lethality <= 0) {
      ui.notifications?.error("Invalid Lethality rating.");
      return;
    }

    const roll = await (new Roll("1d100")).evaluate({ async: true });
    const total = roll.total;
    const tens = Math.floor(total / 10);
    const ones = total % 10;
    const damage = tens + ones;

    const lethalHit = total <= lethality;

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `Lethality ${lethality}% vs target (roll ${total})`
    });

    if (lethalHit) {
      await this._applyHpDelta(actor, -9999, { label: `Lethal Hit (${lethality}%)` });
    } else {
      await this._applyHpDelta(actor, -damage, {
        label: `Non-lethal Damage from ${lethality}% Lethality (roll ${total})`
      });
    }
  }

  /* ------------------------------------------------------------------------ */
  /* GENERIC PROMPTS                                                          */
  /* ------------------------------------------------------------------------ */

  static async _genericDamagePrompt(actor) {
    const formula = await Dialog.prompt({
      title: "Custom Damage",
      content: `<p>Enter damage formula (e.g. <code>1d6</code>, <code>2d10+2</code>, or a flat number):</p>
                <input type="text" name="formula" value="1d6" style="width:100%">`,
      label: "Apply Damage",
      callback: html => {
        const input = html[0].querySelector("input[name='formula']");
        return input?.value?.trim();
      },
      rejectClose: true
    });

    if (!formula) return;

    if (/^\d+$/.test(formula)) {
      const amount = Number(formula);
      await this._applyHpDelta(actor, -amount, { label: `Custom Damage (${amount})` });
      return;
    }

    await this._damageRoll(actor, formula, { label: "Custom Damage" });
  }

  static async _genericHealPrompt(actor) {
    const formula = await Dialog.prompt({
      title: "Custom Healing",
      content: `<p>Enter healing formula (e.g. <code>1d4</code>, <code>1d10+2</code>, or a flat number):</p>
                <input type="text" name="formula" value="1d4" style="width:100%">`,
      label: "Apply Healing",
      callback: html => {
        const input = html[0].querySelector("input[name='formula']");
        return input?.value?.trim();
      },
      rejectClose: true
    });

    if (!formula) return;

    if (/^\d+$/.test(formula)) {
      const amount = Number(formula);
      await this._applyHpDelta(actor, amount, { label: `Custom Healing (${amount})` });
      return;
    }

    await this._healRoll(actor, formula, { label: "Custom Healing" });
  }
}
