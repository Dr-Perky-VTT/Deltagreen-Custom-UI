// rolls-manager.js
// Read-only roll viewer for the CRT UI
// - Mirrors MailSystem's roll formatting
// - Shows a small roll history window, no sending/rolling functions

import { MailSystem } from "./mail-system.js";

export class RollsManager {
  static rolls = [];
  static MAX_ROLLS = 5;

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
    Hooks.on("renderChatMessage", (message) => {
      try {
        this._handleNewMessage(message);
      } catch (err) {
        console.error("Delta Green UI | RollsManager renderChatMessage error:", err);
      }
    });

    // Keep the "LOGGED IN" header in sync with token / actor changes
    Hooks.on("controlToken", () => {
      try {
        this._updateActorHeader();
      } catch (err) {
        console.error("Delta Green UI | RollsManager controlToken error:", err);
      }
    });

    Hooks.on("updateActor", (actor) => {
      try {
        const current = this._getCurrentActor();
        if (current && actor?.id === current.id) {
          this._updateActorHeader(actor);
        }
      } catch (err) {
        console.error("Delta Green UI | RollsManager updateActor error:", err);
      }
    });
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

  const getShortAgentName = (rawName) => {
    if (!rawName || typeof rawName !== "string") return "UNKNOWN";

    const parts = rawName.trim().split(/\s+/).filter(Boolean);

    if (parts.length >= 4) {
      // Prefer 3rd + 4th
      return `${parts[2]} ${parts[3]}`;
    } else if (parts.length === 3) {
      // Fallback: 2nd + 3rd
      return `${parts[1]} ${parts[2]}`;
    } else if (parts.length === 2) {
      // Fallback: both
      return `${parts[0]} ${parts[1]}`;
    }

    return parts[0] || "UNKNOWN";
  };

  const rawName = (current.name || "UNKNOWN").trim();
  const shortName = getShortAgentName(rawName);

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
      (message.rolls && message.rolls.length > 0) ||
      message.type === CONST.CHAT_MESSAGE_TYPES.ROLL;

    return !!(hasRollObj || hasDgRollFlag);
  }

  static _formatSender(user) {
    // Reuse MailSystem's naming so it matches the mail view (AGENT X / HANDLER)
    try {
      return MailSystem.formatSenderName(user);
    } catch (_e) {
      return (user?.name || "UNKNOWN").toUpperCase();
    }
  }

  // Build from existing chat messages on first render
  static _hydrateFromChat() {
    const all = game.messages?.contents || [];
    const recentRolls = all.filter((m) => this._isRollMessage(m)).slice(-this.MAX_ROLLS);

    this.rolls = recentRolls.map((msg) => ({
      id: msg.id,
      sender: this._formatSender(msg.user),
      // This uses the exact same logic as the MailSystem view
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
      sender: this._formatSender(message.user),
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
