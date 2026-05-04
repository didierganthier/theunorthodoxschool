"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── CANVAS SHAPES ───────────────────────────────────────────────────────────

interface Shape {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  sides: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

function makeShape(w: number, h: number): Shape {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.18,
    radius: 50 + Math.random() * 130,
    sides: Math.floor(3 + Math.random() * 4),
    opacity: 0.06 + Math.random() * 0.07,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.003,
  };
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  s: Shape
) {
  ctx.beginPath();
  for (let i = 0; i < s.sides; i++) {
    const angle = s.rotation + (i * 2 * Math.PI) / s.sides;
    const px = s.x + s.radius * Math.cos(angle);
    const py = s.y + s.radius * Math.sin(angle);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = `rgba(220, 220, 220, ${s.opacity})`;
  ctx.lineWidth = 0.7;
  ctx.stroke();
}

// ─── AMBIENT MUSIC ───────────────────────────────────────────────────────────

// A minor pentatonic across two octaves — moody, atmospheric
const SCALE = [110, 130.81, 146.83, 164.81, 196, 220, 261.63, 293.66, 329.63, 392, 440];

function buildReverb(ctx: AudioContext): ConvolverNode {
  const conv = ctx.createConvolver();
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8);
    }
  }
  conv.buffer = buf;
  return conv;
}

function scheduleNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  vol: number
) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.detune.value = (Math.random() - 0.5) * 10;
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(vol, start + 0.4);
  env.gain.setValueAtTime(vol, start + dur - 0.8);
  env.gain.linearRampToValueAtTime(0, start + dur);
  osc.connect(env);
  env.connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.1);
}

type TeardownFn = () => void;

function buildAmbientAudio(): TeardownFn {
  const AC =
    window.AudioContext ||
    (
      window as Window & { webkitAudioContext?: typeof AudioContext }
    ).webkitAudioContext;
  if (!AC) return () => {};

  const audioCtx = new AC();
  const master = audioCtx.createGain();
  master.gain.setValueAtTime(0, audioCtx.currentTime);
  master.gain.linearRampToValueAtTime(0.55, audioCtx.currentTime + 3);
  master.connect(audioCtx.destination);

  const reverb = buildReverb(audioCtx);
  reverb.connect(master);

  const dry = audioCtx.createGain();
  dry.gain.value = 0.5;
  dry.connect(master);

  const wet = audioCtx.createGain();
  wet.gain.value = 0.5;
  wet.connect(reverb);

  let stopped = false;
  let nextTime = audioCtx.currentTime + 0.2;

  function loop() {
    if (stopped) return;

    const idx = Math.floor(Math.random() * SCALE.length);
    const freq = SCALE[idx];
    const dur = 4 + Math.random() * 5;
    const vol = 0.12 + Math.random() * 0.14;

    scheduleNote(audioCtx, dry, freq, nextTime, dur, vol);
    scheduleNote(audioCtx, wet, freq, nextTime, dur, vol);

    // Harmony note (a third or fifth up the scale)
    if (Math.random() > 0.4) {
      const harmIdx = Math.min(idx + 2 + Math.floor(Math.random() * 2), SCALE.length - 1);
      const harmVol = vol * 0.55;
      scheduleNote(audioCtx, dry, SCALE[harmIdx], nextTime + 0.15, dur - 0.5, harmVol);
      scheduleNote(audioCtx, wet, SCALE[harmIdx], nextTime + 0.15, dur - 0.5, harmVol);
    }

    nextTime += 2.5 + Math.random() * 3.5;
    const delay = Math.max(50, (nextTime - audioCtx.currentTime - 1.5) * 1000);
    setTimeout(loop, delay);
  }

  loop();

  return () => {
    stopped = true;
    master.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.2);
    setTimeout(() => audioCtx.close().catch(() => {}), 1300);
  };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function Ambience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shapesRef = useRef<Shape[]>([]);
  const rafRef = useRef<number>(0);
  const teardownRef = useRef<TeardownFn | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (shapesRef.current.length === 0) {
        shapesRef.current = Array.from({ length: 12 }, () =>
          makeShape(canvas.width, canvas.height)
        );
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);

      for (const s of shapesRef.current) {
        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.rotationSpeed;
        if (s.x < -s.radius) s.x = w + s.radius;
        if (s.x > w + s.radius) s.x = -s.radius;
        if (s.y < -s.radius) s.y = h + s.radius;
        if (s.y > h + s.radius) s.y = -s.radius;
        drawPolygon(ctx, s);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const toggleSound = useCallback(() => {
    if (soundOn) {
      teardownRef.current?.();
      teardownRef.current = null;
      setSoundOn(false);
    } else {
      teardownRef.current = buildAmbientAudio();
      setSoundOn(true);
    }
  }, [soundOn]);

  useEffect(() => {
    return () => {
      teardownRef.current?.();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{ position: "fixed", inset: 0, zIndex: 20, pointerEvents: "none" }}
      />
      <button
        type="button"
        onClick={toggleSound}
        style={{ position: "fixed", bottom: "1rem", right: "1rem", zIndex: 40 }}
        className="border border-white/20 bg-black/60 px-3 py-2 text-xs uppercase tracking-[0.18em] text-gray-400 backdrop-blur-md transition hover:border-white/50 hover:text-white"
        aria-pressed={soundOn}
      >
        ♪ {soundOn ? "On" : "Off"}
      </button>
    </>
  );
}
