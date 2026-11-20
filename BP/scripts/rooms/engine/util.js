import { world } from "@minecraft/server";

// ---------- positions ----------

// [x, y, z] offset -> "~x ~y ~z" (relative to the room entity, like in mcfunctions)
export function rel(offset) {
	return offset.map((n) => (n ? `~${n}` : "~")).join(" ");
}

export function addOffset(location, offset) {
	return { x: location.x + offset[0], y: location.y + offset[1], z: location.z + offset[2] };
}

export function blockAt(location, offset) {
	return {
		x: Math.floor(location.x + offset[0]),
		y: Math.floor(location.y + offset[1]),
		z: Math.floor(location.z + offset[2]),
	};
}

export function sumOffsets(...offsets) {
	return offsets.reduce((sum, o) => [sum[0] + (o?.[0] ?? 0), sum[1] + (o?.[1] ?? 0), sum[2] + (o?.[2] ?? 0)], [0, 0, 0]);
}

// Same rules as a dx/dy/dz selector: the zone starts at `at` and covers size + 1 blocks on each axis.
export function isInZone(origin, zone, entityLocation) {
	const min = blockAt(origin, zone.at);
	const p = { x: Math.floor(entityLocation.x), y: Math.floor(entityLocation.y), z: Math.floor(entityLocation.z) };
	return (
		p.x >= min.x && p.x <= min.x + zone.size[0] &&
		p.y >= min.y && p.y <= min.y + zone.size[1] &&
		p.z >= min.z && p.z <= min.z + zone.size[2]
	);
}

// ---------- scoreboard ----------

export function getScore(objectiveId, participant) {
	try {
		return world.scoreboard.getObjective(objectiveId)?.getScore(participant);
	} catch {
		return undefined;
	}
}

export function setScore(objectiveId, participant, value) {
	try {
		const objective = world.scoreboard.getObjective(objectiveId) ?? world.scoreboard.addObjective(objectiveId, objectiveId);
		objective.setScore(participant, value);
	} catch (error) {
		console.warn(`[Flood Escape] Could not set ${participant} ${objectiveId}: ${error}`);
	}
}

export function resetScore(objectiveId, participant) {
	try {
		world.scoreboard.getObjective(objectiveId)?.removeParticipant(participant);
	} catch {
		// Not set; nothing to reset.
	}
}

// ---------- misc ----------

export function isValid(entity) {
	if (!entity) return false;
	try {
		return typeof entity.isValid === "function" ? entity.isValid() : entity.isValid;
	} catch {
		return false;
	}
}

export function pickRandom(list) {
	return list[Math.floor(Math.random() * list.length)];
}

const warned = new Set();
export function warnOnce(key, message) {
	if (warned.has(key)) return;
	warned.add(key);
	console.warn(`[Flood Escape] ${message}`);
}
