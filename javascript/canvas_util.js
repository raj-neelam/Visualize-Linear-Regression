// canvas_util.js — Enhanced canvas with grid, axes, zoom/pan, tooltips

export class Canvas {
  constructor(canvasId = 'main-canvas') {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.mouse = [0, 0];
    this.worldMouse = [0, 0];
    this.mouseBtn = -1;

    // Viewport transform
    this.viewScale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this._isPanning = false;
    this._panLast = [0, 0];

    this._resize();
    window.addEventListener('resize', () => this._resize());
    this.canvas.addEventListener('mousemove',   e => this._onMouseMove(e));
    this.canvas.addEventListener('mousedown',   e => this._onMouseDown(e));
    window.addEventListener('mouseup',          e => this._onMouseUp(e));
    this.canvas.addEventListener('wheel',       e => this._onWheel(e), { passive: false });
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  // ── Resize ────────────────────────────────────────────────────
  _resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    this.width  = rect.width;
    this.height = rect.height;
    this.canvas.width  = rect.width  * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ── Events ────────────────────────────────────────────────────
  _onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    this.mouse[0] = cx;
    this.mouse[1] = cy;
    this.worldMouse[0] = this.toWorldX(cx);
    this.worldMouse[1] = this.toWorldY(cy);

    if (this._isPanning) {
      this.panX += cx - this._panLast[0];
      this.panY += cy - this._panLast[1];
      this._panLast = [cx, cy];
    }
  }

  _onMouseDown(e) {
    this.mouseBtn = e.button;
    if (e.button === 2) { // right click → pan
      this._isPanning = true;
      const rect = this.canvas.getBoundingClientRect();
      this._panLast = [e.clientX - rect.left, e.clientY - rect.top];
    }
  }

  _onMouseUp(e) {
    this.mouseBtn = -1;
    this._isPanning = false;
  }

  _onWheel(e) {
    e.preventDefault();
    const rect   = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    // Clamp zoom
    const newScale = Math.max(0.05, Math.min(50, this.viewScale * factor));
    const f = newScale / this.viewScale;
    // Keep the world point under the mouse fixed
    const cx = this.width  * 0.5;
    const cy = this.height * 0.5;
    this.panX = (mx - cx) * (1 - f) + this.panX * f;
    this.panY = (my - cy) * (1 - f) + this.panY * f;
    this.viewScale = newScale;
  }

  resetView() {
    this.viewScale = 1.0;
    this.panX = 0;
    this.panY = 0;
  }

  // ── Coordinate transforms ─────────────────────────────────────
  toCanvasX(wx) { return wx * this.viewScale + this.width  * 0.5 + this.panX; }
  toCanvasY(wy) { return -wy * this.viewScale + this.height * 0.5 + this.panY; }
  toWorldX(cx)  { return (cx - this.width  * 0.5 - this.panX) /  this.viewScale; }
  toWorldY(cy)  { return -(cy - this.height * 0.5 - this.panY) / this.viewScale; }

  // ── Clear / background ────────────────────────────────────────
  clear()            { this.ctx.clearRect(0, 0, this.width, this.height); }
  background(color)  { this.ctx.fillStyle = color; this.ctx.fillRect(0, 0, this.width, this.height); }

  // ── Grid + axes ───────────────────────────────────────────────
  drawGrid() {
    const ctx = this.ctx;
    const { width, height, viewScale } = this;
    const cx = width  * 0.5 + this.panX;
    const cy = height * 0.5 + this.panY;

    const style = getComputedStyle(document.documentElement);
    const gridMinor  = style.getPropertyValue('--grid-minor').trim();
    const gridMajor  = style.getPropertyValue('--grid-major').trim();
    const axisColor  = style.getPropertyValue('--axis-color').trim();
    const originColor= style.getPropertyValue('--origin-color').trim();
    const textColor  = style.getPropertyValue('--text-muted').trim();

    // Compute nice world-space grid step
    const targetPx = 60;
    const worldStep = this._niceNumber(targetPx / viewScale);
    const pxStep    = worldStep * viewScale;
    const majorEvery = 5;

    ctx.save();

    // Minor grid
    ctx.strokeStyle = gridMinor;
    ctx.lineWidth   = 0.5;
    // vertical lines
    const xStart = cx % pxStep - pxStep;
    for (let x = xStart; x < width + pxStep; x += pxStep) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    // horizontal lines
    const yStart = cy % pxStep - pxStep;
    for (let y = yStart; y < height + pxStep; y += pxStep) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Major grid (every majorEvery steps)
    const pxMajor = pxStep * majorEvery;
    ctx.strokeStyle = gridMajor;
    ctx.lineWidth   = 0.8;
    const xMStart = cx % pxMajor - pxMajor;
    for (let x = xMStart; x < width + pxMajor; x += pxMajor) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    const yMStart = cy % pxMajor - pxMajor;
    for (let y = yMStart; y < height + pxMajor; y += pxMajor) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Axis lines
    ctx.strokeStyle = axisColor;
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, height); ctx.stroke();

    // Origin cross
    ctx.strokeStyle = originColor;
    ctx.lineWidth   = 2;
    const oh = 6;
    ctx.beginPath(); ctx.moveTo(cx - oh, cy); ctx.lineTo(cx + oh, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - oh); ctx.lineTo(cx, cy + oh); ctx.stroke();

    // Tick labels
    ctx.fillStyle = textColor;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    for (let x = xMStart; x < width + pxMajor; x += pxMajor) {
      const wx = Math.round((x - cx) / viewScale);
      if (wx === 0) continue;
      ctx.fillText(wx, x, Math.min(Math.max(cy + 14, 14), height - 4));
    }
    ctx.textAlign = 'right';
    for (let y = yMStart; y < height + pxMajor; y += pxMajor) {
      const wy = Math.round((cy - y) / viewScale);
      if (wy === 0) continue;
      ctx.fillText(wy, Math.min(Math.max(cx - 6, 28), width - 4), y + 4);
    }

    // Axis labels
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = axisColor;
    ctx.textAlign = 'left';
    const xLabelX = Math.min(width - 14, cx + width * 0.5 - 14);
    ctx.fillText('x', xLabelX, Math.min(Math.max(cy - 6, 8), height - 8));
    ctx.textAlign = 'center';
    const yLabelY = Math.max(12, cy - height * 0.5 + 12);
    ctx.fillText('y', Math.min(Math.max(cx + 10, 10), width - 4), yLabelY);

    ctx.restore();
  }

  _niceNumber(x) {
    if (x <= 0) return 1;
    const exp = Math.floor(Math.log10(x));
    const f   = x / Math.pow(10, exp);
    let nice = f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10;
    return nice * Math.pow(10, exp);
  }

  // ── Primitives ────────────────────────────────────────────────
  line(x0, y0, x1, y1, weight = 1, color = '#fff') {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = weight;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(this.toCanvasX(x0), this.toCanvasY(y0));
    ctx.lineTo(this.toCanvasX(x1), this.toCanvasY(y1));
    ctx.stroke();
    ctx.restore();
  }

  circle(wx, wy, r, color = '#fff', strokeColor = null, strokeW = 0) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.toCanvasX(wx), this.toCanvasY(wy), r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = strokeW; ctx.stroke(); }
    ctx.restore();
  }

  rectCanvas(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  polygon(points, fillColor, strokeColor = null, strokeW = 1) {
    if (!points || points.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.toCanvasX(points[0][0]), this.toCanvasY(points[0][1]));
    for (let i = 1; i < points.length; i++)
      ctx.lineTo(this.toCanvasX(points[i][0]), this.toCanvasY(points[i][1]));
    ctx.closePath();
    ctx.fillStyle = fillColor; ctx.fill();
    if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = strokeW; ctx.stroke(); }
    ctx.restore();
  }

  text(wx, wy, str, color = '#fff', size = 12, align = 'center') {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.font      = `${size}px Inter, sans-serif`;
    ctx.textAlign = align;
    ctx.fillText(str, this.toCanvasX(wx), this.toCanvasY(wy));
    ctx.restore();
  }

  hitTest(wx, wy, r = 8) {
    const dx = this.mouse[0] - this.toCanvasX(wx);
    const dy = this.mouse[1] - this.toCanvasY(wy);
    return Math.hypot(dx, dy) < r;
  }

  drawBrush(r, color = 'rgba(99,102,241,0.3)') {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.mouse[0], this.mouse[1], r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(99,102,241,0.7)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // Draw decision boundary by sampling pixels
  drawDecisionBoundary(predictFn, colors, step = 8) {
    const ctx = this.ctx;
    for (let cx = 0; cx < this.width; cx += step) {
      for (let cy = 0; cy < this.height; cy += step) {
        const wx = this.toWorldX(cx);
        const wy = this.toWorldY(cy);
        const label = predictFn(wx, wy);
        ctx.fillStyle = (colors[label] || '#6366f1') + '28';
        ctx.fillRect(cx, cy, step, step);
      }
    }
  }
}