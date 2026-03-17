// classification/naive_bayes.js — Gaussian Naive Bayes

export class NaiveBayes {
  constructor() {
    this.k_colors = ['#22d3ee', '#f472b6', '#34d399', '#fbbf24'];
    this.classes = [];  // unique labels
    this.priors = {};   // P(class)
    this.means  = {};   // { class: [meanX, meanY] }
    this.vars   = {};   // { class: [varX, varY] }
    this.fitted = false;
  }

  fit(X, Y, labels) {
    this.classes = [...new Set(labels)].sort();
    const n = labels.length;
    for (const c of this.classes) {
      const idx = labels.map((l, i) => l === c ? i : -1).filter(i => i >= 0);
      const xs = idx.map(i => X[i]), ys = idx.map(i => Y[i]);
      const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
      const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
      const varX = xs.reduce((a, b) => a + (b - meanX) ** 2, 0) / xs.length + 1e-6;
      const varY = ys.reduce((a, b) => a + (b - meanY) ** 2, 0) / ys.length + 1e-6;
      this.priors[c] = idx.length / n;
      this.means[c]  = [meanX, meanY];
      this.vars[c]   = [varX, varY];
    }
    this.fitted = true;
    return { done: true };
  }

  _logGaussian(x, mean, variance) {
    return -0.5 * Math.log(2 * Math.PI * variance) - (x - mean) ** 2 / (2 * variance);
  }

  predict(x, y) {
    if (!this.fitted) return 0;
    let best = -Infinity, bestC = 0;
    for (const c of this.classes) {
      const logP = Math.log(this.priors[c])
        + this._logGaussian(x, this.means[c][0], this.vars[c][0])
        + this._logGaussian(y, this.means[c][1], this.vars[c][1]);
      if (logP > best) { best = logP; bestC = c; }
    }
    return bestC;
  }

  isIterative() { return false; }
  reset() { this.classes = []; this.fitted = false; }

  getParams() {
    return [
      { id: 'nb-none', label: 'No hyperparameters', type: 'info' }
    ];
  }
  applyParams() {}

  drawBoundary(c) {
    if (!this.fitted) return;
    const step = 8;
    const ctx = c.ctx;
    for (let cx = 0; cx < c.width; cx += step) {
      for (let cy = 0; cy < c.height; cy += step) {
        const wx = c.toWorldX(cx), wy = c.toWorldY(cy);
        const label = this.predict(wx, wy);
        ctx.fillStyle = (this.k_colors[label] || '#6366f1') + '28';
        ctx.fillRect(cx, cy, step, step);
      }
    }
  }

  drawPoints(c, X, Y, labels) {
    for (let i = 0; i < X.length; i++) {
      const col = this.k_colors[labels[i]] || '#fff';
      c.circle(X[i], Y[i], 5, col, '#fff', 1.5);
    }
  }
}
