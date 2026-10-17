export const NEIGHBOR_OFFSETS = [
    { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }
];

export function distanceSquared(a, b) {
    const x = a.x - b.x;
    const y = a.y - b.y;
    const z = a.z - b.z;
    return x * x + y * y + z * z;
}
