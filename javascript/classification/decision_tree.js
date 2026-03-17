// classification/decision_tree.js — Decision Tree (CART-style, axis-aligned splits)
// Draws transparent colored regions at each depth level

export class DecisionTree {
  constructor() {
    this.maxDepth = 4;
    this.minSamples = 2;
    this.tree = null;
    this.k_colors = ['#22d3ee', '#f472b6', '#34d399', '#fbbf24'];
    this.depthColors = ['#6366f120','#22d3ee20','#34d39920','#fbbf2420','#f472b620'];
    this.fitted = false;
  }

  _gini(labels) {
    const n = labels.length;
    if (n === 0) return 0;
    const counts = {};
    for (const l of labels) counts[l] = (counts[l] || 0) + 1;
    let g = 1;
    for (const c of Object.values(counts)) g -= (c / n) ** 2;
    return g;
  }

  _bestSplit(X, Y, labels) {
    let bestGain = -Infinity, bestFeat = 0, bestThresh = 0;
    const n = labels.length;
    const baseGini = this._gini(labels);

    for (let feat = 0; feat < 2; feat++) {
      const vals = feat === 0 ? X : Y;
      const sorted = [...vals].sort((a, b) => a - b);
      const thresholds = sorted.slice(0, -1).map((v, i) => (v + sorted[i + 1]) / 2);

      for (const t of thresholds) {
        const leftLabels = [], rightLabels = [];
        for (let i = 0; i < n; i++) {
          (vals[i] <= t ? leftLabels : rightLabels).push(labels[i]);
        }
        if (!leftLabels.length || !rightLabels.length) continue;
        const gain = baseGini
          - (leftLabels.length / n) * this._gini(leftLabels)
          - (rightLabels.length / n) * this._gini(rightLabels);
        if (gain > bestGain) { bestGain = gain; bestFeat = feat; bestThresh = t; }
      }
    }
    return { feat: bestFeat, thresh: bestThresh, gain: bestGain };
  }

  _majority(labels) {
    const counts = {};
    for (const l of labels) counts[l] = (counts[l] || 0) + 1;
    return +Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  _buildNode(X, Y, labels, depth, bounds) {
    // bounds: { xMin, xMax, yMin, yMax }
    if (depth >= this.maxDepth || labels.length < this.minSamples || this._gini(labels) === 0) {
      return { leaf: true, label: this._majority(labels), bounds, depth };
    }
    const { feat, thresh, gain } = this._bestSplit(X, Y, labels);
    if (gain <= 0) return { leaf: true, label: this._majority(labels), bounds, depth };

    const leftIdx = [], rightIdx = [];
    const vals = feat === 0 ? X : Y;
    for (let i = 0; i < vals.length; i++) {
      (vals[i] <= thresh ? leftIdx : rightIdx).push(i);
    }

    const lX = leftIdx.map(i => X[i]), lY = leftIdx.map(i => Y[i]), lL = leftIdx.map(i => labels[i]);
    const rX = rightIdx.map(i => X[i]), rY = rightIdx.map(i => Y[i]), rL = rightIdx.map(i => labels[i]);

    const leftBounds  = feat === 0 ? { ...bounds, xMax: thresh } : { ...bounds, yMax: thresh };
    const rightBounds = feat === 0 ? { ...bounds, xMin: thresh } : { ...bounds, yMin: thresh };

    return {
      leaf: false, feat, thresh, depth, bounds,
      label: this._majority(labels),
      left:  this._buildNode(lX, lY, lL, depth + 1, leftBounds),
      right: this._buildNode(rX, rY, rL, depth + 1, rightBounds),
    };
  }

  fit(X, Y, labels, c) {
    const hw = c.width * 0.5, hh = c.height * 0.5;
    const bounds = { xMin: -hw, xMax: hw, yMin: -hh, yMax: hh };
    this.tree = this._buildNode(X, Y, labels, 0, bounds);
    this.fitted = true;
    return { done: true };
  }

  _predictNode(node, x, y) {
    if (node.leaf) return node.label;
    const val = node.feat === 0 ? x : y;
    return val <= node.thresh ? this._predictNode(node.left, x, y) : this._predictNode(node.right, x, y);
  }

  predict(x, y) {
    if (!this.fitted || !this.tree) return 0;
    return this._predictNode(this.tree, x, y);
  }

  isIterative() { return false; }

  reset() { this.tree = null; this.fitted = false; }

  getParams() {
    return [
      { id: 'dt-depth',   label: 'Max Depth',      type: 'range', min: 1, max: 8, step: 1, value: this.maxDepth,    fmt: v => Math.round(v), tooltip: 'Maximum depth of the decision tree. Deeper = more splits = risk of overfitting' },
      { id: 'dt-minleaf', label: 'Min Leaf Samples', type: 'range', min: 1, max: 20, step: 1, value: this.minSamples, fmt: v => Math.round(v), tooltip: 'Minimum samples required to create a split. Higher = simpler tree' },
    ];
  }

  applyParams(params) {
    if (params['dt-depth'])   this.maxDepth    = Math.round(+params['dt-depth']);
    if (params['dt-minleaf']) this.minSamples  = Math.round(+params['dt-minleaf']);
  }

  // Draw transparent colored region for each leaf node
  _drawNode(node, c) {
    const { xMin, xMax, yMin, yMax } = node.bounds;
    const col = (this.k_colors[node.label] || '#6366f1') + '30'; // 30 = ~19% opacity
    const cx0 = c.toCanvasX(xMin), cy0 = c.toCanvasY(yMax);
    const w   = c.toCanvasX(xMax) - cx0;
    const h   = c.toCanvasY(yMin) - cy0;
    c.ctx.fillStyle = col;
    c.ctx.fillRect(cx0, cy0, w, h);

    // Draw split line at this node (thinner than leaf outline)
    if (!node.leaf) {
      c.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      c.ctx.lineWidth = 1;
      c.ctx.beginPath();
      if (node.feat === 0) {
        const sx = c.toCanvasX(node.thresh);
        c.ctx.moveTo(sx, cy0); c.ctx.lineTo(sx, cy0 + h);
      } else {
        const sy = c.toCanvasY(node.thresh);
        c.ctx.moveTo(cx0, sy); c.ctx.lineTo(cx0 + w, sy);
      }
      c.ctx.stroke();
      this._drawNode(node.left, c);
      this._drawNode(node.right, c);
    }
  }

  drawBoundary(c) {
    if (!this.fitted || !this.tree) return;
    c.ctx.save();
    this._drawNode(this.tree, c);
    c.ctx.restore();
  }

  drawPoints(c, X, Y, labels) {
    for (let i = 0; i < X.length; i++) {
      const col = this.k_colors[labels[i]] || '#fff';
      c.circle(X[i], Y[i], 5, col, '#fff', 1.5);
    }
  }
}
