import { Text } from '@/components/ui/Text';
import colors from '@/constants/colors';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Pressable } from '@/components/ui/Pressable';

interface PillProps {
  title: string;
  icon?: IconName;
  /** primary is the single white pill on a screen, ghost is the grey one */
  tone?: 'primary' | 'ghost';
  /** Shorter pill (46) for rows that sit next to a circle button */
  compact?: boolean;
  onPress?: () => void;
  className?: string;
}

export function Pill({ title, icon, tone = 'primary', compact, onPress, className = '' }: PillProps) {
  const primary = tone === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`${compact ? 'h-[46px]' : 'h-14'} flex-row items-center justify-center gap-2 rounded-full px-6 ${
        primary ? 'bg-white' : 'bg-s2'
      } ${className}`}>
      {icon ? <Icon name={icon} size={16} color={primary ? colors.ink : colors.white} /> : null}
      <Text className={`text-base font-semibold ${primary ? 'text-ink' : 'text-white'}`}>
        {title}
      </Text>
    </Pressable>
  );
}
