import { EntityDamageCause, system, world } from "@minecraft/server";
import { renderGluonBeamVisual } from "./gluon_beam_visual.js";

const LASER_ENTITY_TYPE = "brr:flood_room";
const LASER_SPECIAL_NAME = "laser";

const SPIN_SPEED_OBJECTIVE = "laser_spin_speed";
const LASER_VISIBILITY_OBJECTIVE = "laser_visibility";
const GLOBAL_SPIN_SPEED_PLAYER = "$global";
const LASER_VISIBILITY = 1;

const DEFAULT_SPIN_SPEED_DEGREES = 4;
const MIN_SPIN_SPEED_DEGREES = -90;
const MAX_SPIN_SPEED_DEGREES = 90;

const LASER_HEIGHT_OFFSET = 0.5;
const LASER_BEAM_LENGTH = 8;
const LASER_DAMAGE_RADIUS = 0.8;
const LASER_DAMAGE = 7;
const LASER_PARTICLE_RENDER_INTERVAL_TICKS = 1;
const DAMAGE_INTERVAL_TICKS = 2;
const DAMAGE_CLEANUP_TICKS = 240;
const QUERY_RADIUS = LASER_BEAM_LENGTH + 2.5;

const LASER_BEAM_STEP = 0.24;
const LASER_BEAM_STRANDS = 0.24;
const LASER_BEAM_AURA_STRIDE = 1;
const LASER_BEAM_MAX_PARTICLES = 74;

const GLUON_AURA_PARTICLE = "brr:gluon_beam_aura";
const GLUON_CORE_PARTICLE = "brr:gluon_beam_core";
const GLUON_ARC_PARTICLE = "brr:gluon_beam_arc";
const FALLBACK_PARTICLE = "minecraft:basic_flame_particle";

const GLOBAL_SPEED_CACHE_TICKS = 20;

const lastDamageTickByPair = new Map();
const yawByLaserId = new Map();

let isRegistered = false;
let lastKnownGlobalSpinSpeed = null;
let lastKnownGlobalSpinTick = -999999;
let lastKnownGlobalVisibility = null;
let lastKnownGlobalVisibilityTick = -999999;

function lengthOf(vector) {
	return Math.sqrt((vector.x * vector.x) + (vector.y * vector.y) + (vector.z * vector.z));
}

function normalize(vector) {
	const vectorLength = lengthOf(vector);
	if (vectorLength <= 0.000001) {
		return { x: 0, y: 0, z: 1 };
	}

	return {
		x: vector.x / vectorLength,
		y: vector.y / vectorLength,
		z: vector.z / vectorLength
	};
}

function add(a, b) {
	return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function subtract(a, b) {
	return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function scale(vector, scalar) {
	return {
		x: vector.x * scalar,
		y: vector.y * scalar,
		z: vector.z * scalar
	};
}

function dot(a, b) {
	return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
}

function cross(a, b) {
	return {
		x: (a.y * b.z) - (a.z * b.y),
		y: (a.z * b.x) - (a.x * b.z),
		z: (a.x * b.y) - (a.y * b.x)
	};
}

function clamp(value, minValue, maxValue) {
	return Math.min(maxValue, Math.max(minValue, value));
}

function hashString(value) {
	let hash = 0;

	for (let index = 0; index < value.length; index++) {
		hash = ((hash << 5) - hash) + value.charCodeAt(index);
		hash |= 0;
	}

	return Math.abs(hash);
}

function getCurrentTick() {
	try {
		const tick = Number(system?.currentTick);
		if (Number.isFinite(tick) && tick >= 0) {
			return tick;
		}
	} catch { }

	try {
		return Number.parseInt(`${world.getAbsoluteTime?.() ?? 0}`, 10) || 0;
	} catch {
		return 0;
	}
}

function getNamedLaserEntities() {
	const lasers = [];
	const dimensionIds = ["overworld", "nether", "the_end"];

	for (const dimensionId of dimensionIds) {
		try {
			const dimension = world.getDimension(dimensionId);
			const entities = dimension.getEntities({
				type: LASER_ENTITY_TYPE,
				name: LASER_SPECIAL_NAME
			});

			for (const entity of entities) {
				lasers.push(entity);
			}
		} catch { }
	}

	return lasers;
}

function ensureSpinSpeedObjectiveExists() {
	try {
		const overworld = world.getDimension("overworld");
		overworld.runCommand(`scoreboard objectives add ${SPIN_SPEED_OBJECTIVE} dummy`);
	} catch { }
}

function ensureLaserVisibilityObjectiveExists() {
	try {
		const overworld = world.getDimension("overworld");
		overworld.runCommand(`scoreboard objectives add ${LASER_VISIBILITY_OBJECTIVE} dummy`);
	} catch { }
}

function getSpinSpeedObjective() {
	try {
		return world.scoreboard.getObjective(SPIN_SPEED_OBJECTIVE) ?? null;
	} catch {
		return null;
	}
}

function getLaserVisibilityObjective() {
	try {
		return world.scoreboard.getObjective(LASER_VISIBILITY_OBJECTIVE) ?? null;
	} catch {
		return null;
	}
}

function getScoreIfExists(objective, participant) {
	if (!objective || !participant) return null;

	try {
		const score = Number(objective.getScore(participant));
		if (Number.isFinite(score)) {
			return score;
		}
	} catch { }

	return null;
}

function getGlobalSpinSpeed(objective, tick) {
	if ((tick - lastKnownGlobalSpinTick) < GLOBAL_SPEED_CACHE_TICKS) {
		return lastKnownGlobalSpinSpeed;
	}

	let globalSpeed = null;

	try {
		for (const entry of objective.getScores()) {
			const participantName = `${entry?.participant?.displayName ?? ""}`.trim();
			if (participantName !== GLOBAL_SPIN_SPEED_PLAYER) continue;

			const value = Number(entry?.score);
			if (Number.isFinite(value)) {
				globalSpeed = value;
			}

			break;
		}
	} catch { }

	lastKnownGlobalSpinTick = tick;
	lastKnownGlobalSpinSpeed = globalSpeed;
	return globalSpeed;
}

function normalizeVisibilityScore(scoreValue) {
	if (!Number.isFinite(scoreValue)) {
		return null;
	}

	return clamp(Math.floor(scoreValue), 0, 1) === 1;
}

function getGlobalLaserVisibility(objective, tick) {
	if ((tick - lastKnownGlobalVisibilityTick) < GLOBAL_SPEED_CACHE_TICKS) {
		return lastKnownGlobalVisibility;
	}

	let globalVisibility = null;

	try {
		for (const entry of objective.getScores()) {
			const participantName = `${entry?.participant?.displayName ?? ""}`.trim();
			if (participantName !== GLOBAL_SPIN_SPEED_PLAYER) continue;

			globalVisibility = normalizeVisibilityScore(Number(entry?.score));
			break;
		}
	} catch { }

	lastKnownGlobalVisibilityTick = tick;
	lastKnownGlobalVisibility = globalVisibility;
	return globalVisibility;
}

function getLaserSpinSpeed(laser, tick) {
	const objective = getSpinSpeedObjective();
	if (!objective) {
		return DEFAULT_SPIN_SPEED_DEGREES;
	}

	const identity = laser?.scoreboardIdentity;
	const entitySpeed = getScoreIfExists(objective, identity);
	if (Number.isFinite(entitySpeed)) {
		return clamp(entitySpeed, MIN_SPIN_SPEED_DEGREES, MAX_SPIN_SPEED_DEGREES);
	}

	const globalSpeed = getGlobalSpinSpeed(objective, tick);
	if (Number.isFinite(globalSpeed)) {
		return clamp(globalSpeed, MIN_SPIN_SPEED_DEGREES, MAX_SPIN_SPEED_DEGREES);
	}

	return DEFAULT_SPIN_SPEED_DEGREES;
}

function getLaserVisibility(laser, tick) {
	const objective = getLaserVisibilityObjective();
	const defaultVisibility = LASER_VISIBILITY === 1;

	if (!objective) {
		return defaultVisibility;
	}

	const identity = laser?.scoreboardIdentity;
	const entityScore = getScoreIfExists(objective, identity);
	const entityVisibility = normalizeVisibilityScore(entityScore);
	if (typeof entityVisibility === "boolean") {
		return entityVisibility;
	}

	const globalVisibility = getGlobalLaserVisibility(objective, tick);
	if (typeof globalVisibility === "boolean") {
		return globalVisibility;
	}

	return defaultVisibility;
}

function getLaserYaw(laser) {
	try {
		const rotation = laser.getRotation?.();
		const yaw = Number(rotation?.y);
		if (Number.isFinite(yaw)) {
			return yaw;
		}
	} catch { }

	const cachedYaw = yawByLaserId.get(laser?.id);
	if (Number.isFinite(cachedYaw)) {
		return cachedYaw;
	}

	return 0;
}

function setLaserYaw(laser, yaw) {
	const location = laser?.location;
	if (!location) return false;

	try {
		laser.teleport(location, {
			dimension: laser.dimension,
			rotation: {
				x: 0,
				y: yaw
			}
		});
		return true;
	} catch { }

	try {
		laser.runCommand(`tp @s ~ ~ ~ ${yaw.toFixed(3)} 0`);
		return true;
	} catch { }

	return false;
}

function spinLaserClockwise(laser, speed) {
	if (!laser?.id) return;

	const currentYaw = getLaserYaw(laser);
	const nextYaw = currentYaw - speed;

	if (setLaserYaw(laser, nextYaw)) {
		yawByLaserId.set(laser.id, nextYaw);
		return;
	}

	yawByLaserId.set(laser.id, currentYaw);
}

function getLaserOrigin(laser) {
	const location = laser?.location ?? { x: 0, y: 0, z: 0 };
	return {
		x: Number(location.x) || 0,
		y: (Number(location.y) || 0) + LASER_HEIGHT_OFFSET,
		z: Number(location.z) || 0
	};
}

function getBeamSideDirection(laser) {
	let forward = { x: 0, y: 0, z: 1 };

	try {
		forward = normalize(laser.getViewDirection());
	} catch { }

	const flattenedForward = normalize({ x: forward.x, y: 0, z: forward.z });
	let side = normalize(cross(flattenedForward, { x: 0, y: 1, z: 0 }));

	if (lengthOf(side) <= 0.000001) {
		side = { x: 1, y: 0, z: 0 };
	}

	return side;
}

function getTargetPoint(entity) {
	const location = entity?.location ?? { x: 0, y: 0, z: 0 };

	let collisionHeight = 1.8;
	try {
		const collision = entity?.getComponent("minecraft:collision_box");
		const rawHeight = Number(collision?.height);
		if (Number.isFinite(rawHeight) && rawHeight > 0) {
			collisionHeight = rawHeight;
		}
	} catch { }

	const centerYOffset = Math.max(0.3, Math.min(1.6, collisionHeight * 0.5));

	return {
		x: location.x,
		y: location.y + centerYOffset,
		z: location.z
	};
}

function isSpectatorPlayer(entity) {
	if (`${entity?.typeId ?? ""}`.trim().toLowerCase() !== "minecraft:player") {
		return false;
	}

	try {
		if (entity.hasTag("spectator")) {
			return true;
		}
	} catch { }

	try {
		const gameMode = `${entity.getGameMode?.() ?? ""}`.trim().toLowerCase();
		if (gameMode === "spectator") {
			return true;
		}
	} catch { }

	return false;
}

function isDamageableTarget(target, laser) {
	if (!target?.id || target.id === laser?.id) return false;
	if (isSpectatorPlayer(target)) return false;

	const typeId = `${target.typeId ?? ""}`.trim().toLowerCase();
	if (!typeId) return false;
	if (typeId === LASER_ENTITY_TYPE) return false;

	if (typeId === "minecraft:item"
		|| typeId === "minecraft:xp_orb"
		|| typeId === "minecraft:arrow"
		|| typeId === "minecraft:snowball"
		|| typeId === "minecraft:egg") {
		return false;
	}

	try {
		return !!target.getComponent("minecraft:health");
	} catch {
		return false;
	}
}

function getDistanceToSegment(point, start, end) {
	const segment = subtract(end, start);
	const segmentLengthSquared = dot(segment, segment);

	if (segmentLengthSquared <= 0.000001) {
		return {
			distance: lengthOf(subtract(point, start)),
			t: 0
		};
	}

	const projected = dot(subtract(point, start), segment) / segmentLengthSquared;
	const t = clamp(projected, 0, 1);
	const nearest = add(start, scale(segment, t));

	return {
		distance: lengthOf(subtract(point, nearest)),
		t
	};
}

function applyLaserDamage(laser, target, tick) {
	if (!laser?.id || !target?.id) return;

	const pairKey = `${laser.id}|${target.id}`;
	const previousDamageTick = lastDamageTickByPair.get(pairKey);
	if (Number.isFinite(previousDamageTick) && (tick - previousDamageTick) < DAMAGE_INTERVAL_TICKS) {
		return;
	}

	lastDamageTickByPair.set(pairKey, tick);

	let didDamage = false;
	try {
		didDamage = !!target.applyDamage(LASER_DAMAGE, {
			cause: EntityDamageCause.contact,
			damagingEntity: laser
		});
	} catch { }

	if (didDamage) return;

	// Peaceful can suppress mob-style contact damage; retry without a damager source.
	try {
		didDamage = !!target.applyDamage(LASER_DAMAGE, {
			cause: EntityDamageCause.contact
		});
	} catch { }

	if (didDamage) return;

	if (`${target.typeId ?? ""}`.trim().toLowerCase() !== "minecraft:player") return;

	try {
		const safeName = `${target.name ?? ""}`
			.replace(/\\/g, "\\\\")
			.replace(/"/g, "\\\"");
		laser.runCommand(`damage @a[name="${safeName}",c=1] ${LASER_DAMAGE} override`);
		return;
	} catch { }

	try {
		const safeName = `${target.name ?? ""}`
			.replace(/\\/g, "\\\\")
			.replace(/"/g, "\\\"");
		laser.runCommand(`damage @a[name="${safeName}",c=1] ${LASER_DAMAGE} contact`);
	} catch { }
}

function renderBeam(dimension, origin, direction, tick) {
	renderGluonBeamVisual({
		dimension,
		origin,
		direction,
		length: LASER_BEAM_LENGTH,
		tick,
		auraParticle: GLUON_AURA_PARTICLE,
		coreParticle: GLUON_CORE_PARTICLE,
		arcParticle: GLUON_ARC_PARTICLE,
		fallbackAuraParticle: GLUON_ARC_PARTICLE,
		fallbackCoreParticle: GLUON_ARC_PARTICLE,
		fallbackArcParticle: FALLBACK_PARTICLE,
		step: LASER_BEAM_STEP,
		stepGrowth: 0.55,
		strands: LASER_BEAM_STRANDS,
		ampNear: 0.11,
		ampFar: 0.52,
		spiralTightness: 1.1,
		spiralTimeScale: 0.58,
		forwardLeadNear: 0.08,
		forwardLeadFar: 0.44,
		pathWobbleNear: 0.03,
		pathWobbleFar: 0.36,
		pathSwayAmount: 0.95,
		pathSwayFrequency: 0.84,
		pathSwayTimeScale: 0.47,
		coreFollowNear: 0.02,
		coreFollowFar: 0.16,
		auraStride: LASER_BEAM_AURA_STRIDE,
		maxParticles: LASER_BEAM_MAX_PARTICLES
	});
}

function shouldRenderParticlesThisTick(laser, tick) {
	if (LASER_PARTICLE_RENDER_INTERVAL_TICKS <= 1) {
		return true;
	}

	const laserId = `${laser?.id ?? "laser"}`;
	const tickOffset = hashString(laserId) % LASER_PARTICLE_RENDER_INTERVAL_TICKS;
	return ((tick + tickOffset) % LASER_PARTICLE_RENDER_INTERVAL_TICKS) === 0;
}

function damageAlongBeam(laser, origin, direction, targets, tick) {
	const beamEnd = add(origin, scale(direction, LASER_BEAM_LENGTH));

	for (const target of targets) {
		if (!isDamageableTarget(target, laser)) continue;

		const targetPoint = getTargetPoint(target);
		const nearest = getDistanceToSegment(targetPoint, origin, beamEnd);
		if (nearest.distance > LASER_DAMAGE_RADIUS) continue;

		applyLaserDamage(laser, target, tick);
	}
}

function processLaser(laser, tick) {
	const spinSpeed = getLaserSpinSpeed(laser, tick);
	if (Math.abs(spinSpeed) > 0.0001) {
		spinLaserClockwise(laser, spinSpeed);
	}

	const shouldRenderParticles = getLaserVisibility(laser, tick);
	const shouldRenderParticlesThisFrame = shouldRenderParticlesThisTick(laser, tick);

	const origin = getLaserOrigin(laser);
	const sideDirection = getBeamSideDirection(laser);
	const oppositeDirection = scale(sideDirection, -1);

	if (shouldRenderParticles && shouldRenderParticlesThisFrame) {
		renderBeam(laser.dimension, origin, sideDirection, tick);
		renderBeam(laser.dimension, origin, oppositeDirection, tick);
	}

	let targets = [];
	try {
		targets = laser.dimension.getEntities({
			location: origin,
			maxDistance: QUERY_RADIUS
		});
	} catch {
		targets = [];
	}

	damageAlongBeam(laser, origin, sideDirection, targets, tick);
	damageAlongBeam(laser, origin, oppositeDirection, targets, tick);
}

function cleanupRuntimeState() {
	const tick = getCurrentTick();

	for (const [pairKey, lastTick] of lastDamageTickByPair.entries()) {
		if (!Number.isFinite(lastTick) || (tick - lastTick) > DAMAGE_CLEANUP_TICKS) {
			lastDamageTickByPair.delete(pairKey);
		}
	}

	const activeLaserIds = new Set();
	for (const laser of getNamedLaserEntities()) {
		if (laser?.id) {
			activeLaserIds.add(laser.id);
		}
	}

	for (const laserId of yawByLaserId.keys()) {
		if (!activeLaserIds.has(laserId)) {
			yawByLaserId.delete(laserId);
		}
	}
}

function runLaserTick() {
	const tick = getCurrentTick();

	if ((tick % 240) === 0) {
		ensureSpinSpeedObjectiveExists();
		ensureLaserVisibilityObjectiveExists();
	}

	const lasers = getNamedLaserEntities();
	for (const laser of lasers) {
		processLaser(laser, tick);
	}
}

export function registerLaserSystems() {
	if (isRegistered) {
		return;
	}

	isRegistered = true;
	ensureSpinSpeedObjectiveExists();
	ensureLaserVisibilityObjectiveExists();

	system.runInterval(() => {
		runLaserTick();
	}, 1);

	system.runInterval(() => {
		cleanupRuntimeState();
	}, 120);
}
