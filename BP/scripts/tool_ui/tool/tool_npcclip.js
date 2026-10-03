import { world } from "@minecraft/server";

function normalizeLiteralSelector(value) {
    const raw = `${value ?? ""}`.trim();
    const quoted = raw.match(/^(["'])(.*)\1$/);
    return `${quoted ? quoted[2] : raw}`.trim().toLowerCase();
}

const NPCCLIP_PLAYER_CLEARANCE = 0.6;

function canEntityWalk(entity) {
    try {
        return Boolean(entity?.getComponent("minecraft:movement"));
    } catch {
        return false;
    }
}

// SECTION: Npcclip Runtime Helpers
export function selectorTargetsEntity(selectorRaw, entity, block, options) {
    const selector = `${selectorRaw ?? ""}`.trim();
    if (!selector || !entity || !block?.dimension) return false;

    const normalized = selector.toLowerCase();
    const { parseSelectorFilters, applyEntityFilters } = options ?? {};

    if (!normalized.startsWith("@")) {
        const expected = normalizeLiteralSelector(selector);
        const entityType = normalizeLiteralSelector(entity?.typeId);
        const entityName = normalizeLiteralSelector(entity?.nameTag);
        return expected === entityType || expected === entityName;
    }

    const base = normalized.slice(0, 2);
    if (!["@e", "@a", "@p", "@r", "@s"].includes(base)) return false;
    if (base !== "@e" && `${entity?.typeId ?? ""}` !== "minecraft:player") return false;

    // Selector filters are all per-entity, so testing just this entity avoids scanning the dimension.
    const filters = typeof parseSelectorFilters === "function" ? parseSelectorFilters(selector) : null;
    const matches = typeof applyEntityFilters === "function" ? applyEntityFilters([entity], filters) : [entity];
    return matches.length > 0;
}

export function shouldEnableNpcclipCollision(block, options) {
    if (!block) return false;

    const {
        toolsEnabled,
        parseBooleanLike,
        isEntityNearBlock,
        parseSelectorFilters,
        applyEntityFilters
    } = options ?? {};

    if (!toolsEnabled) return false;
    if (typeof parseBooleanLike !== "function" || typeof isEntityNearBlock !== "function") return false;
    if (parseBooleanLike(block?.data?.startDisabled, false)) return false;

    const excludeSelector = `${block?.data?.excludeSelector ?? ""}`.trim();

    let dimension;
    try {
        dimension = world.getDimension(block.dimension);
    } catch {
        return false;
    }

    const center = { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 };

    // The solid placeholder also blocks players, so stay passable while a player is on or next to it.
    let nearbyPlayers;
    try {
        nearbyPlayers = dimension.getPlayers({ location: center, maxDistance: 3 });
    } catch {
        nearbyPlayers = [];
    }
    for (const player of nearbyPlayers) {
        if (isEntityNearBlock(player, block, NPCCLIP_PLAYER_CLEARANCE)) return false;
    }

    const entities = dimension.getEntities({
        location: center,
        maxDistance: 3,
        excludeTypes: ["minecraft:player"]
    });
    for (const entity of entities) {
        // Items, xp orbs, projectiles, armor stands and similar can't walk, so they must not
        // turn the clip solid (they used to keep it solid for as long as they lay next to it).
        if (!canEntityWalk(entity)) continue;
        if (!isEntityNearBlock(entity, block, 0.45)) continue;

        const isExcluded = excludeSelector.length > 0
            ? selectorTargetsEntity(excludeSelector, entity, block, { parseSelectorFilters, applyEntityFilters })
            : false;

        if (!isExcluded) {
            return true;
        }
    }

    return false;
}

export function getNpcclipPositionKey(x, y, z) {
    return `${x}|${y}|${z}`;
}

const NPCCLIP_NEAR_EXPAND = 0.45;

// Returns the first active npcclip near the entity that does not exclude it. Only clips whose
// cell is within NPCCLIP_NEAR_EXPAND of the entity can match, so just those positions are looked up.
function findBlockingNpcclip(entity, location, blocksByPos, isEntityNearBlock, selectorOptions) {
    const minX = Math.floor(location.x - 1 - NPCCLIP_NEAR_EXPAND);
    const maxX = Math.floor(location.x + NPCCLIP_NEAR_EXPAND);
    const minY = Math.floor(location.y - 1 - NPCCLIP_NEAR_EXPAND);
    const maxY = Math.floor(location.y + NPCCLIP_NEAR_EXPAND);
    const minZ = Math.floor(location.z - 1 - NPCCLIP_NEAR_EXPAND);
    const maxZ = Math.floor(location.z + NPCCLIP_NEAR_EXPAND);

    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            for (let z = minZ; z <= maxZ; z++) {
                const block = blocksByPos.get(getNpcclipPositionKey(x, y, z));
                if (!block || !isEntityNearBlock(entity, block, NPCCLIP_NEAR_EXPAND)) continue;

                const excludeSelector = `${block?.data?.excludeSelector ?? ""}`.trim();
                const isExcluded = excludeSelector.length > 0
                    && selectorTargetsEntity(excludeSelector, entity, block, selectorOptions);
                if (!isExcluded) return block;
            }
        }
    }

    return null;
}

// blocksByPos: Map of getNpcclipPositionKey -> active npcclip block, all in the entity's dimension.
// Keeps a single last-safe position and cooldown per entity (keyed by entity id).
export function applyNpcclipRepel(entity, blocksByPos, options) {
    if (!entity || !(blocksByPos instanceof Map) || blocksByPos.size === 0) return;
    if (`${entity?.typeId ?? ""}` === "minecraft:player") return;

    const {
        isEntityNearBlock,
        parseSelectorFilters,
        applyEntityFilters,
        npcclipRepelCooldowns,
        npcclipLastSafePositions,
        cooldownMs
    } = options ?? {};

    if (typeof isEntityNearBlock !== "function") return;
    if (!(npcclipRepelCooldowns instanceof Map)) return;
    if (!(npcclipLastSafePositions instanceof Map)) return;

    let location;
    let dimensionId;
    try {
        location = entity.location;
        dimensionId = entity.dimension?.id;
    } catch {
        return;
    }
    if (!location || !dimensionId) return;

    const entityId = `${entity.id}`;
    const blockingClip = findBlockingNpcclip(entity, location, blocksByPos, isEntityNearBlock, {
        parseSelectorFilters,
        applyEntityFilters
    });

    if (!blockingClip) {
        const safePos = npcclipLastSafePositions.get(entityId);
        if (safePos) {
            safePos.x = location.x;
            safePos.y = location.y;
            safePos.z = location.z;
            safePos.dimension = dimensionId;
        } else {
            npcclipLastSafePositions.set(entityId, {
                x: location.x,
                y: location.y,
                z: location.z,
                dimension: dimensionId
            });
        }
        return;
    }

    const now = Date.now();
    const lastRepel = npcclipRepelCooldowns.get(entityId) ?? 0;
    if (now - lastRepel < (Number.isFinite(cooldownMs) ? cooldownMs : 140)) return;
    npcclipRepelCooldowns.set(entityId, now);

    const lastSafePos = npcclipLastSafePositions.get(entityId);
    if (lastSafePos && lastSafePos.dimension === dimensionId) {
        try {
            entity.teleport(
                {
                    x: lastSafePos.x,
                    y: lastSafePos.y,
                    z: lastSafePos.z
                },
                { dimension: entity.dimension }
            );
            return;
        } catch { }
    }
}
