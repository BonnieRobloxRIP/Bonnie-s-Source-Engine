import { system, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import {
    terrainSettingsByPlayer,
    flattenTargetHeightByPlayer,
    locatorBusyByPlayer,
    AIR_BLOCKS,
    ALL_BUILD_TOOL_ITEMS,
    PREVIEW_OUTLINE_PARTICLE,
    getOffhandTypeId,
    findSurfaceY,
    setSafeBlockType
} from "./core.js";

const NATURAL_SURFACE_HINTS = [
    "grass_block",
    "dirt",
    "coarse_dirt",
    "rooted_dirt",
    "podzol",
    "mycelium",
    "moss",
    "mud",
    "stone",
    "deepslate",
    "tuff",
    "calcite",
    "dripstone",
    "gravel",
    "sand",
    "sandstone",
    "red_sand",
    "terracotta",
    "clay",
    "netherrack",
    "nylium",
    "soul_sand",
    "soul_soil",
    "basalt",
    "blackstone",
    "end_stone",
    "snow",
    "ice",
    "_ore",
    "granite",
    "diorite",
    "andesite",
    "cobblestone",
    "mossy_cobblestone",
    "magma",
    "packed_ice",
    "blue_ice",
    "suspicious_sand",
    "suspicious_gravel"
];

const NON_NATURAL_HINTS = [
    "planks",
    "polished",
    "bricks",
    "concrete",
    "glass",
    "wool",
    "carpet",
    "stairs",
    "slab",
    "wall",
    "fence",
    "door",
    "trapdoor",
    "lantern",
    "torch",
    "crafting_table",
    "furnace",
    "chest",
    "barrel",
    "anvil",
    "bed",
    "rail",
    "redstone",
    "repeater",
    "comparator",
    "observer",
    "piston",
    "dropper",
    "dispenser",
    "beacon",
    "spawner",
    "command_block",
    "utility"
];

const PLANT_HINTS = [
    "short_grass",
    "tall_grass",
    "grass",
    "fern",
    "flower",
    "rose",
    "dandelion",
    "tulip",
    "allium",
    "orchid",
    "azure_bluet",
    "cornflower",
    "lily_of_the_valley",
    "oxeye_daisy",
    "dead_bush",
    "double_plant",
    "waterlily",
    "seagrass",
    "kelp",
    "vine"
];

const LEAF_HINTS = ["leaves", "leaf"];
const LOG_HINTS = ["_log", "_wood", "stem", "hyphae", "mangrove_roots"];
const LIQUID_BLOCKS = new Set([
    "minecraft:water",
    "minecraft:flowing_water",
    "minecraft:lava",
    "minecraft:flowing_lava"
]);
const UNSTABLE_GRAVITY_BLOCKS = new Set([
    "minecraft:sand",
    "minecraft:red_sand",
    "minecraft:gravel",
    "minecraft:white_concrete_powder",
    "minecraft:orange_concrete_powder",
    "minecraft:magenta_concrete_powder",
    "minecraft:light_blue_concrete_powder",
    "minecraft:yellow_concrete_powder",
    "minecraft:lime_concrete_powder",
    "minecraft:pink_concrete_powder",
    "minecraft:gray_concrete_powder",
    "minecraft:light_gray_concrete_powder",
    "minecraft:cyan_concrete_powder",
    "minecraft:purple_concrete_powder",
    "minecraft:blue_concrete_powder",
    "minecraft:brown_concrete_powder",
    "minecraft:green_concrete_powder",
    "minecraft:red_concrete_powder",
    "minecraft:black_concrete_powder"
]);
const BRUSH_FALLOFF_MODES = new Set(["linear", "smoothstep", "hard"]);
const TERRAIN_SETTINGS_DP_KEY = "brr_bt_displace";
const FLATTEN_TARGET_DP_KEY = "brr_bt_displace_flatten_y";

const MESA_STRIPE_SEQUENCE = [
    "minecraft:terracotta",
    "minecraft:orange_terracotta",
    "minecraft:terracotta",
    "minecraft:yellow_terracotta",
    "minecraft:terracotta",
    "minecraft:brown_terracotta",
    "minecraft:red_terracotta",
    "minecraft:terracotta",
    "minecraft:white_terracotta",
    "minecraft:light_gray_terracotta",
    "minecraft:terracotta",
    "minecraft:orange_terracotta",
    "minecraft:red_terracotta",
    "minecraft:brown_terracotta",
    "minecraft:terracotta",
    "minecraft:yellow_terracotta"
];

export function getTerrainSettings(playerId) {
    const defaults = { mode: "dig", radius: 4, strength: 2, smooth: 2, removeTrees: true, falloff: "smoothstep", hardness: 4 };
    const existing = terrainSettingsByPlayer.get(playerId);
    if (existing) {
        existing.falloff = normalizeFalloff(existing.falloff ?? defaults.falloff);
        existing.hardness = Math.max(1, Math.min(8, Number(existing.hardness ?? defaults.hardness)));
        return existing;
    }

    let loaded = null;
    try {
        const player = world.getAllPlayers().find(p => `${p?.id ?? ""}` === `${playerId}`);
        const raw = `${player?.getDynamicProperty?.(TERRAIN_SETTINGS_DP_KEY) ?? ""}`.trim();
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
                loaded = {
                    mode: parsed.mode === "build" || parsed.mode === "flatten" ? parsed.mode : "dig",
                    radius: Math.max(1, Math.min(16, Number(parsed.radius ?? defaults.radius))),
                    strength: Math.max(1, Math.min(8, Number(parsed.strength ?? defaults.strength))),
                    smooth: Math.max(0, Math.min(4, Number(parsed.smooth ?? defaults.smooth))),
                    removeTrees: Boolean(parsed.removeTrees ?? defaults.removeTrees),
                    falloff: normalizeFalloff(parsed.falloff ?? defaults.falloff),
                    hardness: Math.max(1, Math.min(8, Number(parsed.hardness ?? defaults.hardness)))
                };
            }
        }
    } catch { }

    const hydrated = loaded ?? defaults;
    terrainSettingsByPlayer.set(playerId, hydrated);
    return hydrated;
}

function saveTerrainSettings(player, settings) {
    try {
        player?.setDynamicProperty?.(TERRAIN_SETTINGS_DP_KEY, JSON.stringify(settings));
    } catch { }
}

function loadFlattenTargetHeight(playerId) {
    if (flattenTargetHeightByPlayer.has(playerId)) {
        return flattenTargetHeightByPlayer.get(playerId);
    }

    try {
        const player = world.getAllPlayers().find(p => `${p?.id ?? ""}` === `${playerId}`);
        const value = Number(player?.getDynamicProperty?.(FLATTEN_TARGET_DP_KEY));
        if (Number.isFinite(value)) {
            const safeY = Math.max(-64, Math.min(319, Math.floor(value)));
            flattenTargetHeightByPlayer.set(playerId, safeY);
            return safeY;
        }
    } catch { }

    return undefined;
}

function saveFlattenTargetHeight(player, y) {
    const safeY = Math.max(-64, Math.min(319, Math.floor(Number(y))));
    flattenTargetHeightByPlayer.set(`${player?.id ?? ""}`, safeY);
    try {
        player?.setDynamicProperty?.(FLATTEN_TARGET_DP_KEY, safeY);
    } catch { }
}

function isLiquidType(typeId) {
    return LIQUID_BLOCKS.has(`${typeId}`.toLowerCase());
}

function isUnstableGravityType(typeId) {
    return UNSTABLE_GRAVITY_BLOCKS.has(`${typeId}`.toLowerCase());
}

function getStabilizedMaterial(typeId) {
    const normalized = `${typeId}`.toLowerCase();
    if (normalized === "minecraft:red_sand") return "minecraft:red_sandstone";
    if (normalized.includes("sand")) return "minecraft:sandstone";
    if (normalized.includes("gravel")) return "minecraft:stone";
    if (normalized.includes("concrete_powder")) return normalized.replace("_powder", "");
    return "minecraft:stone";
}

function shouldStabilizeTopMaterial(dimension, x, y, z) {
    if (y <= -64) return false;

    let aboveTypeId = "minecraft:air";
    let belowTypeId = "minecraft:air";
    try {
        aboveTypeId = `${dimension.getBlock({ x, y: y + 1, z })?.typeId ?? "minecraft:air"}`;
        belowTypeId = `${dimension.getBlock({ x, y: y - 1, z })?.typeId ?? "minecraft:air"}`;
    } catch { }

    return isLiquidType(aboveTypeId) || isLiquidType(belowTypeId) || AIR_BLOCKS.has(belowTypeId);
}

function sendDisplacementSummary(player, settings, changed, flattenHeight = null) {
    const modeText = typeof flattenHeight === "number"
        ? `flatten Y=${flattenHeight}`
        : `${settings.mode ?? "dig"}`;
    player.sendMessage(
        `§aDisplacement complete | mode: ${modeText} | radius: ${settings.radius} | strength: ${settings.strength} | falloff: ${settings.falloff ?? "smoothstep"} | hardness: ${settings.hardness ?? 4} | changed: ${changed}`
    );
}

export function ensureDisplacementPlayerCache(player) {
    const playerId = `${player?.id ?? ""}`;
    if (!playerId) return;
    getTerrainSettings(playerId);
    loadFlattenTargetHeight(playerId);
}

function hashString32(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function isLeafType(typeId) {
    const normalized = `${typeId}`.toLowerCase();
    return LEAF_HINTS.some(hint => normalized.includes(hint));
}

function isLogType(typeId) {
    const normalized = `${typeId}`.toLowerCase();
    return LOG_HINTS.some(hint => normalized.includes(hint));
}

function isNaturalTerrainType(typeId) {
    if (AIR_BLOCKS.has(typeId) || isLiquidType(typeId)) return false;
    const normalized = `${typeId}`.toLowerCase();
    if (NON_NATURAL_HINTS.some(hint => normalized.includes(hint))) return false;
    return NATURAL_SURFACE_HINTS.some(hint => normalized.includes(hint));
}

function isPlantSurfaceType(typeId) {
    const normalized = `${typeId}`.toLowerCase();
    if (normalized === "minecraft:grass_block") return false;
    if (isLiquidType(normalized)) return false;
    return PLANT_HINTS.some(hint => normalized.includes(hint));
}

function getLeafSpecies(typeId) {
    const normalized = `${typeId}`.toLowerCase();
    if (!isLeafType(normalized)) return "";
    if (normalized.includes("flowering_azalea") || normalized.includes("azalea")) return "azalea";
    const idx = normalized.indexOf("_leaves");
    if (idx > 0) {
        const prefix = normalized.slice(0, idx);
        const split = prefix.split(":");
        return split[split.length - 1];
    }
    return "";
}

function isMatchingLogForSpecies(logTypeId, species) {
    const normalized = `${logTypeId}`.toLowerCase();
    if (!species) return false;

    if (species === "azalea") {
        return normalized.includes("oak_log") || normalized.includes("oak_wood");
    }

    if (normalized.includes(`${species}_log`) || normalized.includes(`${species}_wood`)) return true;
    if (species === "crimson" && normalized.includes("stem")) return true;
    if (species === "warped" && normalized.includes("stem")) return true;
    return false;
}

function shouldPreviewColumn(dx, dz, radius) {
    const distSq = (dx * dx) + (dz * dz);
    const outerSq = radius * radius;
    const innerSq = Math.max(0, (radius - 1) * (radius - 1));
    return distSq <= outerSq && distSq >= innerSq;
}

function shouldEditColumn(dx, dz, radius) {
    return ((dx * dx) + (dz * dz)) <= (radius * radius);
}

function clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
}

function normalizeFalloff(falloff) {
    const normalized = `${falloff ?? ""}`.toLowerCase();
    return BRUSH_FALLOFF_MODES.has(normalized) ? normalized : "smoothstep";
}

function getBrushInfluence(dist, radius, falloff, hardness) {
    const safeRadius = Math.max(0.001, Number(radius) || 0.001);
    const t = clamp01(1 - (Math.max(0, Number(dist) || 0) / safeRadius));
    if (t <= 0) return 0;

    let base;
    switch (normalizeFalloff(falloff)) {
        case "linear":
            base = t;
            break;
        case "hard":
            base = t * t;
            break;
        default:
            base = t * t * (3 - (2 * t));
            break;
    }

    const normalizedHardness = clamp01((Number(hardness) - 1) / 7);
    const exponent = 1.4 - (0.8 * normalizedHardness);
    return Math.pow(base, exponent);
}

function findMatchingTreeLog(dimension, x, y, z, leafTypeId, radius = 8) {
    const species = getLeafSpecies(leafTypeId);
    if (!species) return null;

    let best = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -12; dy <= 6; dy++) {
            for (let dz = -radius; dz <= radius; dz++) {
                const distSq = (dx * dx) + (dy * dy) + (dz * dz);
                if (distSq > (radius * radius) + 36) continue;

                let block;
                try {
                    block = dimension.getBlock({ x: x + dx, y: y + dy, z: z + dz });
                } catch {
                    continue;
                }

                const typeId = `${block?.typeId ?? "minecraft:air"}`;
                if (!isMatchingLogForSpecies(typeId, species)) continue;

                if (distSq < bestDist) {
                    bestDist = distSq;
                    best = { x: x + dx, y: y + dy, z: z + dz, species };
                }
            }
        }
    }

    return best;
}

function clearMatchingTree(dimension, root, species) {
    const logQueue = [{ x: root.x, y: root.y, z: root.z }];
    const visitedLogs = new Set();
    const logBlocks = [];

    while (logQueue.length > 0 && visitedLogs.size < 512) {
        const current = logQueue.shift();
        const key = `${current.x}|${current.y}|${current.z}`;
        if (visitedLogs.has(key)) continue;
        visitedLogs.add(key);

        let block;
        try {
            block = dimension.getBlock(current);
        } catch {
            continue;
        }

        const typeId = `${block?.typeId ?? "minecraft:air"}`;
        if (!isMatchingLogForSpecies(typeId, species)) continue;

        logBlocks.push({ x: current.x, y: current.y, z: current.z });

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    if (dx === 0 && dy === 0 && dz === 0) continue;
                    logQueue.push({ x: current.x + dx, y: current.y + dy, z: current.z + dz });
                }
            }
        }
    }

    if (logBlocks.length === 0) return 0;

    let secondHighestLogY = logBlocks[0].y;
    {
        const ys = Array.from(new Set(logBlocks.map(log => log.y))).sort((a, b) => a - b);
        secondHighestLogY = ys.length >= 2 ? ys[ys.length - 2] : ys[ys.length - 1];
    }

    let changed = 0;

    const xzPositions = new Set(logBlocks.map(log => `${log.x}|${log.z}`));
    const isLargeOak = species === "oak" && xzPositions.size > 1;
    const isWideCanopySpecies = species === "acacia" || species === "jungle" || species === "dark_oak";
    const seedRadius = species === "spruce" ? 1 : 2;
    const maxLeafDistance = isLargeOak ? 10 : (isWideCanopySpecies ? 8 : (species === "spruce" ? 8 : 6));
    const maxLeafDistanceSq = maxLeafDistance * maxLeafDistance;

    function isWithinLeafRange(pos) {
        for (const log of logBlocks) {
            const dx = pos.x - log.x;
            const dy = pos.y - log.y;
            const dz = pos.z - log.z;
            if ((dx * dx) + (dy * dy) + (dz * dz) <= maxLeafDistanceSq) {
                return true;
            }
        }
        return false;
    }

    const removedLeaves = new Set();
    const leafQueue = [];

    for (const log of logBlocks) {
        if (log.y < secondHighestLogY - 1) continue;
        for (let dx = -seedRadius; dx <= seedRadius; dx++) {
            for (let dz = -seedRadius; dz <= seedRadius; dz++) {
                for (let dy = -1; dy <= 3; dy++) {
                    leafQueue.push({ x: log.x + dx, y: log.y + dy, z: log.z + dz });
                }
            }
        }
    }

    let floodSteps = 0;
    const floodStepLimit = isLargeOak ? 6000 : (isWideCanopySpecies ? 5000 : 3500);
    while (leafQueue.length > 0 && floodSteps < floodStepLimit) {
        floodSteps++;
        const pos = leafQueue.shift();
        const key = `${pos.x}|${pos.y}|${pos.z}`;
        if (removedLeaves.has(key)) continue;
        removedLeaves.add(key);

        if (!isWithinLeafRange(pos)) continue;

        let block;
        try {
            block = dimension.getBlock(pos);
        } catch {
            continue;
        }

        const typeId = `${block?.typeId ?? "minecraft:air"}`;
        if (!(isLeafType(typeId) && getLeafSpecies(typeId) === species)) continue;

        if (setSafeBlockType(dimension, pos, "minecraft:air")) changed++;

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    if (dx === 0 && dy === 0 && dz === 0) continue;
                    leafQueue.push({ x: pos.x + dx, y: pos.y + dy, z: pos.z + dz });
                }
            }
        }
    }

    return changed;
}

function clearLoosePlantsInColumn(dimension, x, z, yMin, yMax) {
    const minY = Math.max(-64, Math.floor(Math.min(yMin, yMax)));
    const maxY = Math.min(319, Math.floor(Math.max(yMin, yMax)));
    let removed = 0;

    for (let y = minY; y <= maxY; y++) {
        let block;
        try {
            block = dimension.getBlock({ x, y, z });
        } catch {
            continue;
        }
        const typeId = `${block?.typeId ?? "minecraft:air"}`;
        if (!isPlantSurfaceType(typeId)) continue;
        if (setSafeBlockType(dimension, { x, y, z }, "minecraft:air")) removed++;
    }

    return removed;
}

function findEditableSurfaceInfo(dimension, x, z, aroundY, range = 28) {
    const top = Math.min(319, aroundY + range);
    const bottom = Math.max(-64, aroundY - range);

    let canopyLeafTypeId = "";
    let canopyLeafY = null;

    for (let y = top; y >= bottom; y--) {
        let block;
        let above;
        try {
            block = dimension.getBlock({ x, y, z });
            above = dimension.getBlock({ x, y: y + 1, z });
        } catch {
            continue;
        }

        const typeId = `${block?.typeId ?? "minecraft:air"}`;
        const aboveTypeId = `${above?.typeId ?? "minecraft:air"}`;

        if (AIR_BLOCKS.has(typeId) || isLiquidType(typeId)) continue;
        if (!AIR_BLOCKS.has(aboveTypeId) && !isLiquidType(aboveTypeId)) continue;

        if (isLeafType(typeId)) {
            if (!canopyLeafTypeId) {
                canopyLeafTypeId = typeId;
                canopyLeafY = y;
            }
            continue;
        }

        if (isPlantSurfaceType(typeId)) {
            let below;
            try {
                below = dimension.getBlock({ x, y: y - 1, z });
            } catch {
                continue;
            }
            const belowTypeId = `${below?.typeId ?? "minecraft:air"}`;
            if (isNaturalTerrainType(belowTypeId)) {
                return {
                    y,
                    typeId,
                    terrainY: y - 1,
                    terrainTypeId: belowTypeId,
                    canopyLeafTypeId,
                    canopyLeafY
                };
            }
            continue;
        }

        if (!isNaturalTerrainType(typeId)) continue;

        return {
            y,
            typeId,
            terrainY: y,
            terrainTypeId: typeId,
            canopyLeafTypeId,
            canopyLeafY
        };
    }

    return null;
}

function incrementCount(counts, key, amount = 1) {
    if (!key || AIR_BLOCKS.has(key)) return;
    counts.set(key, (counts.get(key) ?? 0) + amount);
}

function buildTerrainPalette(dimension, columns) {
    const topCounts = new Map();
    const subsurfaceCounts = new Map();

    for (const column of columns) {
        if (column.surfaceTypeId) incrementCount(topCounts, column.surfaceTypeId, 1);

        for (let depth = 1; depth <= 4; depth++) {
            const y = column.currentY - depth;
            let block;
            try {
                block = dimension.getBlock({ x: column.x, y, z: column.z });
            } catch {
                continue;
            }

            const typeId = `${block?.typeId ?? "minecraft:air"}`;
            if (!isNaturalTerrainType(typeId)) continue;
            incrementCount(subsurfaceCounts, typeId, 1);
        }
    }

    return { topCounts, subsurfaceCounts };
}

function pickFromCounts(counts, fallback, seedText) {
    if (!counts || counts.size === 0) return fallback;

    const entries = [];
    let total = 0;
    for (const [typeId, weightRaw] of counts.entries()) {
        if (AIR_BLOCKS.has(typeId)) continue;
        const weight = Math.max(1, Math.floor(weightRaw));
        total += weight;
        entries.push({ typeId, cumulative: total });
    }

    if (entries.length === 0 || total <= 0) return fallback;

    const pick = hashString32(seedText) % total;
    for (const entry of entries) {
        if (pick < entry.cumulative) return entry.typeId;
    }

    return entries[entries.length - 1].typeId;
}

function hasHintInCounts(counts, hint) {
    for (const typeId of counts.keys()) {
        if (`${typeId}`.includes(hint)) return true;
    }
    return false;
}

/** Returns true if blocks matching `hint` account for >50% of the total count weight. */
function hintMajorityInCounts(counts, hint) {
    if (!counts || counts.size === 0) return false;
    let matchWeight = 0, totalWeight = 0;
    for (const [typeId, w] of counts.entries()) {
        if (AIR_BLOCKS.has(typeId)) continue;
        const weight = Math.max(1, Math.floor(w));
        totalWeight += weight;
        if (`${typeId}`.includes(hint)) matchWeight += weight;
    }
    return totalWeight > 0 && matchWeight > totalWeight * 0.5;
}

function getMesaStripeMaterial(y) {
    const index = Math.abs(Math.floor(y)) % MESA_STRIPE_SEQUENCE.length;
    return MESA_STRIPE_SEQUENCE[index];
}

function chooseSubsurfaceMaterial(columnSeed, targetY, palette, fallback) {
    if (hasHintInCounts(palette.subsurfaceCounts, "terracotta") || hasHintInCounts(palette.topCounts, "terracotta")) {
        return getMesaStripeMaterial(targetY - 1);
    }

    if (hintMajorityInCounts(palette.topCounts, "red_sand")) return "minecraft:red_sandstone";
    if (hintMajorityInCounts(palette.topCounts, "sand")) return "minecraft:sandstone";

    return pickFromCounts(palette.subsurfaceCounts, fallback, `${columnSeed}|sub`);
}

function chooseTopMaterial(columnSeed, targetY, palette, fallback) {
    if (hasHintInCounts(palette.topCounts, "terracotta") || hasHintInCounts(palette.subsurfaceCounts, "terracotta")) {
        if (hintMajorityInCounts(palette.topCounts, "red_sand")) return "minecraft:red_sand";
        return getMesaStripeMaterial(targetY);
    }

    if (hintMajorityInCounts(palette.topCounts, "red_sand")) return "minecraft:red_sand";
    if (hintMajorityInCounts(palette.topCounts, "sand")) return "minecraft:sand";

    return pickFromCounts(palette.topCounts, fallback, `${columnSeed}|top`);
}

function getDeepFillMaterial(y, baseMaterial, allowBedrockMix, seedText) {
    if (!allowBedrockMix) return baseMaterial;
    if (y > -62) return baseMaterial;
    if (y <= -64) return "minecraft:bedrock";

    const mixPick = hashString32(seedText) % 4;
    return mixPick === 0 ? "minecraft:bedrock" : "minecraft:deepslate";
}

function smoothSurfaceMap(surfaceMap, passes = 2, options = {}) {
    const safePasses = Math.max(0, Math.floor(Number(passes) || 0));
    if (safePasses <= 0 || surfaceMap.size === 0) return;

    const origin = options?.origin;
    const radius = Math.max(0, Number(options?.radius ?? 0));
    const boundaryLock = clamp01(options?.boundaryLock ?? 0.82);
    const original = new Map(surfaceMap);
    const neighbors = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
    ];

    const getBoundaryBlend = (x, z) => {
        if (!origin || radius <= 0 || boundaryLock <= 0) return 0;
        const dist = Math.sqrt(((x - origin.x) * (x - origin.x)) + ((z - origin.z) * (z - origin.z)));
        if (dist <= radius - 1) return 0;

        const edgeBand = Math.max(0.5, Math.min(2, radius * 0.2));
        const edgeT = clamp01((dist - (radius - 1)) / edgeBand);
        return boundaryLock * edgeT;
    };

    const applyPass = (factor) => {
        const next = new Map();
        for (const [key, y] of surfaceMap.entries()) {
            const [xRaw, zRaw] = key.split("|");
            const x = Number(xRaw);
            const z = Number(zRaw);

            let sum = 0;
            let count = 0;
            for (const [dx, dz] of neighbors) {
                const other = surfaceMap.get(`${x + dx}|${z + dz}`);
                if (typeof other !== "number") continue;
                sum += other;
                count++;
            }

            if (count === 0) {
                next.set(key, y);
                continue;
            }

            const avg = sum / count;
            const delta = Math.max(-2, Math.min(2, (avg - y) * factor));
            let adjusted = y + delta;

            const blend = getBoundaryBlend(x, z);
            if (blend > 0) {
                const baseY = Number(original.get(key) ?? y);
                adjusted = (adjusted * (1 - blend)) + (baseY * blend);
            }

            next.set(key, Math.round(adjusted));
        }

        for (const [key, y] of next.entries()) {
            surfaceMap.set(key, y);
        }
    };

    for (let pass = 0; pass < safePasses; pass++) {
        // Taubin-style pair smooths noise while keeping terrain mass from collapsing inward.
        applyPass(0.5);
        applyPass(-0.53);
    }
}

export function showDisplacementRadiusPreview(player, center, radius) {
    const dimension = player.dimension;
    const points = [];
    const seen = new Set();

    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            if (!shouldPreviewColumn(x, z, radius)) continue;

            const worldX = center.x + x;
            const worldZ = center.z + z;
            const surfaceInfo = findEditableSurfaceInfo(dimension, worldX, worldZ, center.y, 36);
            const surfaceY = surfaceInfo?.y ?? findSurfaceY(dimension, worldX, worldZ, center.y, 36);
            if (surfaceY === null) continue;

            const key = `${worldX}|${surfaceY}|${worldZ}`;
            if (seen.has(key)) continue;
            seen.add(key);
            points.push({ x: worldX, y: surfaceY + 1, z: worldZ });
        }
    }

    for (const pos of points) {
        try {
            player.dimension.spawnParticle(PREVIEW_OUTLINE_PARTICLE, {
                x: pos.x + 0.5,
                y: pos.y + 0.5,
                z: pos.z + 0.5
            });
        } catch { }
    }
}

function getTopMaterialForDepth(depth) {
    if (depth >= 8) return "minecraft:stone";
    if (depth >= 3) return "minecraft:dirt";
    return "minecraft:grass_block";
}

function getSubsurfaceMaterial(depthFromTop) {
    if (depthFromTop <= 3) return "minecraft:dirt";
    return "minecraft:stone";
}

export function applyTerrainDisplacement(player, center) {
    const playerId = `${player?.id ?? ""}`;
    if (!playerId) return;

    const settings = getTerrainSettings(playerId);
    const targetFlattenHeight = loadFlattenTargetHeight(playerId);
    const radius = Math.max(1, Math.min(16, Number(settings.radius ?? 4)));
    const strength = Math.max(1, Math.min(8, Number(settings.strength ?? 2)));
    const smooth = Math.max(0, Math.min(4, Number(settings.smooth ?? 2)));
    const falloff = normalizeFalloff(settings.falloff ?? "smoothstep");
    const hardness = Math.max(1, Math.min(8, Number(settings.hardness ?? 4)));
    const origin = { x: Math.floor(center.x), y: Math.floor(center.y), z: Math.floor(center.z) };

    const requestedMode = `${settings.mode ?? "dig"}`;
    const mode = requestedMode === "build" || requestedMode === "flatten" ? requestedMode : "dig";
    const flattenHeight = mode === "flatten"
        ? (typeof targetFlattenHeight === "number" ? targetFlattenHeight : origin.y)
        : null;
    const shouldRemoveTrees = Boolean(settings.removeTrees ?? true);
    const allowBedrockMix = mode === "build" || typeof flattenHeight === "number";
    const dimension = player.dimension;

    const originalSurface = new Map();
    const nextSurface = new Map();
    const columns = [];

    const removedTrees = new Set();
    let treeRemovedBlocks = 0;

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
            if (!shouldEditColumn(dx, dz, radius)) continue;

            const x = origin.x + dx;
            const z = origin.z + dz;
            const key = `${x}|${z}`;

            const surfaceInfo = findEditableSurfaceInfo(dimension, x, z, origin.y, 36);
            const currentY = Number(surfaceInfo?.terrainY ?? surfaceInfo?.y ?? findSurfaceY(dimension, x, z, origin.y, 36));
            if (!Number.isFinite(currentY)) continue;

            if (shouldRemoveTrees && surfaceInfo?.canopyLeafTypeId && typeof surfaceInfo.canopyLeafY === "number") {
                const treeRoot = findMatchingTreeLog(dimension, x, surfaceInfo.canopyLeafY, z, surfaceInfo.canopyLeafTypeId, 2);
                if (treeRoot) {
                    const treeKey = `${treeRoot.x}|${treeRoot.y}|${treeRoot.z}|${treeRoot.species}`;
                    if (!removedTrees.has(treeKey)) {
                        removedTrees.add(treeKey);
                        treeRemovedBlocks += clearMatchingTree(dimension, treeRoot, treeRoot.species);
                    }
                }
            }

            const dist = Math.sqrt((dx * dx) + (dz * dz));
            const influence = getBrushInfluence(dist, radius, falloff, hardness);

            let targetY;
            if (typeof flattenHeight === "number") {
                const delta = Math.round(strength * influence);
                if (delta <= 0) {
                    targetY = currentY;
                } else if (currentY > flattenHeight) {
                    targetY = Math.max(flattenHeight, currentY - delta);
                } else if (currentY < flattenHeight) {
                    targetY = Math.min(flattenHeight, currentY + delta);
                } else {
                    targetY = currentY;
                }
            } else {
                const delta = Math.round(strength * influence);
                if (delta <= 0) {
                    targetY = currentY;
                } else {
                    targetY = mode === "dig"
                        ? Math.max(-63, currentY - delta)
                        : Math.min(318, currentY + delta);
                }
            }

            if (mode === "dig") targetY = Math.max(-63, targetY);

            originalSurface.set(key, currentY);
            nextSurface.set(key, targetY);
            columns.push({
                x,
                z,
                key,
                currentY,
                surfaceTypeId: `${surfaceInfo?.terrainTypeId ?? surfaceInfo?.typeId ?? ""}`
            });
        }
    }

    smoothSurfaceMap(nextSurface, smooth, { origin, radius, boundaryLock: 0.82 });
    const palette = buildTerrainPalette(dimension, columns);

    let changed = 0;
    for (const column of columns) {
        const currentY = originalSurface.get(column.key);
        const targetY = nextSurface.get(column.key);
        if (typeof currentY !== "number" || typeof targetY !== "number") continue;

        const columnSeed = `${column.x}|${column.z}|${targetY}`;
        const topFallback = (typeof flattenHeight !== "number" && mode !== "build")
            ? getTopMaterialForDepth(Math.max(0, currentY - targetY))
            : "minecraft:grass_block";
        const subsurfaceFallback = getSubsurfaceMaterial(2);

        const topMaterial = chooseTopMaterial(columnSeed, targetY, palette, topFallback);
        let subsurfaceMaterial = chooseSubsurfaceMaterial(columnSeed, targetY, palette, subsurfaceFallback);
        let safeTopMaterial = topMaterial;

        if (isUnstableGravityType(safeTopMaterial) && shouldStabilizeTopMaterial(dimension, column.x, targetY, column.z)) {
            safeTopMaterial = getStabilizedMaterial(safeTopMaterial);
            subsurfaceMaterial = getStabilizedMaterial(subsurfaceMaterial);
        }

        if (targetY < currentY) {
            for (let y = currentY; y > targetY; y--) {
                if (y <= -64) continue;
                if (setSafeBlockType(dimension, { x: column.x, y, z: column.z }, "minecraft:air")) changed++;
            }
        } else if (targetY > currentY) {
            for (let y = currentY + 1; y <= targetY; y++) {
                if (y <= -64) continue;
                const depthFromTop = targetY - y;
                const fillBase = depthFromTop === 0 ? safeTopMaterial : subsurfaceMaterial;
                const fillType = getDeepFillMaterial(y, fillBase, allowBedrockMix, `${columnSeed}|fill|${y}`);
                if (setSafeBlockType(dimension, { x: column.x, y, z: column.z }, fillType)) changed++;
            }
        }

        if (mode !== "dig" && targetY > -64) {
            const topType = getDeepFillMaterial(targetY, safeTopMaterial, allowBedrockMix, `${columnSeed}|top|${targetY}`);
            if (setSafeBlockType(dimension, { x: column.x, y: targetY, z: column.z }, topType)) changed++;
            for (let depthFromTop = 1; depthFromTop <= 4; depthFromTop++) {
                const y = targetY - depthFromTop;
                if (y <= -64) continue;
                const fillType = getDeepFillMaterial(y, subsurfaceMaterial, allowBedrockMix, `${columnSeed}|sub|${y}`);
                setSafeBlockType(dimension, { x: column.x, y, z: column.z }, fillType);
            }
        }

        changed += clearLoosePlantsInColumn(dimension, column.x, column.z, Math.min(currentY, targetY), Math.max(currentY, targetY) + 3);
    }

    void treeRemovedBlocks;
    sendDisplacementSummary(player, { ...settings, mode, radius, strength, falloff, hardness }, changed, flattenHeight);
}

export async function openTerrainSettingsForm(player, attempt = 0) {
    const playerId = `${player?.id ?? ""}`;
    if (!playerId) return;
    if (locatorBusyByPlayer.has(playerId)) return;

    const retry = () => {
        if (attempt >= 6) {
            player.sendMessage("§cDisplacement settings are busy right now. Try again in a moment.");
            return;
        }
        system.runTimeout(() => openTerrainSettingsForm(player, attempt + 1), 2);
    };

    locatorBusyByPlayer.add(playerId);
    try {
        const settings = getTerrainSettings(playerId);
        const form = new ModalFormData();
        form.title("Displacement Tool Settings");

        const modeOptions = ["Dig", "Build", "Flatten"];
        const modeIndex = settings.mode === "build" ? 1 : (settings.mode === "flatten" ? 2 : 0);
        const falloffOptions = ["Linear", "Smoothstep", "Hard"];
        const falloff = normalizeFalloff(settings.falloff ?? "smoothstep");
        const falloffIndex = falloff === "linear" ? 0 : (falloff === "hard" ? 2 : 1);
        form.dropdown("Mode", modeOptions, { defaultValueIndex: modeIndex });
        form.dropdown("Falloff", falloffOptions, { defaultValueIndex: falloffIndex });
        form.slider("Brush Hardness", 1, 8, { valueStep: 1, defaultValue: Number(settings.hardness ?? 4) });
        form.slider("Radius", 1, 16, { valueStep: 1, defaultValue: Number(settings.radius ?? 4) });
        form.slider("Strength", 1, 8, { valueStep: 1, defaultValue: Number(settings.strength ?? 2) });
        form.slider("Smoothing Passes", 0, 4, { valueStep: 1, defaultValue: Number(settings.smooth ?? 2) });
        form.toggle("Remove matching trees", { defaultValue: Boolean(settings.removeTrees ?? true) });

        const response = await form.show(player);
        if (response.canceled) {
            const cancelReason = `${response.cancelationReason ?? ""}`.toLowerCase();
            if (cancelReason.includes("userbusy") || cancelReason.includes("busy")) retry();
            return;
        }

        const pickedMode = Number(response.formValues?.[0] ?? 0);
        const pickedFalloff = Number(response.formValues?.[1] ?? 1);
        settings.mode = pickedMode === 1 ? "build" : (pickedMode === 2 ? "flatten" : "dig");
        settings.falloff = pickedFalloff === 0 ? "linear" : (pickedFalloff === 2 ? "hard" : "smoothstep");
        settings.hardness = response.formValues?.[2] ?? 4;
        settings.radius = response.formValues?.[3] ?? 4;
        settings.strength = response.formValues?.[4] ?? 2;
        settings.smooth = response.formValues?.[5] ?? 2;
        settings.removeTrees = response.formValues?.[6] ?? true;

        terrainSettingsByPlayer.set(playerId, settings);
        saveTerrainSettings(player, settings);
        player.sendMessage(`§aTerrain settings updated: §f${settings.mode} §7mode, falloff §f${settings.falloff}§7, hardness §f${settings.hardness}§7, radius §f${settings.radius}§7, strength §f${settings.strength}§7, smoothing §f${settings.smooth}§7, removeTrees §f${settings.removeTrees ? "on" : "off"}`);
    } catch (e) {
        const errorText = `${e ?? ""}`.toLowerCase();
        if (errorText.includes("not available") || errorText.includes("busy")) {
            retry();
            return;
        }
        player.sendMessage("§cDisplacement settings could not be opened right now.");
    } finally {
        locatorBusyByPlayer.delete(playerId);
    }
}

export function handleDisplacementToolUse(player, location, playerId) {
    const safePlayerId = `${playerId ?? player?.id ?? ""}`;
    if (!safePlayerId) return false;

    if (player?.isSneaking) {
        const targetY = Math.floor(Number(location?.y ?? player.location?.y ?? 0));
        saveFlattenTargetHeight(player, targetY);
        player.sendMessage(`§aFlatten target height set to Y=${targetY} (from clicked block)`);
        return true;
    }

    const offhandTypeId = getOffhandTypeId(player).trim();
    const isSettingFlattenTarget = offhandTypeId && !AIR_BLOCKS.has(offhandTypeId) && !ALL_BUILD_TOOL_ITEMS.has(offhandTypeId);

    if (isSettingFlattenTarget) {
        const surfaceY = findSurfaceY(player.dimension, location.x, location.z, location.y, 36);
        if (surfaceY !== null) {
            saveFlattenTargetHeight(player, surfaceY);
            player.sendMessage(`§aFlatten target height set to Y=${surfaceY} (${offhandTypeId})`);
        } else {
            player.sendMessage("§cCould not find surface at this location.");
        }
        return true;
    }

    return false;
}