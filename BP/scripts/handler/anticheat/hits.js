import { world, EntityDamageCause } from "@minecraft/server";
import { reportBlocked } from "./common.js";

// SECTION: Melee Hits (Self Hit, Item Killer)
// Vanilla melee can't target yourself or a dropped item. Only plain melee is checked: an arrow you
// shoot straight up still hits you, and the weapon scripts never hit the shooter or dropped items.

const UNHITTABLE_TYPES = new Set(["minecraft:item", "minecraft:xp_orb"]);

world.beforeEvents.entityHurt.subscribe((event) => {
    if (event.cancel) return;

    const source = event.damageSource;
    if (source?.cause !== EntityDamageCause.entityAttack || source.damagingProjectile) return;

    const attacker = source.damagingEntity;
    if (attacker?.typeId !== "minecraft:player") return;

    const target = event.hurtEntity;
    if (target?.id === attacker.id) {
        event.cancel = true;
        reportBlocked(attacker, "Self Hit", "hit themselves");
    } else if (UNHITTABLE_TYPES.has(target?.typeId)) {
        event.cancel = true;
        reportBlocked(attacker, "Item Killer", `hit a dropped ${target.typeId === "minecraft:item" ? "item" : "XP orb"}`);
    }
});
