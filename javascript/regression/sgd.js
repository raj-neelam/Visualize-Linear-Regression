// regression/sgd.js — Stochastic Gradient Descent with live m/b sliders

export class SGD {
  constructor() {
    this.m       = 0;
    this.b       = 0;
    this.lr      = 0.0001;
    this.maxEpoch= 300;
    this.epoch   = 0;
    this.fitted  = false;
    this.lossHistory = [];
  }

  fit(X, Y) {
    const n = X.length;
    if (n === 0 || this.epoch >= this.maxEpoch) return { done: true };
    // Shuffle indices
    const idx = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    let epochLoss = 0;
    for (const i of idx) {
      const err = (this.m * X[i] + this.b) - Y[i];
      this.m -= this.lr * err * X[i];
      this.b -= this.lr * err;
      epochLoss += err ** 2;
    }
    this.epoch++;
    this.fitted = true;
    const mse = epochLoss / n;
    this.lossHistory.push(mse);
    return { done: this.epoch >= this.maxEpoch, epoch: this.epoch, loss: mse };
  }

  predict(x) { return this.m * x + this.b; }
  isIterative() { return true; }

  reset() {
    this.m = 0; this.b = 0;
    this.epoch = 0; this.fitted = false; this.lossHistory = [];
  }

  getParams() {
    return [
      { id: 'sgd-m',  label: 'Slope (m) ← live',     type: 'range', min: -5,     max: 5,    step: 0.01,   value: this.m,        fmt: v => (+v).toFixed(3), tooltip: 'Set starting slope; animates to optimal.', isLive: true },
      { id: 'sgd-b',  label: 'Intercept (b) ← live', type: 'range', min: -300,   max: 300,  step: 1,      value: this.b,        fmt: v => (+v).toFixed(1), tooltip: 'Set starting intercept; animates to optimal.', isLive: true },
      { id: 'sgd-lr', label: 'Learning Rate',         type: 'range', min: 0.00001,max: 0.01, step: 0.00001,value: this.lr,        fmt: v => (+v).toFixed(5), tooltip: 'Step size for each single sample update.' },
      { id: 'sgd-ep', label: 'Max Epochs',            type: 'range', min: 50,     max: 2000, step: 50,     value: this.maxEpoch, fmt: v => Math.round(v),   tooltip: 'Number of passes over the entire dataset.' },
    ];
  }

  applyParams(params) {
    if (params['sgd-m']  !== undefined) this.m = +params['sgd-m'];
    if (params['sgd-b']  !== undefined) this.b = +params['sgd-b'];
    if (params['sgd-lr'] !== undefined) this.lr = +params['sgd-lr'];
    if (params['sgd-ep'] !== undefined) this.maxEpoch = +params['sgd-ep'];
  }

  getLiveVars() {
    return [
      { id: 'sgd-m', value: this.m },
      { id: 'sgd-b', value: this.b },
    ];
  }

  draw(c, color = '#6366f1') {
    if (!this.fitted) return;
    const hw = c.width * 0.5 / c.viewScale;
    c.line(-hw, this.predict(-hw), hw, this.predict(hw), 2.5, color);
  }
}
