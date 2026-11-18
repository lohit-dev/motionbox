import Svg, { Circle, Path, Rect } from 'react-native-svg';

import colors from '@/constants/colors';

export type IconName =
  | 'home'
  | 'search'
  | 'bookmark'
  | 'calendar'
  | 'plus'
  | 'check'
  | 'play'
  | 'share'
  | 'back'
  | 'close'
  | 'more'
  | 'bell'
  | 'filter'
  | 'clear'
  | 'chevronDown'
  | 'chevronRight'
  | 'clock'
  | 'arrow'
  | 'fullscreen'
  | 'star'
  | 'info'
  | 'sort'
  | 'thumb'
  | 'globe'
  | 'trash';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  /** Fills the shape for icons that have a solid state (bookmark, bell). */
  filled?: boolean;
}

export function Icon({ name, size = 22, color = colors.white, filled = false }: IconProps) {
  const line = {
    stroke: color,
    fill: 'none',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const solid = filled ? color : 'none';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && (
        <Path
          {...line}
          fill={solid}
          d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"
        />
      )}
      {name === 'search' && (
        <>
          <Circle {...line} cx="11" cy="11" r="6.5" />
          <Path {...line} d="M16 16l4 4" />
        </>
      )}
      {name === 'bookmark' && <Path {...line} fill={solid} d="M6 4h12v16l-6-4.5L6 20z" />}
      {name === 'calendar' && (
        <>
          <Rect {...line} x="4" y="5" width="16" height="15" rx="2.5" />
          <Path {...line} d="M4 10h16M9 3v4M15 3v4" />
        </>
      )}
      {name === 'plus' && <Path {...line} d="M12 5v14M5 12h14" />}
      {name === 'check' && <Path {...line} d="M5 12.5l4.5 4.5L19 7.5" />}
      {name === 'play' && <Path fill={color} d="M5 4l14 8-14 8z" />}
      {name === 'share' && (
        <>
          <Path {...line} d="M12 15V3.5M7.5 8L12 3.5 16.5 8" />
          <Path
            {...line}
            d="M6 11.5H5.5A1.5 1.5 0 0 0 4 13v6.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V13a1.5 1.5 0 0 0-1.5-1.5H18"
          />
        </>
      )}
      {name === 'back' && <Path {...line} d="M15 5l-7 7 7 7" />}
      {name === 'close' && <Path {...line} d="M6 6l12 12M18 6L6 18" />}
      {name === 'more' && (
        <>
          <Circle fill={color} cx="5.5" cy="12" r="1.8" />
          <Circle fill={color} cx="12" cy="12" r="1.8" />
          <Circle fill={color} cx="18.5" cy="12" r="1.8" />
        </>
      )}
      {name === 'bell' && (
        <Path {...line} fill={solid} d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 21h4" />
      )}
      {name === 'filter' && (
        <>
          <Path {...line} d="M4 7h10M18 7h2M4 17h2M10 17h10" />
          <Circle {...line} cx="16" cy="7" r="2" />
          <Circle {...line} cx="8" cy="17" r="2" />
        </>
      )}
      {name === 'clear' && (
        <>
          <Circle {...line} cx="12" cy="12" r="9" />
          <Path {...line} d="M9 9l6 6M15 9l-6 6" />
        </>
      )}
      {name === 'chevronDown' && <Path {...line} d="M6 9l6 6 6-6" />}
      {name === 'chevronRight' && <Path {...line} d="M9 6l6 6-6 6" />}
      {name === 'clock' && (
        <>
          <Circle {...line} cx="12" cy="12" r="8.5" />
          <Path {...line} d="M12 7.5V12l3 2" />
        </>
      )}
      {name === 'arrow' && <Path {...line} d="M7 17L17 7M9 7h8v8" />}
      {name === 'fullscreen' && <Path {...line} d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
      {name === 'star' && (
        <Path
          fill={color}
          d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.7L12 17.5l-5.9 3.3 1.3-6.7L2.5 9.5l6.6-.8z"
        />
      )}
      {name === 'info' && (
        <>
          <Circle {...line} cx="12" cy="12" r="9" />
          <Path {...line} d="M12 11v5.5M12 7.8v.1" />
        </>
      )}
      {name === 'sort' && (
        <Path {...line} d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />
      )}
      {name === 'thumb' && (
        <Path
          {...line}
          d="M7 11v9H4v-9zM7 11l4-7c1.6 0 2.6 1.2 2.3 2.7L12.8 10H19a2 2 0 0 1 2 2.4l-1.2 6A2 2 0 0 1 17.8 20H7"
        />
      )}
      {name === 'globe' && (
        <>
          <Circle {...line} cx="12" cy="12" r="9" />
          <Path {...line} d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </>
      )}
      {name === 'trash' && <Path {...line} d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />}
    </Svg>
  );
}
