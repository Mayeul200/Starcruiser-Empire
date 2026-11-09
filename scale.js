/* ============================================
   SCALE.JS — couche d'unités centralisée
   - Simulation : unités SI (mètres, kg, s), nombres JS en double précision
   - Rendu : 1 unité scène (SU) = M_PER_SU mètres (déduit du rayon terrestre)
   - Ne jamais confondre échelle de rendu et échelle physique.
   ============================================ */
window.SCALE = {
  // 1 unité scène = 6371 km / 2.2 SU = 2 895 909 m
  M_PER_SU: 6371000 / 2.2,
  G: 6.674e-11,

  SHIP: {
    lengthM: 12.5,      // X-Wing T-65 réel
    massKg: 10000,
    thrustN: 30000000,  // ~3000 m/s² (300 g, moteur fusion surpuissant)
    dragAreaM2: 20,
    dragCoef: 0.5,
  },

  toM(su) { return su * this.M_PER_SU; },
  toSU(m) { return m / this.M_PER_SU; },
  shipLengthSU() { return this.SHIP.lengthM / this.M_PER_SU; },
  // mu (unités scène) d'un corps de masse M kg : mu = G·M / M_PER_SU³
  muSU(massKg) { return (this.G * massKg) / Math.pow(this.M_PER_SU, 3); },
  // accélération m/s² -> unités scène/s²
  accelSU(aMss) { return aMss / this.M_PER_SU; },
  // vitesse m/s -> unités scène/s
  velSU(vMss) { return vMss / this.M_PER_SU; },
};
