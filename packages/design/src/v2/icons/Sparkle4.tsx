import type { ReactElement } from 'react';
import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './IconBase';

export function Sparkle4({
  size = 16,
  color = 'currentColor',
}: IconProps): ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2 L13.2 10.8 L22 12 L13.2 13.2 L12 22 L10.8 13.2 L2 12 L10.8 10.8 Z"
        fill={color}
      />
    </Svg>
  );
}
