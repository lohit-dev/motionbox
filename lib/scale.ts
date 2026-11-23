import { Dimensions } from 'react-native';

/** The width the design was drawn at */
const BASE = 390;

const { width } = Dimensions.get('window');

/**
 * How much bigger or smaller than the design this screen is. Clamped, so a small phone does
 * not squeeze the layout and a tablet does not blow it up. The app stays in portrait, so the
 * width is read once.
 */
export const scale = Math.min(1.3, Math.max(0.92, Math.min(width, 520) / BASE));

/** A size from the design, adjusted to this screen: card widths, rings, numerals. */
export const sz = (n: number) => Math.round(n * scale);
