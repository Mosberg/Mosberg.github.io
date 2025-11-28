# Rarity

A fully data-driven Minecraft Fabric mod that introduces dynamic item rarities across crafting, loot, and drops. Every item tells a story — from worthless junk to transcendent treasures.

## 🔑 Core Features

### 🎲 Dynamic Item Rarity

- Weapons, tools, and equipment are automatically assigned a **random rarity** on creation.
- Rarities range from _Trash_ to _Transcendent_, each with unique visuals and drop rates.

### ⚒️ Loot & Craft Integration

- Rarity weights apply seamlessly to:
  - Crafted items
  - Loot tables
  - Drop tables
- Ensures consistent rarity distribution across all gameplay sources.

### 🧠 Fully Data-Driven

- All rarity definitions are stored in [`rarities.json`](https://raw.githubusercontent.com/Mosberg/minecraft/main/rarity/src/main/resources/data/rarity/rarities.json).
- Easy to customize, extend, or rebalance without touching code.

### 💾 Persistent & Visible Properties

- Rarity data is stored in **NBT**, ensuring persistence across:
  - Inventory transfers
  - Item drops
  - Trades
- Visual indicators include:
  - Colored names
  - Custom frames and icons
  - Tooltip enhancements
  - Weight-based rarity logic
