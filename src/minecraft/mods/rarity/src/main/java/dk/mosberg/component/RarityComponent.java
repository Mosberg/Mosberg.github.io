package dk.mosberg.component;

import com.mojang.serialization.Codec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import dk.mosberg.Rarity;
import net.minecraft.component.ComponentType;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

public record RarityComponent(String rarityId) {
        public static final Codec<RarityComponent> CODEC = RecordCodecBuilder.create(instance -> instance
                        .group(Codec.STRING.fieldOf("rarityId").forGetter(RarityComponent::rarityId))
                        .apply(instance, RarityComponent::new));

        public static final ComponentType<RarityComponent> RARITY = Registry.register(
                        Registries.DATA_COMPONENT_TYPE,
                        Identifier.of(Rarity.MOD_ID, "rarity"),
                        new ComponentType.Builder<RarityComponent>()
                                        .codec(CODEC)
                                        .build());
}
