import { getEntitiesOfClass, setEntityDisabled } from "../registry.js";
import { cancelPendingEvents, fireOutput, hasPendingEvents, registerInputHandlers, runEntityCommand } from "../io.js";

// SECTION: logic_relay
// Forwards one Trigger input to every OnTrigger output, with Source's semantics:
// - While disabled, Trigger is ignored. Outputs it already queued still fire.
// - Until every OnTrigger output it queued has fired, Trigger is ignored, so a sequence of delayed
//   outputs can not restart halfway (e.g. a second player walking into the same trigger).
//   "Allow fast retrigger" turns this off; EnableRefire lets the next Trigger through early.
// - "Only trigger once" disables the relay after it fires (Source removes it); Enable re-arms it.
// - CancelPending drops every output it queued that has not fired yet.

const RELAY = "brr:logic_relay_block";

// Relays that got EnableRefire; runtime only, like Source's wait-for-refire flag.
const refireAllowed = new Set();

function isTrue(value) {
    if (typeof value === "boolean") return value;
    return /^(1|true|yes|on)$/i.test(`${value ?? ""}`.trim());
}

function triggerRelay(entity, activator) {
    if (entity.disabled) return;

    const waiting = !isTrue(entity.data.fastRetrigger) && !refireAllowed.has(entity.id);
    if (waiting && hasPendingEvents(entity, "OnTrigger")) return;
    refireAllowed.delete(entity.id);

    runEntityCommand(entity, entity.data.runCommand);
    fireOutput(entity, "OnTrigger", activator, entity);
    if (isTrue(entity.data.triggerOnce)) setEntityDisabled(entity, true);
}

registerInputHandlers(RELAY, {
    Trigger: (entity, param, context) => triggerRelay(entity, context.activator),
    // With nothing left in the queue, the next Trigger is let through.
    CancelPending: entity => {
        cancelPendingEvents(entity);
    },
    EnableRefire: entity => {
        refireAllowed.add(entity.id);
    }
});

// Called once with logic_auto's OnMapSpawn, when the world has loaded.
export function fireRelaySpawnOutputs() {
    for (const entity of getEntitiesOfClass(RELAY)) {
        if (!entity.disabled) fireOutput(entity, "OnSpawn");
    }
}
