// app.js — Main controller: routing, animation loop, UI wiring, metrics

import { Canvas }        from './canvas_util.js';
import { DataGenerator } from './data_generator.js';
import { Metrics }       from './metrics.js';
import { renderNNViz }   from './shared/nn_viz.js';

// Regression
import { OLS }                 from './regression/ols.js';
import { BGD }                 from './regression/bgd.js';
import { SGD }                 from './regression/sgd.js';
import { PolynomialRegression } from './regression/polynomial.js';
import { Ridge }               from './regression/ridge.js';
import { NNRegression }        from './regression/nn_regression.js';

// Classification
import { KNN }                from './classification/knn.js';
import { LogisticRegression } from './classification/logistic.js';
import { DecisionTree }       from './classification/decision_tree.js';
import { NaiveBayes }         from './classification/naive_bayes.js';
import { NNClassification }   from './classification/nn_classification.js';

// Clustering
import { KMeans } from './clustering/kmeans.js';

// Dimensionality reduction
import { PCA } from './dimred/pca.js';

// ── Constants ───────────────────────────────────────────────────
const CLASS_COLORS = ['#22d3ee', '#f472b6', '#34d399', '#fbbf24'];

const ALGO_INFO = {
  ols:          { name: 'OLS Linear Regression',       desc: 'Finds the line that minimises sum of squared residuals using an exact closed-form solution. Instant — no iterations needed.' },
  bgd:          { name: 'Batch Gradient Descent',      desc: 'Iteratively updates slope and intercept by computing gradients over the full dataset each epoch. Smooth convergence.' },
  sgd:          { name: 'Stochastic Gradient Descent', desc: 'Updates parameters using one random sample per step. Noisy but fast, especially for large datasets.' },
  polynomial:   { name: 'Polynomial Regression',       desc: 'Extends linear regression to fit curves of configurable degree. Prone to overfitting at high degrees.' },
  ridge:        { name: 'Ridge Regression (L2)',        desc: 'OLS with an L2 penalty that shrinks large coefficients toward zero, reducing overfitting.' },
  nn_reg:       { name: 'Neural Network Regression',   desc: 'Multi-layer perceptron with ReLU activations trained via backprop on Mean Squared Error.' },
  knn:          { name: 'K-Nearest Neighbours',        desc: 'Classifies each point by majority vote among its k nearest training neighbours. No explicit training phase.' },
  logistic:     { name: 'Logistic Regression',         desc: 'Models class probabilities using a sigmoid function, trained via gradient descent on cross-entropy loss.' },
  decision_tree:{ name: 'Decision Tree (CART)',         desc: 'Recursively partitions feature space using the split that maximally reduces Gini impurity. Coloured regions show each leaf.' },
  naive_bayes:  { name: 'Gaussian Naive Bayes',        desc: 'Assumes feature independence and Gaussian distributions per class. Computes posterior probability with Bayes theorem.' },
  nn_cls:       { name: 'Neural Network Classifier',   desc: 'Multi-layer perceptron with Softmax output trained via backprop on Cross-Entropy loss.' },
  kmeans:       { name: 'K-Means Clustering',          desc: 'Partitions data into k clusters. Iteratively assigns points to nearest centroid, then moves centroids to the mean of assigned points.' },
  pca:          { name: 'Principal Component Analysis',desc: 'Finds the axes of maximum variance (eigenvectors of covariance matrix). PC1 axis and projection lines are drawn.' },
};

// ── State ────────────────────────────────────────────────────────
const state = {
  page: 'regression',      // regression | classification | clustering | dimred
  algo: 'ols',
  dataMode: 'synthetic',   // synthetic | draw
  paused: false,
  running: false,          // iterative training in progress
  animId: null,
  drawClass: 0,            // active class for draw mode
  data: { X: [], Y: [], labels: [] },
  algo_obj: null,
  lossHistory: [],
};

// ── DOM refs ─────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const canvas = new Canvas('main-canvas');

// Navs / tabs
const tabBtns       = document.querySelectorAll('.nav-tab');
const algoListReg   = $('algo-list-regression');
const algoListCls   = $('algo-list-classification');
const algoListClu   = $('algo-list-clustering');
const algoListDim   = $('algo-list-dimred');

// Data source
const btnSynthetic  = $('btn-synthetic');
const btnDraw       = $('btn-draw');
const synthControls = $('synthetic-controls');
const drawControls  = $('draw-controls');
const nPointsSlider = $('n-points');
const nPointsVal    = $('n-points-val');
const noiseSl       = $('noise-level');
const noiseVal      = $('noise-val');
const nClassesSl    = $('n-classes');
const nClassesVal   = $('n-classes-val');
const dataShapeEl   = $('data-shape');
const btnGenerate   = $('btn-generate');
const btnClearDraw  = $('btn-clear-draw');
const classBtns     = document.querySelectorAll('.class-btn');
const brushSl       = $('brush-size');
const brushVal      = $('brush-val');

// Classification/Clustering controls
const ctrlClasses   = $('ctrl-classes');
const ctrlDataShape = $('ctrl-data-shape');
const classSelectorWrap = $('class-selector-wrap');

// Params + run
const hyperContainer = $('hyperparams-container');
const btnRun         = $('btn-run');
const btnStep        = $('btn-step');
const progressWrap   = $('training-progress-wrap');
const progressBar    = $('training-progress');
const epochLabel     = $('epoch-label');

// Navbar actions
const btnPause  = $('btn-pause');
const pauseIcon = $('pause-icon');
const playIcon  = $('play-icon');
const pauseLabel= $('pause-label');
const btnReset  = $('btn-reset');
const btnZoomReset= $('btn-zoom-reset');
const btnTheme  = $('btn-theme');
const iconSun   = $('icon-sun');
const iconMoon  = $('icon-moon');

// Info bar
const infoAlgo   = $('info-algo');
const infoCoords = $('info-coords');
const infoMode   = $('info-mode');

// Right sidebar
const algoInfoName = $('algo-info-name');
const algoInfoDesc = $('algo-info-desc');
const metricsContainer = $('metrics-container');
const confusionSection = $('confusion-section');
const confusionContainer = $('confusion-matrix-container');
const nnVizSection = $('nn-viz-section');
const nnVizCanvas  = $('nn-viz-canvas');
const lossCurveCanvas = $('loss-canvas');
const lossCurrent = $('loss-current');
const lossMin     = $('loss-min');
const lossCurveSection = $('loss-curve-section');

// Tooltip
const tooltipEl = $('tooltip');

// ── Theme toggle ─────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  iconSun.style.display  = isDark  ? 'block' : 'none';
  iconMoon.style.display = !isDark ? 'block' : 'none';
  localStorage.setItem('ml-theme', theme);
}

btnTheme.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'system' ? 'dark' : cur === 'dark' ? 'light' : 'system';
  applyTheme(next);
});
applyTheme(localStorage.getItem('ml-theme') || 'system');

// ── Zoom / Pan reset ──────────────────────────────────────────────
btnZoomReset.addEventListener('click', () => {
  canvas.resetView();
});

// ── Tooltip system ────────────────────────────────────────────────
document.addEventListener('mouseover', e => {
  const target = e.target.closest('[data-tooltip]');
  if (!target) return;
  tooltipEl.textContent = target.getAttribute('data-tooltip');
  tooltipEl.classList.add('visible');
});
document.addEventListener('mousemove', e => {
  tooltipEl.style.left = (e.clientX + 14) + 'px';
  tooltipEl.style.top  = (e.clientY + 14) + 'px';
});
document.addEventListener('mouseout', e => {
  if (!e.target.closest('[data-tooltip]')) tooltipEl.classList.remove('visible');
  tooltipEl.classList.remove('visible');
});

// ── Slider fill ───────────────────────────────────────────────────
function updateSliderFill(slider) {
  const min = +slider.min, max = +slider.max, val = +slider.value;
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.setProperty('--fill', pct + '%');
}
document.querySelectorAll('.slider').forEach(sl => {
  updateSliderFill(sl);
  sl.addEventListener('input', () => updateSliderFill(sl));
});

// ── Page / Tab switching ──────────────────────────────────────────
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    const page = btn.id.replace('tab-', '');
    switchPage(page);
  });
});

function switchPage(page) {
  state.page = page;
  state.running = false;
  state.data = { X: [], Y: [], labels: [] };

  // Show/hide algo lists
  algoListReg.classList.toggle('hidden', page !== 'regression');
  algoListCls.classList.toggle('hidden', page !== 'classification');
  algoListClu.classList.toggle('hidden', page !== 'clustering');
  algoListDim.classList.toggle('hidden', page !== 'dimred');

  // Show/hide classification/clustering controls
  ctrlClasses.classList.toggle('hidden', page !== 'classification' && page !== 'clustering');
  ctrlDataShape.classList.toggle('hidden', page !== 'classification' && page !== 'clustering');
  classSelectorWrap.classList.toggle('hidden', page !== 'classification');

  // Hide confusion matrix for non-classification
  confusionSection.classList.toggle('hidden', page !== 'classification');
  
  // Auto-hide NN viz until an NN is selected
  nnVizSection.classList.add('hidden');

  // Default algorithm
  const defaultAlgo = page === 'regression' ? 'ols'
    : page === 'classification' ? 'knn'
    : page === 'clustering' ? 'kmeans'
    : 'pca';
  const list = page === 'regression' ? algoListReg 
    : page === 'classification' ? algoListCls 
    : page === 'clustering' ? algoListClu : algoListDim;
    
  list.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('active'));
  const first = list.querySelector(`[data-algo="${defaultAlgo}"]`);
  if (first) first.classList.add('active');
  switchAlgo(defaultAlgo);

  generateData();
  canvas.resetView();
}

// ── Algorithm switching ───────────────────────────────────────────
function getAlgoList() {
  return state.page === 'regression' ? algoListReg
    : state.page === 'classification' ? algoListCls
    : state.page === 'clustering' ? algoListClu
    : algoListDim;
}

[algoListReg, algoListCls, algoListClu, algoListDim].forEach(list => {
  list.querySelectorAll('.algo-btn').forEach(b => b.addEventListener('click', onAlgoClick));
});

function onAlgoClick(e) {
  const list = getAlgoList();
  list.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('active'));
  e.currentTarget.classList.add('active');
  switchAlgo(e.currentTarget.dataset.algo);
}

function makeAlgoObject(algo) {
  const map = {
    ols: () => new OLS(),
    bgd: () => new BGD(),
    sgd: () => new SGD(),
    polynomial: () => new PolynomialRegression(),
    ridge: () => new Ridge(),
    nn_reg: () => new NNRegression(),
    knn:  () => new KNN(),
    logistic: () => new LogisticRegression(),
    decision_tree: () => new DecisionTree(),
    naive_bayes: () => new NaiveBayes(),
    nn_cls: () => new NNClassification(),
    kmeans: () => new KMeans(),
    pca: () => new PCA(),
  };
  return (map[algo] || map['ols'])();
}

function switchAlgo(algo) {
  state.algo = algo;
  state.running = false;
  state.lossHistory = [];
  state.algo_obj = makeAlgoObject(algo);
  renderHyperparams();
  updateAlgoInfo();
  renderMetrics();
  progressWrap.classList.add('hidden');

  btnStep.classList.toggle('hidden', !state.algo_obj.isIterative());
  lossCurveSection.classList.toggle('hidden', !state.algo_obj.isIterative());
  nnVizSection.classList.toggle('hidden', !algo.startsWith('nn_'));

  if (!state.algo_obj.isIterative() && state.data.X.length > 0) {
    runAlgorithm();
  }
}

// ── Hyperparameter rendering ──────────────────────────────────────
function renderHyperparams() {
  if (!state.algo_obj) { hyperContainer.innerHTML = ''; return; }
  const params = state.algo_obj.getParams();
  hyperContainer.innerHTML = '';
  for (const p of params) {
    if (p.type === 'info') {
      const div = document.createElement('p');
      div.className = 'hint-text';
      div.textContent = p.label;
      hyperContainer.appendChild(div);
      continue;
    }
    const wrap = document.createElement('div');
    wrap.className = 'control-row param-group';
    const valId = p.id + '-val';
    const fmt   = p.fmt || (v => (+v).toFixed(4));
    wrap.innerHTML = `
      <label class="control-label" for="${p.id}">
        ${p.label}
        ${p.tooltip ? `<span class="info-icon" data-tooltip="${p.tooltip}">?</span>` : ''}
      </label>
      <div class="slider-row">
        <input type="range" id="${p.id}" class="slider param-slider"
          min="${p.min}" max="${p.max}" step="${p.step}" value="${p.value}" data-islive="${p.isLive?'1':'0'}">
        <span class="slider-val" id="${valId}">${fmt(p.value)}</span>
      </div>`;
    const sl = wrap.querySelector('input');
    const vl = wrap.querySelector(`#${valId}`);
    updateSliderFill(sl);
    sl.addEventListener('input', () => {
      vl.textContent = fmt(sl.value);
      updateSliderFill(sl);
      collectAndApplyParams(sl.id);
      
      // If it's a live var or non-iterative algo, trigger immediate re-draw/re-fit
      if (p.isLive) {
        state.algo_obj.fitted = true;
      } else if (!state.algo_obj.isIterative() && state.data.X.length > 0) {
        state.algo_obj.reset();
        runAlgorithm();
      } else if (p.onchange) {
        p.onchange(); // specific reset callbacks (e.g. NN layer change)
      }
    });
    hyperContainer.appendChild(wrap);
  }
}

function collectAndApplyParams(changedId) {
  const params = {};
  hyperContainer.querySelectorAll('.param-slider').forEach(sl => { params[sl.id] = sl.value; });
  state.algo_obj.applyParams(params);
}

// Sync UI sliders with internal state (e.g. when m/b update via gradient descent)
function syncLiveVars() {
  if (!state.algo_obj || !state.algo_obj.getLiveVars) return;
  const vars = state.algo_obj.getLiveVars();
  for (const v of vars) {
    const sl = document.getElementById(v.id);
    const vl = document.getElementById(v.id + '-val');
    if (sl && vl) {
      sl.value = v.value;
      updateSliderFill(sl);
      // lookup format function
      const paramDef = state.algo_obj.getParams().find(p => p.id === v.id);
      if (paramDef) vl.textContent = paramDef.fmt(v.value);
    }
  }
}

// ── Algo info + metrics ───────────────────────────────────────────
function updateAlgoInfo() {
  const info = ALGO_INFO[state.algo] || { name: state.algo, desc: '' };
  infoAlgo.textContent  = `Algorithm: ${info.name}`;
  algoInfoName.textContent = info.name;
  algoInfoDesc.textContent = info.desc;
  infoMode.textContent = `Mode: ${state.dataMode === 'synthetic' ? 'Synthetic' : 'Draw'}`;
}

function renderMetrics() {
  metricsContainer.innerHTML = '';
  if (!state.algo_obj || (!state.algo_obj.fitted && !state.algo_obj.getLiveVars)) {
    metricsContainer.innerHTML = '<p class="hint-text">Run an algorithm to see metrics.</p>';
    confusionContainer.innerHTML = '';
    lossCurrent.textContent = 'Loss: —';
    lossMin.textContent = 'Min: —';
    return;
  }

  const { X, Y, labels } = state.data;

  if (state.page === 'regression' && X.length > 0) {
    const Yhat = X.map(x => state.algo_obj.predict(x));
    const r2   = Metrics.r2(Y, Yhat);
    const rmse = Metrics.rmse(Y, Yhat);
    const mae  = Metrics.mae(Y, Yhat);
    
    // determine p for adjR2
    let p = 1;
    if (state.algo === 'polynomial') p = state.algo_obj.degree || 2;
    if (state.algo === 'nn_reg') p = state.algo_obj.hiddenSize * state.algo_obj.hiddenLayers; // rough estimate
    const adjr2 = Metrics.adjR2(Y, Yhat, p);

    const mets = [
      { label: 'R²',          val: r2.toFixed(4),                            tooltip: 'Coefficient of determination. 1.0 = perfect fit.', cls: r2 > 0.85 ? 'good' : r2 > 0.5 ? 'warn' : 'bad' },
      { label: 'Adj. R²',     val: adjr2 !== null ? adjr2.toFixed(4) : '—',  tooltip: 'R² adjusted for number of predictors.' },
      { label: 'RMSE',        val: rmse.toFixed(2),                           tooltip: 'Root Mean Squared Error — in same units as Y.' },
      { label: 'MAE',         val: mae.toFixed(2),                            tooltip: 'Mean Absolute Error — average residual magnitude.' },
    ];
    if (typeof state.algo_obj.m !== 'undefined') {
      mets.push({ label: 'Slope m', val: state.algo_obj.m.toFixed(4), tooltip: 'Fitted slope coefficient.' });
      mets.push({ label: 'Intercept b', val: state.algo_obj.b.toFixed(2), tooltip: 'Fitted intercept.' });
    }
    renderMetricCards(mets);

  } else if (state.page === 'classification' && X.length > 0) {
    const k     = Math.max(...labels) + 1;
    const preds = X.map((x, i) => state.algo_obj.predict(x, Y[i]));
    const acc   = Metrics.accuracy(labels, preds);
    const { precision, recall, f1 } = Metrics.precisionRecallF1(labels, preds, k);
    const cm    = Metrics.confusionMatrix(labels, preds, k);

    renderMetricCards([
      { label: 'Accuracy',  val: (acc * 100).toFixed(1) + '%', tooltip: 'Fraction of correctly classified samples.', cls: acc > 0.9 ? 'good' : acc > 0.7 ? 'warn' : 'bad' },
      { label: 'Precision', val: precision.toFixed(3),          tooltip: 'Macro-averaged: TP / (TP + FP).' },
      { label: 'Recall',    val: recall.toFixed(3),              tooltip: 'Macro-averaged: TP / (TP + FN).' },
      { label: 'F1 Score',  val: f1.toFixed(3),                  tooltip: 'Harmonic mean of Precision and Recall.' },
      { label: 'Samples',   val: X.length,                       tooltip: 'Total number of data points.' },
    ]);
    renderConfusion(cm, k);

  } else if (state.page === 'clustering' && X.length > 0) {
      if (state.algo_obj.fitted) {
        renderMetricCards([
            { label: 'Inertia (Loss)', val: state.algo_obj.inertia.toFixed(1), tooltip: 'Sum of squared distances of samples to their closest cluster center.', cls: 'good' },
            { label: 'Clusters (k)', val: state.algo_obj.k, tooltip: 'Number of clusters.' },
            { label: 'Iterations', val: state.algo_obj.iter, tooltip: 'Number of EM steps run.' }
        ]);
      }
      
  } else if (state.page === 'dimred' && X.length > 0) {
    const evr = state.algo_obj.explainedVariance();
    renderMetricCards([
      { label: 'PC1 Variance',   val: (evr[0] * 100).toFixed(1) + '%', tooltip: 'Fraction of total variance captured by PC1.', cls: 'good' },
      { label: 'PC2 Variance',   val: (evr[1] * 100).toFixed(1) + '%', tooltip: 'Fraction of total variance captured by PC2.' },
      { label: 'Samples',        val: X.length,                          tooltip: 'Total number of data points.' },
      { label: 'PC1 Direction',  val: `[${state.algo_obj.pc1.map(v => v.toFixed(2)).join(', ')}]`, tooltip: 'Unit vector of the first principal component.' },
    ]);
  }

  // Loss curve
  if (state.algo_obj && state.algo_obj.isIterative() && state.lossHistory.length > 1) {
    Metrics.drawLossCurve(lossCurveCanvas, state.lossHistory);
    lossCurrent.textContent = 'Loss: ' + state.lossHistory.at(-1).toFixed(3);
    lossMin.textContent     = 'Min: '  + Math.min(...state.lossHistory).toFixed(3);
  } else {
      Metrics.drawLossCurve(lossCurveCanvas, []);
      lossCurrent.textContent = 'Loss: —';
      lossMin.textContent     = 'Min: —';
  }
}

function renderMetricCards(mets) {
  metricsContainer.innerHTML = '';
  for (const m of mets) {
    const card = document.createElement('div');
    card.className = 'metric-card';
    card.innerHTML = `
      <span class="metric-label">
        ${m.label}
        ${m.tooltip ? `<span class="info-icon" data-tooltip="${m.tooltip}">?</span>` : ''}
      </span>
      <span class="metric-value ${m.cls || ''}">${m.val}</span>`;
    metricsContainer.appendChild(card);
  }
}

function renderConfusion(cm, k) {
  if (!cm || k < 2) { confusionContainer.innerHTML = ''; return; }
  const labels = k <= 4 ? ['C0','C1','C2','C3'].slice(0, k) : Array.from({length:k},(_,i)=>`C${i}`);
  let html = `<div class="confusion-matrix" style="grid-template-columns: 24px ${labels.map(()=>'1fr').join(' ')}">`;
  html += `<div class="cm-cell header"></div>`;
  for (const l of labels) html += `<div class="cm-cell header" style="color:${CLASS_COLORS[labels.indexOf(l)]}">${l}</div>`;
  for (let r = 0; r < k; r++) {
    html += `<div class="cm-cell header" style="color:${CLASS_COLORS[r]}">${labels[r]}</div>`;
    for (let c = 0; c < k; c++) {
      html += `<div class="cm-cell ${r===c?'diagonal':'off-diag'}" data-tooltip="${cm[r][c]} ${r===c?'correctly':'incorrectly'} classified as ${labels[c]}">${cm[r][c]}</div>`;
    }
  }
  html += '</div>';
  confusionContainer.innerHTML = html;
}

// ── Data generation ───────────────────────────────────────────────
function generateData() {
  const n     = +nPointsSlider.value;
  const noise = +noiseSl.value;
  const hw    = 200, hh = 200; // Base generation size

  if (state.page === 'regression') {
    const d = DataGenerator.linear(n, noise, hw, hh);
    state.data = { X: d.X, Y: d.Y, labels: [] };
  } else if (state.page === 'classification' || state.page === 'clustering') {
    const k     = +nClassesSl.value;
    const shape = dataShapeEl.value;
    let d;
    if (shape === 'moons')        d = DataGenerator.moons(n, noise, hw, hh);
    else if (shape === 'circles') d = DataGenerator.circles(n, noise * 0.5, hw, hh);
    else                          d = DataGenerator.clusters(n, k, noise * 0.7, hw, hh);
    state.data = { X: d.X, Y: d.Y, labels: d.labels };
  } else {
    const d = DataGenerator.scatter2D(n, hw, hh);
    state.data = { X: d.X, Y: d.Y, labels: [] };
  }

  if (state.algo_obj) {
    state.algo_obj.reset();
    state.lossHistory = [];
    if (!state.algo_obj.isIterative() && state.algo !== 'kmeans') runAlgorithm();
  }
  renderMetrics();
}

btnGenerate.addEventListener('click', generateData);

// Slider labels
nPointsSlider.addEventListener('input', () => { nPointsVal.textContent = nPointsSlider.value; updateSliderFill(nPointsSlider); });
noiseSl.addEventListener('input', () => { noiseVal.textContent = noiseSl.value; updateSliderFill(noiseSl); });
nClassesSl.addEventListener('input', () => { nClassesVal.textContent = nClassesSl.value; updateSliderFill(nClassesSl); });
brushSl.addEventListener('input', () => { brushVal.textContent = brushSl.value; updateSliderFill(brushSl); });

// ── Data mode toggle ──────────────────────────────────────────────
btnSynthetic.addEventListener('click', () => {
  state.dataMode = 'synthetic';
  btnSynthetic.classList.add('active');
  btnDraw.classList.remove('active');
  synthControls.classList.remove('hidden');
  drawControls.classList.add('hidden');
  document.getElementById('canvas-wrap').classList.remove('draw-mode');
  infoMode.textContent = 'Mode: Synthetic';
});

btnDraw.addEventListener('click', () => {
  state.dataMode = 'draw';
  btnDraw.classList.add('active');
  btnSynthetic.classList.remove('active');
  drawControls.classList.remove('hidden');
  synthControls.classList.add('hidden');
  document.getElementById('canvas-wrap').classList.add('draw-mode');
  state.data = { X: [], Y: [], labels: [] };
  if (state.algo_obj) state.algo_obj.reset();
  renderMetrics();
  infoMode.textContent = 'Mode: Draw';
});

btnClearDraw.addEventListener('click', () => {
  state.data = { X: [], Y: [], labels: [] };
  if (state.algo_obj) { state.algo_obj.reset(); renderMetrics(); }
});

classBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    classBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.drawClass = +btn.dataset.class;
  });
});

// ── Draw mode canvas click ────────────────────────────────────────
let isDrawing = false;
canvas.canvas.addEventListener('mousedown', e => {
  if (state.dataMode !== 'draw' || e.button !== 0) return; // Only left click for draw
  isDrawing = true;
  addDrawPoint(e);
});
canvas.canvas.addEventListener('mousemove', e => {
  if (!isDrawing || state.dataMode !== 'draw') return;
  addDrawPoint(e);
});
window.addEventListener('mouseup', () => { isDrawing = false; });

function addDrawPoint(e) {
  const brushR = +brushSl.value;
  const wx = canvas.worldMouse[0], wy = canvas.worldMouse[1];
  const count = Math.max(1, Math.floor(brushR / 10));
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * brushR;
    const px = wx + Math.cos(angle) * r / canvas.viewScale;
    const py = wy + Math.sin(angle) * r / canvas.viewScale;
    state.data.X.push(px);
    state.data.Y.push(py);
    state.data.labels.push(state.drawClass);
  }
}

// ── Run / Step ────────────────────────────────────────────────────
btnRun.addEventListener('click', () => {
  if (!state.algo_obj.isIterative()) {
    runAlgorithm();
  } else {
    state.running = !state.running;
    btnRun.innerHTML = state.running
      ? `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause Training`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run Algorithm`;
    if (state.running) runAlgorithm();
  }
});

btnStep.addEventListener('click', () => {
  if (!state.data.X.length) return;
  collectAndApplyParams();
  const result = callFit();
  if (result && result.loss !== undefined) {
    state.lossHistory.push(result.loss);
  }
  syncLiveVars();
  renderMetrics();
  if (result?.done) finishTraining();
});

function runAlgorithm() {
  if (!state.data.X.length) return;
  collectAndApplyParams();
  if (!state.algo_obj.isIterative()) {
    const { X, Y, labels } = state.data;
    if (state.page === 'regression')      state.algo_obj.fit(X, Y);
    else if (state.page === 'classification') state.algo_obj.fit(X, Y, labels);
    else                                   state.algo_obj.fit(X, Y);
    state.running = false;
    renderMetrics();
  } else {
    state.running = true;
    progressWrap.classList.remove('hidden');
  }
}

function callFit() {
  const { X, Y, labels } = state.data;
  if (state.page === 'regression')          return state.algo_obj.fit(X, Y);
  else if (state.page === 'classification') return state.algo_obj.fit(X, Y, labels);
  else                                       return state.algo_obj.fit(X, Y);
}

function finishTraining() {
  state.running = false;
  btnRun.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run Algorithm`;
}

// ── Pause / Reset ─────────────────────────────────────────────────
btnPause.addEventListener('click', () => {
  state.paused = !state.paused;
  pauseIcon.style.display = state.paused ? 'none' : 'block';
  playIcon.style.display  = state.paused ? 'block' : 'none';
  pauseLabel.textContent  = state.paused ? 'Resume' : 'Pause';
});

btnReset.addEventListener('click', () => {
  state.running = false;
  state.lossHistory = [];
  state.data = { X: [], Y: [], labels: [] };
  if (state.algo_obj) state.algo_obj.reset();
  progressWrap.classList.add('hidden');
  btnRun.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run Algorithm`;
  renderMetrics();
  renderHyperparams(); // Reset sliders to default
  if (state.dataMode === 'synthetic') generateData();
});

// ── Error/distance lines (regression) ────────────────────────────
function drawRegressionErrors() {
  const { X, Y } = state.data;
  // don't show errors for NNs because they can be super slow if many points
  if (!state.algo_obj?.fitted || state.algo === 'nn_reg') return;
  for (let i = 0; i < X.length; i++) {
    const yhat = state.algo_obj.predict(X[i]);
    canvas.ctx.save();
    canvas.ctx.strokeStyle = 'rgba(248,113,113,0.4)';
    canvas.ctx.lineWidth = 1;
    canvas.ctx.setLineDash([3, 3]);
    canvas.ctx.beginPath();
    canvas.ctx.moveTo(canvas.toCanvasX(X[i]), canvas.toCanvasY(Y[i]));
    canvas.ctx.lineTo(canvas.toCanvasX(X[i]), canvas.toCanvasY(yhat));
    canvas.ctx.stroke();
    canvas.ctx.restore();
  }
}

// ── Animation loop ────────────────────────────────────────────────
let _frameCount = 0;
function animate() {
  state.animId = requestAnimationFrame(animate);
  if (state.paused) return;

  canvas.clear();

  const bg = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim();
  canvas.background(bg);
  canvas.drawGrid();

  const { X, Y, labels } = state.data;

  // Draw brush
  if (state.dataMode === 'draw' && canvas.mouseBtn === -1) {
    const r = +brushSl.value * canvas.viewScale;
    const col = CLASS_COLORS[state.drawClass] || '#6366f1';
    canvas.drawBrush(r, col + '30');
  }

  // ── Render by page ───────────────────────────────────
  if (state.page === 'regression') {
    canvas.ctx.save();
    for (let i = 0; i < X.length; i++) {
      const isHovered = canvas.hitTest(X[i], Y[i], 6);
      if (isHovered) {
        tooltipEl.textContent = `x: ${X[i].toFixed(1)}, y: ${Y[i].toFixed(1)}`;
        tooltipEl.classList.add('visible');
      }
      canvas.circle(X[i], Y[i], isHovered ? 6 : 4, '#22d3ee', '#ffffff40', 1.5);
    }
    canvas.ctx.restore();

    drawRegressionErrors();

    if (state.algo_obj && (state.algo_obj.fitted || typeof state.algo_obj.m !== 'undefined')) {
      state.algo_obj.draw(canvas);
    }

  } else if (state.page === 'classification') {
    if (state.algo_obj?.fitted && state.algo_obj.drawBoundary) {
      state.algo_obj.drawBoundary(canvas);
    }
    if (state.algo_obj?.fitted && state.algo_obj.drawPoints) {
      state.algo_obj.drawPoints(canvas, X, Y, labels);
    } else {
      for (let i = 0; i < X.length; i++) {
        const col = CLASS_COLORS[labels[i]] || '#fff';
        canvas.circle(X[i], Y[i], 4, col, '#fff', 1.5);
      }
    }
    for (let i = 0; i < X.length; i++) {
      if (canvas.hitTest(X[i], Y[i], 6)) {
        tooltipEl.textContent = `Class ${labels[i]} | x: ${X[i].toFixed(1)}, y: ${Y[i].toFixed(1)}`;
        tooltipEl.classList.add('visible');
        break;
      }
    }

  } else if (state.page === 'clustering') {
    if (state.algo_obj?.fitted) {
      state.algo_obj.drawBoundary(canvas);
      state.algo_obj.drawPoints(canvas, X, Y);
      state.algo_obj.drawCentroids(canvas);
    } else {
      for (let i = 0; i < X.length; i++) {
        canvas.circle(X[i], Y[i], 4, '#cbd5e1', '#fff', 1);
      }
    }

  } else { // dimred
    if (state.algo_obj?.fitted) state.algo_obj.draw(canvas);
    if (state.algo_obj?.drawPoints) state.algo_obj.drawPoints(canvas, X, Y);
    else X.forEach((x, i) => canvas.circle(x, Y[i], 4, '#22d3ee', '#ffffff40', 1));
  }

  // ── Iterative training step ───────────────────────────────────
  if (state.running && state.algo_obj?.isIterative()) {
    // Run multiple steps per frame for smooth speed
    const stepsPerFrame = state.algo === 'nn_reg' || state.algo === 'nn_cls' ? 5 
                        : state.algo === 'kmeans' ? 1 : 10;
    let result;
    for (let s = 0; s < stepsPerFrame; s++) {
      result = callFit();
      if (result?.loss !== undefined) state.lossHistory.push(result.loss);
      if (result?.done) { finishTraining(); break; }
    }
    if (result) {
      const maxEp = state.algo_obj.maxEpoch || state.algo_obj.maxIter || 1;
      const curEp = state.algo_obj.epoch || state.algo_obj.iter || 0;
      const pct = Math.min(100, (curEp / maxEp) * 100);
      progressBar.style.width = pct + '%';
      epochLabel.textContent  = `Iteration ${curEp} / ${maxEp}`;
    }
    syncLiveVars(); // sync m/b sliders dynamically!
  }

  // Render NN viz if present
  if (state.algo_obj?.mlp) {
    const layers = [
      state.page === 'classification' ? 2 : 1, 
      ...Array(state.algo_obj.hiddenLayers).fill(state.algo_obj.hiddenSize), 
      state.page === 'classification' ? state.algo_obj.numClasses : 1
    ];
    renderNNViz(nnVizCanvas, state.algo_obj.mlp, layers);
  }

  // ── HUD / coordinates ─────────────────────────────────────────
  infoCoords.textContent = `x: ${canvas.worldMouse[0].toFixed(1)}, y: ${canvas.worldMouse[1].toFixed(1)}`;

  _frameCount++;
  if (_frameCount % 10 === 0) renderMetrics();
}

// ── Init ──────────────────────────────────────────────────────────
state.algo_obj = makeAlgoObject('ols');
updateAlgoInfo();
renderHyperparams();

setTimeout(() => {
  generateData();
  animate();
}, 50);
