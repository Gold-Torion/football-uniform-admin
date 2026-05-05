import { useEffect } from 'react';
import {
  Image,
  View,
  type ImageStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { ExteriorRipples } from './ExteriorRipples';
import { StadiumPulse } from './StadiumPulse';

const GOLD = '#D4AF37';

// ── Seat geometry (fractions of the emblem's outer radius) ─────────────────
const SEAT_INNER_FRAC = 0.38;
const SEAT_OUTER_FRAC = 1.00;

/** SVG path for an annular ring using the even-odd fill rule. */
function annulusPath(
  cx: number, cy: number, r1: number, r2: number,
): string {
  return [
    `M ${cx + r2} ${cy}`,
    `A ${r2} ${r2} 0 1 1 ${cx - r2} ${cy}`,
    `A ${r2} ${r2} 0 1 1 ${cx + r2} ${cy}`,
    `M ${cx + r1} ${cy}`,
    `A ${r1} ${r1} 0 1 0 ${cx - r1} ${cy}`,
    `A ${r1} ${r1} 0 1 0 ${cx + r1} ${cy}`,
  ].join(' ');
}

/**
 * Static green fill for the pitch (inner circle). Always shows beneath the
 * gold field markings so the centre looks like real grass.
 */
function GreenPitchFill({ stadiumSize }: { stadiumSize: number }) {
  const emblemR = stadiumSize / 2;
  const r = emblemR * SEAT_INNER_FRAC;
  const cx = emblemR;
  const cy = emblemR;

  return (
    <View pointerEvents="none" style={{ position: 'absolute' }}>
      <Svg width={stadiumSize} height={stadiumSize}>
        <Circle cx={cx} cy={cy} r={r} fill="rgba(62, 130, 40, 0.95)" stroke="none" />
      </Svg>
    </View>
  );
}

/**
 * Dark brand-gold base fill for the seating-tier zone. Sits below the
 * two animated rings so there is always a gold tint in the seats even
 * between pulses. Colour: #D4AF37 (brand primary gold) at low opacity.
 */
function GoldSeatBase({ stadiumSize }: { stadiumSize: number }) {
  const emblemR = stadiumSize / 2;
  const r1 = emblemR * SEAT_INNER_FRAC;
  const r2 = emblemR * SEAT_OUTER_FRAC;
  const cx = emblemR;
  const cy = emblemR;

  return (
    <View pointerEvents="none" style={{ position: 'absolute' }}>
      <Svg width={stadiumSize} height={stadiumSize}>
        <Path
          d={annulusPath(cx, cy, r1, r2)}
          fill="rgba(212, 175, 55, 0.28)"
          fillRule="evenodd"
        />
      </Svg>
    </View>
  );
}

/**
 * Arena dos Mantos brand-logo hero.
 *
 * Layout (top → bottom):
 *   - stadium.png  : circular stadium emblem
 *   - title.png    : "ARENA dos MANTOS" wordmark
 *
 * The stadium row has three layers (back → front):
 *   1. StadiumPulse — SVG annular rings that cover ONLY the seating-tier
 *      zone of the stadium emblem. The inner donut hole aligns with the
 *      football-pitch boundary so the pitch artwork is never tinted.
 *   2. stadium.png  — the actual emblem, drawn on top so its gold lines and
 *      opaque areas sit above the coloured rings.
 *
 * Both the pulse and the emblem are wrapped in the same Animated.View so
 * they hover together.
 */
export function BrandLogo({ size = 290 }: { size?: number }) {
  // Proportions
  const STADIUM_FRACTION = 0.5;
  const TITLE_FRACTION   = 0.88;
  const TITLE_ASPECT     = 524 / 192;
  const GAP              = 14;

  const stadiumSize  = size * STADIUM_FRACTION;
  const titleWidth   = size * TITLE_FRACTION;
  const titleHeight  = titleWidth / TITLE_ASPECT;

  // ── Animated values ────────────────────────────────────────────────────

  // Entrance: fade + scale up from 0.92
  const entranceOpacity = useSharedValue(0);
  const entranceScale   = useSharedValue(0.92);

  // Title entrance — slightly after the stadium appears.
  const titleOpacity = useSharedValue(0);
  const titleY       = useSharedValue(8);

  // Corner brackets appear last.
  const bracketOpacity = useSharedValue(0);

  useEffect(() => {
    entranceOpacity.value = withDelay(
      80,
      withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }),
    );
    entranceScale.value = withDelay(
      80,
      withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }),
    );

    titleOpacity.value = withDelay(
      320,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    titleY.value = withDelay(
      320,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );

    bracketOpacity.value = withDelay(
      520,
      withTiming(1, { duration: 700 }),
    );
  }, [
    entranceOpacity, entranceScale,
    titleOpacity, titleY,
    bracketOpacity,
  ]);

  const stadiumGroupStyle = useAnimatedStyle(() => ({
    opacity:   entranceOpacity.value,
    transform: [{ scale: entranceScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity:   titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const bracketStyle = useAnimatedStyle(() => ({
    opacity: bracketOpacity.value,
  }));

  const totalHeight = stadiumSize + GAP + titleHeight;
  const frameW = size  * 1.0;
  const frameH = totalHeight * 1.14;

  const stadiumImageStyle: ImageStyle = {
    width:  stadiumSize,
    height: stadiumSize,
  };
  const titleImageStyle: ImageStyle = {
    width:  titleWidth,
    height: titleHeight,
  };

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        width: size + 80,
      }}
    >
      {/* ── Stadium: pulse (back) + emblem (front), hover together ───── */}
      <Animated.View
        style={[
          { alignItems: 'center', justifyContent: 'center' },
          stadiumGroupStyle,
        ]}
      >
        {/* Layer 0 (backmost): exterior ripples expanding beyond the stadium.
            Rendered first so they sit behind everything including the inner
            animations. Independent cycle (1 100 ms) — faster and more
            intense than the inner rings (3 200 / 1 800 ms). */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}
        >
          <ExteriorRipples stadiumSize={stadiumSize} />
        </View>

        {/* Layer 1: animated dark + light gold rings (inside stadium) */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}
        >
          <StadiumPulse stadiumSize={stadiumSize} />
        </View>

        {/* Layer 2: static dark-gold base for the seating zone */}
        <GoldSeatBase stadiumSize={stadiumSize} />

        {/* Layer 3: green fill for the pitch (inner circle) */}
        <GreenPitchFill stadiumSize={stadiumSize} />

        {/* Layer 4 (front): gold stadium lines — always on top */}
        <Image
          source={require('../assets/stadium.png')}
          style={stadiumImageStyle}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Gap */}
      <View style={{ height: GAP }} />

      {/* ── Title ─────────────────────────────────────────────────────── */}
      <Animated.View style={titleStyle}>
        <Image
          source={require('../assets/title.png')}
          style={titleImageStyle}
          resizeMode="contain"
        />
      </Animated.View>

      {/* ── Heraldic corner brackets (front, entire lockup) ───────────── */}
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', width: frameW, height: frameH },
          bracketStyle,
        ]}
      >
        <CornerBracket position="tl" />
        <CornerBracket position="tr" />
        <CornerBracket position="bl" />
        <CornerBracket position="br" />
      </Animated.View>
    </View>
  );
}

function CornerBracket({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const armLen  = 22;
  const thick   = 1.5;
  const isTop   = position === 'tl' || position === 'tr';
  const isLeft  = position === 'tl' || position === 'bl';

  const base: Record<string, number | string> = {
    position: 'absolute',
    backgroundColor: GOLD,
    opacity: 0.7,
    [isTop  ? 'top'    : 'bottom']: 0,
    [isLeft ? 'left'   : 'right']:  0,
  };

  return (
    <>
      <View style={{ ...base, width: armLen, height: thick }} />
      <View style={{ ...base, width: thick,  height: armLen }} />
    </>
  );
}
