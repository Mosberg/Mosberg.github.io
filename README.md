# Mosberg.github.io

[Mosberg Github.io Page](https://mosberg.github.io/)

[Fresh Windows Installation](https://mosberg.github.io/src/fresh-windows/)


I'll create these four manager classes for your Minecraft 1.21.10 Fabric mod. Here's the complete implementation:

## 1. NbtManager.java

```java
package net.yourmod.nbt;

import net.minecraft.nbt.NbtCompound;
import net.minecraft.nbt.NbtElement;
import net.minecraft.nbt.NbtList;
import net.minecraft.nbt.NbtString;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.BlockPos;
import net.minecraft.item.ItemStack;
import net.minecraft.entity.player.PlayerEntity;

import java.util.UUID;

public class NbtManager {
    
    // Key constants for NBT data
    public static final String CUSTOM_DATA_KEY = "YourModData";
    public static final String RARITY_KEY = "Rarity";
    public static final String OWNER_KEY = "Owner";
    public static final String CREATION_TIME_KEY = "CreationTime";
    public static final String CUSTOM_TAGS_KEY = "CustomTags";
    
    /**
     * Gets or creates the mod's custom NBT compound for an item
     */
    public static NbtCompound getOrCreateCustomNbt(ItemStack stack) {
        NbtCompound nbt = stack.getOrCreateNbt();
        if (!nbt.contains(CUSTOM_DATA_KEY)) {
            nbt.put(CUSTOM_DATA_KEY, new NbtCompound());
        }
        return nbt.getCompound(CUSTOM_DATA_KEY);
    }
    
    /**
     * Sets rarity for an item
     */
    public static void setRarity(ItemStack stack, String rarity) {
        NbtCompound customNbt = getOrCreateCustomNbt(stack);
        customNbt.putString(RARITY_KEY, rarity);
    }
    
    /**
     * Gets rarity from an item
     */
    public static String getRarity(ItemStack stack) {
        NbtCompound customNbt = getOrCreateCustomNbt(stack);
        return customNbt.getString(RARITY_KEY);
    }
    
    /**
     * Sets owner for an item
     */
    public static void setOwner(ItemStack stack, PlayerEntity player) {
        NbtCompound customNbt = getOrCreateCustomNbt(stack);
        NbtCompound ownerData = new NbtCompound();
        ownerData.putUuid("UUID", player.getUuid());
        ownerData.putString("Name", player.getName().getString());
        customNbt.put(OWNER_KEY, ownerData);
    }
    
    /**
     * Gets owner UUID from an item
     */
    public static UUID getOwnerUuid(ItemStack stack) {
        NbtCompound customNbt = getOrCreateCustomNbt(stack);
        if (customNbt.contains(OWNER_KEY)) {
            NbtCompound ownerData = customNbt.getCompound(OWNER_KEY);
            return ownerData.getUuid("UUID");
        }
        return null;
    }
    
    /**
     * Adds a custom tag to an item
     */
    public static void addCustomTag(ItemStack stack, String tag) {
        NbtCompound customNbt = getOrCreateCustomNbt(stack);
        NbtList tags = customNbt.getList(CUSTOM_TAGS_KEY, NbtElement.STRING_TYPE);
        if (!containsTag(tags, tag)) {
            tags.add(NbtString.of(tag));
            customNbt.put(CUSTOM_TAGS_KEY, tags);
        }
    }
    
    /**
     * Removes a custom tag from an item
     */
    public static void removeCustomTag(ItemStack stack, String tag) {
        NbtCompound customNbt = getOrCreateCustomNbt(stack);
        if (customNbt.contains(CUSTOM_TAGS_KEY)) {
            NbtList tags = customNbt.getList(CUSTOM_TAGS_KEY, NbtElement.STRING_TYPE);
            NbtList newTags = new NbtList();
            
            for (NbtElement element : tags) {
                String currentTag = element.asString();
                if (!currentTag.equals(tag)) {
                    newTags.add(element);
                }
            }
            
            customNbt.put(CUSTOM_TAGS_KEY, newTags);
        }
    }
    
    /**
     * Checks if an item has a specific tag
     */
    public static boolean hasCustomTag(ItemStack stack, String tag) {
        NbtCompound customNbt = getOrCreateCustomNbt(stack);
        if (customNbt.contains(CUSTOM_TAGS_KEY)) {
            NbtList tags = customNbt.getList(CUSTOM_TAGS_KEY, NbtElement.STRING_TYPE);
            return containsTag(tags, tag);
        }
        return false;
    }
    
    private static boolean containsTag(NbtList tags, String tag) {
        for (NbtElement element : tags) {
            if (element.asString().equals(tag)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Saves BlockPos to NBT
     */
    public static void writeBlockPos(NbtCompound nbt, BlockPos pos, String key) {
        NbtCompound posNbt = new NbtCompound();
        posNbt.putInt("x", pos.getX());
        posNbt.putInt("y", pos.getY());
        posNbt.putInt("z", pos.getZ());
        nbt.put(key, posNbt);
    }
    
    /**
     * Reads BlockPos from NBT
     */
    public static BlockPos readBlockPos(NbtCompound nbt, String key) {
        if (nbt.contains(key)) {
            NbtCompound posNbt = nbt.getCompound(key);
            return new BlockPos(
                posNbt.getInt("x"),
                posNbt.getInt("y"),
                posNbt.getInt("z")
            );
        }
        return null;
    }
}
```

## 2. ConfigManager.java

```java
package net.yourmod.config;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import net.fabricmc.loader.api.FabricLoader;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

public class ConfigManager {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final Path CONFIG_PATH = FabricLoader.getInstance().getConfigDir().resolve("yourmod.json");
    
    private ConfigData configData;
    
    public ConfigManager() {
        loadConfig();
    }
    
    public static class ConfigData {
        public boolean enableRaritySystem = true;
        public Map<String, Integer> rarityWeights = new HashMap<>();
        public int defaultRarityWeight = 100;
        public boolean logDebugMessages = false;
        public String defaultRarity = "COMMON";
        
        public ConfigData() {
            // Default rarity weights
            rarityWeights.put("COMMON", 60);
            rarityWeights.put("UNCOMMON", 25);
            rarityWeights.put("RARE", 10);
            rarityWeights.put("EPIC", 4);
            rarityWeights.put("LEGENDARY", 1);
        }
    }
    
    /**
     * Loads configuration from file
     */
    public void loadConfig() {
        try {
            if (Files.exists(CONFIG_PATH)) {
                String json = Files.readString(CONFIG_PATH);
                configData = GSON.fromJson(json, ConfigData.class);
            } else {
                configData = new ConfigData();
                saveConfig();
            }
        } catch (IOException e) {
            System.err.println("Failed to load config: " + e.getMessage());
            configData = new ConfigData();
        }
    }
    
    /**
     * Saves configuration to file
     */
    public void saveConfig() {
        try {
            String json = GSON.toJson(configData);
            Files.createDirectories(CONFIG_PATH.getParent());
            Files.writeString(CONFIG_PATH, json);
        } catch (IOException e) {
            System.err.println("Failed to save config: " + e.getMessage());
        }
    }
    
    /**
     * Gets the configuration data
     */
    public ConfigData getConfig() {
        return configData;
    }
    
    /**
     * Gets weight for a specific rarity
     */
    public int getRarityWeight(String rarity) {
        return configData.rarityWeights.getOrDefault(rarity.toUpperCase(), configData.defaultRarityWeight);
    }
    
    /**
     * Checks if rarity system is enabled
     */
    public boolean isRaritySystemEnabled() {
        return configData.enableRaritySystem;
    }
    
    /**
     * Checks if debug logging is enabled
     */
    public boolean isDebugEnabled() {
        return configData.logDebugMessages;
    }
    
    /**
     * Gets default rarity
     */
    public String getDefaultRarity() {
        return configData.defaultRarity;
    }
    
    /**
     * Updates configuration
     */
    public void updateConfig(ConfigData newConfig) {
        this.configData = newConfig;
        saveConfig();
    }
}
```

## 3. RarityManager.java

```java
package net.yourmod.rarity;

import net.yourmod.config.ConfigManager;
import net.minecraft.item.ItemStack;
import net.minecraft.util.math.random.Random;

import java.util.*;

public class RarityManager {
    private final ConfigManager configManager;
    private final Random random;
    private final Map<String, Rarity> rarities;
    
    public RarityManager(ConfigManager configManager) {
        this.configManager = configManager;
        this.random = Random.create();
        this.rarities = new LinkedHashMap<>();
        initializeRarities();
    }
    
    public static class Rarity {
        private final String name;
        private final int weight;
        private final int color;
        private final String displayName;
        
        public Rarity(String name, int weight, int color, String displayName) {
            this.name = name;
            this.weight = weight;
            this.color = color;
            this.displayName = displayName;
        }
        
        public String getName() { return name; }
        public int getWeight() { return weight; }
        public int getColor() { return color; }
        public String getDisplayName() { return displayName; }
    }
    
    private void initializeRarities() {
        // Define rarities with default values
        addRarity("COMMON", 0x888888, "Common");
        addRarity("UNCOMMON", 0x55FF55, "Uncommon");
        addRarity("RARE", 0x5555FF, "Rare");
        addRarity("EPIC", 0xAA00AA, "Epic");
        addRarity("LEGENDARY", 0xFFAA00, "Legendary");
    }
    
    private void addRarity(String name, int color, String displayName) {
        int weight = configManager.getRarityWeight(name);
        rarities.put(name, new Rarity(name, weight, color, displayName));
    }
    
    /**
     * Gets a random rarity based on configured weights
     */
    public Rarity getRandomRarity() {
        if (!configManager.isRaritySystemEnabled()) {
            return getRarity(configManager.getDefaultRarity());
        }
        
        int totalWeight = rarities.values().stream()
            .mapToInt(Rarity::getWeight)
            .sum();
        
        int randomValue = random.nextInt(totalWeight);
        int currentWeight = 0;
        
        for (Rarity rarity : rarities.values()) {
            currentWeight += rarity.getWeight();
            if (randomValue < currentWeight) {
                return rarity;
            }
        }
        
        return getRarity(configManager.getDefaultRarity());
    }
    
    /**
     * Gets a specific rarity by name
     */
    public Rarity getRarity(String name) {
        return rarities.get(name.toUpperCase());
    }
    
    /**
     * Gets all available rarities
     */
    public Collection<Rarity> getAllRarities() {
        return rarities.values();
    }
    
    /**
     * Gets rarity names
     */
    public Set<String> getRarityNames() {
        return rarities.keySet();
    }
    
    /**
     * Applies rarity to an item stack
     */
    public void applyRarityToItem(ItemStack stack, Rarity rarity) {
        net.yourmod.nbt.NbtManager.setRarity(stack, rarity.getName());
        
        // You can add additional rarity-related modifications here
        // For example, adding lore, modifying attributes, etc.
    }
    
    /**
     * Gets rarity from an item stack
     */
    public Rarity getRarityFromItem(ItemStack stack) {
        String rarityName = net.yourmod.nbt.NbtManager.getRarity(stack);
        if (rarityName.isEmpty()) {
            return null;
        }
        return getRarity(rarityName);
    }
    
    /**
     * Updates rarity weights from config
     */
    public void updateRarityWeights() {
        for (String rarityName : rarities.keySet()) {
            int weight = configManager.getRarityWeight(rarityName);
            Rarity oldRarity = rarities.get(rarityName);
            rarities.put(rarityName, new Rarity(
                oldRarity.getName(),
                weight,
                oldRarity.getColor(),
                oldRarity.getDisplayName()
            ));
        }
    }
}
```

## 4. CommandsManager.java

```java
package net.yourmod.commands;

import com.mojang.brigadier.CommandDispatcher;
import com.mojang.brigadier.arguments.StringArgumentType;
import com.mojang.brigadier.context.CommandContext;
import net.minecraft.command.CommandRegistryAccess;
import net.minecraft.server.command.CommandManager;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;
import net.yourmod.config.ConfigManager;
import net.yourmod.rarity.RarityManager;
import net.minecraft.item.ItemStack;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.server.network.ServerPlayerEntity;

import static net.minecraft.server.command.CommandManager.*;

public class CommandsManager {
    private final ConfigManager configManager;
    private final RarityManager rarityManager;
    
    public CommandsManager(ConfigManager configManager, RarityManager rarityManager) {
        this.configManager = configManager;
        this.rarityManager = rarityManager;
    }
    
    public void registerCommands(CommandDispatcher<ServerCommandSource> dispatcher, CommandRegistryAccess registryAccess) {
        dispatcher.register(literal("yourmod")
            .then(literal("reload")
                .requires(source -> source.hasPermissionLevel(2))
                .executes(this::reloadConfig)
            )
            .then(literal("rarity")
                .then(argument("rarity", StringArgumentType.word())
                    .suggests((context, builder) -> {
                        for (String rarity : rarityManager.getRarityNames()) {
                            builder.suggest(rarity);
                        }
                        return builder.buildFuture();
                    })
                    .executes(this::setItemRarity)
                )
            )
            .then(literal("info")
                .executes(this::showModInfo)
            )
            .then(literal("debug")
                .requires(source -> source.hasPermissionLevel(2))
                .then(literal("toggle")
                    .executes(this::toggleDebug)
                )
            )
        );
    }
    
    private int reloadConfig(CommandContext<ServerCommandSource> context) {
        configManager.loadConfig();
        rarityManager.updateRarityWeights();
        context.getSource().sendFeedback(() -> 
            Text.literal("Configuration reloaded successfully!").formatted(Formatting.GREEN),
            false
        );
        return 1;
    }
    
    private int setItemRarity(CommandContext<ServerCommandSource> context) {
        ServerPlayerEntity player = context.getSource().getPlayer();
        if (player == null) {
            context.getSource().sendError(Text.literal("This command can only be used by players"));
            return 0;
        }
        
        String rarityName = StringArgumentType.getString(context, "rarity");
        RarityManager.Rarity rarity = rarityManager.getRarity(rarityName);
        
        if (rarity == null) {
            context.getSource().sendError(Text.literal("Invalid rarity: " + rarityName));
            return 0;
        }
        
        ItemStack heldItem = player.getMainHandStack();
        if (heldItem.isEmpty()) {
            context.getSource().sendError(Text.literal("You must be holding an item"));
            return 0;
        }
        
        rarityManager.applyRarityToItem(heldItem, rarity);
        context.getSource().sendFeedback(() -> 
            Text.literal("Set item rarity to: ").formatted(Formatting.GREEN)
                .append(Text.literal(rarity.getDisplayName()).formatted(Formatting.valueOf(rarityName))),
            false
        );
        
        return 1;
    }
    
    private int showModInfo(CommandContext<ServerCommandSource> context) {
        ConfigManager.ConfigData config = configManager.getConfig();
        
        context.getSource().sendFeedback(() -> 
            Text.literal("=== YourMod Information ===").formatted(Formatting.GOLD), false);
        
        context.getSource().sendFeedback(() -> 
            Text.literal("Rarity System: ").formatted(Formatting.WHITE)
                .append(Text.literal(config.enableRaritySystem ? "Enabled" : "Disabled")
                    .formatted(config.enableRaritySystem ? Formatting.GREEN : Formatting.RED)), false);
        
        context.getSource().sendFeedback(() -> 
            Text.literal("Debug Mode: ").formatted(Formatting.WHITE)
                .append(Text.literal(config.logDebugMessages ? "Enabled" : "Disabled")
                    .formatted(config.logDebugMessages ? Formatting.GREEN : Formatting.RED)), false);
        
        context.getSource().sendFeedback(() -> 
            Text.literal("Available Rarities:").formatted(Formatting.YELLOW), false);
        
        for (RarityManager.Rarity rarity : rarityManager.getAllRarities()) {
            context.getSource().sendFeedback(() -> 
                Text.literal("  " + rarity.getDisplayName() + " (" + rarity.getName() + ")")
                    .formatted(Formatting.valueOf(rarity.getName()))
                    .append(Text.literal(" - Weight: " + rarity.getWeight()).formatted(Formatting.GRAY)),
                false
            );
        }
        
        return 1;
    }
    
    private int toggleDebug(CommandContext<ServerCommandSource> context) {
        ConfigManager.ConfigData config = configManager.getConfig();
        config.logDebugMessages = !config.logDebugMessages;
        configManager.updateConfig(config);
        
        context.getSource().sendFeedback(() -> 
            Text.literal("Debug mode ").formatted(Formatting.WHITE)
                .append(Text.literal(config.logDebugMessages ? "enabled" : "disabled")
                    .formatted(config.logDebugMessages ? Formatting.GREEN : Formatting.RED)),
            false
        );
        
        return 1;
    }
}
```

## Usage Example in Your Mod Initializer:

```java
package net.yourmod;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.yourmod.config.ConfigManager;
import net.yourmod.commands.CommandsManager;
import net.yourmod.rarity.RarityManager;

public class YourMod implements ModInitializer {
    private ConfigManager configManager;
    private RarityManager rarityManager;
    private CommandsManager commandsManager;
    
    @Override
    public void onInitialize() {
        // Initialize managers
        configManager = new ConfigManager();
        rarityManager = new RarityManager(configManager);
        commandsManager = new CommandsManager(configManager, rarityManager);
        
        // Register commands
        CommandRegistrationCallback.EVENT.register((dispatcher, registryAccess, environment) -> {
            commandsManager.registerCommands(dispatcher, registryAccess);
        });
        
        System.out.println("YourMod initialized successfully!");
    }
    
    public ConfigManager getConfigManager() {
        return configManager;
    }
    
    public RarityManager getRarityManager() {
        return rarityManager;
    }
}
```

These classes provide a comprehensive system for managing NBT data, configuration, rarities, and commands in your Minecraft 1.21.10 Fabric mod. The system is modular and easily extensible for your specific needs.