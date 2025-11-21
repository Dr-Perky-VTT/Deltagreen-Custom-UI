// combat-manager.js
// Manual, handler-driven combat tracker for Delta Green.

export class CombatManager {
  // Internal table data
  static _entries = [];
  static _activeIndex = 0;
  static _round = 1; // NEW: round counter

  static init() {
    console.log("Delta Green UI | Manual CombatManager init");

    // When the CRT UI is rendered, sync the panel
    Hooks.on("renderDeltaGreenUI", () => {
      CombatManager.refresh();

      // GM-only NEXT TURN button visibility
      const btn = document.getElementById("dg-manual-next-turn");
      if (btn) {
        if (game?.user?.isGM) btn.style.display = "";
        else btn.style.display = "none";
      }
    });

    // ADD row
    $(document).on("click", "#dg-manual-add", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      CombatManager._addEntryFromInputs();
    });

    // Press Enter in notes to ADD
    $(document).on("keydown", "#dg-manual-notes", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        CombatManager._addEntryFromInputs();
      }
    });

    // SORT BY DEX
    $(document).on("click", "#dg-manual-sort-dex", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      CombatManager._sortByDex();
    });

    // NEXT TURN
    $(document).on("click", "#dg-manual-next-turn", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      CombatManager._nextTurn();
    });

    // CLEAR TABLE
    $(document).on("click", "#dg-manual-reset", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      CombatManager._reset();
    });

    // Click row: highlight active row
    $(document).on("click", ".dg-combat-row-entry", (ev) => {
      const li = ev.currentTarget;
      const idx = Number(li.dataset.index ?? -1);
      if (!Number.isNaN(idx) && idx >= 0) {
        CombatManager._setActiveIndex(idx);
      }
    });

    // Double-click row: open edit dialog
    $(document).on("dblclick", ".dg-combat-row-entry", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const li = ev.currentTarget;
      const idx = Number(li.dataset.index ?? -1);
      if (!Number.isNaN(idx) && idx >= 0) {
        CombatManager._openEditDialog(idx);
      }
    });

    // Right-click row: delete it
    $(document).on("contextmenu", ".dg-combat-row-entry", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const li = ev.currentTarget;
      const idx = Number(li.dataset.index ?? -1);
      if (Number.isNaN(idx) || idx < 0) return;

      const entry = CombatManager._entries[idx];
      const name = entry?.name || "this row";

      new Dialog({
        title: "Delete Entry",
        content: `<p>Delete <b>${name}</b> from the table?</p>`,
        buttons: {
          ok: {
            label: "Delete",
            icon: '<i class="fas fa-trash"></i>',
            callback: () => {
              CombatManager._entries.splice(idx, 1);
              if (CombatManager._activeIndex >= CombatManager._entries.length) {
                CombatManager._activeIndex = 0;
              }
              CombatManager.refresh();
            }
          },
          cancel: { label: "Cancel" }
        },
        default: "cancel"
      }).render(true);
    });

    // CLICK AMMO CELL: spend 1 round
    $(document).on("click", ".dg-combat-col-hp", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      CombatManager._spendAmmo(ev);
    });

    // RIGHT-CLICK AMMO CELL: reload to full
    $(document).on("contextmenu", ".dg-combat-col-hp", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      CombatManager._reloadAmmo(ev);
    });

    // Click on STATUS / ARMOR / MOD / FLAGS to edit this entry
    $(document).on(
      "click",
      ".dg-combat-col-status, .dg-combat-col-armor, .dg-combat-col-mod, .dg-combat-col-flags",
      (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const idx = CombatManager._findIndexFromCellEvent(ev);
        if (idx >= 0) {
          CombatManager._openEditDialog(idx);
        }
      }
    );
  }

  /* --------------------------------------------------------------------- */
  /*  CORE RENDER                                                          */
  /* --------------------------------------------------------------------- */
  static refresh() {
    const root = document.getElementById("dg-combat-root");
    if (!root) return;

    const listEl = document.getElementById("dg-combat-list");
    if (!listEl) return;

    listEl.innerHTML = "";

    CombatManager._entries.forEach((entry, idx) => {
      CombatManager._ensureDefaults(entry);

      const li = document.createElement("li");
      li.className = "dg-combat-row dg-combat-row-entry";
      if (idx === CombatManager._activeIndex) {
        li.classList.add("dg-combat-row-active");
      }
      li.dataset.index = idx;

      const safeName = entry.name || "";

      // Text for each column
      const flagsSummary = CombatManager._buildFlagsSummary(entry);
      const statusText = CombatManager._getStatusLabel(entry);
      const armorText = CombatManager._getArmorLabel(entry);
      const modText = CombatManager._getModifierLabel(entry);

      // Ammo text
      let ammoText = "—";
      if (
        entry.ammoMax != null &&
        entry.ammoMax !== "" &&
        !Number.isNaN(Number(entry.ammoMax))
      ) {
        const current =
          entry.ammoCurrent == null || entry.ammoCurrent === ""
            ? Number(entry.ammoMax)
            : Number(entry.ammoCurrent);
        ammoText = `${Math.max(0, current)}/${entry.ammoMax}`;
      }

      const dexText =
        entry.dex === null || entry.dex === undefined || entry.dex === ""
          ? "—"
          : String(entry.dex);

      li.innerHTML = `
        <div class="dg-combat-col dg-combat-col-idx">${idx + 1}</div>
        <div class="dg-combat-col dg-combat-col-name">${safeName}</div>
        <div class="dg-combat-col dg-combat-col-init">${dexText}</div>
        <div class="dg-combat-col dg-combat-col-hp" title="Click: spend 1 | Right-click: reload">
          ${ammoText}
        </div>
        <div class="dg-combat-col dg-combat-col-status">${statusText}</div>
        <div class="dg-combat-col dg-combat-col-armor">${armorText}</div>
        <div class="dg-combat-col dg-combat-col-mod">${modText}</div>
        <div class="dg-combat-col dg-combat-col-flags">${flagsSummary}</div>
      `;

      listEl.appendChild(li);
    });

    // Update round label in header
    const roundEl = document.getElementById("dg-combat-round");
    if (roundEl) {
      roundEl.textContent = `ROUND ${CombatManager._round}`;
    }
  }

  /* Build the CONDITIONS / NOTES column. */
  static _buildFlagsSummary(entry) {
    const parts = [];

    // Conditions
    if (entry.aiming) parts.push("Aiming");
    if (entry.pinned) parts.push("Pinned");
    if (entry.prone) parts.push("Prone");
    if (entry.stunned) parts.push("Stunned");
    if (entry.unconscious) parts.push("Unconscious");
    if (entry.suppressed) parts.push("Suppressed");
    if (entry.adaptedViolence) parts.push("Adapted");
    if (entry.usedDefense) parts.push("Used defense");
    if (entry.waiting) parts.push("Waiting");

    // Free notes
    if (entry.notes && entry.notes.trim() !== "") {
      parts.push(`Note: ${entry.notes.trim()}`);
    }

    if (!parts.length) return "";
    return parts.join(" | ");
  }

  static _getStatusLabel(entry) {
    const map = {
      fragile: "Fragile",
      exposed: "Exposed",
      cover: "Behind cover",
      huge: "Huge",
      transcendent: "Transcendent"
    };
    return map[entry.status] || "Exposed";
  }

  static _getArmorLabel(entry) {
    const body = Number(entry.armorBody || 0);
    const cover = Number(entry.armorCover || 0);
    const total = body + cover;

    if (total <= 0) return "—";

    const parts = [];
    if (body > 0) parts.push(`B${body}`);
    if (cover > 0) parts.push(`C${cover}`);
    return `${total} (${parts.join("+")})`;
  }

  static _getModifierLabel(entry) {
    const mod = Number(entry.modifier || 0);
    if (!mod) return "—";
    return `${mod > 0 ? "+" : ""}${mod}`;
  }

  /* --------------------------------------------------------------------- */
  /*  DATA HELPERS                                                         */
  /* --------------------------------------------------------------------- */

  static _ensureDefaults(entry) {
    if (!entry) return;

    if (!entry.status) entry.status = "exposed"; // fragile, exposed, cover, huge, transcendent
    if (entry.armorBody == null) entry.armorBody = 0;
    if (entry.armorCover == null) entry.armorCover = 0;
    if (entry.modifier == null) entry.modifier = 0;

    const boolFields = [
      "aiming",
      "pinned",
      "prone",
      "stunned",
      "unconscious",
      "suppressed",
      "adaptedViolence",
      "usedDefense",
      "waiting"
    ];
    for (const f of boolFields) {
      if (entry[f] == null) entry[f] = false;
    }
  }

  static _addEntryFromInputs() {
    const nameInput = document.getElementById("dg-manual-name");
    const dexInput = document.getElementById("dg-manual-dex");
    const ammoInput = document.getElementById("dg-manual-ammo");
    const notesInput = document.getElementById("dg-manual-notes");

    if (!nameInput || !dexInput || !ammoInput || !notesInput) return;

    const name = nameInput.value.trim() || "UNKNOWN";

    const dexRaw = dexInput.value.trim();
    const dex = dexRaw === "" ? "" : Number(dexRaw);

    const ammoRaw = ammoInput.value.trim();
    let ammoMax = null;
    let ammoCurrent = null;
    if (ammoRaw !== "") {
      const n = Number(ammoRaw);
      if (!Number.isNaN(n)) {
        ammoMax = n;
        ammoCurrent = n; // start full
      }
    }

    const notes = notesInput.value.trim();

    const newEntry = {
      name,
      dex,
      ammoMax,
      ammoCurrent,
      notes,

      // DG combat fields
      status: "exposed",
      armorBody: 0,
      armorCover: 0,
      modifier: 0,
      aiming: false,
      pinned: false,
      prone: false,
      stunned: false,
      unconscious: false,
      suppressed: false,
      adaptedViolence: false,
      usedDefense: false,
      waiting: false
    };

    CombatManager._entries.push(newEntry);

    // Clear inputs for next entry
    nameInput.value = "";
    dexInput.value = "";
    ammoInput.value = "";
    notesInput.value = "";

    // Focus back on NAME for quick entry
    nameInput.focus();

    CombatManager._activeIndex = CombatManager._entries.length - 1;
    CombatManager.refresh();
  }

  static _sortByDex() {
    CombatManager._entries.sort((a, b) => {
      const ad = a.dex === "" || a.dex == null ? -Infinity : Number(a.dex);
      const bd = b.dex === "" || b.dex == null ? -Infinity : Number(b.dex);
      if (Number.isNaN(ad) && Number.isNaN(bd)) return 0;
      if (Number.isNaN(ad)) return 1;
      if (Number.isNaN(bd)) return -1;
      return bd - ad; // higher DEX first
    });

    CombatManager._activeIndex = 0;
    CombatManager._round = 1; // optional: resort means new ordering => round 1
    CombatManager.refresh();
  }

  static _reset() {
    CombatManager._entries = [];
    CombatManager._activeIndex = 0;
    CombatManager._round = 1;
    CombatManager.refresh();
  }

  static _setActiveIndex(idx) {
    if (idx < 0 || idx >= CombatManager._entries.length) return;
    CombatManager._activeIndex = idx;
    CombatManager.refresh();
  }

  /* --------------------------------------------------------------------- */
  /*  TURN ADVANCE                                                         */
  /* --------------------------------------------------------------------- */

  static _nextTurn() {
    const len = CombatManager._entries.length;
    if (!len) return;

    const current = CombatManager._activeIndex || 0;
    let next = current + 1;

    // If we just moved past the last entry, wrap to top and bump round
    if (next >= len) {
      next = 0;
      CombatManager._round = (CombatManager._round || 1) + 1;
    }

    CombatManager._activeIndex = next;
    CombatManager.refresh();
  }

  /* --------------------------------------------------------------------- */
  /*  EDIT DIALOG                                                          */
  /* --------------------------------------------------------------------- */

  static _openEditDialog(idx) {
    const entry = CombatManager._entries[idx];
    if (!entry) return;
    CombatManager._ensureDefaults(entry);

    const status = entry.status || "exposed";
    const statusOptions = [
      { value: "fragile", label: "Fragile" },
      { value: "exposed", label: "Exposed (default)" },
      { value: "cover", label: "Behind cover" },
      { value: "huge", label: "Huge" },
      { value: "transcendent", label: "Transcendent" }
    ];

    const statusSelect = statusOptions
      .map(
        (opt) =>
          `<option value="${opt.value}" ${
            status === opt.value ? "selected" : ""
          }>${opt.label}</option>`
      )
      .join("");

    const content = `
      <form class="dg-combat-edit-form">
        <div class="form-group">
          <label>Name</label>
          <input type="text" name="cm-name" value="${entry.name || ""}" />
        </div>
        <div class="form-group">
          <label>DEX</label>
          <input type="number" name="cm-dex" value="${entry.dex ?? ""}" />
        </div>
        <div class="form-group">
          <label>Ammo (current / max)</label>
          <div style="display:flex; gap:4px;">
            <input type="number" name="cm-ammo-current" placeholder="Current" value="${entry.ammoCurrent ?? ""}" />
            <input type="number" name="cm-ammo-max" placeholder="Max" value="${entry.ammoMax ?? ""}" />
          </div>
        </div>
        <hr/>
        <div class="form-group">
          <label>Target Status</label>
          <select name="cm-status">
            ${statusSelect}
          </select>
        </div>
        <div class="form-group">
          <label>Armor</label>
          <div style="display:flex; gap:4px;">
            <input type="number" name="cm-armor-body" placeholder="Body" value="${entry.armorBody ?? 0}" />
            <input type="number" name="cm-armor-cover" placeholder="Cover" value="${entry.armorCover ?? 0}" />
          </div>
        </div>
        <div class="form-group">
          <label>Modifier (–40 / –20 / 0 / +20 / +40)</label>
          <div style="display:flex; flex-direction:column; gap:4px;color:#000;">
            <input type="number" name="cm-modifier" value="${entry.modifier ?? 0}" />
            <select name="cm-mod-preset">
              <option value="">— Modifier preset (optional) —</option>
              <optgroup label="+20% Bonus">
                <option value="20">Point-blank (≤ 3 m)</option>
                <option value="20">Laser sight</option>
                <option value="20">Explosive weapon / area attack</option>
                <option value="20">Ranged: target standing totally still</option>
                <option value="20">Melee: target pinned or standing totally still</option>
                <option value="20">Carefully aiming for a full turn</option>
              </optgroup>
              <optgroup label="–20% Penalty">
                <option value="-20">Range: beyond base (up to 2×)</option>
                <option value="-20">Terrible visibility (smoke / darkness)</option>
                <option value="-20">Called shot: target half-covered / small</option>
                <option value="-20">Ranged: target prone or running</option>
                <option value="-20">Melee: target in vehicle or running</option>
                <option value="-20">Pepper spray / stun gun / exhausted</option>
              </optgroup>
              <optgroup label="–40% Penalty">
                <option value="-40">Range: 2×–5× base</option>
                <option value="-40">Little to no visibility</option>
                <option value="-40">Called shot: target mostly covered / very small</option>
                <option value="-40">Target moving as fast as a speeding car (ranged)</option>
                <option value="-40">Target moving as fast as a speeding car (melee)</option>
                <option value="-40">Tear gas / stunned by stun grenade</option>
              </optgroup>
            </select>
          </div>
        </div>
        <hr/>
        <div class="form-group">
          <label>Conditions</label>
          <div class="flexcol">
            <label><input type="checkbox" name="cm-aiming" ${entry.aiming ? "checked" : ""}/> Aiming (+20 next attack)</label>
            <label><input type="checkbox" name="cm-pinned" ${entry.pinned ? "checked" : ""}/> Pinned</label>
            <label><input type="checkbox" name="cm-prone" ${entry.prone ? "checked" : ""}/> Prone</label>
            <label><input type="checkbox" name="cm-stunned" ${entry.stunned ? "checked" : ""}/> Stunned</label>
            <label><input type="checkbox" name="cm-unconscious" ${entry.unconscious ? "checked" : ""}/> Unconscious</label>
            <label><input type="checkbox" name="cm-suppressed" ${entry.suppressed ? "checked" : ""}/> Suppressed</label>
            <label><input type="checkbox" name="cm-adapted" ${entry.adaptedViolence ? "checked" : ""}/> Adapted to Violence</label>
            <label><input type="checkbox" name="cm-used-defense" ${entry.usedDefense ? "checked" : ""}/> Used Defense this turn</label>
            <label><input type="checkbox" name="cm-waiting" ${entry.waiting ? "checked" : ""}/> Waiting / Held Action</label>
          </div>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea name="cm-notes" rows="3">${entry.notes || ""}</textarea>
        </div>
      </form>
    `;

    new Dialog({
      title: `Edit Combat Entry: ${entry.name || "UNKNOWN"}`,
      content,
      buttons: {
        save: {
          label: "Save",
          icon: '<i class="fas fa-save"></i>',
          callback: (html) => {
            const $html = $(html);

            entry.name = ($html.find("[name='cm-name']").val() || "").toString().trim() || "UNKNOWN";

            const dexVal = $html.find("[name='cm-dex']").val();
            entry.dex = dexVal === "" || dexVal == null ? "" : Number(dexVal);

            const ammoCurrentVal = $html.find("[name='cm-ammo-current']").val();
            const ammoMaxVal = $html.find("[name='cm-ammo-max']").val();
            entry.ammoMax =
              ammoMaxVal === "" || ammoMaxVal == null ? null : Number(ammoMaxVal);
            entry.ammoCurrent =
              ammoCurrentVal === "" || ammoCurrentVal == null
                ? (entry.ammoMax ?? null)
                : Number(ammoCurrentVal);

            entry.status = $html.find("[name='cm-status']").val() || "exposed";

            const bodyVal = $html.find("[name='cm-armor-body']").val();
            const coverVal = $html.find("[name='cm-armor-cover']").val();
            entry.armorBody =
              bodyVal === "" || bodyVal == null ? 0 : Number(bodyVal);
            entry.armorCover =
              coverVal === "" || coverVal == null ? 0 : Number(coverVal);

            const modVal = $html.find("[name='cm-modifier']").val();
            entry.modifier =
              modVal === "" || modVal == null ? 0 : Number(modVal);

            entry.aiming = $html.find("[name='cm-aiming']").prop("checked");
            entry.pinned = $html.find("[name='cm-pinned']").prop("checked");
            entry.prone = $html.find("[name='cm-prone']").prop("checked");
            entry.stunned = $html.find("[name='cm-stunned']").prop("checked");
            entry.unconscious = $html.find("[name='cm-unconscious']").prop("checked");
            entry.suppressed = $html.find("[name='cm-suppressed']").prop("checked");
            entry.adaptedViolence = $html.find("[name='cm-adapted']").prop("checked");
            entry.usedDefense = $html.find("[name='cm-used-defense']").prop("checked");
            entry.waiting = $html.find("[name='cm-waiting']").prop("checked");

            entry.notes = ($html.find("[name='cm-notes']").val() || "").toString();

            CombatManager.refresh();
          }
        },
        cancel: {
          label: "Cancel"
        }
      },
      default: "save",
      render: (html) => {
        // Wire preset dropdown to update the numeric MOD field
        const $html = $(html);
        const $select = $html.find("[name='cm-mod-preset']");
        const $modInput = $html.find("[name='cm-modifier']");

        $select.on("change", () => {
          const val = $select.val();
          if (val === "" || val == null) return;
          const num = Number(val);
          if (!Number.isNaN(num)) {
            $modInput.val(num);
          }
        });
      }
    }).render(true);
  }

  /* --------------------------------------------------------------------- */
  /*  AMMO LOGIC                                                           */
  /* --------------------------------------------------------------------- */

  static _findIndexFromCellEvent(ev) {
    const cell = ev.currentTarget;
    if (!cell) return -1;
    const row = cell.closest(".dg-combat-row-entry");
    if (!row) return -1;
    const idx = Number(row.dataset.index ?? -1);
    return Number.isNaN(idx) ? -1 : idx;
  }

  static _spendAmmo(ev) {
    const idx = CombatManager._findIndexFromCellEvent(ev);
    if (idx < 0) return;

    const entry = CombatManager._entries[idx];
    if (!entry) return;

    if (
      entry.ammoMax == null ||
      entry.ammoMax === "" ||
      Number.isNaN(Number(entry.ammoMax))
    ) {
      return; // no ammo tracking set for this row
    }

    // If current is unset, assume full
    if (entry.ammoCurrent == null || entry.ammoCurrent === "") {
      entry.ammoCurrent = Number(entry.ammoMax);
    }

    entry.ammoCurrent = Math.max(0, Number(entry.ammoCurrent) - 1);
    CombatManager.refresh();
  }

  static _reloadAmmo(ev) {
    const idx = CombatManager._findIndexFromCellEvent(ev);
    if (idx < 0) return;

    const entry = CombatManager._entries[idx];
    if (!entry) return;

    if (
      entry.ammoMax == null ||
      entry.ammoMax === "" ||
      Number.isNaN(Number(entry.ammoMax))
    ) {
      return; // nothing to reload
    }

    entry.ammoCurrent = Number(entry.ammoMax);
    CombatManager.refresh();
  }
}
