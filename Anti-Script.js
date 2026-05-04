/* Ant Colony Manager
   ------------------------------------------------------------
   A complete browser-ready Phaser colony management prototype.

   Architecture:
   - BootScene: game boot and settings initialization
   - PreloadScene: generate placeholder graphics/audio helpers
   - MainMenuScene: title, options, help
   - GameScene: world, ants, rooms, resources, enemies
   - UIScene: HUD, controls, overlays
   - PauseScene: pause menu overlay

   Key extension points:
   - ANT_TYPES: add new ant roles here
   - ROOM_TYPES: add new room types/upgrades here
   - DIFFICULTY_SETTINGS: tweak pacing and challenge here
   - WaveManager.spawnWave(): add new enemy wave compositions here

   Note:
   - Uses procedural graphics and simple WebAudio tones so no external assets are needed.
   - This is intentionally modular and heavily commented for extension.
*/

const GAME_WIDTH = 1440;
const GAME_HEIGHT = 900;

const TILE_SIZE = 24;
const MAP_WIDTH = 52;
const MAP_HEIGHT = 34;
const SURFACE_ROWS = 8;
const UNDERGROUND_START = SURFACE_ROWS;

const TILE = {
  SURFACE: 0,
  DIRT: 1,
  TUNNEL: 2,
  ROCK: 3,
  ROOM: 4,
  ENTRANCE: 5
};

const ROOM_KIND = {
  QUEEN: "queen",
  BROOD: "brood",
  STORAGE: "storage",
  BARRACKS: "barracks",
  UTILITY: "utility"
};

const ROLE = {
  WORKER: "worker",
  SOLDIER: "soldier",
  NURSE: "nurse",
  SCOUT: "scout"
};

const ENEMY_TYPE = {
  SPIDER: "spider",
  BEETLE: "beetle"
};

const ANT_TYPES = {
  worker: {
    label: "Worker",
    color: 0x3b2f2f,
    health: 40,
    speed: 62,
    carry: 12,
    damage: 4,
    vision: 90
  },
  soldier: {
    label: "Soldier",
    color: 0x8d2f2f,
    health: 90,
    speed: 52,
    carry: 2,
    damage: 14,
    vision: 100
  },
  nurse: {
    label: "Nurse",
    color: 0x8058a5,
    health: 50,
    speed: 56,
    carry: 6,
    damage: 3,
    vision: 90
  },
  scout: {
    label: "Scout",
    color: 0x2c6f7a,
    health: 38,
    speed: 78,
    carry: 6,
    damage: 5,
    vision: 140
  }
};

/* How to add a new room type:
   1. Add a new key below.
   2. Give it cost, size, and upgrade levels.
   3. Update RoomManager.applyRoomBonuses() if it affects colony stats.
   4. Add a UI button in UIScene.createBuildButtons().
*/
const ROOM_TYPES = {
  brood: {
    label: "Brood",
    color: 0xd6c18a,
    cost: 35,
    maxLevel: 2,
    size: { w: 3, h: 2 },
    levels: {
      1: { popBonus: 6, hatchRate: 1.0 },
      2: { popBonus: 10, hatchRate: 1.6 }
    }
  },
  storage: {
    label: "Storage",
    color: 0x8f6a3b,
    cost: 30,
    maxLevel: 2,
    size: { w: 3, h: 2 },
    levels: {
      1: { foodCap: 120 },
      2: { foodCap: 220 }
    }
  },
  barracks: {
    label: "Barracks",
    color: 0xa04747,
    cost: 45,
    maxLevel: 2,
    size: { w: 3, h: 2 },
    levels: {
      1: { soldierPower: 1.1, soldierCap: 6 },
      2: { soldierPower: 1.25, soldierCap: 12 }
    }
  },
  utility: {
    label: "Utility",
    color: 0x5a7d44,
    cost: 50,
    maxLevel: 2,
    size: { w: 3, h: 2 },
    levels: {
      1: { moraleBonus: 6, unlockUtility: true },
      2: { moraleBonus: 12, techBoost: true }
    }
  }
};

/* Difficulty tuning lives here.
   To tweak progression:
   - enemyInterval lowers as difficulty rises
   - foodSpawnRate and moraleDrain shape economy pressure
*/
const DIFFICULTY_SETTINGS = {
  easy: {
    label: "Easy",
    enemyInterval: 32,
    foodSpawnRate: 1.3,
    startingFood: 110,
    moraleDrain: 0.2,
    waveScale: 0.9
  },
  normal: {
    label: "Normal",
    enemyInterval: 24,
    foodSpawnRate: 1.0,
    startingFood: 90,
    moraleDrain: 0.35,
    waveScale: 1.0
  },
  hard: {
    label: "Hard",
    enemyInterval: 18,
    foodSpawnRate: 0.85,
    startingFood: 72,
    moraleDrain: 0.55,
    waveScale: 1.2
  }
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function distance(a, b) {
  return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
}

class SettingsManager {
  constructor() {
    this.data = {
      musicVolume: 0.35,
      sfxVolume: 0.7,
      gameSpeed: 1,
      graphicsDetail: true,
      difficulty: "normal"
    };
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem("ant-colony-manager-settings");
      if (!raw) return;
      this.data = { ...this.data, ...JSON.parse(raw) };
    } catch (e) {
      console.warn("Settings load failed", e);
    }
  }

  save() {
    try {
      localStorage.setItem("ant-colony-manager-settings", JSON.stringify(this.data));
    } catch (e) {
      console.warn("Settings save failed", e);
    }
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  get(key) {
    return this.data[key];
  }
}

class SaveManager {
  static saveGame(state) {
    try {
      localStorage.setItem("ant-colony-manager-save", JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn("Save failed", e);
      return false;
    }
  }

  static loadGame() {
    try {
      const raw = localStorage.getItem("ant-colony-manager-save");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn("Load failed", e);
      return null;
    }
  }

  static clear() {
    localStorage.removeItem("ant-colony-manager-save");
  }
}

class AudioManager {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
  }

  ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  tone(freq = 440, type = "sine", duration = 0.08, volume = 0.1) {
    try {
      this.ensure();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(volume * this.settings.get("sfxVolume"), this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Silent fallback for browser restrictions.
    }
  }

  click() { this.tone(520, "triangle", 0.06, 0.09); }
  build() { this.tone(320, "square", 0.18, 0.12); }
  dig() { this.tone(150, "sawtooth", 0.08, 0.07); }
  hit() { this.tone(110, "square", 0.05, 0.08); }
  collect() { this.tone(760, "sine", 0.1, 0.08); }
  hatch() { this.tone(600, "triangle", 0.16, 0.08); }
}

class GridPathfinder {
  constructor(scene) {
    this.scene = scene;
  }

  findPath(startTx, startTy, endTx, endTy) {
    if (!this.scene.isWalkable(endTx, endTy)) return [];
    const key = (x, y) => `${x},${y}`;
    const queue = [{ x: startTx, y: startTy }];
    const cameFrom = new Map();
    cameFrom.set(key(startTx, startTy), null);

    const dirs = [
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ];

    while (queue.length > 0) {
      const current = queue.shift();
      if (current.x === endTx && current.y === endTy) break;

      for (const [dx, dy] of dirs) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const k = key(nx, ny);
        if (!this.scene.inBounds(nx, ny)) continue;
        if (!this.scene.isWalkable(nx, ny)) continue;
        if (cameFrom.has(k)) continue;
        cameFrom.set(k, current);
        queue.push({ x: nx, y: ny });
      }
    }

    const endKey = key(endTx, endTy);
    if (!cameFrom.has(endKey)) return [];

    const path = [];
    let current = { x: endTx, y: endTy };
    while (current) {
      path.push(current);
      current = cameFrom.get(key(current.x, current.y));
    }
    path.reverse();
    return path;
  }
}

class ResourceManager {
  constructor(scene, difficultyKey) {
    const diff = DIFFICULTY_SETTINGS[difficultyKey];
    this.scene = scene;
    this.food = diff.startingFood;
    this.foodCap = 160;
    this.population = 5;
    this.populationCap = 12;
    this.morale = 100;
    this.totalFoodGathered = 0;
    this.timeSurvived = 0;
    this.unlocks = {
      utility: false,
      advancedRoles: true,
      bossWaveReady: false
    };
  }

  addFood(amount) {
    const before = this.food;
    this.food = clamp(this.food + amount, 0, this.foodCap);
    this.totalFoodGathered += Math.max(0, this.food - before);
  }

  spendFood(amount) {
    if (this.food < amount) return false;
    this.food -= amount;
    return true;
  }

  addMorale(v) {
    this.morale = clamp(this.morale + v, 0, 100);
  }

  update(dt) {
    this.timeSurvived += dt;
    const diff = DIFFICULTY_SETTINGS[this.scene.settings.get("difficulty")];
    this.morale = clamp(this.morale - diff.moraleDrain * dt * 0.16, 0, 100);

    if (this.totalFoodGathered >= 150) this.unlocks.utility = true;
    if (this.timeSurvived >= 180) this.unlocks.bossWaveReady = true;
  }
}

class Room {
  constructor(type, tiles, level = 1) {
    this.type = type;
    this.tiles = tiles;
    this.level = level;
    this.health = 120 + level * 50;
    this.maxHealth = this.health;
    this.progress = 1;
  }

  center() {
    const mid = this.tiles[Math.floor(this.tiles.length / 2)];
    return { tx: mid.x, ty: mid.y };
  }
}

class RoomManager {
  constructor(scene) {
    this.scene = scene;
    this.rooms = [];
    this.roomTileLookup = new Map();
  }

  createInitialRooms() {
    this.placeFixedRoom(ROOM_KIND.QUEEN, 23, 13, 4, 3, 1);
    this.placeFixedRoom(ROOM_KIND.BROOD, 18, 15, 3, 2, 1);
    this.placeFixedRoom(ROOM_KIND.STORAGE, 28, 15, 3, 2, 1);
    this.placeFixedRoom(ROOM_KIND.BARRACKS, 23, 18, 3, 2, 1);
    this.applyRoomBonuses();
  }

  placeFixedRoom(type, x, y, w, h, level = 1) {
    const tiles = [];
    for (let ty = y; ty < y + h; ty++) {
      for (let tx = x; tx < x + w; tx++) {
        this.scene.map[ty][tx] = TILE.ROOM;
        this.scene.roomTypeMap[ty][tx] = type;
        tiles.push({ x: tx, y: ty });
        this.roomTileLookup.set(`${tx},${ty}`, type);
      }
    }
    const room = new Room(type, tiles, level);
    this.rooms.push(room);
    return room;
  }

  canPlaceRoom(type, originTx, originTy) {
    const def = ROOM_TYPES[type];
    if (!def) return false;
    const { w, h } = def.size;

    for (let ty = originTy; ty < originTy + h; ty++) {
      for (let tx = originTx; tx < originTx + w; tx++) {
        if (!this.scene.inBounds(tx, ty)) return false;
        if (ty < UNDERGROUND_START) return false;
        if (this.scene.map[ty][tx] !== TILE.TUNNEL) return false;
      }
    }
    return true;
  }

  buildRoom(type, originTx, originTy) {
    const def = ROOM_TYPES[type];
    if (!def) return { ok: false, reason: "Unknown room type" };
    if (type === ROOM_KIND.UTILITY && !this.scene.resources.unlocks.utility) {
      return { ok: false, reason: "Utility room locked. Gather more food first." };
    }
    if (!this.canPlaceRoom(type, originTx, originTy)) {
      return { ok: false, reason: "Need a cleared underground tunnel area." };
    }
    if (!this.scene.resources.spendFood(def.cost)) {
      return { ok: false, reason: "Not enough food." };
    }

    const tiles = [];
    for (let ty = originTy; ty < originTy + def.size.h; ty++) {
      for (let tx = originTx; tx < originTx + def.size.w; tx++) {
        this.scene.map[ty][tx] = TILE.ROOM;
        this.scene.roomTypeMap[ty][tx] = type;
        tiles.push({ x: tx, y: ty });
        this.roomTileLookup.set(`${tx},${ty}`, type);
      }
    }

    const room = new Room(type, tiles, 1);
    room.progress = 0;
    this.rooms.push(room);
    this.scene.audio.build();
    this.scene.spawnBuildParticles(originTx, originTy);
    this.applyRoomBonuses();
    return { ok: true, room };
  }

  roomAt(tx, ty) {
    return this.rooms.find(r => r.tiles.some(t => t.x === tx && t.y === ty));
  }

  upgradeRoom(room) {
    const def = ROOM_TYPES[room.type];
    if (!def) return { ok: false, reason: "This room cannot be upgraded." };
    if (room.level >= def.maxLevel) return { ok: false, reason: "Already max level." };
    const cost = Math.ceil(def.cost * (1 + room.level * 0.75));
    if (!this.scene.resources.spendFood(cost)) {
      return { ok: false, reason: "Not enough food to upgrade." };
    }
    room.level += 1;
    room.maxHealth += 60;
    room.health = room.maxHealth;
    this.scene.audio.build();
    this.scene.spawnBuildParticles(room.tiles[0].x, room.tiles[0].y);
    this.applyRoomBonuses();
    return { ok: true };
  }

  applyRoomBonuses() {
    let foodCap = 160;
    let popCap = 12;
    let soldierPower = 1;
    let moraleBonus = 0;
    let soldierCap = 4;

    for (const room of this.rooms) {
      if (room.type === ROOM_KIND.STORAGE) {
        foodCap += ROOM_TYPES.storage.levels[room.level].foodCap;
      }
      if (room.type === ROOM_KIND.BROOD) {
        popCap += ROOM_TYPES.brood.levels[room.level].popBonus;
      }
      if (room.type === ROOM_KIND.BARRACKS) {
        soldierPower *= ROOM_TYPES.barracks.levels[room.level].soldierPower;
        soldierCap += ROOM_TYPES.barracks.levels[room.level].soldierCap;
      }
      if (room.type === ROOM_KIND.UTILITY) {
        moraleBonus += ROOM_TYPES.utility.levels[room.level].moraleBonus;
      }
    }

    this.scene.resources.foodCap = foodCap;
    this.scene.resources.populationCap = popCap;
    this.scene.colonyModifiers.soldierPower = soldierPower;
    this.scene.colonyModifiers.moraleBonus = moraleBonus;
    this.scene.colonyModifiers.soldierCap = soldierCap;
  }

  getQueenRoom() {
    return this.rooms.find(r => r.type === ROOM_KIND.QUEEN);
  }

  broodRooms() {
    return this.rooms.filter(r => r.type === ROOM_KIND.BROOD);
  }
}

class AntUnit {
  constructor(scene, tx, ty, role = ROLE.WORKER) {
    this.scene = scene;
    this.role = role;
    this.def = ANT_TYPES[role];
    this.tx = tx;
    this.ty = ty;
    this.x = tx * TILE_SIZE + TILE_SIZE / 2;
    this.y = ty * TILE_SIZE + TILE_SIZE / 2;
    this.health = this.def.health;
    this.maxHealth = this.def.health;
    this.speed = this.def.speed;
    this.carry = this.def.carry;
    this.damage = this.def.damage;
    this.vision = this.def.vision;
    this.state = "idle";
    this.path = [];
    this.pathIndex = 0;
    this.target = null;
    this.carryingFood = 0;
    this.attackCooldown = 0;
    this.taskCooldown = 0;
    this.selected = false;
    this.moveTarget = null;

    this.sprite = scene.add.circle(this.x, this.y, 7, this.def.color, 1);
    this.sprite.setDepth(30);

    this.healthBarBg = scene.add.rectangle(this.x, this.y - 10, 16, 3, 0x000000, 0.6).setDepth(31);
    this.healthBar = scene.add.rectangle(this.x - 8, this.y - 10, 16, 3, 0x6fe36f, 1).setOrigin(0, 0.5).setDepth(32);
    this.selectionRing = scene.add.circle(this.x, this.y, 10, 0xffffff, 0).setStrokeStyle(1.5, 0xf7e8b0, 1).setDepth(29);
    this.selectionRing.setVisible(false);
  }

  setRole(role) {
    this.role = role;
    this.def = ANT_TYPES[role];
    this.maxHealth = this.def.health;
    this.health = Math.min(this.health, this.maxHealth);
    this.speed = this.def.speed;
    this.carry = this.def.carry;
    this.damage = this.def.damage;
    this.vision = this.def.vision;
    this.sprite.fillColor = this.def.color;
    this.state = "idle";
    this.target = null;
    this.path = [];
  }

  getTilePos() {
    return {
      tx: Phaser.Math.Clamp(Math.floor(this.x / TILE_SIZE), 0, MAP_WIDTH - 1),
      ty: Phaser.Math.Clamp(Math.floor(this.y / TILE_SIZE), 0, MAP_HEIGHT - 1)
    };
  }

  moveToTile(tx, ty) {
    const from = this.getTilePos();
    this.path = this.scene.pathfinder.findPath(from.tx, from.ty, tx, ty);
    this.pathIndex = 0;
    if (this.path.length > 1) this.state = "moving";
  }

  update(dt) {
    if (this.health <= 0) {
      this.destroy();
      return;
    }

    this.attackCooldown -= dt;
    this.taskCooldown -= dt;

    if (this.moveTarget) {
      this.moveToTile(this.moveTarget.tx, this.moveTarget.ty);
      this.moveTarget = null;
    }

    switch (this.state) {
      case "idle":
        this.findTask();
        break;
      case "moving":
        this.followPath(dt);
        break;
      case "foraging":
        this.doForage(dt);
        break;
      case "returning":
        this.returnFood(dt);
        break;
      case "fighting":
        this.doFight(dt);
        break;
      case "nursing":
        this.doNursing(dt);
        break;
      case "scouting":
        this.doScouting(dt);
        break;
      case "digging":
        this.doDig(dt);
        break;
    }

    this.selectionRing.setPosition(this.x, this.y);
    this.sprite.setPosition(this.x, this.y);
    this.healthBarBg.setPosition(this.x, this.y - 11);
    this.healthBar.setPosition(this.x - 8, this.y - 11);
    this.healthBar.width = 16 * (this.health / this.maxHealth);
    this.selectionRing.setVisible(this.selected);
    this.scene.revealAround(this, this.vision);
  }

  followPath(dt) {
    if (!this.path || this.path.length <= 1 || this.pathIndex >= this.path.length) {
      this.state = "idle";
      return;
    }

    const node = this.path[this.pathIndex];
    const targetX = node.x * TILE_SIZE + TILE_SIZE / 2;
    const targetY = node.y * TILE_SIZE + TILE_SIZE / 2;

    const ang = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const move = this.speed * this.scene.getGameSpeed() * dt;
    this.x += Math.cos(ang) * move;
    this.y += Math.sin(ang) * move;

    this.sprite.scaleX = Math.cos(this.scene.time.now * 0.01) < 0 ? 0.95 : 1.05;
    this.sprite.scaleY = Math.sin(this.scene.time.now * 0.012) < 0 ? 0.95 : 1.05;

    if (Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY) < 4) {
      this.tx = node.x;
      this.ty = node.y;
      this.pathIndex++;
      if (this.pathIndex >= this.path.length) {
        this.state = "idle";
      }
    }
  }

  findTask() {
    if (this.taskCooldown > 0) return;

    const threat = this.scene.enemyManager.findNearestEnemy(this.x, this.y, this.role === ROLE.SOLDIER ? 250 : 110);
    if (threat && (this.role === ROLE.SOLDIER || this.role === ROLE.WORKER)) {
      this.target = threat;
      this.state = "fighting";
      return;
    }

    if (this.role === ROLE.WORKER) {
      if (this.scene.pendingDigOrders.length > 0) {
        this.target = this.scene.pendingDigOrders.shift();
        this.moveToTile(this.target.tx, this.target.ty);
        this.state = "digging";
        return;
      }
      const food = this.scene.findNearestFood(this.x, this.y);
      if (food) {
        this.target = food;
        this.moveToTile(food.tx, food.ty);
        this.state = "foraging";
        return;
      }
    }

    if (this.role === ROLE.SOLDIER) {
      const entry = this.scene.entranceTile;
      const patrolX = entry.tx + Phaser.Math.Between(-3, 3);
      const patrolY = entry.ty + Phaser.Math.Between(-2, 3);
      this.moveToTile(clamp(patrolX, 0, MAP_WIDTH - 1), clamp(patrolY, 0, MAP_HEIGHT - 1));
      this.taskCooldown = 1.5;
      return;
    }

    if (this.role === ROLE.NURSE) {
      const brood = Phaser.Utils.Array.GetRandom(this.scene.roomManager.broodRooms());
      if (brood) {
        const c = brood.center();
        this.moveToTile(c.tx, c.ty);
        this.state = "nursing";
        return;
      }
    }

    if (this.role === ROLE.SCOUT) {
      this.state = "scouting";
      const tx = Phaser.Math.Between(1, MAP_WIDTH - 2);
      const ty = Phaser.Math.Between(1, SURFACE_ROWS + 6);
      if (this.scene.isWalkable(tx, ty)) this.moveToTile(tx, ty);
      return;
    }

    this.taskCooldown = 0.8;
  }

  doForage() {
    if (!this.target || !this.scene.foodSources.includes(this.target)) {
      this.state = "idle";
      this.target = null;
      return;
    }
    if (distance(this, this.target) < 10) {
      const amount = Math.min(this.carry, this.target.amount);
      this.carryingFood = amount;
      this.target.amount -= amount;
      this.scene.audio.collect();
      this.scene.spawnFoodParticles(this.target.x, this.tar