import { BlockPermutation, MolangVariableMap, system, world } from "@minecraft/server";
import { getCurrentTick, getHeadLocation } from "./weapon_common.js";

const AIR_TYPE_IDS = new Set(["minecraft:air", "minecraft:cave_air", "minecraft:void_air"]);
const pendingLightCleanupByKey = new Map();
const MAX_LIGHT_CLEANUP_ATTEMPTS = 1200;
// Pending flash lights are saved so ones placed right before the world closes are removed on next load.
const PENDING_LIGHTS_PROPERTY = "brr_weapon_flash_lights";
const PERSIST_INTERVAL_TICKS = 10;
let pendingLightsDirty = false;

function normalizeDimensionId(rawDimensionId) {
    const normalized = `${rawDimensionId ?? "overworld"}`.trim().toLowerCase();
    if (normalized.startsWith("minecraft:")) {
        return normalized.split(":")[1] || "overworld";
    }
    return normalized || "overworld";
}

function getDimensionById(rawDimensionId) {
    const normalized = normalizeDimensionId(rawDimensionId);
    try {
        return world.getDimension(normalized);
    } catch {
        try {
            return world.getDimension(`minecraft:${normalized}`);
        } catch {
            return null;
        }
    }
}

function lightCleanupKey(dimensionId, pos) {
    return `${normalizeDimensionId(dimensionId)}|${pos.x}|${pos.y}|${pos.z}`;
}

function isLightBlockType(typeId) {
    const normalized = `${typeId ?? ""}`.trim().toLowerCase();
    return normalized === "minecraft:light_block"
        || normalized.startsWith("minecraft:light_block_")
        || normalized === "light_block"
        || normalized.startsWith("light_block_")
        || normalized === "minecraft:light";
}

// Removes the flash light at pos, but only if it is still exactly the light we placed there.
function clearLightBlockAt(dimension, pos, placedTypeId) {
    if (!dimension || !pos) return false;

    let targetBlock;
    try {
        targetBlock = dimension.getBlock(pos);
    } catch {
        targetBlock = null;
    }

    if (!targetBlock) return false;

    const liveTypeId = `${targetBlock?.typeId ?? ""}`.trim().toLowerCase();
    if (!isLightBlockType(liveTypeId) || (placedTypeId && liveTypeId !== placedTypeId)) return true;

    try {
        targetBlock.setPermutation(BlockPermutation.resolve("minecraft:air"));
        return true;
    } catch { }

    try {
        targetBlock.setType("minecraft:air");
        return true;
    } catch { }

    return false;
}

function scheduleLightCleanup(rawDimensionId, pos, durationTicks, placedTypeId) {
    const safePos = floorVector(pos);
    const dueTick = getCurrentTick() + Math.max(1, Math.floor(durationTicks));
    const key = lightCleanupKey(rawDimensionId, safePos);

    pendingLightCleanupByKey.set(key, {
        dimensionId: normalizeDimensionId(rawDimensionId),
        pos: safePos,
        placedTypeId,
        dueTick,
        attempts: 0
    });
    pendingLightsDirty = true;
}

function persistPendingLights() {
    try {
        const tasks = [...pendingLightCleanupByKey.values()].map((task) => [task.dimensionId, task.pos.x, task.pos.y, task.pos.z, task.placedTypeId]);
        world.setDynamicProperty(PENDING_LIGHTS_PROPERTY, tasks.length ? JSON.stringify(tasks) : undefined);
    } catch { }
    pendingLightsDirty = false;
}

// Re-queue flash lights left over from the previous session for immediate cleanup.
system.run(() => {
    try {
        const raw = world.getDynamicProperty(PENDING_LIGHTS_PROPERTY);
        if (typeof raw !== "string") return;
        for (const [dimensionId, x, y, z, placedTypeId] of JSON.parse(raw)) {
            scheduleLightCleanup(dimensionId, { x, y, z }, 1, placedTypeId);
        }
    } catch { }
});

system.runInterval(() => {
    const tick = getCurrentTick();
    if (pendingLightsDirty && (tick % PERSIST_INTERVAL_TICKS) === 0) persistPendingLights();
    if (pendingLightCleanupByKey.size <= 0) return;

    for (const [key, task] of pendingLightCleanupByKey.entries()) {
        if (tick < Number(task?.dueTick ?? 0)) continue;

        const dimension = getDimensionById(task?.dimensionId);
        const cleared = dimension ? clearLightBlockAt(dimension, task?.pos, task?.placedTypeId) : false;
        task.attempts = Number(task?.attempts ?? 0) + 1;
        if (cleared || task.attempts >= MAX_LIGHT_CLEANUP_ATTEMPTS) {
            pendingLightCleanupByKey.delete(key);
            pendingLightsDirty = true;
        }
    }
}, 1);

function floorVector(vec) {
    return {
        x: Math.floor(Number(vec?.x) || 0),
        y: Math.floor(Number(vec?.y) || 0),
        z: Math.floor(Number(vec?.z) || 0)
    };
}

function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scale(vector, scalar) {
    return {
        x: vector.x * scalar,
        y: vector.y * scalar,
        z: vector.z * scalar
    };
}

export function spawnLinearTrail(dimension, origin, direction, length, options = {}) {
    if (!dimension || !origin || !direction) return;

    const safeLength = Math.max(0, Number(length) || 0);
    if (safeLength <= 0.01) return;

    const primaryParticle = `${options.primaryParticle ?? "minecraft:basic_flame_particle"}`.trim();
    const fallbackParticle = `${options.fallbackParticle ?? "minecraft:basic_smoke_particle"}`.trim();
    const step = Math.max(0.05, Number(options.step) || 0.18);
    const maxPoints = Math.max(1, Math.floor(Number(options.maxPoints) || 220));

    let usedParticle = primaryParticle;
    let failedPrimary = false;
    let points = 0;

    for (let distance = 0.05; distance <= safeLength && points < maxPoints; distance += step) {
        const point = add(origin, scale(direction, distance));

        if (!failedPrimary && usedParticle) {
            try {
                dimension.spawnParticle(usedParticle, point);
                points++;
                continue;
            } catch {
                failedPrimary = true;
            }
        }

        if (!fallbackParticle) {
            points++;
            continue;
        }

        try {
            dimension.spawnParticle(fallbackParticle, point);
        } catch { }

        points++;
    }
}

export function spawnImpactParticle(dimension, location, options = {}) {
    if (!dimension || !location) return;

    const primaryParticle = `${options.primaryParticle ?? "minecraft:basic_flame_particle"}`.trim();
    const fallbackParticle = `${options.fallbackParticle ?? "minecraft:basic_smoke_particle"}`.trim();

    if (primaryParticle) {
        try {
            dimension.spawnParticle(primaryParticle, location);
            return;
        } catch { }
    }

    if (!fallbackParticle) return;

    try {
        dimension.spawnParticle(fallbackParticle, location);
    } catch { }
}

// SECTION: Bullet impacts
// A small burst of debris off the face a bullet hit, tinted like the block (RP/particles/weapons/bullet_impact).
const BULLET_IMPACT_PARTICLE = "brr:bullet_impact";
const FACE_NORMALS = {
    Up: { x: 0, y: 1, z: 0 }, Down: { x: 0, y: -1, z: 0 },
    North: { x: 0, y: 0, z: -1 }, South: { x: 0, y: 0, z: 1 },
    East: { x: 1, y: 0, z: 0 }, West: { x: -1, y: 0, z: 0 }
};
// fallback colours by block name when the block has no map colour
const MATERIAL_COLORS = [
    [/grass|leaves|moss|vine|cactus/, [0.36, 0.55, 0.24]],
    [/dirt|mud|podzol|farmland|path/, [0.47, 0.33, 0.22]],
    [/log|wood|plank|stem|hyphae|fence|door|barrel|crafting|bookshelf/, [0.55, 0.42, 0.26]],
    [/sand|sandstone/, [0.86, 0.8, 0.6]],
    [/snow|quartz|white|calcite|bone/, [0.92, 0.92, 0.92]],
    [/glass|ice/, [0.75, 0.85, 0.92]],
    [/netherrack|red|crimson|brick|terracotta/, [0.6, 0.27, 0.23]],
    [/obsidian|black|blackstone|deepslate|basalt|coal/, [0.18, 0.17, 0.2]],
    [/iron|metal|anvil|chain|copper/, [0.66, 0.66, 0.68]],
    [/orange/, [0.92, 0.5, 0.12]],
    [/yellow|gold/, [0.95, 0.82, 0.25]],
    [/blue|lapis/, [0.25, 0.35, 0.75]],
    [/green|lime|emerald/, [0.35, 0.7, 0.3]]
];
const STONE_GREY = [0.5, 0.5, 0.5];

function blockColor(block) {
    try {
        const c = block.getMapColor?.();
        if (c && (c.red + c.green + c.blue) > 0) return [c.red, c.green, c.blue];
    } catch { }
    const id = `${block?.typeId ?? ""}`.toLowerCase();
    for (const [pattern, color] of MATERIAL_COLORS) if (pattern.test(id)) return color;
    return STONE_GREY;
}

/** Debris off a block a bullet hit; `blockHit` is traceShot's { block, face, point }. */
export function spawnBulletImpact(dimension, blockHit) {
    if (!dimension || !blockHit?.point) return;
    const normal = FACE_NORMALS[blockHit.face] ?? { x: 0, y: 1, z: 0 };
    const [red, green, blue] = blockColor(blockHit.block);
    try {
        const variables = new MolangVariableMap();
        variables.setColorRGB("variable.color", { red, green, blue });
        variables.setVector3("variable.normal", normal);
        const at = { x: blockHit.point.x + normal.x * 0.04, y: blockHit.point.y + normal.y * 0.04, z: blockHit.point.z + normal.z * 0.04 };
        dimension.spawnParticle(BULLET_IMPACT_PARTICLE, at, variables);
    } catch { }
}

/**
 * Briefly lights the area in front of the shooter's muzzle with an invisible light block.
 * Only ever fills air (never replaces blocks or players' own light blocks) and removes itself.
 */
export function flashShooterLight(player, durationTicks = 2, lightLevel = 9) {
    const dimension = player?.dimension;
    if (!player?.id || !dimension) return;

    let muzzle;
    try {
        muzzle = add(getHeadLocation(player), player.getViewDirection());
    } catch {
        muzzle = getHeadLocation(player);
    }
    const blockPosition = floorVector(muzzle);
    const key = lightCleanupKey(dimension.id, blockPosition);
    const level = Math.max(0, Math.min(15, Math.floor(lightLevel)));
    const lightTypeId = `minecraft:light_block_${level}`;

    // Rapid fire at the same spot just keeps the existing flash alive.
    const pending = pendingLightCleanupByKey.get(key);
    if (pending) {
        pending.dueTick = Math.max(pending.dueTick, getCurrentTick() + Math.max(1, Math.floor(durationTicks)));
        return;
    }

    let block;
    try {
        block = dimension.getBlock(blockPosition);
    } catch {
        return;
    }

    const currentTypeId = `${block?.typeId ?? ""}`.trim().toLowerCase();
    if (!block || !AIR_TYPE_IDS.has(currentTypeId)) return;

    try {
        block.setPermutation(BlockPermutation.resolve(lightTypeId));
    } catch {
        return;
    }

    scheduleLightCleanup(dimension.id, blockPosition, durationTicks, lightTypeId);
}
