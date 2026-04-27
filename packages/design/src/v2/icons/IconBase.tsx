import type { ReactElement, ReactNode } from 'react';
import Svg, { type SvgProps } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

type IconBaseProps = IconProps & {
  children: ReactNode;
  fill?: SvgProps['fill'];
  stroke?: SvgProps['stroke'];
};

export function IconBase({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.5,
  children,
  fill = 'none',
  stroke,
}: IconBaseProps): ReactElement {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke ?? color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}
