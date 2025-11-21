/**
 * UI Components for Delta Green Player UI
 */

import { RecordsManager } from "./records-manager.js";

export class UIComponents {
  /**
   * Initialize UI components
   */
  static init() {
    console.log("Delta Green UI | Initializing UI components");

    // Initialize events
    this.initEvents();

    // Initial player list
    this.updatePlayersList();

    // Regular refresh of player list (every 30 seconds)
    setInterval(() => this.updatePlayersList(), 30000);
  }

  /**
   * Initialize events
   */
  static initEvents() {
    // Click on player list -> open own sheet or show ACCESS DENIED
    $(document).on("click", "#dg-players-list .dg-result-item", function () {
      const userId = $(this).data("user-id");
      if (!userId) return;

      const user = game.users.get(userId);
      if (!user || !user.character) return;

      const actor = user.character;

      // If it's *your* character, open sheet
      if (game.user.character && game.user.character.id === actor.id) {
        actor.sheet.render(true);
      } else {
        // ACCESS DENIED message
        const $accessView = $("#dg-view-access");
        if (!$accessView.length) return;

        $accessView.append(`
          <div class="dg-access-denied">
            ACCESS DENIED<br>
            AUTHORIZATION LEVEL INSUFFICIENT
          </div>
        `);

        setTimeout(() => {
          $(".dg-access-denied").fadeOut(500, function () {
            $(this).remove();
          });
        }, 3000);
      }
    });

    // Record list items are wired in RecordsManager, so no need to duplicate here
  }

  /**
   * Update players list
   */
  static updatePlayersList() {
    const $list = $("#dg-players-list");
    if (!$list.length) return;

    $list.empty();

    // Active players (exclude GMs)
    const players = game.users.filter((u) => u.active && !u.isGM);

    if (players.length > 0) {
      players.forEach((player) => {
        const characterName = player.character
          ? player.character.name
          : "NO AGENT ASSIGNED";

        $list.append(`
          <li class="dg-result-item" data-user-id="${player.id}">
            <span style="color: ${player.color}">${player.name}</span> - ${characterName}
          </li>
        `);
      });
    } else {
      $list.append(
        '<li class="dg-result-item dg-no-entries">No active players found</li>'
      );
    }
  }
}
