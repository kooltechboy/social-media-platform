import type React from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Ionicons as ExpoIonicons } from '@expo/vector-icons';

/**
 * Single typed entry point for Ionicons across the TUKUBI mobile app.
 *
 * `@expo/vector-icons` ships class component typings that clash with the
 * React 18 JSX types used by this workspace, so the cast lives here once
 * instead of being repeated in every screen.
 */
export type IoniconName = keyof typeof ExpoIonicons.glyphMap;

export interface IoniconProps {
  name: IoniconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export const Ionicons = ExpoIonicons as unknown as React.ComponentType<IoniconProps>;

/** Narrow an arbitrary string (e.g. from a lookup table) to a valid glyph, with a safe fallback. */
export function toIoniconName(name: string | null | undefined, fallback: IoniconName = 'ellipse-outline'): IoniconName {
  if (name && Object.prototype.hasOwnProperty.call(ExpoIonicons.glyphMap, name)) {
    return name as IoniconName;
  }
  return fallback;
}
