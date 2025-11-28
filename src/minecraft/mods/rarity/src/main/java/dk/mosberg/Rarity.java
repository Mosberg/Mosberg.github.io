package dk.mosberg;

import dk.mosberg.component.RarityComponent;
import dk.mosberg.data.RarityManager;
import net.fabricmc.api.ModInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Rarity implements ModInitializer {
	public static final String MOD_ID = "rarity";
	public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

	@Override
	public void onInitialize() {
		RarityComponent.RARITY.toString();
		RarityManager.getInstance();

		LOGGER.info("Rarity mod initialized successfully!");
	}
}
