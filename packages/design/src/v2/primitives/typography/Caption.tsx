import type { ReactElement } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { colorsV2 } from '../../colors';
import { typographyV2 } from '../../typography';

export type CaptionProps = TextProps & {
  color?: string;
};

export function Caption({ color, style, ...rest }: CaptionProps): ReactElement {
  const composed: TextStyle = {
    fontFamily: typographyV2.caption.fontFamily,
    fontSize: typographyV2.caption.fontSize,
    fontWeight: typographyV2.caption.fontWeight,
    lineHeight: typographyV2.caption.lineHeight,
    letterSpacing: typographyV2.caption.letterSpacing,
    color: color ?? colorsV2.text.muted,
  };
  return <Text {...rest} style={[composed, style]} />;
}
