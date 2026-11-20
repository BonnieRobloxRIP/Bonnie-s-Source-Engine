import { getEntityById, findEntitiesByName } from "../registry.js";
import { PATH_TRACK, getNextNode, getNodeSpeed, getPreviousNode } from "./tracks.js";

// SECTION: Train Motion
// Where a func_tracktrain is on its track and how it moves along it. No world access here, so the
// rules are testable on their own; platforms.js moves the blocks.
//
// The state is plain data, saved with the train:
//   at       id of the node the train is at, or last passed
//   toward   id of the node it is heading to (undefined while parked at `at` with nowhere chosen)
//   t        blocks travelled from `at` toward `toward`
//   segDir   the direction (1 forward, -1 backward) `toward` was chosen for
//   dir      the direction the train goes on its next start
//   speed    blocks per second
//   moving   whether it is moving
//   dest     id of the node MoveToPathNode stops at, if any
//
// As in Source: a disabled node is a dead end (trains stop before it), a node's speed changes the
// train's speed as it passes, "Stop the train here" stops it on arrival, and a teleport node sends it
// straight on to the node after.

const MAX_NODES_PER_STEP = 64;
const MAX_ROUTE_NODES = 512;

const isTrue = (value) => (typeof value === "boolean" ? value : /^(1|true|yes|on)$/i.test(`${value ?? ""}`.trim()));

export function nodePoint(node) {
    return node?.center;
}

function distance(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
}

/** The usable node after `node` going in `dir`, or undefined at a dead end. */
export function nodeAfter(node, dir) {
    const next = dir < 0 ? getPreviousNode(node) : getNextNode(node);
    return next && !next.disabled ? next : undefined;
}

/** The path_track a train named `name` starts from. */
export function findNode(name, dimension) {
    const wanted = `${name ?? ""}`.trim();
    if (!wanted) return undefined;
    return findEntitiesByName(wanted).find((entity) => entity.typeId === PATH_TRACK && entity.dimension === dimension);
}

/** The train's position on its track, or undefined if its nodes are gone. */
export function trainPoint(state) {
    const at = getEntityById(state.at);
    if (!at?.center) return undefined;
    const toward = state.toward ? getEntityById(state.toward) : undefined;
    if (!toward?.center) return { ...at.center };
    const length = distance(at.center, toward.center);
    const k = length > 0 ? Math.min(1, state.t / length) : 1;
    return {
        x: at.center.x + (toward.center.x - at.center.x) * k,
        y: at.center.y + (toward.center.y - at.center.y) * k,
        z: at.center.z + (toward.center.z - at.center.z) * k
    };
}

/**
 * Which way the track runs where the train is, as an entity yaw in degrees (south 0, west 90): the
 * track's forward direction, whichever way the train travels. Undefined when the train isn't on a
 * segment or the segment is (nearly) vertical, like an elevator shaft.
 */
export function trackYaw(state) {
    const at = getEntityById(state.at);
    const toward = state.toward ? getEntityById(state.toward) : undefined;
    if (!at?.center || !toward?.center) return undefined;
    const sign = (state.segDir ?? state.dir ?? 1) < 0 ? -1 : 1;
    const dx = (toward.center.x - at.center.x) * sign, dz = (toward.center.z - at.center.z) * sign;
    if (Math.hypot(dx, dz) < 0.01) return undefined;
    return (Math.atan2(-dx, dz) * 180) / Math.PI;
}

/** Points the train in `dir`, turning it around mid-segment if needed. Returns false when there is nowhere to go. */
export function aimTrain(state, dir) {
    state.dir = dir < 0 ? -1 : 1;
    const at = getEntityById(state.at);
    if (!at) return false;
    // The node it was heading to is gone (broken mid-ride): start again from `at`.
    if (state.toward && !getEntityById(state.toward)) {
        state.toward = undefined;
        state.t = 0;
    }
    if (state.toward && state.segDir !== state.dir) {
        const toward = getEntityById(state.toward);
        if (toward && state.t > 0) {
            // Mid-segment: swap ends, so the train heads back to the node it came from.
            state.t = Math.max(0, distance(at.center, toward.center) - state.t);
            state.at = toward.id;
            state.toward = at.id;
            state.segDir = state.dir;
            return true;
        }
        state.toward = undefined;
        state.t = 0;
    }
    if (!state.toward) {
        const next = nodeAfter(at, state.dir);
        if (!next) return false;
        state.toward = next.id;
        state.segDir = state.dir;
        state.t = 0;
    }
    return true;
}

/**
 * Moves the train `blocks` along its track. Returns what happened, in order:
 * { type: "pass", node }, { type: "teleport", node }, { type: "stop", reason } with reason
 * "end" (dead end), "stopHere", "destination" or "lost" (a node is gone).
 */
export function advanceTrain(state, blocks) {
    const events = [];
    const stop = (reason) => {
        state.moving = false;
        state.toward = state.t > 0 ? state.toward : undefined;
        events.push({ type: "stop", reason });
    };
    let left = blocks;
    for (let guard = 0; state.moving && guard < MAX_NODES_PER_STEP; guard++) {
        const at = getEntityById(state.at);
        const toward = state.toward ? getEntityById(state.toward) : undefined;
        if (!at?.center || !toward?.center) {
            stop("lost");
            break;
        }
        const remaining = distance(at.center, toward.center) - state.t;
        if (left < remaining) {
            state.t += left;
            break;
        }
        left -= Math.max(0, remaining);

        // Arrived at `toward`.
        state.at = toward.id;
        state.toward = undefined;
        state.t = 0;
        events.push({ type: "pass", node: toward });
        const speed = getNodeSpeed(toward);
        if (speed !== undefined) state.speed = speed;
        if (state.dest === toward.id) {
            state.dest = undefined;
            stop("destination");
            break;
        }
        if (isTrue(toward.data.stopHere)) {
            stop("stopHere");
            break;
        }
        let next = nodeAfter(toward, state.dir);
        if (next && isTrue(toward.data.teleportHere)) {
            state.at = next.id;
            events.push({ type: "teleport", node: next });
            if (state.dest === next.id) {
                state.dest = undefined;
                stop("destination");
                break;
            }
            next = nodeAfter(next, state.dir);
        }
        if (!next) {
            stop("end");
            break;
        }
        state.toward = next.id;
        state.segDir = state.dir;
        if (left <= 0) break;
    }
    return events;
}

/** Which way to go from `state.at` to reach `target`: 1, -1, 0 when already there, or undefined if it isn't on the track. */
export function routeTo(state, target) {
    const start = getEntityById(state.at);
    if (!start || !target) return undefined;
    const between = state.t > 0 && state.toward;
    if (start === target) {
        // Already there, or on the way out of it: turn back (an elevator called while leaving).
        return between ? -(state.segDir ?? state.dir ?? 1) : 0;
    }
    // The node it is heading to right now.
    if (between && state.toward === target.id) return state.segDir ?? state.dir ?? 1;
    for (const dir of [1, -1]) {
        let node = start;
        for (let i = 0; i < MAX_ROUTE_NODES && node; i++) {
            node = nodeAfter(node, dir);
            if (node === target) return dir;
            if (node === start) break;
        }
    }
    return undefined;
}
