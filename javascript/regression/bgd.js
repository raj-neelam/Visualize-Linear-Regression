// regression/bgd.js — Batch Gradient Descent (one epoch per fit() call), with live m/b

export class BGD {
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
    let dm = 0, db = 0, loss = 0;
    for (let i = 0; i < n; i++) {
      const err = (this.m * X[i] + this.b) - Y[i];
      dm += err * X[i]; db += err; loss += err ** 2;
    }
    this.m -= this.lr * dm / n;
    this.b -= this.lr * db / n;
    this.epoch++;
    this.fitted = true;
    const mse = loss / n;
    this.lossHistory.push(mse);
    return { done: this.epoch >= this.maxEpoch, epoch: this.epoch, loss: mse, m: this.m, b: this.b };
  }

  predict(x) { return this.m * x + this.b; }
  isIterative() { return true; }

  reset() {
    this.m = 0; this.b = 0;
    this.epoch = 0; this.fitted = false; this.lossHistory = [];
  }

  getParams() {
    return [
      { id: 'bgd-m',   label: 'Slope (m) ← live',     type: 'range', min: -5,    max: 5,    step: 0.01,   value: this.m,        fmt: v => (+v).toFixed(3), tooltip: 'Drag to set initial slope. Animates to optimal during training.', isLive: true },
      { id: 'bgd-b',   label: 'Intercept (b) ← live', type: 'range', min: -300,  max: 300,  step: 1,      value: this.b,        fmt: v => (+v).toFixed(1), tooltip: 'Drag to set initial intercept. Animates to optimal during training.', isLive: true },
      { id: 'bgd-lr',  label: 'Learning Rate',         type: 'range', min: 0.00001, max: 0.01, step: 0.00001, value: this.lr,  fmt: v => (+v).toFixed(5), tooltip: 'Gradient descent step size per epoch.' },
      { id: 'bgd-ep',  label: 'Max Epochs',            type: 'range', min: 50,    max: 2000, step: 50,     value: this.maxEpoch, fmt: v => Math.round(v),   tooltip: 'Number of full-dataset passes to run.' },
    ];
  }

  applyParams(params) {
    // Live m/b — allow user to drag and set initial position
    if (params['bgd-m'] !== undefined) { this.m = +params['bgd-m']; this.fitted = this.fitted; }
    if (params['bgd-b'] !== undefined) { this.b = +params['bgd-b']; this.fitted = this.fitted; }
    if (params['bgd-lr'] !== undefined) this.lr = +params['bgd-lr'];
    if (params['bgd-ep'] !== undefined) this.maxEpoch = +params['bgd-ep'];
  }

  getLiveVars() {
    return [
      { id: 'bgd-m', value: this.m },
      { id: 'bgd-b', value: this.b },
    ];
  }

  draw(c, color = '#6366f1') {
    if (!this.fitted) return;
    const hw = c.width * 0.5 / c.viewScale;
    c.line(-hw, this.predict(-hw), hw, this.predict(hw), 2.5, color);
  }
}
