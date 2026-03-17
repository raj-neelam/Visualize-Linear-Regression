// regression/ols.js — Ordinary Least Squares (closed-form), with live m/b display

export class OLS {
  constructor() {
    this.m = 0;
    this.b = 0;
    this.fitted = false;
  }

  fit(X, Y) {
    const n = X.length;
    if (n < 2) return { done: true };
    const xm = X.reduce((a, c) => a + c, 0) / n;
    const ym = Y.reduce((a, c) => a + c, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) { num += (X[i] - xm) * (Y[i] - ym); den += (X[i] - xm) ** 2; }
    this.m = den === 0 ? 0 : num / den;
    this.b = ym - this.m * xm;
    this.fitted = true;
    return { done: true };
  }

  predict(x) { return this.m * x + this.b; }
  isIterative() { return false; }
  reset() { this.m = 0; this.b = 0; this.fitted = false; }

  getParams() {
    return [
      {
        id: 'ols-m', label: 'Slope (m)', type: 'range',
        min: -5, max: 5, step: 0.01, value: this.m, fmt: v => (+v).toFixed(3),
        tooltip: 'After fitting, shows the computed slope. Drag to preview any line.',
        isLive: true,
      },
      {
        id: 'ols-b', label: 'Intercept (b)', type: 'range',
        min: -300, max: 300, step: 1, value: this.b, fmt: v => (+v).toFixed(1),
        tooltip: 'After fitting, shows the computed intercept. Drag to preview.',
        isLive: true,
      },
    ];
  }

  applyParams(params) {
    if (params['ols-m'] !== undefined) { this.m = +params['ols-m']; this.fitted = true; }
    if (params['ols-b'] !== undefined) { this.b = +params['ols-b']; this.fitted = true; }
  }

  getLiveVars() {
    return [
      { id: 'ols-m', value: this.m },
      { id: 'ols-b', value: this.b },
    ];
  }

  draw(c, color = '#6366f1') {
    if (!this.fitted) return;
    const hw = c.width * 0.5 / c.viewScale;
    c.line(-hw, this.predict(-hw), hw, this.predict(hw), 2.5, color);
  }
}
