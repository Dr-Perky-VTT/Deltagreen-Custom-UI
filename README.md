# Delta Green Custom UI

Compatible with: **Foundry VTT v13**  
Built for: **Delta Green System v1.6.1**

---

## Installation

1. Download or clone the module files.
2. Place the module folder in:

   `C:\Users\[Username]\AppData\Local\FoundryVTT\Data\modules\`

3. **Important:** The folder name **must** be exactly:

   `deltagreen-custom-ui`

4. Start Foundry, go to **Configuration → Manage Modules**, and enable **Delta Green Custom UI** for your world.

---

## Troubleshooting

### Player skills not populating

If a player’s skills are missing when the UI opens:

- Have them **click their own token** on the canvas.
- The UI should then correctly detect their assigned actor and populate skills.
- By default, it tries to bind to the player’s assigned character, but sometimes Foundry doesn’t pass that through cleanly on first load.

On windows 10/11 effiency mode causes noticable slow-down when saving the record files, check your task manager and try to disable it unfortunately it has to be done everytime you relaunch.
---

## Known Issues

- **Mail tab player names**  
  In the **Mail** tab, players currently only see **their own assigned character name** in the header, not other players.  
  This is a known bug and is being worked on.

---

## Main Screen Overview

The top bar of the Delta Green UI contains the main navigation.  
Clicking each option opens its corresponding screen in the main panel.

- **System**
- **Access**
- **Mail**
- **Psych-Eval**
- **Skills**
- **Inventory**
- **Bank**
- **Combat**
- **Record**
- **Journal**
- **Satellite**
- **Web** (optional)
- **Settings**

Each section is detailed below.

---

## System

A quick-access hub for frequently used items.

- **Quick Access to Character Sheets**  
  Shortcuts to open agent character sheets.

- **Recent Journals & Records**  
  Lists recently accessed journals and record entries for fast reference.

- **CRT Theme Cycling**  
  Cycle between **five preset CRT color themes**.
- **CRT Font Dropdown
  Choose between a variety of classic computer fonts from https://int10h.org/oldschool-pc-fonts

---

## Access

- Displays the **active player list** in the session.
- Useful for quickly confirming who is connected and which agents are in play.

---

## Mail

In-UI chat window.

- Players can:
  - Type a message and **press Enter** to send.

### Dice Tray Integration (Optional)

If you are running a compatible **Dice Tray module**:

- The player’s dice tray will appear **under the send message button**.
- Allows quick access to dice rolls from within the Mail view.

---

## Psych-Eval

A dedicated psychological status and flavor screen.

### Psych Report

- Shows a psych report with **note suggestions** written by a real psych nurse.
- Use these as **roleplay prompts** for how a character might act at or near a breaking point.
- A future option may allow toggling between flavor-only and visible mechanical values.

### Bonds / Disorders / Motivations

Right-hand panel lists:

- Bonds  
- Disorders  
- Motivations  
- Adaptation checkboxes (e.g., Violence / Helplessness)

**Controls:**

- **Left-click** an entry: open the item.
- **Right-click** an entry: delete the item.

### Add Buttons

- **ADD BOND** – Creates a new Bond item.
- **ADD DISORDER / MOTIVATION** – Creates a new Disorder or Motivation item.
  - For disorders, use the **Motivation** field to record the source, e.g.:  
    `Alcoholism [From: Violence]`.

### Action Buttons

#### RUN SANITY CHECK

- Performs a **Sanity roll** for the selected character.
- Hides exact numbers from players, instead showing:
  - A narrative message.
  - Whether they **succeeded / failed / crit / fumbled**.
- Automatically:
  - Checks if the agent hits **Breaking Point**.
  - Adjusts **Breaking Point** as needed.
  - Prompts for the **source of SAN loss** and checks the correct flags.
  - Tracks adaptations to **Violence** and **Helplessness**, and announces when 3 losses have accumulated (adaptation).

#### PROJECT ONTO BOND

- Runs the **Project onto Bond** action (RAW).
- Automates SAN recovery mid-operation.
- Marks the affected Bond as **damaged**, to be addressed during downtime / home scenes.

#### REPRESS INSANITY

- Runs the **Repress Insanity** action (RAW).
- Automates suppressing a disorder’s effects.
- Marks relevant Bonds as **damaged**.

---

## Skills

A focused rolling and stats panel.

### Skill Buttons

- Each skill is a **clickable button**.
- Clicking a skill:
  - Rolls using the agent’s current **skill or stat value**.
  - Flags the skill for **improvement tracking**.

### HP / WP / SAN Display

- **HP** and **WP** are shown as numbers.
- **SAN** is hidden (matching one common table rule).
  - A future option may allow GMs to toggle SAN visibility.

**Controls:**

- Click **SAN**: runs a **Sanity check**, using the same macro as Psych-Eval.
- Click **HP / WP**: **decrease** the value.
- **Right-click** **HP / WP**: **increase** the value.

### Weapons

- Shows any **equipped weapons** as clickable buttons.
- Includes a macro for **Lethality**:
  - Asks if the target is **Unnatural**.
  - Handles lethality and damage rolls automatically.

### Roll Modifiers

- A **modifier button** lets you apply temporary modifiers (e.g., ±20, ±40).
- Once set, the modifier stays active until:
  - Used by the next roll, or
  - Reset using the **0** button.

### Apply lessons from failures

- Rolls that qualify for improvement are tracked with ☣️.
- Can be resolved later during downtime.

### Roll View

- Bottom panel shows **recent rolls**, letting players and the GM review results without opening the full chat log.

---

## Inventory

Structured view of weapons and gear.

### Item Display

- Shows all weapons and gear the agent currently owns.
- Includes a **catalog** to:
  - Auto-populate standard weapons and gear.
  - Create **custom items**.

### Price Catalog

- Contains prices for:
  - Weapons  
  - Gear  
  - **Services**  

Useful for in-game shopping and budgeting.

### Controls

- **Left-click**: open the item sheet.
- **Left-click (equip area)**: equip/unequip items (if implemented).
- **Middle-click**: delete item.

---

## Bank

In-universe financial ledger.

- Everything **above** GM controls is what **players** see.

### GM Controls

- Select a **character** to give or deduct money from.
- Enter:
  - **Name/label** for the transaction.
  - **Note** describing the transaction.
  - **Amount**, including a `+` or `-` to indicate credit or debit.

**Important:**  
Make sure **PC sheets are in the PC Records folder** so the Bank screen can find them.

---

## Combat

Custom **manual combat tracker**.

- Tracks:
  - **Armor values** (cover and body armor).
  - **Status effects**.
  - **Notes** for each combatant.

Control details are documented directly in the **Combat** tab UI for quick reference.

---

## Record

In-universe records for people, entities, and phenomena.

### Function

- Players can create their **own records** of people, events, and entities.
- The GM can create and populate records for them.

### Performance Note

- After creating or editing records, you may see a **slight slowdown** until Foundry finishes updating.
  - If so, switch out of the **Record** tab and back into it.

### Controls

- **Add File** – Create a new record entry.
- **Right-click** a file – Delete that record.
- **Add Contact** – Creates an **NPC sheet**.
- **Add Vehicle** – Creates a **Vehicle sheet**.
- **Add Unnatural** – Creates an **Unnatural entity sheet**.

### View Full Report

- **View Full Report** opens the character sheet for that record.
- Players:
  - Can only open sheets they **own**.
  - Can still see entries for any file in the **PC Records** folder (e.g., dossiers prepared by the GM).

---

## Journal

Journal viewer with a custom list display.

- Shows **all journals** the player has permission to see (not limited to a special folder like Records).

### Edit Button

- Always opens the **standard Foundry journal editor**.
- Keeps editing consistent with normal Foundry behavior.

---

## Satellite

Scene navigation for players.

- Lists all **scene feeds** the player has access to.
- Selecting a feed **moves the player to that scene**.

---

## Web (Optional)

If enabled in module settings:

- Opens a **web page** inside the UI.

**Requirements:**

- The URL must be **HTTPS** (`https://`), not HTTP.
- Set the URL via:  
  **Foundry Settings → Module Settings → Delta Green Custom UI → Web URL**

---

## Settings

Opens the **Delta Green Custom UI** module settings panel.

### Custom UI Options

You can configure:

- **Toggles**
  - Skill hotbar for the active player.
  - Roll view display.
  - Token control **D-pad** for convenience.

- **Appearance**
  - Custom **theme colors** per CRT theme.
  - **Terminal font** via the font dropdown.

Use these options to tune the module’s look and readability to your table’s needs.
