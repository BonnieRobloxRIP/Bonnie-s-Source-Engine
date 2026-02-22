function lengthOf(v) {
    return Math.sqrt((v.x * v.x) + (v.y * v.y) + (v.z * v.z));
}

function normalize(v) {
    const len = lengthOf(v);
    if (len <= 0.000001) return { x: 0, y: 0, z: 1 };
    return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function cross(a, b) {
    return {
        x: (a.y * b.z) - (a.z * b.y),
        y: (a.z * b.x) - (a.x * b.z),
        z: (a.x * b.y) - (a.y * b.x)
    };
}

function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scale(v, s) {
    return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function makeBasis(direction) {
    const forward = normalize(direction);
    const seed = Math.abs(forward.y) > 0.92
        ? { x: 1, y: 0, z: 0 }
        : { x: 0, y: 1, z: 0 };

    const right = normalize(cross(forward, seed));
    const up = normalize(cross(right, forward));
    return { forward, right, up };
}

function wobbleOffsets(distance, time, strandPhase, ampNear, ampFar) {
    const distanceT = Math.min(1, Math.max(0, distance / 28));
    const amplitude = ampNear + ((ampFar - ampNear) * distanceT);

    const s1 = Math.sin((distance * 0.95) + (time * 0.28) + strandPhase);
    const s2 = Math.sin((distance * 2.15) - (time * 0.41) + (strandPhase * 1.7));
    const c1 = Math.cos((distance * 1.45) + (time * 0.33) + (strandPhase * 0.8));
    const c2 = Math.sin((distance * 2.95) + (time * 0.21) + (strandPhase * 2.4));

    return {
        right: (s1 * 0.65 + s2 * 0.35) * amplitude,
        up: (c1 * 0.6 + c2 * 0.4) * amplitude
    };
}

export function renderGluonBeamVisual(config) {
    const {
        dimension,
        origin,
        direction,
        length,
        tick,
        coreParticle = "minecraft:electric_spark_particle",
        arcParticle = "minecraft:electric_spark_particle",
        step = 0.4,
        strands = 3,
        ampNear = 0.04,
        ampFar = 0.18,
        maxParticles = 40
    } = config;

    if (!dimension || !origin || !direction || !Number.isFinite(length) || length <= 0) return;

    const { forward, right, up } = makeBasis(direction);
    const safeStep = Math.max(0.1, step);
    const strandCount = Math.max(1, Math.floor(strands));
    const particleBudget = Math.max(1, Math.floor(maxParticles));
    let spawnedCount = 0;

    let canSpawnCore = true;
    let canSpawnArc = true;

    try {
        dimension.spawnParticle(coreParticle, origin);
        spawnedCount++;
    } catch {
        canSpawnCore = false;
    }

    try {
        dimension.spawnParticle(arcParticle, origin);
        spawnedCount++;
    } catch {
        canSpawnArc = false;
    }

    if (!canSpawnCore && !canSpawnArc) return;

    for (let distance = 0; distance <= length; distance += safeStep) {
        if (spawnedCount >= particleBudget) return;
        const basePoint = add(origin, scale(forward, distance));

        if (canSpawnCore) {
            try {
                dimension.spawnParticle(coreParticle, basePoint);
                spawnedCount++;
            } catch {
                canSpawnCore = false;
            }
        }

        for (let strand = 0; strand < strandCount; strand++) {
            if (spawnedCount >= particleBudget) return;
            const strandPhase = (strand / strandCount) * (Math.PI * 2);
            const jitterPhase = ((strand + 1) * 0.37) + ((tick % 31) * 0.03);
            const offsets = wobbleOffsets(distance, tick + jitterPhase, strandPhase, ampNear, ampFar);

            const wobblePoint = add(
                basePoint,
                add(scale(right, offsets.right), scale(up, offsets.up))
            );

            if (canSpawnArc) {
                try {
                    dimension.spawnParticle(arcParticle, wobblePoint);
                    spawnedCount++;
                } catch {
                    canSpawnArc = false;
                }
            }
        }

        if (!canSpawnCore && !canSpawnArc) return;
    }
}
