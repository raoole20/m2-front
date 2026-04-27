import type { ReactElement } from 'react';
import { Circle, Path } from 'react-native-svg';

import { IconBase, type IconProps } from './IconBase';

export function Search(props: IconProps): ReactElement {
  return (
    <IconBase {...props}>
      <Circle cx="11" cy="11" r="7" />
      <Path d="M21 21l-4.3-4.3" />
    </IconBase>
  );
}

export function Filter(props: IconProps): ReactElement {
  return (
    <IconBase {...props}>
      <Path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </IconBase>
  );
}

export function Plus(props: IconProps): ReactElement {
  return (
    <IconBase {...props}>
      <Path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

export function ChevronLeft(props: IconProps): ReactElement {
  return (
    <IconBase {...props}>
      <Path d="M15 18l-6-6 6-6" />
    </IconBase>
  );
}

export function ChevronRight(props: IconProps): ReactElement {
  return (
    <IconBase {...props}>
      <Path d="M9 18l6-6-6-6" />
    </IconBase>
  );
}

export function Send(props: IconProps): ReactElement {
  return (
    <IconBase {...props}>
      <Path d="M22 2L11 13" />
      <Path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </IconBase>
  );
}

export function Paperclip(props: IconProps): ReactElement {
  return (
    <IconBase {...props}>
      <Path d="M21.4 11.05L12.05 20.4a5.5 5.5 0 01-7.78-7.78l9.19-9.19a3.67 3.67 0 015.19 5.19l-9.2 9.19a1.83 1.83 0 11-2.59-2.59l8.49-8.49" />
    </IconBase>
  );
}

export function MoreHorizontal(props: IconProps): ReactElement {
  const { color = 'currentColor' } = props;
  return (
    <IconBase {...props}>
      <Circle cx="5" cy="12" r="1" fill={color} stroke="none" />
      <Circle cx="12" cy="12" r="1" fill={color} stroke="none" />
      <Circle cx="19" cy="12" r="1" fill={color} stroke="none" />
    </IconBase>
  );
}

export function Check(props: IconProps): ReactElement {
  return (
    <IconBase {...props}>
      <Path d="M20 6L9 17l-5-5" />
    </IconBase>
  );
}

export function CheckDouble(props: IconProps): ReactElement {
  return (
    <IconBase {...props}>
      <Path d="M2 13l4 4L14 9" />
      <Path d="M10 13l4 4 8-12" />
    </IconBase>
  );
}

export function Bell(props: IconProps): ReactElement {
  return (
    <IconBase {...props}>
      <Path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 01-3.46 0" />
    </IconBase>
  );
}

export function User(props: IconProps): ReactElement {
  return (
    <IconBase {...props}>
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </IconBase>
  );
}

export function Settings(props: IconProps): ReactElement {
  return (
    <IconBase {...props}>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </IconBase>
  );
}

export function LogOut(props: IconProps): ReactElement {
  return (
    <IconBase {...props}>
      <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <Path d="M16 17l5-5-5-5M21 12H9" />
    </IconBase>
  );
}

export function MessageCircle(props: IconProps): ReactElement {
  return (
    <IconBase {...props}>
      <Path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </IconBase>
  );
}

export function Inbox(props: IconProps): ReactElement {
  return (
    <IconBase {...props}>
      <Path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <Path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </IconBase>
  );
}
