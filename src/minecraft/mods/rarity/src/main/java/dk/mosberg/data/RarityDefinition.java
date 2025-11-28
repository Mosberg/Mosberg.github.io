package dk.mosberg.data;

import com.google.gson.annotations.SerializedName;

public record RarityDefinition(
    @SerializedName("$id") String schemaId,
    java.util.List<Rarity> rarities) {
  public record Rarity(
      String id,
      String name,
      String color,
      String description,
      Assets assets,
      DropRates dropRates) {
    public String description() {
      return description;
    } // ← PUBLIC GETTER

    public record Assets(String icon, String frame) {
    }

    public record DropRates(double crafting, double drop, double loot) {
    }
  }
}
