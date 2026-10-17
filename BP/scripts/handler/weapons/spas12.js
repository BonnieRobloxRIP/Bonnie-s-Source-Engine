import { AMMO_ITEM } from "./ammo_system.js";
import { createMagazineWeapon } from "./magazine_weapon.js";

// Black Mesa / Half-Life shotgun (SPAS-12): left click fires one shell (6 pellets), right click both barrels
// (2 shells, 12 pellets; with one shell left it fires that one). Each shot is followed by the pump. Sneak + right
// click reloads one shell at a time; clicking fire mid-reload stops it after the current shell and fires.
// 2 damage per pellet, added up per target and dealt as one hit: up to 12 for a single shot, 24 for both barrels.
// Timings are Black Mesa's animation lengths (v_shotgun): fire 0.3 s + pump 0.53 s, double fire with the pump cutting
// in at 0.5 s (Half-Life's pump time), idle -> shell 0.5 s, one shell 0.67 s, shell -> idle 0.47 s (+ pump from empty).
const SINGLE = { rounds: 1, pellets: 6, spreadDegrees: 5, damage: 2, refireTicks: 17, sound: "weapons.shotgun.single", signal: "shot" };
const DOUBLE = { rounds: 2, pellets: 12, spreadDegrees: 5, damage: 2, refireTicks: 21, sound: "weapons.shotgun.double", signal: "double", fallback: SINGLE };

createMagazineWeapon({
    itemId: "brr:spas12",
    ammoIds: [AMMO_ITEM.BUCKSHOT],
    magSize: 8,
    hudLabel: "buckshot",
    range: 32,
    fireModes: { attack: SINGLE, use: DOUBLE },
    shellReload: { startTicks: 10, shellTicks: 13.4, endTicks: 9, pumpTicks: 11 },
    sneakUseReloads: true,
    autoReloadOnEmpty: true,
    sounds: {
        empty: "weapons.shotgun.empty"
    },
    trail: { particle: "minecraft:basic_smoke_particle", fallbackParticle: "minecraft:basic_flame_particle", step: 0.35, maxPoints: 260, pelletMaxPoints: 40 }
});
