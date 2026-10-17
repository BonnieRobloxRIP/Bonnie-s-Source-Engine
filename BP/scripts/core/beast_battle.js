// Pure MrBeast battle rules (no @minecraft imports) shared by the runtime, the UI generator and the checks.
// Gameplay follows the wiki: https://raldiscrackhouse.fandom.com/wiki/MrBeast/In_Battle
export const BATTLE = Object.freeze({
    hp: 100, maxHp: 999, beastHp: 250,
    hitDamage: 5, bootsHitDamage: 3, whackDamage: 25, glockDamage: 9999, squeeBonus: 10,
    attackTicks: 120, beastInterval: 10,
    // Spawn rates in projectiles per second ramp linearly from the first turn to the capped turn.
    moneyRate: [2.5, 6], moneyRampTurns: 15, burgerRate: [1, 4], burgerRampTurns: 10,
    moneyRadius: 3.45,
    qteTicks: 70, greenTicks: 8, qteGraceTicks: 120, hitTicks: 32,
    letterTicks: 1, typeSlots: 64, speechWaitTicks: 50, resultWaitTicks: 50, victoryTicks: 100, defeatTicks: 60,
    arenaSize: 100, heartRadius: 3, heartSpeed: 3, reward: 100,
    boxColumns: 34, bubbleColumns: 16
});

// ActionForm button indices shared with scripts_gen/make_beast_battle.mjs: data buttons carry textures
// and short texts, real buttons are clickable, typed buttons hold the typewriter prefixes (or QTE slots).
export const BATTLE_FORM = Object.freeze({ data: 0, real: 8, typed: 16, count: 16 + BATTLE.typeSlots });

// Screen layout in units of the screen height (H) from the screen centre, +y down. Bedrock's FOV is
// vertical, so a plane at a given camera distance covers the same fraction of H on every aspect
// ratio; the 1.6H-wide form stage and the world stage are both laid out with these numbers.
export const BATTLE_STAGE = Object.freeze({
    cameraBack: 5.7, fov: 70,
    window: Object.freeze({ left: -0.6, right: 0.6, top: -0.452, bottom: 0.228 }),
    beast: Object.freeze({ x: 0.39, y: -0.06, depth: 5.7, height: 2.9375 }),
    player: Object.freeze({ x: -0.32, feet: 0.124, depth: 4.2, yaw: 125 }),
    hearts: Object.freeze({ x: -0.19, y: 0.195, size: 0.034, pitch: 0.038 }),
    backdropDepth: 9.2, gridDepth: 9, ghostDepth: 8.95, letterboxDepth: 8.8, arenaDepth: 5.7
});
// World height covered by 1H for each block of camera distance.
export const STAGE_SPAN = 2 * Math.tan(BATTLE_STAGE.fov * Math.PI / 360);

export function stagePoint(origin, x, y, depth) {
    const scale = STAGE_SPAN * depth;
    // The stage camera looks along +z, so screen-right is world -x.
    return { x: origin.x - x * scale, y: origin.y - y * scale, z: origin.z - BATTLE_STAGE.cameraBack + depth };
}

// Black planes [x, y, width, height] in H at letterboxDepth bordering the scrolling window, oversized so
// no aspect ratio or camera shake reveals their edges.
export const STAGE_LETTERBOX = Object.freeze([
    [BATTLE_STAGE.window.left - 1.5, 0, 3, 6], [BATTLE_STAGE.window.right + 1.5, 0, 3, 6],
    [0, BATTLE_STAGE.window.top - 1.5, 6, 3], [0, BATTLE_STAGE.window.bottom + 1.5, 6, 3]
].map((plane) => Object.freeze(plane)));
const LETTERBOX_SCALE = STAGE_SPAN * BATTLE_STAGE.letterboxDepth;
// Blocks above/below the origin where stage entities spawn; the letterbox planes reach furthest.
export const STAGE_REACH = Object.freeze({
    up: Math.max(...STAGE_LETTERBOX.map(([, y]) => -y)) * LETTERBOX_SCALE,
    down: Math.max(...STAGE_LETTERBOX.map(([, y]) => y)) * LETTERBOX_SCALE
});

// The stage sits as far above the terrain as the dimension allows while every entity still spawns
// inside its height range (spawning outside it throws LocationOutOfWorldBoundariesError).
export function stageOrigin(location, heightRange) {
    const y = Math.floor(heightRange.max - 1 - STAGE_REACH.up);
    if (y - STAGE_REACH.down < heightRange.min) throw new Error("This dimension is too short for the MrBeast battle stage");
    return { x: location.x, y, z: location.z };
}

export const BEAST_LINES = [
    "HEY, DO YOU WANT TO PARTICIPATE, IN MY YOUTUBE CHALLENGE?",
    "EH, I'LL GIVE IT A 7.",
    "FIRST ONE TO LEAVE GETS FUCKING OBLITERATED. STARTING NOW.",
    "HEY, DO YOU WANT TO PARTICIPATE, IN YOUR ULTIMATE DEMISE?",
    "YOU'RE GONNA HAVE A BEAST TIME",
    "BYE BYE!",
    "DON'T MAKE ME GET OUT THE BLEACH AGAIN",
    "YOUR LIFE IS A BAD INTRO"
];

export const BATTLE_TEXT = Object.freeze({
    encounter: "* MRBEAST APPEARS.",
    neutral: Object.freeze(["* MRBEAST looks you in the eyes.", "* You feel your subscriber count getting higher."]),
    check: "* MRBEAST - ATK 10 DEF 10\n* Not too happy about his credit card being stolen.",
    discuss: "* You talk to MrBeast about the YouTube algorithm. You two get really invested.",
    spareFail: "* You spared MRBEAST, but he wasn't spared enough!",
    defend: "* You tried to DEFEND... It didn't do anything.",
    victory: "* You Won!\n* You got 0 EXP and $1.",
    unknownItem: "* fart joke"
});

// Item quirks from the wiki. The Get out of Debt Free Card shows as an empty slot there, so it is hidden.
export const BATTLE_ITEMS = Object.freeze({
    "brr:item_zestybar": { name: "Zesty Bar", text: "You ate a Zesty Bar! Your health was maxxed out.", heal: Infinity, consume: true, sound: "item.nom" },
    "brr:item_key": { name: "Principal's Keys", text: "You equipped the keys.", equip: true },
    "brr:item_bsoda": { name: "BSODA", text: "You drank the BSODA. Your max health doubled!", maxHpScale: 2, consume: true, sound: "item.soda" },
    "brr:item_tape": { name: "Mystery Tape", text: "You equipped the tape.", equip: true },
    "brr:item_alarm": { name: "Alarm", text: "You wanted to use the clock.. but nobody has time for that. You didn't use the clock." },
    "brr:item_squee": { name: "W.D. no Squee", text: "You shined your weapon. Attack increased!", attack: BATTLE.squeeBonus, consume: true, sound: "random.orb" },
    "brr:item_glock": { name: "Glock", text: "You equipped the glock.", equip: true },
    "brr:item_boots": { name: "Big Ol' Boots", text: "You equipped the boots. Defense increased!", equip: true },
    "brr:item_poopmeter": { name: "Poop Meter", text: "You used the Poop Meter. You need to poop in... Oh yea, you're fighting MrBeast." },
    "brr:item_phone": { name: "Phone", text: "You called for help... but this phone doesn't have a SIM Card." },
    "brr:item_hammer": { name: "Hammer for Sticky Situations", text: "You equipped the hammer.", equip: true },
    "brr:item_energy": { name: "15 Second Energy", text: "You drank the 15 second energy. You gained 75 HP!", heal: 75, consume: true, sound: "item.soda" },
    "brr:item_crackpipe": { name: "A Crackpipe for Raldi", text: "You tried to give MrBeast the crackpipe. He declines. What a shame." },
    "brr:item_jailcard": { name: "Get out of Jail Free Card", text: "You used the Get Out of Jail Free Card. You aren't in jail. You didn't use the Get Out of Jail Free Card." },
    "brr:item_monkenator": { name: "Monkenator", text: "no monke :sadnesscombat:" },
    "brr:item_potato": { name: "Ishaan's Potato", text: "You ate the potato. You gained 5 HP!", heal: 5, consume: true, sound: "item.nom" },
    "brr:item_gameboy": { name: "Gameboy", text: "You use the GameBoy Color. It explodes in your hand.", consume: true, sound: "random.explode" },
    "brr:item_cowmarker": { name: "Polish Cow Marker", text: "Polish cow won't be able to teleport you out of this one. Nor will he be able to teleport you into this one." },
    "brr:item_card": { name: "MrBeast's Credit Card", text: "You show Mrbeast his own credit card. He :Moyai:s." },
    "brr:item_debtcard": { name: "Get out of Debt Free Card", hidden: true },
    "brr:item_quarter": { name: "Quarter" },
    "brr:item_goldquarter": { name: "Gold Quarter" },
    "brr:item_lock": { name: "Swinging Door Lock" },
    "brr:item_medkit": { name: "Medkit" },
    "brr:item_polish_milk": { name: "Polish Milk" },
    "brr:item_sprite_cranberry": { name: "Sprite Cranberry" },
    "brr:item_peppermint_bar": { name: "Peppermint Bar" },
    "brr:item_ornament": { name: "Ornament" },
    "brr:item_firework": { name: "Firework" }
});

export function battleItemName(typeId) {
    if (!typeId) return "";
    return BATTLE_ITEMS[typeId]?.name ?? typeId.split(":").pop().replace(/^item_/, "").replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function isBattleItemUsable(typeId) {
    return Boolean(typeId) && BATTLE_ITEMS[typeId]?.hidden !== true;
}

// Prewrapped text never reflows while it types; Deltarune indents the lines after a "* " bullet.
export function wrapText(text, columns) {
    const lines = [];
    for (const paragraph of text.split("\n")) {
        const indent = paragraph.startsWith("* ") ? "  " : "";
        let line = "";
        const push = () => { lines.push(line); line = indent; };
        for (const word of paragraph.split(" ").filter(Boolean)) {
            const room = () => columns - line.length - (line.trim() ? 1 : 0);
            let rest = word;
            while (rest.length > columns - indent.length && rest.length > room()) {
                if (line.trim()) push();
                const take = columns - line.length;
                line += rest.slice(0, take);
                rest = rest.slice(take);
                push();
            }
            if (!rest) continue;
            if (rest.length > room()) push();
            line += (line.trim() ? " " : "") + rest;
        }
        if (line.trim() || !lines.length || paragraph === "") lines.push(line.trimEnd());
    }
    return lines.join("\n");
}

function typeStride(text) {
    return Math.max(1, Math.ceil(text.length / BATTLE.typeSlots));
}

// One prefix per typewriter slot; the UI reveals slot k after (k + 1) letter ticks. With `hidden`, every
// slot carries the whole text: the typed part in black and the rest in the (background-matching) hidden
// colour, so centred lines keep their final layout while they type.
export function typewriter(text, hidden) {
    const stride = typeStride(text);
    const paint = (part, colour) => part ? colour + part.replace(/\n/g, "\n" + colour) : "";
    return Array.from({ length: BATTLE.typeSlots }, (_, k) => {
        const typed = text.slice(0, Math.min(text.length, (k + 1) * stride));
        return hidden ? paint(typed, "§0") + paint(text.slice(typed.length), hidden) : typed;
    });
}

export function typeTicks(text) {
    return Math.ceil(text.length / typeStride(text)) * BATTLE.letterTicks;
}

export function battleHearts(state) {
    return state.hp <= 0 ? 0 : Math.max(1, Math.min(10, Math.ceil(state.hp / state.maxHp * 10)));
}

export function battlePercent(value, max) {
    return value <= 0 ? 0 : Math.max(1, Math.min(100, Math.round(value / max * 100)));
}

const box = (text) => wrapText(text, BATTLE.boxColumns);

export function createBattle(random = Math.random, equipped = "") {
    return {
        phase: "menu", elapsed: 0, hp: BATTLE.hp, maxHp: BATTLE.hp,
        beastHp: BATTLE.beastHp, beastHpBefore: BATTLE.beastHp, mercy: 0, discussions: 0,
        equipped, attackBonus: 0, turn: 0, attack: 0, hits: 0,
        message: box(BATTLE_TEXT.encounter), dialogue: "", line: -1, damage: 0, missed: false,
        heart: { x: 50, y: 50 }, projectiles: [], nextProjectileId: 0, random,
        emitter: { y: 50, target: 50, speed: 2 }, spawnAt: 0,
        // Sound cues ("beastproj", "fall", "splat") from the latest advanceBattle call, for the runtime to play.
        events: []
    };
}

// elapsed: ticks since the marker left the right end; it reaches the green zone at the left end.
export function timingDamage(elapsed, equipped = "", bonus = 0) {
    if (equipped === "brr:item_glock") return BATTLE.glockDamage;
    const maximum = BATTLE.whackDamage + bonus;
    const span = BATTLE.qteTicks - BATTLE.greenTicks;
    const distance = Math.max(0, Math.min(span, BATTLE.qteTicks - elapsed - BATTLE.greenTicks)) / span;
    return Math.max(1, Math.round(maximum - (maximum - 1) * distance));
}

function setPhase(state, phase) {
    state.phase = phase;
    state.elapsed = 0;
}

function result(state, text) {
    state.message = box(text);
    setPhase(state, "result");
}

function win(state, outcome) {
    state.outcome = outcome;
    state.message = box(BATTLE_TEXT.victory);
    setPhase(state, "victory");
}

function enemyTurn(state) {
    let line = Math.max(0, Math.min(BEAST_LINES.length - 1, Math.floor(state.random() * BEAST_LINES.length)));
    if (line === state.line) line = (line + 1) % BEAST_LINES.length;
    state.line = line;
    state.dialogue = wrapText(BEAST_LINES[line], BATTLE.bubbleColumns);
    setPhase(state, "speech");
}

function startAttack(state) {
    state.attack = state.turn % 3;
    state.heart = { x: 50, y: 50 };
    state.projectiles = [];
    state.emitter = { y: 50, target: 50, speed: 2 };
    state.spawnAt = 0;
    setPhase(state, "attack");
}

function useItem(state, typeId) {
    if (!isBattleItemUsable(typeId)) throw new Error(`Cannot use ${typeId || "an empty slot"} in battle`);
    const item = BATTLE_ITEMS[typeId];
    if (item?.equip) state.equipped = typeId;
    if (item?.maxHpScale) state.maxHp = Math.min(BATTLE.maxHp, state.maxHp * item.maxHpScale);
    if (item?.heal) state.hp = Math.min(state.maxHp, state.hp + item.heal);
    if (item?.attack) state.attackBonus += item.attack;
    result(state, item?.text ? "* " + item.text : BATTLE_TEXT.unknownItem);
    return { equip: Boolean(item?.equip), consume: Boolean(item?.consume), sound: item?.sound };
}

export function selectBattleAction(state, action, item = "") {
    if (state.phase !== "menu") throw new Error(`Cannot select ${action} during ${state.phase}`);
    if (action === "whack") {
        setPhase(state, "qte");
    } else if (action === "check") {
        result(state, BATTLE_TEXT.check);
    } else if (action === "discuss") {
        state.mercy = Math.min(100, state.mercy + 2 ** state.discussions++);
        result(state, BATTLE_TEXT.discuss);
    } else if (action === "spare") {
        if (state.mercy >= 100) win(state, "spared");
        else result(state, BATTLE_TEXT.spareFail);
    } else if (action === "item") {
        return useItem(state, item);
    } else if (action === "defend") {
        // The wiki lists DEFEND as doing nothing, so it does not spend the turn either.
        state.message = box(BATTLE_TEXT.defend);
    } else {
        throw new Error(`Unknown battle action: ${action}`);
    }
}

// elapsed is undefined for a miss (closed or timed out); the marker leaves the bar at qteTicks.
export function strikeBattle(state, elapsed) {
    if (state.phase !== "qte") return false;
    state.missed = elapsed === undefined || elapsed >= BATTLE.qteTicks;
    state.damage = state.missed ? 0 : timingDamage(elapsed, state.equipped, state.attackBonus);
    state.beastHpBefore = state.beastHp;
    state.beastHp = Math.max(0, state.beastHp - state.damage);
    setPhase(state, "hit");
    return true;
}

// Clicking through the result text starts MrBeast's turn early.
export function continueBattle(state) {
    if (state.phase !== "result") return false;
    enemyTurn(state);
    return true;
}

function projectile(state, kind, x, y, vx, vy, radius) {
    state.projectiles.push({ id: ++state.nextProjectileId, kind, x, y, vx, vy, radius, age: 0 });
}

// Projectiles per second for this turn, ramping linearly up to the cap at rampTurns.
export function attackRate([first, last], rampTurns, turn) {
    return first + (last - first) * Math.min(1, Math.max(0, turn / rampTurns));
}

// MrBeast's head drifts to random heights at random speeds and now and then snaps to the middle or the bottom.
function moveEmitter(state) {
    const emitter = state.emitter;
    if (state.random() < 0.025) {
        emitter.y = state.random() < 0.5 ? 50 : 90;
        emitter.target = emitter.y;
        return;
    }
    const step = emitter.target - emitter.y;
    if (Math.abs(step) <= emitter.speed) {
        emitter.y = emitter.target;
        emitter.target = 8 + state.random() * 84;
        emitter.speed = 1 + state.random() * 3.5;
    } else {
        emitter.y += Math.sign(step) * emitter.speed;
    }
}

function spawnAttack(state) {
    const time = state.elapsed - 1;
    if (state.attack === 0) moveEmitter(state);
    if (state.attack === 0 && time >= state.spawnAt) {
        state.spawnAt += 20 / attackRate(BATTLE.moneyRate, BATTLE.moneyRampTurns, state.turn);
        projectile(state, "money", 168, state.emitter.y, -4.5, 0, BATTLE.moneyRadius);
        state.events.push("beastproj");
    } else if (state.attack === 1 && time >= state.spawnAt) {
        state.spawnAt += 20 / attackRate(BATTLE.burgerRate, BATTLE.burgerRampTurns, state.turn);
        projectile(state, "burger", 8 + state.random() * 84, -20, 0, 2.4, 6);
        state.events.push("fall");
    } else if (state.attack === 2 && time % BATTLE.beastInterval === 0) {
        const x = 150;
        const y = 50 + Math.sin(time / 10) * 35;
        const dx = state.heart.x - x;
        const dy = state.heart.y - y;
        const length = Math.hypot(dx, dy);
        projectile(state, "beast", x, y, dx / length * 3, dy / length * 3, 4);
        state.events.push("beastproj");
    }
}

function collides(heart, shot, oldX, oldY) {
    const dx = shot.x - oldX;
    const dy = shot.y - oldY;
    const denominator = dx * dx + dy * dy;
    const t = denominator === 0 ? 0 : Math.max(0, Math.min(1,
        ((heart.x - oldX) * dx + (heart.y - oldY) * dy) / denominator));
    return Math.hypot(heart.x - oldX - dx * t, heart.y - oldY - dy * t)
        <= BATTLE.heartRadius + shot.radius;
}

// Visible half heights of the burger layers in arena units, bottom to top.
export const BURGER_LAYERS = Object.freeze([["bottom", 2.5], ["patty", 1.5], ["patty", 1.5], ["top", 3]]);
const PIECES = ["bottom", "patty", "top"];

// The layers of one burger only move vertically: each one rests on the arena floor or on the layer below it.
function stackPieces(pieces) {
    const groups = new Map();
    for (const piece of pieces) {
        if (!groups.has(piece.group)) groups.set(piece.group, []);
        groups.get(piece.group).push(piece);
    }
    for (const group of groups.values()) {
        group.sort((a, b) => a.layer - b.layer);
        let support = 100;
        let supportVy = 0;
        for (const piece of group) {
            if (piece.y + piece.half > support) {
                piece.y = support - piece.half;
                const closing = piece.vy - supportVy;
                if (closing > 0) piece.vy = closing < 0.6 ? supportVy : supportVy - closing * 0.3;
            }
            support = piece.y - piece.half;
            supportVy = piece.vy;
        }
    }
}

function attackTick(state, movement) {
    const length = Math.max(1, Math.hypot(movement.x, movement.y));
    state.heart.x = Math.max(3, Math.min(97, state.heart.x + movement.x / length * BATTLE.heartSpeed));
    state.heart.y = Math.max(3, Math.min(97, state.heart.y - movement.y / length * BATTLE.heartSpeed));
    spawnAttack(state);
    const damage = state.equipped === "brr:item_boots" ? BATTLE.bootsHitDamage : BATTLE.hitDamage;
    const fragments = [];
    state.projectiles = state.projectiles.filter((shot) => {
        const oldX = shot.x;
        const oldY = shot.y;
        if (PIECES.includes(shot.kind)) shot.vy += 0.2;
        shot.x += shot.vx;
        shot.y += shot.vy;
        shot.age++;
        if (shot.kind === "burger" && shot.y >= 94) {
            // The burger lands, then its layers pop straight up as one stack; gravity brings them back down.
            let bottom = 100;
            for (const [layer, [kind, half]] of BURGER_LAYERS.entries()) {
                fragments.push({ id: ++state.nextProjectileId, kind, group: shot.id, layer, half,
                    x: shot.x, y: bottom - half, vx: 0, vy: -2.4 - layer * 0.7, radius: 4, age: 0 });
                bottom -= half * 2;
            }
            state.events.push("splat");
        }
        if (collides(state.heart, shot, oldX, oldY)) {
            state.hp = Math.max(0, state.hp - damage);
            state.hits++;
            if (state.hp === 0) {
                state.message = box("* You lost.");
                setPhase(state, "defeat");
            }
            return false;
        }
        return !(shot.kind === "burger" && shot.y >= 94)
            && shot.age < BATTLE.attackTicks && shot.x > -80 && shot.x < 190 && shot.y < 180;
    });
    state.projectiles.push(...fragments);
    stackPieces(state.projectiles.filter((shot) => PIECES.includes(shot.kind)));
}
export function advanceBattle(state, movement = { x: 0, y: 0 }) {
    state.events.length = 0;
    state.elapsed++;
    if (state.phase === "qte") {
        if (state.elapsed >= BATTLE.qteTicks + BATTLE.qteGraceTicks) strikeBattle(state);
    } else if (state.phase === "hit") {
        if (state.elapsed < BATTLE.hitTicks) return;
        if (state.beastHp === 0) win(state, "defeated");
        else enemyTurn(state);
    } else if (state.phase === "result") {
        if (state.elapsed >= typeTicks(state.message) + BATTLE.resultWaitTicks) enemyTurn(state);
    } else if (state.phase === "speech") {
        if (state.elapsed >= typeTicks(state.dialogue) + BATTLE.speechWaitTicks) startAttack(state);
    } else if (state.phase === "attack") {
        attackTick(state, movement);
        if (state.phase === "attack" && state.elapsed >= BATTLE.attackTicks) {
            state.turn++;
            state.projectiles = [];
            const neutral = BATTLE_TEXT.neutral;
            state.message = box(neutral[Math.min(neutral.length - 1, Math.floor(state.random() * neutral.length))]);
            setPhase(state, "menu");
        }
    }
}
