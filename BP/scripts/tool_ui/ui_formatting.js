
export function addDecorativeSection(form, title) {
    form.divider();
    form.header(title);
    form.divider();
}

export function addReadOnlyListSection(form, title, lines, emptyMessage) {
    addDecorativeSection(form, title);
    if (!Array.isArray(lines) || lines.length === 0) {
        form.label(emptyMessage || "None");
        return;
    }
    form.label(lines.join("\n"));
}

