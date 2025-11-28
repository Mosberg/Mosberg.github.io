package dk.mosberg;

import dk.mosberg.component.RarityComponent;
import dk.mosberg.config.ConfigManager;
import dk.mosberg.data.RarityManager;
import dk.mosberg.data.RarityDefinition;
import net.fabricmc.fabric.api.client.rendering.v1.hud.HudElement;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gl.RenderPipelines;
import net.minecraft.client.render.RenderTickCounter;
import net.minecraft.item.ItemStack;
import net.minecraft.util.Identifier;

public class RarityHudElement implements HudElement {
  private static final int BASE_FRAME_SIZE = 18;
  private static final int BASE_ICON_SIZE = 10;

  @Override
  public void render(DrawContext context, RenderTickCounter tickCounter) {
    // ✅ Check if HUD is enabled
    if (!ConfigManager.getConfig().hudSettings.enabled)
      return;

    var client = MinecraftClient.getInstance();
    if (client.player == null || client.player.isSpectator())
      return;

    int screenWidth = client.getWindow().getScaledWidth();
    int screenHeight = client.getWindow().getScaledHeight();

    // ✅ Use configurable positions and scale
    var hudConfig = ConfigManager.getConfig().hudSettings;
    int baseX = screenWidth / 2 + hudConfig.posX;
    int baseY = screenHeight + hudConfig.posY;
    float scale = hudConfig.scale;

    ItemStack mainHand = client.player.getMainHandStack();
    ItemStack offHand = client.player.getOffHandStack();

    renderOverlappingFrame(context, mainHand, (int) (baseX - 90 * scale), (int) (baseY * scale), scale);
    renderOverlappingFrame(context, offHand, (int) (baseX + 70 * scale), (int) (baseY * scale), scale);
  }

  private static void renderOverlappingFrame(DrawContext context, ItemStack stack, int x, int y, float scale) {
    RarityComponent rarityComp = stack.get(RarityComponent.RARITY);
    if (rarityComp == null)
      return;

    var rarity = RarityManager.getInstance().getRarity(rarityComp.rarityId());
    if (rarity == null || rarity.assets() == null)
      return;

    var hudConfig = ConfigManager.getConfig().hudSettings;

    // ✅ Configurable glow layers
    if (hudConfig.showGlow) {
      for (int layer = 0; layer < hudConfig.glowLayers; layer++) {
        renderFrame(context, rarity, x + layer - 1, y + layer - 1, scale);
      }
    }

    renderFrame(context, rarity, x, y, scale);
    renderIcon(context, rarity, (int) (x + 10 * scale), (int) (y + 2 * scale), scale);
  }

  private static void renderFrame(DrawContext context, RarityDefinition.Rarity rarity, int x, int y, float scale) {
    String frameId = rarity.assets().frame().replace("rarity:frames/", "");
    Identifier frameTex = Identifier.of("rarity", "textures/gui/frames/" + frameId + ".png");

    int size = (int) (BASE_FRAME_SIZE * scale);
    context.drawTexture(RenderPipelines.GUI_TEXTURED, frameTex, x, y, 0.0F, 0.0F, size, size, size, size);
  }

  private static void renderIcon(DrawContext context, RarityDefinition.Rarity rarity, int x, int y, float scale) {
    String iconId = rarity.assets().icon().replace("rarity:icons/", "");
    Identifier iconTex = Identifier.of("rarity", "textures/gui/icons/" + iconId + ".png");

    int size = (int) (BASE_ICON_SIZE * scale);
    context.drawTexture(RenderPipelines.GUI_TEXTURED, iconTex, x, y, 0.0F, 0.0F, size, size, size, size);
  }
}
