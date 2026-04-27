import type { ReactElement } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { colorsV2 } from '../../colors';
import { typographyV2 } from '../../typography';

export type BodyProps = TextProps & {
  color?: string;
  size?: 'default' | 'small';
};

export function Body({
  color,
  size = 'default',
  style,
  ...rest
}: BodyProps): ReactElement {
  const token = size === 'small' ? typographyV2.bodySmall : typographyV2.body;
  const composed: TextStyle = {
    fontFamily: token.fontFamily,
    fontSize: token.fontSize,
    fontWeight: token.fontWeight,
    lineHeight: token.lineHeight,
    letterSpacing: token.letterSpacing,
    color: color ?? colorsV2.text.secondary,
  };
  return <Text {...rest} style={[composed, style]} />;
}
