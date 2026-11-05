// Cosy background soundscapes, generated live in the browser (no audio files needed).
export const SOUNDSCAPES = [
  { id: "rain", label: "Rain on the window", icon: "🌧️" },
  { id: "lofi", label: "Lo-fi study beats", icon: "🎧" },
  { id: "piano", label: "Classical piano", icon: "🎹" },
  { id: "fire", label: "Fireplace crackle", icon: "🔥" },
] as const;
export type SoundscapeId = (typeof SOUNDSCAPES)[number]["id"];

function noiseBuffer(ctx: AudioContext, brown = false) {
  const len = ctx.sampleRate * 3;
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
  }
  return b;
}
function loopNoise(ctx: AudioContext, out: AudioNode, brown: boolean, type: BiquadFilterType, freq: number, gain: number) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, brown); src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = ctx.createGain(); g.gain.value = gain;
  src.connect(f).connect(g).connect(out); src.start();
  return () => src.stop();
}
function tone(ctx: AudioContext, out: AudioNode, freq: number, at: number, dur: number, vol: number, type: OscillatorType = "triangle") {
  const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(out); o.start(at); o.stop(at + dur + 0.05);
}
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** Starts a soundscape into `out`; returns a stop function. */
export function startSoundscape(ctx: AudioContext, out: AudioNode, id: SoundscapeId): () => void {
  const stops: (() => void)[] = [];
  let timer: ReturnType<typeof setInterval> | undefined;
  if (id === "rain") {
    stops.push(loopNoise(ctx, out, false, "lowpass", 1800, 0.25));
    stops.push(loopNoise(ctx, out, true, "lowpass", 400, 0.5));
    timer = setInterval(() => { const t = ctx.currentTime; for (let i = 0; i < 4; i++) tone(ctx, out, 2500 + Math.random() * 3000, t + Math.random() * 0.25, 0.04, 0.02, "sine"); }, 250);
  } else if (id === "fire") {
    stops.push(loopNoise(ctx, out, true, "lowpass", 600, 0.7));
    timer = setInterval(() => {
      const t = ctx.currentTime;
      for (let i = 0; i < 3; i++) if (Math.random() < 0.6) {
        const s = ctx.createBufferSource(); s.buffer = noiseBuffer(ctx);
        const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1500 + Math.random() * 3000;
        const g = ctx.createGain(); const at = t + Math.random() * 0.3;
        g.gain.setValueAtTime(0.25 * Math.random(), at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
        s.connect(f).connect(g).connect(out); s.start(at, Math.random(), 0.05);
      }
    }, 300);
  } else if (id === "piano") {
    // Gentle arpeggios through a Satie-ish progression.
    const chords = [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67], [52, 55, 60, 64]];
    let step = 0;
    const play = () => {
      const t = ctx.currentTime; const c = chords[Math.floor(step / 8) % chords.length]!;
      tone(ctx, out, hz(c[step % 4]! + (step % 8 >= 4 ? 12 : 0)), t, 2.2, 0.12);
      if (step % 8 === 0) tone(ctx, out, hz(c[0]! - 12), t, 3.5, 0.1);
      step++;
    };
    play(); timer = setInterval(play, 420);
  } else {
    // Lo-fi: soft kick/hat, warm chords and vinyl hiss.
    stops.push(loopNoise(ctx, out, false, "highpass", 6000, 0.015));
    const chords = [[62, 65, 69, 72], [55, 59, 62, 65], [60, 64, 67, 71], [57, 60, 64, 67]];
    let beat = 0;
    const play = () => {
      const t = ctx.currentTime;
      if (beat % 4 === 0 || beat % 8 === 5) { const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2); o.connect(g).connect(out); o.start(t); o.stop(t + 0.25); }
      if (beat % 2 === 1) tone(ctx, out, 8000, t, 0.03, 0.02, "square");
      if (beat % 8 === 0) for (const n of chords[Math.floor(beat / 8) % 4]!) tone(ctx, out, hz(n - 12), t, 2.6, 0.05, "sine");
      beat++;
    };
    play(); timer = setInterval(play, 333);
  }
  return () => { if (timer) clearInterval(timer); stops.forEach(s => { try { s(); } catch { /* already stopped */ } }); };
}
