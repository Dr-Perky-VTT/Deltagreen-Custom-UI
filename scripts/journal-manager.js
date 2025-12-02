// journal-manager.js
import { DeltaGreenUI } from "./delta-green-ui.js";

export class JournalManager {
  static currentJournalId = null;
  static _isCreating = false;

  /* ------------------------------------------------------------------ */
  /* INIT & HOOKS                                                       */
  /* ------------------------------------------------------------------ */

  static init() {
    console.log("Delta Green UI | JournalManager init");

    // Create from CRT (make sure we only bind once)
    $(document)
      .off("click", "#dg-create-journal-btn")
      .on("click", "#dg-create-journal-btn", async (ev) => {
        ev.preventDefault();
        await this.createNewJournalInCrt();
      });

    // Close CRT journal popup
    $(document)
      .off("click", "#dg-journal-close")
      .on("click", "#dg-journal-close", (ev) => {
        ev.preventDefault();
        $("#dg-journal-window").hide();
      });

    // Click image in CRT journal -> popout / browser
    $(document)
      .off("click", ".dg-journal-thumb")
      .on("click", ".dg-journal-thumb", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        const src = this.dataset.fullSrc || this.src;

        if (window.ImagePopout) {
          new ImagePopout(src, { shareable: true, editable: false }).render(true);
        } else {
          window.open(src, "_blank");
        }
      });

    // Edit button in CRT -> open Foundry journal sheet
    $(document)
      .off("click", "#dg-journal-edit")
      .on("click", "#dg-journal-edit", (ev) => {
        ev.preventDefault();
        const id = JournalManager.currentJournalId;
        if (!id) return;

        const journal = game.journal.get(id);
        if (!journal) return;

        if (
          !journal.testUserPermission(
            game.user,
            CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
          )
        ) {
          ui.notifications.warn("You don't have permission to edit this journal.");
          return;
        }

        journal.sheet.render(true);
      });

    // Accordion: toggle page body (CRT journal window)
    $(document)
      .off("click", ".dg-journal-page-header")
      .on("click", ".dg-journal-page-header", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        const $page = $(this).closest(".dg-journal-page");
        const $body = $page.children(".dg-journal-page-body");
        $body.slideToggle(150);
      });

    // OPEN PDF button in CRT -> open native PDF page sheet
    $(document)
      .off("click", ".dg-open-pdf")
      .on("click", ".dg-open-pdf", async function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        const journalId = this.dataset.journalId;
        const pageId = this.dataset.pageId;
        if (!journalId || !pageId) return;

        const journal = game.journal.get(journalId);
        if (!journal?.pages) return;

        const page = journal.pages.get(pageId);
        if (!page) return;

        try {
          const canView = page.testUserPermission(
            game.user,
            CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
          );
          if (!canView) {
            ui.notifications.warn("You don't have permission to view this PDF.");
            return;
          }

          page.sheet.render(true);
        } catch (err) {
          console.error("Delta Green UI | Error opening PDF page sheet", err);
          ui.notifications.error("Error opening PDF.");
        }
      });

    // OPEN VIDEO button in CRT -> open native video page sheet
    $(document)
      .off("click", ".dg-open-video")
      .on("click", ".dg-open-video", async function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        const journalId = this.dataset.journalId;
        const pageId = this.dataset.pageId;
        if (!journalId || !pageId) return;

        const journal = game.journal.get(journalId);
        if (!journal?.pages) return;

        const page = journal.pages.get(pageId);
        if (!page) return;

        try {
          const canView = page.testUserPermission(
            game.user,
            CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
          );
          if (!canView) {
            ui.notifications.warn("You don't have permission to view this video.");
            return;
          }

          page.sheet.render(true);
        } catch (err) {
          console.error("Delta Green UI | Error opening video page sheet", err);
          ui.notifications.error("Error opening video.");
        }
      });

    // Right-click delete on journal list items in the CRT
    $(document)
      .off("contextmenu", "#dg-journals-list li, #dg-journals-list .dg-result-item")
      .on(
        "contextmenu",
        "#dg-journals-list li, #dg-journals-list .dg-result-item",
        async function (ev) {
          ev.preventDefault();
          const $li = $(this);
          let journalId = $li.data("journal-id");
          let journal = journalId ? game.journal.get(journalId) : null;

          // Fallback: resolve by name if no data-journal-id
          if (!journal) {
            const name = $li.text().trim();
            journal = game.journal.find((j) => j.name === name);
          }

          if (!journal) {
            ui.notifications.warn("Could not determine which journal to delete.");
            return;
          }

          await JournalManager.deleteJournal(journal.id);
        }
      );

    // Track last opened journal entries (normal Foundry sheet)
    Hooks.on("renderJournalSheet", async (app, html, data) => {
      const entry = app.object; // v10/v11 JournalEntry
      if (!entry) return;

      try {
        await entry.setFlag(DeltaGreenUI.ID, "lastViewed", Date.now());
      } catch (err) {
        console.error("Delta Green UI | Error setting journal lastViewed", err);
      }

      // Refresh "LAST JOURNAL ENTRIES" panel if CRT is active
      try {
        if (DeltaGreenUI?.isInterfaceActive && DeltaGreenUI.isInterfaceActive()) {
          if (DeltaGreenUI.loadLastJournals) {
            DeltaGreenUI.loadLastJournals();
          }
          if (DeltaGreenUI.forceDisplayLastJournals) {
            DeltaGreenUI.forceDisplayLastJournals();
          }
        }
      } catch (err) {
        console.error(
          "Delta Green UI | Error refreshing recent journals panel",
          err
        );
      }
    });

    /* ------------------------------------------------------------------ */
    /* NEW: JOURNAL SEARCH WIRING                                         */
    /* ------------------------------------------------------------------ */

    // Click search button
    $(document)
      .off("click", "#dg-journal-search-btn")
      .on("click", "#dg-journal-search-btn", (ev) => {
        ev.preventDefault();
        const term = String($("#dg-journal-search-input").val() || "").trim();
        JournalManager.searchJournals(term);
      });

    // Enter/Escape in search input
    $(document)
      .off("keydown", "#dg-journal-search-input")
      .on("keydown", "#dg-journal-search-input", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          const term = String($(ev.currentTarget).val() || "").trim();
          JournalManager.searchJournals(term);
        } else if (ev.key === "Escape") {
          $(ev.currentTarget).val("");
          JournalManager.searchJournals("");
        }
      });
  }

  /* ------------------------------------------------------------------ */
  /* FOLDER HELPERS                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Ensure there is an "Agent Files" folder for journals and return it.
   */
  static async _getOrCreateAgentFilesFolder() {
    let folder =
      game.folders.find(
        (f) => f.type === "JournalEntry" && f.name === "[Agent Files] M-Cell"
      ) || null;

    if (!folder) {
      folder = await Folder.create({
        name: "[Agent Files] M-Cell",
        type: "JournalEntry"
      });
    }

    return folder;
  }

  /**
   * NEW: Build full folder path for a journal ("Root / Sub / SubSub")
   */
  static _buildFolderPath(journal) {
    if (!journal || !journal.folder) return "";
    const parts = [];
    let folder = journal.folder;
    while (folder) {
      if (folder.name) parts.unshift(folder.name);
      folder = folder.folder;
    }
    return parts.join(" / ");
  }

  /* ------------------------------------------------------------------ */
  /* PAGE / CONTENT HELPERS                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Enrich HTML so @UUID[...] links, inline rolls, etc. work.
   */
  static async _enrich(content, journal) {
    if (!content) return "";

    // v13+ TextEditor lives under foundry.applications.ux.TextEditor.implementation
    const TextEditorImpl =
      foundry?.applications?.ux?.TextEditor?.implementation ?? TextEditor;

    try {
      const enriched = await TextEditorImpl.enrichHTML(content, {
        async: true,
        secrets: false,
        entities: true,
        relativeTo: journal
      });
      return enriched;
    } catch (err) {
      console.error("Delta Green UI | Error enriching journal HTML:", err);
      return content;
    }
  }

  static _getImageSrcFromPage(page, journal) {
    return (
      page?.src ||
      page?.image?.src ||
      page?.image?.url ||
      page?.image ||
      page?.data?.src ||
      page?.data?.img ||
      page?.img ||
      journal?.img ||
      ""
    );
  }

  static _getPageTitle(page, index) {
    return (
      page?.name ||
      page?.title ||
      page?.text?.string ||
      page?.text?.content?.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i)?.[1] ||
      `Page ${index + 1}`
    );
  }

  /**
   * Build HTML for the content of a single page (text, image, pdf, video)
   */
  static async _buildPageBodyHtml(page, journal) {
    // TEXT PAGE
    if (page.type === "text") {
      const raw =
        page.text?.content || "<p><em>No text on this page.</em></p>";
      const html = await this._enrich(raw, journal);
      return `
        <div class="dg-journal-page-text">
          ${html}
        </div>
      `;
    }

    // IMAGE PAGE
    if (page.type === "image") {
      const src = this._getImageSrcFromPage(page, journal);
      const captionRaw = page.text?.content || "";
      const caption = captionRaw ? await this._enrich(captionRaw, journal) : "";
      if (!src) {
        return `<p><em>Image missing or not set.</em></p>`;
      }
      return `
        <div class="dg-journal-image-wrapper">
          <img
            class="dg-journal-thumb dg-journal-main-thumb"
            src="${src}"
            data-full-src="${src}"
            alt="${journal.name || "Journal Image"}"
          >
          ${
            caption
              ? `<div class="dg-journal-caption">${caption}</div>`
              : ""
          }
        </div>
      `;
    }

    // PDF PAGE
    if (page.type === "pdf") {
      const displayName =
        page.name ||
        page.title ||
        "PDF Document";

      const src =
        page.src ||
        page?.pdf?.src ||
        page?.data?.src ||
        "";

      const srcLabel = src
        ? `<div class="dg-journal-pdf-src">${src}</div>`
        : "";

      return `
        <div class="dg-journal-pdf-wrapper">
          <div class="dg-journal-pdf-info">
            <span class="dg-journal-pdf-icon"><i class="fas fa-file-pdf"></i></span>
            <span class="dg-journal-pdf-name">${displayName}</span>
          </div>
          ${srcLabel}
          <button
            class="dg-open-pdf"
            data-journal-id="${journal.id}"
            data-page-id="${page.id}"
          >
            OPEN PDF
          </button>
        </div>
      `;
    }

    // VIDEO PAGE
    if (page.type === "video") {
      const displayName =
        page.name ||
        page.title ||
        "Video";

      const src =
        page.src ||
        page?.video?.src ||
        page?.data?.src ||
        page?.data?.video ||
        "";

      const srcLabel = src
        ? `<div class="dg-journal-video-src">${src}</div>`
        : "";

      return `
        <div class="dg-journal-video-wrapper">
          <div class="dg-journal-video-info">
            <span class="dg-journal-video-icon"><i class="fas fa-video"></i></span>
            <span class="dg-journal-video-name">${displayName}</span>
          </div>
          ${srcLabel}
          <button
            class="dg-open-video"
            data-journal-id="${journal.id}"
            data-page-id="${page.id}"
          >
            OPEN VIDEO
          </button>
        </div>
      `;
    }

    // Anything else with text content
    if (page.text?.content) {
      const html = await this._enrich(page.text.content, journal);
      return `
        <div class="dg-journal-page-text">
          ${html}
        </div>
      `;
    }

    return `<p><em>No content on this page.</em></p>`;
  }

  /**
   * v10+ — build accordion of pages
   */
  static async _buildPagesAccordion(journal) {
    if (!journal.pages || !journal.pages.size) return "";

    const pages = journal.pages.contents;
    const items = [];

    for (let idx = 0; idx < pages.length; idx++) {
      const page = pages[idx];
      const title = this._getPageTitle(page, idx);
      const typeLabel =
        page.type === "image"
          ? "[IMAGE]"
          : page.type === "text"
          ? "[TEXT]"
          : page.type === "pdf"
          ? "[PDF]"
          : page.type === "video"
          ? "[VIDEO]"
          : "[CONTENT]";
      const bodyHtml = await this._buildPageBodyHtml(page, journal);

      items.push(`
        <div class="dg-journal-page" data-page-id="${page.id}">
          <div class="dg-journal-page-header">
            <span class="dg-journal-page-title">${title}</span>
            <span class="dg-journal-page-type">${typeLabel}</span>
          </div>
          <div class="dg-journal-page-body" style="display:none;">
            ${bodyHtml}
          </div>
        </div>
      `);
    }

    return `
      <div class="dg-journal-accordion">
        ${items.join("")}
      </div>
    `;
  }

  /**
   * Fallback for v9-style single-content journals
   */
  static async _buildLegacyContent(journal) {
    const raw =
      journal.data?.content || "<p><em>No content in this journal.</em></p>";
    const html = await this._enrich(raw, journal);
    return `
      <div class="dg-journal-legacy">
        ${html}
      </div>
    `;
  }

  /**
   * Build final HTML for the journal popup body
   */
  static async _buildJournalHtml(journal) {
    // v10+ with pages
    if (journal.pages && journal.pages.size) {
      if (journal.pages.size === 0) {
        return "<p><em>No pages in this journal.</em></p>";
      }

      const accordionHtml = await this._buildPagesAccordion(journal);
      return `
        <div class="dg-journal-wrapper dg-journal-body">
          <div class="dg-profile-label">PAGES IN THIS ENTRY</div>
          ${accordionHtml}
        </div>
      `;
    }

    // v9 fallback: single content blob + optional image
    let bodyHtml = await this._buildLegacyContent(journal);

    if (journal.img) {
      bodyHtml += `
        <div class="dg-journal-image-wrapper">
          <img
            class="dg-journal-thumb dg-journal-main-thumb"
            src="${journal.img}"
            data-full-src="${journal.img}"
            alt="${journal.name || "Journal Image"}"
          >
        </div>
      `;
    }

    return `<div class="dg-journal-body">${bodyHtml}</div>`;
  }

  /* ------------------------------------------------------------------ */
  /* OPEN / CREATE / DELETE                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Open a journal entry ONLY in the CRT pop-out window.
   * Also mark it as "last viewed" for the recent journals list.
   */
  static async openPageInCrt(journalId) {
    const journal = game.journal.get(journalId);
    if (!journal) {
      ui.notifications.error("Journal not found.");
      return;
    }

    this.currentJournalId = journalId;

    // Mark this entry as "last viewed" for the LAST JOURNAL ENTRIES panel
    try {
      await journal.setFlag(DeltaGreenUI.ID, "lastViewed", Date.now());
      if (
        DeltaGreenUI?.isInterfaceActive &&
        DeltaGreenUI.isInterfaceActive() &&
        DeltaGreenUI.loadLastJournals
      ) {
        DeltaGreenUI.loadLastJournals();
      }
    } catch (err) {
      console.error(
        "Delta Green UI | Error setting journal lastViewed from CRT",
        err
      );
    }

    // Ensure the JOURNAL tab/view is active WITHOUT closing the dropdown
    try {
      const $tab = $('.dg-menu-item[data-view="journal"]');
      const $content = $("#dg-crt-content");
      const currentView = DeltaGreenUI.currentView;

      if ($tab.length) {
        // If we're not already on the journal view, use the normal menu click
        if (!$content.is(":visible") || currentView !== "journal") {
          $tab.trigger("click");
        } else {
          // Already on journal view: keep dropdown open and just set active view
          $(".dg-menu-item").removeClass("active");
          $tab.addClass("active");
          $(".dg-view").removeClass("active");
          $("#dg-view-journal").addClass("active");
          $content.show();
        }
      }
    } catch (err) {
      console.error(
        "Delta Green UI | Error forcing journal view active from CRT",
        err
      );
    }

    const $win = $("#dg-journal-window");
    const $winTitle = $("#dg-journal-window-title");
    const $winBody = $("#dg-journal-window-body");
    const $editBtn = $("#dg-journal-edit");

    if (!$win.length || !$winBody.length) {
      console.warn("Delta Green UI | Journal window containers not found.");
      return;
    }

    const html = await this._buildJournalHtml(journal);
    const titleText = journal.name || "JOURNAL ENTRY";

    if ($winTitle.length) $winTitle.text(titleText);
    $winBody.html(html);

    // Auto-expand FIRST page body (if any)
    const $firstPage = $winBody.find(".dg-journal-page").first();
    if ($firstPage.length) {
      $firstPage.find(".dg-journal-page-body").show();
    }

    // Show EDIT only if user can edit this journal
    const canEdit = journal.testUserPermission(
      game.user,
      CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    );
    if ($editBtn.length) {
      $editBtn.toggle(canEdit);
    }

    $win.show().scrollTop(0);
  }

  /**
   * Create a new journal and open it in the CRT window.
   */
  static async createNewJournalInCrt() {
    if (this._isCreating) {
      console.warn("JournalManager | createNewJournalInCrt already running.");
      return;
    }

    this._isCreating = true;
    try {
      if (!game.user.can("JOURNAL_CREATE")) {
        ui.notifications.warn("You do not have permission to create journals.");
        return;
      }

      const agentFolder = await this._getOrCreateAgentFilesFolder();

      const now = new Date().toLocaleString();
      const initialContent = `<h1>New Journal</h1><p>Created ${now}</p>`;

      // v10+ style: journal with pages
      const journalData = {
        name: "New Journal Entry",
        folder: agentFolder?.id ?? null,
        pages: [
          {
            name: "Page 1",
            type: "text",
            text: {
              format: 1, // HTML
              content: initialContent
            }
          }
        ],
        // v9 fallback field:
        content: initialContent,
        ownership: {
          [game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
        }
      };

      const journal = await JournalEntry.create(journalData);
      if (journal) {
        ui.notifications.info(`Journal "${journal.name}" created.`);
        if (DeltaGreenUI.loadJournals) DeltaGreenUI.loadJournals();
        setTimeout(() => {
          this.openPageInCrt(journal.id);
        }, 100);
      }
    } catch (err) {
      console.error("Delta Green UI | Error creating journal:", err);
      ui.notifications.error("Error creating journal.");
    } finally {
      this._isCreating = false;
    }
  }

  /**
   * Right-click delete helper
   */
  static async deleteJournal(journalId) {
    const journal = game.journal.get(journalId);
    if (!journal) return;

    if (
      !journal.testUserPermission(
        game.user,
        CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
      )
    ) {
      ui.notifications.warn("You don't have permission to delete this journal.");
      return;
    }

    const confirmed = await new Promise((resolve) => {
      const d = new Dialog({
        title: "Delete Journal",
        content: `<p>Delete journal "<strong>${journal.name}</strong>"? This cannot be undone.</p>`,
        buttons: {
          yes: {
            icon: '<i class="fas fa-check"></i>',
            label: "YES",
            callback: () => resolve(true)
          },
          no: {
            icon: '<i class="fas fa-times"></i>',
            label: "NO",
            callback: () => resolve(false)
          }
        },
        default: "no"
      });
      d.render(true);
    });

    if (!confirmed) return;

    await journal.delete();
    ui.notifications.info(`Journal "${journal.name}" deleted.`);

    if (DeltaGreenUI.loadJournals) {
      DeltaGreenUI.loadJournals();
    }
  }

  /* ------------------------------------------------------------------ */
  /* NEW: SEARCH IMPLEMENTATION                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Search journals by title and folder path; results shown in #dg-journals-list.
   * Empty term restores the normal journal tree (DeltaGreenUI.loadJournals()).
   */
  static searchJournals(term) {
    try {
      const $list = $("#dg-journals-list");
      if (!$list.length) return;

      const normalized = (term || "").trim().toLowerCase();

      // Empty search => restore default folder/tree rendering
      if (!normalized) {
        if (DeltaGreenUI.loadJournals) {
          DeltaGreenUI.loadJournals();
        }
        return;
      }

      const coll = game.journal?.contents ?? game.journal ?? [];
      const accessible = Array.from(coll).filter((j) => j.visible);

      const results = accessible.filter((journal) => {
        const name = (journal.name || "").toLowerCase();
        const folderPath = JournalManager._buildFolderPath(journal).toLowerCase();
        return name.includes(normalized) || folderPath.includes(normalized);
      });

      $list.empty();

      if (!results.length) {
        $list.append(
          '<li class="dg-result-item dg-no-entries">NO MATCHING JOURNALS</li>'
        );
        return;
      }

      // Sort by name for stable output
      results.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, {
          sensitivity: "base"
        })
      );

      for (const journal of results) {
        const path = JournalManager._buildFolderPath(journal);
        const $li = $(`
          <li class="dg-result-item dg-journal-entry" data-journal-id="${journal.id}">
            <span class="dg-journal-title">${journal.name}</span>
            ${
              path
                ? `<span class="dg-journal-path">[${path}]</span>`
                : ""
            }
          </li>
        `);

        $li.on("click", (ev) => {
          ev.preventDefault();
          JournalManager.openPageInCrt(journal.id);
        });

        $list.append($li);
      }
    } catch (err) {
      console.error("Delta Green UI | Error searching journals:", err);
      const $list = $("#dg-journals-list");
      if ($list.length) {
        $list
          .empty()
          .append(
            '<li class="dg-result-item dg-no-entries">Error searching journals</li>'
          );
      }
    }
  }
}
