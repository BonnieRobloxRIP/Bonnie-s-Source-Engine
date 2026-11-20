import { system, world } from "@minecraft/server";
import {
    findEntitiesByName,
    getEntitiesOfClass,
    getEntityById,
    markEntityDirty,
    normalizeEntityName,
    setEntityDisabled,
    updateEntityData
} from "../registry.js";
import { fireOutput, registerInputHandlers } from "../io.js";
import { getEngineSettings, getHeldEntityClass, getMainhandTypeId } from "../runtime.js";

// SECTION: path_track
// Track nodes, as in Source: each node names the node after it ("Next stop target"), and may name a
// second one ("Branch path") that trains take instead while the branch is switched on. A chain of
// nodes is a track; trains (func_tracktrain) follow it and fire OnPass on each node they reach.
// Read from Black Mesa's own maps: the Inbound tram is 48 nodes in bm_c0a0a, with speed set per node
// (60 out of the station up to 230), OnPass outputs closing doors and changing level, and elevators
// are the same train on a two-node track.
//
// - Disabled node (Start disabled, DisablePath): a dead end. Trains stop before entering it.
// - Branch path: EnableAlternatePath / DisableAlternatePath / ToggleAlternatePath switch it.
// - OnPass fires when a train reaches the node; "Fire OnPass only once" stops it after the first.
//
// The Track Linker item links nodes with two clicks: click a node, then the node it leads to.
// Sneak-click a node to remove its link. Linked nodes show a dotted line toward their next node
// (orange toward a branch) while a player holds a node or the linker.

export const PATH_TRACK = "brr:path_track_block";
export const TRACK_LINKER = "brr:track_linker";

const isTrue = (value) => (typeof value === "boolean" ? value : /^(1|true|yes|on)$/i.test(`${value ?? ""}`.trim()));

function runtimeOf(node) {
    if (!node.data.runtime || typeof node.data.runtime !== "object") node.data.runtime = {};
    return node.data.runtime;
}

/** Whether the node's branch path is switched on (Branch on at start, then the Alternate inputs). */
export function isBranchOn(node) {
    const runtime = runtimeOf(node);
    return runtime.branchOn === undefined ? isTrue(node.data.branchOn) : Boolean(runtime.branchOn);
}

function setBranch(node, on) {
    runtimeOf(node).branchOn = Boolean(on);
    markEntityDirty(node);
}

/** The path_track nodes with this name in the node's dimension. */
function nodesNamed(name, dimension) {
    return findEntitiesByName(name).filter((entity) => entity.typeId === PATH_TRACK && entity.dimension === dimension);
}

/** The node a train moving forward goes to next, or undefined at the end of the track. */
export function getNextNode(node) {
    const branch = isBranchOn(node) && `${node.data.altTarget ?? ""}`.trim();
    const name = branch || `${node.data.target ?? ""}`.trim();
    if (!name) return undefined;
    return nodesNamed(name, node.dimension)[0];
}

/** The node a train moving backward goes to next: one whose next stop (or switched-on branch) is this node. */
export function getPreviousNode(node) {
    const own = normalizeEntityName(node.data.name);
    if (!own) return undefined;
    for (const other of getEntitiesOfClass(PATH_TRACK)) {
        if (other === node || other.dimension !== node.dimension) continue;
        if (getNextNode(other) === node) return other;
    }
    // Fall back to any node naming this one, even through a branch that's switched off.
    for (const other of getEntitiesOfClass(PATH_TRACK)) {
        if (other === node || other.dimension !== node.dimension) continue;
        if ([other.data.target, other.data.altTarget].some((name) => normalizeEntityName(name) === own)) return other;
    }
    return undefined;
}

/** Called by a train reaching a node: fires OnPass unless it fires only once and already has. */
export function passNode(node, train) {
    const runtime = runtimeOf(node);
    if (isTrue(node.data.passOnce) && runtime.passed) return;
    if (isTrue(node.data.passOnce)) {
        runtime.passed = true;
        markEntityDirty(node);
    }
    fireOutput(node, "OnPass", train?.activator, node);
}

/** Called by a train teleported to this node. */
export function teleportedToNode(node, train) {
    fireOutput(node, "OnTeleport", train?.activator, node);
}

/** The speed a train takes on reaching this node, in blocks per second, or undefined to keep its own. */
export function getNodeSpeed(node) {
    const speed = Number(node.data.speed);
    return Number.isFinite(speed) && speed > 0 ? speed : undefined;
}

registerInputHandlers(PATH_TRACK, {
    EnablePath: (node) => setEntityDisabled(node, false),
    DisablePath: (node) => setEntityDisabled(node, true),
    TogglePath: (node) => setEntityDisabled(node, !node.disabled),
    EnableAlternatePath: (node) => setBranch(node, true),
    DisableAlternatePath: (node) => setBranch(node, false),
    ToggleAlternatePath: (node) => setBranch(node, !isBranchOn(node))
});

// SECTION: Track Linker
// Remembers each player's first click until the second, for at most a minute.
const pending = new Map();
const PENDING_TICKS = 1200;

function ensureName(node) {
    if (`${node.data.name ?? ""}`.trim()) return node.data.name;
    let n = 1;
    while (findEntitiesByName(`path_${n}`).length > 0) n++;
    updateEntityData(node, { ...node.data, name: `path_${n}` });
    return node.data.name;
}

/**
 * One click with the Track Linker on a node. Returns the message shown to the player.
 * Click a node, then the node it leads to. Sneak-click a node to clear its next stop.
 */
export function linkerClick(playerId, node, sneaking, tick = system.currentTick) {
    if (sneaking) {
        pending.delete(playerId);
        if (!`${node.data.target ?? ""}`.trim()) return `§7${node.data.name || "This node"} has no next stop.`;
        updateEntityData(node, { ...node.data, target: "" });
        return `§eRemoved ${node.data.name}'s next stop.`;
    }
    const first = pending.get(playerId);
    const firstNode = first && tick - first.tick <= PENDING_TICKS ? getEntityById(first.id) : undefined;
    if (!firstNode || firstNode.typeId !== PATH_TRACK) {
        pending.set(playerId, { id: node.id, tick });
        return `§eSelected ${ensureName(node)}. Click the node it leads to (sneak-click a node to unlink it).`;
    }
    pending.delete(playerId);
    if (firstNode === node) return "§7Selection cleared.";
    if (firstNode.dimension !== node.dimension) return "§cThose nodes are in different dimensions.";
    const from = ensureName(firstNode), to = ensureName(node);
    updateEntityData(firstNode, { ...firstNode.data, target: to });
    return `§aLinked ${from} → ${to}.`;
}

export function clearLinkerSelection(playerId) {
    pending.delete(playerId);
}

// SECTION: Link Lines
// Dotted lines between linked nodes, drawn for players who can see the nodes.
const LINE_INTERVAL_TICKS = 10;
const LINE_RADIUS = 48;
const DOT_SPACING = 0.5;
const MAX_DOTS_PER_PLAYER = 600;
const LINK_PARTICLE = "brr:path_track_link";
const BRANCH_PARTICLE = "brr:path_track_branch";

function seesNodes(player, settings) {
    if (settings.alwaysVisible) return true;
    return getHeldEntityClass(player) === PATH_TRACK || getMainhandTypeId(player) === TRACK_LINKER;
}

function drawSegment(player, from, to, particle, budget) {
    const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
    const length = Math.hypot(dx, dy, dz);
    if (length < 0.01) return budget;
    const steps = Math.min(Math.floor(length / DOT_SPACING), budget);
    // Dots crowd toward the end, so the line shows which way it points.
    for (let i = 1; i <= steps; i++) {
        const t = Math.pow(i / (steps + 1), 0.8);
        try {
            player.spawnParticle(particle, { x: from.x + dx * t, y: from.y + dy * t, z: from.z + dz * t });
        } catch {
            return 0;
        }
    }
    return budget - steps;
}

function runLinePass() {
    const settings = getEngineSettings();
    const nodes = getEntitiesOfClass(PATH_TRACK);
    if (nodes.length === 0) return;
    const radiusSquared = LINE_RADIUS * LINE_RADIUS;
    for (const player of world.getPlayers()) {
        if (!seesNodes(player, settings)) continue;
        const where = player.location, dimension = player.dimension.id;
        let budget = MAX_DOTS_PER_PLAYER;
        for (const node of nodes) {
            if (budget <= 0) break;
            if (node.dimension !== dimension || !node.center) continue;
            const c = node.center;
            if ((c.x - where.x) ** 2 + (c.y - where.y) ** 2 + (c.z - where.z) ** 2 > radiusSquared) continue;
            const main = `${node.data.target ?? ""}`.trim() && nodesNamed(node.data.target, node.dimension)[0];
            const branch = `${node.data.altTarget ?? ""}`.trim() && nodesNamed(node.data.altTarget, node.dimension)[0];
            if (main?.center) budget = drawSegment(player, c, main.center, LINK_PARTICLE, budget);
            if (branch?.center) budget = drawSegment(player, c, branch.center, BRANCH_PARTICLE, budget);
        }
    }
}

export function startTrackSystem() {
    system.runInterval(runLinePass, LINE_INTERVAL_TICKS);
    world.afterEvents.playerLeave.subscribe(({ playerId }) => pending.delete(playerId));
}
