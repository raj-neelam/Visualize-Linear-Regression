// regression/ridge.js — Ridge Regression (L2) closed-form, with live m/b display

export class Ridge {
  constructor() {
    this.m      = 0;
    this.b      = 0;
    this.lambda = 0.1;
    this.fitted = false;
  }

  fit(X, Y) {
    const n = X.length;
    if (n < 2) return { done: true };
    const xm = X.reduce((a, c) => a + c, 0) / n;
    const ym = Y.reduce((a, c) => a + c, 0) / n;
    let sxx = 0, sxy = 0;
    for (let i = 0; i < n; i++) { sxx += (X[i] - xm) ** 2; sxy += (X[i] - xm) * (Y[i] - ym); }
    // Ridge: m = Sxy / (Sxx + lambda)
    this.m = sxy / (sxx + this.lambda);
    this.b = ym - this.m * xm;
    this.fitted = true;
    return { done: true };
  }

  predict(x) { return this.m * x + this.b; }
  isIterative() { return false; }
  reset() { this.m = 0; this.b = 0; this.fitted = false; }

  getParams() {
    return [
      { id: 'ridge-m',  label: 'Slope (m) ← live',     type: 'range', min: -5,  max: 5,   step: 0.01, value: this.m,      fmt: v => (+v).toFixed(3), tooltip: 'L2 regularization shrinks slope. Shows fitted value.', isLive: true },
      { id: 'ridge-b',  label: 'Intercept (b) ← live', type: 'range', min: -300,max: 300, step: 1,    value: this.b,      fmt: v => (+v).toFixed(1), tooltip: 'Shows fitted intercept.', isLive: true },
      { id: 'ridge-lam',label: 'Lambda (λ)',            type: 'range', min: 0,   max: 100, step: 0.1,  value: this.lambda, fmt: v => (+v).toFixed(1), tooltip: 'Regularization strength. Higher → stronger shrinkage toward zero.' },
    ];
  }

  applyParams(params) {
    if (params['ridge-m']   !== undefined) { this.m = +params['ridge-m']; this.fitted = true; }
    if (params['ridge-b']   !== undefined) { this.b = +params['ridge-b']; this.fitted = true; }
    if (params['ridge-lam'] !== undefined) this.lambda = +params['ridge-lam'];
  }

  getLiveVars() {
    return [
      { id: 'ridge-m', value: this.m },
      { id: 'ridge-b', value: this.b },
    ];
  }

  draw(c, color = '#6366f1') {
    if (!this.fitted) return;
    const hw = c.width * 0.5 / c.viewScale;
    c.line(-hw, this.predict(-hw), hw, this.predict(hw), 2.5, color);
  }
}
