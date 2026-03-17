// classification/knn.js — K-Nearest Neighbours

export class KNN {
  constructor() {
    this.k = 3;
    this.X = [];
    this.Y = [];
    this.labels = [];
    this.k_colors = ['#22d3ee', '#f472b6', '#34d399', '#fbbf24'];
    this.fitted = false;
    this.boundaryCache = null;
  }

  fit(X, Y, labels) {
    this.X = [...X];
    this.Y = [...Y];
    this.labels = [...labels];
    this.fitted = true;
    this.boundaryCache = null; // invalidate
    return { done: true };
  }

  predict(x, y) {
    if (!this.fitted) return 0;
    const dists = this.X.map((xi, i) => ({
      d: Math.hypot(x - xi, y - this.Y[i]),
      label: this.labels[i]
    }));
    dists.sort((a, b) => a.d - b.d);
    const knn = dists.slice(0, this.k);
    const votes = {};
    for (const { label } of knn) votes[label] = (votes[label] || 0) + 1;
    return +Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
  }

  isIterative() { return false; }

  reset() {
    this.X = []; this.Y = []; this.labels = [];
    this.fitted = false; this.boundaryCache = null;
  }

  getParams() {
    return [
      { id: 'knn-k', label: 'k (Neighbours)', type: 'range', min: 1, max: 20, step: 1, value: this.k, fmt: v => Math.round(v), tooltip: 'Number of nearest neighbours to consider for majority vote. Larger k → smoother boundary', onchange: () => { this.boundaryCache = null; } },
    ];
  }

  applyParams(params) {
    if (params['knn-k']) { this.k = Math.round(+params['knn-k']); this.boundaryCache = null; }
  }

  // Draw decision boundary by sampling a grid
  drawBoundary(c) {
    if (!this.fitted) return;
    const step = 8; // pixels per sample (coarser = faster)
    const ctx = c.ctx;
    const alphaHex = '28'; // very transparent fill
    const colors = this.k_colors;

    for (let cx = 0; cx < c.width; cx += step) {
      for (let cy = 0; cy < c.height; cy += step) {
        const wx = c.toWorldX(cx);
        const wy = c.toWorldY(cy);
        const label = this.predict(wx, wy);
        ctx.fillStyle = (colors[label] || '#6366f1') + alphaHex;
        ctx.fillRect(cx, cy, step, step);
      }
    }
  }

  drawPoints(c) {
    for (let i = 0; i < this.X.length; i++) {
      const col = this.k_colors[this.labels[i]] || '#fff';
      c.circle(this.X[i], this.Y[i], 5, col, '#ffffff', 1.5);
    }
  }
}
