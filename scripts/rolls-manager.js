// rolls-manager.js
// Read-only roll viewer for the CRT UI
// - Mirrors MailSystem's roll formatting
// - Shows a small roll history window, no sending/rolling functions

import { MailSystem } from "./mail-system.js";

export class RollsManager {
  static rolls = [];
  static MAX_ROLLS = 5;

  // Debounced refresh state for header / skill stuff
  static _refreshTimeout = null;
  static _pendingActorId = null;

  static init() {
    console.log("Delta Green UI | RollsManager init");

    // When the CRT UI DOM is ready, hydrate from recent chat
    Hooks.on("renderDeltaGreenUI", () => {
      try {
        this._updateActorHeader();
        this._hydrateFromChat();
        this.render();
      } catch (err) {
        console.error("Delta Green UI | RollsManager renderDeltaGreenUI error:", err);
      }
    });

    // Whenever a new chat message is rendered, see if it's a roll and mirror it
    Hooks.on("renderChatMessageHTML", (message /*, html, data */) => {
      try {
        this._handleNewMessage(message);
      } catch (err) {
        console.error("Delta Green UI | RollsManager renderChatMessageHTML error:", err);
      }
    });

    // Keep the "LOGGED IN" header (and future skill list) in sync with token / actor changes
    Hooks.on("controlToken", () => {
      try {
        const current = this._getCurrentActor();
        if (current) {
          this._scheduleRollsRefresh(current);
        }
      } catch (err) {
        console.error("Delta Green UI | RollsManager controlToken error:", err);
      }
    });

    // 🔹 When actor updates, and it's the current one, react to skill changes
    Hooks.on("updateActor", (actor, changes) => {
      try {
        const current = this._getCurrentActor();
        if (!current || actor?.id !== current.id) return;

        const skillChanged =
          (changes?.system && (
            changes.system.skills ||
            changes.system.typedSkills
          )) ?? false;

        // If any skills changed (including marking/unmarking), refresh the skillbar
        if (skillChanged) {
          try {
            if (typeof MailSystem.refreshSkillHotbar === "function") {
              MailSystem.refreshSkillHotbar();
            }
            if (typeof MailSystem.refreshTypedSkillButtons === "function") {
              MailSystem.refreshTypedSkillButtons();
            }
          } catch (e) {
            console.error("Delta Green UI | RollsManager skillbar refresh error:", e);
          }
        }

        // Debounced Rolls tab header / skill-card refresh
        this._scheduleRollsRefresh(actor);
      } catch (err) {
        console.error("Delta Green UI | RollsManager updateActor error:", err);
      }
    });
  }

  // -----------------------------------------------------------------------
  //  Debounced refresh helpers (header + future skill list)
  // -----------------------------------------------------------------------

  /**
   * Schedule a single refresh of the ROLLS view (header + skill list).
   */
  static _scheduleRollsRefresh(actor) {
    this._pendingActorId = actor?.id ?? this._pendingActorId;

    if (this._refreshTimeout) {
      clearTimeout(this._refreshTimeout);
    }

    this._refreshTimeout = setTimeout(() => {
      this._refreshTimeout = null;
      this._refreshRollsForPendingActor();
    }, 150);
  }

  static _refreshRollsForPendingActor() {
    try {
      const isActive =
        game.user?.getFlag("deltagreen-custom-ui", "interfaceActive") === true;
      if (!isActive) return;

      const rollsView = document.getElementById("dg-view-rolls");
      if (!rollsView) return;
      // We still refresh header/skills even if the tab isn't visible,
      // so when you open it, it's already up to date.

      let actor = null;
      if (this._pendingActorId) {
        actor = game.actors.get(this._pendingActorId) || null;
      }
      if (!actor) {
        actor = this._getCurrentActor();
      }

      this.refreshForActor(actor);
    } catch (err) {
      console.error("Delta Green UI | RollsManager _refreshRollsForPendingActor error:", err);
    }
  }

  /**
   * Refresh everything in the ROLLS view for an actor.
   * Right now that's just the header, but if you add a skill list,
   * this is where it will get updated whenever a skill gets marked/changed.
   */
  static refreshForActor(actor) {
    try {
      this._updateActorHeader(actor);

      // If you later add a skill list under ROLLS, implement buildSkillList(actor)
      // and it will automatically ride this same refresh pipeline.
      if (typeof this.buildSkillList === "function" && actor) {
        this.buildSkillList(actor);
      }
    } catch (err) {
      console.error("Delta Green UI | RollsManager.refreshForActor error:", err);
    }
  }

  // -----------------------------------------------------------------------
  //  Helpers
  // -----------------------------------------------------------------------

  static _getCurrentActor() {
    try {
      if (canvas && canvas.tokens && canvas.tokens.controlled?.length === 1) {
        return canvas.tokens.controlled[0].actor;
      }
    } catch (_e) {}
    if (game.user?.character) return game.user.character;
    return null;
  }

  static _updateActorHeader(actor = null) {
    const nameEl = document.getElementById("dg-rolls-actor-name");
    if (!nameEl) return;

    const current = actor || this._getCurrentActor();
    if (!current) {
      nameEl.textContent = "LOGGED IN: NO AGENT SELECTED";
      return;
    }

    // Reuse MailSystem's shortening logic so it matches the Mail header
    const rawName = (current.name || "UNKNOWN").trim();
    const shortName =
      (MailSystem._shortenName && MailSystem._shortenName(rawName)) ||
      rawName.toUpperCase();

    nameEl.textContent = `LOGGED IN: ${shortName.toUpperCase()}`;
  }

  static _isRollMessage(message) {
    if (!message) return false;

    const dgFlags = message.flags?.["deltagreen-custom-ui"] || {};
    const hasDgRollFlag =
      dgFlags.skillRoll ||
      dgFlags.statRoll ||
      dgFlags.weaponAttack ||
      dgFlags.weaponSummary;

    const hasRollObj =
      message.isRoll === true ||
      (message.rolls && message.rolls.length > 0);

    return !!(hasRollObj || hasDgRollFlag);
  }

  static _formatSenderFromMessage(message) {
    try {
      if (MailSystem.getMessageSender) {
        // Use the exact same sender logic as the mail view
        return MailSystem.getMessageSender(message);
      }

      const user = message.author || message.user;
      return MailSystem.formatSenderName
        ? MailSystem.formatSenderName(user)
        : (user?.name || "UNKNOWN").toUpperCase();
    } catch (_e) {
      const user = message.author || message.user;
      return (user?.name || "UNKNOWN").toUpperCase();
    }
  }

  // Build from existing chat messages on first render
  static _hydrateFromChat() {
    const all = game.messages?.contents || [];
    const recentRolls = all.filter((m) => this._isRollMessage(m)).slice(-this.MAX_ROLLS);

    this.rolls = recentRolls.map((msg) => ({
      id: msg.id,
      sender: this._formatSenderFromMessage(msg),
      content: MailSystem._buildRollContent(msg),
      timestamp: msg.timestamp
    }));
  }

  // Handle a brand-new chat message
  static _handleNewMessage(message) {
    if (!this._isRollMessage(message)) return;

    // Don't duplicate if we already have it
    if (this.rolls.find((r) => r.id === message.id)) return;

    const entry = {
      id: message.id,
      sender: this._formatSenderFromMessage(message),
      content: MailSystem._buildRollContent(message),
      timestamp: message.timestamp
    };

    this.rolls.push(entry);
    if (this.rolls.length > this.MAX_ROLLS) {
      this.rolls = this.rolls.slice(-this.MAX_ROLLS);
    }

    this.render();
  }

  // -----------------------------------------------------------------------
  //  Render into #dg-rolls-body
  // -----------------------------------------------------------------------

  static render() {
    const container = document.getElementById("dg-rolls-body");
    if (!container) return;

    container.innerHTML = "";

    if (!this.rolls.length) {
      container.innerHTML = `<div class="dg-placeholder">NO ROLLS YET</div>`;
      return;
    }

    for (const entry of this.rolls) {
      const wrapper = document.createElement("div");
      wrapper.classList.add("dg-rolls-entry");

      const sender = document.createElement("div");
      sender.classList.add("dg-rolls-sender");
      sender.textContent = entry.sender;
      wrapper.appendChild(sender);

      const content = document.createElement("div");
      content.classList.add("dg-rolls-content");
      content.innerHTML = entry.content; // contains .dg-roll-result, etc.
      wrapper.appendChild(content);

      container.appendChild(wrapper);
    }

    container.scrollTop = container.scrollHeight;
  }
}

// Kick this on ready so the hooks are registered
Hooks.once("ready", () => {
  RollsManager.init();
});
