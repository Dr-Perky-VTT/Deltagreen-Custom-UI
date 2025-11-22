Delta Green Custom UI
Compatible with: Foundry VTT v13
Built for: Delta Green System v1.6.1

Installation

Download the module files.

Place the module folder in:

C:\Users\[Username]\AppData\Local\FoundryVTT\Data\modules\


Important: The folder name must be exactly:

deltagreen-custom-ui


Start Foundry, go to Configuration → Manage Modules, and enable Delta Green Custom UI for your world.

Troubleshooting

Player skills not populating on launch
If a player’s skills are missing when the UI opens:
Have them click their own token on the canvas.
The UI should then correctly detect their assigned actor and populate skills.
By default, it tries to bind to the player’s assigned character, but sometimes Foundry doesn’t pass that through cleanly on first load.

Known Issues
Mail Tab – Player Names
In the Mail tab, players currently only see their own assigned character name in the header, not other players.
This is a known bug and is actively being worked on.

Main Screen Overview
The top bar of the Delta Green UI contains the main navigation. Clicking each option opens its corresponding screen in the main panel.
Below is a breakdown of what each menu option does.

System
A quick-access hub for frequently used items.
Quick Access to Character Sheets
Displays shortcuts to open agent character sheets.

-Recent Journals & Records
Lists recently accessed journals and record entries for fast reference.

CRT Theme Cycling
Allows you to cycle between five preset CRT color themes.

Access

Displays the active player list in the session.

Useful for quickly confirming who is connected and which agents are currently in play.

Mail
Functions as a chat window within the UI.

Players can:

Type a message and press Enter to send.

Optional Dice Tray Integration
If you are running a compatible Dice Tray module, players will see their tray docked under the send message button, allowing quick access to dice rolls from within the Mail view.

Psych-Eval

A dedicated psychological status and flavor screen.

Psychological Report
Shows a psych report with note suggestions written by a real psych nurse.
Treat these as roleplay prompts for how a character might behave at or near a breaking point.
(A future option may let you toggle between flavor-only and visible mechanical values.)

Bonds / Disorders / Motivations
The right-hand panel lists:

Bonds

Disorders

Motivations

Adaptation checkboxes (e.g., Violence / Helplessness)

Controls:

Left-click an entry: open the item.

Right-click an entry: delete the item.

Add Buttons

ADD BOND – Creates a new Bond item.

ADD DISORDER / MOTIVATION – Creates a new Disorder or Motivation item.

For disorders, use the Motivation field to record the source, e.g.:
Alcoholism [From: Violence].

Psych-Eval Buttons

RUN SANITY CHECK

Runs a macro that performs a Sanity roll for the selected character.

All actual numbers are hidden from the players; they see:

A vague narrative message.

Whether they succeeded / failed / crit / fumbled.

Automatically:

Checks if the agent hits Breaking Point.

Adjusts the Breaking Point value as required.

Prompts for the source of SAN loss and checks the correct flags.

Tracks adaptations to Violence and Helplessness, and announces when 3 have been accumulated (i.e., when adaptation occurs).

PROJECT ONTO BOND

Runs the Project onto Bond action (RAW from the book).

Automates SAN recovery mid-operation.

Marks the affected Bond as damaged, so you can address it during downtime / home scenes.

REPRESS INSANITY

Runs the Repress Insanity action (RAW).

Automates suppressing the effects of a disorder.

Marks the relevant Bonds as damaged accordingly.

Skills

A tactical rolling panel for agents.

Skill Buttons

Every skill appears as a clickable button.

Clicking a skill:

Performs a roll using the agent’s current skill or stat value.

Flags the skill for improvement tracking automatically.

HP / WP / SAN Display

HP and WP are shown as numbers.

SAN is hidden (by design, matching one common table rule).

A future setting may allow GMs to toggle SAN visibility.

Controls:

Click SAN: triggers a Sanity check, using the same macro as Psych-Eval.

Click HP / WP: decrease the value.

Right-click HP / WP: increase the value.

Weapons

Shows any weapons the agent has equipped as clickable buttons.

Includes a macro to automate Lethality:

Asks whether the target is Unnatural.

Handles the lethality rules and damage rolls accordingly.

Roll Modifiers

A modifier button allows applying temporary modifiers (e.g., ±20, ±40).

Once pressed, the modifier persists until:

It is consumed by the next roll, or

Reset using the 0 button.

Skill Improvements

Rolls that qualify for skill improvement are tracked and can be resolved later in downtime.

Roll View (Bottom Panel)

Shows a running log of recent rolls, so players and the GM can quickly review outcomes without opening the full chat log.

Inventory

A structured view of an agent’s gear and weapons.

Item Display

Shows all weapons and gear the player currently owns.

Includes a catalog of options for:

Auto-populating standard weapons and gear.

Creating custom items.

Price Catalog

Includes prices for weapons, gear, and services for reference.

Controls

Left-click: open the item sheet.

Left-click (equip area): equip/unequip items as appropriate.

Middle-click: delete the item.

Bank

A simple in-universe financial ledger.

The upper portion (above GM controls) is what players see.

GM Controls allow you to:

Select a character to give or deduct money from.

Enter:

A name/label for the transaction.

A note describing it.

The amount, including a + or - to indicate credit or debit.

Important:
Make sure PC sheets are placed in the PC Records folder so the Bank screen can find and list them correctly.

Combat

A custom manual combat tracker.

Tracks:

Armor values from cover and body armor.

Status effects.

Notes for each combatant.

Control details are documented directly in the Combat tab UI for easy reference during play.

Record

An in-universe records system for people, entities, and phenomena.

Agent & NPC Files

Players can create their own records of the people and things they encounter.

The GM can also create and populate records for them.

Performance Note

After creating or editing records, you might see a slight slowdown until Foundry finishes updating.

If this happens, try switching out of the Record tab and back again.

Record Controls

Add File – Create a new record entry.

Right-click a file – Delete that record.

Add Contact – Creates an NPC sheet.

Add Vehicle – Creates a Vehicle sheet.

Add Unnatural – Creates an Unnatural entity sheet.

Full Report

View Full Report opens the full character sheet for that record.

Players:

Can only open sheets they own.

But can see entries for any file placed in the PC Records folder (useful for in-universe dossiers prepared by the GM).

Journal

A streamlined journal viewer.

Works similarly to Records, but:

Shows all journals the player has permission to see, not just ones in a special folder.

Edit Button

Always opens the standard Foundry journal editor for ease of use and consistency.

Satellite

Scene navigation for players.

Allows players to switch scenes easily.

They see a list of scene feeds they have access to.

Selecting a feed moves them to that scene.

Web (Optional)

If enabled in settings:

Opens a web page of your choice inside the UI.

Requirement:
The URL must be HTTPS (https://), not HTTP, or Foundry will refuse to display it.

You can set the URL in:

Foundry Settings → Module Settings → Delta Green Custom UI → Web URL

Settings

Opens the Delta Green Custom UI module settings.

Custom UI Options

From this settings panel you can:

Toggle:

A skill hotbar for the active player.

The roll view display.

A token control D-pad for convenience.

Customize:

Theme colors (custom colors per CRT theme).

Terminal font via the font dropdown.

These options let you tune the module’s look and feel to match your table’s aesthetic and visibility needs.
