import { world } from "@minecraft/server";

const objectives = new Map();

// creates the objective only when a displayName is given
export function getObjective(id, displayName) {
    let objective = objectives.get(id);
    if (objective?.isValid) return objective;
    objective = world.scoreboard.getObjective(id);
    if (!objective && displayName !== undefined) objective = world.scoreboard.addObjective(id, displayName);
    if (objective) objectives.set(id, objective);
    else objectives.delete(id);
    return objective;
}

export function getScore(participant, id, fallback = 0) {
    const objective = getObjective(id);
    if (!objective) return fallback;
    try {
        return objective.getScore(participant) ?? fallback;
    } catch {
        return fallback;
    }
}

export function addScore(participant, id, amount, displayName = id) {
    getObjective(id, displayName).addScore(participant, amount);
}

export function highestScore(participants, id) {
    let highest = 0;
    for (const participant of participants) highest = Math.max(highest, getScore(participant, id, 0));
    return highest;
}
