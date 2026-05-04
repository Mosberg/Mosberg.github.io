You are an expert senior game developer. Create a complete Phaser 5 HTML5 game called “Ant Colony Manager” with JavaScript, HTML, and CSS. The game should be modular, well-structured, and easy to extend.

Overall requirements:
- Use Phaser 5 (CDN or module, but keep it simple to run in a browser).
- Provide a single HTML file that links to one main JS file and one CSS file.
- Organize the JS code into clear classes/modules (e.g., BootScene, PreloadScene, MainMenuScene, GameScene, UIScene).
- Use modern JavaScript (ES6+), but no build tools—just files that can run directly in a browser.
- Include comments explaining key systems and functions.

Game concept:
- The player manages an underground ant colony and a small surface area.
- The world is a 2D top-down or slightly isometric view.
- The colony has:
  - **Queen chamber**
  - **Brood chambers** (eggs, larvae, pupae)
  - **Food storage**
  - **Worker barracks / idle area**
  - **Tunnels** connecting rooms
- The surface has:
  - **Foraging area** with randomly spawning food sources
  - **Threats** (spiders, beetles, rival ants, environmental hazards)

Core systems and features:

1. Ant units and roles:
- Implement at least these ant types:
  - **Worker ants** (forage, carry food, dig tunnels, build rooms)
  - **Soldier ants** (fight enemies, defend colony)
  - **Nurse ants** (tend brood, increase growth speed)
  - **Scout ants** (explore fog-of-war, reveal new food and threats)
- Each ant has:
  - Basic stats: health, speed, carrying capacity, role.
  - Simple AI behavior based on state (idle, moving, foraging, fighting, returning, tending brood).
- Allow the player to:
  - Assign roles (e.g., convert a worker to soldier, etc.) via UI buttons or a panel.
  - Set global behavior priorities (e.g., “focus on food”, “focus on defense”).

2. Resources and economy:
- Implement at least these resources:
  - **Food** (primary resource)
  - **Population capacity** (based on built rooms)
  - **Colony morale or stability** (simple metric affected by food, deaths, threats)
- Food is used to:
  - Hatch new ants
  - Upgrade rooms
  - Unlock new abilities or techs
- Show resource counters in a HUD at the top or side of the screen.

3. Rooms, building, and upgrades:
- The player can build or upgrade rooms underground:
  - **Food storage** (increases max food)
  - **Brood chambers** (increases max population and hatch rate)
  - **Barracks** (increases soldier capacity or strength)
  - **Utility rooms** (e.g., pheromone lab, research room for upgrades)
- Building costs food and maybe time.
- Implement a simple building UI:
  - A panel with room types and their cost.
  - Clicking a room type and then clicking a valid underground tile places or upgrades it.
- Each room type has at least 2 upgrade levels with visible stat changes.

4. Map, tiles, and fog-of-war:
- Use a tile-based map for underground and surface.
- Underground:
  - Some tiles are solid dirt; workers can dig them out to create tunnels.
  - Some tiles are “hard rock” and cannot be dug.
- Surface:
  - Randomly placed food sources that respawn over time.
  - Enemy spawn points.
- Implement a simple fog-of-war:
  - Areas not in range of any ant are darkened.
  - Scouts have a larger vision radius.

5. Ant AI and pathfinding:
- Implement basic pathfinding so ants can:
  - Move between rooms and surface.
  - Find paths around blocked tiles.
- Behavior examples:
  - Workers: search for nearest food source, pick up food, return to storage.
  - Soldiers: patrol near colony entrance or move to threats.
  - Nurses: stay near brood chambers and periodically “tend” them to increase growth.
  - Scouts: wander and reveal fog-of-war.

6. Enemies and threats:
- Add at least 2 enemy types:
  - **Spider**: high damage, slow, targets ants.
  - **Beetle**: tanky, targets rooms/structures.
- Enemies spawn periodically on the surface and may invade tunnels.
- Simple combat system:
  - When ants and enemies overlap, they deal damage over time.
  - Show health bars or damage feedback.
- If enemies reach the queen chamber and destroy it, the player loses.

7. Progression, difficulty, and win/lose conditions:
- Implement a basic progression system:
  - Over time, enemy waves get stronger or more frequent.
  - New room upgrades or ant abilities unlock after certain milestones (e.g., total food gathered, time survived).
- Win condition example:
  - Survive for X minutes or defeat a “boss” enemy wave.
- Lose condition:
  - Queen dies or colony morale/stability reaches zero.

8. UI, menus, and settings:
- Scenes:
  - **Main menu** with:
    - Start Game
    - Options
    - Instructions / Help
  - **Game scene** with:
    - HUD for resources
    - Mini-map or simple colony overview (optional but preferred)
  - **Pause menu** with:
    - Resume
    - Settings
    - Quit to main menu
- Options/settings menu should include:
  - **Audio volume** sliders (music, SFX)
  - **Game speed** (e.g., 0.5x, 1x, 2x)
  - **Graphics detail** toggle (e.g., show/hide extra particles or shadows)
  - **Difficulty** (Easy, Normal, Hard) affecting enemy spawn rate and resource abundance.
- Provide a simple in-game tutorial or help overlay explaining:
  - How to assign roles
  - How to build rooms
  - How resources work

9. Visuals and audio:
- Use simple placeholder graphics (colored shapes, basic sprites) but structure the code so assets can be easily replaced.
- Add:
  - Subtle particle effects for digging, fighting, and food collection.
  - Simple animations for ants moving and attacking (even if just frame or scale changes).
- Include background music and a few sound effects (digging, attack, UI click), using placeholder audio files or simple tones.

10. Code structure and quality:
- Separate concerns clearly:
  - **Scenes** for flow (Boot, Preload, Menu, Game, UI).
  - **Managers** or helper classes for:
    - Ant management
    - Room/building management
    - Resource management
    - Enemy/wave management
    - Settings and persistence (if you add localStorage)
- Use configuration objects for:
  - Ant types and stats
  - Room types, costs, and upgrade values
  - Difficulty settings
- Add plenty of comments explaining:
  - How to add a new ant type
  - How to add a new room type
  - How to tweak difficulty and resource rates

11. Extra options and polish (if feasible):
- Add a **save/load** system using localStorage (optional but desirable).
- Add **keyboard shortcuts** for common actions (pause, speed up, open build menu).
- Add a **debug overlay** that can be toggled to show:
  - Number of ants by role
  - Current enemy wave info
  - Performance stats (FPS)

Deliverables:
- `index.html` with:
  - Phaser 5 included
  - Canvas setup
  - Links to `main.js` and `styles.css`
- `main.js` (you can split into multiple JS files if you like, but keep it simple to include).
- `styles.css` for basic layout and UI styling.

Make sure the final answer includes the full code for:
- `index.html`
- `styles.css`
- `main.js` (and any additional JS files you create)
All code should be ready to copy into files and run locally in a browser.