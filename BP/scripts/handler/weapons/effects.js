import { BlockPermutation, system, world } from "@minecraft/server";

const AIR_TYPE_IDS = new Set(["minecraft:air", "minecraft:cave_air", "minecraft:void_air"]);
const pendingLightCleanupByKey = new Map();
const MAX_LIGHT_CLEANUP_ATTEMPTS = 1200;

function getCurrentTick() {
    try {
        const tick = Number(system?.currentTick);
        if (Number.isFinite(tick) && tick >= 0) return tick;
    } catch { }

    try {
        return Number.parseInt(`${world.getAbsoluteTime?.() ?? 0}`, 10) || 0;
    } catch {
        return 0;
    }
}

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

function clearLightBlockAt(dimension, pos) {
    if (!dimension || !pos) return false;

    let targetBlock;
    try {
        targetBlock = dimension.getBlock(pos);
    } catch {
        targetBlock = null;
    }

    if (!targetBlock) return false;

    const liveTypeId = `${targetBlock?.typeId ?? ""}`.trim().toLowerCase();
    if (!isLightBlockType(liveTypeId)) return true;

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

function scheduleLightCleanup(rawDimensionId, pos, durationTicks) {
    const safePos = floorVector(pos);
    const dueTick = getCurrentTick() + Math.max(1, Math.floor(durationTicks));
    const key = lightCleanupKey(rawDimensionId, safePos);

    pendingLightCleanupByKey.set(key, {
        dimensionId: normalizeDimensionId(rawDimensionId),
        pos: safePos,
        dueTick,
        attempts: 0
    });
}

system.runInterval(() => {
    if (pendingLightCleanupByKey.size <= 0) return;

    const tick = getCurrentTick();
    for (const [key, task] of pendingLightCleanupByKey.entries()) {
        if (tick < Number(task?.dueTick ?? 0)) continue;

        const dimension = getDimensionById(task?.dimensionId);
        if (!dimension) {
            task.attempts = Number(task?.attempts ?? 0) + 1;
            if (task.attempts >= MAX_LIGHT_CLEANUP_ATTEMPTS) {
                pendingLightCleanupByKey.delete(key);
            }
            continue;
        }

        const cleared = clearLightBlockAt(dimension, task?.pos);
        if (cleared) {
            pendingLightCleanupByKey.delete(key);
            continue;
        }

        task.attempts = Number(task?.attempts ?? 0) + 1;
        if (task.attempts >= MAX_LIGHT_CLEANUP_ATTEMPTS) {
            pendingLightCleanupByKey.delete(key);
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

export function flashShooterLight(player, durationTicks = 2, lightLevel = 9) {
    const dimension = player?.dimension;
    if (!player?.id || !dimension) return;

    const blockPosition = floorVector(player.location);
    let block;

    try {
        block = dimension.getBlock(blockPosition);
    } catch {
        block = null;
    }

    const currentTypeId = `${block?.typeId ?? ""}`.trim().toLowerCase();
    const canReplace = !currentTypeId || AIR_TYPE_IDS.has(currentTypeId) || isLightBlockType(currentTypeId);
    if (!canReplace) return;

    let placed = false;
    try {
        const permutation = BlockPermutation.resolve("minecraft:light_block", { block_light_level: Math.max(0, Math.min(15, Math.floor(lightLevel))) });
        block.setPermutation(permutation);
        placed = true;
    } catch {
        try {
            block.setType("minecraft:light_block");
            placed = true;
        } catch { }
    }

    if (!placed) return;

    const cleanupAtTick = Math.max(1, Math.floor(durationTicks));
    scheduleLightCleanup(dimension?.id, blockPosition, cleanupAtTick);

    system.runTimeout(() => {
        const cleared = clearLightBlockAt(dimension, blockPosition);
        if (!cleared) {
            scheduleLightCleanup(dimension?.id, blockPosition, cleanupAtTick);
        }
    }, cleanupAtTick);
}
