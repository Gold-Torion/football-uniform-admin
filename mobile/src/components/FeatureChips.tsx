import { Text, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

/**
 * Trust-signal chips shown on the sign-in screen. Icons are gold (the brand
 * primary accent) and stroke-based so they stay legible at the 14 px chip
 * size used here without dragging in another font.
 */

const GOLD = '#D4AF37';

interface ChipProps {
  icon: React.ReactNode;
  label: string;
}

function Chip({ icon, label }: ChipProps) {
  return (
    <View
      className="flex-1 flex-row items-center gap-2 rounded-full pl-2.5 pr-3.5 py-2"
      style={{
        backgroundColor: 'rgba(212, 175, 55, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.28)',
      }}
    >
      <View className="w-4 h-4 items-center justify-center">{icon}</View>
      <Text style={{ color: '#EAEAEA' }} className="text-[12px] font-semibold">{label}</Text>
    </View>
  );
}

const PackageIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M16.5 9.4 7.5 4.21" />
    <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <Path d="m3.27 6.96 8.73 5.05 8.73-5.05" />
    <Path d="M12 22.08V12" />
  </Svg>
);

const ShieldIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Path d="m9 12 2 2 4-4" />
  </Svg>
);

const StarIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill={GOLD} stroke={GOLD} strokeWidth="1.5" strokeLinejoin="round">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

const SearchIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round">
    <Path d="m21 21-4.35-4.35" />
    <Path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
  </Svg>
);

export function FeatureChips() {
  return (
    <View className="gap-2" style={{ width: '90%', alignSelf: 'center' }}>
      {/* Row 1 */}
      <View className="flex-row gap-2">
        <Chip icon={<PackageIcon />} label="+50.000 camisas" />
        <Chip icon={<ShieldIcon />} label="Pagamento seguro" />
      </View>
      {/* Row 2 — each chip has flex:1 so both rows are identical width */}
      <View className="flex-row gap-2">
        <Chip icon={<StarIcon />} label="Avaliações reais" />
        <Chip icon={<SearchIcon />} label="SKU verificado" />
      </View>
    </View>
  );
}
