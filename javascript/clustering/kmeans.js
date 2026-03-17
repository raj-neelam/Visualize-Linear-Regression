// clustering/kmeans.js — K-Means clustering with animated centroid updates

export class KMeans {
  constructor() {
    this.k          = 3;
    this.maxIter    = 100;
    this.iter       = 0;
    this.centroids  = [];
    this.assignments= [];
    this.fitted     = false;
    this.inertia    = 0;
    this.lossHistory= [];
    this.k_colors   = ['#22d3ee', '#f472b6', '#34d399', '#fbbf24'];
    this._X         = [];
    this._Y         = [];
  }

  // K-Means++ initialization for better starting centroids
  _initCentroids(X, Y) {
    const n = X.length;
    const chosen = [Math.floor(Math.random() * n)];
    while (chosen.length < this.k) {
      const dists = Array.from({ length: n }, (_, i) => {
        const minD2 = Math.min(...chosen.map(j =>
          (X[i] - X[j]) ** 2 + (Y[i] - Y[j]) ** 2
        ));
        return minD2;
      });
      const total = dists.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      for (let i = 0; i < n; i++) {
        r -= dists[i];
        if (r <= 0) { chosen.push(i); break; }
      }
      if (chosen.length < this.k) chosen.push(Math.floor(Math.random() * n));
    }
    this.centroids = chosen.map(i => [X[i], Y[i]]);
  }

  _assign(X, Y) {
    this.assignments = X.map((x, i) => {
      const dists = this.centroids.map(([cx, cy]) => (x - cx) ** 2 + (Y[i] - cy) ** 2);
      return dists.indexOf(Math.min(...dists));
    });
  }

  _updateCentroids(X, Y) {
    const newCentroids = [];
    for (let c = 0; c < this.k; c++) {
      const pts = this.assignments.map((a, i) => a === c ? i : -1).filter(i => i >= 0);
      if (pts.length === 0) {
        newCentroids.push(this.centroids[c]); // keep old centroid
      } else {
        const mx = pts.reduce((s, i) => s + X[i], 0) / pts.length;
        const my = pts.reduce((s, i) => s + Y[i], 0) / pts.length;
        newCentroids.push([mx, my]);
      }
    }
    this.centroids = newCentroids;
  }

  _computeInertia(X, Y) {
    return this.assignments.reduce((s, c, i) => {
      const [cx, cy] = this.centroids[c];
      return s + (X[i] - cx) ** 2 + (Y[i] - cy) ** 2;
    }, 0);
  }

  fit(X, Y) {
    this._X = X; this._Y = Y;
    if (this.centroids.length === 0) {
      this._initCentroids(X, Y);
    }
    if (this.iter >= this.maxIter) return { done: true };

    this._assign(X, Y);
    this._updateCentroids(X, Y);
    this._assign(X, Y); // reassign after update
    this.iter++;
    this.inertia = this._computeInertia(X, Y);
    this.lossHistory.push(this.inertia);
    this.fitted = true;
    return { done: this.iter >= this.maxIter, epoch: this.iter, loss: this.inertia };
  }

  predict(x, y) {
    if (this.centroids.length === 0) return 0;
    const dists = this.centroids.map(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2);
    return dists.indexOf(Math.min(...dists));
  }

  isIterative() { return true; }

  reset() {
    this.centroids   = [];
    this.assignments = [];
    this.iter        = 0;
    this.fitted      = false;
    this.lossHistory = [];
    this.inertia     = 0;
  }

  getParams() {
    return [
      { id: 'km-k',    label: 'Clusters (k)',  type: 'range', min: 2, max: 8,   step: 1,  value: this.k,       fmt: v => Math.round(v), tooltip: 'Number of cluster centroids. Uses K-Means++ initialisation', onchange: () => this.reset() },
      { id: 'km-iter', label: 'Max Iterations', type: 'range', min: 5, max: 200, step: 5,  value: this.maxIter, fmt: v => Math.round(v), tooltip: 'Maximum E→M steps before stopping' },
    ];
  }

  applyParams(params) {
    const newK = params['km-k'] ? Math.round(+params['km-k']) : this.k;
    if (newK !== this.k) { this.k = newK; this.reset(); }
    if (params['km-iter']) this.maxIter = +params['km-iter'];
  }

  getLiveVars() { return []; }

  drawBoundary(c) {
    if (!this.fitted) return;
    c.drawDecisionBoundary((wx, wy) => this.predict(wx, wy), this.k_colors, 10);
  }

  drawPoints(c, X, Y) {
    const colors = this.k_colors;
    for (let i = 0; i < X.length; i++) {
      const label = this.assignments[i] ?? 0;
      const col = colors[label % colors.length];
      c.circle(X[i], Y[i], 5, col, '#fff', 1.5);
    }
  }

  // Draw centroid markers (star shape)
  drawCentroids(c) {
    for (let ci = 0; ci < this.centroids.length; ci++) {
      const [x, y] = this.centroids[ci];
      const col = this.k_colors[ci % this.k_colors.length];
      // Outer ring
      c.circle(x, y, 10, 'rgba(0,0,0,0.4)', col, 3);
      // Inner dot
      c.circle(x, y, 4,  col, '#fff', 2);
      // Label
      c.text(x, y + 18, `C${ci}`, col, 10);
    }
  }
}
