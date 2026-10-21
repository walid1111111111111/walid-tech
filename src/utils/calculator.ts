import {
  Unit,
  Model,
  ProfileSeries,
  ProfileColor,
  GlassType,
  AccessoryOption,
  TechnicalBOM,
  QuoteItem,
  WorkshopSettings,
  SashConfig,
} from '../types';

export interface CalculationParams {
  model: Model;
  series: ProfileSeries;
  color: ProfileColor;
  glass: GlassType;
  selectedOptions: AccessoryOption[];
  width: number;
  height: number;
  unit: Unit;
  sashes: number;
  sashConfigs?: SashConfig[];
  quantity: number;
  settings: WorkshopSettings;
}

export function convertToCm(value: number, unit: Unit): number {
  return unit === 'mm' ? value / 10 : value;
}

export function convertFromCm(cmValue: number, targetUnit: Unit): number {
  return targetUnit === 'mm' ? cmValue * 10 : cmValue;
}

export function calculateAreaSqm(width: number, height: number, unit: Unit): number {
  const widthCm = convertToCm(width, unit);
  const heightCm = convertToCm(height, unit);
  return Number(((widthCm * heightCm) / 10000).toFixed(3));
}

export function calculateTechnicalBOM(
  params: CalculationParams,
  actualAreaSqm: number
): TechnicalBOM {
  const { model, series, glass, selectedOptions, width, height, unit, sashes, sashConfigs } = params;
  const widthCm = convertToCm(width, unit);
  const heightCm = convertToCm(height, unit);
  const widthM = widthCm / 100;
  const heightM = heightCm / 100;

  // Count active opening sashes vs fixed
  const safeSashConfigs = sashConfigs && sashConfigs.length === sashes
    ? sashConfigs
    : Array.from({ length: sashes }).map((_, i) => ({
        id: i,
        type: (model.openingType === 'tilt_turn' ? 'OB' : model.openingType === 'casement' ? 'OF' : model.openingType === 'sliding' ? 'SLIDE' : 'FIX') as any,
      }));

  const obSashesCount = safeSashConfigs.filter(s => s.type === 'OB').length;
  const ofSashesCount = safeSashConfigs.filter(s => s.type === 'OF').length;
  const operableSashesCount = safeSashConfigs.filter(s => s.type === 'OB' || s.type === 'OF' || s.type === 'SLIDE').length;

  // 1. Frame Profile (2 * (W + H))
  const frameLengthM = Number((2 * (widthM + heightM)).toFixed(2));

  // 2. Sash Profile
  const sashWidthCm = model.openingType === 'sliding'
    ? (widthCm / sashes) + 2.5
    : (widthCm / sashes);
  const sashHeightCm = heightCm - 8; // deducting top/bottom frame profile

  const sashWidthM = Math.max(0.2, sashWidthCm / 100);
  const sashHeightM = Math.max(0.3, sashHeightCm / 100);
  const sashLengthM = Number((2 * (sashWidthM + sashHeightM) * sashes).toFixed(2));

  // 3. Mullion Profile (قائم أوسط)
  const isCasement = model.openingType === 'casement' || model.openingType === 'tilt_turn';
  const mullionLengthM = isCasement && sashes > 1
    ? Number(((sashes - 1) * heightM).toFixed(2))
    : 0;

  // Total Profile Net & Gross
  const totalProfileNetM = Number((frameLengthM + sashLengthM + mullionLengthM).toFixed(2));
  const scrapRate = series.scrapRate || 0.08;
  const totalProfileGrossM = Number((totalProfileNetM * (1 + scrapRate)).toFixed(2));

  // Standard 6m bars
  const standardBar = params.settings.standardBarLengthM || 6.0;
  const barsRequired6m = Math.max(1, Math.ceil(totalProfileGrossM / standardBar));
  const scrapWasteM = Number(((barsRequired6m * standardBar) - totalProfileGrossM).toFixed(2));

  // Reinforcement Steel (inside frame and sash)
  const steelReinforcementM = Number((totalProfileNetM * 0.88).toFixed(2));

  // Glass Area calculation
  const glassDeductionCm = (series.glassDeductionMm || 50) / 10;
  const glassWidthCm = Math.max(15, sashWidthCm - glassDeductionCm);
  const glassHeightCm = Math.max(20, sashHeightCm - glassDeductionCm);
  const singleGlassAreaSqm = (glassWidthCm * glassHeightCm) / 10000;
  const glassAreaSqm = Number((singleGlassAreaSqm * sashes).toFixed(2));

  // Gaskets
  const gasketsLengthM = Number(((frameLengthM + sashLengthM) * 1.8).toFixed(2));

  // Hinges & Hardware
  let hingesCount = 0;
  let rollersCount = 0;
  let locksHandlesCount = operableSashesCount;

  if (model.openingType === 'sliding' || model.openingType === 'door_sliding') {
    rollersCount = sashes * 2;
  } else if (isCasement || model.openingType === 'door_casement') {
    const hingesPerSash = heightCm <= 100 ? 2 : heightCm <= 160 ? 3 : 4;
    hingesCount = (obSashesCount + ofSashesCount) * hingesPerSash;
  }

  // Cost estimates for workshop owner (internal BOM)
  const costPerMeterProfile = 950 * series.costFactor;
  const profileCost = totalProfileGrossM * costPerMeterProfile;
  const steelCost = steelReinforcementM * 280;
  const glassCost = glassAreaSqm * glass.costPerSqm;
  // OB hardware kit costs ~2,400 DZD per sash (compas, crémone, renvoi d'angle)
  const obMechanismCost = obSashesCount * 2400;
  const hardwareCost = (hingesCount * 450) + (rollersCount * 550) + (locksHandlesCount * 1200) + (gasketsLengthM * 65) + obMechanismCost;
  const screwsAndAccessoriesCost = Math.round(1200 + (actualAreaSqm * 400));
  
  const optionsCost = selectedOptions.reduce((acc, opt) => acc + opt.cost, 0);

  const totalMaterialCostDZD = Math.round(
    profileCost + steelCost + glassCost + hardwareCost + screwsAndAccessoriesCost + optionsCost
  );

  return {
    frameLengthM,
    sashLengthM,
    mullionLengthM,
    totalProfileNetM,
    totalProfileGrossM,
    barsRequired6m,
    scrapWasteM,
    steelReinforcementM,
    glassAreaSqm,
    glassCutDimensions: {
      widthCm: Math.round(glassWidthCm),
      heightCm: Math.round(glassHeightCm),
      quantity: sashes,
    },
    gasketsLengthM,
    hingesCount,
    locksHandlesCount,
    rollersCount,
    screwsAndAccessoriesCost,
    totalMaterialCostDZD,
    estimatedProfitDZD: 0,
  };
}

export function calculateQuoteItem(params: CalculationParams): QuoteItem {
  const { model, series, color, glass, selectedOptions, width, height, unit, sashes, sashConfigs, quantity, settings } = params;
  
  const widthCm = convertToCm(width, unit);
  const heightCm = convertToCm(height, unit);
  const actualAreaSqm = calculateAreaSqm(width, height, unit);
  const accountingAreaSqm = Math.max(actualAreaSqm, settings.minBillableAreaSqm || 1.0);

  let basePrice = 0;
  if (model.priceType === 'fixed' && model.fixedPrice) {
    basePrice = model.fixedPrice;
  } else {
    const sqmPriceSum = model.basePriceSqm + series.pricePerSqmExtra + glass.pricePerSqm;
    basePrice = accountingAreaSqm * sqmPriceSum;
  }

  // Color markup
  if (color.priceMarkupPercent > 0) {
    basePrice += (basePrice * color.priceMarkupPercent) / 100;
  }

  // Per-Sash Configuration Additions (e.g. OB hardware kit addition)
  let sashesExtrasTotal = 0;
  if (sashConfigs) {
    sashConfigs.forEach(sash => {
      if (sash.type === 'OB') {
        // OB (Oscillo-Battant) hardware kit adds 3,800 DZD selling price
        sashesExtrasTotal += 3800;
      } else if (sash.type === 'FIX') {
        // Fix sashes save on hardware (-800 DZD)
        sashesExtrasTotal -= 800;
      }
      if (sash.hasMoustiquaire) {
        sashesExtrasTotal += 2800;
      }
    });
  }

  // Options price
  let optionsPriceTotal = 0;
  selectedOptions.forEach((opt) => {
    if (opt.calcType === 'fixed') {
      optionsPriceTotal += opt.price;
    } else if (opt.calcType === 'sqm') {
      optionsPriceTotal += opt.price * accountingAreaSqm;
    } else if (opt.calcType === 'linear_meter') {
      const perimeterM = 2 * ((widthCm + heightCm) / 100);
      optionsPriceTotal += opt.price * perimeterM;
    }
  });

  const unitPriceDZD = Math.max(1000, Math.round(basePrice + sashesExtrasTotal + optionsPriceTotal));
  const itemSubtotalDZD = unitPriceDZD * quantity;

  // Technical BOM
  const technicalBOM = calculateTechnicalBOM(params, actualAreaSqm);
  technicalBOM.estimatedProfitDZD = Math.round(itemSubtotalDZD - (technicalBOM.totalMaterialCostDZD * quantity));

  // Generate a strictly unique ID
  const uniqueId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  return {
    id: uniqueId,
    modelId: model.id,
    modelName: model.name,
    openingType: model.openingType,
    sashes,
    sashConfigs,
    width,
    height,
    unit,
    quantity,
    seriesId: series.id,
    seriesName: series.name,
    colorId: color.id,
    colorName: color.name,
    colorHex: color.hex,
    glassTypeId: glass.id,
    glassTypeName: glass.name,
    selectedOptionIds: selectedOptions.map(o => o.id),
    selectedOptionNames: selectedOptions.map(o => o.name),
    areaSqm: actualAreaSqm,
    accountingAreaSqm,
    unitPriceDZD,
    itemSubtotalDZD,
    technicalBOM,
  };
}

export function formatDZD(amount: number): string {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(Math.round(amount)) + ' دج';
}
