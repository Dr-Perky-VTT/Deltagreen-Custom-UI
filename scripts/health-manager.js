// health-manager.js
// RAW-focused health + willpower helper for Delta Green in Foundry.
// - Shows HP / WP for the controlled token (or user's assigned character)
// - Buttons for core RAW healing routines
// - Poison and disease helpers (Lethality + CON×5, recurring disease ticks)
// - Generic helpers for Lethality, fire, cold, suffocation, etc.
// - Simple access to physical flags: First Aid Attempted, Exhausted, Exhaustion Penalty, Wounds
// - RAW willpower recovery: sleep, motivation, exhaustion ticks

export class HealthManager {
  static initialized = false;
  static panelId = "dg-health-panel";

  /* ------------------------------------------------------------------------ */
  /* INIT                                                                     */
  /* ------------------------------------------------------------------------ */

  static init() {
    if (this.initialized) return;
    this.initialized = true;

    // Build the panel and sync with current actor
    this._createPanel();
    this.refresh();

    // Start hidden; DeltaGreenUI will call showForView(this.currentView)
    this.showForView(null);

    // Keep panel in sync with token / actor changes
    Hooks.on("controlToken", () => this.refresh());
    Hooks.on("updateActor", (actor) => {
      const current = this._getCurrentActor();
      if (current && actor.id === current.id) this.refresh();
    });
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
        LOGGED IN — NO AGENT SELECTED
      </span>
    </div>

    <div class="dg-health-layout">
      <!-- TWO-COLUMN BODY -->
      <div class="dg-health-columns">
        <!-- LEFT COLUMN: HEALING RAW + FLAGS -->
        <div class="dg-health-column dg-health-left">
	  <div class="dg-health-section">
            <div class="dg-section-subtitle">HEALING (RAW BUTTONS)</div>
<div class="dg-health-stat-line dg-button-row dg-health-hpwp-row">
  <button
    type="button"
    id="dg-health-hp-box"
    class="dg-button dg-hpwp-box"
    title="Left click: -1 HP | Right click: +1 HP"
  >
    HP: -- / --
  </button></div>
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

          <!-- INJURY / EXHAUSTION FLAGS -->
          <div class="dg-health-section">
            <div class="dg-section-subtitle">INJURY &amp; EXHAUSTION STATUS</div>

            <div class="dg-health-flags">
              <div class="dg-health-flag-row">
                <label class="dg-label">
                  <input
                    type="checkbox"
                    class="dg-health-flag-checkbox"
                    data-path="system.physical.firstAidAttempted"
                  />
                  FIRST AID ATTEMPTED
                </label>
              </div>

              <div class="dg-health-flag-row">
                <label class="dg-label">
                  <input
                    type="checkbox"
                    class="dg-health-flag-checkbox"
                    data-path="system.physical.exhausted"
                  />
                  EXHAUSTED
                </label>

                <div class="dg-health-exhaustion-penalty">
                  <label class="dg-label">Exhaustion Penalty</label>
                  <input
                    type="number"
                    class="dg-health-number-input"
                    data-path="system.physical.exhaustedPenalty"
                    min="-99"
                    max="0"
                  />
                </div>
              </div>

              <div class="dg-health-flag-row">
                <label class="dg-label">
                  <input
                    type="checkbox"
                    class="dg-health-flag-checkbox"
                    data-path="system.physical.diseaseLimitsHealing"
                  />
                  DISEASE LIMITS HEALING (no HP recovery while active)
                </label>
              </div>

              <div class="dg-health-wounds-block">
                <label class="dg-label">Wounds / Injury / Disease Notes</label>
                <textarea
                  class="dg-health-wounds-textarea"
                  data-path="system.physical.wounds"
                  rows="3"
                ></textarea>
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
                Poisons (Speed + Lethality + CON×5)
              </div>
              <div class="dg-button-row">
                <button
                  type="button"
                  class="dg-button"
                  data-action="poison-raw"
                >
                  POISON (RAW: LETHALITY + CON×5)
                </button>
              </div>
            </div>

            <div class="dg-subsection">
              <div class="dg-subtitle">
                Diseases (CON×5 vs Damage per Speed Interval)
              </div>
              <div class="dg-button-row">
                <button
                  type="button"
                  class="dg-button"
                  data-action="disease-tick"
                >
                  DISEASE TICK (RAW CON×5)
                </button>
              </div>
            </div>

            <div class="dg-subsection">
              <div class="dg-subtitle">
                Generic Lethality (fire, explosions, falls, etc.)
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

         

          <!-- Small RAW box for WP recovery / exhaustion -->
          <div class="dg-health-section">
            <div class="dg-section-subtitle">
              WILLPOWER RECOVERY &amp; EXHAUSTION (RAW)
            </div>
<div class="dg-health-stat-line dg-button-row dg-health-hpwp-row">

  <button
    type="button"
    id="dg-health-wp-box"
    class="dg-button dg-hpwp-box"
    title="Left click: -1 WP | Right click: +1 WP"
  >
    WP: -- / --
  </button>
</div>
            <div class="dg-subsection">
              <div class="dg-subtitle">
                Full Night's Sleep (once per 24 hours)
              </div>
              <div class="dg-button-row">
                <button
                  type="button"
                  class="dg-button"
                  data-action="wp-sleep"
                >
                  FULL NIGHT'S SLEEP (1D6 WP &amp; cure exhaustion)
                </button>
              </div>
            </div>

            <div class="dg-subsection">
              <div class="dg-subtitle">
                Personal Motivation (played compellingly)
              </div>
              <div class="dg-button-row">
                <button
                  type="button"
                  class="dg-button"
                  data-action="wp-motivation"
                >
                  MOTIVATION: +1 WP
                </button>
              </div>
            </div>

            <div class="dg-subsection">
              <div class="dg-subtitle">
                Exhaustion Tick (night without sleep / pushing too hard)
              </div>
              <div class="dg-button-row">
                <button
                  type="button"
                  class="dg-button"
                  data-action="wp-exhaustion-tick"
                >
                  EXHAUSTION TICK (1D6 WP LOSS &amp; mark exhausted)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div> <!-- /.dg-health-columns -->

      <!-- STAT / SKILL BAR FOR HEALING-RELATED ROLLS -->
      <div class="dg-mail-skillbar dg-mail-statbar">
        <button class="dg-button dg-skill-roll-btn" data-skill="first_aid">
          FIRST AID
        </button>
        <button class="dg-button dg-skill-roll-btn" data-skill="medicine">
          MEDICINE
        </button>
        <button class="dg-button dg-skill-roll-btn" data-skill="pharmacy">
          PHARMACY
        </button>
        <button class="dg-button dg-skill-roll-btn" data-skill="surgery">
          SURGERY
        </button>
        <button class="dg-button dg-stat-roll-btn" data-stat="con">
          CONSTITUTION
        </button>
      </div>

    </div>   <!-- /.dg-health-layout -->
  </div>
</div>
    `;

    container.appendChild(wrapper);
    this._activateListeners(wrapper);
  }

  static _activateListeners(html) {
    // Button actions for healing / damage / WP / lethality / poisons / diseases
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

        /* Other threats: poisons, diseases, lethality, environment */
        case "poison-raw":
          await this._handlePoison(actor);
          break;

        case "disease-tick":
          await this._handleDiseaseTick(actor);
          break;

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

        /* Willpower quick adjust + RAW helpers */
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

        case "wp-sleep":
          await this._wpSleep(actor);
          break;
        case "wp-motivation":
          await this._wpMotivation(actor);
          break;
        case "wp-exhaustion-tick":
          await this._wpExhaustionTick(actor);
          break;
      }
    });

    // HP / WP quick buttons in the health summary (LMB -1, RMB +1)
    const hpBox = html.querySelector("#dg-health-hp-box");
    if (hpBox) {
      hpBox.addEventListener("click", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const actor = this._getCurrentActor();
        if (!actor) {
          ui.notifications?.warn("No controlled token / actor found.");
          return;
        }
        await this._nudgeHp(actor, -1); // LMB = -1 HP
      });

      hpBox.addEventListener("contextmenu", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const actor = this._getCurrentActor();
        if (!actor) {
          ui.notifications?.warn("No controlled token / actor found.");
          return;
        }
        await this._nudgeHp(actor, +1); // RMB = +1 HP
      });
    }

    const wpBox = html.querySelector("#dg-health-wp-box");
    if (wpBox) {
      wpBox.addEventListener("click", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const actor = this._getCurrentActor();
        if (!actor) {
          ui.notifications?.warn("No controlled token / actor found.");
          return;
        }
        await this._nudgeWp(actor, -1); // LMB = -1 WP
      });

      wpBox.addEventListener("contextmenu", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const actor = this._getCurrentActor();
        if (!actor) {
          ui.notifications?.warn("No controlled token / actor found.");
          return;
        }
        await this._nudgeWp(actor, +1); // RMB = +1 WP
      });
    }

    // Changes to checkboxes / number inputs / textarea for physical flags
    html.addEventListener("change", async (ev) => {
      const target = ev.target;
      if (!target) return;

      const path = target.dataset?.path;
      if (!path) return;

      const actor = this._getCurrentActor();
      if (!actor) {
        ui.notifications?.warn("No controlled token / actor found.");
        return;
      }

      let value;
      if (target.type === "checkbox") {
        value = target.checked;
      } else if (target.type === "number") {
        value = Number(target.value || 0);
        if (Number.isNaN(value)) value = 0;
      } else {
        // textarea / text
        value = target.value;
      }

      const updates = {};
      updates[path] = value;

      try {
        await actor.update(updates);
      } catch (err) {
        console.error("Delta Green UI | HealthManager flag update error:", err);
        ui.notifications?.error("Error updating physical status.");
      }

      // If exhausted flag changed, re-sync penalty enabled/disabled
      if (path === "system.physical.exhausted") {
        this.refresh();
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
    const hpBox = panel.querySelector("#dg-health-hp-box");
    const wpBox = panel.querySelector("#dg-health-wp-box");

    const faCheckbox = panel.querySelector(
      'input.dg-health-flag-checkbox[data-path="system.physical.firstAidAttempted"]'
    );
    const exCheckbox = panel.querySelector(
      'input.dg-health-flag-checkbox[data-path="system.physical.exhausted"]'
    );
    const diseaseCheckbox = panel.querySelector(
      'input.dg-health-flag-checkbox[data-path="system.physical.diseaseLimitsHealing"]'
    );
    const exPenaltyInput = panel.querySelector(
      'input.dg-health-number-input[data-path="system.physical.exhaustedPenalty"]'
    );
    const woundsTextarea = panel.querySelector(
      '.dg-health-wounds-textarea[data-path="system.physical.wounds"]'
    );

    const resetHpWpBox = (el, label) => {
      if (!el) return;
      el.textContent = `${label}: -- / --`;
      el.classList.remove("dg-hpwp-good", "dg-hpwp-warn", "dg-hpwp-bad");
    };

    if (!actor) {
      if (nameField) nameField.textContent = "LOGGED IN: NO AGENT SELECTED";
      if (inlineName) inlineName.textContent = "—";

      resetHpWpBox(hpBox, "HP");
      resetHpWpBox(wpBox, "WP");

      if (faCheckbox) faCheckbox.checked = false;
      if (exCheckbox) exCheckbox.checked = false;
      if (diseaseCheckbox) diseaseCheckbox.checked = false;
      if (exPenaltyInput) {
        exPenaltyInput.value = "";
        exPenaltyInput.disabled = true;
      }
      if (woundsTextarea) woundsTextarea.value = "";

      return;
    }

    const { hpCurrent, hpMaximum } = this._getHpData(actor);
    const { wpCurrent, wpMaximum } = this._getWpData(actor);

    // Use only the 3rd and 4th word of the actor name when available
    const rawName = actor.name ?? "—";
    let actorName = rawName;

    if (typeof rawName === "string") {
      const parts = rawName.trim().split(/\s+/);
      if (parts.length >= 3) {
        // words 3 and 4 (indexes 2 and 3)
        const slice = parts.slice(2, 4);
        actorName = slice.join(" ");
      }
    }

    if (nameField) nameField.textContent = `LOGGED IN: ${actorName}`;
    if (inlineName) inlineName.textContent = actorName;

    const updateHpWpBox = (el, label, cur, max) => {
      if (!el) return;

      el.classList.remove("dg-hpwp-good", "dg-hpwp-warn", "dg-hpwp-bad");

      const curNum = Number(cur);
      const maxNum = Number(max);

      if (!Number.isFinite(curNum) || !Number.isFinite(maxNum) || maxNum <= 0) {
        el.textContent = `${label}: -- / --`;
        return;
      }

      el.textContent = `${label}: ${curNum}/${maxNum}`;

      const ratio = Math.max(0, Math.min(1, curNum / maxNum));
      if (ratio > 0.8) {
        el.classList.add("dg-hpwp-good");
      } else if (ratio > 0.4) {
        el.classList.add("dg-hpwp-warn");
      } else {
        el.classList.add("dg-hpwp-bad");
      }
    };

    updateHpWpBox(hpBox, "HP", hpCurrent, hpMaximum);
    updateHpWpBox(wpBox, "WP", wpCurrent, wpMaximum);

    const phys = actor.system?.physical ?? {};

    if (faCheckbox) {
      faCheckbox.checked = !!phys.firstAidAttempted;
    }

    const exhausted = !!phys.exhausted;
    if (exCheckbox) {
      exCheckbox.checked = exhausted;
    }

    if (diseaseCheckbox) {
      diseaseCheckbox.checked = !!phys.diseaseLimitsHealing;
    }

    if (exPenaltyInput) {
      const penalty = phys.exhaustedPenalty ?? 0;
      exPenaltyInput.value = penalty;
      exPenaltyInput.disabled = !exhausted;
    }

    if (woundsTextarea) {
      woundsTextarea.value = phys.wounds ?? "";
    }
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

  /* --- HP / WP / CON data paths ------------------------------------------ */

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
      hpCurrent: foundry.utils.getProperty(actor, "system.hp.value"),
      hpMaximum: foundry.utils.getProperty(actor, "system.hp.max"),
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
      wpCurrent: foundry.utils.getProperty(actor, "system.wp.value"),
      wpMaximum: foundry.utils.getProperty(actor, "system.wp.max"),
      wpPath: "system.wp.value",
      wpMaxPath: "system.wp.max"
    };
  }

  static _getConX5(actor) {
    const con = actor.system?.statistics?.con;
    if (!con) return 50;
    const raw = Number(con.x5 ?? (con.value != null ? con.value * 5 : 0));
    if (!Number.isFinite(raw) || raw <= 0) return 50;
    return raw;
  }

  /* --- HP / WP mutation --------------------------------------------------- */

  // Silent HP nudge (LMB/RMB) like MailSystem._adjustHp, no chat output.
  static async _nudgeHp(actor, delta) {
    try {
      const { hpCurrent, hpMaximum, hpPath, hpMaxPath } = this._getHpData(actor);
      if (hpCurrent === undefined || !hpPath) {
        ui.notifications?.error("Could not find HP field on actor.");
        return;
      }

      const curRaw = Number(hpCurrent ?? 0);
      const maxRaw = Number(
        hpMaximum ??
          foundry.utils.getProperty(actor, hpMaxPath) ??
          curRaw
      );

      const cur = Number.isFinite(curRaw) ? curRaw : 0;
      const max =
        Number.isFinite(maxRaw) && maxRaw > 0
          ? maxRaw
          : cur + Math.max(delta, 0);

      let next = cur + delta;
      if (max > 0) next = Math.min(next, max);
      next = Math.max(0, next);

      await actor.update({ [hpPath]: next });
      this.refresh();
    } catch (err) {
      console.error("Delta Green UI | HealthManager._nudgeHp error:", err);
      ui.notifications?.error("Error adjusting HP.");
    }
  }

  // Silent WP nudge (LMB/RMB) like MailSystem._adjustWp, no chat output.
  static async _nudgeWp(actor, delta) {
    try {
      const { wpCurrent, wpMaximum, wpPath, wpMaxPath } = this._getWpData(actor);
      if (wpCurrent === undefined || !wpPath) {
        ui.notifications?.error("Could not find WP field on actor.");
        return;
      }

      const curRaw = Number(wpCurrent ?? 0);
      const maxRaw = Number(
        wpMaximum ??
          foundry.utils.getProperty(actor, wpMaxPath) ??
          curRaw
      );

      const cur = Number.isFinite(curRaw) ? curRaw : 0;
      const max =
        Number.isFinite(maxRaw) && maxRaw > 0
          ? maxRaw
          : cur + Math.max(delta, 0);

      let next = cur + delta;
      if (max > 0) next = Math.min(next, max);
      next = Math.max(0, next);

      await actor.update({ [wpPath]: next });
      this.refresh();
    } catch (err) {
      console.error("Delta Green UI | HealthManager._nudgeWp error:", err);
      ui.notifications?.error("Error adjusting WP.");
    }
  }

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
    const oldVal = wpCurrent;
    const newVal = foundry.utils.clamp(wpCurrent + delta, 0, max);

    await actor.update({ [wpPath]: newVal });

    const speaker = ChatMessage.getSpeaker({ actor });

    await ChatMessage.create({
      user: game.user.id,
      speaker,
      content: `<strong>${label}</strong>: WP ${oldVal} &rarr; ${newVal} (Δ ${delta > 0 ? "+" : ""}${delta})`
    });

    // RAW reminders for low WP / 0 WP
    const notes = [];

    // Dropping to 0 WP
    if (oldVal > 0 && newVal === 0) {
      notes.push(
        "RAW: At 0 WP the Agent loses all control. The Handler controls the Agent and they cannot succeed at any tests, including SAN, until WP is at least 1. Sooner or later the Agent falls asleep long enough to regain WP."
      );
    }

    // Climbing back above 0 WP
    if (oldVal === 0 && newVal > 0) {
      notes.push(
        "RAW: WP has risen above 0. The Handler may return control of the Agent once the immediate breakdown resolves."
      );
    }

    // Hitting the 1–2 WP breakdown band
    if (oldVal > 2 && newVal > 0 && newVal <= 2) {
      notes.push(
        "RAW: WP 1–2 — the Agent has an emotional breakdown and suffers a -20% penalty to all actions until WP rises above 2."
      );
    }

    // Climbing out of the 1–2 WP band
    if (oldVal <= 2 && newVal > 2) {
      notes.push(
        "RAW: WP is now above 2. The emotional breakdown penalty (-20% to all actions) no longer applies."
      );
    }

    if (notes.length) {
      await ChatMessage.create({
        user: game.user.id,
        speaker,
        content: `<div class="dg-roll-result"><strong>Willpower Status (RAW)</strong><ul>${notes
          .map((n) => `<li>${n}</li>`)
          .join("")}</ul></div>`,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
      });
    }

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
  /* WILLPOWER: RECOVERY & EXHAUSTION (RAW)                                   */
  /* ------------------------------------------------------------------------ */

  static async _wpSleep(actor) {
    // Full night's sleep: 1D6 WP, cures exhaustion.
    const roll = await (new Roll("1d6")).evaluate({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: "Full Night's Sleep (RAW: regain 1D6 WP)"
    });

    const amount = Number(roll.total) || 0;
    if (amount > 0) {
      await this._applyWpDelta(actor, amount, {
        label: "Full Night's Sleep"
      });
    }

    // RAW: a full night's sleep cures exhaustion.
    try {
      await actor.update({
        "system.physical.exhausted": false,
        "system.physical.exhaustedPenalty": 0
      });
    } catch (err) {
      console.error("Delta Green UI | Error clearing exhaustion on sleep:", err);
    }

    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      content:
        "<strong>Full Night's Sleep</strong>: Exhaustion cured (RAW).",
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });

    this.refresh();
  }

  static async _wpMotivation(actor) {
    // Playing up a personal motivation: +1 WP
    await this._applyWpDelta(actor, +1, {
      label: "Personal Motivation (RAW +1 WP)"
    });

    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      content:
        "<p><strong>Personal Motivation</strong>: RAW, when an Agent plays up a motivation in a way the Handler finds compelling, they regain 1 WP.</p>",
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
  }

  static async _wpExhaustionTick(actor) {
    // Exhaustion episode: 1D6 WP loss, mark exhausted.
    const roll = await (new Roll("1d6")).evaluate({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: "Exhaustion Tick (RAW: lose 1D6 WP)"
    });

    const amount = Number(roll.total) || 0;
    if (amount > 0) {
      await this._applyWpDelta(actor, -amount, {
        label: "Exhaustion Tick"
      });
    }

    try {
      await actor.update({
        "system.physical.exhausted": true
        // Penalty (-10% / -20%) is still Handler choice; set manually in the box.
      });
    } catch (err) {
      console.error("Delta Green UI | Error marking exhausted:", err);
    }

    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      content:
        "<p><strong>Exhaustion</strong>: RAW, an exhausted Agent loses 1D6 WP and may suffer a -10% or -20% penalty to all skills, stat tests, and SAN tests at the Handler's discretion. A further night without sleep can trigger another exhaustion tick. A full night's sleep cures exhaustion.</p>",
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });

    this.refresh();
  }

  /* ------------------------------------------------------------------------ */
  /* LETHALITY (GENERIC)                                                      */
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
    let damage;

    if (total >= 100) {
      // Treat 100 as 20 (two tens) for HP conversion
      damage = 20;
    } else {
      const tens = Math.floor(total / 10);
      const ones = total % 10;
      damage = tens + ones;
    }

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

  /* ------------------------------------------------------------------------ */
  /* POISONS (RAW: LETHALITY + CON×5)                                         */
  /* ------------------------------------------------------------------------ */

  static async _handlePoison(actor) {
    const data = await Dialog.prompt({
      title: "Poison (RAW: Lethality + CON×5)",
      content: `
        <div style="display:flex;flex-direction:column;gap:6px;">
          <label>
            Lethality % (e.g. 5, 10, 20):
            <input type="number" name="lethality" value="10" min="1" max="100" style="width:100%;" />
          </label>
          <label>
            Additional modifier to CON×5 (e.g. -20, 0, +20):
            <input type="number" name="conMod" value="0" style="width:100%;" />
          </label>
          <label>
            <input type="checkbox" name="hospitalized" />
            Victim is hospitalized (+20% to CON×5)
          </label>
          <label>
            Antidote timing:
            <select name="antidote" style="width:100%;">
              <option value="none">None / not available</option>
              <option value="before">Given before it takes effect (neutralizes poison)</option>
              <option value="after">Given after it takes effect (halves Lethality &amp; HP damage)</option>
            </select>
          </label>
        </div>
      `,
      label: "Resolve Poison",
      callback: html => {
        const lethality = html[0].querySelector("input[name='lethality']")?.value;
        const conMod = html[0].querySelector("input[name='conMod']")?.value;
        const hospitalized = html[0].querySelector("input[name='hospitalized']")?.checked;
        const antidote = html[0].querySelector("select[name='antidote']")?.value || "none";
        return { lethality, conMod, hospitalized, antidote };
      },
      rejectClose: true
    });

    if (!data) return;

    let lethality = Number(data.lethality ?? 0);
    if (!Number.isNaN(lethality) && lethality <= 0) lethality = 0;
    if (Number.isNaN(lethality) || lethality <= 0) {
      ui.notifications?.error("Invalid Lethality rating.");
      return;
    }

    const baseLethality = lethality;
    const conMod = Number(data.conMod ?? 0) || 0;
    const hospitalized = !!data.hospitalized;
    const antidote = data.antidote || "none";

    const speaker = ChatMessage.getSpeaker({ actor });

    // RAW: antidote before effect = harmless
    if (antidote === "before") {
      await ChatMessage.create({
        user: game.user.id,
        speaker,
        content:
          "<p><strong>Poison Neutralized</strong>: RAW, a correct antidote given before the poison takes effect renders it harmless. No Lethality roll or CON test required.</p>",
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
      });
      return;
    }

    // Antidote after effect halves Lethality and HP damage
    let lethalityEffective = baseLethality;
    let hpDamageMultiplier = 1;
    if (antidote === "after") {
      lethalityEffective = Math.max(1, Math.floor(baseLethality / 2));
      hpDamageMultiplier = 0.5;
    }

    const lethRoll = await (new Roll("1d100")).evaluate({ async: true });
    const lethTotal = Number(lethRoll.total) || 0;

    await lethRoll.toMessage({
      speaker,
      flavor: `Poison Lethality ${baseLethality}% (effective ${lethalityEffective}%)`
    });

    // Instant kill if Lethality roll succeeds
    if (lethTotal <= lethalityEffective) {
      await this._applyHpDelta(actor, -9999, {
        label: `Poison Lethality Hit (${baseLethality}%)`
      });

      const notes = [];
      notes.push(
        `Lethality roll ${lethTotal} ≤ ${lethalityEffective}%: RAW, the poison is immediately lethal.`
      );
      if (antidote === "after") {
        notes.push(
          "Antidote was given after the poison took effect, but the Lethality roll still succeeded."
        );
      }

      await ChatMessage.create({
        user: game.user.id,
        speaker,
        content: `<div class="dg-roll-result"><strong>Poison (RAW)</strong><ul>${notes
          .map((n) => `<li>${n}</li>`)
          .join("")}</ul></div>`,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
      });

      return;
    }

    // Lethality failed → convert to HP damage and make CON×5 test
    let baseDamage;
    if (lethTotal >= 100) {
      baseDamage = 20;
    } else {
      const tens = Math.floor(lethTotal / 10);
      const ones = lethTotal % 10;
      baseDamage = tens + ones;
    }

    // Antidote after effect: HP damage is halved (we'll apply multiplier later)
    let hpDamage = baseDamage;

    const conBase = this._getConX5(actor);
    let conTarget = conBase + conMod + (hospitalized ? 20 : 0);
    conTarget = foundry.utils.clamp(conTarget, 0, 200);

    const conRoll = await (new Roll("1d100")).evaluate({ async: true });
    const conTotal = Number(conRoll.total) || 0;

    await conRoll.toMessage({
      speaker,
      flavor: `Poison CON×5 test (target ${conTarget}%)`
    });

    const isSuccess = conTotal <= conTarget;
    const isDouble = conTotal % 11 === 0 && conTotal !== 0 && conTotal !== 100;
    const isCritSuccess = conTotal === 1 || (isDouble && isSuccess);
    const isCritFailure = conTotal === 100 || (isDouble && !isSuccess);

    let finalDamage;
    let outcomeText;

    if (isCritSuccess) {
      // Critical success → only 1 HP
      finalDamage = 1;
      outcomeText = "Critical Success: victim loses only 1 HP and throws off the poison.";
    } else if (isSuccess) {
      // Success → half damage
      finalDamage = Math.max(1, Math.ceil(hpDamage / 2));
      outcomeText =
        "Success: victim suffers half damage from the poison and throws it off.";
    } else if (isCritFailure) {
      // Fumble → double damage
      finalDamage = hpDamage * 2;
      outcomeText =
        "Fumble: victim suffers double damage from the poison.";
    } else {
      // Normal failure → full damage
      finalDamage = hpDamage;
      outcomeText =
        "Failure: victim suffers full damage from the poison.";
    }

    // Apply antidote-after HP halving if present
    if (hpDamageMultiplier !== 1) {
      finalDamage = Math.max(1, Math.round(finalDamage * hpDamageMultiplier));
    }

    await this._applyHpDelta(actor, -finalDamage, {
      label: "Poison Damage (RAW)"
    });

    const notes = [];
    notes.push(
      `Lethality roll ${lethTotal} > ${lethalityEffective}% → no instant kill; base HP damage = ${baseDamage}.`
    );
    notes.push(
      `CON×5 base ${conBase}% + modifier ${conMod >= 0 ? "+" : ""}${conMod}${
        hospitalized ? " +20% (hospitalized)" : ""
      } = ${conTarget}%.`
    );
    notes.push(
      `CON×5 roll = ${conTotal} → ${outcomeText}`
    );
    if (antidote === "after") {
      notes.push(
        "Antidote after effect: RAW, Lethality rating and HP damage are halved; this has been applied to the final HP loss."
      );
    }

    await ChatMessage.create({
      user: game.user.id,
      speaker,
      content: `<div class="dg-roll-result"><strong>Poison Resolution (RAW)</strong><ul>${notes
        .map((n) => `<li>${n}</li>`)
        .join("")}</ul></div>`,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
  }

  /* ------------------------------------------------------------------------ */
  /* DISEASES (RAW: CON×5 vs recurring damage)                                */
  /* ------------------------------------------------------------------------ */

  static async _handleDiseaseTick(actor) {
    const data = await Dialog.prompt({
      title: "Disease Tick (RAW CON×5)",
      content: `
        <div style="display:flex;flex-direction:column;gap:6px;">
          <label>
            Damage per interval (e.g. <code>1d4</code>, <code>1d6</code>):
            <input type="text" name="damage" value="1d6" style="width:100%;" />
          </label>
          <label>
            CON×5 penalty (e.g. -40, -20, 0):
            <input type="number" name="conPenalty" value="0" style="width:100%;" />
          </label>
          <label>
            Speed description (e.g. <code>1D6 days</code>):
            <input type="text" name="speed" value="1D6 days" style="width:100%;" />
          </label>
          <label>
            <input type="checkbox" name="hospitalized" />
            Patient is hospitalized (+20% to CON×5)
          </label>
          <label>
            <input type="checkbox" name="persistent" />
            Persistent disease (e.g. HIV/AIDS – success only buys time)
          </label>
          <label>
            Symptoms / notes (optional):
            <textarea name="symptoms" rows="2" style="width:100%;"></textarea>
          </label>
        </div>
      `,
      label: "Resolve Disease Tick",
      callback: html => {
        const damage = html[0].querySelector("input[name='damage']")?.value;
        const conPenalty = html[0].querySelector("input[name='conPenalty']")?.value;
        const speed = html[0].querySelector("input[name='speed']")?.value;
        const hospitalized = html[0].querySelector("input[name='hospitalized']")?.checked;
        const persistent = html[0].querySelector("input[name='persistent']")?.checked;
        const symptoms = html[0].querySelector("textarea[name='symptoms']")?.value;
        return { damage, conPenalty, speed, hospitalized, persistent, symptoms };
      },
      rejectClose: true
    });

    if (!data) return;

    const damageFormula = (data.damage || "1d6").trim();
    const conPenalty = Number(data.conPenalty ?? 0) || 0;
    const speed = (data.speed || "").trim();
    const hospitalized = !!data.hospitalized;
    const persistent = !!data.persistent;
    const symptoms = (data.symptoms || "").trim();

    const speaker = ChatMessage.getSpeaker({ actor });

    // Roll CON×5
    const conBase = this._getConX5(actor);
    let conTarget = conBase + conPenalty + (hospitalized ? 20 : 0);
    conTarget = foundry.utils.clamp(conTarget, 0, 200);

    const conRoll = await (new Roll("1d100")).evaluate({ async: true });
    const conTotal = Number(conRoll.total) || 0;

    await conRoll.toMessage({
      speaker,
      flavor: `Disease CON×5 test (target ${conTarget}%)`
    });

    const isSuccess = conTotal <= conTarget;
    const isDouble = conTotal % 11 === 0 && conTotal !== 0 && conTotal !== 100;
    const isCritSuccess = conTotal === 1 || (isDouble && isSuccess);
    const isCritFailure = conTotal === 100 || (isDouble && !isSuccess);

    // Roll base damage
    let baseDamage = 0;
    let dmgRoll = null;

    if (/^\d+$/.test(damageFormula)) {
      baseDamage = Number(damageFormula);
    } else {
      dmgRoll = await (new Roll(damageFormula)).evaluate({ async: true });
      baseDamage = Number(dmgRoll.total) || 0;
      await dmgRoll.toMessage({
        speaker,
        flavor: `Disease Damage (${damageFormula})`
      });
    }

    let finalDamage = baseDamage;
    let outcomeText;
    let recoveredNow = false;

    if (isCritSuccess) {
      finalDamage = 0;
      outcomeText =
        "Critical Success: RAW, the Agent suffers no damage from this interval and throws off the disease.";
      recoveredNow = true;
    } else if (isSuccess) {
      finalDamage = Math.max(0, Math.ceil(baseDamage / 2));
      outcomeText =
        "Success: RAW, the Agent suffers half damage from this interval and throws off the disease.";
      recoveredNow = true;
    } else if (isCritFailure) {
      finalDamage = baseDamage * 2;
      outcomeText =
        "Fumble: RAW, the Agent suffers double damage from this interval and must test again after another Speed interval.";
    } else {
      finalDamage = baseDamage;
      outcomeText =
        "Failure: RAW, the Agent suffers full damage from this interval and must test again after another Speed interval.";
    }

    if (finalDamage > 0) {
      await this._applyHpDelta(actor, -finalDamage, {
        label: "Disease Damage (RAW)"
      });
    }

    const notes = [];
    notes.push(
      `CON×5 base ${conBase}% + penalty ${conPenalty >= 0 ? "+" : ""}${conPenalty}${
        hospitalized ? " +20% (hospitalized)" : ""
      } = ${conTarget}%.`
    );
    notes.push(`CON×5 roll = ${conTotal} → ${outcomeText}`);
    if (speed) {
      notes.push(
        `Speed: ${speed}. RAW, on a failed test you repeat this CON×5 test and damage roll after another Speed interval.`
      );
    }
    if (symptoms) {
      notes.push(`Symptoms / notes: ${symptoms}`);
    }
    if (persistent) {
      notes.push(
        "Persistent disease: RAW, success only buys time. The disease can resurge whenever the Agent is badly hurt (more than half HP lost) or suffers another poison or disease; make another CON×5 test then."
      );
    }

    await ChatMessage.create({
      user: game.user.id,
      speaker,
      content: `<div class="dg-roll-result"><strong>Disease Tick (RAW)</strong><ul>${notes
        .map((n) => `<li>${n}</li>`)
        .join("")}</ul></div>`,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
  }
}
