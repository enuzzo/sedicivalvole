const REPEAT_WINDOWS_SECONDS = Object.freeze([
  0.5,
  0.375,
  0.25,
  0.1875,
  0.125,
  0.09375,
  0.0625,
]);

const clamp01 = (value) => Number.isFinite(value)
  ? Math.min(1, Math.max(0, value))
  : 0;

export class BeatRepeatEffect {
  constructor(sampleRate) {
    this.sampleRate = Math.max(8_000, Number(sampleRate) || 48_000);
    this.historyLength = Math.ceil(this.sampleRate * REPEAT_WINDOWS_SECONDS[0]) + 8;
    this.historyLeft = new Float32Array(this.historyLength);
    this.historyRight = new Float32Array(this.historyLength);
    this.repeatLeft = new Float32Array(this.historyLength);
    this.repeatRight = new Float32Array(this.historyLength);
    this.historyPosition = 0;
    this.repeatPosition = 0;
    this.repeatLength = 0;
    this.amount = 0;
    this.target = 0;
    this.capturePending = false;
    this.active = false;
    this.smoothing = 1 - Math.exp(-1 / (0.008 * this.sampleRate));
  }

  set(value) {
    const next = clamp01(value);
    if (next > 0.01 && this.target <= 0.01) this.capturePending = true;
    this.target = next;
  }

  windowSamples() {
    const index = Math.min(
      REPEAT_WINDOWS_SECONDS.length - 1,
      Math.round(this.target * (REPEAT_WINDOWS_SECONDS.length - 1)),
    );
    return Math.max(32, Math.round(REPEAT_WINDOWS_SECONDS[index] * this.sampleRate));
  }

  capture() {
    const length = Math.min(this.historyLength - 8, this.windowSamples());
    const start = (this.historyPosition - length + this.historyLength) % this.historyLength;
    for (let index = 0; index < length; index += 1) {
      const sourceIndex = (start + index) % this.historyLength;
      this.repeatLeft[index] = this.historyLeft[sourceIndex];
      this.repeatRight[index] = this.historyRight[sourceIndex];
    }
    this.repeatLength = length;
    this.repeatPosition = 0;
    this.capturePending = false;
    this.active = true;
  }

  repeatedSample(buffer) {
    const length = Math.min(this.repeatLength, this.windowSamples());
    if (length <= 0) return 0;
    const fade = Math.min(Math.round(this.sampleRate * 0.004), Math.floor(length / 4));
    const position = Math.min(this.repeatPosition, length - 1);
    if (fade > 0 && position >= length - fade) {
      const head = position - (length - fade);
      const blend = head / fade;
      return buffer[position] * (1 - blend) + buffer[head] * blend;
    }
    return buffer[position];
  }

  tick(left, right = left) {
    this.historyLeft[this.historyPosition] = left;
    this.historyRight[this.historyPosition] = right;
    this.historyPosition = (this.historyPosition + 1) % this.historyLength;
    if (this.capturePending) this.capture();

    this.amount += (this.target - this.amount) * this.smoothing;
    if (!this.active || this.repeatLength <= 0) return [left, right];

    const repeatedLeft = this.repeatedSample(this.repeatLeft);
    const repeatedRight = this.repeatedSample(this.repeatRight);
    const wet = clamp01(this.amount);
    const output = [
      left * (1 - wet) + repeatedLeft * wet,
      right * (1 - wet) + repeatedRight * wet,
    ];

    const activeLength = Math.min(this.repeatLength, this.windowSamples());
    const fade = Math.min(Math.round(this.sampleRate * 0.004), Math.floor(activeLength / 4));
    this.repeatPosition += 1;
    if (this.repeatPosition >= activeLength) this.repeatPosition = fade;
    if (this.target <= 0.01 && this.amount <= 0.001) {
      this.active = false;
      this.repeatPosition = 0;
    }
    return output;
  }
}

export function repeatWindowSeconds(amount) {
  const index = Math.min(
    REPEAT_WINDOWS_SECONDS.length - 1,
    Math.round(clamp01(amount) * (REPEAT_WINDOWS_SECONDS.length - 1)),
  );
  return REPEAT_WINDOWS_SECONDS[index];
}
