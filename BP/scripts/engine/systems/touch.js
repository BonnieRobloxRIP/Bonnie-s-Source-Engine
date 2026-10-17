import { system, world } from "@minecraft/server";
import { evaluateCondition } from "../../handler/core/condition_executer.js";
import { findEntitiesByName, getEntitiesOfClass, getEntityAt, getEntityById } from "../registry.js";
import { fireOutput, isBlockedCommand } from "../io.js";
import { entityOrigin, selectorCanMatchNonPlayers, selectorMatchesEntity } from "../selectors.js";
import { getEngineSettings, getProbeOffsets, safeGetDimension } from "../runtime.js";
import { passesEntityFilter } from "./filters.js";

// SECTION: Brush Touch
// trigger and areaportal brushes react to what is inside them. Instead of testing every brush
// cell against every player, each player looks up the cells at its own probe points, so the
// cost is a few map lookups per player no matter how large the map's brushes are.

const TRIGGER = "brr:tool_trigger";
const AREAPORTAL = "brr:tool_areaportal";
const TARGET_AREAPORTAL = "brr:info_target_areaportal_block";
const PASS_INTERVAL_TICKS = 2;

// trigger entity id -> Map(player id -> player) of players touching it that pass its condition.
const triggerTouching = new Map();

function collectTouchedBrushes(entity, touched) {
    let location;
    let dimensionId;
    try {
        location = entity.location;
        dimensionId = entity.dimension.id;
    } catch {
        return;
    }

    const x = Math.floor(location.x);
    const z = Math.floor(location.z);
    let lastY = NaN;
    for (const offset of getProbeOffsets(entity)) {
        const y = Math.floor(location.y + offset);
        if (y === lastY) continue;
        lastY = y;

        const brush = getEntityAt(dimensionId, x, y, z);
        if (!brush || (brush.typeId !== TRIGGER && brush.typeId !== AREAPORTAL)) continue;

        let occupants = touched.get(brush);
        if (!occupants) touched.set(brush, occupants = new Set());
        occupants.add(entity);
    }
}

// SECTION: Triggers
function getConditionData(data) {
    return {
        executeCondition: data?.executeCondition || "noCondition",
        conditionValue1: data?.conditionValue1 || "",
        conditionValue2: data?.conditionValue2 || "",
        conditionValue3: data?.conditionValue3 || ""
    };
}

// Occupants must pass the trigger's Filter (if any) and then its condition.
function getPassingOccupants(trigger, allOccupants) {
    const occupants = allOccupants.filter(player => passesEntityFilter(trigger, player));
    if (occupants.length === 0) return occupants;

    const conditionData = getConditionData(trigger.data);
    if (conditionData.executeCondition === "noCondition") return occupants;

    // World-level conditions give the same answer for every occupant: evaluate them once.
    if (!conditionData.executeCondition.startsWith("ifPlayer")) {
        return evaluateCondition(conditionData, occupants[0], world) ? occupants : [];
    }
    return occupants.filter(player => evaluateCondition(conditionData, player, world));
}

function updateTrigger(trigger, occupants) {
    const previous = triggerTouching.get(trigger.id) ?? new Map();
    const passing = occupants.length > 0 ? getPassingOccupants(trigger, occupants) : [];
    const current = new Map(passing.map(player => [player.id, player]));

    for (const [playerId, player] of current) {
        if (!previous.has(playerId)) fireOutput(trigger, "OnStartTouch", player);
    }
    if (previous.size === 0 && current.size > 0) fireOutput(trigger, "OnStartTouchAll", passing[0]);

    let lastLeaving;
    for (const [playerId, player] of previous) {
        if (current.has(playerId)) continue;
        lastLeaving = player;
        fireOutput(trigger, "OnEndTouch", player);
    }
    if (previous.size > 0 && current.size === 0) fireOutput(trigger, "OnEndTouchAll", lastLeaving);

    const command = `${trigger.data?.runCommand ?? ""}`.trim();
    if (command && !isBlockedCommand(command)) {
        for (const player of passing) {
            try {
                player.runCommand(command);
            } catch { }
        }
    }

    if (current.size > 0) triggerTouching.set(trigger.id, current);
    else triggerTouching.delete(trigger.id);
}

// SECTION: Area Portals
function getPortalDestination(portal) {
    const data = portal.data ?? {};
    const destinationName = `${data.destinationBlock ?? ""}`.trim();

    if (destinationName) {
        const target = findEntitiesByName(destinationName).find(entity => entity.typeId === TARGET_AREAPORTAL);
        if (!target) return null;

        const cell = target.cells[0];
        const location = { x: cell.x + 0.5, y: cell.y, z: cell.z + 0.5 };
        const facing = `${target.data?.targetFacingDirection ?? ""}`.trim().split(/\s+/).map(Number.parseFloat);
        if (facing.length !== 3 || !facing.every(Number.isFinite)) return { location, dimension: target.dimension };

        const dx = facing[0] - location.x;
        const dy = facing[1] - location.y;
        const dz = facing[2] - location.z;
        const rotation = {
            x: Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * (180 / Math.PI),
            y: Math.atan2(-dx, dz) * (180 / Math.PI)
        };
        return { location, dimension: target.dimension, rotation };
    }

    const coords = `${data.destination ?? ""}`.trim().split(/\s+/).map(Number.parseFloat);
    if (coords.length !== 3 || !coords.every(Number.isFinite)) return null;
    return { location: { x: coords[0], y: coords[1], z: coords[2] }, dimension: portal.dimension };
}

function getPortalSelector(portal) {
    return `${portal.data?.selector ?? ""}`.trim() || "minecraft:player";
}

function teleportThroughPortal(portal, entity) {
    const destination = getPortalDestination(portal);
    const dimension = destination ? safeGetDimension(destination.dimension) : undefined;
    if (!dimension) return;

    try {
        entity.teleport(destination.location, destination.rotation
            ? { dimension, rotation: destination.rotation }
            : { dimension });
        fireOutput(portal, "OnStartTouch", entity);
    } catch { }
}

function isInsidePortal(portal, entity) {
    const touched = new Map();
    collectTouchedBrushes(entity, touched);
    return touched.has(portal);
}

// Mobs only need checking for portals whose selector can match them; one volume query per portal.
function updatePortalMobs(portal, selector) {
    const dimension = safeGetDimension(portal.dimension);
    if (!dimension) return;

    const { minX, minY, minZ, maxX, maxY, maxZ } = portal.bounds;
    let mobs;
    try {
        mobs = dimension.getEntities({
            location: { x: minX, y: minY, z: minZ },
            volume: { x: maxX - minX + 1, y: maxY - minY + 1, z: maxZ - minZ + 1 },
            excludeTypes: ["minecraft:player"]
        });
    } catch {
        return;
    }

    const origin = entityOrigin(portal);
    for (const mob of mobs) {
        if (isInsidePortal(portal, mob) && selectorMatchesEntity(selector, mob, origin) && passesEntityFilter(portal, mob)) {
            teleportThroughPortal(portal, mob);
        }
    }
}

// SECTION: Touch Pass
function runTouchPass() {
    if (!getEngineSettings().toolsEnabled) {
        triggerTouching.clear();
        return;
    }
    // No triggers or portals in the world: nothing to look up for any player.
    if (getEntitiesOfClass(TRIGGER).size === 0 && getEntitiesOfClass(AREAPORTAL).size === 0) {
        triggerTouching.clear();
        return;
    }

    const players = world.getPlayers();
    const touched = new Map();
    for (const player of players) collectTouchedBrushes(player, touched);

    // Triggers: those touched now plus those that had occupants (so they can fire OnEndTouch).
    const triggers = new Set();
    for (const brush of touched.keys()) {
        if (brush.typeId === TRIGGER) triggers.add(brush);
    }
    for (const id of triggerTouching.keys()) {
        const trigger = getEntityById(id);
        if (trigger) triggers.add(trigger);
        else triggerTouching.delete(id);
    }

    for (const trigger of triggers) {
        if (trigger.disabled) {
            triggerTouching.delete(trigger.id);
            continue;
        }
        updateTrigger(trigger, [...(touched.get(trigger) ?? [])]);
    }

    for (const [portal, occupants] of touched) {
        if (portal.typeId !== AREAPORTAL || portal.disabled) continue;
        const selector = getPortalSelector(portal);
        const origin = entityOrigin(portal);
        for (const player of occupants) {
            if (selectorMatchesEntity(selector, player, origin) && passesEntityFilter(portal, player)) {
                teleportThroughPortal(portal, player);
            }
        }
    }

    for (const portal of getEntitiesOfClass(AREAPORTAL)) {
        if (portal.disabled) continue;
        const selector = getPortalSelector(portal);
        if (selectorCanMatchNonPlayers(selector)) updatePortalMobs(portal, selector);
    }
}

export function startTouchSystem() {
    system.runInterval(runTouchPass, PASS_INTERVAL_TICKS);
}
