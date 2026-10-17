import { findEntitiesByName } from "../registry.js";
import { fireOutput, registerInputHandlers } from "../io.js";

// SECTION: Filters
// filter_class, filter_name and filter_multiple decide whether an activator (a player or mob) may
// do something. Triggers and area portals reference one by name in their Filter field; any entity
// can also ask a filter directly with the TestActivator input, which answers with OnPass / OnFail.
//
// As in Source, a filter that cannot be found lets everything through. A disabled filter also
// lets everything through, so disabling it switches the restriction off.

const FILTER_CLASS = "brr:filter_class_block";
const FILTER_NAME = "brr:filter_name_block";
const FILTER_MULTIPLE = "brr:filter_multiple_block";
const FILTER_CLASSES = new Set([FILTER_CLASS, FILTER_NAME, FILTER_MULTIPLE]);
// filter_multiple may contain filter_multiples; this stops a filter that contains itself.
const MAX_FILTER_DEPTH = 8;

function toBool(value) {
    if (typeof value === "boolean") return value;
    return /^(1|true|yes|on)$/i.test(`${value ?? ""}`.trim());
}

function lower(value) {
    return `${value ?? ""}`.trim().toLowerCase();
}

export function isFilterClass(typeId) {
    return FILTER_CLASSES.has(typeId);
}

export function findFilter(name) {
    return findEntitiesByName(name).find(entity => FILTER_CLASSES.has(entity.typeId));
}

// "zombie" means "minecraft:zombie"; "player" means "minecraft:player".
function normalizeTypeId(value) {
    const text = lower(value);
    if (!text) return "";
    return text.includes(":") ? text : `minecraft:${text}`;
}

function matchesClass(actor, filter) {
    const wanted = normalizeTypeId(filter.data?.filterClass);
    return Boolean(wanted) && lower(actor?.typeId) === wanted;
}

// A player's username or any entity's name tag; a trailing * matches every name starting with it.
function matchesName(actor, filter) {
    const wanted = lower(filter.data?.filterName);
    if (!wanted) return false;
    const names = [lower(actor?.name), lower(actor?.nameTag)].filter(Boolean);
    if (wanted.endsWith("*")) {
        const prefix = wanted.slice(0, -1);
        return names.some(name => name.startsWith(prefix));
    }
    return names.includes(wanted);
}

function matchesMultiple(actor, filter, depth) {
    const children = (Array.isArray(filter.data?.filters) ? filter.data.filters : [])
        .map(entry => findFilter(entry?.filter))
        .filter(Boolean);
    const results = children.map(child => passesFilter(child, actor, depth + 1));
    return lower(filter.data?.filterType) === "or" ? results.some(Boolean) : results.every(Boolean);
}

export function passesFilter(filter, actor, depth = 0) {
    if (!filter || filter.disabled) return true;
    if (depth > MAX_FILTER_DEPTH) return false;

    let result;
    switch (filter.typeId) {
        case FILTER_CLASS:
            result = matchesClass(actor, filter);
            break;
        case FILTER_NAME:
            result = matchesName(actor, filter);
            break;
        case FILTER_MULTIPLE:
            result = matchesMultiple(actor, filter, depth);
            break;
        default:
            return true;
    }
    return toBool(filter.data?.negated) ? !result : result;
}

// Does `actor` pass the filter named in `owner`'s Filter field? No filter set = everyone passes.
export function passesEntityFilter(owner, actor) {
    const name = `${owner?.data?.filter ?? ""}`.trim();
    if (!name) return true;
    return passesFilter(findFilter(name), actor);
}

// SECTION: Inputs
for (const typeId of FILTER_CLASSES) {
    registerInputHandlers(typeId, {
        TestActivator: (entity, param, context) => {
            const activator = context.activator;
            if (!activator) return;
            fireOutput(entity, passesFilter(entity, activator) ? "OnPass" : "OnFail", activator, entity);
        }
    });
}
