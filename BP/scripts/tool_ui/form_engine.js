import { ModalFormData } from "@minecraft/server-ui";
import { BLOCK_FORMS, buildTabs, NONE_OPTION } from "./block_forms.js";
import { getBlockInfoSection } from "./block_info.js";
import { getFormTargets } from "../engine/form_targets.js";
import { ACTOR_INPUTS, SPECIAL_TARGETS, classAcceptsInput, getAllInputNames } from "../engine/classes.js";
import { validateConditionRequirements } from "../handler/core/condition_executer.js";
import { sendUiError, sendUiSaved } from "./ui_formatting.js";

const INPUT_OPTIONS = getAllInputNames();

function formatBlockType(typeId) {
    const normalized = `${typeId ?? ""}`;
    if (!normalized) return "Unknown";
    return normalized.replace(/^brr:/, "").replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}

function formatConnection(connection) {
    const param = `${connection?.param ?? ""}`.trim();
    const delay = Number.parseFloat(`${connection?.delay ?? 0}`) || 0;
    const times = Number.parseInt(`${connection?.times ?? -1}`, 10);
    return `${connection?.output || "?"} > ${connection?.target || "?"}.${connection?.input || "?"}`
        + `${param ? `(${param})` : ""}`
        + `${delay > 0 ? ` after ${delay}s` : ""}`
        + `${Number.isFinite(times) && times > 0 ? ` x${times}` : ""}`;
}

// SECTION: Render Context
export function buildContext(blockEntry, descriptor) {
    const data = blockEntry.data ?? {};
    const outputs = Array.isArray(data.outputs) ? data.outputs : [];
    const entries = descriptor.list && Array.isArray(data[descriptor.list.key]) ? data[descriptor.list.key] : [];
    const slots = descriptor.slots ? normalizeSlots(data[descriptor.slots.key], descriptor.slots.count) : [];

    const { namedTargetEntries, areaPortalTargets, filterTargets, inputs } = getFormTargets(data.name);

    return {
        outputs,
        entries,
        slots,
        helpExamples: getBlockInfoSection(blockEntry.typeId, "examples"),
        helpUsage: getBlockInfoSection(blockEntry.typeId, "usage"),
        helpInfo: getBlockInfoSection(blockEntry.typeId, "info"),
        helpConditions: getBlockInfoSection(blockEntry.typeId, "conditions"),
        typeId: blockEntry.typeId,
        outputTypes: descriptor.outputTypes,
        namedTargetEntries,
        areaPortalTargets,
        filterTargets,
        // Special targets first, then every named entity; the index maps back via targetAt().
        targetOptions: [
            ...SPECIAL_TARGETS,
            ...namedTargetEntries.map(entry => `${entry.name} (${formatBlockType(entry.typeId)})`)
        ],
        inputOptions: INPUT_OPTIONS,
        outputNames: outputs.map(output => `${output?.label ?? ""}`.trim() || "(unnamed)"),
        outputSummary: outputs.length === 0
            ? "No outputs saved."
            : outputs.map((output, index) =>
                `${index + 1}. ${output?.label || "(unnamed)"}\n   ${formatConnection(output)}`
            ).join("\n"),
        inputSummary: inputs.length === 0
            ? (data.name ? "Nothing targets this entity." : "Name this entity so others can target it.")
            : inputs.map(input => `- ${input.sourceName}.${input.output} > ${input.input}`).join("\n"),
        entryLabels: descriptor.list
            ? entries.map((entry, index) => `${index + 1}. ${shortLabel(descriptor.list.summary(entry, index))}`)
            : [],
        entrySummary: descriptor.slots
            ? slots.map((slot, index) =>
                `${index + 1}. out:${slot.runOutput || "-"} cmd:${slot.runCommand || "-"}`).join("\n")
            : (entries.length === 0
                ? `No ${descriptor.list ? descriptor.list.noun : "entry"} saved.`
                : entries.map((entry, index) => descriptor.list.summary(entry, index)).join("\n"))
    };
}

function shortLabel(value) {
    const text = `${value ?? ""}`.replace(/\s+/g, " ").trim();
    return text.length > 42 ? `${text.slice(0, 41)}...` : text;
}

function normalizeSlots(rawSlots, count) {
    const slots = Array.isArray(rawSlots) ? rawSlots.slice(0, count) : [];
    while (slots.length < count) slots.push({ runOutput: "", runCommand: "" });
    return slots.map(slot => ({ runOutput: `${slot?.runOutput ?? ""}`, runCommand: `${slot?.runCommand ?? ""}` }));
}

// SECTION: Form Rendering
function renderField(form, field, data, ctx) {
    switch (field.kind) {
        case "text":
            form.textField(field.label, field.placeholder ?? "", { defaultValue: `${field.read?.(data, ctx) ?? ""}` });
            return;
        case "toggle":
            form.toggle(field.label, { defaultValue: Boolean(field.read?.(data, ctx)) });
            return;
        case "drop": {
            const options = field.options(ctx);
            const safeOptions = options.length > 0 ? options : [NONE_OPTION];
            const index = Number(field.read?.(data, ctx) ?? 0);
            form.dropdown(field.label, safeOptions, {
                defaultValueIndex: Math.min(Math.max(0, Number.isFinite(index) ? index : 0), safeOptions.length - 1)
            });
            return;
        }
        case "label":
            form.label(`${field.label}\n${field.read?.(data, ctx) ?? ""}`);
            return;
        default:
            return;
    }
}

// SECTION: Response Application
function applyFieldsTo(target, fields, values, cursor, ctx) {
    for (const field of fields) {
        const value = values[cursor.value++];
        if (field.kind === "text") target[field.key] = `${value ?? ""}`.trim();
        else if (field.kind === "toggle") target[field.key] = Boolean(value);
        else if (field.kind === "drop") {
            const index = Number(value) || 0;
            target[field.key] = field.write ? field.write(index, ctx) : (field.options(ctx)[index] ?? "");
        }
    }
    return target;
}

function applyEntryFields(fields, values, cursor, ctx) {
    return applyFieldsTo({}, fields, values, cursor, ctx);
}

// Which inputs a chosen target can receive: named entities by class, !activator/!player are
// Minecraft entities, !self is this entity, and !caller is only known when the event fires.
function validateInputForTarget(target, input, ctx) {
    switch (target) {
        case "!activator":
        case "!player":
            return ACTOR_INPUTS.includes(input) ? "" : `${target} only accepts: ${ACTOR_INPUTS.join(", ")}.`;
        case "!caller":
            return "";
        case "!self":
            return classAcceptsInput(ctx.typeId, input) ? "" : `This entity has no input '${input}'.`;
        default: {
            const entry = ctx.namedTargetEntries.find(candidate => candidate.name === target);
            return !entry || classAcceptsInput(entry.typeId, input)
                ? ""
                : `${formatBlockType(entry.typeId)} has no input '${input}'.`;
        }
    }
}

function buildNewOutput(values, cursor, ctx) {
    const label = `${values[cursor.value++] ?? ""}`.trim();
    const param = `${values[cursor.value++] ?? ""}`.trim();
    const delayText = `${values[cursor.value++] ?? ""}`.trim();
    const timesText = `${values[cursor.value++] ?? ""}`.trim();
    const typeIndex = Number(values[cursor.value++]) || 0;
    const targetIndex = Number(values[cursor.value++]) || 0;
    const inputIndex = Number(values[cursor.value++]) || 0;
    const shouldAdd = Boolean(values[cursor.value++]);

    if (!shouldAdd) return { output: null };

    const delay = delayText ? Number.parseFloat(delayText) : 0;
    if (!Number.isFinite(delay) || delay < 0) return { error: "Delay must be a number of seconds, 0 or more." };

    const times = timesText ? Number.parseInt(timesText, 10) : -1;
    if (!Number.isFinite(times) || times === 0 || times < -1) {
        return { error: "Times to fire must be -1 (every time) or a positive number." };
    }

    const target = targetIndex < SPECIAL_TARGETS.length
        ? SPECIAL_TARGETS[targetIndex]
        : `${ctx.namedTargetEntries[targetIndex - SPECIAL_TARGETS.length]?.name ?? ""}`.trim();
    if (!target) return { error: "Choose a valid target entity before adding an output." };

    const output = ctx.outputTypes[typeIndex] ?? ctx.outputTypes[0];
    const input = ctx.inputOptions[inputIndex] ?? ctx.inputOptions[0];
    const inputError = validateInputForTarget(target, input, ctx);
    if (inputError) return { error: inputError };

    return {
        output: {
            label: label || `${output}_${target.replace(/^!/, "")}_${Date.now().toString().slice(-4)}`,
            output,
            target,
            input,
            param,
            delay,
            times
        }
    };
}

function conditionError(source, conditionKey) {
    const condition = source?.[conditionKey];
    if (typeof condition !== "string" || !condition) return "";
    return validateConditionRequirements(
        condition,
        source.conditionValue1 ?? "",
        source.conditionValue2 ?? "",
        source.conditionValue3 ?? ""
    ) ?? "";
}

// SECTION: Public Entry Point
export function openBlockForm(player, blockEntry, onSave) {
    const descriptor = BLOCK_FORMS[blockEntry?.typeId];
    if (!descriptor || !player) return;

    if (!blockEntry.data) blockEntry.data = {};
    if (!Array.isArray(blockEntry.data.outputs)) blockEntry.data.outputs = [];

    const data = blockEntry.data;
    const ctx = buildContext(blockEntry, descriptor);
    const tabs = buildTabs(descriptor);
    const flatFields = tabs.flatMap(tab => tab.fields);

    const form = new ModalFormData();
    form.title(descriptor.title);
    for (const field of flatFields) renderField(form, field, data, ctx);
    form.submitButton("Submit");

    form.show(player).then(response => {
        if (response.canceled) return;

        const values = response.formValues ?? [];
        if (values.length < flatFields.length) {
            sendUiError(player, "Save failed: the form returned incomplete data.");
            return;
        }

        const cursor = { value: 0 };
        const next = applyFieldsTo({ ...data }, descriptor.classFields, values, cursor, ctx);

        let entries = ctx.entries.slice();
        if (descriptor.list) {
            const candidate = applyEntryFields(descriptor.list.fields, values, cursor, ctx);
            const shouldAdd = Boolean(values[cursor.value++]);

            if (shouldAdd) {
                if (entries.length >= descriptor.list.max) {
                    sendUiError(player, `Maximum of ${descriptor.list.max} ${descriptor.list.noun}s per block.`);
                    return;
                }
                const error = descriptor.list.validate?.(candidate) || conditionError(candidate, "condition");
                if (error) {
                    sendUiError(player, error);
                    return;
                }
                entries.push(candidate);
            }
        }

        let slots = ctx.slots.slice();
        if (descriptor.slots) {
            const candidate = applyEntryFields(descriptor.slots.fields, values, cursor, ctx);
            if (candidate.__slotSave) {
                const slotIndex = descriptor.slots.fields
                    .find(field => field.key === "__slotIndex")
                    .options(ctx)
                    .indexOf(candidate.__slotIndex);
                if (slotIndex >= 0) {
                    slots[slotIndex] = { runOutput: candidate.runOutput, runCommand: candidate.runCommand };
                }
            }
        }

        if (descriptor.extraTab) {
            applyFieldsTo(next, descriptor.extraTab.fields, values, cursor, ctx);
        }

        const outputResult = buildNewOutput(values, cursor, ctx);
        if (outputResult.error) {
            sendUiError(player, outputResult.error);
            return;
        }

        cursor.value += 1; // Saved tab: outputs summary label
        const deleteOutputIndex = Number(values[cursor.value++]) || 0;
        const confirmDeleteOutput = Boolean(values[cursor.value++]);

        let outputs = ctx.outputs.slice();
        if (confirmDeleteOutput && deleteOutputIndex > 0) outputs.splice(deleteOutputIndex - 1, 1);
        if (outputResult.output) outputs.push(outputResult.output);

        if (descriptor.list) {
            cursor.value += 1; // entries summary label
            const deleteEntryIndex = Number(values[cursor.value++]) || 0;
            const confirmDeleteEntry = Boolean(values[cursor.value++]);
            if (confirmDeleteEntry && deleteEntryIndex > 0) entries.splice(deleteEntryIndex - 1, 1);
        }

        next.outputs = outputs;
        if (descriptor.list) next[descriptor.list.key] = entries;
        if (descriptor.slots) next[descriptor.slots.key] = slots;

        const validationError = (descriptor.validate?.(next, player) || conditionError(next, "executeCondition"));
        if (validationError) {
            sendUiError(player, validationError);
            return;
        }

        if (onSave?.(blockEntry, next) === false) {
            sendUiError(player, "Save failed: this block was removed while the form was open.");
            return;
        }
        sendUiSaved(player, descriptor.title, next.name);
    }).catch(() => { });
}

export function isBlockFormSupported(typeId) {
    return Boolean(BLOCK_FORMS[typeId]);
}
