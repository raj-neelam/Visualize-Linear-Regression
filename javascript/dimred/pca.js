// dimred/pca.js — Principal Component Analysis (2D → shows PC axes + 1D projection)

export class PCA {
  constructor() {
    this.mean = [0, 0];
    this.pc1  = [1, 0]; // principal component 1 direction (unit vector)
    this.pc2  = [0, 1]; // principal component 2
    this.eigenvalues = [0, 0];
    this.fitted = false;
    this.projectedPoints = [];
    this.pointColor = '#22d3ee';
  }

  fit(X, Y) {
    const n = X.length;
    if (n < 2) return;

    // Compute mean
    const mx = X.reduce((a, b) => a + b, 0) / n;
    const my = Y.reduce((a, b) => a + b, 0) / n;
    this.mean = [mx, my];

    // Covariance matrix (2×2)
    let cxx = 0, cxy = 0, cyy = 0;
    for (let i = 0; i < n; i++) {
      const dx = X[i] - mx, dy = Y[i] - my;
      cxx += dx * dx; cxy += dx * dy; cyy += dy * dy;
    }
    cxx /= n; cxy /= n; cyy /= n;

    // Eigenvalues via quadratic formula
    const tr  = cxx + cyy;
    const det = cxx * cyy - cxy * cxy;
    const disc = Math.sqrt(Math.max(0, (tr / 2) ** 2 - det));
    const l1 = tr / 2 + disc;
    const l2 = tr / 2 - disc;
    this.eigenvalues = [l1, l2];

    // Eigenvectors
    if (Math.abs(cxy) > 1e-10) {
      const v1 = [l1 - cyy, cxy];
      const norm1 = Math.hypot(...v1);
      this.pc1 = [v1[0] / norm1, v1[1] / norm1];
      this.pc2 = [-this.pc1[1], this.pc1[0]];
    } else {
      this.pc1 = cxx >= cyy ? [1, 0] : [0, 1];
      this.pc2 = cxx >= cyy ? [0, 1] : [1, 0];
    }

    // Project points onto PC1
    this.projectedPoints = [];
    for (let i = 0; i < n; i++) {
      const dx = X[i] - mx, dy = Y[i] - my;
      const t = dx * this.pc1[0] + dy * this.pc1[1];
      this.projectedPoints.push({
        orig: [X[i], Y[i]],
        proj: [mx + t * this.pc1[0], my + t * this.pc1[1]],
        t,
      });
    }

    this.fitted = true;
    return { done: true };
  }

  isIterative() { return false; }
  reset() { this.fitted = false; this.projectedPoints = []; }

  getParams() {
    return [
      { id: 'pca-info', label: 'No hyperparameters — PCA is determined by the data', type: 'info' }
    ];
  }
  applyParams() {}

  // Explained variance ratio
  explainedVariance() {
    const total = this.eigenvalues[0] + this.eigenvalues[1];
    if (total === 0) return [0, 0];
    return [this.eigenvalues[0] / total, this.eigenvalues[1] / total];
  }

  draw(c) {
    if (!this.fitted) return;
    const ctx = c.ctx;
    const [mx, my] = this.mean;
    const scale = Math.min(c.width, c.height) * 0.4;

    // Draw PC1 axis (through mean, extended)
    const p1x = this.pc1[0] * scale, p1y = this.pc1[1] * scale;
    c.line(mx - p1x, my - p1y, mx + p1x, my + p1y, 2.5, '#6366f1');

    // Draw PC2 axis (shorter)
    const scale2 = scale * Math.sqrt(this.eigenvalues[1] / Math.max(this.eigenvalues[0], 1e-9));
    const p2x = this.pc2[0] * scale2, p2y = this.pc2[1] * scale2;
    c.line(mx - p2x, my - p2y, mx + p2x, my + p2y, 1.5, '#6366f180');

    // PC1 label
    c.text(mx + p1x + 8, my + p1y, 'PC1', '#6366f1', 11);

    // Draw projection lines and projected points
    for (const { orig, proj } of this.projectedPoints) {
      ctx.save();
      ctx.strokeStyle = 'rgba(99,102,241,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(c.toCanvasX(orig[0]), c.toCanvasY(orig[1]));
      ctx.lineTo(c.toCanvasX(proj[0]), c.toCanvasY(proj[1]));
      ctx.stroke();
      ctx.restore();
      // projected point (on PC1 axis)
      c.circle(proj[0], proj[1], 3, '#6366f1');
    }

    // Mean point
    c.circle(mx, my, 5, '#fbbf24', '#fff', 2);
    c.text(mx + 8, my + 8, 'μ', '#fbbf24', 11);
  }

  drawPoints(c, X, Y) {
    for (let i = 0; i < X.length; i++) {
      c.circle(X[i], Y[i], 5, '#22d3ee', '#ffffff40', 1);
    }
  }
}
