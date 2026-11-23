import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** "m." from Inter ExtraBold, in 1024-unit space, centred on 512 */
const M_PATH =
  'M312 609.1V414.7H370.7L372.3 462.4H368.7Q373.3 444.6 382.6 433.3Q391.8 422 404 416.7Q416.2 411.3 429.8 411.3Q451.2 411.3 466.1 424.4Q481 437.5 486 464.4H479.9Q483.8 446.3 493.7 434.5Q503.6 422.8 517.2 417Q530.8 411.3 546.1 411.3Q564.7 411.3 579.2 419.4Q593.6 427.6 601.9 442.7Q610.1 457.7 610.1 479.1V609.1H547.9V492.9Q547.9 477.8 539.9 469.8Q531.9 461.9 519.5 461.9Q510.7 461.9 504.3 465.8Q497.8 469.8 494.3 476.8Q490.8 483.9 490.8 493.6V609.1H431.3V492Q431.3 478.2 423.6 470Q415.9 461.9 403.3 461.9Q394.9 461.9 388.3 465.7Q381.8 469.6 378 476.9Q374.2 484.3 374.2 494.9V609.1ZM678.1 612.7Q663.9 612.7 654.2 602.9Q644.4 593.2 644.4 579Q644.4 565 654.2 555.2Q663.9 545.5 678.1 545.5Q692.3 545.5 702.1 555.2Q712 565 712 579Q712 593.2 702.1 602.9Q692.3 612.7 678.1 612.7Z';

/**
 * The Motion Box mark: a bold "m." on a white rounded tile. Drawn from the same shapes as
 * assets/icon.png, so the launch screen and the app icon match.
 */
export function Mark({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="172 172 680 680">
      <Defs>
        <LinearGradient id="tile" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E9E9E7" />
        </LinearGradient>
      </Defs>
      <Rect x={172} y={172} width={680} height={680} rx={168} fill="url(#tile)" />
      <Path d={M_PATH} fill="#0B0B0A" />
    </Svg>
  );
}
