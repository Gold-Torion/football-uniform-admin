import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/**
 * Builds an SVG path for a filled annular ring (donut shape).
 * Outer arc: clockwise. Inner arc: counter-clockwise. fillRule="evenodd"
 * creates the hole so only the band between r1 and r2 is filled.
 */
function annulusPath(
  cx: number, cy: number, innerR: number, outerR: number,
): string {
  return [
    `M ${cx + outerR} ${cy}`,
    `A ${outerR} ${outerR} 0 1 1 ${cx - outerR} ${cy}`,
    `A ${outerR} ${outerR} 0 1 1 ${cx + outerR} ${cy}`,
    `M ${cx + innerR} ${cy}`,
    `A ${innerR} ${innerR} 0 1 0 ${cx - innerR} ${cy}`,
    `A ${innerR} ${innerR} 0 1 0 ${cx + innerR} ${cy}`,
  ].join(' ');
}

interface BandSpec {
  innerFrac: number;
  outerFrac: number;
  color: string;
  baseOpacity: number;
  /** Opacity added at pulse peak. Outer ring has a larger boost so
   *  the wave "grows stronger" outward. */
  boost: number;
  delay: number;
  /** Cycle duration in ms — inner ring is SLOWER, outer is FASTER. */
  cycleDuration: number;
}

/**
 * Two brand-gold concentric rings confined entirely within the stadium circle
 * (outerFrac ≤ 1.0 → no pixel spills beyond the emblem edge).
 *
 * Eduardo's brief:
 *   - "use the dark golden inside and the lighter one outside"
 *   - "the small one moving less and slowly than the outside circle"
 *   - "leave the effect just on the stadium"
 */
const BANDS: BandSpec[] = [
  {
    // Inner ring — dark brand gold (#D4AF37), slow & subtle
    innerFrac: 0.40,
    outerFrac: 0.72,
    color: 'rgba(212, 175, 55, 1)',
    baseOpacity: 0.50,
    boost: 0.25,        // small boost (moves less)
    delay: 0,
    cycleDuration: 3200, // slow
  },
  {
    // Outer ring — light brand gold (#E1C16E), faster & more visible.
    // outerFrac = 1.0 keeps the ring inside the stadium boundary.
    innerFrac: 0.70,
    outerFrac: 1.00,
    color: 'rgba(225, 193, 110, 1)',
    baseOpacity: 0.38,
    boost: 0.48,        // larger boost (moves more)
    delay: 300,
    cycleDuration: 1800, // faster
  },
];

// SVG canvas slightly larger than the stadium so the outer ring edge is
// never clipped by the container. No drawn pixel goes beyond outerFrac=1.
const SVG_OVERFLOW = 1.12;

interface AnnularBandProps {
  stadiumSize: number;
  spec: BandSpec;
}

function AnnularBand({ stadiumSize, spec }: AnnularBandProps) {
  const svgSize = stadiumSize * SVG_OVERFLOW;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const emblemR = stadiumSize / 2;
  const r1 = emblemR * spec.innerFrac;
  const r2 = emblemR * spec.outerFrac;

  const opacity = useSharedValue(spec.baseOpacity);

  useEffect(() => {
    opacity.value = withDelay(
      spec.delay,
      withRepeat(
        withSequence(
          withTiming(spec.baseOpacity + spec.boost, {
            duration: spec.cycleDuration * 0.22,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(spec.baseOpacity + spec.boost, {
            duration: spec.cycleDuration * 0.14,
          }),
          withTiming(spec.baseOpacity, {
            duration: spec.cycleDuration * 0.64,
            easing: Easing.in(Easing.quad),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [opacity, spec.delay, spec.baseOpacity, spec.boost, spec.cycleDuration]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute' }, style]}
    >
      <Svg width={svgSize} height={svgSize}>
        <Path
          d={annulusPath(cx, cy, r1, r2)}
          fill={spec.color}
          fillRule="evenodd"
        />
      </Svg>
    </Animated.View>
  );
}

export function StadiumPulse({ stadiumSize }: { stadiumSize: number }) {
  const containerSize = stadiumSize * SVG_OVERFLOW;

  return (
    <View
      pointerEvents="none"
      style={{
        width: containerSize,
        height: containerSize,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {BANDS.map((spec) => (
        <AnnularBand key={spec.delay} stadiumSize={stadiumSize} spec={spec} />
      ))}
    </View>
  );
}
