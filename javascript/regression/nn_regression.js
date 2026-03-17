// regression/nn_regression.js — Neural Network for 1D regression

import { MLP } from '../shared/mlp.js';

export class NNRegression {
  constructor() {
    this.hiddenLayers = 1;
    this.hiddenSize   = 8;
    this.lr           = 0.005;
    this.maxEpoch     = 500;
    this.epoch        = 0;
    this.mlp          = null;
    this.fitted       = false;
    this.lossHistory  = [];
    // Normalisation stats
    this.xMean = 0; this.xStd = 1;
    this.yMean = 0; this.yStd = 1;
  }

  _buildMLP() {
    const layers = [1, ...Array(this.hiddenLayers).fill(this.hiddenSize), 1];
    this.mlp = new MLP(layers, 'linear', this.lr);
  }

  _normX(x) { return (x - this.xMean) / (this.xStd || 1); }
  _normY(y) { return (y - this.yMean) / (this.yStd || 1); }
  _denormY(yn){ return yn * this.yStd + this.yMean; }

  _computeStats(X, Y) {
    const n = X.length;
    this.xMean = X.reduce((a, b) => a + b, 0) / n;
    this.yMean = Y.reduce((a, b) => a + b, 0) / n;
    this.xStd  = Math.sqrt(X.reduce((a, b) => a + (b - this.xMean) ** 2, 0) / n) || 1;
    this.yStd  = Math.sqrt(Y.reduce((a, b) => a + (b - this.yMean) ** 2, 0) / n) || 1;
  }

  fit(X, Y) {
    if (!this.mlp) {
      this._computeStats(X, Y);
      this._buildMLP();
    }
    if (this.epoch >= this.maxEpoch) return { done: true };

    const Xn = X.map(x => [this._normX(x)]);
    const Yn = Y.map(y => [this._normY(y)]);
    const loss = this.mlp.fitBatch(Xn, Yn);
    this.epoch++;
    this.fitted = true;
    this.lossHistory.push(loss);
    return { done: this.epoch >= this.maxEpoch, epoch: this.epoch, loss };
  }

  predict(x) {
    if (!this.mlp) return 0;
    return this._denormY(this.mlp.predict([this._normX(x)])[0]);
  }

  isIterative() { return true; }

  reset() {
    this.mlp      = null;
    this.epoch    = 0;
    this.fitted   = false;
    this.lossHistory = [];
  }

  getParams() {
    return [
      { id: 'nnr-layers', label: 'Hidden Layers', type: 'range', min: 1, max: 4, step: 1, value: this.hiddenLayers, fmt: v => Math.round(v), tooltip: 'Number of hidden layers in the network', onchange: () => this.reset() },
      { id: 'nnr-size',   label: 'Neurons / Layer', type: 'range', min: 2, max: 32, step: 1, value: this.hiddenSize, fmt: v => Math.round(v), tooltip: 'Number of neurons in each hidden layer', onchange: () => this.reset() },
      { id: 'nnr-lr',     label: 'Learning Rate',   type: 'range', min: 0.0001, max: 0.05, step: 0.0001, value: this.lr, fmt: v => (+v).toFixed(4), tooltip: 'Gradient descent step size for all weights' },
      { id: 'nnr-epochs', label: 'Max Epochs',       type: 'range', min: 100, max: 2000, step: 50, value: this.maxEpoch, fmt: v => Math.round(v), tooltip: 'Total training epochs' },
    ];
  }

  applyParams(params) {
    const newL = params['nnr-layers'] ? Math.round(+params['nnr-layers']) : this.hiddenLayers;
    const newS = params['nnr-size']   ? Math.round(+params['nnr-size'])   : this.hiddenSize;
    if (newL !== this.hiddenLayers || newS !== this.hiddenSize) {
      this.hiddenLayers = newL;
      this.hiddenSize   = newS;
      this.reset();
    }
    if (params['nnr-lr'])     { this.lr = +params['nnr-lr'];       if (this.mlp) this.mlp.lr = this.lr; }
    if (params['nnr-epochs']) this.maxEpoch = +params['nnr-epochs'];
  }

  getLiveVars() { return []; } // NN has no single m/b

  draw(c, color = '#a78bfa') {
    if (!this.fitted || !this.mlp) return;
    const hw = c.width * 0.5 / c.viewScale;
    const steps = 200;
    const dx = (hw * 2) / steps;
    let px = -hw, py = this.predict(-hw);
    for (let i = 1; i <= steps; i++) {
      const x = -hw + i * dx;
      const y = this.predict(x);
      c.line(px, py, x, y, 2.5, color);
      px = x; py = y;
    }
  }
}
