// classification/nn_classification.js — Neural Network classifier

import { MLP } from '../shared/mlp.js';

export class NNClassification {
  constructor() {
    this.hiddenLayers = 1;
    this.hiddenSize   = 8;
    this.lr           = 0.01;
    this.maxEpoch     = 500;
    this.epoch        = 0;
    this.mlp          = null;
    this.numClasses   = 2;
    this.fitted       = false;
    this.lossHistory  = [];
    this.k_colors     = ['#22d3ee', '#f472b6', '#34d399', '#fbbf24'];
    this.scaleX = 1; this.scaleY = 1;
  }

  _buildMLP() {
    const layers = [2, ...Array(this.hiddenLayers).fill(this.hiddenSize), this.numClasses];
    this.mlp = new MLP(layers, 'softmax', this.lr);
  }

  _toOneHot(label) {
    const v = new Array(this.numClasses).fill(0);
    if (label < this.numClasses) v[label] = 1;
    return v;
  }

  fit(X, Y, labels) {
    if (!this.mlp) {
      this.numClasses = Math.max(...labels) + 1;
      this.scaleX = Math.max(...X.map(Math.abs)) || 1;
      this.scaleY = Math.max(...Y.map(Math.abs)) || 1;
      this._buildMLP();
    }
    if (this.epoch >= this.maxEpoch) return { done: true };

    const Xn = X.map((x, i) => [x / this.scaleX, Y[i] / this.scaleY]);
    const Yn = labels.map(l => this._toOneHot(l));
    const loss = this.mlp.fitBatch(Xn, Yn);
    this.epoch++;
    this.fitted = true;
    this.lossHistory.push(loss);
    return { done: this.epoch >= this.maxEpoch, epoch: this.epoch, loss };
  }

  predict(x, y) {
    if (!this.mlp) return 0;
    const out = this.mlp.predict([x / this.scaleX, y / this.scaleY]);
    return out.indexOf(Math.max(...out));
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
      { id: 'nnc-layers', label: 'Hidden Layers',  type: 'range', min: 1, max: 4,  step: 1,      value: this.hiddenLayers, fmt: v => Math.round(v), tooltip: 'Number of hidden layers', onchange: () => this.reset() },
      { id: 'nnc-size',   label: 'Neurons / Layer', type: 'range', min: 2, max: 32, step: 1,      value: this.hiddenSize,   fmt: v => Math.round(v), tooltip: 'Neurons per hidden layer', onchange: () => this.reset() },
      { id: 'nnc-lr',     label: 'Learning Rate',   type: 'range', min: 0.001, max: 0.1, step: 0.001, value: this.lr, fmt: v => (+v).toFixed(3), tooltip: 'SGD step size (all weights)' },
      { id: 'nnc-epochs', label: 'Max Epochs',       type: 'range', min: 100, max: 2000, step: 50, value: this.maxEpoch, fmt: v => Math.round(v), tooltip: 'Training epochs' },
    ];
  }

  applyParams(params) {
    const newL = params['nnc-layers'] ? Math.round(+params['nnc-layers']) : this.hiddenLayers;
    const newS = params['nnc-size']   ? Math.round(+params['nnc-size'])   : this.hiddenSize;
    if (newL !== this.hiddenLayers || newS !== this.hiddenSize) {
      this.hiddenLayers = newL; this.hiddenSize = newS; this.reset();
    }
    if (params['nnc-lr'])     { this.lr = +params['nnc-lr']; if (this.mlp) this.mlp.lr = this.lr; }
    if (params['nnc-epochs']) this.maxEpoch = +params['nnc-epochs'];
  }

  getLiveVars() { return []; }

  drawBoundary(c) {
    if (!this.fitted) return;
    c.drawDecisionBoundary((wx, wy) => this.predict(wx, wy), this.k_colors, 10);
  }

  drawPoints(c, X, Y, labels) {
    for (let i = 0; i < X.length; i++) {
      const col = this.k_colors[labels[i]] || '#fff';
      c.circle(X[i], Y[i], 5, col, '#fff', 1.5);
    }
  }
}
