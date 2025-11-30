// mail-system.js
import { DeltaGreenUI } from "./delta-green-ui.js";
import { WeaponSoundManager } from "./sound-manager.js";

// v12+ compatibility: prefer CHAT_MESSAGE_STYLES; fallback to CHAT_MESSAGE_TYPES on older Foundry
const CHAT_STYLES = CONST.CHAT_MESSAGE_STYLES ?? CONST.CHAT_MESSAGE_TYPES;

export class MailSystem {
  static messages = [];
  static currentModifier = 0; // one-shot modifier: -40, -20, 0, +20, +40
  static showSkillNumbers = true;

  // Batched refresh / debounce helpers
  static _actorRefreshTimeout = null;
  static _pendingActorRefreshActor = null;
  static _loadMessagesTimeout = null;
  static _lastActorId = null;

  /* ------------------------------------------------------------------------ */
  /* INIT + LAYOUT                                                            */
  /* ------------------------------------------------------------------------ */

  static init() {
    console.log("Delta Green UI | Initializing mail system");

    // Restore per-user preference for showing skill/stat percentages
    try {
      const saved = game.user?.getFlag?.(DeltaGreenUI.ID, "showSkillNumbers");
      if (typeof saved === "boolean") {
        MailSystem.showSkillNumbers = saved;
      }
    } catch (e) {
      console.warn(
        "Delta Green UI | Could not restore showSkillNumbers flag",
        e
      );
    }

    Hooks.on("renderDeltaGreenUI", () => {
      try {
        this.loadMessages();
        this.refreshSkillHotbar();
        this.refreshStatButtons();
        this.refreshTypedSkillButtons();
        this.refreshModifierButtons();
        this.refreshWeaponHotbar();
        this.ensureSanButton();
        this.refreshHpWpPanel();
        this._refreshSanButtonStatus();
        this._updateMailHeaderActorName();
        this._enableScrollableMailLayout();
      } catch (err) {
        console.error(
          "Delta Green UI | Error in renderDeltaGreenUI hook:",
          err
        );
      }
    });

    Hooks.on("controlToken", (token, controlled) => {
      try {
        // Only react when a token becomes controlled, not when it's released
        if (!controlled) return;

        // Just schedule a refresh instead of doing everything immediately
        this._scheduleActorRefresh(token?.actor || null);
      } catch (err) {
        console.error("Delta Green UI | Error in controlToken hook:", err);
      }
    });

    Hooks.on("updateActor", (actor) => {
      try {
        // Debounced actor refresh instead of hammering every time
        this._scheduleActorRefresh(actor);
      } catch (err) {
        console.error("Delta Green UI | Error in updateActor hook:", err);
      }
    });

    // v13+ chat hook (HTMLElement instead of jQuery)
    Hooks.on("renderChatMessageHTML", (message, html, data) => {
      const $html = html instanceof jQuery ? html : $(html);
      this.renderChatMessage(message, $html, data);
    });

    this.initEvents();
  }

  static _enableScrollableMailLayout() {
    // Inject styles in case your CSS file isn't easy to change
    if (!document.getElementById("dg-mail-scroll-styles")) {
      const style = document.createElement("style");
      style.id = "dg-mail-scroll-styles";
      style.textContent = `
        .dg-mail-panel, #dg-mail-pane {
          display:flex;
          flex-direction:column;
          max-height:100vh;
          overflow:hidden;
          min-height:0;
        }
        .dg-mail-panel * { min-height:0; }

        #dg-messages-container {
          flex:1 1 auto;
          min-height:0;
          overflow-y:auto;
          padding:8px 12px 12px;
        }

        .dg-mail-inputbar {
          position:sticky;
          bottom:0;
          z-index:2;
          background:#000;
          border-top:1px solid #0f0;
          padding:8px 12px;
        }

        #dg-message-input {
          width:100%;
          max-height:100vh;
          overflow-y:auto;
          resize:vertical;
        }
      `;
      document.head.appendChild(style);
    }

    // Mobile viewport “100vh” fix (also helps some desktop window managers)
    const setVH = () => {
      document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`
      );
    };
    setVH();
    window.addEventListener("resize", setVH);

    // When input focuses, keep it visible on small displays / on-screen keyboard
    $(document).off("focus.dgMail", "#dg-message-input");
    $(document).on("focus.dgMail", "#dg-message-input", () => {
      const input = document.getElementById("dg-message-input");
      if (!input) return;
      setTimeout(
        () => input.scrollIntoView({ block: "end", behavior: "smooth" }),
        0
      );
    });

    // Auto-stick to bottom when new messages come in (unless the user scrolled up)
    const container = document.getElementById("dg-messages-container");
    if (container) {
      const stickToBottom = () => {
        const nearBottom =
          container.scrollHeight -
            container.scrollTop -
            container.clientHeight <
          80;
        if (nearBottom) container.scrollTop = container.scrollHeight;
      };

      const observer = new MutationObserver(stickToBottom);
      observer.observe(container, { childList: true, subtree: true });
    }
  }

  /* ------------------------------------------------------------------------ */
  /* DOM EVENTS                                                               */
  /* ------------------------------------------------------------------------ */

  static initEvents() {
    // Enter to send (Shift+Enter = newline)
    $(document).off("keypress", "#dg-message-input");
    $(document).on("keypress", "#dg-message-input", async (e) => {
      if (e.which === 13 && !e.shiftKey) {
        e.preventDefault();
        const content = $("#dg-message-input").val();
        await this.processMessage(content);
        $("#dg-message-input").val("");
      }
    });

    // Skill roll buttons
    $(document).off("click", ".dg-skill-roll-btn");
    $(document).on("click", ".dg-skill-roll-btn", async (ev) => {
      const uiKey = $(ev.currentTarget).data("skill");
      if (!uiKey) return;
      await this.rollSystemSkill(uiKey);
    });

    // Stat / LUCK buttons
    $(document).off("click", ".dg-stat-roll-btn");
    $(document).on("click", ".dg-stat-roll-btn", async (ev) => {
      const statKey = $(ev.currentTarget).data("stat");
      if (!statKey) return;
      await this.rollStatOrLuck(statKey);
    });

    $(document).off("click", "#dg-luck-roll-btn");
    $(document).on("click", "#dg-luck-roll-btn", async () => {
      await this.rollStatOrLuck("luck");
    });

    // Modifier buttons
    $(document).off("click", ".dg-mod-btn");
    $(document).on("click", ".dg-mod-btn", (ev) => {
      const $btn = $(ev.currentTarget);
      const modVal = Number($btn.data("mod") ?? 0);
      this.setModifier(modVal);
    });

    // Weapon buttons
    $(document)
      .off("click.dgWeaponRoll", ".dg-weapon-btn")
      .on("click.dgWeaponRoll", ".dg-weapon-btn", async (ev) => {
        ev.preventDefault();
        const btn = ev.currentTarget;
        const id = btn.dataset.weaponId;
        if (!id) return;

        // Read the current mode from the button
        const mode = btn.dataset.fireMode === "auto" ? "auto" : "semi";

        await this.rollWeaponAttack(id, { mode });
      });

    // Right-click on a weapon button toggles SEMI/AUTO for firearms only
    $(document)
      .off("contextmenu.dgWeaponMode", ".dg-weapon-btn")
      .on("contextmenu.dgWeaponMode", ".dg-weapon-btn", (ev) => {
        ev.preventDefault();
        const btn = ev.currentTarget;

        // If this button doesn't have a fire mode, it's melee/grenade/artillery → ignore
        if (!btn.dataset.fireMode) return;

        const current = btn.dataset.fireMode === "auto" ? "auto" : "semi";
        const next = current === "auto" ? "semi" : "auto";

        btn.dataset.fireMode = next;

        const modeTag = btn.querySelector(".dg-weapon-mode-tag");
        if (modeTag) {
          modeTag.textContent = next === "auto" ? "[AUTO]" : "[SEMI]";
        }
      });

    // SAN CHECK button in mail header (backup; ensureSanButton also wires it)
    $(document).off("click", "#dg-san-check-btn");
    $(document).on("click", "#dg-san-check-btn", async (ev) => {
      ev.preventDefault();
      await this.runSanCheckDialogMacro();
    });

    // HP / WP click handlers (LMB = -1, RMB = +1)
    $(document).off("click", "#dg-hp-box");
    $(document).on("click", "#dg-hp-box", async (ev) => {
      ev.preventDefault();
      await this._adjustHp(-1);
    });

    $(document).off("contextmenu", "#dg-hp-box");
    $(document).on("contextmenu", "#dg-hp-box", async (ev) => {
      ev.preventDefault();
      await this._adjustHp(1);
    });

    $(document).off("click", "#dg-wp-box");
    $(document).on("click", "#dg-wp-box", async (ev) => {
      ev.preventDefault();
      await this._adjustWp(-1);
    });

    $(document).off("contextmenu", "#dg-wp-box");
    $(document).on("contextmenu", "#dg-wp-box", async (ev) => {
      ev.preventDefault();
      await this._adjustWp(1);
    });

    // Apply all marked skills (end-of-op button)
    $(document).off("click", "#dg-apply-skill-improvements");
    $(document).on("click", "#dg-apply-skill-improvements", async (ev) => {
      ev.preventDefault();
      await this.applyMarkedSkillImprovements();
    });
  }

  /* ------------------------------------------------------------------------ */
  /* ACTOR + NAME HELPERS                                                     */
  /* ------------------------------------------------------------------------ */

  static _getCurrentActor() {
    try {
      if (canvas && canvas.tokens && canvas.tokens.controlled?.length === 1) {
        return canvas.tokens.controlled[0].actor;
      }
    } catch (_e) {}
    if (game.user?.character) return game.user.character;
    return null;
  }

  static _mapSkillKey(uiKey) {
    const map = {
      // Core
      alertness: "alertness",
      athletics: "athletics",
      dodge: "dodge",
      drive: "drive",
      firearms: "firearms",
      firstAid: "first_aid",
      first_aid: "first_aid",
      humint: "humint",
      meleeWeapons: "melee_weapons",
      melee_weapons: "melee_weapons",
      ride: "ride",
      navigate: "navigate",
      occult: "occult",
      persuade: "persuade",
      search: "search",
      stealth: "stealth",
      unarmedCombat: "unarmed_combat",
      unarmed_combat: "unarmed_combat",

      // Extra
      accounting: "accounting",
      anthropology: "anthropology",
      archeology: "archeology",
      artillery: "artillery",
      bureaucracy: "bureaucracy",
      computerScience: "computer_science",
      computer_science: "computer_science",
      criminology: "criminology",
      demolitions: "demolitions",
      disguise: "disguise",
      forensics: "forensics",
      heavyMachinery: "heavy_machinery",
      heavy_machinery: "heavy_machinery",
      heavy_weapons: "heavy_weapons",
      history: "history",
      law: "law",
      medicine: "medicine",
      pharmacy: "pharmacy",
      psychotherapy: "psychotherapy",
      sigint: "sigint",
      survival: "survival",
      swim: "swim",
      unnatural: "unnatural",
      ritual: "rituals",
      rituals: "rituals",
    };

    if (!uiKey) return uiKey;
    if (map[uiKey]) return map[uiKey];

    // Fallback: normalize camelCase → snake_case
    const normalized = String(uiKey)
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .toLowerCase();

    return map[normalized] || normalized;
  }

  static _getActorDisplayName(actor) {
    if (!actor) return null;
    const name = (actor.name || "").toString().trim();
    if (name) return name;
    return null;
  }

  /**
   * Shorten a raw name to just the "agent name" portion.
   * Rule:
   * - If 4+ words: 3rd + 4th (e.g. "AGENT MARION CASE HANDLER M-CELL" → "CASE HANDLER")
   * - If 3 words: 2nd + 3rd
   * - If 2 words: both
   * - If 1 word: that word
   * Always returns UPPERCASE, or "" if nothing usable.
   */
  static _shortenName(rawName) {
    if (!rawName || typeof rawName !== "string") return "";
    const parts = rawName.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "";

    if (parts.length >= 4) return `${parts[2]} ${parts[3]}`.toUpperCase();
    if (parts.length === 3) return `${parts[1]} ${parts[2]}`.toUpperCase();
    if (parts.length === 2) return `${parts[0]} ${parts[1]}`.toUpperCase();
    return parts[0].toUpperCase();
  }

  /**
   * Compute the sender label for a ChatMessage.
   */
  static getMessageSender(message) {
    if (!message) return "UNKNOWN";

    const speaker = message.speaker || {};

    // 1) If the message has an explicit alias (e.g. speaking as an NPC), use shortened alias.
    if (speaker.alias && typeof speaker.alias === "string") {
      const shortAlias = this._shortenName(speaker.alias) || speaker.alias;
      return shortAlias.toUpperCase();
    }

    // 2) Try to resolve an actor from the speaker.
    let actor = null;

    if (speaker.actor && game.actors) {
      actor = game.actors.get(speaker.actor) || null;
    }

    if (!actor && speaker.token && canvas?.scene) {
      const tokenDoc = canvas.scene.tokens.get(speaker.token);
      actor = tokenDoc?.actor || tokenDoc?.object?.actor || null;
    }

    if (actor) {
      const fromName = this._shortenName(actor.name || "");
      if (fromName) return fromName;

      try {
        const MODULE_ID = DeltaGreenUI.ID;
        const first =
          (actor.getFlag && actor.getFlag(MODULE_ID, "firstName")) || "";
        const middle =
          (actor.getFlag && actor.getFlag(MODULE_ID, "middleName")) || "";
        const surname =
          (actor.getFlag && actor.getFlag(MODULE_ID, "surname")) ||
          (actor.getFlag && actor.getFlag(MODULE_ID, "reference")) ||
          "";

        const parts = [first, middle]
          .map((p) => (p ?? "").toString().trim())
          .filter(Boolean);

        if (parts.length) return parts.join(" ").toUpperCase();
        if (surname && first) return `${first} ${surname}`.toUpperCase();
      } catch (e) {
        console.warn(
          "Delta Green UI | MailSystem.getMessageSender flag lookup failed (actor branch)",
          e
        );
      }

      if (actor.name) return actor.name.toUpperCase();
    }

    // 3) Fallback: use the Foundry User (author / user), via formatSenderName.
    const user = message.author || message.user;
    if (user) return this.formatSenderName(user);

    return "UNKNOWN";
  }

  /* ------------------------------------------------------------------------ */
  /* UI HELPERS: SAN BUTTON, HEADER, WEAPONS, HP/WP                           */
  /* ------------------------------------------------------------------------ */

  static ensureSanButton() {
    // If a SAN button exists anywhere in the UI, don't inject another
    if ($("#dg-san-check-btn").length) return;

    const $bar = $(".dg-mail-statbar");
    if (!$bar.length) return;

    $bar.prepend(`
      <button id="dg-san-check-btn" class="dg-mail-statbutton">
        SAN CHECK
      </button>
    `);

    // Bind to the dialog macro
    $(document)
      .off("click", "#dg-san-check-btn")
      .on("click", "#dg-san-check-btn", async (ev) => {
        ev.preventDefault();
        await this.runSanCheckDialogMacro();
      });
  }

  // Return true if this weapon should appear in the hotbar
  static _isWeaponEquipped(item) {
    if (!item) return false;

    const sys =
      item.system ||
      item.data?.system ||
      item.data?.data ||
      {};

    // Mirror InventoryManager._toggleItemEquipped logic:
    if (Object.prototype.hasOwnProperty.call(sys, "equipped")) {
      return !!sys.equipped;
    }
    if (Object.prototype.hasOwnProperty.call(sys, "equip")) {
      return !!sys.equip;
    }
    if (Object.prototype.hasOwnProperty.call(sys, "carried")) {
      return !!sys.carried;
    }
    if (Object.prototype.hasOwnProperty.call(sys, "isEquipped")) {
      return !!sys.isEquipped;
    }

    // No known flag? Treat as not equipped.
    return false;
  }

  // Color SAN CHECK based on SAN vs Breaking Point
  static _refreshSanButtonStatus(actor = null) {
    try {
      const current = actor || this._getCurrentActor();
      const $btn = $("#dg-san-check-btn");
      if (!current || !$btn.length) return;

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

      // GM-only world setting: can SAN ever show numbers?
      let allowSanNumbers = false;
      const settingKey = "deltagreen-custom-ui.allowSanNumbers";
      try {
        if (game.settings?.settings?.has?.(settingKey)) {
          allowSanNumbers = game.settings.get(
            "deltagreen-custom-ui",
            "allowSanNumbers"
          );
        }
      } catch (e) {
        console.warn(
          "Delta Green UI | allowSanNumbers setting missing; defaulting to label-only SAN.",
          e
        );
      }

      // Reset classes
      $btn.removeClass("dg-san-safe dg-san-warn dg-san-bad");

      // If we don't have sane data, just show unknown
      if (
        !Number.isFinite(sanCurrent) ||
        !Number.isFinite(breakingPoint) ||
        breakingPoint <= 0
      ) {
        $btn.text("SAN — STATUS UNKNOWN");
        return;
      }

      const ratio = sanCurrent / breakingPoint;

      let label;
      let cls;

      if (ratio >= 1.5) {
        label = "GROUNDED";
        cls = "dg-san-safe";
      } else if (ratio >= 1.1) {
        label = "STABLE";
        cls = "dg-san-safe";
      } else if (ratio >= 0.8) {
        label = "FRAYED";
        cls = "dg-san-warn";
      } else if (ratio >= 0.5) {
        label = "UNRAVELLING";
        cls = "dg-san-warn";
      } else {
        label = "COMPROMISED";
        cls = "dg-san-bad";
      }

      $btn.addClass(cls);

      if (allowSanNumbers && Number.isFinite(sanCurrent)) {
        $btn.text(`SAN ${sanCurrent}% — ${label}`);
      } else {
        $btn.text(`SAN: ${label}`);
      }
    } catch (err) {
      console.error("Delta Green UI | _refreshSanButtonStatus error:", err);
    }
  }

  // Inject "LOGGED IN: Agent X" into the mail header
  static _updateMailHeaderActorName(actor = null) {
    try {
      const current = actor || this._getCurrentActor();
      const rawName = current?.name || "UNKNOWN";
      const shortName = this._shortenName(rawName);
      const upperName = shortName || "UNKNOWN";

      // Preferred: use dedicated span if present
      const span = document.getElementById("dg-mail-actor-name");
      if (span) {
        span.textContent = current
          ? `LOGGED IN: ${upperName}`
          : "LOGGED IN: —";
        return;
      }

      // Fallback: rewrite header text while preserving base title
      const header = document.querySelector("#dg-mail-root .dg-section-title");
      if (!header) return;

      // Capture and freeze the "base" left-side title once
      if (!header.dataset.baseTitle) {
        const existing = header.textContent || "";
        const cleaned = existing.replace(/LOGGED IN:.*/i, "").trim();
        header.dataset.baseTitle = cleaned || "SECURE MESSAGING SYSTEM";
      }

      const baseTitle = header.dataset.baseTitle;
      const rightText = current ? `LOGGED IN: ${upperName}` : "";

      header.innerHTML = `
        <span class="dg-section-title-left">${baseTitle}</span>
        <span class="dg-section-title-right">${rightText}</span>
      `;
    } catch (err) {
      console.error("Delta Green UI | _updateMailHeaderActorName error:", err);
    }
  }

  // Stat buttons obey MailSystem.showSkillNumbers and show % (x5)
  static refreshStatButtons() {
    const actor = this._getCurrentActor();
    const showNums = MailSystem.showSkillNumbers;

    $(".dg-stat-roll-btn").each((_, el) => {
      const $btn = $(el);
      const key = $btn.data("stat"); // e.g. "STR", "CON", etc.

      if (!actor || !key) {
        $btn.hide();
        return;
      }

      const statsRoot =
        actor.system?.stats ||
        actor.system?.statistics ||
        actor.system?.characteristics ||
        actor.system?.attributes ||
        {};

      const statObj =
        statsRoot[key] ||
        statsRoot[key.toLowerCase?.()] ||
        statsRoot[key.toUpperCase?.()];

      const rawVal =
        statObj?.x5 ??
        statObj?.value ??
        statObj?.score ??
        statObj;

      const val = Number(rawVal);

      if (!statObj || Number.isNaN(val)) {
        $btn.hide();
        return;
      }

      if (!$btn.data("baseLabel")) {
        const existing = ($btn.text() || "").toString().trim();
        const baseLabel = existing || key.toString().toUpperCase();
        $btn.data("baseLabel", baseLabel);
      }

      const baseLabel = $btn.data("baseLabel");

      let label = baseLabel;

      if (showNums) {
        let percent = val;

        // If it's clearly a base stat (<= 20) and not already x5, convert.
        if (percent <= 20 && statObj?.x5 == null) {
          percent = percent * 5;
        }

        if (percent < 0) percent = 0;
        if (percent > 200) percent = 200;

        label = `${baseLabel} ${percent}%`;
      }

      $btn.text(label);
      $btn.show();
    });
  }

  // adjust HP by +1 / -1 from the buttons
  static async _adjustHp(delta) {
    try {
      const actor = this._getCurrentActor();
      if (!actor) {
        ui.notifications.warn("Select a token or have an assigned character.");
        return;
      }

      const hasHp =
        foundry.utils.getProperty(actor, "system.hp.value") !== undefined;
      const hpPath = hasHp ? "system.hp.value" : "system.health.value";
      const hpMaxPath = hasHp ? "system.hp.max" : "system.health.max";

      const curRaw = Number(foundry.utils.getProperty(actor, hpPath) ?? 0);
      const maxRaw = Number(
        foundry.utils.getProperty(actor, hpMaxPath) ??
          foundry.utils.getProperty(actor, hpPath) ??
          0
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
      this.refreshHpWpPanel(actor);
    } catch (err) {
      console.error("Delta Green UI | _adjustHp error:", err);
      ui.notifications.error("Error adjusting HP.");
    }
  }

  // adjust WP by +1 / -1 from the buttons
  static async _adjustWp(delta) {
    try {
      const actor = this._getCurrentActor();
      if (!actor) {
        ui.notifications.warn("Select a token or have an assigned character.");
        return;
      }

      const wpPath = "system.wp.value";
      const wpMaxPath = "system.wp.max";

      const curRaw = Number(foundry.utils.getProperty(actor, wpPath) ?? 0);
      const maxRaw = Number(
        foundry.utils.getProperty(actor, wpMaxPath) ??
          foundry.utils.getProperty(actor, wpPath) ??
          0
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
      this.refreshHpWpPanel(actor);
    } catch (err) {
      console.error("Delta Green UI | _adjustWp error:", err);
      ui.notifications.error("Error adjusting WP.");
    }
  }

  static refreshHpWpPanel(actor = null) {
    try {
      const current = this._getCurrentActor();
      if (!current) return;

      if (actor && actor.id !== current.id) return;

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

      const $hp = $("#dg-hp-box");
      const $wp = $("#dg-wp-box");
      if (!$hp.length || !$wp.length) return;

      const setBox = ($el, label, cur, max) => {
        const curNum = Number.isFinite(cur) ? cur : NaN;
        const maxNum = Number.isFinite(max) ? max : NaN;

        $el.removeClass("dg-hpwp-good dg-hpwp-warn dg-hpwp-bad");

        if (!Number.isFinite(curNum) || !Number.isFinite(maxNum) || maxNum <= 0) {
          $el.text(`${label}: -- / --`);
          return;
        }

        const ratio = Math.max(0, Math.min(1, curNum / maxNum));

        $el.text(`${label}: ${curNum}/${maxNum}`);

        if (ratio > 0.8) {
          $el.addClass("dg-hpwp-good");
        } else if (ratio > 0.4) {
          $el.addClass("dg-hpwp-warn");
        } else {
          $el.addClass("dg-hpwp-bad");
        }
      };

      setBox($hp, "HP", hpCurrent, hpMax);
      setBox($wp, "WP", wpCurrent, wpMax);

      this._refreshSanButtonStatus(current);
    } catch (err) {
      console.error("Delta Green UI | refreshHpWpPanel error:", err);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* MODIFIERS + SKILL / WEAPON HOTBARS                                      */
  /* ------------------------------------------------------------------------ */

  static setModifier(value) {
    this.currentModifier = Number(value) || 0;
    this.refreshModifierButtons();
  }

  static refreshModifierButtons() {
    const mod = Number(this.currentModifier || 0);
    const $buttons = $(".dg-mod-btn");
    $buttons.removeClass("dg-mod-active");
    if (mod === 0) return;
    $buttons.each((_, el) => {
      const $btn = $(el);
      const val = Number($btn.data("mod") ?? 0);
      if (val === mod) $btn.addClass("dg-mod-active");
    });
  }

  // Skill hotbar
  static refreshSkillHotbar() {
    const actor = this._getCurrentActor();
    const skills = actor?.system?.skills || {};
    const showNums = MailSystem.showSkillNumbers;

    $(".dg-skill-roll-btn")
      .not(".dg-typed-skill-btn")
      .each((_, el) => {
        const $btn = $(el);
        const uiKey = $btn.data("skill");

        if (!uiKey || !actor) {
          $btn.hide();
          return;
        }

        const systemKey = this._mapSkillKey(uiKey);
        const skillObj = skills[systemKey];
        const prof = Number(skillObj?.proficiency ?? 0);

        if (!skillObj || Number.isNaN(prof) || prof < 10) {
          $btn.hide();
          return;
        }

        const isMarked = !!skillObj.failure;

        if (!$btn.data("baseLabel")) {
          const existing = ($btn.text() || "").toString().trim();
          const baseLabel =
            existing ||
            (
              game.i18n?.localize?.(`DG.Skills.${systemKey}`) ||
              systemKey
            ).toString().toUpperCase();
          $btn.data("baseLabel", baseLabel);
        }

        const baseLabel = $btn.data("baseLabel");

        let label = baseLabel;
        if (showNums) {
          label = `${baseLabel} ${prof}%`;
        }

        if (isMarked) {
          label = `${label} ☣`;
        }

        $btn.text(label);
        $btn.show();
      });
  }

  // Typed skills
  static refreshTypedSkillButtons() {
    const actor = this._getCurrentActor();
    const $skillBar = $(".dg-mail-base-skillbar");
    if (!$skillBar.length) return;

    $skillBar.find(".dg-typed-skill-btn").remove();
    if (!actor) return;

    const showNums = MailSystem.showSkillNumbers;
    const typedSkills = actor.system?.typedSkills || {};

    const entries = Object.entries(typedSkills)
      .filter(([_, s]) => {
        const val = Number(s?.proficiency ?? 0);
        const isMarked = !!s?.failure;
        return !Number.isNaN(val) && (val > 0 || isMarked);
      })
      .sort((a, b) => {
        const [, A] = a,
          [, B] = b;
        const labelA = `${(A.group || "").toUpperCase()} (${(
          A.label || ""
        ).toUpperCase()})`;
        const labelB = `${(B.group || "").toUpperCase()} (${(
          B.label || ""
        ).toUpperCase()})`;
        return labelA.localeCompare(labelB);
      });

    for (const [key, skill] of entries) {
      const prof = Number(skill.proficiency ?? 0);
      const isMarked = !!skill.failure;

      let baseLabel = `${(skill.group || "TYPED").toUpperCase()} (${(
        skill.label || key
      ).toUpperCase()})`;

      let labelText = baseLabel;
      if (showNums && !Number.isNaN(prof)) {
        labelText = `${baseLabel} ${prof}%`;
      }
      if (isMarked) {
        labelText = `${labelText} ☣`;
      }

      const $btn = $(`
        <button class="dg-button dg-skill-roll-btn dg-typed-skill-btn" data-skill="${key}">
          ${labelText}
        </button>
      `);

      $btn.attr("data-skill-key", key);
      $btn.attr("data-skill-group", (skill.group || "").toUpperCase());
      $btn.attr("data-skill-label", (skill.label || key).toUpperCase());
      $btn.attr("data-skill-prof", Number.isNaN(prof) ? "" : prof);

      $skillBar.append($btn);
    }
  }

  static refreshWeaponHotbar() {
    const actor = this._getCurrentActor();
    const $wrap = $("#dg-weapon-hotbar, #dg-rolls-weapon-hotbar");
    if (!$wrap.length) return;

    $wrap.empty();
    if (!actor) return;

    const items = actor.items?.contents || actor.items || [];

    const weapons = items.filter((item) => {
      const type = (item.type || "").toLowerCase();
      const isWeaponType = type === "weapon" || type.includes("weapon");
      if (!isWeaponType) return false;
      return this._isWeaponEquipped(item);
    });

    if (!weapons.length) {
      $wrap.append(
        `<span class="dg-placeholder">NO EQUIPPED WEAPONS</span>`
      );
      return;
    }

    for (const w of weapons) {
      const upperName = (w.name || "WEAPON").toUpperCase();

      const isFirearm =
        typeof WeaponSoundManager.isFirearmWeapon === "function"
          ? WeaponSoundManager.isFirearmWeapon(w)
          : false;

      let btnHtml;

      if (isFirearm) {
        btnHtml = `
          <button class="dg-button dg-weapon-btn"
                  data-weapon-id="${w.id}"
                  data-weapon-name="${upperName}"
                  data-fire-mode="semi">
            <span class="dg-weapon-label">
              ${upperName}
            </span>
            <span class="dg-weapon-mode-tag">
              [SEMI]
            </span>
          </button>
        `;
      } else {
        btnHtml = `
          <button class="dg-button dg-weapon-btn"
                  data-weapon-id="${w.id}"
                  data-weapon-name="${upperName}">
            <span class="dg-weapon-label">
              ${upperName}
            </span>
          </button>
        `;
      }

      $wrap.append($(btnHtml));
    }
  }

  /* ------------------------------------------------------------------------ */
  /* ROLLING (Delta Green crits = doubles + 1/100)                            */
  /* ------------------------------------------------------------------------ */

  static _dgOutcome(total, target) {
    const isSuccess = total <= target;
    const isDouble = total % 11 === 0 && total !== 0 && total !== 100;
    const critSuccess = total === 1 || (isDouble && isSuccess);
    const critFailure = total === 100 || (isDouble && !isSuccess);
    return {
      outcome: isSuccess ? "success" : "failure",
      crit: critSuccess ? "critSuccess" : critFailure ? "critFailure" : null,
    };
  }

  static async rollSystemSkill(uiKey) {
    try {
      const actor = this._getCurrentActor();
      if (!actor)
        return ui.notifications.warn(
          "Select a token or have an assigned character."
        );

      const systemKey = this._mapSkillKey(uiKey);
      const skills = actor.system?.skills || {};
      const typedSkills = actor.system?.typedSkills || {};
      const baseSkill = skills[systemKey];
      const typedSkill = typedSkills[systemKey];
      const skillObj = baseSkill || typedSkill;
      if (!skillObj) {
        return ui.notifications.warn(
          `Skill "${systemKey}" not found on actor.`
        );
      }

      const isTypedSkill = !!typedSkill;
      const baseTarget = Number(skillObj.proficiency ?? 0) || 0;
      const mod = Number(this.currentModifier || 0);
      const target = Math.max(0, baseTarget + mod);

      const niceLabel = isTypedSkill
        ? `${(typedSkill.group || "TYPED").toUpperCase()} (${(
            typedSkill.label || systemKey
          ).toUpperCase()})`
        : (
            game.i18n?.localize?.(`DG.Skills.${systemKey}`) || systemKey
          ).toUpperCase();

      const roll = new Roll("1d100");
      await roll.evaluate();
      const total = Number(roll.total ?? 0);

      const { outcome, crit } = this._dgOutcome(total, target);
      const marked = outcome === "failure" || crit === "critFailure";

      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: `ROLLING ${niceLabel}`,
        flags: {
          [DeltaGreenUI.ID]: {
            skillRoll: true,
            typed: isTypedSkill,
            baseTarget,
            modifier: mod,
            target,
            marked,
            outcome,
            crit,
            systemKey,
          },
        },
      });

      if (mod !== 0) this.setModifier(0);
      this.requestLoadMessages?.();
    } catch (err) {
      console.error("Delta Green UI | rollSystemSkill error:", err);
      ui.notifications.error("Error rolling skill.");
    }
  }

  static async rollStatOrLuck(key) {
    try {
      const actor = this._getCurrentActor();
      if (!actor)
        return ui.notifications.warn(
          "Select a token or have an assigned character."
        );

      let baseTarget, label;
      if (key === "luck") {
        baseTarget = 50;
        label = "LUCK";
      } else {
        const stat = actor.system?.statistics?.[key];
        if (!stat)
          return ui.notifications.warn(`Stat "${key}" not found on actor.`);
        baseTarget = Number(stat.x5 ?? stat.value * 5);
        label = key.toUpperCase();
      }

      const mod = Number(this.currentModifier || 0);
      const target = Math.max(0, baseTarget + mod);

      const roll = new Roll("1d100");
      await roll.evaluate();
      const total = Number(roll.total ?? 0);

      const { outcome, crit } = this._dgOutcome(total, target);

      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: `ROLLING ${label}`,
        flags: {
          [DeltaGreenUI.ID]: {
            statRoll: true,
            key,
            baseTarget,
            modifier: mod,
            target,
            outcome,
            crit,
            marked: false,
          },
        },
      });

      if (mod !== 0) this.setModifier(0);
      this.requestLoadMessages?.();
    } catch (err) {
      console.error("Delta Green UI | rollStatOrLuck error:", err);
      ui.notifications.error("Error rolling stat.");
    }
  }

  /**
   * Weapon attack:
   */
  /**
   * Weapon attack:
   */
  /**
   * Weapon attack:
   */
  static async rollWeaponAttack(itemId, { mode = null } = {}) {
    try {
      const actor = this._getCurrentActor();
      if (!actor) {
        ui.notifications.warn("Select a token or have an assigned character.");
        return;
      }

      const item =
        actor.items?.get?.(itemId) ||
        (actor.items?.contents || []).find((i) => i.id === itemId);
      if (!item) {
        ui.notifications.warn("Weapon not found on actor.");
        return;
      }

      const sys = item.system || {};

      // ---------------- LETHALITY SETUP ----------------
      const isLethalWeapon = !!sys.isLethal;
      let lethalityRating = 0;

      if (isLethalWeapon) {
        let raw = sys.lethality ?? sys.lethalityRating ?? null;
        if (raw != null) {
          if (typeof raw === "string") {
            raw = raw.replace("%", "").trim();
          }
          const parsed = Number(raw);
          lethalityRating = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
        }
      }

      // Ask if the target is UNNATURAL when the weapon can do Lethality.
      let targetIsUnnatural = false;
      if (isLethalWeapon && lethalityRating > 0) {
        const dialogData = await new Promise((resolve) => {
          new Dialog({
            title: `Lethality Options – ${item.name || "Weapon"}`,
            content: `
              <div style="display:flex;flex-direction:column;gap:6px;font-size:20px;">
                <p>
                  This weapon has a <b>Lethality</b> rating of <b>${lethalityRating}%</b>.
                </p>
                <label>
                  <input type="checkbox" name="unnaturalTarget"/>
                  Target is <b>UNNATURAL</b> (ignore Lethality auto-kill; roll normal damage on a hit).
                </label>
              </div>
            `,
            buttons: {
              ok: {
                label: "Confirm",
                callback: (html) => {
                  const unnatural = html
                    .find('[name="unnaturalTarget"]')
                    .is(":checked");
                  resolve({ unnatural });
                },
              },
              cancel: {
                label: "Cancel Attack",
                callback: () => resolve(null),
              },
            },
            default: "ok",
          }).render(true);
        });

        if (!dialogData) return;
        targetIsUnnatural = !!dialogData.unnatural;
      }

      // ---------------- SKILL / STAT SETUP ----------------
      const linkedRawKey =
        sys.skillKey || sys.skill || sys.linkedSkill || sys.skillStat || "firearms";

      // Strip "*5", " x5", etc. from things like "DEX*5"
      let normalizedKey = String(linkedRawKey).trim();
      normalizedKey = normalizedKey.replace(/\s*x?\*?\s*5\b/gi, "");
      normalizedKey = normalizedKey || "firearms";

      const lowerKey = normalizedKey.toLowerCase();

      const statsRoot =
        actor.system?.stats ||
        actor.system?.statistics ||
        actor.system?.characteristics ||
        actor.system?.attributes ||
        {};

      const skills = actor.system?.skills || {};
      const typed = actor.system?.typedSkills || {};

      const coreStatKeys = ["str", "con", "dex", "int", "pow", "cha", "siz", "app"];
      const isLuckStat = lowerKey === "luck";
      const isCoreStat = coreStatKeys.includes(lowerKey) || isLuckStat;

      let baseTarget = 0;
      let usesStatX5 = false;
      let systemKeyForFlags = normalizedKey; // what we store in flags

      if (isCoreStat) {
        // ALWAYS treat these as stats, not skills – EVEN FOR WEAPONS
        usesStatX5 = true;

        if (isLuckStat) {
          // If you later wire a real Luck stat, replace this.
          baseTarget = 50;
          systemKeyForFlags = "LUCK";
        } else {
          const statObj =
            statsRoot[normalizedKey] ||
            statsRoot[lowerKey] ||
            statsRoot[normalizedKey.toUpperCase()] ||
            statsRoot[lowerKey.toUpperCase?.()];

          let raw =
            Number(
              statObj?.x5 ??
              statObj?.value ??
              statObj?.score ??
              statObj
            ) || 0;

          // If x5 not present and this looks like a base stat (≤ 20), convert to x5
          if (statObj && statObj.x5 == null && raw > 0 && raw <= 20) {
            raw = raw * 5;
          }

          baseTarget = raw;
          systemKeyForFlags = lowerKey.toUpperCase();
        }
      } else {
        // Not a core stat: treat as a SKILL first
        const skillKey = this._mapSkillKey(normalizedKey);
        let skillObj = skills[skillKey] || typed[skillKey];

        if (skillObj) {
          baseTarget = Number(skillObj.proficiency ?? 0) || 0;
          systemKeyForFlags = skillKey;
        } else {
          // Last-resort: weird stat hiding in statsRoot
          const statObj =
            statsRoot[skillKey] ||
            statsRoot[skillKey.toLowerCase?.()] ||
            statsRoot[skillKey.toUpperCase?.()];

          if (statObj) {
            usesStatX5 = true;
            let raw =
              Number(
                statObj.x5 ??
                statObj.value ??
                statObj.score ??
                statObj
              ) || 0;

            if (statObj.x5 == null && raw > 0 && raw <= 20) {
              raw = raw * 5;
            }

            baseTarget = raw;
            systemKeyForFlags = skillKey.toUpperCase();
          } else {
            // Unknown key: treat as 0% and DO NOT mark a real skill
            baseTarget = 0;
            systemKeyForFlags = skillKey;
          }
        }
      }

      const mod = Number(this.currentModifier || 0);
      const target = Math.max(0, baseTarget + mod);

      // ---------------- ATTACK ROLL ----------------
      const attackRoll = new Roll("1d100");
      await attackRoll.evaluate();
      const total = Number(attackRoll.total ?? 0);

      const { outcome, crit } = this._dgOutcome(total, target);

      // IMPORTANT:
      // - We ONLY mark when this is a real skill-based roll (not STAT×5, not weird custom).
      const marked =
        !usesStatX5 &&
        baseTarget > 0 &&
        (outcome === "failure" || crit === "critFailure");

      const attackFlavor = `ATTACK: ${(item.name || "WEAPON").toUpperCase()}`;
      await attackRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: attackFlavor,
        flags: {
          [DeltaGreenUI.ID]: {
            weaponAttack: true,
            itemId,
            systemKey: systemKeyForFlags,
            baseTarget,
            modifier: mod,
            target,
            outcome,
            crit,
            isAttackCard: true,
            marked,
            usesStatX5,
          },
        },
      });

      // ---------------- WEAPON SFX ----------------
      try {
        let fireMode = null;
        if (mode === "auto") fireMode = "auto";
        else if (mode === "semi") fireMode = "semi";

        if (!fireMode) {
          const fireModeRaw = (
            sys.fireMode ||
            sys.firemode ||
            sys.mode ||
            ""
          )
            .toString()
            .toLowerCase();

          fireMode =
            fireModeRaw.includes("auto") ||
            fireModeRaw.includes("burst") ||
            fireModeRaw.includes("full")
              ? "auto"
              : "semi";
        }

        WeaponSoundManager.play({
          actor,
          weapon: item,
          mode: fireMode,
        });
      } catch (e) {
        console.warn("Delta Green UI | WeaponSoundManager.play failed:", e);
      }

      // ---------------- DAMAGE / LETHALITY LOGIC ----------------
      const dmgFormula =
        sys.damageFormula || sys.damage || sys.dmg || sys.formula || null;

      let dmgRoll = null;
      let dmgResultHtml = "";
      let lethalKill = false;
      let lethalHpDamage = null;
      let lethalUsed = false;

      const hpDamageFromLethalityRoll = (value) => {
        if (value <= 0) return 0;
        if (value >= 100) return 20;
        const tens = Math.floor(value / 10);
        const ones = value % 10;
        return tens + ones;
      };

      if (outcome === "success") {
        if (isLethalWeapon && lethalityRating > 0 && !targetIsUnnatural) {
          lethalUsed = true;

          let effectiveLethality = lethalityRating;
          if (crit === "critSuccess") {
            effectiveLethality = Math.min(100, lethalityRating * 2);
          }

          const lethalityRoll = new Roll("1d100");
          await lethalityRoll.evaluate();
          const lethalityTotal = Number(lethalityRoll.total ?? 0);

          if (game.dice3d) {
            await game.dice3d.showForRoll(lethalityRoll, game.user, true);
          }

          if (lethalityTotal <= effectiveLethality) {
            lethalKill = true;
            lethalHpDamage = null;

            dmgResultHtml = `
              <div><b>LETHALITY ROLL:</b> ${lethalityTotal} ≤ ${effectiveLethality}% — <span style="color:var(--dg-accent,inherit)">TARGET DROPS TO 0 HP</span>.</div>
            `;
          } else {
            let hpDmg = hpDamageFromLethalityRoll(lethalityTotal);
            if (crit === "critSuccess") {
              hpDmg *= 2;
            }
            lethalHpDamage = hpDmg;

            dmgResultHtml = `
              <div><b>LETHALITY ROLL:</b> ${lethalityTotal} &gt; ${effectiveLethality}% — no instant kill.</div>
              <div><b>HP DAMAGE (from Lethality dice):</b> ${hpDmg} HP${
                crit === "critSuccess" ? " (doubled for CRIT)" : ""
              }</div>
            `;
          }
        }

        if (!lethalUsed && dmgFormula) {
          try {
            dmgRoll = new Roll(String(dmgFormula));
            await dmgRoll.evaluate();
            await dmgRoll.toMessage({
              speaker: ChatMessage.getSpeaker({ actor }),
              flavor: `DAMAGE: ${String(dmgFormula)}`,
            });

            dmgResultHtml = `
              <div><b>DAMAGE:</b> ${dmgRoll.total} 
                <small>(${dmgRoll.formula}${
                  targetIsUnnatural && isLethalWeapon
                    ? "; Lethality ignored vs UNNATURAL target"
                    : ""
                })</small>
              </div>
            `;
          } catch (e) {
            console.warn("Delta Green UI | Damage roll failed:", e);
            dmgResultHtml = `
              <div><b>DAMAGE:</b> <i>Invalid/failed formula</i></div>
            `;
          }
        }
      }

      // ---------------- SUMMARY CARD ----------------
      let outcomeText = outcome.toUpperCase();
      if (crit === "critSuccess") outcomeText = "CRITICAL SUCCESS";
      else if (crit === "critFailure") outcomeText = "CRITICAL FAILURE";

      const richContent = `
        <div class="dg-roll-result">
          <div class="dg-roll-skill">${attackFlavor}</div>
          <div class="dg-roll-target">
            TARGET: ${target}% (BASE ${baseTarget}${
              mod ? (mod > 0 ? ` +${mod}` : ` ${mod}`) : ""
            }${usesStatX5 ? " | STAT×5" : ""})
          </div>
          <div class="dg-roll-value ${
            crit === "critSuccess"
              ? "dg-roll-crit-success"
              : crit === "critFailure"
              ? "dg-roll-crit-failure"
              : outcome === "failure"
              ? "dg-roll-failure"
              : "dg-roll-success"
          }">
            ${total} — ${outcomeText}
          </div>
          ${
            isLethalWeapon && lethalityRating > 0
              ? `<div><b>WEAPON LETHALITY:</b> ${lethalityRating}%${
                  targetIsUnnatural
                    ? " (ignored vs UNNATURAL target)"
                    : ""
                }</div>`
              : ""
          }
          ${dmgResultHtml}
        </div>
      `;

      await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: richContent,
        type: CHAT_STYLES.OTHER,
        flags: {
          [DeltaGreenUI.ID]: {
            weaponSummary: true,
            itemId,
            systemKey: systemKeyForFlags,
            baseTarget,
            modifier: mod,
            target,
            outcome,
            crit,
            damageFormula: dmgFormula || null,
            isLethalWeapon,
            lethalityRating,
            targetIsUnnatural,
            lethalKill,
            lethalHpDamage,
            usesStatX5,
          },
        },
      });

      if (mod !== 0) this.setModifier(0);
      this.requestLoadMessages?.();
    } catch (err) {
      console.error("Delta Green UI | rollWeaponAttack error:", err);
      ui.notifications.error("Error rolling weapon attack.");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* SAN CHECK MACRO                                                          */
  /* ------------------------------------------------------------------------ */

  static async runSanCheckDialogMacro() {
    try {
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

      // ---------- 1. Get actor ----------
      let actor = this._getCurrentActor();
      if (!actor) {
        ui.notifications.error("Select a token or have an assigned character.");
        return;
      }

      const rawName = (actor.name || "UNKNOWN").trim();
      const displayName = this._shortenName(rawName) || "UNKNOWN";

      // ---------- 0. Narrative pools ----------
      const SAN_FAILURE_LINES = [
        "Your thoughts skid sideways—nothing about this feels real anymore.",
        "Your stomach drops; this is wrong in a way your mind can’t safely describe.",
        "You blink once, twice, hoping the world resets. It doesn’t.",
        "You will never sleep right again after this.",
        "Something inside you gives way—like a support beam quietly snapping.",
      ];
      const SAN_SUCCESS_LINES = [
        "You feel the panic rising—and force it back down where it belongs.",
        "Your pulse hammers, but training and habit slam the door on the worst of it.",
        "You catalog the horror, box it up in your head, and move on—for now.",
        "You swallow hard, steady your hands, and keep working the problem.",
        "It shakes you, but it doesn’t break you. Not this time.",
      ];
      const CRIT_SUCCESS_LINES = [
        "For one clear second, you see it for exactly what it is—and that clarity saves you.",
        "You ride the spike of terror like a wave, letting it crest and break without taking you under.",
        "You lock eyes with the horror and something in you just… refuses to yield.",
        "Your mind files this away with surgical precision: evidence, not nightmare.",
        "You feel the crack coming—and reinforce it with sheer stubborn will.",
      ];
      const CRIT_FAILURE_LINES = [
        "Your mind doesn’t just slip—it plummets, screaming, with no handhold in sight.",
        "Reality fractures into too many pieces to track; you grab one at random and cling to it.",
        "The laugh, the sob, the scream—you’re not sure which one comes out, only that it does.",
        "All your training vanishes; you’re a raw nerve, exposed to something that should not exist.",
        "A terrible understanding floods in, burning away any hope that this is “just” madness.",
      ];

      const BP_REG_SUCCESS_LINES = [
        "You keep it together just long enough to realize something inside you quietly broke.",
        "You manage to function, hands steady, voice level—while something vital in you goes dark.",
        "You do everything right. You follow the training. And somehow that makes the fracture feel worse.",
        "You stay on your feet, stay on task, and only later notice you’ve left a piece of yourself behind.",
        "You hold the line in the moment, but the person who walked into this scene isn’t the one walking out.",
      ];
      const BP_REG_FAILURE_LINES = [
        "The fear doesn’t just seep in—it floods, drowning whatever was holding you together.",
        "Your thoughts scatter like papers in a storm, and you know you’ll never gather them all again.",
        "You hear yourself make a sound—laugh, sob, gasp—you’re not sure which, only that it isn’t you.",
        "Something gives way behind your eyes, and the world tilts into a shape you cannot unsee.",
        "You don’t collapse, but the support beams of your mind groan, crack, and finally give out.",
      ];
      const BP_CRIT_SUCCESS_LINES = [
        "You understand exactly what you’re seeing, and that clarity slices something essential out of you.",
        "You process every detail with perfect, clinical precision—and feel your humanity slip a step behind.",
        "You lock everything away flawlessly, but the part of you that cared about the lock is gone.",
        "You master the terror, pin it down, and in doing so trade away the last of your illusions.",
        "You stay sharp, efficient, unshakable—and realize, with distant curiosity, that you don’t feel much at all.",
      ];
      const BP_CRIT_FAILURE_LINES = [
        "Your mind doesn’t just crack—it shatters, and you’re left clutching a single splinter that still feels “real.”",
        "Every defense fails at once, leaving raw nerve exposed to something that should never touch human thought.",
        "The world comes apart in too many pieces to track, and you grab onto the wrong one with both hands.",
        "You feel yourself step off the edge of who you were and start falling, with no idea where the bottom is.",
        "There is a moment—just one—where you see the truth of it all, and that moment takes the rest of you with it.",
      ];

      // ---------- 2. Read sheet values ----------
      const sanValuePath = "system.sanity.value";
      const sanMaxPath = "system.sanity.max";
      const bpPath = "system.sanity.currentBreakingPoint";
      const bpHitPath = "system.sanity.breakingPointHit";

      let sanCurrent = Number(
        foundry.utils.getProperty(actor, sanValuePath) ?? 0
      );
      const sanMax = Number(
        foundry.utils.getProperty(actor, sanMaxPath) ?? 99
      );
      const breakingPoint = Number(
        foundry.utils.getProperty(actor, bpPath)
      );

      // ---------- 3. Dialog ----------
      const sanDialog = await new Dialog({
        title: `SAN Check for ${displayName}`,
        content: `
          <div style="display:flex;flex-direction:column;gap:8px;">
            <label>SAN source type:
              <select name="sanType">
                <option value="other">Other / Unnatural / General</option>
                <option value="violence">Violence</option>
                <option value="helplessness">Helplessness</option>
              </select>
            </label>
            <label>Loss on <b>SUCCESS</b> (e.g. 0, 1, 1d4):
              <input type="text" name="success" value="0"/>
            </label>
            <label>Loss on <b>FAILURE</b> (e.g. 1, 1d6, 1d10):
              <input type="text" name="failure" value="1d6"/>
            </label>
            <label>Modifier to <b>SAN target</b> (e.g. -20, 0, +20):
              <input type="number" name="modifier" value="0"/>
            </label>
            <label>
              <input type="checkbox" name="markAdaptation"/>
              Count this as an adaptation incident (Violence/Helplessness)
            </label>
          </div>
        `,
        buttons: {
          ok: {
            label: "Roll SAN",
            callback: (html) => {
              const success =
                (html.find('[name="success"]').val() || "0").trim();
              const failure =
                (html.find('[name="failure"]').val() || "1d6").trim();
              const modifier =
                parseInt(html.find('[name="modifier"]').val(), 10) || 0;
              const sanType = (
                html.find('[name="sanType"]').val() || "other"
              ).trim();
              const markAdaptation = html
                .find('[name="markAdaptation"]')
                .is(":checked");

              return {
                success,
                failure,
                modifier,
                sanType,
                markAdaptation,
              };
            },
          },
          cancel: { label: "Cancel" },
        },
        default: "ok",
        close: (html) => html, // to satisfy eslint; we ignore
      }).render(true);

      const result = await sanDialog;
      if (!result || !result.success) return;

      const successFormula = result.success || "0";
      const failureFormula = result.failure || "1d6";
      const modifier = Number(result.modifier || 0);
      const sanType = result.sanType || "other";
      const markAdaptation = !!result.markAdaptation;

      // ---------- 4. Roll SAN check ----------
      const effectiveTarget = Math.max(
        0,
        Math.min(sanMax, sanCurrent + modifier)
      );

      const sanRoll = await new Roll("1d100").evaluate();
      const rollTotal = Number(sanRoll.total || 0);

      const isSuccess = rollTotal <= effectiveTarget;
      const isDouble =
        rollTotal % 11 === 0 && rollTotal !== 0 && rollTotal !== 100;
      const isCritSuccess = rollTotal === 1 || (isDouble && isSuccess);
      const isCritFailure = rollTotal === 100 || (isDouble && !isSuccess);

      const lossRoll = await new Roll(
        isSuccess ? successFormula : failureFormula
      ).evaluate();

      if (game.dice3d) {
        await game.dice3d.showForRoll(sanRoll, game.user, true);
      }

      const loss = Math.max(0, Number(lossRoll.total) || 0);
      const oldSan = sanCurrent;
      const newSan = Math.max(0, sanCurrent - loss);

      // ---------- 5. Apply SAN + BP flags ----------
      const updates = { [sanValuePath]: newSan };
      const hasBP = !Number.isNaN(breakingPoint);
      const crossedBreaking =
        hasBP && oldSan > breakingPoint && newSan <= breakingPoint;

      if (hasBP) updates[bpHitPath] = newSan <= breakingPoint;
      await actor.update(updates);

      // ---------- Helper: adaptation incident ----------
      async function markAdaptationIncident(actor, sanType, displayName) {
        if (!actor || !["violence", "helplessness"].includes(sanType)) return;

        const sys = actor.system || actor.data?.system || {};
        const adaptations = sys.sanity?.adaptations?.[sanType] || {};

        const basePath = `system.sanity.adaptations.${sanType}`;
        const current1 = !!adaptations.incident1;
        const current2 = !!adaptations.incident2;
        const current3 = !!adaptations.incident3;

        let pathToSet = null;
        if (!current1) pathToSet = `${basePath}.incident1`;
        else if (!current2) pathToSet = `${basePath}.incident2`;
        else if (!current3) pathToSet = `${basePath}.incident3`;

        if (!pathToSet) {
          ui.notifications?.info?.(`Already fully adapted to ${sanType}.`);
          return;
        }

        const beforeCount =
          (current1 ? 1 : 0) + (current2 ? 1 : 0) + (current3 ? 1 : 0);

        const updates = {};
        updates[pathToSet] = true;

        await actor.update(updates);

        const nowInc2 = current2 || pathToSet.endsWith("incident2");
        const nowInc3 = current3 || pathToSet.endsWith("incident3");
        const afterCount = beforeCount + 1;
        const fullyAdapted = true && nowInc2 && nowInc3;

        ui.notifications?.info?.(
          `Marked one ${sanType} SAN loss incident (${afterCount}/3).`
        );

        if (fullyAdapted) {
          const adaptUpdates = {};
          adaptUpdates[`${basePath}.isAdapted`] = true;
          await actor.update(adaptUpdates).catch(() => {});

          const label =
            sanType === "violence"
              ? "ADAPTED TO VIOLENCE"
              : "ADAPTED TO HELPLESSNESS";

          ui.notifications?.info?.(
            `${displayName} is now ${label}.`
          );

          await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `<p><b>${displayName}</b> has become <b>${label}</b>.</p>`,
          });
        }
      }

      // ---------- 5a. Adaptation ----------
      if (markAdaptation) {
        if (sanType !== "violence" && sanType !== "helplessness") {
          ui.notifications?.warn?.(
            "Adaptation is checked, but SAN source is not Violence or Helplessness. Change the dropdown if you want to record adaptation."
          );
        } else {
          const shouldAdapt = !isSuccess || (isSuccess && loss > 0);

          if (shouldAdapt) {
            await markAdaptationIncident(actor, sanType, displayName);
          }
        }
      }

      // ---------- 5b. Advance Breaking Point if crossed ----------
      if (hasBP && crossedBreaking) {
        const powValue = Number(
          foundry.utils.getProperty(
            actor,
            "system.statistics.pow.value"
          ) ?? 0
        );
        const newBP = Math.max(newSan - powValue, 0);
        await actor.update({ "system.sanity.currentBreakingPoint": newBP });
      }

      // ---------- 6. GM debug ----------
      if (game.user.isGM) {
        console.log(`SAN CHECK for ${displayName}`);
        console.log(
          `  Roll: ${rollTotal} vs target SAN ${sanCurrent} ${
            modifier >= 0 ? `+${modifier}` : modifier
          } => ${effectiveTarget}`
        );
        console.log(
          `  Result: ${isSuccess ? "SUCCESS" : "FAILURE"}${
            isCritSuccess ? " (CRIT SUCCESS)" : ""
          }${isCritFailure ? " (CRIT FAILURE)" : ""}`
        );
        console.log(
          `  Loss: ${loss} (${isSuccess ? successFormula : failureFormula})`
        );
        console.log(`  New SAN: ${newSan}/${sanMax}`);
        if (hasBP) {
          console.log(
            `  Breaking Point (old): ${breakingPoint} ${
              crossedBreaking ? "(CROSSED!)" : ""
            }`
          );
        }
        if (loss >= 5) {
          console.log(
            `  TEMPORARY INSANITY TRIGGERED (loss ${loss} SAN in a single check).`
          );
        }
      }

      // ---------- 7. Player-facing narrative + TEMPORARY INSANITY ----------
      const hasBP2 = hasBP;
      let publicText = "";
      if (hasBP2 && crossedBreaking) {
        let bpPool;
        if (isCritSuccess) bpPool = BP_CRIT_SUCCESS_LINES;
        else if (isCritFailure) bpPool = BP_CRIT_FAILURE_LINES;
        else if (isSuccess) bpPool = BP_REG_SUCCESS_LINES;
        else bpPool = BP_REG_FAILURE_LINES;

        const bpLine = pick(bpPool);
        publicText = `
          <p><b>${displayName}</b>: ${bpLine}</p>
          <p><b>BREAKING POINT REACHED.</b></p>
          <p style="font-size:15px; opacity:0.9%;">
            <b>HANDLER / PLAYER NOTE:</b> Assign or discuss a new disorder appropriate to this episode.
          </p>
        `;
      } else {
        let line, tag;
        if (isCritSuccess) {
          line = pick(CRIT_SUCCESS_LINES);
          tag = "CRITICAL SAN SUCCESS";
        } else if (isCritFailure) {
          line = pick(CRIT_FAILURE_LINES);
          tag = "CRITICAL SAN FAILURE";
        } else if (isSuccess) {
          line = pick(SAN_SUCCESS_LINES);
          tag = "SAN SUCCESS";
        } else {
          line = pick(SAN_FAILURE_LINES);
          tag = "SAN FAILURE";
        }
        publicText = `<p><b>${displayName}</b>: ${line}</p><p><b>${tag}</b>.</p>`;
      }

      if (loss >= 5) {
        publicText += `
        <p style="margin-top: 8px;">
          <b>TEMPORARY INSANITY TRIGGERED:</b> ${displayName} has lost
          <b>${loss}</b> SAN from this single shock. For a short time, the Agent is not thinking clearly.
        </p>
        <p style="font-size: 19px; opacity: 0.9%;">
          <b>HANDLER &amp; PLAYER:</b> Decide together how this episode manifests:
          <b>FLEE</b> (panic escape), <b>STRUGGLE</b> (reckless aggression), or
          <b>SUBMIT</b> (shutdown/catatonia), in a way that fits the scene and SAN source.
          In relatively calm circumstances, a successful <b>Psychotherapy</b> test may help
          end the episode early.
        </p>
      `;
      }

      await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: publicText,
      });
    } catch (err) {
      console.error("Delta Green UI | SAN macro error:", err);
      ui.notifications.error("Error running SAN check.");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* CHAT / ROLL DISPLAY                                                      */
  /* ------------------------------------------------------------------------ */

  static async processMessage(content) {
    if (!content || !String(content).trim()) return;
    try {
      if (this.isRollCommand(content)) {
        await this.processRollCommand(content);
      } else {
        await this.sendRegularMessage(content);
      }
      this.requestLoadMessages?.();
    } catch (error) {
      console.error("Delta Green UI | Error processing message:", error);
      ui.notifications.error("Erreur lors de l'envoi du message");
    }
  }

  static isRollCommand(content) {
    return (
      content.startsWith("/roll") ||
      content.startsWith("/r") ||
      content.startsWith("/gmroll") ||
      content.startsWith("/blindroll") ||
      content.startsWith("/selfroll") ||
      content.includes("[[") ||
      content.includes("{{")
    );
  }

  static async processRollCommand(content) {
    const rollTypes = {
      "/roll": { mode: CONST.DICE_ROLL_MODES.PUBLIC },
      "/r": { mode: CONST.DICE_ROLL_MODES.PUBLIC },
      "/gmroll": { mode: CONST.DICE_ROLL_MODES.PRIVATE },
      "/blindroll": { mode: CONST.DICE_ROLL_MODES.BLIND },
      "/selfroll": { mode: CONST.DICE_ROLL_MODES.SELF },
    };

    try {
      if (content.includes("[[") || content.includes("{{")) {
        await ChatMessage.create({
          content,
          user: game.user.id,
          speaker: ChatMessage.getSpeaker(),
        });
        return;
      }

      let rollMode = CONST.DICE_ROLL_MODES.PUBLIC;
      let formula = "";
      let flavor = "";

      for (const [cmd, cfg] of Object.entries(rollTypes)) {
        if (content.startsWith(cmd)) {
          rollMode = cfg.mode;
          formula = content.substring(cmd.length).trim();
          break;
        }
      }

      if (!formula) {
        ui.notifications.warn("Formule de dé invalide");
        return;
      }

      const parts = formula.split("#");
      if (parts.length > 1) {
        formula = parts[0].trim();
        flavor = parts.slice(1).join("#").trim();
      }

      const roll = new Roll(formula);
      await roll.evaluate();

      await roll.toMessage({
        speaker: ChatMessage.getSpeaker(),
        flavor: flavor || `Unregistered Activity`,
        rollMode,
      });
    } catch (err) {
      console.error("Delta Green UI | processRollCommand error:", err);
      ui.notifications.error("Error while rolling.");
    }
  }

  static async sendRegularMessage(content) {
    await ChatMessage.create({
      content,
      user: game.user.id,
      speaker: ChatMessage.getSpeaker(),
      type: CHAT_STYLES.OTHER,
    });
  }

  static _buildRollContent(msg) {
    const roll = (msg.rolls && msg.rolls.length > 0 && msg.rolls[0]) || null;
    if (!roll) return msg.content;

    const total = roll.total ?? "";
    const dgFlags = msg.flags?.[DeltaGreenUI.ID] || {};
    const isTyped = !!dgFlags.typed;
    const isStat = !!dgFlags.statRoll;
    const isSkill = !!dgFlags.skillRoll || isTyped;

    let skillLabel = msg.flavor || "";
    let target =
      dgFlags.target ??
      (dgFlags.baseTarget != null && dgFlags.modifier != null
        ? dgFlags.baseTarget + dgFlags.modifier
        : null);

    const tmp = $("<div>").html(msg.content || "");
    const plain = tmp.text().trim().toLowerCase();

    const isMarked = !!dgFlags.marked || plain.includes("this skill is marked");

    let isCritSuccess = false;
    let isCritFailure = false;
    let isFailure = false;
    let isSuccess = false;

    if (isSkill || isStat) {
      const outcome = dgFlags.outcome;
      const crit = dgFlags.crit;
      if (crit === "critSuccess") isCritSuccess = true;
      else if (crit === "critFailure") isCritFailure = true;
      if (isCritFailure) isFailure = true;
      else if (isCritSuccess) isSuccess = true;
      else if (outcome === "success") isSuccess = true;
      else if (outcome === "failure") isFailure = true;
    } else {
      isCritSuccess = plain.includes("critical success");
      isCritFailure =
        plain.includes("critical failure") || plain.includes("fumble");
      isFailure = isCritFailure || plain.includes("failure");
      isSuccess =
        !isFailure &&
        (plain.includes("success") ||
          plain.includes("succeeded") ||
          plain.includes("passed"));
      const mTarget = /target:\s*([0-9]+)%/i.exec(plain);
      if (mTarget) target = Number(mTarget[1]);
    }

    let valueClass = "dg-roll-value";
    if (isCritSuccess) valueClass += " dg-roll-crit-success";
    else if (isCritFailure) valueClass += " dg-roll-crit-failure";
    else if (isFailure) valueClass += " dg-roll-failure";
    else if (isSuccess) valueClass += " dg-roll-success";

    const markedLine =
      isMarked && (isSkill || isStat)
        ? `<div class="dg-roll-marked">This skill is marked ☣</div>`
        : "";

    let targetLine = "";
    if (target != null) {
      const baseTarget = dgFlags.baseTarget;
      const modifier = dgFlags.modifier;
      let extra = "";

      if (baseTarget != null && !Number.isNaN(Number(baseTarget))) {
        const modNum = Number(modifier || 0);
        const modText = modNum
          ? modNum > 0
            ? ` +${modNum}`
            : ` ${modNum}`
          : "";
        extra = ` (BASE ${baseTarget}${modText})`;
      }

      targetLine = `<div class="dg-roll-target">TARGET: ${target}%${extra}</div>`;
    }

    return `
      <div class="dg-roll-result">
        ${skillLabel ? `<div class="dg-roll-skill">${skillLabel}</div>` : ""}
        ${targetLine}
        <div class="${valueClass}">${total}</div>
        ${markedLine}
      </div>
    `;
  }

  static loadMessages() {
    try {
      const chatMessages = game.messages.contents.slice(-50);

      if (this.messages.length === 0 || this.messages.length > 60) {
        this.messages = chatMessages.map((msg) => {
          const isRoll = (msg.rolls?.length ?? 0) > 0;

          return {
            id: msg.id,
            sender: this.getMessageSender(msg),
            userId: msg.author?.id ?? msg.user?.id ?? null,
            content: isRoll ? this._buildRollContent(msg) : msg.content,
            timestamp: msg.timestamp,
          };
        });
      } else {
        const existing = new Set(this.messages.map((m) => m.id));
        const add = [];

        for (const msg of chatMessages) {
          if (existing.has(msg.id)) continue;

          const isRoll = (msg.rolls?.length ?? 0) > 0;

          add.push({
            id: msg.id,
            sender: this.getMessageSender(msg),
            userId: msg.author?.id ?? msg.user?.id ?? null,
            content: isRoll ? this._buildRollContent(msg) : msg.content,
            timestamp: msg.timestamp,
          });
        }

        this.messages = [...this.messages, ...add].slice(-50);
      }

      this.displayMessages();
    } catch (err) {
      console.error("Delta Green UI | loadMessages error:", err);
    }
  }

  static resetMessages() {
    console.log("Delta Green UI | Resetting message list");
    this.messages = [];
    this.loadMessages();
  }

  static formatSenderName(user) {
    const MODULE_ID = DeltaGreenUI.ID;

    if (!user) return "UNKNOWN";

    // 1) GM: if a token is selected, talk as THAT actor
    if (user.isGM && canvas?.tokens?.controlled?.length) {
      const token = canvas.tokens.controlled[0];
      const actor = token?.actor;
      if (actor) {
        const fromName = this._shortenName(actor.name || "");
        if (fromName) return fromName;

        try {
          const first =
            (actor.getFlag && actor.getFlag(MODULE_ID, "firstName")) || "";
          const middle =
            (actor.getFlag && actor.getFlag(MODULE_ID, "middleName")) || "";
          const surname =
            (actor.getFlag && actor.getFlag(MODULE_ID, "surname")) ||
            (actor.getFlag && actor.getFlag(MODULE_ID, "reference")) ||
            "";

          const parts = [first, middle]
            .map((p) => (p ?? "").toString().trim())
            .filter(Boolean);

          if (parts.length) return parts.join(" ").toUpperCase();
          if (surname && first) return `${first} ${surname}`.toUpperCase();
        } catch (e) {
          console.warn(
            "Delta Green UI | MailSystem.formatSenderName flag lookup failed (GM token branch)",
            e
          );
        }

        if (actor.name) return actor.name.toUpperCase();
      }
      return "HANDLER";
    }

    // 2) Non-GM: use assigned character if present
    const actor = user.character;
    if (actor) {
      const fromName = this._shortenName(actor.name || "");
      if (fromName) return fromName;

      try {
        const first =
          (actor.getFlag && actor.getFlag(MODULE_ID, "firstName")) || "";
        const middle =
          (actor.getFlag && actor.getFlag(MODULE_ID, "middleName")) || "";
        const surname =
          (actor.getFlag && actor.getFlag(MODULE_ID, "surname")) ||
          (actor.getFlag && actor.getFlag(MODULE_ID, "reference")) ||
          "";

        const parts = [first, middle]
          .map((p) => (p ?? "").toString().trim())
          .filter(Boolean);

        if (parts.length) return parts.join(" ").toUpperCase();
        if (surname && first) return `${first} ${surname}`.toUpperCase();
      } catch (e) {
        console.warn(
          "Delta Green UI | MailSystem.formatSenderName flag lookup failed",
          e
        );
      }

      if (actor.name) return actor.name.toUpperCase();
    }

    // 3) GM with no token / no actor: generic HANDLER
    if (user.isGM) return "HANDLER";

    // 4) Last fallback: Foundry user name
    return (user.name || "UNKNOWN").toUpperCase();
  }

  static displayMessages() {
    try {
      const container = $("#dg-messages-container");
      if (!container.length) return;

      container.empty();

      if (this.messages.length === 0) {
        container.append("<p>NO MESSAGES</p>");
        return;
      }

      for (const msg of this.messages) {
        const messageDiv = $('<div class="dg-message"></div>');

        let user = msg.userId ? game.users.get(msg.userId) : null;
        if (!user) {
          user = game.users.find(
            (u) =>
              (u.isGM && msg.sender === "HANDLER") ||
              u.name.toUpperCase() === msg.sender
          );
        }
        const color = user ? user.color : "#33ff33";

        messageDiv.append(
          `<div class="dg-message-sender" style="color:${color}">${msg.sender}</div>`
        );
        messageDiv.append(
          `<div class="dg-message-content">${msg.content}</div>`
        );

        container.append(messageDiv);
      }

      container.scrollTop(container[0].scrollHeight);

      if (
        DeltaGreenUI &&
        typeof DeltaGreenUI.updateMiniChatWindow === "function"
      ) {
        DeltaGreenUI.updateMiniChatWindow(this.messages);
      }
    } catch (err) {
      console.error("Delta Green UI | displayMessages error:", err);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* APPLY MARKED SKILLS (END-OF-OP)                                          */
  /* ------------------------------------------------------------------------ */

  static async applyMarkedSkillImprovements() {
    try {
      const actor = this._getCurrentActor();
      if (!actor) {
        ui.notifications.warn("Select a token or have an assigned character.");
        return;
      }

      const results = [];
      const updates = {};

      const processCollection = async (collection, basePath, isTyped = false) => {
        for (const [key, skill] of Object.entries(collection || {})) {
          const marked = !!skill?.failure;
          if (!marked) continue;

          const current = Number(skill?.proficiency ?? 0) || 0;

          const testRoll = await new Roll("1d100").evaluate();
          const testTotal = Number(testRoll.total ?? 0);

          let improved = false;
          let delta = 0;
          let newValue = current;

          if (testTotal > current) {
            const incRoll = await new Roll("1d4").evaluate();
            delta = Number(incRoll.total ?? 0) || 0;
            newValue = Math.min(99, current + delta);
            updates[`${basePath}.${key}.proficiency`] = newValue;
            improved = true;
          }

          updates[`${basePath}.${key}.failure`] = false;

          let label;
          if (isTyped) {
            const group = (skill.group || "TYPED").toUpperCase();
            const lab = (skill.label || key).toUpperCase();
            label = `${group} (${lab})`;
          } else {
            label =
              (
                game.i18n?.localize?.(`DG.Skills.${key}`) ||
                key
              ).toString().toUpperCase();
          }

          results.push({
            key,
            label,
            isTyped,
            current,
            newValue,
            improved,
            delta,
            testTotal,
          });
        }
      };

      await processCollection(actor.system?.skills, "system.skills", false);
      await processCollection(
        actor.system?.typedSkills,
        "system.typedSkills",
        true
      );

      if (!results.length) {
        ui.notifications.info("No marked skills to improve (☣).");
        return;
      }

      if (Object.keys(updates).length > 0) {
        await actor.update(updates);
      }

      const lines = results.map((r) => {
        const baseLine = `${r.label}: ${r.current}% → ${
          r.improved ? `<b>${r.newValue}%</b>` : `${r.newValue}%`
        }`;

        const rollPart = ` (ADV roll: ${r.testTotal})`;
        const deltaPart = r.improved ? `  [+${r.delta}]` : "  [no improvement]";

        return `<li>☣ ${baseLine}${rollPart}${deltaPart}</li>`;
      });

      const content = `
        <div class="dg-roll-result">
          <div class="dg-roll-skill">APPLY MARKED SKILLS ☣</div>
          <div class="dg-roll-target">
            End-of-operation skill advancement for ${actor.name}.
          </div>
          <ul>
            ${lines.join("\n")}
          </ul>
          <div class="dg-roll-marked">
            ☣ indicates skills that were marked for improvement this operation.
          </div>
        </div>
      `;

      await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content,
        type: CHAT_STYLES.OTHER,
      });

      this.requestLoadMessages?.();
    } catch (err) {
      console.error(
        "Delta Green UI | applyMarkedSkillImprovements error:",
        err
      );
      ui.notifications.error("Error applying marked skill improvements.");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* SKILL MARKING FROM FLAGS                                                 */
  /* ------------------------------------------------------------------------ */

  static async _markSkillOnActorFromFlags(message) {
    try {
      const dgFlags = message.flags?.[DeltaGreenUI.ID];
      if (!dgFlags) return;

      const {
        systemKey,
        marked,
        typed,
        skillRoll,
        weaponAttack,
        usesStatX5,
      } = dgFlags;

      // Must explicitly be marked and have a key
      if (!marked || !systemKey) return;

      // Only care about actual skill rolls or weapon attacks
      if (!skillRoll && !weaponAttack) return;

      // DO NOT mark for STAT-based weapon rolls (DEX×5, etc.)
      if (weaponAttack && usesStatX5) return;

      const speaker = message.speaker || {};
      const actorId = speaker.actor;
      let actor = actorId ? game.actors.get(actorId) : null;
      if (!actor) actor = this._getCurrentActor();
      if (!actor) return;

      const basePath = typed
        ? `system.typedSkills.${systemKey}`
        : `system.skills.${systemKey}`;

      // If there's no real skill object here, bail (don't create ghost skills)
      const skillData = foundry.utils.getProperty(actor, basePath);
      if (!skillData || typeof skillData !== "object") return;

      const alreadyFailed = skillData.failure;
      if (alreadyFailed) return;

      const updates = {};
      updates[`${basePath}.failure`] = true;

      await actor.update(updates);
    } catch (err) {
      console.error("Delta Green UI | _markSkillOnActorFromFlags error:", err);
    }
  }

  static renderChatMessage(message, html, data) {
    try {
      if (!message) return;

      const dgFlags = message.flags?.[DeltaGreenUI.ID];
      if (
        dgFlags &&
        dgFlags.marked &&
        dgFlags.skillRoll &&         // only from skill rolls
        !dgFlags.weaponAttack        // never from weapon-only attacks
      ) {
        this._markSkillOnActorFromFlags(message);
      }

      if (this.messages.find((m) => m.id === message.id)) return;

      const isRoll = (message.rolls?.length ?? 0) > 0;

      this.messages.push({
        id: message.id,
        sender: this.getMessageSender(message),
        userId: message.author?.id ?? message.user?.id ?? null,
        content: isRoll ? this._buildRollContent(message) : message.content,
        timestamp: message.timestamp,
      });

      this.messages = this.messages.slice(-50);
      this.displayMessages();
    } catch (err) {
      console.error("Delta Green UI | renderChatMessage error:", err);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* BATCHED REFRESH HELPERS                                                  */
  /* ------------------------------------------------------------------------ */

  static _scheduleActorRefresh(actor) {
    const current = this._getCurrentActor();
    if (!current || actor?.id !== current.id) return;

    if (this._lastActorId === current.id && !this._actorRefreshTimeout) {
      return;
    }

    this._pendingActorRefreshActor = actor || current;

    if (this._actorRefreshTimeout) return;

    this._actorRefreshTimeout = setTimeout(() => {
      try {
        const a = this._pendingActorRefreshActor || this._getCurrentActor();
        if (!a) return;

        this._lastActorId = a.id;

        this.refreshSkillHotbar();
        this.refreshTypedSkillButtons();
        this.refreshWeaponHotbar();
        this.refreshStatButtons();
        this.refreshHpWpPanel(a);
        this._refreshSanButtonStatus(a);
        this._updateMailHeaderActorName(a);
      } finally {
        this._actorRefreshTimeout = null;
        this._pendingActorRefreshActor = null;
      }
    }, 200);
  }

  static requestLoadMessages() {
    if (this._loadMessagesTimeout) return;

    this._loadMessagesTimeout = setTimeout(() => {
      try {
        this.loadMessages();
      } finally {
        this._loadMessagesTimeout = null;
      }
    }, 75);
  }

  /* ------------------------------------------------------------------------ */
  /* PUBLIC SEND                                                              */
  /* ------------------------------------------------------------------------ */

  static async sendMessage(content) {
    if (!content || !String(content).trim()) return;
    try {
      if (this.isRollCommand(content)) {
        await this.processRollCommand(content);
      } else {
        await this.sendRegularMessage(content);
      }
      this.requestLoadMessages?.();
    } catch (error) {
      console.error("Delta Green UI | Error sending message:", error);
      ui.notifications.error("Error sending message");
    }
  }
}

// Global delegated handler for the SHOW% / HIDE% toggle button
$(document).on("click", "#dg-toggle-skill-numbers", async (event) => {
  event.preventDefault();

  MailSystem.showSkillNumbers = !MailSystem.showSkillNumbers;

  const $btn = $(event.currentTarget);

  if (MailSystem.showSkillNumbers) {
    $btn.text("HIDE %");
    $btn
      .removeClass("dg-skillnumbers-hidden")
      .addClass("dg-skillnumbers-visible");
  } else {
    $btn.text("SHOW %");
    $btn
      .removeClass("dg-skillnumbers-visible")
      .addClass("dg-skillnumbers-hidden");
  }

  try {
    await game.user?.setFlag?.(
      DeltaGreenUI.ID,
      "showSkillNumbers",
      MailSystem.showSkillNumbers
    );
  } catch (e) {
    console.warn(
      "Delta Green UI | Could not persist showSkillNumbers flag",
      e
    );
  }

  MailSystem.refreshSkillHotbar();
  MailSystem.refreshTypedSkillButtons();
  MailSystem.refreshStatButtons?.();
});
