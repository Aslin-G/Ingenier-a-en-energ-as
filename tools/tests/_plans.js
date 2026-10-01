// Planes de solución de los simuladores (los usan sims.js y overlap.js)
'use strict';
// Pasos de solución: [nombre del mando, valor] o ['wait', segundos]
const PLANS = {
  SIM_SOLAR: [['tilt', 32], ['wait', 1.5], ['tilt', 32], ['wait', 1.5], ['wait', 2.5], ['tilt', 68], ['wait', 1.5], ['wait', 8]],
  SIM_EOLICO: [['yaw', 20], ['wait', 1.5], ['wait', 1.5], ['yaw', -10], ['wait', 2], ['pitch', 85], ['wait', 7.5], ['pitch', 0], ['wait', 6]],
  SIM_HIDRO: [['gate', 30], ['wait', 1.5], ['dam', 45], ['gate', 40], ['wait', 3], ['gate', 25], ['wait', 6]],
  SIM_BIOGAS: [['load', 30], ['wait', 2], ['heat', 37], ['load', 45], ['wait', 6], ['load', 55], ['wait', 7]],
  SIM_GEO: [['ext', 50], ['wait', 1.5], ['inj', 70], ['wait', 13], ['ext', 60], ['inj', 60], ['wait', 14]],
  SIM_H2: [['elec', 80], ['wait', 11], ['elec', 0], ['cell', 30], ['wait', 5], ['cell', 22], ['wait', 7]]
};
module.exports = { PLANS };
