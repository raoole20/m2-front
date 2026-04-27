import type { ReactElement } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { IconProps } from './IconBase';

const DEFAULT_SIZE = 20;
const DEFAULT_COLOR = '#fff';

export function WhatsAppMark({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
}: IconProps): ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.2-.7.2s-.8.9-1 1.1c-.2.2-.4.2-.7 0-.3-.1-1.2-.5-2.3-1.4-.9-.7-1.4-1.7-1.6-2-.2-.3 0-.5.1-.7.1-.1.3-.4.4-.5.1-.2.2-.3.2-.5.1-.2 0-.4 0-.5-.1-.2-.6-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.8 1.2 3c.1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.2-.3-.3-.6-.5zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.4.8 3 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
    </Svg>
  );
}

export function InstagramMark({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
}: IconProps): ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7}>
      <Rect x="3" y="3" width="18" height="18" rx="5" />
      <Circle cx="12" cy="12" r="4" />
      <Circle cx="17.5" cy="6.5" r="0.6" fill={color} />
    </Svg>
  );
}

export function MessengerMark({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
}: IconProps): ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2C6.5 2 2 6.2 2 11.4c0 2.9 1.4 5.5 3.7 7.2v3.5l3.4-1.9c.9.3 1.9.4 2.9.4 5.5 0 10-4.2 10-9.4S17.5 2 12 2zm1 12.6l-2.5-2.7L5.6 14.6l5.4-5.7 2.6 2.7 4.8-2.6-5.4 5.6z" />
    </Svg>
  );
}

export function TelegramMark({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
}: IconProps): ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M22 3L2 11l6 2 2 7 4-4 5 4 3-17zM10 14l8-7-6 8v3l-2-4z" />
    </Svg>
  );
}

export function SMSMark({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
}: IconProps): ReactElement {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      <Path d="M8 11h.01M12 11h.01M16 11h.01" />
    </Svg>
  );
}

export function EmailMark({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
}: IconProps): ReactElement {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x="2" y="4" width="20" height="16" rx="2" />
      <Path d="M22 6l-10 7L2 6" />
    </Svg>
  );
}
