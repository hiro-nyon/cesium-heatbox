(function (global) {
  const CZML_URL = './temporal-flow.czml';
  const START_ISO = '2025-03-01T00:00:00Z';
  const STOP_ISO = '2025-03-02T00:00:00Z';
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const CLUSTERS = [
    { lon: 139.7005, lat: 35.6895, radius: 0.004, bias: 1.0 },
    { lon: 139.7052, lat: 35.6920, radius: 0.0035, bias: 0.8 },
    { lon: 139.6968, lat: 35.6875, radius: 0.003, bias: 0.6 }
  ];

  const SCENARIOS = {
    commute: {
      label: 'Weekday Commute',
      profile: [
        0.25, 0.2, 0.18, 0.25, 0.4, 0.55,
        0.75, 0.95, 0.8, 0.62, 0.5, 0.45,
        0.4, 0.38, 0.42, 0.48, 0.7, 0.95,
        0.85, 0.6, 0.45, 0.35, 0.3, 0.28
      ],
      defaultScope: 'global'
    },
    event: {
      label: 'Event Night Crowd',
      profile: [
        0.2, 0.18, 0.15, 0.18, 0.22, 0.3,
        0.35, 0.4, 0.6, 0.8, 0.9, 1.0,
        0.95, 0.88, 0.82, 0.9, 1.0, 0.92,
        0.75, 0.6, 0.45, 0.35, 0.3, 0.25
      ],
      defaultScope: 'per-time'
    },
    weekend: {
      label: 'Weekend Leisure Flow',
      profile: [
        0.18, 0.17, 0.15, 0.16, 0.2, 0.35,
        0.45, 0.55, 0.65, 0.7, 0.72, 0.74,
        0.76, 0.7, 0.68, 0.7, 0.66, 0.6,
        0.55, 0.5, 0.42, 0.35, 0.28, 0.22
      ],
      defaultScope: 'per-time'
    }
  };

  let czmlPromise = null;

  function ensureCzml(viewer) {
    if (czmlPromise) {
      return czmlPromise;
    }
    const loadPromise = Cesium.CzmlDataSource.load(CZML_URL)
      .then((ds) => {
        if (viewer?.dataSources && ds) {
          viewer.dataSources.add(ds);
        }
        return ds;
      })
      .catch((error) => {
        console.warn(
          '[TemporalHeatboxDemo] CZML の読み込みに失敗しました。共有データセットが無くても疑似データの生成は継続します。',
          error
        );
        return null;
      });
    czmlPromise = loadPromise;
    return loadPromise;
  }

  function seededRandom(seed) {
    let value = seed >>> 0;
    return function () {
      value = (value + 0x6d2b79f5) | 0;
      let t = Math.imul(value ^ value >>> 15, 1 | value);
      t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function generateEntitiesForHour(hour, intensity, scenarioKey) {
    const rng = seededRandom(hour * 97 + scenarioKey.length * 13);
    const entities = [];
    const baseCount = 240 + intensity * 520;

    for (let i = 0; i < baseCount; i++) {
      const cluster = CLUSTERS[i % CLUSTERS.length];
      const jitter = cluster.radius * (0.5 + rng());
      const theta = rng() * Math.PI * 2;
      const lon = cluster.lon + Math.cos(theta) * jitter;
      const lat = cluster.lat + Math.sin(theta) * jitter;
      const alt = 30 + rng() * 220;
      entities.push({
        id: `temporal-${scenarioKey}-${hour}-${i}`,
        position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
        properties: new Cesium.PropertyBag({
          weight: Math.round(30 + intensity * 80 + rng() * 25)
        })
      });
    }
    return entities;
  }

  function buildSlices(scenarioKey = 'commute') {
    const scenario = SCENARIOS[scenarioKey] || SCENARIOS.commute;
    const startJulian = Cesium.JulianDate.fromIso8601(START_ISO);
    const slices = HOURS.map((hour) => {
      const start = Cesium.JulianDate.addHours(startJulian, hour, new Cesium.JulianDate());
      const stop = Cesium.JulianDate.addHours(startJulian, hour + 1, new Cesium.JulianDate());
      const isoStart = Cesium.JulianDate.toIso8601(start);
      const isoStop = Cesium.JulianDate.toIso8601(stop);
      const entities = generateEntitiesForHour(hour, scenario.profile[hour], scenarioKey);
      return {
        start: isoStart,
        stop: isoStop,
        data: entities
      };
    });
    return {
      slices,
      start: START_ISO,
      stop: STOP_ISO,
      label: scenario.label,
      defaultScope: scenario.defaultScope
    };
  }

  async function loadScenario(viewer, scenarioKey = 'commute') {
    await ensureCzml(viewer);
    return buildSlices(scenarioKey);
  }

  global.TemporalHeatboxDemo = {
    loadScenario,
    buildSlices,
    scenarios: SCENARIOS,
    startIso: START_ISO,
    stopIso: STOP_ISO
  };
})(window);
