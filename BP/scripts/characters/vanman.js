import { InputPermissionCategory, world } from "@minecraft/server";
import { AIR, isPassableDecorType } from "../core/block_cache.js";
import { distanceSquared } from "../core/math.js";
import { gameTick } from "../core/pause.js";
import { isBigDoorType } from "../doors.js";
import { setKidnapTimer, setRopeFrame, setRopeProgress } from "../hud.js";
import { findVanJailSpot } from "./van_jail.js";
import { farthestReachableFrom, Navigator, pickWanderGoal, WANDER_RETRY_TICKS } from "./navigation.js";
import { hasLineOfSight, isTargetablePlayer } from "./perception.js";
import { registerCharacter } from "./registry.js";

const TYPE_ID = "brr:vanman";

// driving: blocks per tick, like every other walker's glide speed
const MAX_SPEED = 0.3;
const MIN_SPEED = 0.05;
const ACCELERATION = 0.006;
const BRAKING = 0.02;
// degrees per tick the van can swing its nose
const TURN_RATE = 7;
// heading error that still counts as mid-turn (crawl at MIN_SPEED)
const TURNING_ANGLE = 20;
// a bend in the path sharper than this gets braked for in advance
const CORNER_ANGLE = 35;

const SIGHT_RANGE_SQUARED = 32 * 32;
const CATCH_DISTANCE_SQUARED = 3 * 3;
const SCAN_INTERVAL_TICKS = 2;
const CHASE_LOST_TICKS = 100;
const CHASE_GIVE_UP_TICKS = 1200;
const COOLDOWN_TICKS = 30 * 20;
const KIDNAP_TICKS = 15 * 20;
const JAIL_TICKS = 30 * 20;
const LAUGH_INTERVAL_TICKS = 15 * 20;
const INSOLITARE_RADIUS_SQUARED = 5 * 5;
// still parked at the impound this long after release -> drive out from where he was caught instead
const JAIL_EXIT_TICKS = 200;
const FLEE_RETARGET_TICKS = 40;

// jump rope: van_play (0.85 s), then van_go (1.1 s), then the rope swings
const GO_DELAY_TICKS = 20;
const ROPE_START_TICKS = GO_DELAY_TICKS + 24;
const ROPE_FRAMES = 16;
const ROPE_TICKS_PER_FRAME = 2;
const ROPE_CYCLE_TICKS = ROPE_FRAMES * ROPE_TICKS_PER_FRAME;
// Rope12 is the last frame with the rope on screen; it passes under the feet going into Rope13
const ROPE_PASS_TICK = 12 * ROPE_TICKS_PER_FRAME;
// leaving the ground before this point of a swing (or after the pass) is jumping too soon
const JUMP_OPEN_TICK = 6 * ROPE_TICKS_PER_FRAME;
// how high the feet must be when the rope passes; a vanilla jump stays above this for ~10 ticks
const CLEAR_HEIGHT = 0.3;
const JUMPS_TO_WIN = 5;
// pushed or teleported this far from where he froze them = out of his reach
const REACH_SQUARED = 2 * 2;
// ticks without a working seat before the kidnap falls back to carrying the player by teleport
const SEAT_GRACE_TICKS = 10;
const SEAT_BACK_OFFSET = 1.7;
const SEAT_HEIGHT = 1.1;

function play(entity, id) {
    try { entity.dimension.playSound(id, entity.location); } catch { }
}

function wrapDegrees(angle) {
    return ((angle % 360) + 540) % 360 - 180;
}

// Minecraft yaw: 0 faces +z, 90 faces -x
function yawToward(dx, dz) {
    return Math.atan2(-dx, dz) * 180 / Math.PI;
}

function blocksSight(typeId) {
    return typeId !== undefined && typeId !== AIR && !isBigDoorType(typeId)
        && !isPassableDecorType(typeId) && !typeId.includes("window");
}

function canSee(van, player) {
    const from = van.location;
    const to = player.location;
    if (distanceSquared(from, to) > SIGHT_RANGE_SQUARED) return false;
    return hasLineOfSight(van.dimension,
        { x: from.x, y: from.y + 1.6, z: from.z },
        { x: to.x, y: to.y + 1.5, z: to.z },
        blocksSight);
}

function setJailed(entity, state, jailed) {
    if (state.shownJailed === jailed) return;
    try {
        entity.setProperty("brr:in_jail", jailed ? 1 : 0);
        state.shownJailed = jailed;
    } catch { }
}

function setPermission(player, category, enabled) {
    if (category === undefined) return;
    try { player.inputPermissions.setPermissionCategory(category, enabled); } catch { }
}

// frozen in place but still allowed to jump; kidnapped players also can't dismount
function holdPlayer(player, held, kidnapped = false) {
    setPermission(player, InputPermissionCategory.LateralMovement, !held);
    setPermission(player, InputPermissionCategory.Dismount, !kidnapped);
}

function getPlayer(id) {
    if (!id) return undefined;
    const player = world.getEntity(id);
    return player?.isValid ? player : undefined;
}

// --- driving ---------------------------------------------------------------------------------

// Follows the shared navigator path like everyone else, but steers like a vehicle: the nose turns
// at a limited rate, it crawls at MIN_SPEED while turning, brakes ahead of sharp bends and
// accelerates back up to MAX_SPEED on straights. The peek plans the path and the glide below reuses
// that plan (Navigator.plan runs once per tick). Waiting for a path search counts as still driving.
function drive(entity, state, destination) {
    const { next, after } = state.nav.peek(entity, destination);
    if (!next) {
        state.speed = MIN_SPEED;
        return state.nav.pending;
    }
    const here = entity.location;
    const toX = next.x + 0.5 - here.x;
    const toZ = next.z + 0.5 - here.z;
    const toLength = Math.hypot(toX, toZ);
    let error = 0;
    if (toLength > 0.05) {
        error = wrapDegrees(yawToward(toX, toZ) - state.yaw);
        state.yaw = wrapDegrees(state.yaw + Math.max(-TURN_RATE, Math.min(TURN_RATE, error)));
    }

    let targetSpeed = MAX_SPEED;
    if (Math.abs(error) > TURNING_ANGLE) {
        targetSpeed = MIN_SPEED;
    } else if (after && toLength > 0.05) {
        const bend = Math.abs(wrapDegrees(yawToward(after.x - next.x, after.z - next.z) - yawToward(toX, toZ)));
        const brakeTicks = Math.max(0, state.speed - MIN_SPEED) / BRAKING;
        const brakeDistance = brakeTicks * (state.speed + MIN_SPEED) / 2;
        if (bend > CORNER_ANGLE && toLength <= brakeDistance + state.speed) targetSpeed = MIN_SPEED;
    }
    state.speed = state.speed < targetSpeed
        ? Math.min(targetSpeed, state.speed + ACCELERATION)
        : Math.max(targetSpeed, state.speed - BRAKING);
    return state.nav.glide(entity, destination, state.speed, state.yaw);
}

function pickWanderTarget(entity, state) {
    state.wander = pickWanderGoal(entity, 12, 30);
    state.nav.reset();
}

function driveAwayFrom(entity, state, location) {
    state.wander = farthestReachableFrom(entity.dimension, entity.location, location, 1500, 32);
    state.nav.reset();
}

// a spot he couldn't drive to (or no spot at all) is given a moment before he picks another
function roam(entity, state, tick) {
    if (!state.wander) {
        if (tick < state.wanderRetryAt) return;
        pickWanderTarget(entity, state);
        if (!state.wander) {
            state.wanderRetryAt = tick + WANDER_RETRY_TICKS;
            return;
        }
    }
    const driving = drive(entity, state, state.wander);
    if (!driving || distanceSquared(entity.location, state.wander) <= 1) {
        if (!driving && !state.nav.complete) state.wanderRetryAt = tick + WANDER_RETRY_TICKS;
        state.wander = undefined;
    }
}

function laughTick(entity, state, tick) {
    if (tick < state.nextLaughAt) return;
    play(entity, "van_laugh");
    play(entity, "waterphone");
    state.nextLaughAt = tick + LAUGH_INTERVAL_TICKS;
}

// --- roaming and chasing ---------------------------------------------------------------------

function toWander(state) {
    state.mode = "wander";
    state.targetId = undefined;
    state.wander = undefined;
    state.nav.reset();
}

function findPrey(entity, state, ctx) {
    for (const player of ctx.players(entity.dimension)) {
        if (!isTargetablePlayer(player) || (state.cooldowns.get(player.id) ?? 0) > ctx.tick) continue;
        if (player.getComponent("minecraft:riding")?.entityRidingOn) continue;
        if (canSee(entity, player)) return player;
    }
    return undefined;
}

function wanderTick(entity, state, ctx) {
    if (state.exitCheck && ctx.tick >= state.exitCheck.at) {
        // couldn't find a way out of the impound, so leave from where Chipfloke caught him
        if (distanceSquared(entity.location, state.exitCheck.from) < 3 * 3 && state.exitCheck.fallback) {
            try { entity.teleport(state.exitCheck.fallback, { dimension: entity.dimension }); } catch { }
            state.nav.reset();
            state.wander = undefined;
        }
        state.exitCheck = undefined;
    }
    if (ctx.tick % SCAN_INTERVAL_TICKS === 0) {
        const prey = findPrey(entity, state, ctx);
        if (prey) {
            state.mode = "chase";
            state.targetId = prey.id;
            state.lastSeenAt = ctx.tick;
            state.chaseUntil = ctx.tick + CHASE_GIVE_UP_TICKS;
            state.nav.reset();
            return;
        }
    }
    laughTick(entity, state, ctx.tick);
    roam(entity, state, ctx.tick);
}

function chaseTick(entity, state, ctx) {
    const player = getPlayer(state.targetId);
    if (!player || player.dimension.id !== entity.dimension.id || !isTargetablePlayer(player)
        || ctx.tick >= state.chaseUntil || (state.cooldowns.get(player.id) ?? 0) > ctx.tick) {
        toWander(state);
        return;
    }
    if (ctx.tick % SCAN_INTERVAL_TICKS === 0 && canSee(entity, player)) state.lastSeenAt = ctx.tick;
    if (ctx.tick - state.lastSeenAt > CHASE_LOST_TICKS) {
        toWander(state);
        return;
    }
    if (distanceSquared(entity.location, player.location) <= CATCH_DISTANCE_SQUARED) {
        startGame(entity, state, player, ctx.tick);
        return;
    }
    drive(entity, state, player.location);
}

// --- jump rope ---------------------------------------------------------------------------------

function startGame(entity, state, player, tick) {
    state.mode = "game";
    state.targetId = player.id;
    state.speed = 0;
    state.nav.reset();
    state.game = {
        caughtAt: tick,
        anchor: { ...player.location },
        groundY: player.location.y,
        airborne: !player.isOnGround,
        saidGo: false,
        cycle: -1,
        checked: false,
        jumps: 0
    };
    holdPlayer(player, true);
    setRopeProgress(player, 0);
    play(entity, "van_play");
}

// ends the minigame; the player walks free and gets left alone for a while
function endGame(entity, state, player, tick, driveAway = true) {
    if (player) {
        setRopeFrame(player, undefined);
        setRopeProgress(player, undefined);
        holdPlayer(player, false);
        state.cooldowns.set(player.id, tick + COOLDOWN_TICKS);
    }
    state.game = undefined;
    toWander(state);
    state.speed = MIN_SPEED;
    if (driveAway && player) driveAwayFrom(entity, state, player.location);
}

function failGame(entity, state, player, tick) {
    setRopeFrame(player, undefined);
    setRopeProgress(player, undefined);
    state.game = undefined;
    startKidnap(entity, state, player, tick);
}

function ropeTick(entity, state, ctx) {
    const game = state.game;
    const player = getPlayer(state.targetId);
    if (!player || player.dimension.id !== entity.dimension.id) {
        if (player) {
            setRopeFrame(player, undefined);
            setRopeProgress(player, undefined);
            holdPlayer(player, false);
        }
        state.game = undefined;
        toWander(state);
        return;
    }
    const dx = player.location.x - game.anchor.x;
    const dz = player.location.z - game.anchor.z;
    if (dx * dx + dz * dz > REACH_SQUARED) {
        play(entity, "van_confused");
        endGame(entity, state, player, ctx.tick, false);
        return;
    }

    const elapsed = ctx.tick - game.caughtAt;
    if (!game.saidGo && elapsed >= GO_DELAY_TICKS) {
        game.saidGo = true;
        play(entity, "van_go");
    }
    if (elapsed < ROPE_START_TICKS) {
        // hopping during the countdown is harmless; only takeoffs once the rope swings are judged
        game.airborne = !player.isOnGround;
        if (player.isOnGround) game.groundY = player.location.y;
        return;
    }

    const ropeTicks = elapsed - ROPE_START_TICKS;
    const cycle = Math.floor(ropeTicks / ROPE_CYCLE_TICKS);
    const t = ropeTicks % ROPE_CYCLE_TICKS;
    if (cycle !== game.cycle) {
        game.cycle = cycle;
        game.checked = false;
    }
    setRopeFrame(player, Math.floor(t / ROPE_TICKS_PER_FRAME));

    const height = player.location.y - game.groundY;
    if (player.isOnGround) {
        game.groundY = player.location.y;
        game.airborne = false;
    } else if (!game.airborne && height > 0.05) {
        game.airborne = true;
        if (t < JUMP_OPEN_TICK || (game.checked && t > ROPE_PASS_TICK)) {
            failGame(entity, state, player, ctx.tick);
            return;
        }
    }

    if (game.checked || t < ROPE_PASS_TICK) return;
    game.checked = true;
    if (!game.airborne || height < CLEAR_HEIGHT) {
        failGame(entity, state, player, ctx.tick);
        return;
    }
    game.jumps++;
    setRopeProgress(player, game.jumps);
    play(entity, `van_${game.jumps}`);
    if (game.jumps >= JUMPS_TO_WIN) {
        play(entity, "van_finish");
        endGame(entity, state, player, ctx.tick);
    }
}

// --- kidnapping --------------------------------------------------------------------------------

function seatedOn(player, entity) {
    return player.getComponent("minecraft:riding")?.entityRidingOn?.id === entity.id;
}

function trySeat(entity, player) {
    const rideable = entity.getComponent("minecraft:rideable");
    if (!rideable) return false;
    try { return rideable.addRider(player); } catch { return false; }
}

function closeSeat(entity) {
    try { entity.getComponent("minecraft:rideable")?.ejectRiders(); } catch { }
    try { entity.triggerEvent("brr:seat_close"); } catch { }
}

// fallback when the seat isn't usable: carry the player along in the back by teleport
function carry(entity, state, player) {
    const yaw = state.yaw * Math.PI / 180;
    const back = {
        x: entity.location.x + Math.sin(yaw) * SEAT_BACK_OFFSET,
        y: entity.location.y + SEAT_HEIGHT,
        z: entity.location.z - Math.cos(yaw) * SEAT_BACK_OFFSET
    };
    try { player.teleport(back, { dimension: entity.dimension, keepVelocity: false }); } catch { }
}

function startKidnap(entity, state, player, tick) {
    state.mode = "kidnap";
    state.targetId = player.id;
    state.kidnapUntil = tick + KIDNAP_TICKS;
    setKidnapTimer(player, KIDNAP_TICKS / 20);
    state.unseatedSince = tick;
    state.wander = undefined;
    state.nav.reset();
    state.speed = MIN_SPEED;
    holdPlayer(player, true, true);
    try { entity.triggerEvent("brr:seat_open"); } catch { }
    play(entity, "van_kidnap");
}

function releaseKidnapped(entity, state, player, tick) {
    closeSeat(entity);
    if (player) {
        setKidnapTimer(player, undefined);
        holdPlayer(player, false);
        state.cooldowns.set(player.id, tick + COOLDOWN_TICKS);
    }
    state.targetId = undefined;
}

function kidnapTick(entity, state, ctx) {
    const player = getPlayer(state.targetId);
    if (!player || player.dimension.id !== entity.dimension.id) {
        releaseKidnapped(entity, state, player, ctx.tick);
        toWander(state);
        return;
    }
    if (ctx.tick >= state.kidnapUntil) {
        releaseKidnapped(entity, state, player, ctx.tick);
        toWander(state);
        return;
    }
    setKidnapTimer(player, Math.ceil((state.kidnapUntil - ctx.tick) / 20));
    laughTick(entity, state, ctx.tick);
    roam(entity, state, ctx.tick);
    if (seatedOn(player, entity) || trySeat(entity, player)) {
        state.unseatedSince = ctx.tick;
    } else if (ctx.tick - state.unseatedSince > SEAT_GRACE_TICKS) {
        carry(entity, state, player);
    }
}

// --- Chipfloke ---------------------------------------------------------------------------------

function fleeTick(entity, state, ctx) {
    const chaser = state.chaserId ? world.getEntity(state.chaserId) : undefined;
    if (chaser?.isValid && (!state.wander || ctx.tick >= state.fleeRetargetAt)) {
        driveAwayFrom(entity, state, chaser.location);
        state.fleeRetargetAt = ctx.tick + FLEE_RETARGET_TICKS;
    }
    if (state.wander && !drive(entity, state, state.wander)) state.wander = undefined;
}

function goToJail(entity, state, tick) {
    const caughtAt = { ...entity.location };
    const spot = findVanJailSpot(entity.dimension, entity.location);
    if (spot) {
        try { entity.teleport({ x: spot.x + 0.5, y: spot.y, z: spot.z + 0.5 }, { dimension: entity.dimension }); } catch { }
    }
    state.mode = "jailed";
    state.jailedUntil = tick + JAIL_TICKS;
    state.caughtAt = caughtAt;
    state.chaserId = undefined;
    state.wander = undefined;
    state.speed = 0;
    state.nav.reset();
    state.visitorNear = false;
    setJailed(entity, state, true);
}

function jailTick(entity, state, ctx) {
    const visitor = ctx.players(entity.dimension).some((player) =>
        distanceSquared(entity.location, player.location) <= INSOLITARE_RADIUS_SQUARED);
    if (visitor && !state.visitorNear) play(entity, "van_insolitare");
    state.visitorNear = visitor;
    if (ctx.tick < state.jailedUntil) return;

    setJailed(entity, state, false);
    toWander(state);
    state.speed = MIN_SPEED;
    state.exitCheck = { at: ctx.tick + JAIL_EXIT_TICKS, from: { ...entity.location }, fallback: state.caughtAt };
    state.caughtAt = undefined;
}

// --- registration ------------------------------------------------------------------------------

function cleanup(state) {
    const player = getPlayer(state.targetId);
    if (!player) return;
    setRopeFrame(player, undefined);
    setRopeProgress(player, undefined);
    setKidnapTimer(player, undefined);
    holdPlayer(player, false);
}

registerCharacter({
    typeId: TYPE_ID,
    scriptEventId: TYPE_ID,
    catchDistance: 3,
    chaseSound: "chip.kidnap",
    createState(entity) {
        const now = gameTick();
        const state = {
            nav: new Navigator({ doorHeight: 2 }),
            mode: "wander",
            wander: undefined,
            wanderRetryAt: 0,
            targetId: undefined,
            yaw: entity.getRotation().y,
            speed: MIN_SPEED,
            cooldowns: new Map(),
            lastSeenAt: 0,
            chaseUntil: 0,
            game: undefined,
            kidnapUntil: 0,
            unseatedSince: 0,
            chaserId: undefined,
            fleeRetargetAt: 0,
            jailedUntil: 0,
            caughtAt: undefined,
            exitCheck: undefined,
            visitorNear: false,
            shownJailed: undefined,
            nextLaughAt: now + LAUGH_INTERVAL_TICKS
        };
        setJailed(entity, state, false);
        closeSeat(entity);
        return state;
    },
    tick(entity, state, ctx) {
        switch (state.mode) {
            case "jailed": jailTick(entity, state, ctx); break;
            case "game": ropeTick(entity, state, ctx); break;
            case "kidnap": kidnapTick(entity, state, ctx); break;
            case "flee": fleeTick(entity, state, ctx); break;
            case "chase": chaseTick(entity, state, ctx); break;
            default: wanderTick(entity, state, ctx); break;
        }
    },
    wanted(entity, state) {
        return state.mode === "kidnap" || state.mode === "flee";
    },
    onPursued(entity, state, chaser) {
        state.chaserId = chaser.id;
        if (state.mode !== "kidnap") return;
        // making a run for it: the kidnapped player gets dumped where the van is right now
        play(entity, "van_jail");
        releaseKidnapped(entity, state, getPlayer(state.targetId), gameTick());
        state.mode = "flee";
        state.wander = undefined;
        state.fleeRetargetAt = 0;
    },
    onPursuitEnded(entity, state) {
        state.chaserId = undefined;
        if (state.mode === "flee") toWander(state);
    },
    onApprehended(entity, state) {
        if (state.mode === "kidnap") releaseKidnapped(entity, state, getPlayer(state.targetId), gameTick());
        goToJail(entity, state, gameTick());
    },
    onHit(entity, state, kind, source, tick) {
        if (kind !== "glock") return false;
        play(entity, "van_shoot");
        if (state.mode === "game") endGame(entity, state, getPlayer(state.targetId), tick);
        return true;
    },
    onAction(entity, state, action) {
        const now = gameTick();
        if (action === "reset") {
            cleanup(state);
            if (state.mode === "kidnap") releaseKidnapped(entity, state, getPlayer(state.targetId), now);
            state.game = undefined;
            state.exitCheck = undefined;
            setJailed(entity, state, false);
            toWander(state);
        } else if (action === "jail") {
            cleanup(state);
            if (state.mode === "kidnap") releaseKidnapped(entity, state, getPlayer(state.targetId), now);
            state.game = undefined;
            goToJail(entity, state, now);
        }
    },
    onRemove(state) {
        cleanup(state);
    }
});
