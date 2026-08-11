(function setupPlaygroundDecisionTree(global) {
  'use strict';

  function dispatchChange(element) {
    element?.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setUnavailable(element, unavailable) {
    if (!element) return;
    element.disabled = Boolean(unavailable);
    const group = element.closest('.control-group');
    if (group) {
      group.classList.toggle('is-unavailable', Boolean(unavailable));
      const lang = localStorage.getItem('hb_lang') || document.documentElement.lang || 'en';
      group.dataset.unavailableLabel = lang === 'ja' ? 'この分岐では選択不可' : 'Unavailable on this path';
    }
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

    root.dataset.lastClassification = controls.classificationScheme?.value === 'off'
      ? 'jenks'
      : (controls.classificationScheme?.value || 'jenks');

    function readState() {
      return {
        grid: controls.spatialEnabled?.checked ? 'spatial' : 'metric',
        time: controls.temporalEnabled?.checked ? 'timeline' : 'snapshot',
        values: controls.classificationScheme?.value === 'off' ? 'gradient' : 'classes',
        surface: controls.viewMode?.value === 'outline-only' ? 'wireframe' : 'solid'
      };
    }

    function sync() {
      const state = readState();
      root.querySelectorAll('.decision-choice').forEach((button) => {
        const selected = state[button.dataset.decision] === button.dataset.value;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      root.querySelectorAll('[data-decision-note]').forEach((note) => {
        const [decision, value] = note.dataset.decisionNote.split(':');
        note.hidden = state[decision] !== value;
      });

      const selectedLabels = ['grid', 'time', 'values', 'surface'].map((decision) => {
        return root.querySelector(`.decision-choice[data-decision="${decision}"][aria-pressed="true"] span`)?.textContent?.trim() || '';
      });
      const summary = document.getElementById('decisionPathSummary');
      if (summary) summary.textContent = selectedLabels.join(' · ');

      const spatialManual = state.grid === 'spatial' && controls.spatialZoom?.value !== 'auto';
      const autoVoxel = Boolean(controls.autoVoxel?.checked);
      const classified = state.values === 'classes';
      const wireframe = state.surface === 'wireframe';

      setUnavailable(controls.spatialZoom, state.grid !== 'spatial');
      setUnavailable(controls.temporalScope, state.time !== 'timeline');
      setUnavailable(controls.temporalSpeed, state.time !== 'timeline');
      setUnavailable(controls.classificationClasses, !classified);
      setUnavailable(controls.classificationPalette, !classified);
      setUnavailable(controls.classificationOpacity, !classified || wireframe);
      setUnavailable(controls.classificationWidth, !classified);
      setUnavailable(controls.classificationLegend, !classified);
      setUnavailable(controls.autoVoxel, spatialManual);
      setUnavailable(controls.autoVoxelMode, spatialManual || !autoVoxel);
      setUnavailable(controls.gridSize, spatialManual || autoVoxel);
      setUnavailable(controls.aggregationProperty, !controls.aggregationEnabled?.checked);
      setUnavailable(controls.boxOpacityMode, wireframe);
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
        controls.viewMode.value = value === 'wireframe' ? 'outline-only' : 'boxes';
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
