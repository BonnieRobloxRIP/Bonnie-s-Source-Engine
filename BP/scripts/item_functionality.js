import { ItemStack, system, world } from "@minecraft/server";
import { AIR, invalidateBlock, isPassableDecorType } from "./core/block_cache.js";
import { clearCharacterControl, hitCharacter, setCharacterControl, trackedCharacters } from "./characters/registry.js";
import { isBigDoorType, isDoorType, lockDoorGroup, openDoorAt, SMALL_DOOR_CLOSE_DELAY_TICKS } from "./doors.js";
import { claimLight, releaseLight } from "./core/light_registry.js";
import { gameTick, isPaused } from "./core/pause.js";
import { giveToHotbar } from "./core/hotbar.js";
import { setSpeedFactor } from "./core/player_speed.js";
import { placePolishMarker } from "./polish_marker.js";
import { teleportToRandomCowSpot } from "./characters/polish_cow.js";
import { ALARM_ITEM_ID, placeAlarmClock } from "./alarm_clock.js";

const BSODA_ID = "brr:item_bsoda";
const CRANBERRY_ID = "brr:item_sprite_cranberry";
const GLOCK_ID = "brr:item_glock";
const FIREWORK_ID = "brr:item_firework";
// blocks per tick, moved in half-block steps so walls and Raldi are never skipped
const FIREWORK_SPEED = 1.0;
const FIREWORK_STEP = 0.5;
const ORNAMENT_ID = "brr:item_ornament";
const COW_MARKER_ID = "brr:item_cowmarker";
const MEDKIT_ID = "brr:item_medkit";
const LOCK_ID = "brr:item_lock";
const POLISH_MILK_ID = "brr:item_polish_milk";
const USABLE_ITEMS = [BSODA_ID, CRANBERRY_ID, GLOCK_ID, FIREWORK_ID, ORNAMENT_ID, COW_MARKER_ID, MEDKIT_ID, LOCK_ID, POLISH_MILK_ID, ALARM_ITEM_ID];
const LOCK_REACH = 5;
const LOCK_RAY_STEP = 0.2;
// length of the waterslurp sound
const POLISH_MILK_DRINK_TICKS = 20;
const FIREWORK_EXPLODE_PARTICLE = "brr:firework_explode";
const ORNAMENT_PROJECTILE_RANGE = 10;
const ORNAMENT_SLOW_DURATION_TICKS = 200;
const ORNAMENT_SLOW_MULTIPLIER = 0.75;
// the ornament's falling speed is only saved this often; a reload mid-flight just resumes a bit off
const ORNAMENT_FLIGHT_SAVE_TICKS = 5;
const AMMO_OBJECTIVE_ID = "glock_ammo";
const BULLET_LIGHT_ID = "brr:glock_bullet_light";
const PROJECTILE_RANGE = 80;
const BULLET_TARGETS = new Set(["brr:raldi", "brr:mrbeast", "brr:vanman"]);
const PROJECTILE_TYPES = {
    soda: "brr:bsoda_spray",
    cranberry: "brr:cranberry_spray",
    bullet: "brr:glock_bullet",
    firework: "brr:firework_rocket",
    ornament: "brr:ornament_projectile",
    pinto: "brr:pinto_bullet"
};

const projectiles = new Map();
const trackedEntityIds = new Set();
const FLIGHT_PROPERTY = "brr:flight";
const PROJECTILE_KINDS = new Set(["soda", "bullet", "firework", "ornament", "pinto"]);
const lastUseTicks = new Map();
const slowedCharacters = new Map();
const pintoSlowedPlayers = new Map();
// player id -> { player, teleportAt } while the polish milk is being drunk
const drinkingPolishMilk = new Map();
let breakWindows = () => false;
let nextProjectileId = 0;

function ammoObjective() {
    let objective = world.scoreboard.getObjective(AMMO_OBJECTIVE_ID);
    if (!objective) objective = world.scoreboard.addObjective(AMMO_OBJECTIVE_ID, "Glock Ammo");
    return objective;
}

function getAmmo(player) {
    try { return ammoObjective().getScore(player); } catch { return undefined; }
}

function setAmmo(player, amount) {
    try { ammoObjective().setScore(player, Math.max(0, amount)); } catch { }
}

function inventory(player) {
    return player.getComponent("minecraft:inventory")?.container;
}

function hasGlock(player) {
    const container = inventory(player);
    if (!container) return false;
    for (let slot = 0; slot < container.size; slot++) {
        if (container.getItem(slot)?.typeId === GLOCK_ID) return true;
    }
    return false;
}

function droppedAmmoKey(block) {
    const { x, y, z } = block.location;
    return `glock_ammo:${block.dimension.id}:${x},${y},${z}`;
}

// the dropper is the nearest player who just lost their last glock; their ammo moves onto the dropped block
export function stashDroppedGlockAmmo(block, dropLocation) {
    let dropper;
    let bestDistance = 36;
    for (const player of block.dimension.getPlayers({ location: dropLocation, maxDistance: 6 })) {
        if (hasGlock(player) || getAmmo(player) === undefined) continue;
        const dx = player.location.x - dropLocation.x;
        const dy = player.location.y - dropLocation.y;
        const dz = player.location.z - dropLocation.z;
        const distance = dx * dx + dy * dy + dz * dz;
        if (distance <= bestDistance) { bestDistance = distance; dropper = player; }
    }
    if (!dropper) return;
    world.setDynamicProperty(droppedAmmoKey(block), getAmmo(dropper));
    try { ammoObjective().removeParticipant(dropper); } catch { }
}

// "ammo" (they had one), "item" (into a free slot), "swapped" (all five full: swap() traded it for the
// selected item, whose block is now where the glock was), or false
export function pickupGlock(player, block, swap) {
    const key = droppedAmmoKey(block);
    const stored = world.getDynamicProperty(key);
    const ammo = typeof stored === "number" ? stored : 3;
    if (hasGlock(player)) {
        setAmmo(player, (getAmmo(player) ?? 3) + ammo);
        world.setDynamicProperty(key, undefined);
        return "ammo";
    }
    if (giveToHotbar(player, GLOCK_ID)) {
        world.setDynamicProperty(key, undefined);
        setAmmo(player, ammo);
        return "item";
    }
    world.setDynamicProperty(key, undefined);
    if (!swap?.()) {
        world.setDynamicProperty(key, stored);
        return false;
    }
    setAmmo(player, ammo);
    return "swapped";
}

// a glock handed out by a character: 3 more bullets if they already own one
export function grantGlock(player) {
    if (hasGlock(player)) {
        setAmmo(player, (getAmmo(player) ?? 3) + 3);
        return "ammo";
    }
    // no free slot: it drops, and becomes its item block (main.js)
    if (!giveToHotbar(player, GLOCK_ID)) player.dimension.spawnItem(new ItemStack(GLOCK_ID, 1), player.location);
    setAmmo(player, 3);
    return "item";
}

export function consumeSelected(player) {
    const container = inventory(player);
    const slot = player.selectedSlotIndex;
    const item = container?.getItem(slot);
    if (!item) return;
    if (item.amount > 1) {
        item.amount--;
        container.setItem(slot, item);
    } else {
        container.setItem(slot);
    }
}

function horizontalDirection(player) {
    const view = player.getViewDirection();
    let x = view.x;
    let z = view.z;
    let length = Math.hypot(x, z);
    if (length < 0.001) {
        const yaw = player.getRotation().y * Math.PI / 180;
        x = -Math.sin(yaw);
        z = Math.cos(yaw);
        length = 1;
    }
    return { x: x / length, z: z / length };
}

function spawnProjectile(player, typeId, speed, kind, direction = horizontalDirection(player)) {
    const start = {
        x: player.location.x + direction.x * 0.8,
        y: player.location.y + 1.05 + (kind === "ornament" ? direction.y * 0.8 : 0),
        z: player.location.z + direction.z * 0.8
    };
    const entity = player.dimension.spawnEntity(typeId, start);
    if (kind === "firework") {
        const yaw = Math.round(Math.atan2(-direction.x, direction.z) * 180 / Math.PI);
        try { entity.setProperty("brr:yaw", yaw); } catch { }
    }
    try {
        entity.setDynamicProperty(FLIGHT_PROPERTY, JSON.stringify({
            dx: direction.x, dy: direction.y ?? 0, dz: direction.z, speed, kind,
            ox: start.x, oy: start.y, oz: start.z, playerId: player.id
        }));
    } catch { }
    return trackProjectile(entity, direction, speed, kind, 0, (direction.y ?? 0) * speed, start, player.id);
}

export function firePintoShot(shooter, target) {
    const start = { x: shooter.location.x, y: shooter.location.y + 1.05, z: shooter.location.z };
    const dx = target.location.x - start.x;
    const dy = target.location.y + 1.1 - start.y;
    const dz = target.location.z - start.z;
    const length = Math.hypot(dx, dy, dz);
    if (length < 0.001) return;
    spawnProjectile(shooter, PROJECTILE_TYPES.pinto, 0.45, "pinto", {
        x: dx / length, y: dy / length, z: dz / length
    });
}

export function slowPlayerFromPinto(player) {
    pintoSlowedPlayers.set(player.id, { player, expiresAt: gameTick() + 200 });
    setSpeedFactor(player, "pinto", 0.2);
}

export function clearPintoSlow(player) {
    if (!pintoSlowedPlayers.delete(player.id)) return false;
    setSpeedFactor(player, "pinto", undefined);
    return true;
}

function updatePintoSlowedPlayers() {
    if (pintoSlowedPlayers.size === 0 || isPaused()) return;
    const tick = gameTick();
    for (const [id, state] of pintoSlowedPlayers) {
        if (!state.player.isValid) {
            pintoSlowedPlayers.delete(id);
            continue;
        }
        if (tick >= state.expiresAt) clearPintoSlow(state.player);
    }
}

function trackProjectile(entity, direction, speed, kind, travelled, verticalSpeed = (direction.y ?? 0) * speed,
    origin = entity.location, playerId) {
    const state = {
        id: ++nextProjectileId,
        entity,
        entityId: entity.id,
        dimension: entity.dimension,
        direction,
        speed,
        verticalSpeed,
        kind,
        playerId,
        origin: { x: origin.x, y: origin.y, z: origin.z },
        travelled,
        hitCharacters: new Set(),
        pushedCharacters: new Set()
    };
    projectiles.set(state.id, state);
    trackedEntityIds.add(entity.id);
    return state;
}

// projectiles saved with the world lose their script state; pick them back up from their flight data
function adoptProjectile(entity) {
    if (trackedEntityIds.has(entity.id)) return;
    let flight;
    try { flight = JSON.parse(entity.getDynamicProperty(FLIGHT_PROPERTY)); } catch { }
    if (!flight || !PROJECTILE_KINDS.has(flight.kind)) {
        try { entity.remove(); } catch { }
        return;
    }
    const origin = { x: flight.ox, y: flight.oy ?? entity.location.y, z: flight.oz };
    const travelled = Math.hypot(entity.location.x - origin.x, entity.location.y - origin.y,
        entity.location.z - origin.z);
    trackProjectile(entity, { x: flight.dx, y: flight.dy ?? 0, z: flight.dz }, flight.speed, flight.kind, travelled,
        flight.vy ?? (flight.dy ?? 0) * flight.speed, origin, flight.playerId);
}

function adoptAllProjectiles() {
    for (const dimensionId of ["overworld", "nether", "the_end"]) {
        let entities = [];
        try { entities = world.getDimension(dimensionId).getEntities({ families: ["brr_projectile"] }); } catch { }
        for (const entity of entities) adoptProjectile(entity);
    }
}

// horizontal half-size of a character's hit box; the van is far bigger than the billboard cast
const HIT_HALF_WIDTH = { "brr:vanman": 1.4 };

function overlapsCharacter(projectile, character) {
    const dx = character.location.x - projectile.location.x;
    const dz = character.location.z - projectile.location.z;
    const dy = character.location.y + 1 - projectile.location.y;
    const reach = HIT_HALF_WIDTH[character.typeId] ?? 0.7;
    return Math.abs(dx) <= reach && Math.abs(dz) <= reach && Math.abs(dy) <= 1.1;
}

function clearCharacterSpace(character, destination) {
    const x = Math.floor(destination.x);
    const z = Math.floor(destination.z);
    const doors = [];
    for (const y of [Math.floor(destination.y + 0.1), Math.floor(destination.y + 1.3)]) {
        let block;
        try { block = character.dimension.getBlock({ x, y, z }); } catch { }
        if (block && isDoorType(block.typeId)) { doors.push({ x, y, z }); continue; }
        if (!block || (!block.isAir && block.typeId !== AIR && !isPassableDecorType(block.typeId))) return false;
    }
    for (const location of doors) openDoorAt(character.dimension, location, SMALL_DOOR_CLOSE_DELAY_TICKS);
    return true;
}

function pushCharacter(projectile, character) {
    if (character.typeId === "brr:raldi" && character.getProperty("brr:visual") === 7) return;
    if (!projectile.pushedCharacters.has(character.id)) {
        projectile.pushedCharacters.add(character.id);
        setCharacterControl(character, projectile, (target) => {
            if (target.typeId === "brr:raldi" && target.getProperty("brr:visual") === 7) return false;
            if (!projectile.entity.isValid || projectile.travelled >= PROJECTILE_RANGE) return false;
            const offsetX = target.location.x - projectile.entity.location.x;
            const offsetZ = target.location.z - projectile.entity.location.z;
            const along = offsetX * projectile.direction.x + offsetZ * projectile.direction.z;
            const across = Math.abs(offsetX * projectile.direction.z - offsetZ * projectile.direction.x);
            if (along < -0.35 || along > 1.2 || across > 0.7) return false;

            const destination = {
                x: target.location.x + projectile.direction.x * projectile.speed,
                y: target.location.y,
                z: target.location.z + projectile.direction.z * projectile.speed
            };
            if (!clearCharacterSpace(target, destination)) return false;
            try { target.teleport(destination, { dimension: target.dimension }); } catch { return false; }
            return true;
        });
    }
}

function breakWindowsAlongBullet(state, location) {
    for (const y of [Math.floor(location.y), Math.floor(location.y) - 1]) {
        let block;
        try { block = state.dimension.getBlock({ x: Math.floor(location.x), y, z: Math.floor(location.z) }); } catch { }
        if (block?.typeId.includes("window")) breakWindows(block);
    }
}

function releaseProjectile(state) {
    clearBulletLight(state);
    for (const id of state.pushedCharacters) clearCharacterControl(id, state);
    state.pushedCharacters.clear();
    try { state.entity.remove(); } catch { }
    projectiles.delete(state.id);
    trackedEntityIds.delete(state.entityId);
}

// fireworks fly through decoration, open doors and broken glass but stop on anything else
function blocksFirework(block) {
    if (!block || block.isAir || block.isLiquid) return false;
    const id = block.typeId;
    if (id.endsWith("_light") || isPassableDecorType(id) || id.startsWith("brr:2d_") || id.startsWith("brr:item_")) return false;
    if (id.startsWith("brr:window_broke") || id === "brr:toilet_paper") return false;
    try {
        if (block.permutation.getState("brr:open") === true || block.permutation.getState("brr:broken") === true) return false;
    } catch { }
    return true;
}

function explodeFirework(state, location) {
    try { state.dimension.spawnParticle(FIREWORK_EXPLODE_PARTICLE, { x: location.x, y: location.y - 0.5, z: location.z }); } catch { }
    try { state.dimension.playSound("item.firework_explode", location); } catch { }
    releaseProjectile(state);
}

function ornamentDirection(player) {
    const view = player.getViewDirection();
    const length = Math.hypot(view.x, view.y, view.z);
    return { x: view.x / length, y: view.y / length, z: view.z / length };
}

function playOrnamentImpact(state, location) {
    try {
        state.dimension.playSound("entity.generic.splash", location);
    } catch (error) {
        console.warn(`[item] Ornament impact sound failed: ${error}`);
    }
    releaseProjectile(state);
}

function slowCharacter(character) {
    try {
        const movement = character.getComponent("minecraft:movement");
        if (!movement) {
            console.warn(`[item] Ornament hit ${character.typeId}, which has no movement component`);
            return;
        }
        const now = gameTick();
        let state = slowedCharacters.get(character.id);
        const currentValue = movement.currentValue;
        if (!state) {
            state = {
                entity: character,
                baseValue: currentValue,
                appliedValue: currentValue * ORNAMENT_SLOW_MULTIPLIER,
                expiresAt: now + ORNAMENT_SLOW_DURATION_TICKS
            };
            slowedCharacters.set(character.id, state);
        } else {
            if (Math.abs(currentValue - state.appliedValue) > 0.000001) state.baseValue = currentValue;
            state.expiresAt = Math.max(state.expiresAt, now + ORNAMENT_SLOW_DURATION_TICKS);
            state.appliedValue = state.baseValue * ORNAMENT_SLOW_MULTIPLIER;
        }
        movement.setCurrentValue(state.appliedValue);
    } catch (error) {
        console.warn(`[item] Failed to slow ornament target ${character.id}: ${error}`);
    }
}

function updateOrnament(state, entity) {
    const next = {
        x: entity.location.x + state.direction.x * state.speed,
        y: entity.location.y + state.verticalSpeed,
        z: entity.location.z + state.direction.z * state.speed
    };
    const delta = {
        x: next.x - entity.location.x,
        y: next.y - entity.location.y,
        z: next.z - entity.location.z
    };
    const stepLength = Math.hypot(delta.x, delta.y, delta.z);
    const remaining = ORNAMENT_PROJECTILE_RANGE - state.travelled;
    if (stepLength > remaining) {
        const scale = remaining / stepLength;
        next.x = entity.location.x + delta.x * scale;
        next.y = entity.location.y + delta.y * scale;
        next.z = entity.location.z + delta.z * scale;
    }

    let block;
    try {
        block = state.dimension.getBlock({ x: Math.floor(next.x), y: Math.floor(next.y), z: Math.floor(next.z) });
    } catch { }
    if (block && !block.isAir && !block.isLiquid) {
        playOrnamentImpact(state, entity.location);
        return;
    }

    try { entity.teleport(next, { dimension: state.dimension }); } catch { releaseProjectile(state); return; }
    state.travelled += Math.min(stepLength, remaining);
    state.verticalSpeed -= 0.02;
    state.flightTicks = (state.flightTicks ?? 0) + 1;
    if (state.flightTicks % ORNAMENT_FLIGHT_SAVE_TICKS === 0) {
        try {
            entity.setDynamicProperty(FLIGHT_PROPERTY, JSON.stringify({
                dx: state.direction.x, dy: state.direction.y, dz: state.direction.z,
                speed: state.speed, vy: state.verticalSpeed, kind: state.kind,
                ox: state.origin.x, oy: state.origin.y, oz: state.origin.z
            }));
        } catch { }
    }

    for (const character of trackedCharacters(state.dimension)) {
        if (!overlapsCharacter(entity, character)) continue;
        slowCharacter(character);
        playOrnamentImpact(state, entity.location);
        return;
    }
    for (const player of state.dimension.getPlayers({ location: next, maxDistance: 1.5 })) {
        if (!overlapsCharacter(entity, player)) continue;
        slowCharacter(player);
        playOrnamentImpact(state, entity.location);
        return;
    }
    if (state.travelled >= ORNAMENT_PROJECTILE_RANGE) releaseProjectile(state);
}

function updateSlowedCharacters() {
    if (slowedCharacters.size === 0 || isPaused()) return;
    const now = gameTick();
    for (const [id, state] of slowedCharacters) {
        if (!state.entity.isValid) {
            slowedCharacters.delete(id);
            continue;
        }
        try {
            const movement = state.entity.getComponent("minecraft:movement");
            if (!movement) {
                slowedCharacters.delete(id);
                continue;
            }
            const currentValue = movement.currentValue;
            if (now >= state.expiresAt) {
                if (Math.abs(currentValue - state.appliedValue) <= 0.000001) {
                    movement.setCurrentValue(state.baseValue);
                }
                slowedCharacters.delete(id);
                continue;
            }
            // still at the slowed value: nothing reset it, so there is nothing to re-apply
            if (Math.abs(currentValue - state.appliedValue) <= 0.000001) continue;
            state.baseValue = currentValue;
            state.appliedValue = state.baseValue * ORNAMENT_SLOW_MULTIPLIER;
            movement.setCurrentValue(state.appliedValue);
        } catch (error) {
            console.warn(`[item] Failed to maintain ornament slow effect for ${id}: ${error}`);
            slowedCharacters.delete(id);
        }
    }
}

function updateFirework(state, entity) {
    let moved = 0;
    let position = entity.location;
    while (moved < state.speed - 0.0001) {
        const step = Math.min(FIREWORK_STEP, state.speed - moved);
        moved += step;
        position = stepFirework(state, entity, position, step);
        if (!position) return;
    }
}

// returns the new position, or undefined once the firework has exploded
function stepFirework(state, entity, from, step) {
    const next = {
        x: from.x + state.direction.x * step,
        y: from.y,
        z: from.z + state.direction.z * step
    };
    let block;
    try { block = state.dimension.getBlock({ x: Math.floor(next.x), y: Math.floor(next.y), z: Math.floor(next.z) }); } catch { }
    if (blocksFirework(block)) {
        explodeFirework(state, from);
        return undefined;
    }
    try { entity.teleport(next, { dimension: state.dimension }); } catch { releaseProjectile(state); return undefined; }
    state.travelled += step;

    for (const character of trackedCharacters(state.dimension)) {
        if (character.typeId !== "brr:raldi" || !overlapsCharacter(entity, character)) continue;
        if (!hitCharacter(character, "firework", state)) continue;
        explodeFirework(state, next);
        return undefined;
    }
    if (state.travelled >= PROJECTILE_RANGE) {
        explodeFirework(state, next);
        return undefined;
    }
    return next;
}

function updatePintoProjectile(state, entity) {
    const next = {
        x: entity.location.x + state.direction.x * state.speed,
        y: entity.location.y + state.direction.y * state.speed,
        z: entity.location.z + state.direction.z * state.speed
    };

    for (const other of projectiles.values()) {
        if (other === state || other.kind !== "soda" || !other.entity.isValid) continue;
        const dx = other.entity.location.x - next.x;
        const dy = other.entity.location.y - next.y;
        const dz = other.entity.location.z - next.z;
        if (dx * dx + dy * dy + dz * dz > 0.7 * 0.7) continue;
        releaseProjectile(other);
        releaseProjectile(state);
        return;
    }

    let block;
    try {
        block = state.dimension.getBlock({
            x: Math.floor(next.x), y: Math.floor(next.y), z: Math.floor(next.z)
        });
    } catch { }
    if (block && !block.isAir && !block.isLiquid && !isPassableDecorType(block.typeId)) {
        releaseProjectile(state);
        return;
    }

    try { entity.teleport(next, { dimension: state.dimension }); }
    catch { releaseProjectile(state); return; }
    state.travelled += state.speed;

    for (const character of trackedCharacters(state.dimension)) {
        if (character.typeId !== "brr:raldi" || !overlapsCharacter(entity, character)) continue;
        hitCharacter(character, "pinto", state);
        releaseProjectile(state);
        return;
    }
    for (const player of state.dimension.getPlayers({ location: next, maxDistance: 1.5 })) {
        if (!overlapsCharacter(entity, player)) continue;
        slowPlayerFromPinto(player);
        releaseProjectile(state);
        return;
    }
    if (state.travelled >= PROJECTILE_RANGE) releaseProjectile(state);
}

function clearBulletLight(state) {
    const location = state.lightLocation;
    if (!location) return;
    releaseLight(state.dimension, location);
    try {
        const block = state.dimension.getBlock(location);
        if (block?.typeId === BULLET_LIGHT_ID) {
            block.setType(AIR);
            invalidateBlock(state.dimension, location);
        }
    } catch { }
    state.lightLocation = undefined;
}

function syncBulletLight(state) {
    const location = {
        x: Math.floor(state.entity.location.x),
        y: Math.floor(state.entity.location.y),
        z: Math.floor(state.entity.location.z)
    };
    const previous = state.lightLocation;
    if (previous?.x === location.x && previous?.y === location.y && previous?.z === location.z) return;
    clearBulletLight(state);
    try {
        const block = state.dimension.getBlock(location);
        if (!block || block.typeId !== AIR) return;
        block.setType(BULLET_LIGHT_ID);
        claimLight(state.dimension, location, state.entityId);
        invalidateBlock(state.dimension, location);
        state.lightLocation = location;
    } catch { }
}

function updateProjectile(state) {
    const entity = state.entity;
    if (!entity.isValid) {
        clearBulletLight(state);
        for (const id of state.pushedCharacters) clearCharacterControl(id, state);
        projectiles.delete(state.id);
        trackedEntityIds.delete(state.entityId);
        return;
    }
    if (state.kind === "firework") {
        updateFirework(state, entity);
        return;
    }
    if (state.kind === "ornament") {
        updateOrnament(state, entity);
        return;
    }
    if (state.kind === "pinto") {
        updatePintoProjectile(state, entity);
        return;
    }

    const next = {
        x: entity.location.x + state.direction.x * state.speed,
        y: entity.location.y,
        z: entity.location.z + state.direction.z * state.speed
    };
    try { entity.teleport(next, { dimension: state.dimension }); } catch { releaseProjectile(state); return; }
    state.travelled += state.speed;
    if (state.kind === "bullet") syncBulletLight(state);

    if (state.kind === "bullet") {
        breakWindowsAlongBullet(state, next);
        for (const character of trackedCharacters(state.dimension)) {
            if (!BULLET_TARGETS.has(character.typeId) || state.hitCharacters.has(character.id) || !overlapsCharacter(entity, character)) continue;
            if (!hitCharacter(character, "glock", state)) continue;
            state.hitCharacters.add(character.id);
            releaseProjectile(state);
            return;
        }
    } else {
        for (const character of trackedCharacters(state.dimension)) {
            if (state.pushedCharacters.has(character.id) || !overlapsCharacter(entity, character)) continue;
            pushCharacter(state, character);
        }
    }

    if (state.travelled >= PROJECTILE_RANGE) releaseProjectile(state);
}

// big swing doors auto-open when a player is near (and lose their hitbox), so look along the view ray instead of relying on the clicked block
function findTargetedSwingDoor(player, clickedBlock) {
    try { if (clickedBlock && isBigDoorType(clickedBlock.typeId)) return clickedBlock; } catch { }
    const dimension = player.dimension;
    const origin = player.getHeadLocation();
    const direction = player.getViewDirection();
    let lastKey;
    for (let distance = 0; distance <= LOCK_REACH; distance += LOCK_RAY_STEP) {
        const location = {
            x: Math.floor(origin.x + direction.x * distance),
            y: Math.floor(origin.y + direction.y * distance),
            z: Math.floor(origin.z + direction.z * distance)
        };
        const key = `${location.x},${location.y},${location.z}`;
        if (key === lastKey) continue;
        lastKey = key;
        let block;
        try { block = dimension.getBlock(location); } catch { return undefined; }
        if (!block) return undefined;
        const typeId = block.typeId;
        if (isBigDoorType(typeId)) return block;
        if (typeId !== AIR && !isDoorType(typeId) && !isPassableDecorType(typeId)) return undefined;
    }
    return undefined;
}

function useDoorLock(player, clickedBlock) {
    const door = findTargetedSwingDoor(player, clickedBlock);
    if (door && lockDoorGroup(door)) consumeSelected(player);
}

function drinkPolishMilk(player) {
    if (drinkingPolishMilk.has(player.id)) return;
    consumeSelected(player);
    try { player.dimension.playSound("item.waterslurp", player.location); } catch { }
    drinkingPolishMilk.set(player.id, { player, teleportAt: gameTick() + POLISH_MILK_DRINK_TICKS });
}

function updatePolishMilk() {
    if (drinkingPolishMilk.size === 0) return;
    const now = gameTick();
    for (const [id, entry] of drinkingPolishMilk) {
        if (!entry.player.isValid) {
            drinkingPolishMilk.delete(id);
            continue;
        }
        if (now < entry.teleportAt) continue;
        drinkingPolishMilk.delete(id);
        teleportToRandomCowSpot(entry.player);
    }
}

function performItemUse({ itemStack, source: player, block }) {
    if (!player || !USABLE_ITEMS.includes(itemStack.typeId)) return;

    if (itemStack.typeId === LOCK_ID) {
        useDoorLock(player, block);
        return;
    }

    if (itemStack.typeId === POLISH_MILK_ID) {
        drinkPolishMilk(player);
        return;
    }

    if (itemStack.typeId === ALARM_ITEM_ID) {
        if (placeAlarmClock(player)) consumeSelected(player);
        return;
    }

    if (itemStack.typeId === MEDKIT_ID) {
        if (clearPintoSlow(player)) consumeSelected(player);
        return;
    }

    if (itemStack.typeId === COW_MARKER_ID) {
        if (placePolishMarker(player)) consumeSelected(player);
        return;
    }

    if (itemStack.typeId === BSODA_ID || itemStack.typeId === CRANBERRY_ID) {
        const cranberry = itemStack.typeId === CRANBERRY_ID;
        spawnProjectile(player, cranberry ? PROJECTILE_TYPES.cranberry : PROJECTILE_TYPES.soda, 0.3, "soda");
        consumeSelected(player);
        player.dimension.playSound("item.soda", player.location);
        return;
    }

    if (itemStack.typeId === FIREWORK_ID) {
        spawnProjectile(player, PROJECTILE_TYPES.firework, FIREWORK_SPEED, "firework");
        consumeSelected(player);
        player.dimension.playSound("item.firework_shoot", player.location);
        return;
    }

    if (itemStack.typeId === ORNAMENT_ID) {
        spawnProjectile(player, PROJECTILE_TYPES.ornament, 1, "ornament", ornamentDirection(player));
        consumeSelected(player);
        try {
            player.dimension.playSound("entity.ender_pearl.throw", player.location);
        } catch (error) {
            console.warn(`[item] Ornament throw sound failed: ${error}`);
        }
        return;
    }

    let ammo = getAmmo(player);
    if (ammo === undefined) ammo = 3;
    if (ammo <= 0) {
        player.onScreenDisplay.setActionBar("Glock out of ammo");
        return;
    }
    setAmmo(player, ammo - 1);
    spawnProjectile(player, PROJECTILE_TYPES.bullet, 0.5, "bullet");
    player.dimension.playSound("item.shoot", player.location);
}

function useItem(event) {
    const { itemStack, source: player } = event;
    if (!player || !USABLE_ITEMS.includes(itemStack.typeId)) return;
    if (lastUseTicks.get(player.id) === system.currentTick) return;
    lastUseTicks.set(player.id, system.currentTick);
    performItemUse(event);
}

function useItemOnBefore(event) {
    const player = event.source;
    if (!player || !USABLE_ITEMS.includes(event.itemStack.typeId)) return;
    if (lastUseTicks.get(player.id) === system.currentTick) return;
    lastUseTicks.set(player.id, system.currentTick);
    const deferredEvent = { itemStack: event.itemStack, source: player, block: event.block };
    system.run(() => performItemUse(deferredEvent));
}

export function startItemFunctionality(options = {}) {
    breakWindows = options.breakWindowGroup ?? breakWindows;

    world.afterEvents.itemUse.subscribe(useItem);
    if (world.afterEvents.itemUseOn) world.afterEvents.itemUseOn.subscribe(useItem);
    else world.beforeEvents.itemUseOn?.subscribe(useItemOnBefore);

    world.afterEvents.entitySpawn.subscribe(({ entity }) => {
        if (entity.typeId !== "minecraft:item") return;
        try { entity.dimension.playSound("drop_item", entity.location); } catch { }
    });

    world.afterEvents.playerSpawn.subscribe(({ player }) => {
        system.run(() => {
            if (hasGlock(player) && getAmmo(player) === undefined) setAmmo(player, 3);
        });
    });

    system.run(() => {
        for (const player of world.getAllPlayers()) {
            if (hasGlock(player) && getAmmo(player) === undefined) setAmmo(player, 3);
        }
    });

    system.runInterval(() => {
        if (projectiles.size === 0 || isPaused()) return;
        for (const state of projectiles.values()) updateProjectile(state);
    }, 1);
    system.runInterval(updateSlowedCharacters, 1);
    system.runInterval(updatePintoSlowedPlayers, 1);
    system.runInterval(updatePolishMilk, 1);

    world.afterEvents.entityLoad.subscribe(({ entity }) => {
        try { if (entity.matches({ families: ["brr_projectile"] })) adoptProjectile(entity); } catch { }
    });
    system.run(adoptAllProjectiles);
    system.runInterval(adoptAllProjectiles, 40);
}