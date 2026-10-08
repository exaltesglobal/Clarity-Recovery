import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** Brand mark: an open "C" (clarity) holding a rising sun over a sprout (growth). */
export function Logo({ size = 64, tile = true }: { size?: number; tile?: boolean }) {
  const stroke = tile ? '#FFFFFF' : '#2E6E6A';
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityLabel="Clarity Recovery logo">
      {tile && (
        <>
          <Defs>
            <LinearGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#2A6763" />
              <Stop offset="1" stopColor="#6FA89A" />
            </LinearGradient>
          </Defs>
          <Rect width="1024" height="1024" rx="230" fill="url(#logoGradient)" />
        </>
      )}
      <Path
        d="M724,300 A300,300 0 1 0 724,724"
        fill="none"
        stroke={stroke}
        strokeWidth={64}
        strokeLinecap="round"
      />
      <Circle cx="512" cy="430" r="68" fill="#F4C98E" />
      <Path d="M512,660 C430,650 372,590 364,520 C436,520 500,574 512,660 Z" fill={stroke} />
      <Path d="M512,660 C594,650 652,590 660,520 C588,520 524,574 512,660 Z" fill={stroke} />
    </Svg>
  );
}
