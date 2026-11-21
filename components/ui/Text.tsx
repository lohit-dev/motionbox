import { Text as RNText, type TextProps } from 'react-native';

interface Props extends TextProps {
  className?: string;
}

const HAS_WEIGHT = /(^|\s)font-(normal|medium|semibold|bold|extrabold)(\s|$)/;

/**
 * Text in Geist. React Native needs one font file per weight, so the weight classes
 * (font-medium, font-semibold, font-bold, font-extrabold) pick a file in tailwind.config.js.
 * Text with no weight class gets Regular. Use this instead of the Text from react-native.
 */
export function Text({ className = '', ...rest }: Props) {
  return (
    <RNText
      {...rest}
      className={HAS_WEIGHT.test(className) ? className : `font-normal ${className}`}
    />
  );
}
