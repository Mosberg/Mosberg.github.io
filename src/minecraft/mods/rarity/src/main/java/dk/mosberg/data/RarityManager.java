package dk.mosberg.data;

import com.google.gson.Gson;
import dk.mosberg.Rarity;

import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.Map;

public class RarityManager {
  private static final Gson GSON = new Gson();
  private static final RarityManager INSTANCE = new RarityManager();
  private final Map<String, RarityDefinition.Rarity> rarities = new HashMap<>();

  private RarityManager() {
    loadRarities();
  }

  public static RarityManager getInstance() {
    return INSTANCE;
  }

  private void loadRarities() {
    try (var reader = new InputStreamReader(
        getClass().getClassLoader().getResourceAsStream("data/rarity/rarities/rarities.json"))) {

      RarityDefinition definition = GSON.fromJson(reader, RarityDefinition.class);
      if (definition != null && definition.rarities() != null) {
        for (RarityDefinition.Rarity rarity : definition.rarities()) {
          rarities.put(rarity.id(), rarity);
        }
      }
      Rarity.LOGGER.info("Loaded {} rarities from rarities.json", rarities.size());
    } catch (Exception e) {
      Rarity.LOGGER.error("Failed to load rarities.json", e);
    }
  }

  public RarityDefinition.Rarity getRarity(String id) {
    return rarities.get(id);
  }

  public Map<String, RarityDefinition.Rarity> getAllRarities() {
    return Map.copyOf(rarities);
  }
}
