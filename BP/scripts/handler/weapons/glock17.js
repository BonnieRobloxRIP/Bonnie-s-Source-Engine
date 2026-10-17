import { AMMO_ITEM } from "./ammo_system.js";
import { createMagazineWeapon } from "./magazine_weapon.js";
import { WEAPON_ACTION } from "./weapon_common.js";

// Half-Life Glock: a tap fires one accurate shot (0.3 s refire); holding the button keeps firing faster
// (0.2 s) with a small random spread. Sneak + use reloads.
createMagazineWeapon({
    itemId: "brr:glock17",
    retiredItemIds: ["brr:glock17_empty"],
    ammoIds: [AMMO_ITEM.NINE_MM],
    magSize: 17,
    hudLabel: "9mm",
    damage: 2,
    range: 48,
    refireTicks: 6,
    rapidFire: { delayTicks: 6, intervalTicks: 4, spreadDegrees: 5 },
    reloadTicks: 50,
    reloadAction: WEAPON_ACTION.RELOAD,
    sneakUseReloads: true,
    sounds: {
        fire: "weapons.glock.fire",
        empty: "weapons.glock.empty",
        reload: "weapons.glock.reload",
        reloadEmpty: "weapons.glock.reload_empty"
    },
    trail: { particle: "minecraft:basic_smoke_particle", fallbackParticle: "minecraft:basic_flame_particle", step: 0.2, maxPoints: 260 },
    legacyRoundsProperty: "brr_glock_loaded_rounds"
});
