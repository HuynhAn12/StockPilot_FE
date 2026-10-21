/**
 * StockPilot Official Brand Identity Logo
 * Source: Official SP Monogram (Isometric Cube + Upward Directional Chevron in Blue & Navy)
 * Uploaded by user: /stockpilot-mark.png & /stockpilot-full.png
 * Typography: StockPilot DECISION ENGINE
 */

export function StockPilotIcon({ className = '', size = 32 }) {
  const pixelSize = typeof size === 'number'
    ? size
    : size === 'sm'
    ? 24
    : size === 'lg'
    ? 44
    : size === 'md'
    ? 32
    : 32;

  return (
    <img
      src="/stockpilot-mark.png"
      alt="StockPilot Logo"
      width={pixelSize}
      height={pixelSize}
      className={`object-contain shrink-0 ${className}`}
      style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
      loading="eager"
    />
  );
}

export function StockPilotLogo({
  className = '',
  iconSize = 36,
  iconOnly = false,
  theme = 'light', 
  variant = 'split' 
}) {
  const isDark = theme === 'dark';

  if (variant === 'full' && !isDark) {
    return (
      <img
        src="/stockpilot-full.png"
        alt="StockPilot Decision Engine"
        className={`h-9 w-auto object-contain select-none ${className}`}
        loading="eager"
      />
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official SP Monogram sent by user */}
      <div className="shrink-0 transition-transform duration-200 hover:scale-[1.03]">
        <StockPilotIcon size={iconSize} />
      </div>

      {/* Official Typography: StockPilot DECISION ENGINE */}
      {!iconOnly && (
        <div className="flex flex-col text-left justify-center">
          <div className="flex items-center tracking-tight leading-none">
            <span className={`text-[21px] font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              StockPilot
            </span>
          </div>
          <span className={`text-[9.5px] font-extrabold tracking-[0.22em] uppercase leading-none mt-1 ${isDark ? 'text-slate-400' : 'text-[#475569]'}`}>
            DECISION ENGINE
          </span>
        </div>
      )}
    </div>
  );
}

export const StockPilotLogoIcon = StockPilotIcon;
export default StockPilotLogo;
