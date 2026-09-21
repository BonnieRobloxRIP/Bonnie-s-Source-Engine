import { world } from "@minecraft/server";

function normalizeLiteralSelector(value) {
    const raw = `${value ?? ""}`.trim();
    const quoted = raw.match(/^(["'])(.*)\1$/);
    return `${quoted ? quoted[2] : raw}`.trim().toLowerCase();
}

// SECTION: AreaPortal Runtime Helpers
export function getAreaPortalTargets(block, selectorRaw, options) {
    const selector = `${selectorRaw ?? "minecraft:player"}`.trim();
    const normalized = selector.toLowerCase();

    const { parseSelectorFilters, applyEntityFilters } = options ?? {};

    let dimension;
    try {
        dimension = world.getDimension(block.dimension);
    } catch {
        return [];
    }

    const blockCenter = { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 };

    if (normalized.startsWith("@")) {
        const filters = typeof parseSelectorFilters === "function" ? parseSelectorFilters(selector) : null;
        const base = normalized.slice(0, 2);

        if (base === "@a") {
            let players = Array.from(dimension.getPlayers());
            players = typeof applyEntityFilters === "function" ? applyEntityFilters(players, filters) : players;
            return players;
        }

        if (base === "@e") {
            let entities = Array.from(dimension.getEntities());
            entities = typeof applyEntityFilters === "function" ? applyEntityFilters(entities, filters) : entities;
            return entities;
        }

        if (base === "@p") {
            let players = Array.from(dimension.getPlayers());
            players = typeof applyEntityFilters === "function" ? applyEntityFilters(players, filters) : players;
            if (players.length === 0) return [];

            players.sort((a, b) => {
                const adx = a.location.x - blockCenter.x;
                const ady = a.location.y - blockCenter.y;
                const adz = a.location.z - blockCenter.z;
                const bdx = b.location.x - blockCenter.x;
                const bdy = b.location.y - blockCenter.y;
                const bdz = b.location.z - blockCenter.z;
                return (adx * adx + ady * ady + adz * adz) - (bdx * bdx + bdy * bdy + bdz * bdz);
            });

            return [players[0]];
        }

        if (base === "@r") {
            let players = Array.from(dimension.getPlayers());
            players = typeof applyEntityFilters === "function" ? applyEntityFilters(players, filters) : players;
            if (players.length === 0) return [];
            const randomIndex = Math.floor(Math.random() * players.length);
            return [players[randomIndex]];
        }

        if (base === "@s") {
            return [];
        }

        return [];
    }

    const literal = normalizeLiteralSelector(selector);
    const players = Array.from(dimension.getPlayers());

    if (literal === "minecraft:player") {
        return players;
    }

    const matchedPlayers = players.filter(player => {
        const playerName = normalizeLiteralSelector(player?.name);
        const playerTag = normalizeLiteralSelector(player?.nameTag);
        return playerName === literal || playerTag === literal;
    });

    if (matchedPlayers.length > 0) {
        return matchedPlayers;
    }

    try {
        return Array.from(dimension.getEntities({ type: literal }));
    } catch {
        return [];
    }
}

export function handleAreaPortalBlock(block, blocks, options) {
    if (!block || !blocks) return;

    const { isEntityInsideBlock, parseSelectorFilters, applyEntityFilters } = options ?? {};
    if (typeof isEntityInsideBlock !== "function") return;

    const targets = getAreaPortalTargets(block, block.data?.selector, { parseSelectorFilters, applyEntityFilters });
    for (const entity of targets) {
        if (!isEntityInsideBlock(entity, block)) continue;

        let destCoords = null;
        const destDim = world.getDimension(block.dimension);

        if (block.data?.destinationBlock) {
            const targetBlock = blocks.find(b => b.typeId === "brr:info_target_areaportal_block" && b.data?.name === block.data.destinationBlock);
            if (targetBlock) {
                destCoords = { x: targetBlock.x + 0.5, y: targetBlock.y, z: targetBlock.z + 0.5 };
                const facingRaw = `${targetBlock.data?.targetFacingDirection ?? ""}`.trim();
                const facingParts = facingRaw.split(/\s+/).map(part => Number.parseFloat(part));
                const hasFacing = facingParts.length === 3 && facingParts.every(Number.isFinite);

                if (hasFacing) {
                    const fx = facingParts[0];
                    const fy = facingParts[1];
                    const fz = facingParts[2];
                    const dx = fx - destCoords.x;
                    const dy = fy - destCoords.y;
                    const dz = fz - destCoords.z;
                    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
                    const yaw = Math.atan2(-dx, dz) * (180 / Math.PI);
                    const pitch = Math.atan2(dy, horizontalDistance) * (180 / Math.PI);

                    try {
                        entity.teleport(destCoords, {
                            dimension: destDim,
                            rotation: {
                                x: pitch,
                                y: yaw
                            }
                        });
                        continue;
                    } catch { }
                }
            }
        } else if (block.data?.destination) {
            const coords = `${block.data.destination}`.trim().split(/\s+/);
            if (coords.length === 3) {
                destCoords = { x: Number.parseFloat(coords[0]), y: Number.parseFloat(coords[1]), z: Number.parseFloat(coords[2]) };
            }
        }

        if (destCoords && destDim) {
            try {
                entity.teleport(destCoords, { dimension: destDim });
            } catch { }
        }
    }
}
