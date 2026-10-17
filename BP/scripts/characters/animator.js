import { gameTick } from "../core/pause.js";

// Clip: { visual, frames = 1, interval = 1, loops?, then?, hold? }
// - no loops/hold: loops forever
// - loops + then: plays `loops` times, then update() returns `then` so the owner can switch
// - hold: plays once and stays on the last frame
// Property writes are skipped when the value is unchanged, saving network sync.
export class Animator {
    constructor(entity, clips, visualProperty = "brr:visual", frameProperty = "brr:frame") {
        this.entity = entity;
        this.clips = clips;
        this.visualProperty = visualProperty;
        this.frameProperty = frameProperty;
        this.name = undefined;
        this.clip = undefined;
        this.step = 0;
        this.nextAt = 0;
        this.shownVisual = undefined;
        this.shownFrame = undefined;
    }

    play(name) {
        const clip = this.clips[name];
        if (!clip) return;
        this.name = name;
        this.clip = clip;
        this.step = 0;
        this.nextAt = gameTick() + (clip.interval ?? 1);
        this.write(clip.visual, 0);
    }

    // returns the next clip name when a finite clip finishes
    update(tick) {
        const clip = this.clip;
        const frames = clip?.frames ?? 1;
        if (frames <= 1 || tick < this.nextAt) return undefined;
        if (clip.hold && this.step >= frames - 1) return undefined;

        this.step++;
        this.nextAt = tick + (clip.interval ?? 1);
        if (clip.loops && this.step >= frames * clip.loops) return clip.then;
        this.write(clip.visual, this.step % frames);
        return undefined;
    }

    write(visual, frame) {
        try {
            if (visual !== this.shownVisual) {
                this.entity.setProperty(this.visualProperty, visual);
                this.shownVisual = visual;
            }
            if (frame !== this.shownFrame) {
                this.entity.setProperty(this.frameProperty, frame);
                this.shownFrame = frame;
            }
        } catch { }
    }
}
