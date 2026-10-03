import { world } from "@minecraft/server";

function normalizeLiteralSelector(value) {
    const raw = `${value ?? ""}`.trim();
    const quoted = raw.match(/^("|')(.*)\1$/);
    return `${quoted ? quoted[2] : raw}`.trim().toLowerCase();
}

// SECTION: Playerspawn Runtime Helpers
export function parseSpawnCoordinates(raw) {
    const coords = `${raw ?? ""}`.trim().split(/\s+/);
    if (coords.length !== 3) return null;

    const x = Number.parseFloat(coords[0]);
    const y = Number.parseFloat(coords[1]);
    const z = Number.parseFloat(coords[2]);

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
    return { x: x + 0.5, y: y + 0, z: z + 0.5 };
}

export function applyWorldSpawnPoint(spawnCoords) {
    const x = spawnCoords.x;
    const y = spawnCoords.y;
    const z = spawnCoords.z;

    try {
        world.setDefaultSpawnLocation({ x, y, z });
        return true;
    } catch { }

    try {
        world.getDimension("minecraft:overworld").runCommand(`setworldspawn ${x} ${y} ${z}`);
        return true;
    } catch { }

    return false;
}

export function applySpawnPointForPlayer(player, spawnCoords, dim) {
    try {
        player.setSpawnPoint(spawnCoords, dim);
        return true;
    } catch { }

    try {
        player.setSpawnPoint({
            x: spawnCoords.x,
            y: spawnCoords.y,
            z: spawnCoords.z,
            dimension: dim
        });
        return true;
    } catch { }

    try {
        player.runCommand(`spawnpoint @s ${Math.floor(spawnCoords.x)} ${Math.floor(spawnCoords.y)} ${Math.floor(spawnCoords.z)}`);
        return true;
    } catch { }

    return false;
}

export function getActivePlayerspawnBlocks(blocks) {
    return blocks.filter(block =>
        block.typeId === "brr:info_playerspawn_block" && !block.data?.startDisabled
    );
}

export function getPlayerspawnSpawnConfig(activeBlock, parseBooleanLikeFn) {
    if (!activeBlock || typeof parseBooleanLikeFn !== "function") return null;

    const worldSpawnAtBlock = parseBooleanLikeFn(activeBlock.data?.worldSpawnAtBlock, true);
    const setsPlayerSpawnPoint = parseBooleanLikeFn(activeBlock.data?.setsPlayerSpawnPoint, false);

    let spawnCoords = null;
    if (worldSpawnAtBlock) {
        spawnCoords = { x: activeBlock.x + 0.5, y: activeBlock.y + 0, z: activeBlock.z + 0.5 };
    } else if (activeBlock.data?.worldSpawn) {
        spawnCoords = parseSpawnCoordinates(activeBlock.data.worldSpawn);
    }

    if (!spawnCoords) return null;

    return {
        spawnCoords,
        setsPlayerSpawnPoint,
        spawnDim: world.getDimension(activeBlock.dimension)
    };
}

export function getPlayerspawnTargets(block, selectorRaw, options) {
    const selector = `${selectorRaw ?? "@a"}`.trim() || "@a";
    const normalized = selector.toLowerCase();
    const allPlayers = Array.from(world.getPlayers());

    const { parseSelectorFilters, applyEntityFilters } = options ?? {};

    if (normalized.startsWith("@")) {
        const filters = typeof parseSelectorFilters === "function" ? parseSelectorFilters(selector) : null;
        const base = normalized.slice(0, 2);

        if (base === "@a" || base === "@p" || base === "@r" || base === "@e") {
            let players = allPlayers;
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

        return [];
    }

    const literal = normalizeLiteralSelector(selector);
    const players = allPlayers;

    if (literal === "minecraft:player") {
        return players;
    }

    return players.filter(player => {
        const playerName = normalizeLiteralSelector(player?.name);
        const playerTag = normalizeLiteralSelector(player?.nameTag);
        return playerName === literal || playerTag === literal;
    });
}
