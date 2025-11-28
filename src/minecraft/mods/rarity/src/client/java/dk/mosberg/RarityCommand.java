package dk.mosberg;

import com.mojang.brigadier.CommandDispatcher;
import com.mojang.brigadier.arguments.StringArgumentType;
import com.mojang.brigadier.suggestion.SuggestionProvider;
import dk.mosberg.data.RarityManager;
import dk.mosberg.util.RarityAssigner;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.minecraft.command.CommandSource;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.text.Text;

import java.util.Map;

import static net.minecraft.server.command.CommandManager.argument;
import static net.minecraft.server.command.CommandManager.literal;

public class RarityCommand {
  private static final int PERMISSION_LEVEL = 2;
  private static final String RARITY_ARG = "rarity";
  private static final String ITEM_ARG = "item";
  private static final String PLAYER_ARG = "player";

  // ✅ Command suggestions for rarities
  private static final SuggestionProvider<ServerCommandSource> RARITY_SUGGESTIONS = (context, builder) -> CommandSource
      .suggestMatching(
          RarityManager.getInstance().getAllRarities().keySet(), builder);

  public static void register() {
    CommandRegistrationCallback.EVENT.register(
        (dispatcher, registryAccess, environment) -> registerServerCommands(dispatcher));
  }

  private static void registerServerCommands(CommandDispatcher<ServerCommandSource> dispatcher) {
    dispatcher.register(
        literal("rarity")
            .requires(source -> source.hasPermissionLevel(PERMISSION_LEVEL))
            .then(buildHelpCommand())
            .then(buildListCommand())
            .then(buildInfoCommand())
            .then(buildGiveCommand())
            .then(buildCheckCommand())
            .then(buildRemoveCommand())
            .then(buildReloadCommand())
            .then(buildStatsCommand()));
  }

  // ✅ HELP: Show all commands
  private static com.mojang.brigadier.builder.LiteralArgumentBuilder<ServerCommandSource> buildHelpCommand() {
    return literal("help")
        .executes(ctx -> showHelp(ctx.getSource()));
  }

  // ✅ LIST: Show all rarities or specific details
  private static com.mojang.brigadier.builder.LiteralArgumentBuilder<ServerCommandSource> buildListCommand() {
    return literal("list")
        .executes(ctx -> listAllRarities(ctx.getSource()))
        .then(argument(RARITY_ARG, StringArgumentType.word())
            .suggests(RARITY_SUGGESTIONS)
            .executes(ctx -> listRarityDetails(ctx.getSource(),
                StringArgumentType.getString(ctx, RARITY_ARG))));
  }

  // ✅ INFO: Get detailed rarity information
  private static com.mojang.brigadier.builder.LiteralArgumentBuilder<ServerCommandSource> buildInfoCommand() {
    return literal("info")
        .then(argument(RARITY_ARG, StringArgumentType.word())
            .suggests(RARITY_SUGGESTIONS)
            .executes(ctx -> showRarityInfo(ctx.getSource(),
                StringArgumentType.getString(ctx, RARITY_ARG))));
  }

  // ✅ GIVE: Give rarity item to self or another player
  private static com.mojang.brigadier.builder.LiteralArgumentBuilder<ServerCommandSource> buildGiveCommand() {
    return literal("give")
        .then(argument(RARITY_ARG, StringArgumentType.word())
            .suggests(RARITY_SUGGESTIONS)
            .then(argument(ITEM_ARG, StringArgumentType.word())
                .executes(ctx -> giveRarityToSelf(ctx.getSource(),
                    StringArgumentType.getString(ctx, RARITY_ARG),
                    StringArgumentType.getString(ctx, ITEM_ARG)))
                .then(argument(PLAYER_ARG, StringArgumentType.word())
                    .executes(ctx -> giveRarityToPlayer(ctx.getSource(),
                        StringArgumentType.getString(ctx, RARITY_ARG),
                        StringArgumentType.getString(ctx, ITEM_ARG),
                        StringArgumentType.getString(ctx, PLAYER_ARG))))));
  }

  // ✅ CHECK: Check current held item's rarity
  private static com.mojang.brigadier.builder.LiteralArgumentBuilder<ServerCommandSource> buildCheckCommand() {
    return literal("check")
        .executes(ctx -> checkHeldItem(ctx.getSource()));
  }

  // ✅ REMOVE: Remove rarity from items
  private static com.mojang.brigadier.builder.LiteralArgumentBuilder<ServerCommandSource> buildRemoveCommand() {
    return literal("remove")
        .executes(ctx -> removeRarityFromMainHand(ctx.getSource()))
        .then(literal("all")
            .executes(ctx -> removeRarityFromAll(ctx.getSource())));
  }

  // ✅ RELOAD: Reload configuration
  private static com.mojang.brigadier.builder.LiteralArgumentBuilder<ServerCommandSource> buildReloadCommand() {
    return literal("reload")
        .requires(source -> source.hasPermissionLevel(3))
        .executes(ctx -> reloadConfig(ctx.getSource()));
  }

  // ✅ STATS: View rarity stats
  private static com.mojang.brigadier.builder.LiteralArgumentBuilder<ServerCommandSource> buildStatsCommand() {
    return literal("stats")
        .executes(ctx -> showAllStats(ctx.getSource()))
        .then(argument(RARITY_ARG, StringArgumentType.word())
            .suggests(RARITY_SUGGESTIONS)
            .executes(ctx -> showRarityStats(ctx.getSource(),
                StringArgumentType.getString(ctx, RARITY_ARG))));
  }

  // Command implementations
  private static int showHelp(ServerCommandSource source) {
    source.sendFeedback(() -> Text.literal("\n§6=== Rarity Command Help ==="), true);
    source.sendFeedback(() -> Text.literal("§a/rarity list§f - List all rarities"), false);
    source.sendFeedback(() -> Text.literal("§a/rarity list <rarity>§f - Get rarity details"), false);
    source.sendFeedback(() -> Text.literal("§a/rarity info <rarity>§f - Show rarity info"), false);
    source.sendFeedback(() -> Text.literal("§a/rarity check§f - Check held item"), false);
    source.sendFeedback(() -> Text.literal("§a/rarity give <rarity> <item>§f - Give to self"), false);
    source.sendFeedback(() -> Text.literal("§a/rarity give <rarity> <item> <player>§f - Give to player"), false);
    source.sendFeedback(() -> Text.literal("§a/rarity remove§f - Remove main hand rarity"), false);
    source.sendFeedback(() -> Text.literal("§a/rarity remove all§f - Remove all rarities"), false);
    source.sendFeedback(() -> Text.literal("§a/rarity stats§f - Show all stats"), false);
    source.sendFeedback(() -> Text.literal("§a/rarity reload§f - Reload config (OP)"), false);
    return 1;
  }

  private static int listAllRarities(ServerCommandSource source) {
    Map<String, ?> rarities = RarityManager.getInstance().getAllRarities();
    source.sendFeedback(() -> Text.literal("§6Loaded rarities (§a" + rarities.size() + "§6):"), false);
    rarities.keySet().forEach(name -> source.sendFeedback(() -> Text.literal("  §a◆ §f" + name), false));
    return 1;
  }

  private static int listRarityDetails(ServerCommandSource source, String rarityId) {
    var rarity = RarityManager.getInstance().getRarity(rarityId);
    if (rarity == null) {
      source.sendError(Text.literal("§cRarity '" + rarityId + "' not found!"));
      return 0;
    }
    source.sendFeedback(() -> Text.literal("§6=== " + rarityId + " ==="), false);
    source.sendFeedback(() -> Text.literal("§fName: §a" + rarity.name()), false);
    source.sendFeedback(() -> Text.literal("§fColor: §a" + rarity.color()), false);
    return 1;
  }

  private static int showRarityInfo(ServerCommandSource source, String rarityId) {
    return listRarityDetails(source, rarityId);
  }

  private static int giveRarityToSelf(ServerCommandSource source, String rarityId, String itemId) {
    var player = source.getPlayer();
    if (player == null)
      return 0;
    return giveRarityToPlayerByName(source, player.getName().getString(), rarityId, itemId);
  }

  private static int giveRarityToPlayer(ServerCommandSource source, String rarityId, String itemId, String playerName) {
    return giveRarityToPlayerByName(source, playerName, rarityId, itemId);
  }

  private static int giveRarityToPlayerByName(ServerCommandSource source, String playerName, String rarityId,
      String itemId) {
    var server = source.getServer();
    ServerPlayerEntity player = server.getPlayerManager().getPlayer(playerName);

    if (player == null) {
      source.sendError(Text.literal("§cPlayer '" + playerName + "' not found!"));
      return 0;
    }

    RarityAssigner.giveRarityItem(player, rarityId, itemId);
    source.sendFeedback(() -> Text.literal("§a✦ Gave §6" + rarityId + " " + itemId + "§a to §6" + playerName), false);
    player.sendMessage(Text.literal("§a✦ You received §6" + rarityId + " " + itemId), false);
    return 1;
  }

  private static int checkHeldItem(ServerCommandSource source) {
    var player = source.getPlayer();
    if (player == null)
      return 0;

    ItemStack held = player.getMainHandStack();
    if (held.isEmpty()) {
      source.sendFeedback(() -> Text.literal("§cYou're not holding anything!"), false);
      return 0;
    }

    var rarityComp = held.get(dk.mosberg.component.RarityComponent.RARITY);
    if (rarityComp == null) {
      source.sendFeedback(() -> Text.literal("§cThis item has no rarity!"), false);
      return 0;
    }

    source.sendFeedback(() -> Text.literal("§a✦ Held item: §6" + rarityComp.rarityId()), false);
    return 1;
  }

  private static int removeRarityFromMainHand(ServerCommandSource source) {
    var player = source.getPlayer();
    if (player == null)
      return 0;

    ItemStack mainHand = player.getMainHandStack();
    RarityAssigner.clearRarity(mainHand);
    source.sendFeedback(() -> Text.literal("§aCleared rarity from main hand"), false);
    return 1;
  }

  private static int reloadConfig(ServerCommandSource source) {
    // No direct reload hook on RarityManager yet; just inform the user.
    source.sendFeedback(
        () -> Text.literal("§e/rarity reload is not implemented yet. Use /reload to reload data packs if needed."),
        false);
    return 1;
  }

  private static int showAllStats(ServerCommandSource source) {
    source.sendFeedback(() -> Text.literal("§6=== Rarity Stats ==="), false);
    RarityManager.getInstance().getAllRarities()
        .forEach((name, rarity) -> source.sendFeedback(() -> Text.literal("§a" + name + "§f: 5% boost"), false));
    return 1;
  }

  private static int showRarityStats(ServerCommandSource source, String rarityId) {
    var rarity = RarityManager.getInstance().getRarity(rarityId);
    if (rarity == null) {
      source.sendError(Text.literal("§cRarity not found!"));
      return 0;
    }
    source.sendFeedback(() -> Text.literal("§6Stats for §a" + rarityId), false);
    source.sendFeedback(() -> Text.literal("§f Damage: §a+5%"), false);
    source.sendFeedback(() -> Text.literal("§f Speed: §a+3%"), false);
    source.sendFeedback(() -> Text.literal("§f Luck: §a+2%"), false);
    return 1;
  }

  private static int removeRarityFromAll(ServerCommandSource source) {
    var player = source.getPlayer();
    if (player == null)
      return 0;

    var inventory = player.getInventory();
    int removed = 0;
    for (int i = 0; i < inventory.size(); i++) {
      ItemStack stack = inventory.getStack(i);
      if (!stack.isEmpty()) {
        RarityAssigner.clearRarity(stack);
        removed++;
      }
    }

    // ✅ Capture in final variable for lambda
    final int finalRemoved = removed;
    source.sendFeedback(() -> Text.literal("§aRemoved rarities from §6" + finalRemoved + "§a items"), false);
    return 1;
  }

}
