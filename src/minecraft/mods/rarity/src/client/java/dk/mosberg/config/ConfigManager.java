package dk.mosberg.config;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import net.fabricmc.loader.api.FabricLoader;

import java.nio.file.Files;
import java.nio.file.Path;

public class ConfigManager {
  private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
  private static final Path CONFIG_DIR = FabricLoader.getInstance().getConfigDir().resolve("rarity");
  private static final Path CONFIG_FILE = CONFIG_DIR.resolve("rarity-config.json");
  private static RarityConfig config;

  public static RarityConfig loadConfig() {
    try {
      CONFIG_DIR.toFile().mkdirs();

      if (Files.exists(CONFIG_FILE)) {
        String json = Files.readString(CONFIG_FILE);
        config = GSON.fromJson(json, RarityConfig.class);
      } else {
        config = new RarityConfig();
        config.initializeDefaults();
        saveConfig();
      }
    } catch (Exception e) {
      e.printStackTrace();
      config = new RarityConfig();
      config.initializeDefaults();
    }
    return config;
  }

  public static void saveConfig() {
    try {
      CONFIG_DIR.toFile().mkdirs();
      String json = GSON.toJson(config);
      Files.writeString(CONFIG_FILE, json);
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  public static RarityConfig getConfig() {
    return config != null ? config : loadConfig();
  }
}
