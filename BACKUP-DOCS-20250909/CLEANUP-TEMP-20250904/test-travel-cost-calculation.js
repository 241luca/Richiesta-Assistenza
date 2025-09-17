// Test per verificare il calcolo dei costi di viaggio con scaglioni chilometrici

interface CostRange {
  fromKm: number;
  toKm: number | null;
  costPerKm: number; // in centesimi
}

interface PricingData {
  baseCost: number;
  freeKm: number;
  costRanges?: CostRange[];
  costPerKm?: number;
}

function calculateTravelCostWithRanges(distanceKm: number, pricingData: PricingData): {
  baseCost: number;
  travelCost: number;
  totalCost: number;
  breakdown: string[];
} {
  const breakdown: string[] = [];
  
  // Costo base chiamata
  const baseCost = pricingData.baseCost || 10;
  breakdown.push(`Costo base chiamata: €${baseCost.toFixed(2)}`);
  
  // Calcola km da fatturare
  const freeKm = pricingData.freeKm || 10;
  const billableKm = Math.max(0, distanceKm - freeKm);
  
  if (distanceKm <= freeKm) {
    breakdown.push(`Distanza ${distanceKm} km: gratuiti (primi ${freeKm} km inclusi)`);
    return {
      baseCost,
      travelCost: 0,
      totalCost: baseCost,
      breakdown
    };
  }
  
  breakdown.push(`Distanza totale: ${distanceKm} km`);
  breakdown.push(`Km gratuiti: ${freeKm} km`);
  breakdown.push(`Km da fatturare: ${billableKm} km`);
  
  let travelCost = 0;
  
  if (pricingData.costRanges && pricingData.costRanges.length > 0) {
    // Calcolo con scaglioni
    let remainingKm = billableKm;
    
    for (const range of pricingData.costRanges) {
      if (remainingKm <= 0) break;
      
      let rangeKm: number;
      if (range.toKm === null || range.toKm === undefined) {
        // Ultimo scaglione
        rangeKm = remainingKm;
      } else {
        // Calcola quanti km in questo scaglione
        const rangeSize = range.toKm - range.fromKm;
        rangeKm = Math.min(remainingKm, rangeSize);
      }
      
      const costPerKm = range.costPerKm / 100; // Converti da centesimi
      const rangeCost = rangeKm * costPerKm;
      travelCost += rangeCost;
      
      const rangeDescription = range.toKm ? `${range.fromKm}-${range.toKm} km` : `oltre ${range.fromKm} km`;
      breakdown.push(`Scaglione ${rangeDescription}: ${rangeKm} km × €${costPerKm.toFixed(2)}/km = €${rangeCost.toFixed(2)}`);
      
      remainingKm -= rangeKm;
    }
  } else {
    // Tariffa semplice
    const costPerKm = pricingData.costPerKm || 0.50;
    travelCost = billableKm * costPerKm;
    breakdown.push(`Trasferta: ${billableKm} km × €${costPerKm.toFixed(2)}/km = €${travelCost.toFixed(2)}`);
  }
  
  const totalCost = baseCost + travelCost;
  breakdown.push(`---------`);
  breakdown.push(`TOTALE: €${totalCost.toFixed(2)}`);
  
  return {
    baseCost,
    travelCost,
    totalCost,
    breakdown
  };
}

// Test con dati esempio
console.log('=== TEST CALCOLO COSTI DI VIAGGIO ===\n');

// Configurazione tariffe con scaglioni
const pricingWithRanges: PricingData = {
  baseCost: 10,
  freeKm: 10,
  costRanges: [
    { fromKm: 0, toKm: 10, costPerKm: 100 },    // €1.00/km
    { fromKm: 10, toKm: 50, costPerKm: 80 },    // €0.80/km
    { fromKm: 50, toKm: null, costPerKm: 60 }   // €0.60/km
  ]
};

// Configurazione tariffa semplice
const pricingSimple: PricingData = {
  baseCost: 10,
  freeKm: 10,
  costPerKm: 0.50
};

// Test varie distanze con scaglioni
const testDistances = [5, 15, 25, 55, 100];

console.log('CALCOLO CON SCAGLIONI CHILOMETRICI:');
console.log('=====================================');
for (const distance of testDistances) {
  console.log(`\nDistanza: ${distance} km`);
  const result = calculateTravelCostWithRanges(distance, pricingWithRanges);
  result.breakdown.forEach(line => console.log(line));
}

console.log('\n\nCALCOLO CON TARIFFA SEMPLICE:');
console.log('================================');
for (const distance of testDistances) {
  console.log(`\nDistanza: ${distance} km`);
  const result = calculateTravelCostWithRanges(distance, pricingSimple);
  result.breakdown.forEach(line => console.log(line));
}

console.log('\n=== TEST COMPLETATO ===');
