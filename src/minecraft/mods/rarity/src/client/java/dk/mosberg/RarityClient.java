package dk.mosberg;

import dk.mosberg.component.RarityComponent;
import dk.mosberg.data.RarityManager;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.item.v1.ItemTooltipCallback;
import net.fabricmc.fabric.api.client.rendering.v1.hud.HudElementRegistry;
import net.minecraft.item.ItemStack;
import net.minecraft.text.Style;
import net.minecraft.text.Text;
import net.minecraft.text.TextColor;
import net.minecraft.util.Formatting;
import net.minecraft.util.Identifier;

import java.util.List;

public class RarityClient implements ClientModInitializer {
	private static final Identifier RARITY_HUD_ID = Identifier.of("rarity", "rarity_hud");

	@Override
	public void onInitializeClient() {
		ItemTooltipCallback.EVENT.register(RarityClient::renderAdvancedTooltip);
		HudElementRegistry.addLast(RARITY_HUD_ID, new RarityHudElement());
		RarityCommand.register();
	}

	private static void renderAdvancedTooltip(ItemStack stack, Object context, Object tooltipType, List<Text> lines) {
		RarityComponent rarityComp = stack.get(RarityComponent.RARITY);
		if (rarityComp == null)
			return;

		var rarity = RarityManager.getInstance().getRarity(rarityComp.rarityId());
		if (rarity == null)
			return;

		int color = 0xFFFFFF;
		try {
			String colorHex = rarity.color().replace("#", "");
			color = Integer.parseInt(colorHex, 16);
		} catch (NumberFormatException ignored) {
		}

		Text rarityLine = Text.literal(" ")
				.append(Text.literal("◆").setStyle(Style.EMPTY.withColor(TextColor.fromRgb(color)).withBold(true)))
				.append(Text.literal(" " + rarity.name() + " ").setStyle(Style.EMPTY.withColor(TextColor.fromRgb(color))))
				.append(Text.literal(rarity.description()).formatted(Formatting.ITALIC, Formatting.GRAY));

		lines.add(0, rarityLine);
	}

}
