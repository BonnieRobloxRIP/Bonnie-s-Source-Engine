import { EasingType } from "@minecraft/server";
import { AMMO_ITEM } from "./ammo_system.js";
import { createMagazineWeapon } from "./magazine_weapon.js";
import { WEAPON_ACTION, getMainhandTypeId, getWeaponAction, isSneaking, pruneStalePlayerState, registerWeaponTick } from "./weapon_common.js";

// .357 Magnum: fires on press; clicking with an empty cylinder reloads automatically.
// Sneaking holds the centerfire stance (its own fire sound and animations).
createMagazineWeapon({
    itemId: "brr:magnum357",
    retiredItemIds: ["brr:magnum357_empty"],
    ammoIds: [AMMO_ITEM.MAGNUM],
    magSize: 6,
    hudLabel: ".357",
    damage: 12,
    range: 128,
    refireTicks: 6,
    reloadTicks: 87,
    reloadAction: WEAPON_ACTION.MAGNUM_RELOAD,
    autoReloadOnEmpty: true,
    sounds: {
        fire: "weapons.357.fire",
        fireSneaking: "weapons.357.centerfire",
        // No revolver dry-fire click in the pack yet; the Glock's click stands in (was the tau's beep).
        empty: "weapons.glock.empty",
        reload: "weapons.357.reload",
        reloadEmpty: "weapons.357.reload"
    },
    trail: { particle: "minecraft:basic_smoke_particle", fallbackParticle: "minecraft:basic_flame_particle", step: 0.2, maxPoints: 380 },
    legacyRoundsProperty: "brr_magnum_loaded_rounds"
});

// SECTION: Centerfire zoom
// Like Black Mesa, the centerfire stance (sneaking) narrows the field of view while the sights sit on the crosshair.
const CENTERFIRE_FOV = 55;
const DEFAULT_FOV = 70;
const ZOOM_EASE = { easeTime: 0.2, easeType: EasingType.OutQuad }; // Black Mesa's idle-to-center takes 0.2 s
const zoomedPlayers = new Map();

function setZoom(player, zoomed) {
    try {
        if (zoomed) player.camera.setFov({ fov: CENTERFIRE_FOV, easeOptions: ZOOM_EASE });
        else player.runCommand("camera @s fov_clear 0.2 out_quad"); // back to the player's own FOV setting
    } catch {
        // fov_clear unavailable: fall back to the default field of view rather than staying zoomed
        try {
            if (!zoomed) player.camera.setFov({ fov: DEFAULT_FOV, easeOptions: ZOOM_EASE });
        } catch {}
    }
    zoomedPlayers.set(player.id, zoomed);
}

registerWeaponTick((players, tick, onlinePlayers) => {
    for (const player of players) {
        const zoomed = getMainhandTypeId(player) === "brr:magnum357" && isSneaking(player)
            && getWeaponAction(player) !== WEAPON_ACTION.MAGNUM_RELOAD;
        if ((zoomedPlayers.get(player.id) ?? false) !== zoomed) setZoom(player, zoomed);
    }
    if (zoomedPlayers.size > 0) pruneStalePlayerState([zoomedPlayers], onlinePlayers);
});
