import { SEGMENTED_SOUNDS } from "../segmented_sounds_data.js";

// Plays a sound cut by scripts_gen/make_segmented_sounds.mjs one segment at a time at the entity's
// current position, so it appears to follow the entity around.
export class SegmentedSound {
    constructor(id, loop = false) {
        this.id = id;
        this.ticks = SEGMENTED_SOUNDS[id] ?? [];
        this.loop = loop;
        this.playing = false;
        this.index = 0;
        this.nextAt = 0;
        this.current = undefined;
    }

    start(tick) {
        this.playing = this.ticks.length > 0;
        this.index = 0;
        this.nextAt = tick;
    }

    // cuts the segment that is currently audible as well
    stop(dimension) {
        this.playing = false;
        if (!this.current) return;
        try { dimension.runCommand(`stopsound @a ${this.current}`); } catch { }
        this.current = undefined;
    }

    update(entity, tick) {
        if (!this.playing || tick < this.nextAt) return;
        if (this.index >= this.ticks.length) {
            if (!this.loop) {
                this.playing = false;
                this.current = undefined;
                return;
            }
            this.index = 0;
        }
        this.current = `${this.id}.${String(this.index).padStart(2, "0")}`;
        try { entity.dimension.playSound(this.current, entity.location); }
        catch (error) { console.warn(`[segmented_sound] Could not play ${this.current}: ${error}`); }
        this.nextAt = tick + this.ticks[this.index];
        this.index++;
    }
}
