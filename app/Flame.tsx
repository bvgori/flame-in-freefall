"use client";

import { useEffect, useRef } from "react";

type Props = { o2: number; gravity: number; flow: number };

export default function Flame({ o2, gravity, flow }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const params = useRef(props(o2, gravity, flow));
  params.current = props(o2, gravity, flow);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const LEVELS = 8;
    let raf = 0, last = 0, visible = true, drawnKey = "";
    const cur = { ...params.current };

    const draw = (t: number) => {
      raf = visible ? requestAnimationFrame(draw) : 0;
      if (t - last < 33) return;
      last = t;
      const dpr = Math.min(devicePixelRatio, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const p = params.current;
      if (reduce) {
        Object.assign(cur, p);
        const key = `${w}|${h}|${JSON.stringify(p)}`;
        if (key === drawnKey) return;
        drawnKey = key;
      } else for (const k of Object.keys(cur) as (keyof typeof cur)[]) cur[k] += (p[k] - cur[k]) * 0.08;
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const step = Math.max(6, Math.round(w / 90));
      const cx = w / 2 - cur.drift * Math.min(w, h) * 0.08, cy = h * (0.5 + 0.14 * cur.lift), R = (Math.min(w, h) * 0.2 * cur.size) / (1 + cur.lift * 0.9);
      const fadeZone = Math.min(w, h) * 0.14;
      const time = reduce ? 0 : t / 1000;
      const paths = Array.from({ length: LEVELS * 2 }, () => new Path2D());
      const reach = R * 2.3;
      for (let y = step / 2; y < h; y += step) {
        if (Math.abs(y - cy) > reach * (1 + cur.lift * 2.2)) continue;
        for (let x = step / 2; x < w; x += step) {
          let dx = x - cx - cur.drift * R, dy = y - cy;
          if (Math.abs(dx) > reach) continue;
          if (dy < 0) dy /= 1 + cur.lift * 2.2;
          dx /= 1 + cur.lift * 0.15 * (dy < 0 ? 1 : 0);
          const r = Math.hypot(dx, dy);
          const ang = Math.atan2(dy, dx);
          const wobble = 1 + 0.03 * Math.sin(ang * 5 + time * 2.1) + 0.02 * Math.sin(ang * 9 - time * 3.3) + cur.lift * 0.08 * Math.sin(time * 9 + dy * 0.05);
          const shell = Math.exp(-(((r - R * wobble) / (R * 0.16)) ** 2));
          const core = 0.28 * Math.exp(-((r / (R * 0.55)) ** 2));
          const halo = 0.12 * Math.exp(-(((r - R * 1.25) / (R * 0.5)) ** 2));
          const edge = Math.min(1, Math.min(x, w - x, y, h - y) / fadeZone);
          const I = Math.min(1, (shell + core + halo) * cur.bright) * edge * edge;
          if (I < 0.07) continue;
          const rad = (step / 2) * Math.sqrt(I);
          const path = paths[(shell > core ? LEVELS : 0) + Math.min(LEVELS - 1, Math.floor(I * LEVELS))];
          path.moveTo(x + rad, y);
          path.arc(x, y, rad, 0, Math.PI * 2);
        }
      }
      paths.forEach((path, i) => {
        const tint = i >= LEVELS ? cur.hue : 0.15;
        const I = ((i % LEVELS) + 0.5) / LEVELS;
        ctx.fillStyle = `hsl(${222 - tint ** 1.5 * 190} ${55 + tint * 40}% ${60 + I * 30}%)`;
        ctx.fill(path);
      });
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(draw);
    });
    io.observe(canvas);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);

  return <canvas ref={ref} className="flame" aria-hidden />;
}

function props(o2: number, gravity: number, flow: number) {
  const lean = Math.max(0, Math.min(1, (o2 - 12) / 28));
  return {
    size: 0.75 + 0.45 * Math.min(1, o2 / 60),
    bright: o2 < 13 ? 0.15 : 0.45 + 0.6 * lean,
    hue: Math.min(1, gravity * 1.3 + Math.max(0, (o2 - 30) / 140)),
    lift: gravity,
    drift: Math.min(0.6, flow / 80),
  };
}
