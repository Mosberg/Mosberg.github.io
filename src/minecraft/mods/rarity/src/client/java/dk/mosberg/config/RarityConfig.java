package dk.mosberg.config;

import java.util.HashMap;
import java.util.Map;

public class RarityConfig {
  // ✅ HUD Settings
  public static class HudSettings {
    public boolean enabled = true;
    public int posX = 0;
    public int posY = -22;
    public float scale = 1.0F;
    public boolean showGlow = true;
    public int glowLayers = 3;
  }

  // ✅ Effect Settings
  public static class EffectSettings {
    public boolean particlesEnabled = true;
    public boolean soundsEnabled = true;
    public boolean animationsEnabled = true;
    public float particleIntensity = 1.0F;
  }

  // ✅ Stat Settings
  public static class StatSettings {
    public Map<String, Float> damageBoost = new HashMap<>();
    public Map<String, Float> speedBoost = new HashMap<>();
    public Map<String, Float> luckBoost = new HashMap<>();
  }

  public HudSettings hudSettings = new HudSettings();
  public EffectSettings effectSettings = new EffectSettings();
  public StatSettings statSettings = new StatSettings();
  public boolean persistRarities = true;
  public boolean debugMode = false;

  // Initialize stat boosts
  public void initializeDefaults() {
    // Stat multipliers per rarity
    statSettings.damageBoost.put("trassh", 0.60F);
    statSettings.damageBoost.put("common", 1.02F);
    statSettings.damageBoost.put("uncommon", 1.05F);
    statSettings.damageBoost.put("rare", 1.08F);
    statSettings.damageBoost.put("epic", 1.12F);
    statSettings.damageBoost.put("legendary", 1.15F);
    statSettings.damageBoost.put("mythic", 1.20F);
    statSettings.damageBoost.put("ancient", 1.25F);
    statSettings.damageBoost.put("celestial", 1.35F);
    statSettings.damageBoost.put("divine", 1.45F);
    statSettings.damageBoost.put("transcendent", 1.16F);
    statSettings.damageBoost.put("owner", 10.00F);
  }
}
