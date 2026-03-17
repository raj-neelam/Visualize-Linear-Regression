// nn_viz.js — Neural network architecture visualizer (renders to a canvas element)

export function renderNNViz(canvasEl, mlp, layerSizes) {
  if (!canvasEl || !mlp) return;
  const ctx  = canvasEl.getContext('2d');
  const W    = canvasEl.width;
  const H    = canvasEl.height;
  const style = getComputedStyle(document.documentElement);
  const bg    = style.getPropertyValue('--bg-card').trim();
  const text  = style.getPropertyValue('--text-muted').trim();
  const textP = style.getPropertyValue('--text-secondary').trim();

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const numLayers = layerSizes.length;
  const padX = 28, padY = 18;
  const layerW = (W - padX * 2) / (numLayers - 1 || 1);

  // Max neurons to display per layer (cap for visual clarity)
  const maxDisplay = 6;

  // Compute node positions
  const positions = layerSizes.map((size, li) => {
    const displayN = Math.min(size, maxDisplay);
    const colX = numLayers === 1 ? W / 2 : padX + li * layerW;
    return Array.from({ length: displayN }, (_, ni) => {
      const colH = H - padY * 2;
      const y    = padY + (displayN === 1 ? colH / 2 : (ni / (displayN - 1)) * colH);
      return { x: colX, y, neuronIdx: ni };
    });
  });

  // Collect all weight values for normalisation
  const allW = mlp.allWeights();
  const allB = mlp.allBiases();
  const maxW = Math.max(1e-6, Math.max(...allW.map(Math.abs)));
  const maxBias = Math.max(1e-6, Math.max(...allB.map(Math.abs)));

  function weightColor(w) {
    const t = (w / maxW) * 0.5 + 0.5; // 0=red, 1=green
    const r = Math.round(255 * (1 - t));
    const g = Math.round(255 * t);
    return `rgb(${r},${g},50)`;
  }

  function biasColor(b) {
    const t = (b / maxBias) * 0.5 + 0.5;
    const r = Math.round(220 * (1 - t));
    const g = Math.round(180 * t);
    return `rgb(${r},${g},80)`;
  }

  // Draw edges (weights)
  for (let li = 0; li < numLayers - 1; li++) {
    const srcNodes = positions[li];
    const dstNodes = positions[li + 1];
    const W_layer  = mlp.W[li]; // [dstSize x srcSize]

    srcNodes.forEach(({ x: x0, y: y0, neuronIdx: si }) => {
      dstNodes.forEach(({ x: x1, y: y1, neuronIdx: di }) => {
        const wVal = (W_layer[di] && W_layer[di][si] !== undefined) ? W_layer[di][si] : 0;
        const alpha = Math.min(0.9, 0.15 + Math.abs(wVal) / maxW * 0.75);
        ctx.save();
        ctx.strokeStyle = weightColor(wVal);
        ctx.globalAlpha = alpha;
        ctx.lineWidth   = 0.8 + Math.abs(wVal) / maxW * 1.5;
        ctx.beginPath();
        ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.restore();
      });
    });
  }

  // Draw nodes
  const nodeR = Math.min(10, Math.max(5, (H / (Math.max(...layerSizes) * 2 + 1))));
  layerSizes.forEach((size, li) => {
    const nodes = positions[li];
    nodes.forEach(({ x, y, neuronIdx: ni }) => {
      const biasVal = (mlp.b[li - 1] && mlp.b[li - 1][ni] !== undefined) ? mlp.b[li - 1][ni] : 0;
      const fillCol = li === 0 ? '#22d3ee' : li === numLayers - 1 ? '#f472b6' : biasColor(biasVal);
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, nodeR, 0, Math.PI * 2);
      ctx.fillStyle   = fillCol;
      ctx.shadowColor = fillCol;
      ctx.shadowBlur  = 6;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth   = 1;
      ctx.stroke();
      ctx.restore();
    });
    // Show "..." if neurons were clipped
    if (size > maxDisplay) {
      const lastNode = nodes[nodes.length - 1];
      ctx.fillStyle = text;
      ctx.font      = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`+${size - maxDisplay}`, lastNode.x, lastNode.y + nodeR + 10);
    }
  });

  // Layer labels
  ['Input', ...Array(numLayers - 2).fill('').map((_, i) => `H${i + 1}`), 'Output'].forEach((label, li) => {
    const colX = numLayers === 1 ? W / 2 : padX + li * layerW;
    ctx.fillStyle = textP;
    ctx.font      = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, colX, H - 4);
    ctx.fillStyle = text;
    ctx.fillText(layerSizes[li], colX, 12);
  });

  // Legend
  const legY = H - 14;
  const grad = ctx.createLinearGradient(padX, 0, padX + 60, 0);
  grad.addColorStop(0, 'rgb(255,0,50)');
  grad.addColorStop(1, 'rgb(0,255,50)');
  ctx.fillStyle = grad;
  ctx.fillRect(padX, legY, 60, 5);
  ctx.fillStyle = text;
  ctx.font = '8px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('−w', padX, legY - 2);
  ctx.textAlign = 'right';
  ctx.fillText('+w', padX + 60, legY - 2);
}
