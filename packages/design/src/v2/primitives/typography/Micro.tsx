import type { ReactElement } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { colorsV2 } from '../../colors';
import { typographyV2 } from '../../typography';

export type MicroProps = TextProps & {
  color?: string;
};

export function Micro({ color, style, ...rest }: MicroProps): ReactElement {
  const composed: TextStyle = {
    fontFamily: typographyV2.micro.fontFamily,
    fontSize: typographyV2.micro.fontSize,
    fontWeight: typographyV2.micro.fontWeight,
    lineHeight: typographyV2.micro.lineHeight,
    letterSpacing: typographyV2.micro.letterSpacing,
    textTransform: typographyV2.micro.textTransform,
    color: color ?? colorsV2.text.muted,
  };
  return <Text {...rest} style={[composed, style]} />;
}
