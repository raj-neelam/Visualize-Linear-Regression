// classification/logistic.js — Binary & multi-class Logistic Regression (OvR via GD)

export class LogisticRegression {
  constructor() {
    this.lr = 0.01;
    this.maxEpoch = 300;
    this.epoch = 0;
    this.k_colors = ['#22d3ee', '#f472b6', '#34d399', '#fbbf24'];
    this.models = []; // one-vs-rest: [ {w:[w0,w1,w2]} ]
    this.numClasses = 2;
    this.fitted = false;
    this.lossHistory = [];
  }

  _sigmoid(z) { return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z)))); }

  _initModels(k) {
    this.numClasses = k;
    this.models = Array.from({ length: k }, () => ({ w: [0, (Math.random()*0.1-0.05), (Math.random()*0.1-0.05)] }));
  }

  fit(X, Y, labels) {
    if (this.models.length === 0) {
      const k = Math.max(...labels) + 1;
      this._initModels(k);
    }
    if (this.epoch >= this.maxEpoch) return { done: true };
    const n = X.length;
    let totalLoss = 0;

    for (let c = 0; c < this.numClasses; c++) {
      const w = this.models[c].w;
      let dw0 = 0, dw1 = 0, dw2 = 0;
      for (let i = 0; i < n; i++) {
        const yi = labels[i] === c ? 1 : 0;
        const z = w[0] + w[1] * X[i] + w[2] * Y[i];
        const p = this._sigmoid(z);
        const err = p - yi;
        dw0 += err; dw1 += err * X[i]; dw2 += err * Y[i];
        totalLoss += yi * Math.log(p + 1e-9) + (1 - yi) * Math.log(1 - p + 1e-9);
      }
      w[0] -= this.lr * dw0 / n;
      w[1] -= this.lr * dw1 / n;
      w[2] -= this.lr * dw2 / n;
    }
    this.epoch++;
    this.fitted = true;
    const loss = -totalLoss / n;
    this.lossHistory.push(loss);
    return { done: this.epoch >= this.maxEpoch, epoch: this.epoch, loss };
  }

  predict(x, y) {
    if (!this.fitted) return 0;
    let best = -Infinity, bestC = 0;
    for (let c = 0; c < this.numClasses; c++) {
      const { w } = this.models[c];
      const score = w[0] + w[1] * x + w[2] * y;
      if (score > best) { best = score; bestC = c; }
    }
    return bestC;
  }

  isIterative() { return true; }

  reset() {
    this.models = [];
    this.epoch = 0;
    this.fitted = false;
    this.lossHistory = [];
  }

  getParams() {
    return [
      { id: 'log-lr',     label: 'Learning Rate', type: 'range', min: 0.001, max: 0.5, step: 0.001, value: this.lr, fmt: v => (+v).toFixed(3), tooltip: 'Gradient descent step size for logistic loss minimisation' },
      { id: 'log-epochs', label: 'Max Epochs',    type: 'range', min: 50, max: 2000, step: 50, value: this.maxEpoch, fmt: v => Math.round(v), tooltip: 'Number of training iterations over all samples' },
    ];
  }

  applyParams(params) {
    if (params['log-lr'])     this.lr = +params['log-lr'];
    if (params['log-epochs']) this.maxEpoch = +params['log-epochs'];
  }

  drawBoundary(c) {
    if (!this.fitted) return;
    const step = 8;
    const ctx = c.ctx;
    const colors = this.k_colors;
    for (let cx = 0; cx < c.width; cx += step) {
      for (let cy = 0; cy < c.height; cy += step) {
        const wx = c.toWorldX(cx);
        const wy = c.toWorldY(cy);
        const label = this.predict(wx, wy);
        ctx.fillStyle = (colors[label] || '#6366f1') + '28';
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
