import type { ReactNode } from 'react';

import colors from '@/constants/colors';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Pressable } from '@/components/ui/Pressable';

interface CircleButtonProps {
  icon?: IconName;
  /** Custom content, used instead of `icon` (for example the wiggling bell) */
  children?: ReactNode;
  label: string;
  /** Solid white state, for saved or reminded */
  active?: boolean;
  /** glass sits over artwork (hero back button), solid is the default grey */
  tone?: 'solid' | 'glass';
  size?: number;
  onPress?: () => void;
  className?: string;
}

export function CircleButton({
  icon,
  children,
  label,
  active = false,
  tone = 'solid',
  size = 54,
  onPress,
  className = '',
}: CircleButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      scale={0.92}
      className={`items-center justify-center rounded-full ${active ? 'bg-white' : tone === 'glass' ? 'bg-black/55' : 'bg-s2'} ${className}`}
      style={{ width: size, height: size }}>
      {children ??
        (icon ? <Icon name={icon} size={20} color={active ? colors.ink : colors.white} /> : null)}
    </Pressable>
  );
}
