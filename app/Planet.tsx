"use client";

import { useEffect, useRef } from "react";

export type Body = "earth" | "moon" | "mars";

const CRATERS: [number, number, number][] = [[0.4, 0.3, 0.35], [2.1, -0.5, 0.28], [3.6, 0.6, 0.4], [5.0, -0.2, 0.3], [1.2, -0.9, 0.22], [4.3, 0.9, 0.2], [2.8, 0.1, 0.18], [5.8, 0.5, 0.25]];

function shade(body: Body, lon: number, lat: number): [number, number, number, number] {
  const n = Math.sin(lon * 3 + Math.sin(lat * 4) * 1.7) * Math.cos(lat * 5 - lon) + 0.5 * Math.sin(lon * 7 + lat * 3);
  if (body === "moon") {
    let d = 0;
    for (const [cl, ct, r] of CRATERS) {
      const a = Math.acos(Math.min(1, Math.sin(lat) * Math.sin(ct) + Math.cos(lat) * Math.cos(ct) * Math.cos(lon - cl)));
      if (a < r) d = Math.max(d, a > r * 0.8 ? -0.12 : 0.45 * (1 - a / r) + 0.1);
    }
    const mare = n > 0.5 ? 0.25 : 0;
    return [220, 6, 86, Math.max(0.25, 1 - d - mare)];
  }
  if (body === "mars") {
    if (Math.abs(lat) > 1.2) return [20, 20, 95, 1];
    return [16 + n * 5, 70, 52 + n * 6, 0.85 - (n > 0.6 ? 0.25 : 0)];
  }
  const cloud = Math.sin(lon * 5 + lat * 9) * Math.sin(lat * 7 - lon * 2) > 0.55;
  if (cloud) return [210, 20, 96, 1];
  return n > 0.35 ? [95 + n * 20, 35, 48, 0.9] : [215, 70, 52, 0.75];
}

export default function Planet({ body, still = false, className }: { body: Body; still?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const bodyRef = useRef(body);
  bodyRef.current = body;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = still || matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = 0, visible = true, fade = 1, shown = bodyRef.current;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);

    const draw = (t: number) => {
      const dpr = Math.min(devicePixelRatio, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (shown !== bodyRef.current) { fade -= 0.12; if (fade <= 0) { shown = bodyRef.current; fade = 0; } }
      else if (fade < 1) fade = Math.min(1, fade + 0.08);
      const step = Math.max(still ? 3 : 5, Math.round(w / (still ? 34 : 80)));
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.4;
      const rot = reduce ? 0.6 : t / 9000;
      const L = [-0.55, -0.45, 0.7];
      const glow = shown === "earth" ? [205, 80, 70] : shown === "mars" ? [18, 70, 60] : [220, 10, 75];
      for (let y = step / 2; y < h; y += step) {
        for (let x = step / 2; x < w; x += step) {
          const dx = (x - cx) / R, dy = (y - cy) / R, r2 = dx * dx + dy * dy;
          if (r2 > 1.18) continue;
          let hh, s, l, I;
          if (r2 > 1) {
            if (shown === "moon") continue;
            I = 0.35 * (1 - (r2 - 1) / 0.18) * Math.max(0, -dx * 0.5 - dy * 0.4 + 0.4);
            [hh, s, l] = glow;
          } else {
            const nz = Math.sqrt(1 - r2);
            const lit = 0.16 + 0.84 * Math.max(0, dx * L[0] + dy * L[1] + nz * L[2]) ** 0.8;
            const lat = Math.asin(-dy), lon = Math.atan2(dx, nz) + rot;
            let a;
            [hh, s, l, a] = shade(shown, lon, lat);
            I = Math.min(1, lit * a * 1.15);
          }
          I *= fade;
          if (I < 0.05) continue;
          ctx.fillStyle = `hsl(${hh} ${s}% ${l}%)`;
          ctx.beginPath();
          ctx.arc(x, y, (step / 2) * Math.sqrt(I), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || t - last < 40) return;
      last = t;
      draw(t);
    };
    if (reduce) {
      const redraw = () => { draw(0); if (fade < 1 || shown !== bodyRef.current) raf = requestAnimationFrame(redraw); };
      redraw();
      const iv = setInterval(() => { if (shown !== bodyRef.current) redraw(); }, 200);
      return () => { cancelAnimationFrame(raf); clearInterval(iv); io.disconnect(); };
    }
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [still]);

  return <canvas ref={ref} className={className ?? "planet"} aria-hidden />;
}
