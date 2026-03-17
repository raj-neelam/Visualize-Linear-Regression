// data_generator.js — Synthetic data generation for all algorithm types

export class DataGenerator {

  // ── Regression: linear with noise ────────────────────────────
  static linear(n = 60, noise = 30, worldW = 400, worldH = 300) {
    const slope = (Math.random() * 3 - 1.5);
    const intercept = (Math.random() * 2 - 1) * worldH * 0.35;
    const X = [], Y = [];
    for (let i = 0; i < n; i++) {
      let x, y, tries = 0;
      do {
        x = (Math.random() * 2 - 1) * worldW * 0.45;
        y = slope * x + intercept + (Math.random() * 2 - 1) * noise;
        tries++;
      } while ((y < -worldH * 0.48 || y > worldH * 0.48) && tries < 50);
      if (tries < 50) { X.push(x); Y.push(y); }
    }
    return { X, Y, trueSlope: slope, trueIntercept: intercept };
  }

  // ── Classification: Gaussian clusters ────────────────────────
  static clusters(n = 80, k = 2, spread = 60, worldW = 400, worldH = 300) {
    // Place k cluster centers
    const centres = [];
    for (let c = 0; c < k; c++) {
      let cx, cy, ok = false, tries = 0;
      while (!ok && tries < 200) {
        cx = (Math.random() * 2 - 1) * worldW * 0.38;
        cy = (Math.random() * 2 - 1) * worldH * 0.38;
        ok = centres.every(([ex, ey]) => Math.hypot(cx - ex, cy - ey) > spread * 1.5);
        tries++;
      }
      centres.push([cx, cy]);
    }
    const X = [], Y = [], labels = [];
    for (let i = 0; i < n; i++) {
      const c = i % k;
      const [cx, cy] = centres[c];
      const angle = Math.random() * Math.PI * 2;
      const r = Math.abs(DataGenerator._randn()) * spread;
      X.push(cx + Math.cos(angle) * r);
      Y.push(cy + Math.sin(angle) * r);
      labels.push(c);
    }
    return { X, Y, labels, k };
  }

  // ── Classification: moons ────────────────────────────────────
  static moons(n = 80, noise = 20, worldW = 400, worldH = 300) {
    const X = [], Y = [], labels = [];
    const half = Math.floor(n / 2);
    const r = Math.min(worldW, worldH) * 0.3;
    for (let i = 0; i < half; i++) {
      const angle = Math.PI * (i / half);
      X.push(r * Math.cos(angle) + (Math.random() * 2 - 1) * noise);
      Y.push(r * Math.sin(angle) + (Math.random() * 2 - 1) * noise);
      labels.push(0);
    }
    for (let i = 0; i < n - half; i++) {
      const angle = Math.PI * (i / (n - half)) + Math.PI;
      X.push(r * Math.cos(angle) + r * 0.3 + (Math.random() * 2 - 1) * noise);
      Y.push(r * Math.sin(angle) - r * 0.1 + (Math.random() * 2 - 1) * noise);
      labels.push(1);
    }
    return { X, Y, labels, k: 2 };
  }

  // ── Classification: concentric circles ───────────────────────
  static circles(n = 80, noise = 10, worldW = 400, worldH = 300) {
    const X = [], Y = [], labels = [];
    const R = Math.min(worldW, worldH) * 0.35;
    const half = Math.floor(n / 2);
    for (let i = 0; i < n; i++) {
      const label = i < half ? 0 : 1;
      const r = (label === 0 ? R * 0.35 : R * 0.8) + (Math.random() * 2 - 1) * noise;
      const angle = Math.random() * Math.PI * 2;
      X.push(r * Math.cos(angle));
      Y.push(r * Math.sin(angle));
      labels.push(label);
    }
    return { X, Y, labels, k: 2 };
  }

  // ── Dimensionality Reduction: scatter with structure ─────────
  static scatter2D(n = 80, worldW = 400, worldH = 300) {
    // Correlated 2D data along a main axis
    const angle = Math.random() * Math.PI;
    const X = [], Y = [];
    for (let i = 0; i < n; i++) {
      const t = (Math.random() * 2 - 1) * Math.min(worldW, worldH) * 0.42;
      const perp = (Math.random() * 2 - 1) * 30;
      X.push(t * Math.cos(angle) + perp * Math.sin(angle));
      Y.push(t * Math.sin(angle) - perp * Math.cos(angle));
    }
    return { X, Y };
  }

  // Box-Muller normal distribution
  static _randn() {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
}
