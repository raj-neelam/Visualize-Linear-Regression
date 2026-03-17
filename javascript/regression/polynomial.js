// regression/polynomial.js — Polynomial Regression via gradient descent

export class PolynomialRegression {
  constructor() {
    this.degree = 2;
    this.lr = 0.000001;
    this.maxEpoch = 500;
    this.epoch = 0;
    this.weights = null; // [w0, w1, w2, ...] — coefficients
    this.fitted = false;
    this.lossHistory = [];
  }

  _initWeights() {
    this.weights = Array.from({ length: this.degree + 1 }, () => (Math.random() * 0.1 - 0.05));
  }

  _features(x) {
    // Returns [1, x, x^2, ..., x^degree], normalized by worldScale to prevent explosion
    const scale = 200;
    const xn = x / scale;
    return Array.from({ length: this.degree + 1 }, (_, i) => xn ** i);
  }

  predict(x) {
    if (!this.weights) return 0;
    const f = this._features(x);
    return f.reduce((s, fi, i) => s + fi * this.weights[i], 0);
  }

  fit(X, Y) {
    if (!this.weights) this._initWeights();
    if (this.epoch >= this.maxEpoch) return { done: true };

    const n = X.length;
    const grad = new Array(this.degree + 1).fill(0);
    for (let i = 0; i < n; i++) {
      const f = this._features(X[i]);
      const err = this.predict(X[i]) - Y[i];
      for (let j = 0; j <= this.degree; j++) {
        grad[j] += (2 / n) * err * f[j];
      }
    }
    for (let j = 0; j <= this.degree; j++) {
      this.weights[j] -= this.lr * grad[j];
    }
    this.epoch++;
    this.fitted = true;
    const loss = this._mse(X, Y);
    this.lossHistory.push(loss);
    return { done: this.epoch >= this.maxEpoch, epoch: this.epoch, loss };
  }

  _mse(X, Y) {
    let s = 0;
    for (let i = 0; i < X.length; i++) s += (this.predict(X[i]) - Y[i]) ** 2;
    return s / X.length;
  }

  isIterative() { return true; }

  reset() {
    this.weights = null;
    this.epoch = 0;
    this.fitted = false;
    this.lossHistory = [];
  }

  getParams() {
    return [
      { id: 'poly-degree', label: 'Degree', type: 'range', min: 1, max: 6, step: 1, value: this.degree, fmt: v => Math.round(v), tooltip: 'Polynomial degree. Higher = more curves but risks overfitting', onchange: () => { this.weights = null; } },
      { id: 'poly-lr',     label: 'Learning Rate', type: 'range', min: 0.0000001, max: 0.00001, step: 0.0000001, value: this.lr, fmt: v => v.toExponential(2), tooltip: 'Gradient descent step size for polynomial coefficients' },
      { id: 'poly-epochs', label: 'Max Epochs',    type: 'range', min: 100, max: 2000, step: 50, value: this.maxEpoch, fmt: v => Math.round(v), tooltip: 'Number of full batch gradient descent iterations' },
    ];
  }

  applyParams(params) {
    const newDegree = params['poly-degree'] ? Math.round(+params['poly-degree']) : this.degree;
    if (newDegree !== this.degree) { this.degree = newDegree; this.weights = null; }
    if (params['poly-lr'])     this.lr = +params['poly-lr'];
    if (params['poly-epochs']) this.maxEpoch = +params['poly-epochs'];
  }

  draw(c, color = '#34d399') {
    if (!this.fitted) return;
    const hw = c.width * 0.5;
    const steps = 200;
    const dx = (hw * 2) / steps;
    let prevX = -hw, prevY = this.predict(-hw);
    for (let i = 1; i <= steps; i++) {
      const x = -hw + i * dx;
      const y = this.predict(x);
      c.line(prevX, prevY, x, y, 2.5, color);
      prevX = x; prevY = y;
    }
  }
}
