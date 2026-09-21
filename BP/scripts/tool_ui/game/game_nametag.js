import { world } from "@minecraft/server";

function normalizeLiteralSelector(value) {
    const raw = `${value ?? ""}`.trim();
    const quoted = raw.match(/^(["'])(.*)\1$/);
    return `${quoted ? quoted[2] : raw}`.trim().toLowerCase();
}

// SECTION: Game Nametag Runtime Helpers
export function getGameNametagTargets(block, selectorRaw, options) {
    const selector = `${selectorRaw ?? "@a"}`.trim();
    const normalized = selector.toLowerCase();

    const { parseSelectorFilters, applyEntityFilters } = options ?? {};

    let dimension;
    try {
        dimension = world.getDimension(block.dimension);
    } catch {
        return [];
    }

    if (normalized.startsWith("@")) {
        const filters = typeof parseSelectorFilters === "function" ? parseSelectorFilters(selector) : null;
        const base = normalized.slice(0, 2);

        if (base === "@a" || base === "@p" || base === "@r") {
            let players = Array.from(dimension.getPlayers());
            players = typeof applyEntityFilters === "function" ? applyEntityFilters(players, filters) : players;

            if (base === "@p") {
                return players.length > 0 ? [players[0]] : [];
            }

            if (base === "@r") {
                if (players.length === 0) return [];
                const randomIndex = Math.floor(Math.random() * players.length);
                return [players[randomIndex]];
            }

            return players;
        }

        if (base === "@e") {
            let entities = Array.from(dimension.getEntities());
            entities = typeof applyEntityFilters === "function" ? applyEntityFilters(entities, filters) : entities;
            return entities.filter(entity => entity?.typeId === "minecraft:player");
        }

        return [];
    }

    const literal = normalizeLiteralSelector(selector);
    const players = Array.from(dimension.getPlayers());

    if (literal === "minecraft:player") {
        return players;
    }

    return players.filter(player => {
        const playerName = normalizeLiteralSelector(player?.name);
        const playerTag = normalizeLiteralSelector(player?.nameTag);
        return playerName === literal || playerTag === literal;
    });
}
