const TABLE_ID = "brr:cafeteria_table";

const OFFSETS = {
    north: { x: 0, z: -1 }, south: { x: 0, z: 1 },
    east: { x: 1, z: 0 }, west: { x: -1, z: 0 }
};
const OPPOSITE = { north: "south", south: "north", east: "west", west: "east" };

function getTable(dimension, location) {
    try {
        const block = dimension.getBlock(location);
        return block?.typeId === TABLE_ID ? block : undefined;
    } catch {
        return undefined;
    }
}

function step(block, direction) {
    const offset = OFFSETS[direction];
    return { x: block.x + offset.x, y: block.y, z: block.z + offset.z };
}

// a neighbour only joins if it runs along the same axis (facing the same or opposite way)
function isJoinedAt(block, direction) {
    const neighbor = getTable(block.dimension, step(block, direction));
    if (!neighbor) return false;
    const facing = block.permutation.getState("minecraft:cardinal_direction");
    const other = neighbor.permutation.getState("minecraft:cardinal_direction");
    return other === facing || other === OPPOSITE[facing];
}

// the model's north (leg_n) side points toward the block's cardinal_direction
function updateTable(block) {
    const facing = block.permutation.getState("minecraft:cardinal_direction");
    if (!OFFSETS[facing]) return;
    const joinedN = isJoinedAt(block, facing);
    const joinedS = isJoinedAt(block, OPPOSITE[facing]);
    const permutation = block.permutation;
    if (permutation.getState("brr:joined_n") === joinedN && permutation.getState("brr:joined_s") === joinedS) return;
    block.setPermutation(permutation.withState("brr:joined_n", joinedN).withState("brr:joined_s", joinedS));
}

function updateNeighbors(dimension, location) {
    for (const direction in OFFSETS) {
        const neighbor = getTable(dimension, step(location, direction));
        if (neighbor) updateTable(neighbor);
    }
}

export function registerCafeteriaTableComponents(blockComponentRegistry) {
    blockComponentRegistry.registerCustomComponent(TABLE_ID, {
        onPlace({ block, dimension }) {
            updateTable(block);
            updateNeighbors(dimension, block.location);
        },
        onBreak({ block, dimension }) {
            updateNeighbors(dimension, block.location);
        }
    });
}
