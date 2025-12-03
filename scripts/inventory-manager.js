// inventory-manager.js
import {
  WEAPONS,
  GEAR,
  WEAPON_CATEGORIES,
  GEAR_CATEGORIES,
  EXPENSE_LEVELS,
  SERVICES,
  VEHICLES
} from "./equipment-catalog.js";

import { MailSystem } from "./mail-system.js";

// Human-readable labels for weapon categories (if you ever want them)
const WEAPON_CATEGORY_LABELS = {
  [WEAPON_CATEGORIES.HAND_TO_HAND]: "Hand-to-Hand",
  [WEAPON_CATEGORIES.FIREARM]: "Firearm",
  [WEAPON_CATEGORIES.HEAVY]: "Heavy Weapon",
  [WEAPON_CATEGORIES.LESS_LETHAL]: "Less-Lethal",
  [WEAPON_CATEGORIES.DEMOLITION]: "Demolition",
  [WEAPON_CATEGORIES.ARTILLERY]: "Artillery",
  [WEAPON_CATEGORIES.OTHER]: "Other"
};

// Allow only *field* gear in inventory (no research, covers, lodging, storage, etc. if you later split those)
const INVENTORY_GEAR_ALLOWED = new Set([
  GEAR_CATEGORIES.ARMOR,
  GEAR_CATEGORIES.COMMUNICATIONS,
  GEAR_CATEGORIES.SURVEILLANCE,
  GEAR_CATEGORIES.EMERGENCY,
  GEAR_CATEGORIES.WEAPON_MODS,
  GEAR_CATEGORIES.BREAKING,
  GEAR_CATEGORIES.RESTRAINTS,
  GEAR_CATEGORIES.LIGHTING,
  GEAR_CATEGORIES.OTHER
]);

const INVENTORY_GEAR_CATEGORY_LABELS = {
  [GEAR_CATEGORIES.ARMOR]: "Armor",
  [GEAR_CATEGORIES.COMMUNICATIONS]: "Comms / Computer",
  [GEAR_CATEGORIES.SURVEILLANCE]: "Surveillance",
  [GEAR_CATEGORIES.EMERGENCY]: "Emergency / Survival",
  [GEAR_CATEGORIES.WEAPON_MODS]: "Weapon Mods",
  [GEAR_CATEGORIES.BREAKING]: "Breaking & Entering",
  [GEAR_CATEGORIES.RESTRAINTS]: "Restraints",
  [GEAR_CATEGORIES.LIGHTING]: "Lighting / Vision",
  [GEAR_CATEGORIES.OTHER]: "Other Field Gear"
};

// Inventory view + lightweight create/equip/delete tools for the CRT UI
export class InventoryManager {
  static init() {
    console.log("Delta Green UI | InventoryManager init");

    // When the CRT UI DOM is ready, populate once and wire buttons
    Hooks.on("renderDeltaGreenUI", () => {
      this.refresh();
      this._wireCreateButtons();
    });

    // Change of controlled token -> refresh
    Hooks.on("controlToken", () => this.refresh());

    // If "your" actor changes, refresh
    Hooks.on("updateActor", (actor) => {
      const current = this._getCurrentActor();
      if (current && actor?.id === current.id) {
        this.refresh();
      }
    });

    // If items on your actor change, refresh and update mail hotbar
    Hooks.on("createItem", (item) => {
      const current = this._getCurrentActor();
      if (current && item?.parent?.id === current.id) {
        this.refresh();
        if (MailSystem && typeof MailSystem.refreshWeaponHotbar === "function") {
          MailSystem.refreshWeaponHotbar();
        }
      }
    });

    Hooks.on("updateItem", (item) => {
      const current = this._getCurrentActor();
      if (current && item?.parent?.id === current.id) {
        this.refresh();
        if (MailSystem && typeof MailSystem.refreshWeaponHotbar === "function") {
          MailSystem.refreshWeaponHotbar();
        }
      }
    });

    Hooks.on("deleteItem", (item) => {
      const current = this._getCurrentActor();
      if (current && item?.parent?.id === current.id) {
        this.refresh();
        if (MailSystem && typeof MailSystem.refreshWeaponHotbar === "function") {
          MailSystem.refreshWeaponHotbar();
        }
      }
    });
  }

  // --------------------- core helpers ---------------------

  static _getCurrentActor() {
    try {
      if (canvas && canvas.tokens && canvas.tokens.controlled?.length === 1) {
        return canvas.tokens.controlled[0].actor;
      }
    } catch (_e) {}
    if (game.user?.character) return game.user.character;
    return null;
  }

  static _setHeader(actor) {
    const el = document.getElementById("dg-inventory-actor-name");
    if (!el) return;

    if (!actor) {
      el.textContent = "LOGGED IN: NO AGENT SELECTED";
      return;
    }

    const fullName = (actor.name || "UNKNOWN").trim();
    const parts = fullName.split(/\s+/).filter(Boolean);

    let shortName = "UNKNOWN";

    // Prefer 3rd + 4th word, fall back if shorter
    if (parts.length >= 4) {
      shortName = `${parts[2]} ${parts[3]}`; // 3rd + 4th
    } else if (parts.length === 3) {
      shortName = `${parts[1]} ${parts[2]}`; // 2nd + 3rd
    } else if (parts.length === 2) {
      shortName = `${parts[0]} ${parts[1]}`; // both
    } else if (parts.length === 1) {
      shortName = parts[0]; // single name
    }

    el.textContent = `LOGGED IN: ${shortName.toUpperCase()}`;
  }

  /**
   * Return true if this item should live in the PSYCHE tab
   * instead of the inventory (bonds, motivations, disorders).
   */
  static _isPsycheItem(item) {
    if (!item) return false;

    const type = (item.type || "").toLowerCase();
    const name = (item.name || "").toLowerCase();
    const sys =
      item.system ||
      item.data?.system ||
      item.data?.data ||
      {};
    const category = (sys.category || "").toLowerCase();

    // Explicit item types
    if (["bond", "bonds"].includes(type)) return true;
    if (["motivation", "motivations", "drive", "ideal"].includes(type)) return true;
    if (["disorder", "mental_disorder", "insanity"].includes(type)) return true;

    // Category field
    if (["bond", "motivation", "disorder"].includes(category)) return true;

    // Name-based heuristics
    if (name.startsWith("bond:") || name.startsWith("bond -")) return true;
    if (name.includes("motivation") || name.startsWith("motivation:")) return true;
    if (
      name.includes("disorder") ||
      name.includes("ptsd") ||
      name.includes("phobia") ||
      name.includes("addiction")
    ) {
      return true;
    }

    return false;
  }

  // Rough categorization based on Foundry item type + a couple of common flags
  static _partitionItems(actor) {
    const equipped = [];
    const weapons = [];
    const gear = [];

    const items = actor.items?.contents || actor.items || [];

    for (const item of items) {
      // Skip psyche items entirely; they belong to the PSYCHE tab
      if (this._isPsycheItem(item)) continue;

      const type = (item.type || "").toLowerCase();
      const sys = item.system || item.data?.data || {};

      const isEquipped =
        sys.equipped === true ||
        sys.equip === true ||
        sys.carried === true ||
        sys.isEquipped === true;

      if (isEquipped) {
        equipped.push(item);
      }

      if (type.includes("weapon") || type === "weapon") {
        weapons.push(item);
      } else if (
        type === "gear" ||
        type === "equipment" ||
        type === "armor"
      ) {
        gear.push(item);
      }
      // any other types just don't show in this UI (and can't be created anyway)
    }

    // It's fine if an item is in both "equipped" and weapons/gear
    return { equipped, weapons, gear };
  }

  static _renderList(elementId, items, emptyText) {
    const ul = document.getElementById(elementId);
    if (!ul) return;

    ul.innerHTML = "";

    if (!items || !items.length) {
      const li = document.createElement("li");
      li.classList.add("dg-result-item", "dg-no-entries");
      li.textContent = emptyText;
      ul.appendChild(li);
      return;
    }

    const manager = this; // capture for event callbacks

    for (const item of items) {
      const li = document.createElement("li");
      li.classList.add("dg-result-item");
      li.dataset.itemId = item.id;

      const sys = item.system || item.data?.data || {};

      // small inline details if present (ammo, qty, etc)
      const detailBits = [];

      if (sys.quantity != null) {
        detailBits.push(`x${sys.quantity}`);
      }
      if (sys.caliber) {
        detailBits.push(sys.caliber);
      }
      if (sys.damage) {
        detailBits.push(sys.damage);
      }

      const detailText = detailBits.length
        ? ` [${detailBits.join(" · ")}]`
        : "";

      li.textContent = `${item.name}${detailText}`;

      // Left-click -> open normal item sheet
      li.addEventListener("click", (ev) => {
        ev.preventDefault();
        try {
          item.sheet?.render(true);
        } catch (err) {
          console.error("Delta Green UI | Error opening item sheet:", err);
        }
      });

      // Right-click -> toggle equipped state
      li.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        manager._toggleItemEquipped(item);
      });

      // Middle-click -> delete item (with confirm)
      li.addEventListener("auxclick", (ev) => {
        if (ev.button !== 1) return; // 1 = middle mouse
        ev.preventDefault();
        manager._confirmItemDelete(item);
      });

      ul.appendChild(li);
    }
  }

  // --------------------- create item + price catalog buttons ---------------------

  static _wireCreateButtons() {
    const weaponBtn = document.getElementById("dg-inventory-new-weapon");
    const gearBtn = document.getElementById("dg-inventory-new-gear");
    const catalogBtn = document.getElementById("dg-inventory-price-catalog");

    if (weaponBtn && !weaponBtn.dataset.dgInvWired) {
      weaponBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        InventoryManager._openWeaponSelectDialog();
      });
      weaponBtn.dataset.dgInvWired = "1";
    }

    if (gearBtn && !gearBtn.dataset.dgInvWired) {
      gearBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        InventoryManager._openGearSelectDialog();
      });
      gearBtn.dataset.dgInvWired = "1";
    }

    if (catalogBtn && !catalogBtn.dataset.dgCatalogWired) {
      catalogBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        InventoryManager._openPriceCatalogDialog();
      });
      catalogBtn.dataset.dgCatalogWired = "1";
    }
  }

  // ---------- WEAPON SELECTOR ----------

  static _openWeaponSelectDialog() {
    const actor = this._getCurrentActor();
    if (!actor) {
      ui.notifications.warn("No agent selected to receive new weapon.");
      return;
    }
    if (!actor.isOwner && !game.user.isGM) {
      ui.notifications.warn("You do not have permission to edit this agent.");
      return;
    }

    const entries = Array.isArray(WEAPONS) ? [...WEAPONS] : [];

    const dlg = new Dialog({
      title: "Add Weapon from Catalog",
      content: `
        <div class="dg-price-catalog">
          <div class="dg-price-filters">
            <label class="dg-price-filter-label">
              TYPE:
              <select data-dg-wcat>
                <option value="">ANY</option>
                ${Object.entries(WEAPON_CATEGORY_LABELS)
                  .map(([categoryValue, label]) => {
                    // categoryValue is already "hand_to_hand", "firearm", etc.
                    return `<option value="${categoryValue}">${label.toUpperCase()}</option>`;
                  })
                  .join("")}
              </select>
            </label>

            <label class="dg-price-filter-label">
              SEARCH:
              <input
                type="text"
                data-dg-wsearch
                placeholder="FILTER BY NAME"
              />
            </label>
          </div>

          <div class="dg-price-body" data-dg-wbody>
            <!-- filled by _renderWeaponSelectBody -->
          </div>
        </div>
      `,
      buttons: {
        custom: {
          label: "Custom Weapon",
          callback: () => InventoryManager._createCustomWeaponForCurrentActor()
        },
        close: {
          label: "Close",
          callback: () => {}
        }
      },
      default: "close",
      render: (html) => {
        const root = html[0]?.querySelector(".dg-price-catalog");
        if (!root) return;

        const catSel = root.querySelector("[data-dg-wcat]");
        const searchInput = root.querySelector("[data-dg-wsearch]");
        const body = root.querySelector("[data-dg-wbody]");

        if (!catSel || !searchInput || !body) return;

        const state = {
          category: "",
          search: ""
        };

        const rerender = () => {
          state.category = catSel.value || "";
          state.search = (searchInput.value || "").toLowerCase();
          InventoryManager._renderWeaponSelectBody(body, entries, state, actor);
        };

        catSel.addEventListener("change", rerender);
        searchInput.addEventListener("input", rerender);

        rerender();
      }
    }, {
      classes: ["dg-ui-dialog", "dg-price-dialog", "dg-weapon-catalog-dialog"]
    });

    dlg.render(true);
  }

  static _renderWeaponSelectBody(bodyEl, entries, state, actor) {
    const { category, search } = state;

    let filtered = entries;

    if (category) {
      filtered = filtered.filter((w) => w.category === category);
    }

    if (search) {
      filtered = filtered.filter((w) =>
        (w.name || "").toLowerCase().includes(search)
      );
    }

    if (!filtered.length) {
      bodyEl.innerHTML = `<p style="font-size: 11px; opacity: 0.7;">NO MATCHING WEAPONS.</p>`;
      return;
    }

    // sort by name
    filtered = [...filtered].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );

    const rows = filtered
      .map((w, idx) => {
        const catText = w.category
          ? WEAPON_CATEGORY_LABELS[w.category] || ""
          : "";

        const infoBits = [];
        if (w.skill) infoBits.push(w.skill);
        if (w.damage) infoBits.push(`DMG ${w.damage}`);
        if (w.baseRange) infoBits.push(`RNG ${w.baseRange}`);
        if (w.lethality) infoBits.push(`LETH ${w.lethality}`);
        if (w.expense) infoBits.push(w.expense.toUpperCase());

        return `
          <li class="dg-price-row" data-dg-widx="${idx}">
            <div class="dg-price-name">
              ${w.name}
              ${
                catText
                  ? `<br><span style="font-size: 9px; opacity: 0.7;">${catText}</span>`
                  : ""
              }
              ${
                infoBits.length
                  ? `<br><span style="font-size: 9px; opacity: 0.7;">${infoBits.join(
                      " · "
                    )}</span>`
                  : ""
              }
            </div>
            <div class="dg-price-tags">
              <span class="dg-tag">SELECT</span>
            </div>
          </li>
        `;
      })
      .join("");

    bodyEl.innerHTML = `
      <ul class="dg-results-list dg-price-list">
        ${rows}
      </ul>
    `;

    // wire selects
    bodyEl.querySelectorAll("[data-dg-widx]").forEach((li) => {
      li.addEventListener("click", async (ev) => {
        ev.preventDefault();
        const idx = Number(li.dataset.dgWidx || "-1");
        const weapon = filtered[idx];
        if (!weapon) return;
        await InventoryManager._createWeaponFromCatalog(actor, weapon);
      });
    });
  }

  static async _createWeaponFromCatalog(actor, weaponDef) {
    try {
      const sys = {};

      if (weaponDef.skill) sys.skill = weaponDef.skill;
      if (weaponDef.damage) sys.damage = weaponDef.damage;
      if (weaponDef.baseRange) sys.range = weaponDef.baseRange;
      if (weaponDef.armorPiercing != null)
        sys.armorPiercing = weaponDef.armorPiercing;
      if (weaponDef.ammoCapacity != null)
        sys.ammo = weaponDef.ammoCapacity;

      // Lethality: set both value + flag so the sheet shows it
      if (weaponDef.lethality) {
        const m = String(weaponDef.lethality).match(/(\d+)/);
        sys.isLethal = true;
        sys.lethality = m ? Number(m[1]) : 0;
      } else {
        sys.isLethal = false;
      }

      sys.equipped = true;
      sys.quantity = 1;
      if (weaponDef.expense) sys.expense = weaponDef.expense;
      if (weaponDef.notes) sys.notes = weaponDef.notes;

      const created = await actor.createEmbeddedDocuments("Item", [
        {
          name: weaponDef.name || "Weapon",
          type: "weapon",
          system: sys
        }
      ]);

      const item = created?.[0];
      if (item) item.sheet?.render(true);
      this.refresh();
    } catch (err) {
      console.error("Delta Green UI | Error creating weapon from catalog:", err);
      ui.notifications.error("Error creating weapon.");
    }
  }

  static async _createCustomWeaponForCurrentActor() {
    const actor = this._getCurrentActor();
    if (!actor) {
      ui.notifications.warn("No agent selected to receive new weapon.");
      return;
    }
    if (!actor.isOwner && !game.user.isGM) {
      ui.notifications.warn("You do not have permission to edit this agent.");
      return;
    }

    try {
      const created = await actor.createEmbeddedDocuments("Item", [
        {
          name: "Custom Weapon",
          type: "weapon",
          system: {
            damage: "",
            range: "",
            isLethal: false,
            lethality: 0,
            quantity: 1,
            equipped: true
          }
        }
      ]);

      const item = created?.[0];
      if (item) item.sheet?.render(true);
      this.refresh();
    } catch (err) {
      console.error("Delta Green UI | Error creating weapon from catalog:", err);
      ui.notifications.error("Error creating weapon.");
    }
  }

  // ---------- GEAR SELECTOR ----------

  static _openGearSelectDialog() {
    const actor = this._getCurrentActor();
    if (!actor) {
      ui.notifications.warn("No agent selected to receive new gear.");
      return;
    }
    if (!actor.isOwner && !game.user.isGM) {
      ui.notifications.warn("You do not have permission to edit this agent.");
      return;
    }

    // Only show "field" gear (no pure services) in this selector
    const entries = (Array.isArray(GEAR) ? GEAR : []).filter((g) =>
      INVENTORY_GEAR_ALLOWED.has(g.category)
    );

    const dlg = new Dialog({
      title: "Add Gear from Catalog",
      content: `
        <div class="dg-price-catalog">
          <div class="dg-price-filters">
            <label class="dg-price-filter-label">
              CATEGORY:
              <select data-dg-gcat>
                <option value="">ANY</option>
                ${Object.entries(INVENTORY_GEAR_CATEGORY_LABELS)
                  .map(
                    ([cat, label]) =>
                      `<option value="${cat}">${label.toUpperCase()}</option>`
                  )
                  .join("")}
              </select>
            </label>

            <label class="dg-price-filter-label">
              SEARCH:
              <input
                type="text"
                data-dg-gsearch
                placeholder="FILTER BY NAME"
              />
            </label>
          </div>

          <div class="dg-price-body" data-dg-gbody>
            <!-- filled by _renderGearSelectBody -->
          </div>
        </div>
      `,
      buttons: {
        custom: {
          label: "Custom Gear",
          callback: () => InventoryManager._createCustomGearForCurrentActor()
        },
        close: {
          label: "Close",
          callback: () => {}
        }
      },
      default: "close",
      render: (html) => {
        const root = html[0]?.querySelector(".dg-price-catalog");
        if (!root) return;

        const catSel = root.querySelector("[data-dg-gcat]");
        const searchInput = root.querySelector("[data-dg-gsearch]");
        const body = root.querySelector("[data-dg-gbody]");

        if (!catSel || !searchInput || !body) return;

        const state = {
          category: "",
          search: ""
        };

        const rerender = () => {
          state.category = catSel.value || "";
          state.search = (searchInput.value || "").toLowerCase();
          InventoryManager._renderGearSelectBody(body, entries, state, actor);
        };

        catSel.addEventListener("change", rerender);
        searchInput.addEventListener("input", rerender);

        rerender();
      }
    }, {
      classes: ["dg-ui-dialog", "dg-price-dialog", "dg-gear-catalog-dialog"]
    });

    dlg.render(true);
  }

  static _renderGearSelectBody(bodyEl, entries, state, actor) {
    const { category, search } = state;

    let filtered = entries;

    if (category) {
      filtered = filtered.filter((g) => g.category === category);
    }

    if (search) {
      filtered = filtered.filter((g) =>
        (g.name || "").toLowerCase().includes(search)
      );
    }

    if (!filtered.length) {
      bodyEl.innerHTML = `<p style="font-size: 11px; opacity: 0.7;">NO MATCHING GEAR.</p>`;
      return;
    }

    // sort by name
    filtered = [...filtered].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );

    const rows = filtered
      .map((g, idx) => {
        const catLabel = g.category
          ? INVENTORY_GEAR_CATEGORY_LABELS[g.category] || ""
          : "";

        const infoBits = [];
        if (g.armorRating != null) infoBits.push(`ARMOR ${g.armorRating}`);
        if (g.expense) infoBits.push(g.expense.toUpperCase());

        return `
          <li class="dg-price-row" data-dg-gidx="${idx}">
            <div class="dg-price-name">
              ${g.name}
              ${
                catLabel
                  ? `<br><span style="font-size: 12px; opacity: 0.7;">${catLabel}</span>`
                  : ""
              }
              ${
                infoBits.length
                  ? `<br><span style="font-size: 12px; opacity: 0.7;">${infoBits.join(
                      " · "
                    )}</span>`
                  : ""
              }
            </div>
            <div class="dg-price-tags">
              <span class="dg-tag">SELECT</span>
            </div>
          </li>
        `;
      })
      .join("");

    bodyEl.innerHTML = `
      <ul class="dg-results-list dg-price-list">
        ${rows}
      </ul>
    `;

    // wire selects
    bodyEl.querySelectorAll("[data-dg-gidx]").forEach((li) => {
      li.addEventListener("click", async (ev) => {
        ev.preventDefault();
        const idx = Number(li.dataset.dgGidx || "-1");
        const gear = filtered[idx];
        if (!gear) return;
        await InventoryManager._createGearFromCatalog(actor, gear);
      });
    });
  }

  static async _createGearFromCatalog(actor, gearDef) {
    try {
      const sys = {
        quantity: 1,
        equipped: false
      };

      if (gearDef.armorRating != null) sys.armor = gearDef.armorRating;
      if (gearDef.expense) sys.expense = gearDef.expense;
      if (gearDef.notes) sys.notes = gearDef.notes;

      const created = await actor.createEmbeddedDocuments("Item", [
        {
          name: gearDef.name || "Gear",
          type: "gear",
          system: sys
        }
      ]);

      const item = created?.[0];
      if (item) item.sheet?.render(true);
      this.refresh();
    } catch (err) {
      console.error("Delta Green UI | Error creating gear from catalog:", err);
      ui.notifications.error("Error creating gear.");
    }
  }

  static async _createCustomGearForCurrentActor() {
    const actor = this._getCurrentActor();
    if (!actor) {
      ui.notifications.warn("No agent selected to receive new gear.");
      return;
    }
    if (!actor.isOwner && !game.user.isGM) {
      ui.notifications.warn("You do not have permission to edit this agent.");
      return;
    }

    try {
      const created = await actor.createEmbeddedDocuments("Item", [
        {
          name: "Custom Gear",
          type: "gear",
          system: {
            quantity: 1,
            equipped: false
          }
        }
      ]);

      const item = created?.[0];
      if (item) item.sheet?.render(true);
      this.refresh();
    } catch (err) {
      console.error("Delta Green UI | Error creating custom gear:", err);
      ui.notifications.error("Error creating gear.");
    }
  }

  // --------------------- misc helpers used by price catalog ---------------------

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

  // --------------------- equip toggle helper ---------------------

  static async _toggleItemEquipped(item) {
    if (!item) return;

    // Permission check: GM or owner of item/actor
    try {
      if (
        !game.user.isGM &&
        !item.isOwner &&
        !(item.parent && item.parent.isOwner)
      ) {
        ui.notifications.warn("You do not have permission to modify this item.");
        return;
      }
    } catch (_e) {
      ui.notifications.warn("Could not verify permissions to edit this item.");
      return;
    }

    const sys = item.system || item.data?.data || {};
    let key = null;

    // Prefer an existing flag instead of inventing a new one
    if (Object.prototype.hasOwnProperty.call(sys, "equipped")) key = "equipped";
    else if (Object.prototype.hasOwnProperty.call(sys, "equip")) key = "equip";
    else if (Object.prototype.hasOwnProperty.call(sys, "carried")) key = "carried";
    else key = "equipped"; // fallback: create equipped flag

    const current = !!sys[key];
    const next = !current;

    try {
      await item.update({ [`system.${key}`]: next });

      const label = item.name || "Item";
      ui.notifications.info(
        `${label}: ${next ? "equipped" : "unequipped"}.`
      );

      this.refresh();
    } catch (err) {
      console.error("Delta Green UI | Error toggling equipped:", err);
      ui.notifications.error("Error toggling equipped state.");
    }
  }

  // --------------------- delete item helpers (middle-click) ---------------------

  static _canDeleteItem(item) {
    try {
      if (game.user.isGM) return true;
      if (item.isOwner) return true;
      if (item.parent && item.parent.isOwner) return true;
    } catch (_e) {}
    return false;
  }

  static _confirmItemDelete(item) {
    if (!item) return;

    if (!this._canDeleteItem(item)) {
      ui.notifications.warn("You do not have permission to delete this item.");
      return;
    }

    const itemName = item.name || "this item";

    Dialog.confirm({
      title: "Delete Item",
      content: `<p>Middle-click detected on <strong>${itemName}</strong>.<br>Delete this item from the agent's inventory?</p>`,
      yes: async () => {
        try {
          await item.delete();
          this.refresh();
        } catch (err) {
          console.error("Delta Green UI | Error deleting item:", err);
          ui.notifications.error("Error deleting item.");
        }
      },
      no: () => {},
      defaultYes: false,
      options: {
        classes: ["dg-ui-dialog", "dg-confirm-dialog", "dg-inventory-confirm-dialog"]
      }
    });
  }

  // ---------------------------------------------------------------------------
  // PRICE CATALOG DIALOG (read-only; includes weapons, gear, services, vehicles)
  // ---------------------------------------------------------------------------

  static _openPriceCatalogDialog() {
    try {
      const entries = this._collectCatalogEntries();

      const dlg = new Dialog({
        title: "Price Catalog",
        content: this._buildPriceCatalogShellHTML(),
        buttons: {
          close: {
            label: "Close",
            callback: () => {}
          }
        },
        default: "close",
        render: (html) => {
          this._wirePriceCatalogDialog(html, entries);
        }
      }, {
        classes: ["dg-ui-dialog", "dg-price-dialog", "dg-price-catalog-dialog"]
      });

      dlg.render(true);
    } catch (err) {
      console.error("Delta Green UI | Error building price catalog:", err);
      ui.notifications.error("Error opening price catalog.");
    }
  }

  static _buildPriceCatalogShellHTML() {
    // Filters + body container; the body gets populated dynamically
    return `
      <div class="dg-price-catalog">
        <p style="font-size: 15px; opacity: 0.8; margin-bottom: 6px;">
          Reference only. Agents must clear expenses with the Handler.
        </p>

        <div class="dg-price-filters">
          <label class="dg-price-filter-label">
            EXPENSE:
            <select data-dg-expense>
              <option value="">ANY</option>
            </select>
          </label>

          <label class="dg-price-filter-label">
            TYPE:
            <select data-dg-type>
              <option value="">ANY</option>
              <option value="WEAPON">WEAPON</option>
              <option value="GEAR">GEAR</option>
              <option value="SERVICE">SERVICE</option>
              <option value="VEHICLE">VEHICLE</option>
            </select>
          </label>

          <label class="dg-price-filter-label">
            SEARCH:
            <input
              type="text"
              data-dg-search
              placeholder="FILTER BY NAME OR NOTES"
            />
          </label>
        </div>

        <div class="dg-price-body">
          <!-- filled by _wirePriceCatalogDialog -->
        </div>
      </div>
    `;
  }

  static _wirePriceCatalogDialog(html, allEntries) {
    const root = html[0]?.querySelector(".dg-price-catalog");
    if (!root) return;

    const expenseSelect = root.querySelector("[data-dg-expense]");
    const typeSelect = root.querySelector("[data-dg-type]");
    const searchInput = root.querySelector("[data-dg-search]");
    const body = root.querySelector(".dg-price-body");

    if (!expenseSelect || !typeSelect || !searchInput || !body) return;

    // Populate expense dropdown: ANY + EXPENSE_LEVELS
    for (const lvl of EXPENSE_LEVELS) {
      const opt = document.createElement("option");
      opt.value = lvl;
      opt.textContent = lvl.toUpperCase();
      expenseSelect.appendChild(opt);
    }

    const state = {
      expense: "",
      type: "",
      search: ""
    };

    const rerender = () => {
      state.expense = expenseSelect.value || "";
      state.type = typeSelect.value || "";
      state.search = (searchInput.value || "").toLowerCase();

      const filtered = allEntries.filter((entry) => {
        if (state.expense && entry.expense !== state.expense) return false;
        if (state.type && entry.type !== state.type) return false;

        if (state.search) {
          const haystack =
            (entry.name || "") +
            " " +
            (entry.notes || "");
          if (!haystack.toLowerCase().includes(state.search)) return false;
        }

        return true;
      });

      if (!filtered.length) {
        body.innerHTML = `<p style="font-size: 15px; opacity: 0.7;">NO MATCHING ENTRIES.</p>`;
        return;
      }

      // Group by expense band
      const grouped = {};
      for (const lvl of EXPENSE_LEVELS) {
        grouped[lvl] = [];
      }
      grouped["__OTHER__"] = [];

      for (const entry of filtered) {
        if (grouped[entry.expense]) grouped[entry.expense].push(entry);
        else grouped["__OTHER__"].push(entry);
      }

      const blocks = [];

      for (const lvl of EXPENSE_LEVELS) {
        const bucket = grouped[lvl];
        if (!bucket || !bucket.length) continue;
        blocks.push(InventoryManager._renderPriceBlock(lvl, bucket));
      }

      if (grouped["__OTHER__"].length) {
        blocks.push(InventoryManager._renderPriceBlock("Other", grouped["__OTHER__"]));
      }

      body.innerHTML = blocks.join("");
    };

    // Wire listeners
    expenseSelect.addEventListener("change", rerender);
    typeSelect.addEventListener("change", rerender);
    searchInput.addEventListener("input", rerender);

    // Initial render
    rerender();
  }

  static _collectCatalogEntries() {
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

    // Sort globally by name for stable UX
    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }

  static _renderPriceBlock(level, entries) {
    // Sort inside band by type then name
    entries.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type.localeCompare(b.type);
    });

    const rows = entries
      .map((e) => {
        const typeLabel = e.type;
        const noteAttr = e.notes
          ? ` title="${InventoryManager._escapeAttr(e.notes)}"`
          : "";
        const categoryLabel = e.category
          ? InventoryManager._prettyLabel(e.category)
          : "";

        const subLabel = categoryLabel
          ? `<span style="font-size: 12px; opacity: 0.7;">${categoryLabel}</span>`
          : "";

        return `
          <li class="dg-price-row"${noteAttr}>
            <div class="dg-price-name">
              ${e.name}
              ${subLabel ? `<br>${subLabel}` : ""}
            </div>
            <div class="dg-price-tags">
              <span class="dg-tag">${typeLabel}</span>
            </div>
          </li>
        `;
      })
      .join("");

    return `
      <div class="dg-price-block">
        <div class="dg-subtitle">${level.toUpperCase()}</div>
        <ul class="dg-results-list dg-price-list">
          ${rows}
        </ul>
      </div>
    `;
  }

  // --------------------- public refresh ---------------------

  static refresh() {
    const actor = this._getCurrentActor();
    this._setHeader(actor);

    if (!actor) {
      // clear lists & show placeholders
      this._renderList("dg-inventory-equipped", [], "NO EQUIPPED ITEMS");
      this._renderList("dg-inventory-weapons", [], "NO WEAPONS");
      this._renderList("dg-inventory-gear", [], "NO GEAR");
      return;
    }

    const parts = this._partitionItems(actor);

    this._renderList(
      "dg-inventory-equipped",
      parts.equipped,
      "NO EQUIPPED ITEMS"
    );
    this._renderList("dg-inventory-weapons", parts.weapons, "NO WEAPONS");
    this._renderList("dg-inventory-gear", parts.gear, "NO GEAR");
  }
}

// Kick this once the world is ready
Hooks.once("ready", () => {
  InventoryManager.init();
});
