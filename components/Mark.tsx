import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** The "M" glyph from Inter ExtraBold, in 1024-unit space (y flipped), centred on 512 */
const M_PATH =
  'M105 0V1490H645L836 907Q852 854 873.5 772.5Q895 691 917.0 599.5Q939 508 958.0 424.0Q977 340 988 281H908Q919 340 938.0 423.5Q957 507 978.5 598.5Q1000 690 1021.0 772.0Q1042 854 1058 907L1247 1490H1787V0H1434V644Q1434 694 1436.0 770.5Q1438 847 1440.5 936.0Q1443 1025 1445.5 1116.0Q1448 1207 1448 1287H1480Q1460 1202 1436.0 1109.5Q1412 1017 1388.0 929.0Q1364 841 1343.0 767.0Q1322 693 1306 644L1093 0H801L584 644Q569 693 547.0 767.0Q525 841 501.0 929.0Q477 1017 452.0 1109.0Q427 1201 405 1287H444Q445 1208 447.0 1117.0Q449 1026 451.5 936.5Q454 847 456.0 770.5Q458 694 458 644V0Z';

/**
 * The Motion Box mark: a bold M between two rows of film perforations, on a dark rounded tile.
 * Drawn from the same shapes as assets/icon.png, so the launch screen and the app icon match.
 */
export function Mark({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="172 172 680 680">
      <Defs>
        <LinearGradient id="tile" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2A2A29" />
          <Stop offset="1" stopColor="#0D0D0C" />
        </LinearGradient>
        <LinearGradient id="ink" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#D4D4D2" />
        </LinearGradient>
      </Defs>
      <Rect x={172} y={172} width={680} height={680} rx={168} fill="url(#tile)" />
      <Rect
        x={173.5}
        y={173.5}
        width={677}
        height={677}
        rx={166.5}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.2}
        strokeWidth={3}
      />
        <Rect x={285.5} y={214} width={38} height={26} rx={8} fill="#fff" fillOpacity={0.2} />
        <Rect x={368.5} y={214} width={38} height={26} rx={8} fill="#fff" fillOpacity={0.2} />
        <Rect x={451.5} y={214} width={38} height={26} rx={8} fill="#fff" fillOpacity={0.2} />
        <Rect x={534.5} y={214} width={38} height={26} rx={8} fill="#fff" fillOpacity={0.2} />
        <Rect x={617.5} y={214} width={38} height={26} rx={8} fill="#fff" fillOpacity={0.2} />
        <Rect x={700.5} y={214} width={38} height={26} rx={8} fill="#fff" fillOpacity={0.2} />
        <Rect x={285.5} y={784} width={38} height={26} rx={8} fill="#fff" fillOpacity={0.2} />
        <Rect x={368.5} y={784} width={38} height={26} rx={8} fill="#fff" fillOpacity={0.2} />
        <Rect x={451.5} y={784} width={38} height={26} rx={8} fill="#fff" fillOpacity={0.2} />
        <Rect x={534.5} y={784} width={38} height={26} rx={8} fill="#fff" fillOpacity={0.2} />
        <Rect x={617.5} y={784} width={38} height={26} rx={8} fill="#fff" fillOpacity={0.2} />
        <Rect x={700.5} y={784} width={38} height={26} rx={8} fill="#fff" fillOpacity={0.2} />
      <Path transform="translate(256.58 713.15) scale(0.27 -0.27)" d={M_PATH} fill="url(#ink)" />
    </Svg>
  );
}
