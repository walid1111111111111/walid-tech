import { QuoteItem, Unit } from '../types';

export interface CutPiece {
  id: string;
  itemId: string;
  itemIndex: number;
  windowModel: string;
  label: string; // e.g. "Dormant Haut / عرض الحلق", "Ouvrant Droit / ضلفة يمنى"
  profileType: 'frame' | 'sash' | 'mullion' | 'bead' | 'steel';
  profileTypeName: string;
  lengthMm: number;
  cutAngleLeft: number; // 45 or 90 degrees
  cutAngleRight: number; // 45 or 90 degrees
  quantity: number;
  colorName?: string;
}

export interface OptimizedBar {
  barIndex: number;
  stockLengthMm: number;
  pieces: (CutPiece & { pieceInstanceIndex: number })[];
  usedLengthMm: number;
  kerfLossMm: number;
  wasteMm: number;
  wastePercent: number;
  isReusableDrop: boolean;
}

export interface OptimizationResult {
  profileType: 'frame' | 'sash' | 'mullion' | 'bead' | 'steel';
  profileTypeName: string;
  totalPieces: number;
  totalLengthM: number;
  barsCount: number;
  bars: OptimizedBar[];
  totalWasteM: number;
  efficiencyPercent: number;
  reusableDropsM: number;
  scrapLossM: number;
}

export interface ProjectOptimizationReport {
  timestamp: string;
  projectName: string;
  stockBarLengthMm: number;
  kerfMm: number;
  categories: {
    frame: OptimizationResult;
    sash: OptimizationResult;
    mullion?: OptimizationResult;
    beads?: OptimizationResult;
    steel?: OptimizationResult;
  };
  summary: {
    totalBars6m: number;
    totalLinearMeters: number;
    overallEfficiencyPercent: number;
    totalReusableDropsCount: number;
    totalScrapLossM: number;
  };
}

/**
 * Extracts all cut pieces from project items
 */
export function extractProjectCutPieces(items: QuoteItem[]): CutPiece[] {
  const pieces: CutPiece[] = [];

  items.forEach((item, itemIdx) => {
    const qty = item.quantity || 1;
    const wMm = Math.round(item.unit === 'mm' ? item.width : item.width * 10);
    const hMm = Math.round(item.unit === 'mm' ? item.height : item.height * 10);
    const sashes = Math.max(1, item.sashes || 1);
    const isSliding = item.openingType === 'sliding' || item.openingType === 'door_sliding';

    // 1. Frame Profile (Châssis Dormant)
    // 2 horizontal pieces (Top & Bottom)
    pieces.push({
      id: `${item.id}-fr-top`,
      itemId: item.id,
      itemIndex: itemIdx + 1,
      windowModel: item.modelName,
      label: `حلق أفقي (أعلى/أسفل)`,
      profileType: 'frame',
      profileTypeName: 'بروفيل الإطار / الحلق (Dormant)',
      lengthMm: wMm,
      cutAngleLeft: 45,
      cutAngleRight: 45,
      quantity: 2 * qty,
      colorName: item.colorName,
    });

    // 2 vertical pieces (Left & Right)
    pieces.push({
      id: `${item.id}-fr-side`,
      itemId: item.id,
      itemIndex: itemIdx + 1,
      windowModel: item.modelName,
      label: `حلق عمودي (يمين/يسار)`,
      profileType: 'frame',
      profileTypeName: 'بروفيل الإطار / الحلق (Dormant)',
      lengthMm: hMm,
      cutAngleLeft: 45,
      cutAngleRight: 45,
      quantity: 2 * qty,
      colorName: item.colorName,
    });

    // 2. Sash Profile (Châssis Ouvrant)
    // Sash dimensions
    const sashWMm = isSliding
      ? Math.round((wMm / sashes) + 25) // 25mm sliding overlap
      : Math.round(wMm / sashes);
    const sashHMm = Math.max(250, hMm - 80); // profile deduction for sash

    // For each sash, 2 width pieces & 2 height pieces
    pieces.push({
      id: `${item.id}-sash-w`,
      itemId: item.id,
      itemIndex: itemIdx + 1,
      windowModel: item.modelName,
      label: `ضلفة عرضية (أعلى/أسفل)`,
      profileType: 'sash',
      profileTypeName: 'بروفيل الضلفة (Ouvrant)',
      lengthMm: sashWMm,
      cutAngleLeft: 45,
      cutAngleRight: 45,
      quantity: 2 * sashes * qty,
      colorName: item.colorName,
    });

    pieces.push({
      id: `${item.id}-sash-h`,
      itemId: item.id,
      itemIndex: itemIdx + 1,
      windowModel: item.modelName,
      label: `ضلفة طولية (يمين/يسار)`,
      profileType: 'sash',
      profileTypeName: 'بروفيل الضلفة (Ouvrant)',
      lengthMm: sashHMm,
      cutAngleLeft: 45,
      cutAngleRight: 45,
      quantity: 2 * sashes * qty,
      colorName: item.colorName,
    });

    // 3. Mullion Profile (Meneau)
    const isCasement = item.openingType === 'casement' || item.openingType === 'tilt_turn';
    if (isCasement && sashes > 1) {
      pieces.push({
        id: `${item.id}-mullion`,
        itemId: item.id,
        itemIndex: itemIdx + 1,
        windowModel: item.modelName,
        label: `قائم أوسط (Meneau)`,
        profileType: 'mullion',
        profileTypeName: 'بروفيل القائم الأوسط (Meneau)',
        lengthMm: hMm - 60,
        cutAngleLeft: 90,
        cutAngleRight: 90,
        quantity: (sashes - 1) * qty,
        colorName: item.colorName,
      });
    }

    // 4. Glazing Beads (Parcloses)
    // Matches glass cut dimensions
    const glassWMm = Math.max(120, sashWMm - 100);
    const glassHMm = Math.max(150, sashHMm - 100);

    pieces.push({
      id: `${item.id}-bead-w`,
      itemId: item.id,
      itemIndex: itemIdx + 1,
      windowModel: item.modelName,
      label: `باركلوز عرضي (Parclose L)`,
      profileType: 'bead',
      profileTypeName: 'بروفيل حابس الزجاج (Parclose)',
      lengthMm: glassWMm,
      cutAngleLeft: 45,
      cutAngleRight: 45,
      quantity: 2 * sashes * qty,
      colorName: item.colorName,
    });

    pieces.push({
      id: `${item.id}-bead-h`,
      itemId: item.id,
      itemIndex: itemIdx + 1,
      windowModel: item.modelName,
      label: `باركلوز طولي (Parclose H)`,
      profileType: 'bead',
      profileTypeName: 'بروفيل حابس الزجاج (Parclose)',
      lengthMm: glassHMm,
      cutAngleLeft: 45,
      cutAngleRight: 45,
      quantity: 2 * sashes * qty,
      colorName: item.colorName,
    });

    // 5. Reinforcement Steel (Renfort Acier Galvanisé)
    pieces.push({
      id: `${item.id}-steel-w`,
      itemId: item.id,
      itemIndex: itemIdx + 1,
      windowModel: item.modelName,
      label: `حديد تقوية أفقي`,
      profileType: 'steel',
      profileTypeName: 'حديد التقوية المجلفن (Renfort Acier)',
      lengthMm: Math.max(100, wMm - 100),
      cutAngleLeft: 90,
      cutAngleRight: 90,
      quantity: 2 * qty,
    });

    pieces.push({
      id: `${item.id}-steel-h`,
      itemId: item.id,
      itemIndex: itemIdx + 1,
      windowModel: item.modelName,
      label: `حديد تقوية عمودي`,
      profileType: 'steel',
      profileTypeName: 'حديد التقوية المجلفن (Renfort Acier)',
      lengthMm: Math.max(100, hMm - 100),
      cutAngleLeft: 90,
      cutAngleRight: 90,
      quantity: 2 * qty,
    });
  });

  return pieces;
}

/**
 * 1D Cutting Stock Optimization Engine
 * Runs Best-Fit Decreasing (BFD) algorithm taking saw blade thickness (kerf) into account
 */
export function optimizePiecesForBar(
  pieces: CutPiece[],
  profileType: 'frame' | 'sash' | 'mullion' | 'bead' | 'steel',
  profileTypeName: string,
  stockLengthMm: number = 6000,
  kerfMm: number = 3.5,
  reusableThresholdMm: number = 1000
): OptimizationResult {
  // Expand pieces by quantity
  const individualPieces: (CutPiece & { pieceInstanceIndex: number })[] = [];
  let globalInstance = 1;

  pieces
    .filter((p) => p.profileType === profileType)
    .forEach((p) => {
      for (let q = 0; q < p.quantity; q++) {
        individualPieces.push({
          ...p,
          pieceInstanceIndex: globalInstance++,
        });
      }
    });

  // Sort descending by length for optimal packing
  individualPieces.sort((a, b) => b.lengthMm - a.lengthMm);

  const bars: {
    pieces: (CutPiece & { pieceInstanceIndex: number })[];
    remainingLength: number;
    kerfLoss: number;
  }[] = [];

  // Best-Fit Decreasing Placement
  individualPieces.forEach((piece) => {
    let bestBarIndex = -1;
    let minRemainingSpaceAfterPlacement = Infinity;

    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i];
      const spaceNeeded = bar.pieces.length === 0 ? piece.lengthMm : piece.lengthMm + kerfMm;

      if (bar.remainingLength >= spaceNeeded) {
        const spaceLeft = bar.remainingLength - spaceNeeded;
        if (spaceLeft < minRemainingSpaceAfterPlacement) {
          minRemainingSpaceAfterPlacement = spaceLeft;
          bestBarIndex = i;
        }
      }
    }

    if (bestBarIndex !== -1) {
      // Place in existing best bar
      const bar = bars[bestBarIndex];
      const addedKerf = bar.pieces.length > 0 ? kerfMm : 0;
      bar.pieces.push(piece);
      bar.remainingLength -= (piece.lengthMm + addedKerf);
      bar.kerfLoss += addedKerf;
    } else {
      // Open a fresh new 6.00m bar
      bars.push({
        pieces: [piece],
        remainingLength: stockLengthMm - piece.lengthMm,
        kerfLoss: 0,
      });
    }
  });

  // Format finalized optimized bars
  const formattedBars: OptimizedBar[] = bars.map((b, idx) => {
    const usedLengthMm = b.pieces.reduce((sum, p) => sum + p.lengthMm, 0);
    const wasteMm = Math.max(0, b.remainingLength);
    const wastePercent = Number(((wasteMm / stockLengthMm) * 100).toFixed(1));
    const isReusableDrop = wasteMm >= reusableThresholdMm;

    return {
      barIndex: idx + 1,
      stockLengthMm,
      pieces: b.pieces,
      usedLengthMm,
      kerfLossMm: b.kerfLoss,
      wasteMm,
      wastePercent,
      isReusableDrop,
    };
  });

  const totalPieces = individualPieces.length;
  const totalLengthMm = individualPieces.reduce((acc, p) => acc + p.lengthMm, 0);
  const totalLengthM = Number((totalLengthMm / 1000).toFixed(2));
  const barsCount = formattedBars.length;
  const totalStockProvidedMm = barsCount * stockLengthMm;
  const totalWasteMm = formattedBars.reduce((acc, b) => acc + b.wasteMm, 0);
  const totalWasteM = Number((totalWasteMm / 1000).toFixed(2));

  const reusableDropsMm = formattedBars
    .filter((b) => b.isReusableDrop)
    .reduce((acc, b) => acc + b.wasteMm, 0);
  const reusableDropsM = Number((reusableDropsMm / 1000).toFixed(2));

  const scrapLossMm = formattedBars
    .filter((b) => !b.isReusableDrop)
    .reduce((acc, b) => acc + b.wasteMm, 0);
  const scrapLossM = Number((scrapLossMm / 1000).toFixed(2));

  const efficiencyPercent = totalStockProvidedMm > 0
    ? Number((((totalStockProvidedMm - scrapLossMm) / totalStockProvidedMm) * 100).toFixed(1))
    : 100;

  return {
    profileType,
    profileTypeName,
    totalPieces,
    totalLengthM,
    barsCount,
    bars: formattedBars,
    totalWasteM,
    efficiencyPercent,
    reusableDropsM,
    scrapLossM,
  };
}

/**
 * Generates the full cutting optimization report for all project components
 */
export function generateFullProjectOptimization(
  items: QuoteItem[],
  projectName: string = 'المشروع الحالي',
  stockBarLengthMm: number = 6000,
  kerfMm: number = 3.5
): ProjectOptimizationReport {
  const pieces = extractProjectCutPieces(items);

  const frameOpt = optimizePiecesForBar(
    pieces,
    'frame',
    'بروفيل الحلق والإطار الخارجي (Châssis Dormant)',
    stockBarLengthMm,
    kerfMm
  );

  const sashOpt = optimizePiecesForBar(
    pieces,
    'sash',
    'بروفيل ضلف النوافذ والأبواب (Châssis Ouvrant)',
    stockBarLengthMm,
    kerfMm
  );

  const mullionOpt = optimizePiecesForBar(
    pieces,
    'mullion',
    'بروفيل القائم الأوسط (Meneau)',
    stockBarLengthMm,
    kerfMm
  );

  const beadsOpt = optimizePiecesForBar(
    pieces,
    'bead',
    'بروفيل حوابس الزجاج (Parcloses)',
    stockBarLengthMm,
    kerfMm
  );

  const steelOpt = optimizePiecesForBar(
    pieces,
    'steel',
    'حديد التقوية المعدنية المجلفنة (Renforts Acier)',
    stockBarLengthMm,
    kerfMm
  );

  const totalBars6m = frameOpt.barsCount + sashOpt.barsCount + mullionOpt.barsCount + beadsOpt.barsCount + steelOpt.barsCount;
  const totalLinearMeters = Number(
    (frameOpt.totalLengthM + sashOpt.totalLengthM + mullionOpt.totalLengthM + beadsOpt.totalLengthM + steelOpt.totalLengthM).toFixed(1)
  );

  const totalStockM = totalBars6m * (stockBarLengthMm / 1000);
  const totalScrapLossM = Number(
    (frameOpt.scrapLossM + sashOpt.scrapLossM + mullionOpt.scrapLossM + beadsOpt.scrapLossM + steelOpt.scrapLossM).toFixed(2)
  );

  const overallEfficiencyPercent = totalStockM > 0
    ? Number((((totalStockM - totalScrapLossM) / totalStockM) * 100).toFixed(1))
    : 94.5;

  const totalReusableDropsCount =
    frameOpt.bars.filter((b) => b.isReusableDrop).length +
    sashOpt.bars.filter((b) => b.isReusableDrop).length +
    mullionOpt.bars.filter((b) => b.isReusableDrop).length +
    beadsOpt.bars.filter((b) => b.isReusableDrop).length +
    steelOpt.bars.filter((b) => b.isReusableDrop).length;

  return {
    timestamp: new Date().toISOString(),
    projectName,
    stockBarLengthMm,
    kerfMm,
    categories: {
      frame: frameOpt,
      sash: sashOpt,
      mullion: mullionOpt.totalPieces > 0 ? mullionOpt : undefined,
      beads: beadsOpt.totalPieces > 0 ? beadsOpt : undefined,
      steel: steelOpt.totalPieces > 0 ? steelOpt : undefined,
    },
    summary: {
      totalBars6m,
      totalLinearMeters,
      overallEfficiencyPercent,
      totalReusableDropsCount,
      totalScrapLossM,
    },
  };
}
