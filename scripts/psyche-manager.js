// psyche-manager.js

// ---------------------------------------------------------------------------
// ORIENTATION STATES + PROMPTS (RP FLAVOR)
// ---------------------------------------------------------------------------
const ORIENTATION_STATES = {
  grounded: {
    label:
      "ORIENTATION: INTACT; no notable deficits in person, place, time, or situation."
  },
  strained: {
    label:
      "ORIENTATION: STRAINED; mild, self-limited lapses in recall and focus."
  },
  frayed: {
    label:
      "ORIENTATION: FRAYED; recurrent lapses in orientation; functional but unstable."
  },
  fragmented: {
    label:
      "ORIENTATION: FRAGMENTED; marked disorientation in one or more domains."
  }
};

const ORIENTATION_PROMPTS = {
  grounded: [
    "Appears stressed but maintains clear, consistent orientation to self and environment.",
    "Checks details out of habit rather than necessity; no persistent confusion reported."
  ],

  strained: [
    // mild lapses
    "Occasional difficulty recalling names or prior interactions, but reorients quickly.",
    "Recognizes faces reliably; specific biographical details sometimes lag behind.",
    "Infrequent moments of uncertainty about route or layout in familiar settings.",
    "Reports needing to pause and confirm direction more often than baseline.",
    "Surprised by how much time has passed during tasks; re-checks clocks regularly.",
    "Occasional uncertainty whether an event occurred earlier today or on a previous day.",
    "Intermittently loses the thread of a task or conversation, then recovers with minimal prompting.",
    "Reports classic ‘walked into a room and forgot why’ episodes, without lasting confusion."
  ],

  frayed: [
    // edge of BP
    "Reports familiar faces without clear recall of context; relies on others to fill in details.",
    "At times recognizes emotional valence toward a person but not the reason for it.",
    "Describes layouts as ‘off’ or subtly changed in otherwise stable environments.",
    "Experiences brief disorientation in known buildings, requiring a moment to reorient.",
    "Struggles to place recent events on a precise timeline; subjective sense of time feels unreliable.",
    "Frequently re-checks schedule or clocks; describes time as ‘slipping’ or ‘jumping’.",
    "Momentarily prepares for the wrong task or objective before catching the mismatch.",
    "Needs periodic reminders of current operational goal when under stress."
  ],

  fragmented: [
    // below BP
    "Occasional hesitation when stating own name or role; historical identities intrude.",
    "Refers to past positions or assignments as if they remain current.",
    "Requires external cues to categorize current environment (home vs. workplace vs. clinic).",
    "Reports a mismatch between how a location ‘feels’ and what it is reported to be.",
    "Confidently misidentifies current year or season before accepting correction.",
    "Relies heavily on external prompts to maintain temporal orientation; internal calendar described as ‘floating’.",
    "Shows inconsistent understanding of current mission, occasionally reverting to obsolete objectives.",
    "Needs repeated clarification of chain of command or organizational affiliation."
  ]
};

function getRandomOrientationPrompt(stateKey) {
  const pool = ORIENTATION_PROMPTS[stateKey] || [];
  if (!pool.length) return "";
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

// ---------------------------------------------------------------------------
// PSYCHE MANAGER
// ---------------------------------------------------------------------------
export class PsycheManager {
  /* ----------------------------------------------------------------------- */
  /*  INIT & HOOKS                                                           */
  /* ----------------------------------------------------------------------- */

  static init() {
    console.log("Delta Green UI | PsycheManager init");

    // When the CRT interface is rendered and ready, populate the panel
    Hooks.on("renderDeltaGreenUI", () => {
      this.refresh();
    });

    // When the controlled token changes, refresh
    Hooks.on("controlToken", () => {
      this.refresh();
    });

    // Keep in sync with actor updates (SAN changes, BP, adaptations, etc.)
    Hooks.on("updateActor", (actor) => {
      const current = this._getCurrentActor();
      if (current && actor.id === current.id) {
        this.refresh(current);
      }
    });

    // Motivations / disorders / bonds are items
    Hooks.on("createItem", (item, options, userId) => {
      this._refreshIfItemRelevant(item);
    });
    Hooks.on("updateItem", (item, options, userId) => {
      this._refreshIfItemRelevant(item);
    });
    Hooks.on("deleteItem", (item, options, userId) => {
      this._refreshIfItemRelevant(item);
    });

    // Delegated click handler for list entries (motivations, disorders, bonds)
    $(document).on("click", ".dg-psyche-item", (ev) => {
      this._onClickPsycheItem(ev);
    });
    // right-click (context menu) to delete motivations / disorders / bonds
    $(document).on("contextmenu", ".dg-psyche-item", (ev) => {
      this._onRightClickPsycheItem(ev);
    });
    // SAN check button
    $(document).on("click", "#dg-psyche-sancheck", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      await PsycheManager.runSanCheckDialogMacro();
    });

    // PROJECT ONTO BOND button
    $(document).on("click", "#dg-psyche-project-bond", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      await PsycheManager.runProjectOntoBondMacro();
    });
    // ADD MOTIVATION / DISORDER
    $(document).on("click", "#dg-psyche-add-motivation", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      await PsycheManager._createMotivationItem();
    });

    // ADD BOND
    $(document).on("click", "#dg-psyche-add-bond", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      await PsycheManager._createBondItem();
    });
    // REPRESS INSANITY button
    $(document).on("click", "#dg-psyche-repress-insanity", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      await PsycheManager.runRepressInsanityMacro();
    });

    // Adaptation checkboxes
    $(document).on("change", ".dg-psyche-adapt-checkbox", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      await PsycheManager._onChangeAdaptationCheckbox(ev);
    });
  }

  static _refreshIfItemRelevant(item) {
    const actor = item?.parent;
    const current = this._getCurrentActor();
    if (!actor || !current || actor.id !== current.id) return;

    if (item.type === "motivation" || item.type === "bond") {
      this.refresh(current);
    }
  }

  /* ----------------------------------------------------------------------- */
  /*  CORE REFRESH                                                           */
  /* ----------------------------------------------------------------------- */

  /**
   * Main entry point. Rebuilds the Psyche view based on the current actor.
   */
  static refresh(actorOverride = null) {
    // Make sure the psyche view exists in the DOM
    const root = document.getElementById("dg-psyche-root");
    if (!root) return;

    const actor = actorOverride || this._getCurrentActor();

    if (!actor) {
      this._setActorName("LOGGED IN: —");
      this._setReport("NO SUBJECT DATA AVAILABLE.");
      this._setEmptyList("#dg-motivations-list", "NO MOTIVATIONS RECORDED");
      this._setEmptyList("#dg-disorders-list", "NO DISORDERS RECORDED");
      this._setEmptyList("#dg-bonds-list", "NO BONDS RECORDED");
      return;
    }

    // --- 1) Actor name -----------------------------------------------------
    this._setActorNameFromActor(actor);

    // --- 2) Data extraction -----------------------------------------------
    const san = actor.system?.sanity ?? {};
    const sanValue = san.value ?? null;
    const sanMax = san.max ?? null;
    const breakingPoint = san.currentBreakingPoint ?? null;

    const adaptations = san.adaptations ?? {};
    const violence = adaptations.violence ?? {};
    const helplessness = adaptations.helplessness ?? {};

    const violenceAdapted = !!violence.isAdapted;
    const helplessnessAdapted = !!helplessness.isAdapted;

    // Motivations & disorders are all item.type === "motivation"
    const allMotivations = actor.items.filter((i) => i.type === "motivation");
    const motivations = allMotivations.filter((i) => !i.system?.crossedOut);
    const disorders = allMotivations.filter((i) => i.system?.crossedOut);

    // Bonds (standard DG system)
    const bonds = actor.items.filter((i) => i.type === "bond");
    const damagedBondsCount = bonds.filter(
      (b) => b.system?.hasBeenDamagedSinceLastHomeScene
    ).length;

    // --- 3) Build psychological evaluation text ---------------------------
    const reportText = this._buildPsycheReport({
      actor,
      sanValue,
      sanMax,
      breakingPoint,
      violenceAdapted,
      helplessnessAdapted,
      motivationsCount: motivations.length,
      disordersCount: disorders.length,
      bondsCount: bonds.length,
      damagedBondsCount
    });

    this._setReport(reportText);

    // --- 3a) Sync adaptation checkboxes in the CRT panel ------------------
    this._syncAdaptationCheckboxes({ violence, helplessness });

    // --- 4) Populate lists -------------------------------------------------

    // Motivations list
    this._fillList(
      "#dg-motivations-list",
      motivations,
      "NO MOTIVATIONS RECORDED",
      (item) => item.name || "UNSPECIFIED MOTIVATION"
    );

    // Disorders list (with CURED flag)
    this._fillList(
      "#dg-disorders-list",
      disorders,
      "NO DISORDERS RECORDED",
      (item) => PsycheManager._getDisorderDisplayLabel(item)
    );

    // Bonds list
    this._fillList(
      "#dg-bonds-list",
      bonds,
      "NO BONDS RECORDED",
      (item) => {
        const name = item.name || "UNNAMED BOND";
        const score = item.system?.score ?? null;
        if (score == null || isNaN(score)) return name;

        const numeric = Number(score);
        let strength = "NEGLIGIBLE";
        if (numeric >= 1 && numeric <= 3) strength = "WEAK";
        else if (numeric >= 4 && numeric <= 7) strength = "MODERATE";
        else if (numeric >= 8 && numeric <= 12) strength = "STRONG";
        else if (numeric >= 13) strength = "INTENSE";

        const damaged = !!item.system?.hasBeenDamagedSinceLastHomeScene;
        const damagedTag = damaged ? " [DAMAGED]" : "";

        return `${name} (${strength})${damagedTag}`;
      }
    );
  }

  // -----------------------------------------------------------------------
  //  HELPER: DISORDER LABEL (with CURED flag)
  // -----------------------------------------------------------------------
  static _getDisorderDisplayLabel(item) {
    const sys = item.system || {};

    // Base disorder name
    const disorderName =
      typeof sys.disorder === "string" && sys.disorder.trim().length
        ? sys.disorder.trim()
        : item.name || "UNSPECIFIED DISORDER";

    // Show source only if name and disorder are actually different
    const showSource =
      item.name &&
      item.name.trim().length &&
      item.name.trim() !== disorderName;

    const source = showSource ? ` (from: ${item.name})` : "";

    // ---- CURED FLAG ----
    const isCured = !!sys.disorderCured;

    // You can change the text/format here if you want, e.g. "[REMISSION]" etc.
    const curedTag = isCured ? " [CURED]" : "";

    return `${disorderName}${curedTag}${source}`;
  }

  /* ----------------------------------------------------------------------- */
  /*  HELPERS: ACTOR, NAME, REPORT                                          */
  /* ----------------------------------------------------------------------- */
  static _getCurrentActor() {
    // Prefer controlled token
    const tokenActor = canvas?.tokens?.controlled?.[0]?.actor ?? null;
    if (tokenActor) return tokenActor;

    // Fall back to assigned character
    const char = game.user?.character;
    if (!char) return null;

    // In v10/v11, game.user.character can be an Actor OR an ID
    if (char.id) return char; // already an Actor instance
    return game.actors?.get(char) ?? null; // assume it's an ID
  }

  static _setActorName(text) {
    const el = document.getElementById("dg-psyche-actor-name");
    if (!el) return;
    el.textContent = text;
  }

  static _setActorNameFromActor(actor) {
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

    const rawName = (actor?.name || "UNKNOWN").trim();
    const shortName = getShortAgentName(rawName);

    this._setActorName(`LOGGED IN: ${shortName.toUpperCase()}`);
  }

  static _setReport(text) {
    const el = document.getElementById("dg-psyche-report");
    if (!el) return;
    el.textContent = text;
  }

  /**
   * Build a compact, flavor-y evaluation string without dumping raw stats.
   */
  static _buildPsycheReport({
    actor,
    sanValue,
    sanMax,
    breakingPoint,
    violenceAdapted,
    helplessnessAdapted,
    motivationsCount,
    disordersCount,
    bondsCount,
    damagedBondsCount = 0
  }) {
    const fullName = (actor.name || "SUBJECT").toUpperCase();

    // --- ORIENTATION / SANITY STATE ---------------------------------------
    let orientationLine = "ORIENTATION: DATA UNAVAILABLE.";
    let orientationPrompt = "";

    if (
      sanValue != null &&
      breakingPoint != null &&
      sanMax != null &&
      sanMax > breakingPoint
    ) {
      const span = sanMax - breakingPoint;
      const rawIndex = (sanValue - breakingPoint) / span;

      // clamp 0–1
      const index = Math.max(0, Math.min(1, rawIndex));

      let stateKey;
      if (index >= 0.7) {
        stateKey = "grounded";
      } else if (index >= 0.4) {
        stateKey = "strained";
      } else if (index >= 0.2) {
        stateKey = "frayed";
      } else {
        stateKey = "fragmented";
      }

      // --- cap severity based on overall SAN health -------------------
      if (sanMax > 0) {
        const sanRatio = sanValue / sanMax;

        // Very healthy overall SAN: can't be worse than "grounded"
        if (sanRatio >= 0.8) {
          stateKey = "grounded";
        }
        // Moderately healthy: can't be worse than "strained"
        else if (sanRatio >= 0.65) {
          if (stateKey === "frayed" || stateKey === "fragmented") {
            stateKey = "strained";
          }
        }
      }

      const state = ORIENTATION_STATES[stateKey];
      if (state) {
        orientationLine = state.label;
        orientationPrompt = getRandomOrientationPrompt(stateKey);
      }
    }
    // Fallback: if no usable BP, fall back to SAN vs SANmax
    else if (sanValue != null && sanMax != null && sanMax > 0) {
      const ratio = sanValue / sanMax;
      if (ratio >= 0.8) {
        orientationLine =
          "ORIENTATION: INTACT; no gross functional impairment observed.";
      } else if (ratio >= 0.5) {
        orientationLine =
          "ORIENTATION: STRAINED; mild stress indicators noted.";
      } else if (ratio >= 0.3) {
        orientationLine =
          "ORIENTATION: FRAYED; significant stress loading, monitoring advised.";
      } else {
        orientationLine =
          "ORIENTATION: FRAGMENTED; high risk of acute psychological decompensation.";
      }
    }

    // --- BREAKING POINT PROXIMITY -----------------------------------------
    let bpLine = "";
    if (sanValue != null && breakingPoint != null) {
      const delta = sanValue - breakingPoint;
      if (delta <= 0) {
        bpLine =
          "NOTE: Subject is at or beyond established BREAKING POINT threshold.";
      } else if (delta <= 5) {
        bpLine =
          "NOTE: Subject is approaching BREAKING POINT; further acute stressors likely destabilizing.";
      } else {
        bpLine = "NOTE: Breaking point not imminently threatened.";
      }
    }

    // --- ADAPTATIONS -------------------------------------------------------
    let adaptLine = "STRESS PATTERN: No formal adaptations recorded.";
    if (violenceAdapted && helplessnessAdapted) {
      adaptLine =
        "STRESS PATTERN: Adapted to both VIOLENCE and HELPLESSNESS; emotional blunting expected.";
    } else if (violenceAdapted) {
      adaptLine =
        "STRESS PATTERN: Adapted to VIOLENCE; desensitization to interpersonal harm likely.";
    } else if (helplessnessAdapted) {
      adaptLine =
        "STRESS PATTERN: Adapted to HELPLESSNESS; learned passivity and fatalism likely.";
    }

    // --- MOTIVATIONS / DISORDERS / BONDS ----------------------------------
    const motiveLine = `PSYCHIC ANCHORS: ${motivationsCount} standing motivations; ${disordersCount} documented disorders.`;

    let bondLine = "";
    if (bondsCount <= 0) {
      bondLine = "SOCIAL MATRIX: No stabilizing bonds documented.";
    } else {
      const damagedSuffix =
        damagedBondsCount > 0
          ? ` ${damagedBondsCount} bond${
              damagedBondsCount === 1 ? " is" : "s are"
            } currently flagged as damaged since the last Home Scene.`
          : "";

      if (bondsCount === 1) {
        bondLine =
          "SOCIAL MATRIX: Single primary bond; rupture risk significant." +
          damagedSuffix;
      } else if (bondsCount <= 3) {
        bondLine =
          "SOCIAL MATRIX: Limited but functional bond network." +
          damagedSuffix;
      } else {
        bondLine =
          "SOCIAL MATRIX: Multiple active bonds; strong potential for both support and leverage." +
          damagedSuffix;
      }
    }

    return [
      `${fullName}.`,
      orientationLine,
      orientationPrompt
        ? `OBSERVED COGNITIVE PATTERN: ${orientationPrompt}`
        : "",
      bpLine,
      adaptLine,
      motiveLine,
      bondLine
    ]
      .filter(Boolean)
      .join("\n");
  }

  /* ----------------------------------------------------------------------- */
  /*  HELPERS: ADAPTATION CHECKBOX SYNC                                     */
  /* ----------------------------------------------------------------------- */

  static _syncAdaptationCheckboxes({ violence = {}, helplessness = {} } = {}) {
    // Violence incidents
    const v1 = document.querySelector(
      'input.dg-psyche-adapt-checkbox[data-path="system.sanity.adaptations.violence.incident1"]'
    );
    const v2 = document.querySelector(
      'input.dg-psyche-adapt-checkbox[data-path="system.sanity.adaptations.violence.incident2"]'
    );
    const v3 = document.querySelector(
      'input.dg-psyche-adapt-checkbox[data-path="system.sanity.adaptations.violence.incident3"]'
    );

    if (v1) v1.checked = !!violence.incident1;
    if (v2) v2.checked = !!violence.incident2;
    if (v3) v3.checked = !!violence.incident3;

    // Helplessness incidents
    const h1 = document.querySelector(
      'input.dg-psyche-adapt-checkbox[data-path="system.sanity.adaptations.helplessness.incident1"]'
    );
    const h2 = document.querySelector(
      'input.dg-psyche-adapt-checkbox[data-path="system.sanity.adaptations.helplessness.incident2"]'
    );
    const h3 = document.querySelector(
      'input.dg-psyche-adapt-checkbox[data-path="system.sanity.adaptations.helplessness.incident3"]'
    );

    if (h1) h1.checked = !!helplessness.incident1;
    if (h2) h2.checked = !!helplessness.incident2;
    if (h3) h3.checked = !!helplessness.incident3;

    // ADAPTED tags (uses .isAdapted like the official DG sheet)
    const vTag = document.getElementById("dg-psyche-violence-adapted");
    const hTag = document.getElementById("dg-psyche-helplessness-adapted");

    if (vTag) {
      vTag.textContent = violence.isAdapted ? "ADAPTED" : "";
    }
    if (hTag) {
      hTag.textContent = helplessness.isAdapted ? "ADAPTED" : "";
    }
  }

  /* ----------------------------------------------------------------------- */
  /*  HELPERS: LIST POPULATION                                              */
  /* ----------------------------------------------------------------------- */

  static _setEmptyList(selector, emptyText) {
    const $list = $(selector);
    if (!$list.length) return;
    $list.empty().append(
      `<li class="dg-result-item dg-no-entries">${emptyText}</li>`
    );
  }

  static _fillList(selector, items, emptyText, labelFn) {
    const $list = $(selector);
    if (!$list.length) return;

    $list.empty();

    if (!items || !items.length) {
      $list.append(
        `<li class="dg-result-item dg-no-entries">${emptyText}</li>`
      );
      return;
    }

    for (const item of items) {
      const label = labelFn(item);
      const $li = $(
        `<li class="dg-result-item dg-psyche-item" data-item-id="${item.id}"></li>`
      );
      $li.text(label);
      $list.append($li);
    }
  }

  /* ----------------------------------------------------------------------- */
  /*  HELPER: FIND ITEM ON ACTOR                                            */
  /* ----------------------------------------------------------------------- */

  static _findItemOnActor(actor, itemId) {
    if (!actor || !itemId) return null;
    const items = actor.items;
    if (!items) return null;

    // Standard DocumentCollection
    if (typeof items.get === "function") {
      const found = items.get(itemId);
      if (found) return found;
    }

    // Collection with .contents
    if (Array.isArray(items?.contents)) {
      const found = items.contents.find((i) => i.id === itemId);
      if (found) return found;
    }

    // Plain array
    if (Array.isArray(items)) {
      const found = items.find((i) => i.id === itemId || i._id === itemId);
      if (found) return found;
    }

    return null;
  }

  /* ----------------------------------------------------------------------- */
  /*  RIGHT-CLICK HANDLER: DELETE MOTIVATION / DISORDER / BOND               */
  /* ----------------------------------------------------------------------- */

  static _onRightClickPsycheItem(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    const li = ev.currentTarget;
    if (!li) return;

    const itemId = li.dataset.itemId;
    if (!itemId) return;

    const actor = this._getCurrentActor();
    if (!actor) {
      ui.notifications?.warn?.("No active Agent to modify.");
      return;
    }

    // Which list is this entry in?
    const listEl = li.closest("ul");
    const listId = listEl?.id || "";

    // Get the embedded item
    const item = PsycheManager._findItemOnActor(actor, itemId);
    if (!item) {
      console.warn(
        "Delta Green UI | Right-click delete: item not found",
        actor,
        itemId
      );
      ui.notifications?.warn?.("Could not find that entry on this Agent.");
      return;
    }

    // Friendly label for dialog
    let kindLabel;

    if (listId === "dg-bonds-list") {
      kindLabel = "Bond";
    } else if (listId === "dg-disorders-list") {
      kindLabel = "Disorder";
    } else if (listId === "dg-motivations-list") {
      kindLabel = "Motivation";
    } else {
      // Fallback based on item.type if for some reason listId isn't one of the above
      if (item.type === "bond") kindLabel = "Bond";
      else if (item.type === "motivation") kindLabel = "Motivation / Disorder";
      else kindLabel = "Item";
    }

    const displayName = item.name || "(unnamed)";

    new Dialog({
      title: `Delete ${kindLabel}`,
      content: `
      <p>Delete this <b>${kindLabel}</b> from <b>${actor.name}</b>?</p>
      <p><b>${displayName}</b></p>
    `,
      buttons: {
        delete: {
          label: "Delete",
          icon: '<i class="fas fa-trash"></i>',
          callback: async () => {
            try {
              await actor.deleteEmbeddedDocuments("Item", [item.id]);
              // Your create/update/delete hooks already call _refreshIfItemRelevant
            } catch (err) {
              console.error(
                "Delta Green UI | Error deleting psyche item:",
                err
              );
              ui.notifications?.error?.("Error deleting entry.");
            }
          }
        },
        cancel: {
          label: "Cancel"
        }
      },
      default: "cancel"
    }).render(true);
  }

  /* ----------------------------------------------------------------------- */
  /*  CLICK HANDLER: OPEN ITEM SHEET                                        */
  /* ----------------------------------------------------------------------- */

  static _onClickPsycheItem(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    const li = ev.currentTarget;
    if (!li) return;

    const itemId = li.dataset.itemId;
    if (!itemId) {
      console.warn("Delta Green UI | Psyche item click without data-item-id");
      return;
    }

    const actor = this._getCurrentActor();
    if (!actor) {
      ui.notifications?.warn?.("No active actor for psyche item.");
      return;
    }

    const item = this._findItemOnActor(actor, itemId);
    if (!item) {
      console.warn(
        "Delta Green UI | Psyche item click: item not found on actor",
        actor,
        itemId
      );
      ui.notifications?.warn?.(
        "Psyche entry could not be found on this Agent."
      );
      return;
    }

    try {
      if (item.sheet) {
        item.sheet.render(true, { focus: true });
      } else {
        ui.notifications?.warn?.("No sheet available for this entry.");
      }
    } catch (err) {
      console.error(
        "Delta Green UI | Error opening psyche item sheet:",
        err
      );
      ui.notifications?.error?.("Error opening item sheet.");
    }
  }

  /* ----------------------------------------------------------------------- */
  /*  CREATE: MOTIVATION / DISORDER ITEM                                    */
  /* ----------------------------------------------------------------------- */

  static async _createMotivationItem() {
    const actor = this._getCurrentActor();
    if (!actor) {
      ui.notifications?.error?.(
        "Select an Agent token or have an assigned character."
      );
      return;
    }

    try {
      const itemData = {
        name: "New Motivation",
        type: "motivation",
        system: {
          // You can tweak defaults to match your system schema
          crossedOut: false, // not a disorder yet
          disorder: "" // blank until “converted”
        }
      };

      const created = await actor.createEmbeddedDocuments("Item", [itemData]);
      const item = created?.[0];

      if (item && item.sheet) {
        item.sheet.render(true, { focus: true }); // the “create pop-up”
      }
    } catch (err) {
      console.error("Delta Green UI | Error creating motivation item:", err);
      ui.notifications?.error?.("Error creating motivation/disorder item.");
    }
  }

  /* ----------------------------------------------------------------------- */
  /*  CREATE: BOND ITEM                                                      */
  /* ----------------------------------------------------------------------- */

  static async _createBondItem() {
    const actor = this._getCurrentActor();
    if (!actor) {
      ui.notifications?.error?.(
        "Select an Agent token or have an assigned character."
      );
      return;
    }

    try {
      const itemData = {
        name: "New Bond",
        type: "bond",
        system: {
          relationship: "",
          score: 0,
          hasBeenDamagedSinceLastHomeScene: false
        }
      };

      const created = await actor.createEmbeddedDocuments("Item", [itemData]);
      const item = created?.[0];

      if (item && item.sheet) {
        item.sheet.render(true, { focus: true }); // again, “create pop-up”
      }
    } catch (err) {
      console.error("Delta Green UI | Error creating bond item:", err);
      ui.notifications?.error?.("Error creating Bond.");
    }
  }

  /* ----------------------------------------------------------------------- */
  /*  ADAPTATION CHECKBOX CHANGE HANDLER                                    */
  /* ----------------------------------------------------------------------- */

  static async _onChangeAdaptationCheckbox(ev) {
    const target = ev.currentTarget;
    if (!target) return;

    const path = target.dataset.path;
    if (!path) return;

    const actor = this._getCurrentActor();
    if (!actor) return;

    const checked = target.checked;

    const updates = {};
    updates[path] = checked;

    // If this is one of the three tracked incidents, recompute .isAdapted
    const match = path.match(
      /system\.sanity\.adaptations\.(violence|helplessness)\.incident[123]$/
    );

    if (match) {
      const type = match[1]; // "violence" or "helplessness"
      const base = `system.sanity.adaptations.${type}`;
      const data = actor.system?.sanity?.adaptations?.[type] || {};

      const inc1 = path.endsWith("incident1") ? checked : !!data.incident1;
      const inc2 = path.endsWith("incident2") ? checked : !!data.incident2;
      const inc3 = path.endsWith("incident3") ? checked : !!data.incident3;

      const isAdapted = inc1 && inc2 && inc3;
      updates[`${base}.isAdapted`] = isAdapted;
    }

    await actor.update(updates);
  }

  /* ----------------------------------------------------------------------- */
  /*  PROJECT ONTO A BOND (standard DG rules)                                */
  /* ----------------------------------------------------------------------- */

  static async runProjectOntoBondMacro() {
    try {
      // ---------- Helpers ----------
      const getShortAgentName = (rawName) => {
        if (!rawName || typeof rawName !== "string") return "UNKNOWN";
        const parts = rawName.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 4) return `${parts[2]} ${parts[3]}`;
        if (parts.length === 3) return `${parts[1]} ${parts[2]}`;
        if (parts.length === 2) return `${parts[0]} ${parts[1]}`;
        return parts[0];
      };

      // ---------- 1. Get actor ----------
      const actor = this._getCurrentActor();
      if (!actor) {
        ui.notifications.error("Select a token or have an assigned character.");
        return;
      }

      const rawName = (actor.name || "UNKNOWN").trim();
      const displayName = getShortAgentName(rawName);

      // Paths for SAN and WP in your system
      const sanPath = "system.sanity.value";
      const wpPath = "system.wp.value";

      let sanCurrent = Number(foundry.utils.getProperty(actor, sanPath) ?? 0);
      let wpCurrent = Number(foundry.utils.getProperty(actor, wpPath) ?? 0);

      // Bonds on this actor
      const bonds = actor.items.filter((i) => i.type === "bond");
      if (!bonds.length) {
        ui.notifications.warn("No Bonds available to project onto.");
        return;
      }

      // ---------- 2. Build Bond options ----------
      const bondOptionsHtml = bonds
        .map((bond) => {
          const score = Number(bond.system?.score ?? 0);
          const label = `${bond.name || "UNNAMED BOND"} (Score: ${score})`;
          return `<option value="${bond.id}">${label}</option>`;
        })
        .join("");

      // ---------- 3. Dialog: SAN loss + Bond ----------
      const projData = await new Promise((resolve) => {
        new Dialog({
          title: `Project Onto a Bond – ${displayName}`,
          content: `
            <div style="display:flex;flex-direction:column;gap:8px;">
              <p style="font-size:13px;opacity:0.95;">
                When your Agent loses SAN, you may spend <b>1D4 WP</b> to reduce that loss,
                and reduce a Bond by the same amount.
              </p>
              <label>How much SAN was just lost?
                <input type="number" name="sanLoss" value="1" min="0" />
              </label>
              <label>Choose Bond to project onto:
                <select name="bondId">
                  ${bondOptionsHtml}
                </select>
              </label>
              <p class="dg-psyche-note">
                This will roll <b>1D4</b>, reduce WP by that amount, and if WP remains at least 1,
                refund up to that much SAN and reduce the Bond by the same amount.
              </p>
            </div>
          `,
          buttons: {
            ok: {
              label: "Project",
              callback: (html) => {
                const sanLoss = parseInt(
                  html.find('[name="sanLoss"]').val() ?? "0",
                  10
                );
                const bondId = String(
                  html.find('[name="bondId"]').val() ?? ""
                ).trim();
                resolve({ sanLoss: isNaN(sanLoss) ? 0 : sanLoss, bondId });
              }
            },
            cancel: {
              label: "Cancel",
              callback: () => resolve(null)
            }
          },
          default: "ok"
        }).render(true);
      });

      if (!projData) return;

      const sanLoss = Math.max(0, projData.sanLoss);
      const bondId = projData.bondId;
      const bond = bonds.find((b) => b.id === bondId);

      if (!bond) {
        ui.notifications.error("Selected Bond not found.");
        return;
      }

      if (sanLoss <= 0) {
        ui.notifications.warn("SAN loss must be at least 1 to project.");
        return;
      }

      if (wpCurrent <= 0) {
        ui.notifications.warn("No WP available to spend on projection.");
        return;
      }

      const bondScore = Number(bond.system?.score ?? 0);

      // ---------- 4. Roll 1D4 WP spend ----------
      const projRoll = await new Roll("1d4").evaluate({ async: true });
      if (game.dice3d) {
        await game.dice3d.showForRoll(projRoll, game.user, true);
      }

      const projAmount = Math.max(1, Number(projRoll.total) || 1); // at least 1

      // Spend WP per RAW: you always pay this
      const newWp = wpCurrent - projAmount;
      await actor.update({ [wpPath]: Math.max(newWp, 0) });

      // ---------- 5. Check WP threshold ----------
      // RAW: only if the Agent still has at least 1 WP after spending
      // do you reduce SAN loss and Bond.
      if (newWp < 1) {
        ui.notifications.info(
          `${displayName} spends ${projAmount} WP (now below 1 WP); projection fails to mitigate SAN.`
        );

        await ChatMessage.create({
          user: game.user.id,
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `
            <p><b>${displayName}</b> attempts to project their trauma onto a Bond, but the effort leaves them with too little will to push the horror away.</p>
            <ul>
              <li>WP spent: <b>${projAmount}</b> (now below 1 WP)</li>
              <li>No SAN is refunded.</li>
              <li>No Bond is reduced.</li>
            </ul>
            <p class="dg-psyche-note">
              Handler &amp; player: consider how this failed attempt to lean on others shows up in play.
            </p>
          `
        });

        return;
      }

      // ---------- 6. Reduce effective SAN loss & Bond ----------
      const effectiveRefund = Math.min(projAmount, sanLoss);

      // Re-read SAN in case something else modified it between click + now
      sanCurrent = Number(foundry.utils.getProperty(actor, sanPath) ?? 0);
      const newSan = sanCurrent + effectiveRefund;
      const newBondScore = Math.max(0, bondScore - effectiveRefund);

      await actor.update({ [sanPath]: newSan });
      await bond.update({
        "system.score": newBondScore,
        "system.hasBeenDamagedSinceLastHomeScene": true
      });

      // ---------- 7. Player-facing summary ----------
      const bondName = bond.name || "UNNAMED BOND";

      const msg = `
        <p><b>${displayName}</b> projects their trauma onto <b>${bondName}</b>.</p>
        <ul>
          <li>WP spent: <b>${projAmount}</b></li>
          <li>SAN refunded: <b>${effectiveRefund}</b> (up to the amount just lost)</li>
          <li>${bondName} Bond score reduced by: <b>${effectiveRefund}</b></li>
        </ul>
        <p class="dg-psyche-note">
          Handler &amp; player: the next time ${displayName} interacts with ${bondName},
          decide how this strain shows up.
        </p>
      `;

      await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: msg
      });
    } catch (err) {
      console.error("Delta Green UI | Project Onto Bond macro error:", err);
      ui.notifications.error("Error running Project Onto Bond.");
    }
  }

  /* ----------------------------------------------------------------------- */
  /*  REPRESS INSANITY (standard DG rules)                                   */
  /* ----------------------------------------------------------------------- */

  static async runRepressInsanityMacro() {
    try {
      // ---------- Helpers ----------
      const getShortAgentName = (rawName) => {
        if (!rawName || typeof rawName !== "string") return "UNKNOWN";
        const parts = rawName.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 4) return `${parts[2]} ${parts[3]}`;
        if (parts.length === 3) return `${parts[1]} ${parts[2]}`;
        if (parts.length === 2) return `${parts[0]} ${parts[1]}`;
        return parts[0];
      };

      // ---------- 1. Get actor ----------
      const actor = this._getCurrentActor();
      if (!actor) {
        ui.notifications.error("Select a token or have an assigned character.");
        return;
      }

      const rawName = (actor.name || "UNKNOWN").trim();
      const displayName = getShortAgentName(rawName);

      // WP + Bonds
      const wpPath = "system.wp.value";
      let wpCurrent = Number(foundry.utils.getProperty(actor, wpPath) ?? 0);

      const bonds = actor.items.filter((i) => i.type === "bond");
      if (!bonds.length) {
        ui.notifications.warn("No Bonds available to draw on.");
        return;
      }

      if (wpCurrent <= 0) {
        ui.notifications.warn("No WP available to spend to repress insanity.");
        return;
      }

      // ---------- 2. Build Bond options ----------
      const bondOptionsHtml = bonds
        .map((bond) => {
          const score = Number(bond.system?.score ?? 0);
          const label = `${bond.name || "UNNAMED BOND"} (Score: ${score})`;
          return `<option value="${bond.id}">${label}</option>`;
        })
        .join("");

      // ---------- 3. Dialog: pick Bond ----------
      const dialogData = await new Promise((resolve) => {
        new Dialog({
          title: `Repress Insanity – ${displayName}`,
          content: `
            <div style="display:flex;flex-direction:column;gap:8px;">
              <p style="font-size:13px;opacity:0.95;">
                Spend <b>1D4 WP</b> to lean on a Bond. If you have at least 1 WP left after spending,
                reduce that Bond by the same amount and you may roll a SAN test to repress the episode.
              </p>
              <label>Choose Bond to lean on:
                <select name="bondId">
                  ${bondOptionsHtml}
                </select>
              </label>
            </div>
          `,
          buttons: {
            ok: {
              label: "Spend WP",
              callback: (html) => {
                const bondId = String(
                  html.find('[name="bondId"]').val() ?? ""
                ).trim();
                resolve({ bondId });
              }
            },
            cancel: {
              label: "Cancel",
              callback: () => resolve(null)
            }
          },
          default: "ok"
        }).render(true);
      });

      if (!dialogData) return;

      const bondId = dialogData.bondId;
      const bond = bonds.find((b) => b.id === bondId);

      if (!bond) {
        ui.notifications.error("Selected Bond not found.");
        return;
      }

      const bondScore = Number(bond.system?.score ?? 0);

      // ---------- 4. Roll 1D4 WP spend ----------
      const wpRoll = await new Roll("1d4").evaluate({ async: true });
      if (game.dice3d) {
        await game.dice3d.showForRoll(wpRoll, game.user, true);
      }

      const spendAmount = Math.max(1, Number(wpRoll.total) || 1);

      // Spend WP
      wpCurrent = Number(foundry.utils.getProperty(actor, wpPath) ?? 0);
      const newWp = wpCurrent - spendAmount;
      await actor.update({ [wpPath]: Math.max(newWp, 0) });

      // ---------- 5. Check WP threshold ----------
      if (newWp < 1) {
        ui.notifications.info(
          `${displayName} spends ${spendAmount} WP (now below 1 WP); repression attempt fails.`
        );

        await ChatMessage.create({
          user: game.user.id,
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `
            <p><b>${displayName}</b> reaches for support and burns through the last of their willpower.</p>
            <ul>
              <li>WP spent: <b>${spendAmount}</b> (now below 1 WP)</li>
              <li>Bond is not reduced.</li>
              <li>No SAN test to repress the episode is allowed.</li>
            </ul>
            <p class="dg-psyche-note">
              Handler &amp; player: consider how this failed attempt to hold it together manifests at the table.
            </p>
          `
        });

        return;
      }

      // ---------- 6. Reduce Bond score ----------
      const newBondScore = Math.max(0, bondScore - spendAmount);
      await bond.update({
        "system.score": newBondScore,
        "system.hasBeenDamagedSinceLastHomeScene": true
      });

      // ---------- 7. Player-facing summary ----------
      const bondName = bond.name || "UNNAMED BOND";

      const msg = `
        <p><b>${displayName}</b> represses an episode by clinging to <b>${bondName}</b>.</p>
        <ul>
          <li>WP spent: <b>${spendAmount}</b></li>
          <li>${bondName} Bond score reduced by: <b>${spendAmount}</b></li>
        </ul>
        <p><b>Mechanical:</b> You may now roll a <b>SAN test</b> to attempt to repress the insanity or disorder episode.</p>
        <p class="dg-psyche-note">
          Handler &amp; player: decide how this strain on ${bondName} shows up the next time ${displayName} sees them.
        </p>
      `;

      await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: msg
      });
    } catch (err) {
      console.error("Delta Green UI | Repress Insanity macro error:", err);
      ui.notifications.error("Error running Repress Insanity.");
    }
  }

  /* ----------------------------------------------------------------------- */
  /*  SAN CHECK MACRO (dialog + adaptation)                                  */
  /* ----------------------------------------------------------------------- */

  static async runSanCheckDialogMacro() {
    try {
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

      // Helper: extract the 3rd and 4th word of the name when possible
      const getShortAgentName = (rawName) => {
        if (!rawName || typeof rawName !== "string") return "UNKNOWN";

        const parts = rawName.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 4) return `${parts[2]} ${parts[3]}`;
        if (parts.length === 3) return `${parts[1]} ${parts[2]}`;
        if (parts.length === 2) return `${parts[0]} ${parts[1]}`;
        return parts[0];
      };

      // ---------- Helper: tick Violence / Helplessness adaptation incident ----------
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

        // Already fully adapted
        if (!pathToSet) {
          ui.notifications?.info?.(`Already fully adapted to ${sanType}.`);
          return;
        }

        const beforeCount =
          (current1 ? 1 : 0) + (current2 ? 1 : 0) + (current3 ? 1 : 0);

        const updates = {};
        updates[pathToSet] = true;

        await actor.update(updates);

        const nowInc1 = current1 || pathToSet.endsWith("incident1");
        const nowInc2 = current2 || pathToSet.endsWith("incident2");
        const nowInc3 = current3 || pathToSet.endsWith("incident3");
        const afterCount = beforeCount + 1;
        const fullyAdapted = nowInc1 && nowInc2 && nowInc3;

        ui.notifications?.info?.(
          `Marked one ${sanType} SAN loss incident (${afterCount}/3).`
        );

        // Special announcement on the 3rd mark
        if (fullyAdapted) {
          const adaptUpdates = {};
          adaptUpdates[`${basePath}.isAdapted`] = true;
          await actor.update(adaptUpdates).catch(() => {});

          const label =
            sanType === "violence"
              ? "ADAPTED TO VIOLENCE"
              : "ADAPTED TO HELPLESSNESS";

          ui.notifications?.info?.(`${displayName} is now ${label}.`);

          const catLabel = sanType === "violence" ? "Violence" : "Helplessness";

          await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `
            <p><b>${displayName}</b> has become <b>${label}</b>.</p>
            <p style="font-size: 15px; opacity: 0.85%;">
              <b>HANDLER NOTE:</b> Future SAN tests versus <b>${catLabel}</b> are automatically
              successful. Stop calling for SAN rolls from this category and lean on roleplay
              and consequences instead.
            </p>
          `
          });
        }
      }

      // ---------- 1. Get actor ----------
      let actor = this._getCurrentActor();
      if (!actor) {
        ui.notifications.error("Select a token or have an assigned character.");
        return;
      }

      const rawName = (actor.name || "UNKNOWN").trim();
      const displayName = getShortAgentName(rawName);

      // ---------- 0. Narrative pools ----------
      const SAN_FAILURE_LINES = [
        "Your thoughts skid sideways—nothing about this feels real anymore.",
        "Your stomach drops; this is wrong in a way your mind can’t safely describe.",
        "You blink once, twice, hoping the world resets. It doesn’t.",
        "You will never sleep right again after this.",
        "Something inside you gives way—like a support beam quietly snapping."
      ];
      const SAN_SUCCESS_LINES = [
        "You feel the panic rising—and force it back down where it belongs.",
        "Your pulse hammers, but training and habit slam the door on the worst of it.",
        "You catalog the horror, box it up in your head, and move on—for now.",
        "You swallow hard, steady your hands, and keep working the problem.",
        "It shakes you, but it doesn’t break you. Not this time."
      ];
      const CRIT_SUCCESS_LINES = [
        "For one clear second, you see it for exactly what it is—and that clarity saves you.",
        "You ride the spike of terror like a wave, letting it crest and break without taking you under.",
        "You lock eyes with the horror and something in you just… refuses to yield.",
        "Your mind files this away with surgical precision: evidence, not nightmare.",
        "You feel the crack coming—and reinforce it with sheer stubborn will."
      ];
      const CRIT_FAILURE_LINES = [
        "Your mind doesn’t just slip—it plummets, screaming, with no handhold in sight.",
        "Reality fractures into too many pieces to track; you grab one at random and cling to it.",
        "The laugh, the sob, the scream—you’re not sure which one comes out, only that it does.",
        "All your training vanishes; you’re a raw nerve, exposed to something that should not exist.",
        "A terrible understanding floods in, burning away any hope that this is “just” madness."
      ];

      const BP_REG_SUCCESS_LINES = [
        "You keep it together just long enough to realize something inside you quietly broke.",
        "You manage to function, hands steady, voice level—while something vital in you goes dark.",
        "You do everything right. You follow the training. And somehow that makes the fracture feel worse.",
        "You stay on your feet, stay on task, and only later notice you’ve left a piece of yourself behind.",
        "You hold the line in the moment, but the person who walked into this scene isn’t the one walking out."
      ];
      const BP_REG_FAILURE_LINES = [
        "The fear doesn’t just seep in—it floods, drowning whatever was holding you together.",
        "Your thoughts scatter like papers in a storm, and you know you’ll never gather them all again.",
        "You hear yourself make a sound—laugh, sob, gasp—you’re not sure which, only that it isn’t you.",
        "Something gives way behind your eyes, and the world tilts into a shape you cannot unsee.",
        "You don’t collapse, but the support beams of your mind groan, crack, and finally give out."
      ];
      const BP_CRIT_SUCCESS_LINES = [
        "You understand exactly what you’re seeing, and that clarity slices something essential out of you.",
        "You process every detail with perfect, clinical precision—and feel your humanity slip a step behind.",
        "You lock everything away flawlessly, but the part of you that cared about the lock is gone.",
        "You master the terror, pin it down, and in doing so trade away the last of your illusions.",
        "You stay sharp, efficient, unshakable—and realize, with distant curiosity, that you don’t feel much at all."
      ];
      const BP_CRIT_FAILURE_LINES = [
        "Your mind doesn’t just crack—it shatters, and you’re left clutching a single splinter that still feels “real.”",
        "Every defense fails at once, leaving raw nerve exposed to something that should never touch human thought.",
        "The world comes apart in too many pieces to track, and you grab onto the wrong one with both hands.",
        "You feel yourself step off the edge of who you were and start falling, with no idea where the bottom is.",
        "There is a moment—just one—where you see the truth of it all, and that moment takes the rest of you with it."
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

      // ---------- 3. Dialog: formulas + SAN source + modifier + adaptation ----------
      const sanDialog = await new Promise((resolve) => {
        new Dialog({
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

                resolve({
                  success,
                  failure,
                  modifier,
                  sanType,
                  markAdaptation
                });
              }
            },
            cancel: { label: "Cancel", callback: () => resolve(null) }
          },
          default: "ok"
        }).render(true);
      });

      if (!sanDialog) return;

      const successFormula = sanDialog.success || "0";
      const failureFormula = sanDialog.failure || "1d6";
      const modifier = Number(sanDialog.modifier || 0);
      const sanType = sanDialog.sanType || "other";
      const markAdaptation = !!sanDialog.markAdaptation;

      // ---------- 4. Roll SAN check ----------
      const effectiveTarget = Math.max(
        0,
        Math.min(sanMax, sanCurrent + modifier)
      );

      const sanRoll = await new Roll("1d100").evaluate({ async: true });
      const rollTotal = Number(sanRoll.total || 0);

      const isSuccess = rollTotal <= effectiveTarget;
      const isDouble =
        rollTotal % 11 === 0 && rollTotal !== 0 && rollTotal !== 100;
      const isCritSuccess = rollTotal === 1 || (isDouble && isSuccess);
      const isCritFailure = rollTotal === 100 || (isDouble && !isSuccess);

      const lossRoll = await new Roll(
        isSuccess ? successFormula : failureFormula
      ).evaluate({ async: true });

      // Show 3D dice if Dice So Nice is active
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
      }

      // ---------- 7. Player-facing narrative ----------
      let publicText = "";
      if (hasBP && crossedBreaking) {
        let bpPool;
        if (isCritSuccess) bpPool = BP_CRIT_SUCCESS_LINES;
        else if (isCritFailure) bpPool = BP_CRIT_FAILURE_LINES;
        else if (isSuccess) bpPool = BP_REG_SUCCESS_LINES;
        else bpPool = BP_REG_FAILURE_LINES;

        const bpLine = pick(bpPool);
        publicText = `
        <p><b>${displayName}</b>: ${bpLine}</p>
        <p><b>BREAKING POINT REACHED.</b></p>
        <p style="font-size: 15px; opacity: 0.85%;">
          <b>HANDLER NOTE:</b> Assign a new long-term disorder tied to the prevailing SAN threat
          and record it under <b>PSYCHE &gt; DISORDERS</b>. Discuss with the player how it
          manifests in play.
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

      await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: publicText
      });
    } catch (err) {
      console.error("Delta Green UI | SAN macro error:", err);
      ui.notifications.error("Error running SAN check.");
    }
  }
}
