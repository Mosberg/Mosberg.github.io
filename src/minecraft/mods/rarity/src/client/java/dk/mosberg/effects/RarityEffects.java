package dk.mosberg.effects;

import dk.mosberg.config.ConfigManager;
import net.minecraft.client.MinecraftClient;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.util.math.Vec3d;

public class RarityEffects {

  // ✅ Spawn glow particles around rarity items
  public static void spawnGlowParticles(Vec3d pos, String rarityId, int count) {
    if (!ConfigManager.getConfig().effectSettings.particlesEnabled) {
      return;
    }

    var client = MinecraftClient.getInstance();
    if (client.world == null)
      return;

    for (int i = 0; i < count; i++) {
      double offsetX = (Math.random() - 0.5) * 0.5;
      double offsetY = Math.random() * 0.3;
      double offsetZ = (Math.random() - 0.5) * 0.5;

      double velX = (Math.random() - 0.5) * 0.1;
      double velY = Math.random() * 0.1;
      double velZ = (Math.random() - 0.5) * 0.1;

      // ✅ Use ParticleManager (public API)
      client.particleManager.addParticle(
          ParticleTypes.ENCHANT,
          pos.x + offsetX,
          pos.y + offsetY,
          pos.z + offsetZ,
          velX, velY, velZ);
    }
  }

  // Get color for rarity
  public static int getRarityColor(String rarityId) {
    return switch (rarityId) {
      case "trash" -> 0x808080; // Gray
      case "common" -> 0xFFFFFF; // White
      case "uncommon" -> 0x00FF00; // Green
      case "rare" -> 0x0000FF; // Blue
      case "epic" -> 0xFF00FF; // Purple
      case "legendary" -> 0xFFAA00; // Orange
      case "mythic" -> 0xFF0000; // Red
      case "divine" -> 0xFFFF00; // Yellow
      case "celestial" -> 0x00FFFF; // Cyan
      case "transcendent" -> 0xFF69B4; // Pink
      case "ancient" -> 0x8B4513; // Brown
      case "owner" -> 0x00000022; // Transparent Black
      default -> 0xFFFFFF;
    };
  }
}
