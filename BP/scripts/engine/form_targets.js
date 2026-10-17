import { getAllEntities, normalizeEntityName } from "./registry.js";

const TARGET_AREAPORTAL = "brr:info_target_areaportal_block";
const FILTER_CLASSES = new Set(["brr:filter_class_block", "brr:filter_name_block", "brr:filter_multiple_block"]);

// SECTION: Form Target Lists
// Named entities for the output target dropdown, info_target_areaportal names for area portals,
// and every connection elsewhere that targets `name` (the form's Input tab).
export function getFormTargets(name) {
    const wanted = normalizeEntityName(name);
    const namedTargetEntries = [];
    const areaPortalTargets = [];
    const filterTargets = [];
    const inputs = [];
    const seenNames = new Set();

    for (const entity of getAllEntities()) {
        const entityName = `${entity.data?.name ?? ""}`.trim();
        const normalized = normalizeEntityName(entityName);
        if (normalized && !seenNames.has(normalized)) {
            seenNames.add(normalized);
            namedTargetEntries.push({ name: entityName, typeId: entity.typeId });
        }
        if (entity.typeId === TARGET_AREAPORTAL && entityName) areaPortalTargets.push(entityName);
        if (FILTER_CLASSES.has(entity.typeId) && entityName && !filterTargets.includes(entityName)) filterTargets.push(entityName);
        if (!wanted) continue;

        for (const connection of Array.isArray(entity.data?.outputs) ? entity.data.outputs : []) {
            const target = normalizeEntityName(connection?.target);
            const matches = target.endsWith("*") ? wanted.startsWith(target.slice(0, -1)) : target === wanted;
            if (!matches) continue;
            inputs.push({
                sourceName: entityName || `[${entity.typeId.replace(/^brr:/, "")} at ${entity.cells[0].x},${entity.cells[0].y},${entity.cells[0].z}]`,
                output: `${connection.output ?? ""}`,
                input: `${connection.input ?? ""}`
            });
        }
    }

    return { namedTargetEntries, areaPortalTargets, filterTargets, inputs };
}
