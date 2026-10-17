import { world } from "@minecraft/server";
import { parseSelectorFilters, applyEntityFilters } from "../handler/core/selector_filters.js";
import { getDimensionPlayers } from "./runtime.js";

// SECTION: Selector Parsing
// Engine keyvalues hold selectors such as "@a[tag=red]", "@e[type=zombie]", "minecraft:player"
// or a literal player/entity name. They are parsed once and memoized by their text.

const MAX_CACHED_SELECTORS = 512;
const parsedSelectors = new Map();

export function parseSelector(raw) {
    const text = `${raw ?? ""}`.trim();
    if (parsedSelectors.has(text)) return parsedSelectors.get(text);

    let parsed = null;
    if (text.startsWith("@")) {
        const filters = parseSelectorFilters(text);
        parsed = filters ? { kind: "selector", base: text.slice(0, 2).toLowerCase(), filters } : null;
    } else if (text) {
        const quoted = text.match(/^(["'])(.*)\1$/);
        const value = `${quoted ? quoted[2] : text}`.trim().toLowerCase();
        parsed = value ? { kind: "literal", value } : null;
    }

    if (parsedSelectors.size >= MAX_CACHED_SELECTORS) parsedSelectors.clear();
    parsedSelectors.set(text, parsed);
    return parsed;
}

export function getPlayerGameModeName(player) {
    try {
        return `${player.getGameMode()}`.trim().toLowerCase();
    } catch {
        return "";
    }
}

function isPlayer(entity) {
    return entity?.typeId === "minecraft:player";
}

function passesFilters(entity, parsed) {
    return applyEntityFilters([entity], parsed.filters, getPlayerGameModeName).length > 0;
}

function lower(value) {
    return `${value ?? ""}`.trim().toLowerCase();
}

function literalMatches(entity, value) {
    return lower(entity?.typeId) === value || lower(entity?.name) === value || lower(entity?.nameTag) === value;
}

function distanceSquared(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return dx * dx + dy * dy + dz * dz;
}

export function getNearest(candidates, origin) {
    let best;
    let bestDistance = Infinity;
    for (const candidate of candidates) {
        let distance;
        try {
            distance = distanceSquared(candidate.location, origin);
        } catch {
            continue;
        }
        if (distance < bestDistance) {
            bestDistance = distance;
            best = candidate;
        }
    }
    return best;
}


// SECTION: Matching
// Does `entity` match the selector? `origin` = { x, y, z, dimension } is the engine entity the
// selector belongs to; it is only needed to resolve @p. @r is treated like @a for matching.
export function selectorMatchesEntity(raw, entity, origin) {
    const parsed = parseSelector(raw);
    if (!parsed || !entity) return false;
    if (parsed.kind === "literal") return literalMatches(entity, parsed.value);

    switch (parsed.base) {
        case "@e":
            return passesFilters(entity, parsed);
        case "@a":
        case "@r":
            return isPlayer(entity) && passesFilters(entity, parsed);
        case "@p": {
            if (!isPlayer(entity) || !origin) return false;
            const candidates = getDimensionPlayers(origin.dimension).filter(player => passesFilters(player, parsed));
            return getNearest(candidates, origin)?.id === entity.id;
        }
        default:
            return false;
    }
}

// Whether the selector can ever match something that is not a player, which decides if a
// system has to query nearby mobs at all.
export function selectorCanMatchNonPlayers(raw) {
    const parsed = parseSelector(raw);
    if (!parsed) return false;
    if (parsed.kind === "literal") return parsed.value !== "minecraft:player";
    if (parsed.base !== "@e") return false;
    const types = parsed.filters?.type ?? [];
    return !(types.length === 1 && lower(types[0]) === "minecraft:player");
}

// SECTION: Resolution
// Resolves a selector to players. scope "world" searches every dimension, "dimension" only the
// origin's dimension (and @p is measured from the origin).
export function resolveSelectorPlayers(raw, origin, scope = "dimension") {
    const parsed = parseSelector(raw);
    if (!parsed) return [];

    const players = scope === "world" ? world.getPlayers() : getDimensionPlayers(origin?.dimension);
    if (parsed.kind === "literal") {
        if (parsed.value === "minecraft:player") return players.slice();
        return players.filter(player => literalMatches(player, parsed.value));
    }

    const filtered = players.filter(player => passesFilters(player, parsed));
    switch (parsed.base) {
        case "@a":
        case "@e":
            return filtered;
        case "@p": {
            const sameDimension = origin ? filtered.filter(player => player.dimension?.id === origin.dimension) : filtered;
            const nearest = origin ? getNearest(sameDimension, origin) : sameDimension[0];
            return nearest ? [nearest] : [];
        }
        case "@r":
            return filtered.length > 0 ? [filtered[Math.floor(Math.random() * filtered.length)]] : [];
        default:
            return [];
    }
}

export function entityOrigin(entity) {
    return { x: entity.center.x, y: entity.center.y, z: entity.center.z, dimension: entity.dimension };
}
