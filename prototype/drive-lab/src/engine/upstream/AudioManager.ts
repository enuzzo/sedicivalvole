import { clamp } from "./util/clamp.ts";

export class DynamicAudioNode {
    gain: GainNode;
    audio: AudioBufferSourceNode;
    rpm: number;
    volume: number;
    constructor(gain: GainNode, audio: AudioBufferSourceNode, rpm = 1000, volume = 1) {
        this.gain = gain; this.audio = audio; this.rpm = rpm; this.volume = volume;
    }
}

export class AudioSource {
    public source: string;
    public rpm: number = 1000;
    public volume?: number = 1.0;
}

export class AudioManager {
    static crossFade(value: number, start: number, end: number) {

        /* Equal power crossfade */
        const x = clamp((value - start) / (end - start), 0, 1);
        const gain1 = Math.cos((1.0 - x) * 0.5 * Math.PI);
        const gain2 = Math.cos(x * 0.5 * Math.PI);

        return {
            gain1, gain2
        }
    }

}
