import type { ReactElement } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { colorsV2 } from '../../colors';
import { typographyV2 } from '../../typography';

export type DisplayProps = TextProps & {
  color?: string;
};

export function Display({ color, style, ...rest }: DisplayProps): ReactElement {
  const composed: TextStyle = {
    fontFamily: typographyV2.display.fontFamily,
    fontSize: typographyV2.display.fontSize,
    fontWeight: typographyV2.display.fontWeight,
    lineHeight: typographyV2.display.lineHeight,
    letterSpacing: typographyV2.display.letterSpacing,
    color: color ?? colorsV2.text.primary,
  };
  return <Text {...rest} style={[composed, style]} />;
}
