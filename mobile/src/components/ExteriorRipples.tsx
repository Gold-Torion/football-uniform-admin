import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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
 * Exterior wave rings outside the stadium boundary.
 *
 * 링이 퍼져나가는 방식이 아니라, 고정된 위치의 링들이
 * 안쪽→바깥쪽 순서로 opacity가 파동치는(물결치는) 방식.
 * 마치 물 위에 돌을 던졌을 때 생기는 파문처럼
 * 전체가 함께 물결치는 효과.
 */

const CYCLE_MS   = 1600;
const STROKE_WIDTH = 6.0;
const DARK_GOLD  = 'rgba(212, 175, 55, 1)';   // #D4AF37
const LIGHT_GOLD = 'rgba(225, 193, 110, 1)';  // #E1C16E

// Fixed rings at different distances outside the stadium boundary.
// scaleFactor: 1.0 = stadium edge, values > 1.0 = outside the stadium.
const RINGS = [
  { scaleFactor: 1.06, delay: 0,   baseOpacity: 0.15, peakOpacity: 0.80, color: DARK_GOLD  },
  { scaleFactor: 1.12, delay: 200, baseOpacity: 0.12, peakOpacity: 0.65, color: LIGHT_GOLD },
  { scaleFactor: 1.18, delay: 400, baseOpacity: 0.08, peakOpacity: 0.50, color: LIGHT_GOLD },
  { scaleFactor: 1.25, delay: 600, baseOpacity: 0.05, peakOpacity: 0.35, color: LIGHT_GOLD },
];

interface WaveRingProps {
  stadiumSize: number;
  scaleFactor: number;
  delay: number;
  baseOpacity: number;
  peakOpacity: number;
  color: string;
}

function WaveRing({ stadiumSize, scaleFactor, delay, baseOpacity, peakOpacity, color }: WaveRingProps) {
  // Ring diameter = stadiumSize × scaleFactor (fixed position, never moves)
  const ringSize = stadiumSize * scaleFactor;
  const r = ringSize / 2 - STROKE_WIDTH / 2;

  const opacity = useSharedValue(baseOpacity);

  useEffect(() => {
    // Pulse: base → peak → base, staggered by delay so wave travels outward
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(peakOpacity, {
            duration: CYCLE_MS * 0.30,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(baseOpacity, {
            duration: CYCLE_MS * 0.70,
            easing: Easing.in(Easing.quad),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [opacity, delay, baseOpacity, peakOpacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute' }, style]}
    >
      <Svg width={ringSize} height={ringSize}>
        <Circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={r}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

export function ExteriorRipples({ stadiumSize }: { stadiumSize: number }) {
  const maxScale = RINGS[RINGS.length - 1].scaleFactor;
  const containerSize = stadiumSize * maxScale;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: containerSize,
        height: containerSize,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {RINGS.map((ring) => (
        <WaveRing
          key={ring.scaleFactor}
          stadiumSize={stadiumSize}
          scaleFactor={ring.scaleFactor}
          delay={ring.delay}
          baseOpacity={ring.baseOpacity}
          peakOpacity={ring.peakOpacity}
          color={ring.color}
        />
      ))}
    </View>
  );
}
