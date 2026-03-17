// shared/mlp.js — General Multi-Layer Perceptron with backpropagation

export class MLP {
  constructor(layerSizes, outputType = 'linear', lr = 0.01) {
    // layerSizes: [inputDim, hidden1, hidden2, ..., outputDim]
    // outputType: 'linear' (regression) | 'softmax' (classification)
    this.layerSizes = layerSizes;
    this.outputType = outputType;
    this.lr = lr;
    this.W = [];
    this.b = [];
    this._initWeights();
  }

  _initWeights() {
    this.W = [];
    this.b = [];
    for (let l = 0; l < this.layerSizes.length - 1; l++) {
      const fanIn  = this.layerSizes[l];
      const fanOut = this.layerSizes[l + 1];
      // He init for ReLU
      const scale = Math.sqrt(2 / fanIn);
      this.W.push(
        Array.from({ length: fanOut }, () =>
          Array.from({ length: fanIn },  () => (Math.random() * 2 - 1) * scale)
        )
      );
      this.b.push(new Array(fanOut).fill(0));
    }
  }

  // ── Forward pass ──────────────────────────────────────────────
  // Returns { activations: [...], zs: [...] }
  // activations[0] = input, activations[L] = output
  forward(x) {
    const activations = [x.slice()];
    const zs = [];
    let a = x;
    const L = this.W.length;

    for (let l = 0; l < L; l++) {
      const W = this.W[l];
      const b = this.b[l];
      const z = b.map((bi, j) => bi + W[j].reduce((s, w, k) => s + w * a[k], 0));
      zs.push(z);

      const isLast = l === L - 1;
      if (isLast && this.outputType === 'softmax') {
        const maxZ = Math.max(...z);
        const exp  = z.map(zi => Math.exp(zi - maxZ));
        const sum  = exp.reduce((a, b) => a + b, 0);
        a = exp.map(e => e / sum);
      } else if (isLast && this.outputType === 'linear') {
        a = z.slice();
      } else {
        a = z.map(zi => Math.max(0, zi)); // ReLU
      }
      activations.push(a);
    }
    return { activations, zs };
  }

  predict(x) {
    return this.forward(x).activations[this.W.length];
  }

  predictClass(x) {
    const out = this.predict(x);
    return out.indexOf(Math.max(...out));
  }

  // ── Backward pass (single sample) ────────────────────────────
  _backward(x, yTrue) {
    const { activations, zs } = this.forward(x);
    const L = this.W.length;
    const yPred = activations[L];

    // Output delta: dLoss/dZ_last
    // For MSE + linear: delta = yPred - yTrue
    // For CE + softmax: delta = yPred - yTrue (one-hot)
    let delta = yPred.map((p, i) => p - (yTrue[i] || 0));

    const dW = this.W.map(Wi => Wi.map(row => new Array(row.length).fill(0)));
    const db = this.b.map(bi => new Array(bi.length).fill(0));

    for (let l = L - 1; l >= 0; l--) {
      const aPrev = activations[l];

      for (let j = 0; j < delta.length; j++) {
        db[l][j] = delta[j];
        for (let k = 0; k < aPrev.length; k++) {
          dW[l][j][k] = delta[j] * aPrev[k];
        }
      }

      if (l > 0) {
        const zPrev = zs[l - 1];
        const newDelta = new Array(this.W[l][0].length).fill(0);
        for (let k = 0; k < newDelta.length; k++) {
          for (let j = 0; j < delta.length; j++) {
            newDelta[k] += this.W[l][j][k] * delta[j];
          }
          newDelta[k] *= zPrev[k] > 0 ? 1 : 0; // ReLU derivative
        }
        delta = newDelta;
      }
    }
    return { dW, db };
  }

  // ── Batch fit (one epoch = one call = one pass over data) ─────
  fitBatch(X, Y) {
    const n = X.length;
    if (n === 0) return 0;

    const dWSum = this.W.map(Wi => Wi.map(row => new Array(row.length).fill(0)));
    const dbSum = this.b.map(bi => new Array(bi.length).fill(0));
    let totalLoss = 0;

    for (let i = 0; i < n; i++) {
      const { dW, db } = this._backward(X[i], Y[i]);
      for (let l = 0; l < this.W.length; l++) {
        for (let j = 0; j < dWSum[l].length; j++) {
          dbSum[l][j] += db[l][j];
          for (let k = 0; k < dWSum[l][j].length; k++) {
            dWSum[l][j][k] += dW[l][j][k];
          }
        }
      }
      // Accumulate loss
      const yPred = this.predict(X[i]);
      if (this.outputType === 'linear') {
        for (let j = 0; j < Y[i].length; j++) totalLoss += (yPred[j] - Y[i][j]) ** 2;
      } else {
        for (let j = 0; j < Y[i].length; j++) {
          if (Y[i][j] > 0) totalLoss -= Math.log(yPred[j] + 1e-9);
        }
      }
    }

    // Gradient update
    for (let l = 0; l < this.W.length; l++) {
      for (let j = 0; j < this.W[l].length; j++) {
        this.b[l][j] -= this.lr * dbSum[l][j] / n;
        for (let k = 0; k < this.W[l][j].length; k++) {
          this.W[l][j][k] -= this.lr * dWSum[l][j][k] / n;
        }
      }
    }

    return totalLoss / n;
  }

  // ── Utility ───────────────────────────────────────────────────
  // All weights flat
  allWeights() {
    const ws = [];
    for (const Wi of this.W) for (const row of Wi) for (const w of row) ws.push(w);
    return ws;
  }

  allBiases() {
    const bs = [];
    for (const bi of this.b) for (const v of bi) bs.push(v);
    return bs;
  }

  // Reset to fresh random weights
  reset() { this._initWeights(); }
}
