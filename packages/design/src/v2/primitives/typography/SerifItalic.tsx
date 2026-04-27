import type { ReactElement } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { colorsV2 } from '../../colors';
import { fontFamily } from '../../typography';

export type SerifItalicProps = TextProps & {
  color?: string;
  size?: number;
};

export function SerifItalic({
  color,
  size = 22,
  style,
  ...rest
}: SerifItalicProps): ReactElement {
  const composed: TextStyle = {
    fontFamily: fontFamily.instrumentSerif.italic,
    fontSize: size,
    fontStyle: 'italic',
    fontWeight: '400',
    color: color ?? colorsV2.text.primary,
  };
  return <Text {...rest} style={[composed, style]} />;
}
