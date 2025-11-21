/**
 * Records Manager for Delta Green Player UI
 */
import { DeltaGreenUI } from "./delta-green-ui.js";

export class RecordsManager {
  static currentRecordId = null;
  static tempAvatarPath = null;
  static isSaving = false;

  // Remember which folders are collapsed (true = collapsed)
  static folderCollapseState = {};

  /* ----------------------------------------------------------------------- */
  /*  INIT & HOOKS                                                           */
  /* ----------------------------------------------------------------------- */

  static init() {
    console.log("Delta Green UI | RecordsManager init");

    // Ensure permissions on startup
    this.ensureRecordsPermissions();

    // Vehicle-specific UI
    this.initVehicleEvents();

    // Keep permissions correct when actors are created/updated
    Hooks.on("createActor", (actor) => {
      if (this._isInPcRecordsTree(actor)) this.ensureActorPermissions(actor);
    });

    Hooks.on("updateActor", (actor) => {
      if (this._isInPcRecordsTree(actor)) this.ensureActorPermissions(actor);
    });

    // UI events are delegated so they survive template re-render
    $(document).on("click", "#dg-add-record-button", async (ev) => {
      ev.preventDefault();
      await this.createNpcRecordAndOpen();
    });

    // Unnatural NPC button
    $(document).on("click", "#dg-add-unnatural-npc", async (ev) => {
      ev.preventDefault();
      await this.createUnnaturalNpcRecordAndOpen();
    });

    // Add New Folder button handler
    $(document).on("click", "#dg-add-folder-button", (ev) => {
      ev.preventDefault();
      this.showFolderDialog();
    });

    $(document).on("click", "#dg-cancel-record", (ev) => {
      ev.preventDefault();
      this.hideRecordForm();
    });

    $(document).on("click", "#dg-save-record", (ev) => {
      ev.preventDefault();
      this.saveRecord();
    });

    // NEW: FULL REPORT button handler (opens the actor's normal sheet)
    $(document).on("click", "#dg-full-report-btn", (ev) => {
      ev.preventDefault();
      if (!this.currentRecordId) {
        ui.notifications.warn("No active record selected.");
        return;
      }
      const actor = game.actors.get(this.currentRecordId);
      if (actor?.sheet) {
        actor.sheet.render(true);
      } else {
        ui.notifications.warn("No character sheet available for this record.");
      }
    });

    $(document).on("click", "#dg-search-button", (ev) => {
      ev.preventDefault();
      const term = $("#dg-search-input").val() || "";
      this.searchRecords(term.trim());
    });

    $(document).on("keyup", "#dg-search-input", (ev) => {
      if (ev.key === "Enter") {
        const term = $("#dg-search-input").val() || "";
        this.searchRecords(term.trim());
      }
    });

    // Bind once: clickable skills/stat handlers
    this._bindSkillClickHandler();
  }

  /* ----------------------------------------------------------------------- */
  /*  CREATE: NEW NPC RECORD (player-friendly)                               */
  /* ----------------------------------------------------------------------- */

  static async createNpcRecordAndOpen() {
    try {
      // Let GMs gate this with the standard Foundry capability if desired
      if (!game.user.can("ACTOR_CREATE")) {
        ui.notifications.warn(
          "You don’t have permission to create records. Ask the GM to allow 'Create New Actors' for Players."
        );
        return;
      }

      // Ensure the PC Records root exists (auto-create if missing)
      const rootFolder = await this._getOrCreatePcRecordsRoot();
      const folderId = rootFolder?.id ?? null;

      // Always create as NPC so it uses the NPC layout/flags correctly
      const actor = await Actor.create({
        name: "New Record",
        type: "npc",
        folder: folderId,
        permission: { default: 3 },
        img: "icons/svg/mystery-man.svg",
      });

      // Optional: explicit marker if you ever want to branch on it
      await actor.setFlag(DeltaGreenUI.ID, "isNpcRecord", true);

      // Open your custom page
      this.openRecord(actor.id);

      // Refresh list
      this.loadRecords();
      ui.notifications.info("New NPC record created.");
    } catch (err) {
      console.error("DG UI | Error creating NPC record:", err);
      ui.notifications.error("Error creating NPC record.");
    }
  }

  /* ----------------------------------------------------------------------- */
  /*  CREATE: NEW UNNATURAL NPC RECORD                                       */
  /* ----------------------------------------------------------------------- */

  static async createUnnaturalNpcRecordAndOpen() {
    try {
      if (!game.user.can("ACTOR_CREATE")) {
        ui.notifications.warn(
          "You don’t have permission to create records. Ask the GM to allow 'Create New Actors' for Players."
        );
        return;
      }

      const rootFolder = await this._getOrCreatePcRecordsRoot();
      const folderId = rootFolder?.id ?? null;

      // IMPORTANT: actual Delta Green system type "unnatural"
      const actor = await Actor.create({
        name: "Unnatural Entity",
        type: "unnatural",
        folder: folderId,
        permission: { default: 3 },
        img: "icons/svg/mystery-man.svg",
      });

      await actor.setFlag(DeltaGreenUI.ID, "isNpcRecord", true);
      await actor.setFlag(DeltaGreenUI.ID, "isUnnaturalNpc", true);

      this.openRecord(actor.id);
      this.loadRecords();
      ui.notifications.info("New Unnatural NPC record created.");
    } catch (err) {
      console.error("DG UI | Error creating Unnatural NPC record:", err);
      ui.notifications.error("Error creating Unnatural NPC record.");
    }
  }

  /* ----------------------------------------------------------------------- */
  /*  FOLDER HELPERS                                                         */
  /* ----------------------------------------------------------------------- */

  /**
   * Root "PC Records" folder (Actor type)
   */
  static _getPcRecordsRoot() {
    return (
      game.folders.find((f) => f.type === "Actor" && f.name === "PC Records") ||
      null
    );
  }

  /** Ensure PC Records root exists (auto-create if needed) */
  static async _getOrCreatePcRecordsRoot() {
    let root = this._getPcRecordsRoot();
    if (root) return root;
    root = await Folder.create({ name: "PC Records", type: "Actor" });
    return root;
  }

  /**
   * All folder IDs under "PC Records" (root + subfolders)
   */
  static _getPcRecordsFolderIds() {
    const root = this._getPcRecordsRoot();
    if (!root) return new Set();

    const ids = new Set();
    const stack = [root];

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

  /**
   * Is this actor anywhere under PC Records?
   */
  static _isInPcRecordsTree(actor) {
    if (!actor?.folder) return false;
    const folderIds = this._getPcRecordsFolderIds();
    return folderIds.has(actor.folder.id);
  }

  /**
   * Recursive folder tree: { folder, actors, children[] }
   * (folders and actors sorted alphabetically)
   */
  static _buildFolderTree(folder) {
    const childrenFolders = game.folders
      .filter((f) => f.type === "Actor" && f.folder?.id === folder.id)
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );

    const actors = game.actors
      .filter((a) => a.folder?.id === folder.id)
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );

    return {
      folder,
      actors,
      children: childrenFolders.map((f) => this._buildFolderTree(f)),
    };
  }

  /**
   * Create a subfolder under PC Records
   */
  static async createSubfolder(name, parentFolderId = null) {
    name = String(name || "").trim();
    if (!name) {
      ui.notifications.error("Folder name is required");
      return;
    }

    const rootFolder = await this._getOrCreatePcRecordsRoot();
    let parentFolder = parentFolderId
      ? game.folders.get(parentFolderId)
      : rootFolder;

    if (!parentFolder) {
      ui.notifications.error("PC Records folder not found");
      return;
    }

    const folder = await Folder.create({
      name,
      type: "Actor",
      folder: parentFolder.id,
    });

    ui.notifications.info(`Subfolder "${folder.name}" created`);
    this.loadRecords();
    return folder;
  }

  /**
   * CRT-style dialog to create a subfolder
   */
  static showFolderDialog() {
    const d = new Dialog({
      title: "NEW RECORDS FOLDER",
      content: `
        <div class="dg-section">
          <div class="dg-profile-label" style="margin-bottom:4px;">Folder Name</div>
          <input type="text" id="dg-new-folder-name" class="dg-form-input" style="width:100%;" autofocus>
        </div>
      `,
      buttons: {
        create: {
          icon: '<i class="fas fa-folder-plus"></i>',
          label: "CREATE",
          callback: (html) => {
            const name = String(
              html.find("#dg-new-folder-name").val() || ""
            ).trim();
            if (!name) {
              ui.notifications.error("Folder name is required");
              return;
            }
            RecordsManager.createSubfolder(name);
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "CANCEL",
        },
      },
      default: "create",
      render: (html) => {
        const $app = $(html).closest(".app");
        $app.css("z-index", "10000");
        $app.css("background-color", "#1a1a1a");
        $app.css("border", "2px solid #ffb000");
        $app.css("color", "#ffb000");
        $(html)
          .find(".dialog-buttons button")
          .css("background-color", "#ffb000")
          .css("color", "#1a1a1a");
      },
    });
    d.render(true);
  }

  /* ----------------------------------------------------------------------- */
  /*  CLICKABLE SKILLS (BRACKETED LINE)                                      */
  /* ----------------------------------------------------------------------- */

  static _renderClickableSkillsLine(actor, $mount) {
    if (!$mount || !$mount.length) return;

    const skillsObj = actor?.system?.skills || {};
    const trained = Object.entries(skillsObj)
      .filter(([, sk]) => {
        if (!sk) return false;
        const prof = Number(sk.proficiency ?? 0);
        return prof > 0 && !sk.isCalculatedValue;
      })
      .map(([key, sk]) => {
        const label = sk.label || key.toUpperCase();
        const pct = Number(sk.proficiency ?? 0) || 0;
        return { label, pct };
      })
      .sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
      );

    const $line = $(
      `<div class="dg-agent-skills-list" aria-label="Skills"></div>`
    );

    if (!trained.length) {
      $line.append(`<span class="dg-placeholder">None recorded.</span>`);
    } else {
      trained.forEach((s) => {
        $line.append(
          $(
            `<span class="dg-skill"
                  data-skill-label="${s.label}"
                  data-skill-target="${s.pct}">
              ${s.label} <span class="dg-skill-val">${s.pct}%</span>
            </span>`
          )
        );
      });
    }

    $mount.empty().append($line);
  }

  static _bindSkillClickHandler() {
    // Skills: d100 <= target
    $(document)
      .off("click", ".dg-skill")
      .on("click", ".dg-skill", async function (e) {
        e.preventDefault();
        const $el = $(this);
        const label = $el.data("skill-label") || "Skill";
        const tgt = parseInt($el.data("skill-target"), 10) || 0;
        try {
          const roll = new Roll("1d100");
          await roll.evaluate();
          const total = roll.total;
          const success = total <= tgt;
          const flavor = `${label} (${tgt}%) — ${
            success ? "SUCCESS" : "FAILURE"
          }`;
          await roll.toMessage({
            speaker: ChatMessage.getSpeaker(),
            flavor,
            rollMode: game.settings.get("core", "rollMode"),
          });
        } catch (err) {
          console.error("DG UI | Skill roll error:", err);
          ui.notifications.error("Error rolling skill.");
        }
      });

    // Core stats: also d100 vs x5
    $(document)
      .off("click", ".dg-core")
      .on("click", ".dg-core", async function (e) {
        e.preventDefault();
        const $el = $(this);
        const label = $el.data("skill-label") || "STAT";
        const tgt = parseInt($el.data("skill-target"), 10) || 0;
        try {
          const roll = new Roll("1d100");
          await roll.evaluate();
          const total = roll.total;
          const success = total <= tgt;
          const flavor = `${label} ×5 (${tgt}%) — ${
            success ? "SUCCESS" : "FAILURE"
          }`;
          await roll.toMessage({
            speaker: ChatMessage.getSpeaker(),
            flavor,
            rollMode: game.settings.get("core", "rollMode"),
          });
        } catch (err) {
          console.error("DG UI | Core stat roll error:", err);
          ui.notifications.error("Error rolling stat.");
        }
      });
  }

  /* ----------------------------------------------------------------------- */
  /*  VEHICLES                                                               */
  /* ----------------------------------------------------------------------- */

  static initVehicleEvents() {
    $(document).on("click", "#dg-add-vehicle-btn", async (event) => {
      event.preventDefault();
      await this.createAndOpenVehicle();
    });
  }

  static async createAndOpenVehicle() {
    try {
      const rootFolder = await this._getOrCreatePcRecordsRoot();
      const folderId = rootFolder ? rootFolder.id : null;

      const vehicleActor = await Actor.create({
        name: "New Vehicle",
        type: "vehicle",
        folder: folderId,
        permission: { default: 3 },
      });

      await vehicleActor.setFlag(DeltaGreenUI.ID, "isVehicle", true);

      this.showVehicleForm(vehicleActor);
      this.loadRecords();
    } catch (err) {
      console.error("Delta Green UI | Error creating vehicle actor:", err);
      ui.notifications.error("Error creating vehicle record");
    }
  }

  static showVehicleForm(actor) {
    if (!actor) return;

    this.currentRecordId = actor.id;

    const $humanForm = $("#dg-case-study-form");
    const $vehicleForm = $("#dg-vehicle-form");

    if (!$vehicleForm.length) {
      console.warn(
        'Delta Green UI | Vehicle form container "#dg-vehicle-form" not found'
      );
      return;
    }

    $humanForm.hide();
    $vehicleForm.show().scrollTop(0);

    const selectedFolderId = actor.folder?.id || null;
    this._populateVehicleFolderSelect(selectedFolderId);

    const getFlag = (key) => actor.getFlag(DeltaGreenUI.ID, key) || "";

    $("#dg-vehicle-name").val(actor.name || "");
    $("#dg-vehicle-year").val(getFlag("vehicleYear"));
    $("#dg-vehicle-model").val(getFlag("vehicleModel"));
    $("#dg-vehicle-plate").val(getFlag("vehiclePlate"));
    $("#dg-vehicle-owner").val(getFlag("vehicleOwner"));
    $("#dg-vehicle-notes").val(getFlag("vehicleNotes"));

    const imgSrc = actor.img || "icons/svg/mystery-man.svg";
    $("#dg-vehicle-avatar").attr("src", imgSrc);
    this._setupVehicleAvatarButton();

    $("#dg-vehicle-close")
      .off("click")
      .on("click", (e) => {
        e.preventDefault();
        $vehicleForm.hide();
      });

    $("#dg-vehicle-save")
      .off("click")
      .on("click", async (e) => {
        e.preventDefault();
        try {
          const rootFolder = this._getPcRecordsRoot();
          const selectedFolderId2 = $("#dg-vehicle-folder").val();
          const targetFolderId =
            selectedFolderId2 ||
            (rootFolder ? rootFolder.id : actor.folder?.id);

          const updateData = {
            name: $("#dg-vehicle-name").val(),
          };

          if (targetFolderId && actor.folder?.id !== targetFolderId) {
            updateData.folder = targetFolderId;
          }

          await actor.update(updateData);

          await actor.setFlag(
            DeltaGreenUI.ID,
            "vehicleYear",
            $("#dg-vehicle-year").val()
          );
          await actor.setFlag(
            DeltaGreenUI.ID,
            "vehicleModel",
            $("#dg-vehicle-model").val()
          );
          await actor.setFlag(
            DeltaGreenUI.ID,
            "vehiclePlate",
            $("#dg-vehicle-plate").val()
          );
          await actor.setFlag(
            DeltaGreenUI.ID,
            "vehicleOwner",
            $("#dg-vehicle-owner").val()
          );
          await actor.setFlag(
            DeltaGreenUI.ID,
            "vehicleNotes",
            $("#dg-vehicle-notes").val()
          );
          await actor.setFlag(DeltaGreenUI.ID, "isVehicle", true);

          ui.notifications.info("Vehicle record saved");
          this.hideRecordForm();
          this.loadRecords();
        } catch (err) {
          console.error("Delta Green UI | Error saving vehicle record:", err);
          ui.notifications.error("Error saving vehicle record");
        }
      });
  }

  /* ----------------------------------------------------------------------- */
  /*  FOLDER DROPDOWN (RECORD FORM)                                          */
  /* ----------------------------------------------------------------------- */

  static _collectFolderOptions(node, depth, options) {
    const indent = "— ".repeat(depth);
    options.push({
      id: node.folder.id,
      label: `${indent}${node.folder.name}`,
    });
    node.children.forEach((child) => {
      this._collectFolderOptions(child, depth + 1, options);
    });
  }

  static _populateFolderSelect(selectedFolderId = null) {
    const $select = $("#dg-record-folder");
    if (!$select.length) return;

    const root = this._getPcRecordsRoot();
    if (!root) {
      $select
        .empty()
        .append($("<option>").val("").text("PC Records (no folders)"));
      return;
    }

    const treeRoot = this._buildFolderTree(root);
    const options = [];
    this._collectFolderOptions(treeRoot, 0, options);

    $select.empty();
    options.forEach((opt) => {
      const $opt = $("<option>").val(opt.id).text(opt.label);
      if (selectedFolderId && selectedFolderId === opt.id) {
        $opt.prop("selected", true);
      }
      $select.append($opt);
    });

    if (!selectedFolderId) {
      $select.val(root.id);
    }
  }

  static _populateVehicleFolderSelect(selectedFolderId = null) {
    const $select = $("#dg-vehicle-folder");
    if (!$select.length) return;

    const root = this._getPcRecordsRoot();
    if (!root) {
      $select
        .empty()
        .append($("<option>").val("").text("PC Records (no folders)"));
      return;
    }

    const treeRoot = this._buildFolderTree(root);
    const options = [];
    this._collectFolderOptions(treeRoot, 0, options);

    $select.empty();
    options.forEach((opt) => {
      const $opt = $("<option>").val(opt.id).text(opt.label);
      if (selectedFolderId && selectedFolderId === opt.id) {
        $opt.prop("selected", true);
      }
      $select.append($opt);
    });

    if (!selectedFolderId) {
      $select.val(root.id);
    }
  }

  /* ----------------------------------------------------------------------- */
  /*  PERMISSIONS                                                            */
  /* ----------------------------------------------------------------------- */

  static async ensureRecordsPermissions() {
    console.log("Delta Green UI | Ensuring record permissions");
    const folderIds = this._getPcRecordsFolderIds();
    if (folderIds.size === 0) return;

    const records = game.actors.filter(
      (a) => a.folder && folderIds.has(a.folder.id)
    );
    for (const record of records) {
      await this.ensureActorPermissions(record);
    }
  }

  static async ensureActorPermissions(actor) {
    if (!actor) return;
    if (actor.permission?.default === 3) return; // already OWNER
    await actor.update({ permission: { default: 3 } });
  }

  /* ----------------------------------------------------------------------- */
  /*  LOADING & DISPLAY                                                      */
  /* ----------------------------------------------------------------------- */

  static loadRecords() {
    const rootFolder = this._getPcRecordsRoot();
    const list = $("#dg-all-records-list");
    if (!list.length) return;

    list.empty();

    if (!rootFolder) {
      list.append("<li>NO PC RECORDS FOLDER</li>");
      return;
    }

    const treeRoot = this._buildFolderTree(rootFolder);
    this.displayFolderTree(treeRoot);
  }

  static displayFolderTree(treeRoot) {
    const allRecordsList = $("#dg-all-records-list");
    allRecordsList.empty();

    if (!treeRoot) {
      allRecordsList.append("<li>NO RECORDS FOUND</li>");
      return;
    }

    const hasActorsInRoot = treeRoot.actors && treeRoot.actors.length > 0;
    const hasChildFolders = treeRoot.children && treeRoot.children.length > 0;

    if (hasActorsInRoot) {
      treeRoot.actors.forEach((record) => {
        const reference =
          record.getFlag(DeltaGreenUI.ID, "reference") ||
          record.getFlag(DeltaGreenUI.ID, "surname") ||
          "";
        const firstName = record.getFlag(DeltaGreenUI.ID, "firstName") || "";
        const lastName = record.getFlag(DeltaGreenUI.ID, "middleName") || "";

        let displayText;
        if (!firstName && !lastName && !reference) {
          displayText = record.name;
        } else if (!reference) {
          displayText = `${firstName} ${lastName}`.trim();
        } else {
          displayText = `${firstName} ${lastName} - ${reference}`.trim();
        }

        const li = $(
          `<li class="dg-result-item" data-record-id="${record.id}">
            ${displayText}
          </li>`
        );

        li.on("contextmenu", function (e) {
          e.preventDefault();
          const recordId = $(this).data("record-id");
          RecordsManager.deleteRecord(recordId);
        });

        li.on("click", function () {
          const recordId = $(this).data("record-id");
          RecordsManager.openRecord(recordId);
        });

        allRecordsList.append(li);
      });
    }

    if (hasChildFolders) {
      treeRoot.children.forEach((childNode) => {
        this._renderFolderNode(childNode, allRecordsList);
      });
    }

    if (!hasActorsInRoot && !hasChildFolders) {
      allRecordsList.append("<li>NO RECORDS FOUND</li>");
    }
  }

  static _renderFolderNode(node, container) {
    const RM = this;

    const li = $(
      `<li class="dg-folder-node" data-folder-id="${node.folder.id}">
        <div class="dg-folder-header">
          <span class="dg-folder-toggle">[-]</span>
          <span class="dg-folder-name">${node.folder.name}</span>
        </div>
        <ul class="dg-folder-contents"></ul>
      </li>`
    );

    container.append(li);

    const contents = li.children(".dg-folder-contents");

    node.actors.forEach((record) => {
      const reference =
        record.getFlag(DeltaGreenUI.ID, "reference") ||
        record.getFlag(DeltaGreenUI.ID, "surname") ||
        "";
      const firstName = record.getFlag(DeltaGreenUI.ID, "firstName") || "";
      const lastName = record.getFlag(DeltaGreenUI.ID, "middleName") || "";

      let displayText;
      if (!firstName && !lastName && !reference) {
        displayText = record.name;
      } else if (!reference) {
        displayText = `${firstName} ${lastName}`.trim();
      } else {
        displayText = `${firstName} ${lastName} - ${reference}`.trim();
      }

      const actorLi = $(
        `<li class="dg-result-item" data-record-id="${record.id}">
          ${displayText}
        </li>`
      );

      actorLi.on("contextmenu", function (e) {
        e.preventDefault();
        const recordId = $(this).data("record-id");
        RecordsManager.deleteRecord(recordId);
      });

      actorLi.on("click", function () {
        const recordId = $(this).data("record-id");
        RecordsManager.openRecord(recordId);
      });

      contents.append(actorLi);
    });

    node.children.forEach((childNode) => {
      RM._renderFolderNode(childNode, contents);
    });

    const folderId = node.folder.id;

    let isCollapsed = !!RM.folderCollapseState[folderId];
    if (RM.folderCollapseState[folderId] === undefined) {
      isCollapsed = true; // default: collapsed on first render
    }

    const $toggle = li.find(".dg-folder-toggle");

    if (isCollapsed) {
      contents.hide();
      $toggle.text("[+]");
    } else {
      contents.show();
      $toggle.text("[-]");
    }

    li.children(".dg-folder-header").on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const $header = $(this);
      const $node = $header.closest("li.dg-folder-node");
      const $contents = $node.children(".dg-folder-contents");
      const $toggle = $header.find(".dg-folder-toggle");
      const id = $node.data("folder-id");

      const currentlyVisible = $contents.is(":visible");
      const nowVisible = !currentlyVisible;

      $contents.toggle(nowVisible);
      $toggle.text(nowVisible ? "[-]" : "[+]");

      if (!nowVisible) {
        RM.folderCollapseState[id] = true;
      } else {
        delete RM.folderCollapseState[id];
      }
    });

    li.on("contextmenu", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const folderId = $(this).data("folder-id");
      RecordsManager.deleteFolder(folderId);
    });
  }

  static displayAllRecords(records = null) {
    if (!records) {
      const folderIds = this._getPcRecordsFolderIds();
      if (folderIds.size === 0) return;
      records = game.actors.filter(
        (a) => a.folder && folderIds.has(a.folder.id)
      );
    }

    const allRecordsList = $("#dg-all-records-list");
    allRecordsList.empty();

    if (!records.length) {
      allRecordsList.append("<li>NO RECORDS FOUND</li>");
      return;
    }

    records.forEach((record) => {
      const reference =
        record.getFlag(DeltaGreenUI.ID, "reference") ||
        record.getFlag(DeltaGreenUI.ID, "surname") ||
        "";
      const firstName = record.getFlag(DeltaGreenUI.ID, "firstName") || "";
      const lastName = record.getFlag(DeltaGreenUI.ID, "middleName") || "";

      let displayText;
      if (!firstName && !lastName && !reference) {
        displayText = record.name;
      } else if (!reference) {
        displayText = `${firstName} ${lastName}`.trim();
      } else {
        displayText = `${firstName} ${lastName} - ${reference}`.trim();
      }

      const li = $(
        `<li class="dg-result-item" data-record-id="${record.id}">
          ${displayText}
        </li>`
      );

      li.on("contextmenu", function (e) {
        e.preventDefault();
        const recordId = $(this).data("record-id");
        RecordsManager.deleteRecord(recordId);
      });

      li.on("click", function () {
        const recordId = $(this).data("record-id");
        RecordsManager.openRecord(recordId);
      });

      allRecordsList.append(li);
    });
  }

  static searchRecords(searchTerm) {
    const folderIds = this._getPcRecordsFolderIds();
    if (folderIds.size === 0) return;

    if (!searchTerm) {
      this.loadRecords();
      return;
    }

    const searchLower = searchTerm.toLowerCase();

    const records = game.actors.filter((a) => {
      if (!a.folder || !folderIds.has(a.folder.id)) return false;

      const name = a.name.toLowerCase();
      const surname = (
        a.getFlag(DeltaGreenUI.ID, "surname") || ""
      ).toLowerCase();
      const firstName = (
        a.getFlag(DeltaGreenUI.ID, "firstName") || ""
      ).toLowerCase();
      const reference = (
        a.getFlag(DeltaGreenUI.ID, "reference") || ""
      ).toLowerCase();

      return (
        name.includes(searchLower) ||
        surname.includes(searchLower) ||
        firstName.includes(searchLower) ||
        reference.includes(searchLower)
      );
    });

    this.displayAllRecords(records);
  }

  /* ----------------------------------------------------------------------- */
  /*  RECORD FORM (HUMAN / CASE STUDY)                                       */
  /* ----------------------------------------------------------------------- */

  static showCaseStudyForm(actor) {
    if (!actor) return;

    const $humanForm = $("#dg-case-study-form");

    // Make sure we ONLY ever have ONE Unnatural block in this form.
    const $primaryUnnatural = $("#dg-unnatural-section");
    $humanForm.find(".dg-unnatural-section").not($primaryUnnatural).remove();

    // HARD RESET HUMAN FORM
    $humanForm.find("input.dg-form-input").val("");
    $humanForm.find("textarea.dg-form-textarea").val("");
    $("#dg-sex").val("M");
    $("#dg-profile-avatar").attr("src", "icons/svg/mystery-man.svg");
    $("#dg-case-number").text("");
    $("#dg-case-agent-stats").empty().hide();
    if ($primaryUnnatural.length) $primaryUnnatural.hide();

    // Clear Unnatural textareas if present
    if ($("#dg-unnatural-form").length) $("#dg-unnatural-form").val("");
    if ($("#dg-unnatural-origin").length) $("#dg-unnatural-origin").val("");
    if ($("#dg-unnatural-powers").length) $("#dg-unnatural-powers").val("");

    // Vehicles route elsewhere
    const isVehicle =
      actor.type === "vehicle" ||
      actor.system?.category === "vehicle" ||
      actor.getFlag(DeltaGreenUI.ID, "isVehicle") === true;

    if (isVehicle) {
      this.showVehicleForm(actor);
      return;
    }

    // Normal (human / agent / npc / unnatural npc)
    this.currentRecordId = actor.id;

    // Show human form, hide vehicle
    $("#dg-vehicle-form").hide();
    $humanForm.show().scrollTop(0);

    // Populate fields from flags
    $("#dg-case-number").text(
      actor.getFlag(DeltaGreenUI.ID, "caseNumber") || ""
    );
    $("#dg-firstname").val(actor.getFlag(DeltaGreenUI.ID, "firstName") || "");
    $("#dg-middlename").val(
      actor.getFlag(DeltaGreenUI.ID, "middleName") || ""
    );
    $("#dg-features").val(actor.getFlag(DeltaGreenUI.ID, "features") || "");
    $("#dg-address").val(actor.getFlag(DeltaGreenUI.ID, "address") || "");
    $("#dg-zipcode").val(actor.getFlag(DeltaGreenUI.ID, "zipCode") || "");
    $("#dg-dob").val(actor.getFlag(DeltaGreenUI.ID, "dateOfBirth") || "");
    $("#dg-sex").val(actor.getFlag(DeltaGreenUI.ID, "sex") || "M");
    $("#dg-race").val(actor.getFlag(DeltaGreenUI.ID, "race") || "");
    $("#dg-height").val(actor.getFlag(DeltaGreenUI.ID, "height") || "");
    $("#dg-weight").val(actor.getFlag(DeltaGreenUI.ID, "weight") || "");
    $("#dg-haircolor").val(actor.getFlag(DeltaGreenUI.ID, "hairColor") || "");
    $("#dg-eyecolor").val(actor.getFlag(DeltaGreenUI.ID, "eyeColor") || "");
    $("#dg-relationship").val(
      actor.getFlag(DeltaGreenUI.ID, "relationshipStatus") || ""
    );
    $("#dg-notes").val(actor.getFlag(DeltaGreenUI.ID, "notes") || "");
    $("#dg-reference").val(
      actor.getFlag(DeltaGreenUI.ID, "reference") ||
        actor.getFlag(DeltaGreenUI.ID, "surname") ||
        ""
    );

    // Unnatural-specific flag OR true Unnatural actor type
    const isUnnatural =
      actor.type === "unnatural" ||
      actor.getFlag(DeltaGreenUI.ID, "isUnnaturalNpc") === true;

    // THEME SWITCH: Human vs Unnatural view
    $humanForm.toggleClass("dg-unnatural-view", isUnnatural);

    if (isUnnatural) {
      // Hide human-only rows and relabel fields
      $humanForm.find(".dg-human-only").hide();

      $("#dg-label-firstname").text("Entity ID");
      $("#dg-label-reference").text("Known Name");
      $("#dg-label-middlename").text("Date Observed");
      $("#dg-label-address").text("Location Observed");
      $("#dg-label-zipcode").text("Active Cults");
      $("#dg-label-features").text("Classification");
      $("#dg-label-relationship").text("Threat Level");
    } else {
      // Normal human / agent / npc
      $humanForm.find(".dg-human-only").show();

      $("#dg-label-reference").text("Occupation");
      $("#dg-label-firstname").text("First Name");
      $("#dg-label-middlename").text("Last Name");
      $("#dg-label-address").text("Address");
      $("#dg-label-zipcode").text("City, State");
      $("#dg-label-features").text("Distinguishing Features");
      $("#dg-label-relationship").text("Relationship Status");
    }

    if ($primaryUnnatural.length) {
      $primaryUnnatural.toggle(isUnnatural);
    }

    // Avatar & folder
    const imgSrc = actor.img || "icons/svg/mystery-man.svg";
    $("#dg-profile-avatar").attr("src", imgSrc);
    this._populateFolderSelect(actor.folder?.id || null);
    this._setupAvatarButton();

    // Stats container always lives in the header
    const $header = $humanForm.find(".dg-profile-header");
    if ($header.length) $("#dg-case-agent-stats").appendTo($header);

    // NPC vs Agent layout: treat unnatural as NPC layout
    const isNpc = actor.type === "npc" || actor.type === "unnatural";
    const isAgent = actor.type === "agent";

    $humanForm.toggleClass("dg-npc-view", isNpc);

    if (isAgent) {
      this._updateAgentStatsPanel(actor);
    } else {
      $("#dg-case-agent-stats").empty().hide();
    }

    // NEW: Ensure FULL REPORT button exists and styled like SAVE
    const $saveBtn = $("#dg-save-record");
    if ($saveBtn.length && !$("#dg-full-report-btn").length) {
      const saveClasses = $saveBtn.attr("class") || "";
      const $fullBtn = $(`
        <button id="dg-full-report-btn"
                type="button"
                class="${saveClasses}">
          FULL REPORT
        </button>
      `);
      $saveBtn.after($fullBtn);
    }
  }

  static _buildAgentStatsBlock(actor) {
    const system = actor.system || {};
    const stats = system.statistics || {};
    const skillsObj = system.skills || {};
    const typedObj = system.typedSkills || {};

    // Helper: figure out the final % for any skill object
    const guessPct = (sk) => {
      if (!sk || typeof sk !== "object") return 0;

      // Prefer explicit "targetProficiency" if present
      if (typeof sk.targetProficiency === "number") {
        return sk.targetProficiency;
      }

      // Then normal "proficiency"
      if (typeof sk.proficiency === "number") {
        return sk.proficiency;
      }

      // Fallback: pick the largest numeric field on the skill
      const nums = Object.values(sk).filter(
        (v) => typeof v === "number" && !Number.isNaN(v)
      );
      if (!nums.length) return 0;
      return Math.max(...nums);
    };

    // CORE STATS: STR/CON/DEX/INT/POW/CHA line
    const coreDefs = [
      { key: "str", label: "STR" },
      { key: "con", label: "CON" },
      { key: "dex", label: "DEX" },
      { key: "int", label: "INT" },
      { key: "pow", label: "POW" },
      { key: "cha", label: "CHA" },
    ];

    const coreStatsHtml = coreDefs
      .map(({ key, label }) => {
        const s = stats[key] || {};
        const val = Number(s.value ?? 0) || 0;
        const x5 = Number(s.x5 ?? val * 5) || 0;
        return `
          <span class="dg-core"
                data-skill-label="${label}"
                data-skill-target="${x5}"
                title="Roll ${label} ×5 (${x5}%)">
            ${label} ${val} (${x5})
          </span>
        `;
      })
      .join("");

    // BASE / REGULAR SKILLS
    const baseSkills = Object.values(skillsObj)
      .map((s) => {
        const label = s?.label || s?.name || "";
        const pct = guessPct(s);
        return { label, pct };
      })
      .filter((s) => s.label && s.pct > 30);

    // TYPED / SPECIAL TRAINING SKILLS
    const typedEntries = Array.isArray(typedObj)
      ? typedObj
      : Object.values(typedObj || {});

    const typedSkills = typedEntries
      .map((ts) => {
        const group = ts?.group || "";
        const base = ts?.label || ts?.name || "";
        const label = group && base ? `${group}: ${base}` : group || base;
        const pct = guessPct(ts);
        return { label, pct };
      })
      .filter((s) => s.label && s.pct > 30);

    // MERGE & SORT
    const allSkills = [...baseSkills, ...typedSkills].sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
    );

    const skillsHtml = allSkills.length
      ? allSkills
          .map(
            (s) => `
          <span class="dg-skill"
                data-skill-label="${s.label}"
                data-skill-target="${s.pct}">
            ${s.label} <span class="dg-skill-val">${s.pct}%</span>
          </span>
        `
          )
          .join("")
      : `<span class="dg-placeholder">No skills above 30% recorded.</span>`;

    return `
      <div class="dg-agent-stats-block" id="dg-stats-line" aria-label="Stats">
        <div class="dg-agent-stats-line dg-core-line">
          ${coreStatsHtml}
        </div>
        <div class="dg-agent-skills-list" id="dg-skill-line" aria-label="Skills">
          ${skillsHtml}
        </div>
      </div>
    `;
  }

  static _updateAgentStatsPanel(actor) {
    const el = document.getElementById("dg-case-agent-stats");
    if (!el) return;

    if (actor.type !== "agent") {
      el.style.display = "none";
      el.innerHTML = "";
      return;
    }

    el.innerHTML = this._buildAgentStatsBlock(actor);
    el.style.display = "block";
  }

  /* ----------------------------------------------------------------------- */
  /*  AVATARS                                                                */
  /* ----------------------------------------------------------------------- */

  static _setupAvatarButton() {
    $("#dg-change-avatar").off("click");

    $("#dg-change-avatar").on("click", async (event) => {
      event.preventDefault();

      let currentImage = "icons/svg/mystery-man.svg";

      if (this.currentRecordId) {
        const actor = game.actors.get(this.currentRecordId);
        if (actor) currentImage = actor.img || "icons/svg/mystery-man.svg";
      } else if (this.tempAvatarPath) {
        currentImage = this.tempAvatarPath;
      }

      const fp = new FilePicker({
        type: "image",
        current: currentImage,
        callback: async (path) => {
          $("#dg-profile-avatar").attr("src", path);

          if (this.currentRecordId) {
            const actor = game.actors.get(this.currentRecordId);
            if (actor) {
              await actor.update({ img: path });
              ui.notifications.info("Image updated successfully");
            }
          } else {
            this.tempAvatarPath = path;
            ui.notifications.info(
              "Image selected. It will be applied when the record is saved."
            );
          }
        },
        title: "Select an image",
      });

      fp.render(true);
    });
  }

  static _setupVehicleAvatarButton() {
    $("#dg-vehicle-change-avatar").off("click");

    $("#dg-vehicle-change-avatar").on("click", async (event) => {
      event.preventDefault();

      const vehicleActorId =
        $("#dg-vehicle-form").data("vehicleActorId") || this.currentRecordId;
      const actor = game.actors.get(vehicleActorId);
      if (!actor) return;

      let currentImage = actor.img || "icons/svg/mystery-man.svg";

      const fp = new FilePicker({
        type: "image",
        current: currentImage,
        callback: async (path) => {
          $("#dg-vehicle-avatar").attr("src", path);
          await actor.update({ img: path });
          ui.notifications.info("Vehicle image updated");
        },
        title: "Select vehicle image",
      });

      fp.render(true);
    });
  }

  static hideRecordForm() {
    $("#dg-case-study-form").hide();
    $("#dg-vehicle-form").hide();
    $("#dg-case-agent-stats").empty().hide();
    this.currentRecordId = null;
  }

  static async saveRecord() {
    if (this.isSaving) {
      console.warn(
        "Delta Green UI | saveRecord called while already saving, ignoring"
      );
      return;
    }
    this.isSaving = true;

    const caseNumber = $("#dg-case-number").text();
    const firstName = ($("#dg-firstname").val() || "").trim();
    const lastName = ($("#dg-middlename").val() || "").trim();
    const referenceText =
      ($("#dg-reference").val() || "").trim() || "UNASSIGNED";

    // Determine if this is an Unnatural record (existing actor)
    let isUnnatural = false;
    if (this.currentRecordId) {
      const existing = game.actors.get(this.currentRecordId);
      if (existing) {
        isUnnatural =
          existing.type === "unnatural" ||
          existing.getFlag(DeltaGreenUI.ID, "isUnnaturalNpc") === true;
      }
    }

    // Validation:
    // - Always require a first name / Entity ID
    // - Last name only required if NOT Unnatural
    if (!firstName || (!lastName && !isUnnatural)) {
      ui.notifications.error(
        isUnnatural
          ? "A Known Name is required."
          : "First and last name are required."
      );
      this.isSaving = false;
      return;
    }

    const rootFolder = await this._getOrCreatePcRecordsRoot();

    const selectedFolderId = $("#dg-record-folder").val();
    const targetFolderId = selectedFolderId || rootFolder.id;

    const recordData = {
      caseNumber,
      reference: referenceText,
      surname: referenceText,
      firstName,
      middleName: lastName,
      address: $("#dg-address").val(),
      zipCode: $("#dg-zipcode").val(),
      features: $("#dg-features").val(),
      dateOfBirth: $("#dg-dob").val(),
      sex: $("#dg-sex").val(),
      race: $("#dg-race").val(),
      height: $("#dg-height").val(),
      weight: $("#dg-weight").val(),
      hairColor: $("#dg-haircolor").val(),
      eyeColor: $("#dg-eyecolor").val(),
      relationshipStatus: $("#dg-relationship").val(),
      notes: $("#dg-notes").val(),
    };

    // Add Unnatural fields only if those inputs exist (matching HTML IDs)
    if ($("#dg-unnatural-form").length) {
      recordData.unnaturalForm = $("#dg-unnatural-form").val();
    }
    if ($("#dg-unnatural-origin").length) {
      recordData.unnaturalOrigin = $("#dg-unnatural-origin").val();
    }
    if ($("#dg-unnatural-powers").length) {
      recordData.unnaturalPowers = $("#dg-unnatural-powers").val();
    }

    // Build display name; allow blank lastName for Unnatural
    const nameCore = lastName ? `${firstName} ${lastName}` : firstName;
    const displayName = `Case ${caseNumber}: ${nameCore} - ${referenceText}`;

    try {
      let recordDoc = null;

      if (this.currentRecordId) {
        // UPDATE EXISTING RECORD
        const record = game.actors.get(this.currentRecordId);
        if (record) {
          const updateData = { name: displayName };

          if (record.folder?.id !== targetFolderId) {
            updateData.folder = targetFolderId;
          }

          await record.update(updateData);

          for (const [key, value] of Object.entries(recordData)) {
            await record.setFlag(DeltaGreenUI.ID, key, value);
          }

          recordDoc = record;
        }
      } else {
        // CREATE NEW RECORD (these are generic NPC records; Unnatural ones should
        // normally be created via createUnnaturalNpcRecordAndOpen)
        const actorData = {
          name: displayName,
          type: "npc",
          folder: targetFolderId,
          permission: { default: 3 },
        };

        if (this.tempAvatarPath) {
          actorData.img = this.tempAvatarPath;
        }

        const record = await Actor.create(actorData);
        this.tempAvatarPath = null;

        for (const [key, value] of Object.entries(recordData)) {
          await record.setFlag(DeltaGreenUI.ID, key, value);
        }

        recordDoc = record;
        this.currentRecordId = record.id;
      }

      // 🔹 Mark as recently viewed & refresh LAST ENTRIES
      if (recordDoc) {
        try {
          await recordDoc.setFlag(DeltaGreenUI.ID, "lastViewed", Date.now());
        } catch (err) {
          console.error("Delta Green UI | Error setting lastViewed on save", err);
        }

        try {
          if (
            DeltaGreenUI?.isInterfaceActive &&
            DeltaGreenUI.isInterfaceActive()
          ) {
            if (DeltaGreenUI.loadLastEntries) {
              DeltaGreenUI.loadLastEntries();
            }
            if (DeltaGreenUI.forceDisplayLastEntries) {
              DeltaGreenUI.forceDisplayLastEntries();
            }
          }
        } catch (err) {
          console.error(
            "Delta Green UI | Error refreshing last entries after save",
            err
          );
        }
      }

      ui.notifications.info("Record saved successfully");
      this.hideRecordForm();
      this.loadRecords();
    } catch (error) {
      console.error("Error saving record:", error);
      ui.notifications.error("Error saving record");
    } finally {
      this.isSaving = false;
    }
  }

  static async openRecord(recordId) {
    if (!recordId) return;
    const actor = game.actors.get(recordId);
    if (!actor) return;

    this.currentRecordId = actor.id;

    // 🔹 Mark as recently viewed
    try {
      await actor.setFlag(DeltaGreenUI.ID, "lastViewed", Date.now());
    } catch (err) {
      console.error("Delta Green UI | Error setting lastViewed on open", err);
    }

    // 🔹 Ask the main UI to refresh LAST ENTRIES, if it's active
    try {
      if (
        DeltaGreenUI?.isInterfaceActive &&
        DeltaGreenUI.isInterfaceActive()
      ) {
        if (DeltaGreenUI.loadLastEntries) {
          DeltaGreenUI.loadLastEntries();
        }
        if (DeltaGreenUI.forceDisplayLastEntries) {
          DeltaGreenUI.forceDisplayLastEntries();
        }
      }
    } catch (err) {
      console.error(
        "Delta Green UI | Error refreshing last entries from openRecord",
        err
      );
    }

    this.showCaseStudyForm(actor);
  }

  static async deleteRecord(recordId) {
    if (!recordId) return;

    const confirmed = await new Promise((resolve) => {
      const d = new Dialog({
        title: "Delete Confirmation",
        content:
          "Are you sure you want to delete this record? This action cannot be undone.",
        buttons: {
          yes: {
            icon: '<i class="fas fa-check"></i>',
            label: "Yes",
            callback: () => resolve(true),
          },
          no: {
            icon: '<i class="fas fa-times"></i>',
            label: "No",
            callback: () => resolve(false),
          },
        },
        default: "no",
        render: (html) => {
          const $app = $(html).closest(".app");
          $app.css("z-index", "10000");
          $app.css("background-color", "#1a1a1a");
          $app.css("border", "2px solid #ffb000");
          $app.css("color", "#ffb000");
          $(html)
            .find(".dialog-buttons button")
            .css("background-color", "#ffb000")
            .css("color", "#1a1a1a");
        },
      });
      d.render(true);
    });

    if (!confirmed) return;

    const record = game.actors.get(recordId);
    if (record) {
      await record.delete();
      ui.notifications.info("Record deleted successfully");
      this.loadRecords();
    }
  }
}
