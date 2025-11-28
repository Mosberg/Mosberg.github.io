package dk.mosberg.util;

import dk.mosberg.component.RarityComponent;
import dk.mosberg.data.RarityManager;
import net.minecraft.item.ItemStack;
import net.minecraft.registry.Registries;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;

public class RarityAssigner {
  public static void assignRarity(ItemStack stack, String rarityId) {
    var rarity = RarityManager.getInstance().getRarity(rarityId);
    if (rarity != null) {
      stack.set(RarityComponent.RARITY, new RarityComponent(rarityId));
    }
  }

  public static void clearRarity(ItemStack stack) {
    stack.remove(RarityComponent.RARITY);
  }

  public static String getRarityName(ItemStack stack) {
    var rarityComp = stack.get(RarityComponent.RARITY);
    if (rarityComp != null) {
      var rarity = RarityManager.getInstance().getRarity(rarityComp.rarityId());
      return rarity != null ? rarity.name() : "Unknown";
    }
    return "None";
  }

  public static void giveRarityItem(ServerPlayerEntity player, String rarityId, String itemId) {
    var rarity = RarityManager.getInstance().getRarity(rarityId);
    if (rarity == null) {
      player.sendMessage(Text.literal("Rarity '" + rarityId + "' not found!"), false);
      return;
    }

    ItemStack stack = new ItemStack(Registries.ITEM.get(Identifier.of(itemId)));
    assignRarity(stack, rarityId);

    // ✅ FIXED: 1.21.10 uses Components, not direct NBT
    if (player.getInventory().insertStack(stack)) {
      player.sendMessage(Text.literal("✦ Gave " + rarity.name() + " " + itemId), false);
    }
  }
}
