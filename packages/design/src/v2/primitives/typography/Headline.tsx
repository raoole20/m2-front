import type { ReactElement } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { colorsV2 } from '../../colors';
import { typographyV2 } from '../../typography';

export type HeadlineProps = TextProps & {
  color?: string;
};

export function Headline({ color, style, ...rest }: HeadlineProps): ReactElement {
  const composed: TextStyle = {
    fontFamily: typographyV2.headline.fontFamily,
    fontSize: typographyV2.headline.fontSize,
    fontWeight: typographyV2.headline.fontWeight,
    lineHeight: typographyV2.headline.lineHeight,
    letterSpacing: typographyV2.headline.letterSpacing,
    color: color ?? colorsV2.text.primary,
  };
  return <Text {...rest} style={[composed, style]} />;
}
