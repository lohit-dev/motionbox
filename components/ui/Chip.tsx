import { Text } from '@/components/ui/Text';
import colors from '@/constants/colors';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Pressable } from '@/components/ui/Pressable';

interface ChipProps {
  label: string;
  selected?: boolean;
  trailingIcon?: IconName;
  onPress?: () => void;
  className?: string;
}

export function Chip({
  label,
  selected = false,
  trailingIcon,
  onPress,
  className = '',
}: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`h-9 flex-row items-center gap-1.5 rounded-full px-3.5 ${
        selected ? 'bg-white' : 'bg-s2'
      } ${className}`}>
      <Text className={`text-[13px] font-semibold ${selected ? 'text-ink' : 'text-white'}`}>
        {label}
      </Text>
      {trailingIcon ? (
        <Icon name={trailingIcon} size={14} color={selected ? colors.ink : colors.white} />
      ) : null}
    </Pressable>
  );
}
