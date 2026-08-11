(function setupPlaygroundDecisionTree(global) {
  'use strict';

  const SURFACE_MODE = {
    boxes: 'solid',
    'outline-only': 'wireframe',
    'outline-inset': 'inset',
    'emulation-only': 'emulation'
  };

  const VIEW_MODE = {
    solid: 'boxes',
    wireframe: 'outline-only',
    inset: 'outline-inset',
    emulation: 'emulation-only'
  };

  function dispatchChange(element) {
    element?.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setUnavailable(element, unavailable) {
    if (!element) return;
    element.disabled = Boolean(unavailable);
    const group = element.closest('.control-group');
    if (!group) return;

    const fields = Array.from(group.querySelectorAll('input, select, button'));
    const allUnavailable = fields.length > 0 && fields.every((field) => field.disabled);
    group.classList.toggle('is-unavailable', allUnavailable);
    const lang = localStorage.getItem('hb_lang') || document.documentElement.lang || 'en';
    group.dataset.unavailableLabel = lang === 'ja' ? 'この経路では選択不可' : 'Unavailable on this path';
  }

  function initialize() {
    const root = document.getElementById('decisionTree');
    if (!root) return;

    const controls = {
      spatialEnabled: document.getElementById('spatialIdEnabled'),
      spatialZoom: document.getElementById('spatialIdZoom'),
      temporalEnabled: document.getElementById('temporalDemo'),
      temporalScope: document.getElementById('temporalClassificationScope'),
      temporalSpeed: document.getElementById('temporalSpeed'),
      classificationScheme: document.getElementById('classificationScheme'),
      classificationClasses: document.getElementById('classificationClasses'),
      classificationPalette: document.getElementById('classificationPalette'),
      classificationOpacity: document.getElementById('classificationOpacity'),
      classificationWidth: document.getElementById('classificationWidth'),
      classificationLegend: document.getElementById('classificationLegend'),
      viewMode: document.getElementById('viewModePreset'),
      autoVoxel: document.getElementById('autoVoxelSize'),
      autoVoxelMode: document.getElementById('autoVoxelSizeMode'),
      gridSize: document.getElementById('gridSize'),
      aggregationEnabled: document.getElementById('aggregationEnabled'),
      aggregationProperty: document.getElementById('aggregationProperty'),
      boxOpacityMode: document.getElementById('boxOpacityMode')
    };

    const groupFor = (controlId) => document.getElementById(controlId)?.closest('.control-group');
    const slotFor = (path) => root.querySelector(`[data-branch-controls="${path}"]`);

    function moveGroups(path, controlIds) {
      const slot = slotFor(path);
      if (!slot) return;
      const groups = [];
      controlIds.forEach((controlId) => {
        const group = groupFor(controlId);
        if (group && !groups.includes(group)) groups.push(group);
      });
      groups.forEach((group) => slot.appendChild(group));
    }

    function placeBranchSettings(state) {
      moveGroups(`grid:${state.grid}`, [
        'aggregationEnabled',
        'autoVoxelSize',
        'autoVoxelSizeMode',
        'gridSize',
        'heightBased',
        'showEmptyVoxels',
        'emptyOpacity'
      ]);

      const surfaceCommon = [
        'outlineMode',
        'outlineWidth',
        'outlineOpacity',
        'voxelGap',
        'adaptiveOutlines',
        'outlineWidthPreset',
        'outlineOpacityMode'
      ];
      const surfaceSpecific = {
        solid: ['boxOpacityMode'],
        wireframe: [],
        inset: ['outlineInset', 'outlineInsetMode', 'enableThickFrames'],
        emulation: ['emulationScope', 'outlineRenderMode']
      };
      moveGroups(`surface:${state.surface}`, (surfaceSpecific[state.surface] || []).concat(surfaceCommon));
    }

    function hideSourceSections() {
      const depot = document.getElementById('decisionControlDepot');
      if (depot) depot.hidden = true;

      document.querySelectorAll('[data-model-source]').forEach((section) => {
        section.hidden = true;
      });

      document.querySelectorAll('.sub-section').forEach((section) => {
        if (!section.querySelector('.control-group')) section.hidden = true;
      });
    }

    moveGroups('grid:spatial', ['spatialIdEnabled']);
    moveGroups('time:timeline', ['temporalDemo', 'temporalSpeed']);
    moveGroups('values:gradient', ['colorMap', 'customColorTheme', 'diverging', 'divergingPivot']);
    moveGroups('values:classes', [
      'classificationScheme',
      'classificationClasses',
      'classificationPalette',
      'classificationOpacity'
    ]);

    [controls.spatialEnabled, controls.temporalEnabled].forEach((toggle) => {
      if (!toggle) return;
      toggle.classList.add('branch-state-toggle');
      toggle.tabIndex = -1;
      toggle.setAttribute('aria-hidden', 'true');
    });

    root.dataset.lastClassification = controls.classificationScheme?.value === 'off'
      ? 'jenks'
      : (controls.classificationScheme?.value || 'jenks');

    function readState() {
      return {
        grid: controls.spatialEnabled?.checked ? 'spatial' : 'metric',
        time: controls.temporalEnabled?.checked ? 'timeline' : 'snapshot',
        values: controls.classificationScheme?.value === 'off' ? 'gradient' : 'classes',
        surface: SURFACE_MODE[controls.viewMode?.value] || 'solid'
      };
    }

    function sync() {
      const state = readState();
      placeBranchSettings(state);
      hideSourceSections();

      root.querySelectorAll('.decision-choice').forEach((button) => {
        const selected = state[button.dataset.decision] === button.dataset.value;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });

      root.querySelectorAll('[data-branch-panel]').forEach((panel) => {
        const [decision, value] = panel.dataset.branchPanel.split(':');
        panel.hidden = state[decision] !== value;
      });

      root.querySelectorAll('[data-decision-node]').forEach((node) => {
        node.classList.add('is-ready');
      });

      const selectedLabels = ['grid', 'time', 'values', 'surface'].map((decision) => {
        return root.querySelector(`.decision-choice[data-decision="${decision}"][aria-pressed="true"] span`)?.textContent?.trim() || '';
      });
      const summary = document.getElementById('decisionPathSummary');
      if (summary) summary.textContent = selectedLabels.join(' · ');
      ['grid', 'time', 'values', 'surface'].forEach((decision, index) => {
        const routeStep = root.querySelector(`[data-route-step="${decision}"]`);
        if (routeStep) routeStep.textContent = selectedLabels[index];
      });

      const spatialManual = state.grid === 'spatial' && controls.spatialZoom?.value !== 'auto';
      const autoVoxel = Boolean(controls.autoVoxel?.checked);
      const classified = state.values === 'classes';
      const fillHidden = state.surface === 'wireframe' || state.surface === 'emulation';

      setUnavailable(controls.spatialZoom, state.grid !== 'spatial');
      setUnavailable(controls.temporalScope, state.time !== 'timeline');
      setUnavailable(controls.temporalSpeed, state.time !== 'timeline');
      setUnavailable(controls.classificationClasses, !classified);
      setUnavailable(controls.classificationPalette, !classified);
      setUnavailable(controls.classificationOpacity, !classified || fillHidden);
      setUnavailable(controls.classificationWidth, !classified);
      setUnavailable(controls.classificationLegend, !classified);
      setUnavailable(controls.autoVoxel, spatialManual);
      setUnavailable(controls.autoVoxelMode, spatialManual || !autoVoxel);
      setUnavailable(controls.gridSize, spatialManual || autoVoxel);
      setUnavailable(controls.aggregationProperty, !controls.aggregationEnabled?.checked);
      setUnavailable(controls.boxOpacityMode, fillHidden);
    }

    function choose(decision, value) {
      if (decision === 'grid' && controls.spatialEnabled) {
        controls.spatialEnabled.checked = value === 'spatial';
        dispatchChange(controls.spatialEnabled);
      } else if (decision === 'time' && controls.temporalEnabled) {
        controls.temporalEnabled.checked = value === 'timeline';
        dispatchChange(controls.temporalEnabled);
      } else if (decision === 'values' && controls.classificationScheme) {
        if (value === 'gradient') {
          if (controls.classificationScheme.value !== 'off') {
            root.dataset.lastClassification = controls.classificationScheme.value;
          }
          controls.classificationScheme.value = 'off';
        } else {
          controls.classificationScheme.value = root.dataset.lastClassification || 'jenks';
        }
        dispatchChange(controls.classificationScheme);
      } else if (decision === 'surface' && controls.viewMode) {
        controls.viewMode.value = VIEW_MODE[value] || 'boxes';
        dispatchChange(controls.viewMode);
      }
      sync();
    }

    root.addEventListener('click', (event) => {
      const button = event.target.closest('.decision-choice');
      if (!button) return;
      choose(button.dataset.decision, button.dataset.value);
    });

    [
      controls.spatialEnabled,
      controls.spatialZoom,
      controls.temporalEnabled,
      controls.classificationScheme,
      controls.viewMode,
      controls.autoVoxel,
      controls.aggregationEnabled,
      document.getElementById('configProfile'),
      document.getElementById('langSelect')
    ].forEach((element) => element?.addEventListener('change', () => global.requestAnimationFrame(sync)));

    sync();
    global.requestAnimationFrame(sync);
  }

  global.addEventListener('DOMContentLoaded', initialize);
}(window));
