import { system, world } from "@minecraft/server";
import { getDisplayName, namesNeedHiding, onNameSettingsChanged } from "./username_mode.js";

// SECTION: Death Messages
// Vanilla death messages always print the real gamertag, which would undo hidden or randomized names
// and give invisible players away. While any of those settings is on, the showDeathMessages gamerule
// is turned off and the same messages are sent from here: the game's own translations ("%1$s was
// slain by %2$s", in each player's language) filled in with the names the settings allow. The
// gamerule is turned back on once the settings are back to normal. If a world already had death
// messages off, it is left alone and nothing is sent.

const REPLACED_PROPERTY = "brr_death_messages_replaced";

function syncDeathMessageRule() {
    try {
        const replaced = world.getDynamicProperty(REPLACED_PROPERTY) === true;
        if (namesNeedHiding() && !replaced && world.gameRules.showDeathMessages) {
            world.gameRules.showDeathMessages = false;
            world.setDynamicProperty(REPLACED_PROPERTY, true);
        } else if (!namesNeedHiding() && replaced) {
            world.gameRules.showDeathMessages = true;
            world.setDynamicProperty(REPLACED_PROPERTY, undefined);
        }
    } catch { }
}

onNameSettingsChanged(syncDeathMessageRule);

// SECTION: Invisibility
// Effects can be gone by the time the death event runs, so who was invisible is noted every few ticks.
const INVISIBILITY_SCAN_TICKS = 5;
const recentlyInvisible = new Set();

system.runInterval(() => {
    recentlyInvisible.clear();
    for (const player of world.getPlayers()) {
        try {
            if (player.getEffect("invisibility")) recentlyInvisible.add(player.id);
        } catch { }
    }
}, INVISIBILITY_SCAN_TICKS);

// SECTION: Message Building
// Damage cause -> [translation without a killer, translation with one]. Keys are from the game's
// en_US.lang; a missing "with killer" entry falls back to the plain one.
const CAUSE_KEYS = {
    anvil: ["death.attack.anvil"],
    blockExplosion: ["death.attack.explosion", "death.attack.explosion.player"],
    campfire: ["death.attack.inFire", "death.attack.inFire.player"],
    soulCampfire: ["death.attack.inFire", "death.attack.inFire.player"],
    fire: ["death.attack.inFire", "death.attack.inFire.player"],
    fireTick: ["death.attack.onFire", "death.attack.onFire.player"],
    contact: ["death.attack.cactus", "death.attack.cactus.player"],
    drowning: ["death.attack.drown", "death.attack.drown.player"],
    entityExplosion: ["death.attack.explosion", "death.attack.explosion.player"],
    fall: ["death.attack.fall", "death.fell.assist"],
    fallingBlock: ["death.attack.fallingBlock"],
    fireworks: ["death.attack.fireworks"],
    flyIntoWall: ["death.attack.flyIntoWall"],
    freezing: ["death.attack.freeze"],
    lava: ["death.attack.lava", "death.attack.lava.player"],
    lightning: ["death.attack.lightningBolt"],
    maceSmash: ["death.attack.generic", "death.attack.maceSmash.player"],
    magic: ["death.attack.magic", "death.attack.indirectMagic"],
    magma: ["death.attack.magma", "death.attack.magma.player"],
    sonicBoom: ["death.attack.sonicBoom", "death.attack.sonicBoom.player"],
    stalactite: ["death.attack.stalactite"],
    stalagmite: ["death.attack.stalagmite"],
    starve: ["death.attack.starve"],
    suffocation: ["death.attack.inWall"],
    thorns: ["death.attack.generic", "death.attack.thorns"],
    wither: ["death.attack.wither"]
};
const MELEE_CAUSES = new Set(["entityAttack", "charging", "ramAttack"]);
// Projectile entity -> translation (with its shooter); anything else counts as an arrow.
const PROJECTILE_KEYS = {
    "minecraft:thrown_trident": "death.attack.trident",
    "minecraft:fireball": "death.attack.fireball",
    "minecraft:small_fireball": "death.attack.fireball",
    "minecraft:llama_spit": "death.attack.spit",
    "minecraft:shulker_bullet": "death.attack.bullet",
    "minecraft:snowball": "death.attack.thrown",
    "minecraft:egg": "death.attack.thrown",
    "minecraft:ender_pearl": "death.attack.thrown"
};

function nameOf(entity) {
    if (entity.typeId === "minecraft:player") return { text: getDisplayName(entity, recentlyInvisible.has(entity.id)) };
    if (entity.nameTag) return { text: entity.nameTag };
    const id = entity.typeId.startsWith("minecraft:") ? entity.typeId.slice("minecraft:".length) : entity.typeId;
    return { translate: `entity.${id}.name` };
}

// Vanilla only names the weapon when it was renamed.
function renamedWeaponOf(entity) {
    try {
        const name = entity.getComponent("minecraft:equippable")?.getEquipment("Mainhand")?.nameTag;
        return name ? { text: name } : undefined;
    } catch {
        return undefined;
    }
}

function buildDeathMessage(victim, damageSource) {
    const cause = `${damageSource?.cause ?? ""}`;
    let killer = damageSource?.damagingEntity;
    if (killer?.id === victim.id) killer = undefined;
    try {
        if (killer && !killer.isValid) killer = undefined;
    } catch {
        killer = undefined;
    }

    let key;
    let weapon;
    if (killer && (MELEE_CAUSES.has(cause) || cause === "projectile")) {
        if (cause === "projectile") key = PROJECTILE_KEYS[damageSource.damagingProjectile?.typeId] ?? "death.attack.arrow";
        else key = killer.typeId === "minecraft:player" ? "death.attack.player" : "death.attack.mob";
        weapon = renamedWeaponOf(killer);
        if (weapon && ["death.attack.player", "death.attack.mob", "death.attack.arrow", "death.attack.thrown", "death.attack.fireball"].includes(key)) {
            key += ".item";
        } else {
            weapon = undefined;
        }
    } else {
        let below = false;
        try {
            below = victim.location.y < victim.dimension.heightRange.min;
        } catch { }
        const keys = below ? ["death.attack.outOfWorld"] : (CAUSE_KEYS[cause] ?? ["death.attack.generic"]);
        key = killer && keys[1] ? keys[1] : keys[0];
        if (key === keys[0]) killer = undefined;
    }

    const parts = [nameOf(victim)];
    if (killer) parts.push(nameOf(killer));
    if (weapon) parts.push(weapon);
    return { rawtext: [{ translate: key, with: { rawtext: parts } }] };
}

world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }) => {
    if (deadEntity?.typeId !== "minecraft:player") return;
    try {
        // Only while this module turned vanilla's messages off (and nobody turned them back on).
        if (world.getDynamicProperty(REPLACED_PROPERTY) !== true || world.gameRules.showDeathMessages) return;
        world.sendMessage(buildDeathMessage(deadEntity, damageSource));
    } catch (error) {
        console.warn(`[BSE] Death message failed: ${error}`);
    }
});
