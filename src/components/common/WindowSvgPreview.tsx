import React, { useState } from 'react';
import { ModelOpeningType, Unit, SashConfig, SashFunction } from '../../types';
import { Wind, Lock, Unlock, Eye, HelpCircle, Layers } from 'lucide-react';

interface WindowSvgPreviewProps {
  width: number;
  height: number;
  unit: Unit;
  sashes: number;
  openingType: ModelOpeningType;
  colorHex: string;
  glassTypeName?: string;
  showDimensions?: boolean;
  className?: string;
  sashConfigs?: SashConfig[];
  activeSashIndex?: number;
  onSelectSash?: (index: number) => void;
  allowOpenSimulation?: boolean;
}

export const WindowSvgPreview: React.FC<WindowSvgPreviewProps> = ({
  width,
  height,
  unit,
  sashes,
  openingType,
  colorHex,
  glassTypeName = '',
  showDimensions = true,
  className = '',
  sashConfigs,
  activeSashIndex,
  onSelectSash,
  allowOpenSimulation = true,
}) => {
  // Opening simulation state
  const [simulationState, setSimulationState] = useState<'closed' | 'side_open' | 'tilt_open'>('closed');

  // Normalize dimensions to cm
  const wCm = unit === 'mm' ? width / 10 : width;
  const hCm = unit === 'mm' ? height / 10 : height;

  // Safe aspect ratio calculations for SVG viewBox
  const clampedW = Math.max(40, Math.min(360, wCm || 120));
  const clampedH = Math.max(40, Math.min(260, hCm || 120));

  const padding = showDimensions ? 45 : 15;
  const svgWidth = clampedW + padding * 2;
  const svgHeight = clampedH + padding * 2;

  const frameX = padding;
  const frameY = padding;
  const frameW = clampedW;
  const frameH = clampedH;

  const frameThickness = Math.max(4, Math.min(8, clampedW * 0.04));
  const innerW = frameW - frameThickness * 2;
  const innerH = frameH - frameThickness * 2;

  // Glass background tint
  let glassFill = '#E0F2FE';
  let glassOpacity = 0.85;

  if (glassTypeName.includes('عاكس') || glassTypeName.includes('Réflechissant')) {
    glassFill = '#64748B';
    glassOpacity = 0.75;
  } else if (glassTypeName.includes('مصنفر') || glassTypeName.includes('Dépoli')) {
    glassFill = '#CBD5E1';
    glassOpacity = 0.95;
  } else if (glassTypeName.includes('سيكوريت') || glassTypeName.includes('Sécurité')) {
    glassFill = '#93C5FD';
    glassOpacity = 0.9;
  }

  // Sashes list resolution
  const safeSashesCount = Math.max(1, Math.min(4, sashes));
  const sashWidth = innerW / safeSashesCount;
  const sashProfileThickness = Math.max(3, Math.min(6, frameThickness * 0.8));

  // Determine border color for contrast if white
  const isWhite = colorHex.toLowerCase() === '#ffffff' || colorHex.toLowerCase() === '#fff';
  const frameStroke = isWhite ? '#CBD5E1' : '#1E293B';

  // Sashes configuration resolution
  const resolvedConfigs: SashConfig[] = Array.from({ length: safeSashesCount }).map((_, i) => {
    if (sashConfigs && sashConfigs[i]) return sashConfigs[i];
    let defaultType: SashFunction = 'OF';
    if (openingType === 'tilt_turn') defaultType = 'OB';
    else if (openingType === 'sliding' || openingType === 'door_sliding') defaultType = 'SLIDE';
    else if (openingType === 'fixed') defaultType = 'FIX';
    else if (openingType === 'casement' && safeSashesCount === 2 && i === 0) defaultType = 'OB'; // Left sash OB by default on double window
    return {
      id: i,
      type: defaultType,
      openingSide: i % 2 === 0 ? 'left' : 'right',
    };
  });

  // Check if any sash supports OB
  const hasAnyOBSash = resolvedConfigs.some(s => s.type === 'OB');

  return (
    <div className={`relative flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-[#F3F6FA] to-white border border-[#DDE3EA] overflow-hidden ${className}`}>
      {/* Top Header Badge & Quick Simulation Bar */}
      <div className="w-full flex items-center justify-between gap-2 mb-2 z-10">
        <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white shadow-xs border border-[#DDE3EA] text-[#0B4F9E]">
          <span>{width || 0} × {height || 0} {unit}</span>
          <span className="text-gray-300">|</span>
          <span>{safeSashesCount} {safeSashesCount === 1 ? 'ضلفة' : safeSashesCount === 2 ? 'ضلفتين' : 'ضلف'}</span>
          {hasAnyOBSash && (
            <span className="mr-1 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] rounded-md font-black animate-pulse">
              ميزة OB مفعلة
            </span>
          )}
        </div>

        {/* Simulation Controls if enabled */}
        {allowOpenSimulation && (
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#DDE3EA] shadow-2xs text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setSimulationState('closed')}
              className={`px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                simulationState === 'closed'
                  ? 'bg-[#0B4F9E] text-white shadow-xs'
                  : 'text-[#5B6675] hover:text-[#10161F]'
              }`}
              title="النافذة مغلقة بإحكام"
            >
              <Lock className="w-3 h-3" />
              <span>مغلقة</span>
            </button>

            <button
              type="button"
              onClick={() => setSimulationState('side_open')}
              className={`px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                simulationState === 'side_open'
                  ? 'bg-[#1E9E5A] text-white shadow-xs'
                  : 'text-[#5B6675] hover:text-[#10161F]'
              }`}
              title="فتح جانبي عادي"
            >
              <Unlock className="w-3 h-3" />
              <span>فتح جانبي</span>
            </button>

            {hasAnyOBSash && (
              <button
                type="button"
                onClick={() => setSimulationState('tilt_open')}
                className={`px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                  simulationState === 'tilt_open'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
                title="فتح قلاب علوي للتهوية الآمنة (Oscillo-Battant)"
              >
                <Wind className="w-3 h-3" />
                <span>قلاب OB</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full max-h-72 object-contain drop-shadow-md select-none transition-all duration-300"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="pvc-shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
          <filter id="active-sash-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0B4F9E" floodOpacity="0.5" />
          </filter>
          <linearGradient id="glassReflect" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="tiltDepthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F172A" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Wall Outline */}
        <rect
          x={frameX - 2}
          y={frameY - 2}
          width={frameW + 4}
          height={frameH + 4}
          rx={4}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />

        {/* Outer Frame (الحلق) */}
        <rect
          x={frameX}
          y={frameY}
          width={frameW}
          height={frameH}
          rx={3}
          fill={colorHex}
          stroke={frameStroke}
          strokeWidth="2"
          filter="url(#pvc-shadow)"
        />

        {/* Inner Opening Space */}
        <rect
          x={frameX + frameThickness}
          y={frameY + frameThickness}
          width={innerW}
          height={innerH}
          fill="#F8FAFC"
        />

        {/* Render Each Sash with Interactive & OB capabilities */}
        {resolvedConfigs.map((sashConfig, index) => {
          const sashX = frameX + frameThickness + index * sashWidth;
          const sashY = frameY + frameThickness;
          const isSelected = activeSashIndex === index;
          const isOB = sashConfig.type === 'OB';
          const isFix = sashConfig.type === 'FIX';
          const isSlide = sashConfig.type === 'SLIDE';
          const isOF = sashConfig.type === 'OF';

          const currentH = innerH;
          const glassX = sashX + sashProfileThickness;
          const glassY = sashY + sashProfileThickness;
          const glassW = Math.max(4, sashWidth - sashProfileThickness * 2);
          const glassH = Math.max(4, currentH - sashProfileThickness * 2);

          const isSimulatingTilt = simulationState === 'tilt_open' && isOB;
          const isSimulatingSideOpen = simulationState === 'side_open' && (isOB || isOF);

          return (
            <g
              key={`sash-${index}`}
              onClick={() => onSelectSash && onSelectSash(index)}
              className="cursor-pointer transition-all duration-200"
              filter={isSelected ? 'url(#active-sash-glow)' : undefined}
            >
              {/* If tilted open in simulation mode: Render dark interior gap & side scissor stays (Compas de limitation) */}
              {isSimulatingTilt && (
                <g>
                  {/* Top interior void */}
                  <polygon
                    points={`${sashX},${sashY} ${sashX + sashWidth},${sashY} ${sashX + sashWidth - 6},${sashY + 18} ${sashX + 6},${sashY + 18}`}
                    fill="url(#tiltDepthGrad)"
                  />
                  {/* Left Scissor Stay (Compas OB) */}
                  <line
                    x1={sashX + 2}
                    y1={sashY + 2}
                    x2={sashX + 8}
                    y2={sashY + 18}
                    stroke="#D97706"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Right Scissor Stay (Compas OB) */}
                  <line
                    x1={sashX + sashWidth - 2}
                    y1={sashY + 2}
                    x2={sashX + sashWidth - 8}
                    y2={sashY + 18}
                    stroke="#D97706"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Airflow breeze breeze curves */}
                  <path
                    d={`M ${sashX + sashWidth * 0.3} ${sashY + 4} Q ${sashX + sashWidth * 0.5} ${sashY - 6} ${sashX + sashWidth * 0.7} ${sashY + 8}`}
                    fill="none"
                    stroke="#1E9E5A"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                </g>
              )}

              {/* Sash Outer Frame Profile (shifts slightly if tilting or swinging) */}
              <rect
                x={isSimulatingSideOpen ? sashX + (sashConfig.openingSide === 'left' ? 8 : -8) : sashX}
                y={isSimulatingTilt ? sashY + 12 : sashY}
                width={isSimulatingSideOpen ? sashWidth * 0.85 : sashWidth}
                height={isSimulatingTilt ? currentH - 12 : currentH}
                fill={colorHex}
                stroke={isSelected ? '#0B4F9E' : frameStroke}
                strokeWidth={isSelected ? '2.5' : '1.5'}
                rx={isFix ? 0 : 2}
              />

              {/* Glass Pane */}
              <rect
                x={isSimulatingSideOpen ? glassX + (sashConfig.openingSide === 'left' ? 8 : -8) : glassX}
                y={isSimulatingTilt ? glassY + 12 : glassY}
                width={isSimulatingSideOpen ? glassW * 0.85 : glassW}
                height={isSimulatingTilt ? glassH - 12 : glassH}
                fill={glassFill}
                fillOpacity={glassOpacity}
                stroke="#94A3B8"
                strokeWidth="1"
              />

              {/* Glass Reflection */}
              <polygon
                points={`
                  ${glassX},${isSimulatingTilt ? glassY + 12 : glassY}
                  ${glassX + glassW * 0.6},${isSimulatingTilt ? glassY + 12 : glassY}
                  ${glassX},${(isSimulatingTilt ? glassY + 12 : glassY) + glassH * 0.6}
                `}
                fill="url(#glassReflect)"
              />

              {/* Architectural Lines:
                  - For OB: Show BOTH the top tilt triangle (dashed amber/red) AND side casement triangle (dashed blue)!
                  - For OF: Show side casement triangle
                  - For FIX: Clean glass
                  - For SLIDE: Horizontal slide arrows
              */}
              {!isFix && simulationState === 'closed' && (
                <g>
                  {/* OB Top Tilt Triangle (Points down from top corners to bottom center) */}
                  {isOB && (
                    <path
                      d={`M ${glassX} ${glassY} L ${glassX + glassW / 2} ${glassY + glassH} L ${glassX + glassW} ${glassY}`}
                      fill="none"
                      stroke="#D97706"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                    />
                  )}

                  {/* Casement Side Triangle (Points to hinge or handle) */}
                  {(isOF || isOB) && (
                    <path
                      d={
                        sashConfig.openingSide === 'left'
                          ? `M ${glassX} ${glassY} L ${glassX + glassW} ${glassY + glassH / 2} L ${glassX} ${glassY + glassH}`
                          : `M ${glassX + glassW} ${glassY} L ${glassX} ${glassY + glassH / 2} L ${glassX + glassW} ${glassY + glassH}`
                      }
                      fill="none"
                      stroke="#0B4F9E"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                  )}

                  {/* Sliding Arrows */}
                  {isSlide && (
                    <g>
                      <line
                        x1={sashX + sashWidth * 0.25}
                        y1={sashY + currentH / 2}
                        x2={sashX + sashWidth * 0.75}
                        y2={sashY + currentH / 2}
                        stroke="#0B4F9E"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                      <polygon
                        points={
                          index % 2 === 0
                            ? `${sashX + sashWidth * 0.75},${sashY + currentH / 2 - 4} ${sashX + sashWidth * 0.75 + 5},${sashY + currentH / 2} ${sashX + sashWidth * 0.75},${sashY + currentH / 2 + 4}`
                            : `${sashX + sashWidth * 0.25},${sashY + currentH / 2 - 4} ${sashX + sashWidth * 0.25 - 5},${sashY + currentH / 2} ${sashX + sashWidth * 0.25},${sashY + currentH / 2 + 4}`
                        }
                        fill="#0B4F9E"
                      />
                    </g>
                  )}
                </g>
              )}

              {/* OB / OF Ergonomic Handle:
                  - If closed: points down (locked)
                  - If side open: horizontal
                  - If tilt open: points UP (180° OB position!)
              */}
              {!isFix && (
                <g>
                  {isSimulatingTilt ? (
                    // Handle rotated upwards in OB mode
                    <g>
                      <rect
                        x={sashConfig.openingSide === 'left' ? sashX + sashWidth - sashProfileThickness - 2 : sashX + 2}
                        y={sashY + currentH / 2 - 20}
                        width={4}
                        height={18}
                        rx={2}
                        fill="#D97706"
                      />
                      <circle
                        cx={sashConfig.openingSide === 'left' ? sashX + sashWidth - sashProfileThickness : sashX + 4}
                        cy={sashY + currentH / 2}
                        r={3}
                        fill="#B45309"
                      />
                    </g>
                  ) : isSimulatingSideOpen ? (
                    // Handle horizontal
                    <rect
                      x={sashConfig.openingSide === 'left' ? sashX + sashWidth - sashProfileThickness - 16 : sashX + 4}
                      y={sashY + currentH / 2 - 2}
                      width={16}
                      height={4}
                      rx={2}
                      fill="#1E9E5A"
                    />
                  ) : (
                    // Handle pointing down
                    <rect
                      x={sashConfig.openingSide === 'left' ? sashX + sashWidth - sashProfileThickness - 2 : sashX + 2}
                      y={sashY + currentH / 2}
                      width={4}
                      height={18}
                      rx={2}
                      fill="#1E9E5A"
                    />
                  )}
                </g>
              )}

              {/* Sash Type Pill Badge directly on the sash */}
              <g>
                <rect
                  x={sashX + sashWidth / 2 - 22}
                  y={sashY + currentH - 22}
                  width={44}
                  height={15}
                  rx={7.5}
                  fill={
                    isOB
                      ? '#D97706'
                      : isOF
                      ? '#0B4F9E'
                      : isFix
                      ? '#64748B'
                      : '#10B981'
                  }
                  opacity={0.9}
                />
                <text
                  x={sashX + sashWidth / 2}
                  y={sashY + currentH - 11}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="8.5"
                  fontWeight="bold"
                >
                  {isOB ? 'قلاب OB' : isOF ? 'مفصلي OF' : isFix ? 'ثابتة FIX' : 'جرار SLD'}
                </text>
              </g>

              {/* Active Selection Outline */}
              {isSelected && (
                <rect
                  x={sashX + 1}
                  y={sashY + 1}
                  width={sashWidth - 2}
                  height={currentH - 2}
                  fill="none"
                  stroke="#0B4F9E"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  rx={3}
                />
              )}
            </g>
          );
        })}

        {/* Central Mullion Divider Lines */}
        {safeSashesCount > 1 && (
          Array.from({ length: safeSashesCount - 1 }).map((_, idx) => (
            <line
              key={`mullion-${idx}`}
              x1={frameX + frameThickness + (idx + 1) * sashWidth}
              y1={frameY + frameThickness}
              x2={frameX + frameThickness + (idx + 1) * sashWidth}
              y2={frameY + frameH - frameThickness}
              stroke="#94A3B8"
              strokeWidth="2.5"
            />
          ))
        )}

        {/* Dimensions */}
        {showDimensions && (
          <g className="text-[10px] font-medium fill-[#5B6675]">
            <line
              x1={frameX}
              y1={frameY + frameH + 18}
              x2={frameX + frameW}
              y2={frameY + frameH + 18}
              stroke="#5B6675"
              strokeWidth="1.2"
            />
            <path
              d={`M ${frameX} ${frameY + frameH + 15} L ${frameX} ${frameY + frameH + 21} M ${frameX + frameW} ${frameY + frameH + 15} L ${frameX + frameW} ${frameY + frameH + 21}`}
              stroke="#5B6675"
              strokeWidth="1.2"
            />
            <text
              x={frameX + frameW / 2}
              y={frameY + frameH + 32}
              textAnchor="middle"
              className="text-[11px] font-bold fill-[#0B4F9E]"
            >
              العرض: {width} {unit}
            </text>

            <line
              x1={frameX - 18}
              y1={frameY}
              x2={frameX - 18}
              y2={frameY + frameH}
              stroke="#5B6675"
              strokeWidth="1.2"
            />
            <path
              d={`M ${frameX - 21} ${frameY} L ${frameX - 15} ${frameY} M ${frameX - 21} ${frameY + frameH} L ${frameX - 15} ${frameY + frameH}`}
              stroke="#5B6675"
              strokeWidth="1.2"
            />
            <text
              x={frameX - 25}
              y={frameY + frameH / 2}
              textAnchor="middle"
              transform={`rotate(-90 ${frameX - 25} ${frameY + frameH / 2})`}
              className="text-[11px] font-bold fill-[#0B4F9E]"
            >
              الارتفاع: {height} {unit}
            </text>
          </g>
        )}
      </svg>

      {/* Visual Color, Glass, & OB Explanation Footer */}
      <div className="w-full pt-2.5 border-t border-[#DDE3EA] mt-1 space-y-1.5 text-xs text-[#5B6675]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-xs inline-block"
              style={{ backgroundColor: colorHex }}
            />
            <span className="font-semibold text-[#10161F]">{glassTypeName.split('(')[0]}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span className="text-[#0B4F9E]">انقر على أي ضلفة لتعديل نوع فتحتها</span>
          </div>
        </div>

        {/* OB Helper Note */}
        {hasAnyOBSash && (
          <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 leading-snug flex items-start gap-1.5">
            <Wind className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>ميزة الـ Oscillo-Battant (OB): </strong>
              تسمح بالفتح المائل من الأعلى للتهوية المستمرة دون إمكانية الدخول من الخارج ومقاومة تسرب المطر، مع إمكانية الفتح الجانبي الكامل عند الحاجة.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
