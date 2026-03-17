// metrics.js — Shared statistics / metrics functions

export const Metrics = {

  // ── Regression ─────────────────────────────────────────────
  mse(Y, Yhat) {
    let s = 0;
    for (let i = 0; i < Y.length; i++) s += (Y[i] - Yhat[i]) ** 2;
    return s / Y.length;
  },

  rmse(Y, Yhat) { return Math.sqrt(this.mse(Y, Yhat)); },

  mae(Y, Yhat) {
    let s = 0;
    for (let i = 0; i < Y.length; i++) s += Math.abs(Y[i] - Yhat[i]);
    return s / Y.length;
  },

  r2(Y, Yhat) {
    const mean = Y.reduce((a, b) => a + b, 0) / Y.length;
    let ss_res = 0, ss_tot = 0;
    for (let i = 0; i < Y.length; i++) {
      ss_res += (Y[i] - Yhat[i]) ** 2;
      ss_tot += (Y[i] - mean) ** 2;
    }
    return ss_tot === 0 ? 1 : 1 - ss_res / ss_tot;
  },

  adjR2(Y, Yhat, p = 1) {
    const n = Y.length;
    if (n <= p + 1) return null; // not enough samples
    const r2 = this.r2(Y, Yhat);
    return 1 - (1 - r2) * (n - 1) / (n - p - 1);
  },

  // ── Classification ─────────────────────────────────────────
  confusionMatrix(labels, predictions, k) {
    const cm = Array.from({ length: k }, () => new Array(k).fill(0));
    for (let i = 0; i < labels.length; i++) {
      if (labels[i] < k && predictions[i] < k) {
        cm[labels[i]][predictions[i]]++;
      }
    }
    return cm;
  },

  accuracy(labels, predictions) {
    let correct = 0;
    for (let i = 0; i < labels.length; i++) {
      if (labels[i] === predictions[i]) correct++;
    }
    return labels.length === 0 ? 0 : correct / labels.length;
  },

  // Macro-averaged precision, recall, F1
  precisionRecallF1(labels, predictions, k) {
    let precision = 0, recall = 0, f1 = 0;
    for (let c = 0; c < k; c++) {
      let tp = 0, fp = 0, fn = 0;
      for (let i = 0; i < labels.length; i++) {
        if (predictions[i] === c && labels[i] === c) tp++;
        else if (predictions[i] === c && labels[i] !== c) fp++;
        else if (predictions[i] !== c && labels[i] === c) fn++;
      }
      const p = tp + fp === 0 ? 0 : tp / (tp + fp);
      const r = tp + fn === 0 ? 0 : tp / (tp + fn);
      const f = p + r === 0 ? 0 : 2 * p * r / (p + r);
      precision += p; recall += r; f1 += f;
    }
    return {
      precision: precision / k,
      recall: recall / k,
      f1: f1 / k,
    };
  },

  // ── Loss curve drawing ──────────────────────────────────────
  drawLossCurve(canvas, history, primaryColor = '#6366f1') {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (history.length < 2) return;

    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim();
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    const pad = 8;

    ctx.save();
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < history.length; i++) {
      const x = pad + (i / (history.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (history[i] - min) / range) * (h - pad * 2);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, primaryColor + '40');
    grad.addColorStop(1, primaryColor + '00');
    ctx.lineTo(w - pad, h - pad);
    ctx.lineTo(pad, h - pad);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  },
};
