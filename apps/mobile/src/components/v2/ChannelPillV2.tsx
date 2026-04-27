import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  colorsV2,
  EmailMark,
  fontFamily,
  InstagramMark,
  MessengerMark,
  SMSMark,
  TelegramMark,
  WhatsAppMark,
} from '@/theme';

export type ChannelPillChannel =
  | 'whatsapp'
  | 'instagram'
  | 'messenger'
  | 'telegram'
  | 'sms'
  | 'email';

export type ChannelPillV2Props = {
  channel: ChannelPillChannel;
};

const ICON_BY_CHANNEL = {
  whatsapp: WhatsAppMark,
  instagram: InstagramMark,
  messenger: MessengerMark,
  telegram: TelegramMark,
  sms: SMSMark,
  email: EmailMark,
} as const;

const LABEL_BY_CHANNEL: Record<ChannelPillChannel, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  messenger: 'Messenger',
  telegram: 'Telegram',
  sms: 'SMS',
  email: 'Email',
};

const ICON_SIZE = 9;

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ChannelPillV2({ channel }: ChannelPillV2Props): ReactElement {
  const tint = colorsV2.channels[channel];
  const Icon = ICON_BY_CHANNEL[channel];

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: withAlpha(tint, 0.12),
          borderColor: withAlpha(tint, 0.25),
        },
      ]}
    >
      <Icon size={ICON_SIZE} color={tint} />
      <Text
        allowFontScaling={false}
        style={[styles.label, { color: tint }]}
      >
        {LABEL_BY_CHANNEL[channel]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 16,
    paddingHorizontal: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontFamily: fontFamily.inter.semibold,
    fontWeight: '600',
    fontSize: 9,
    letterSpacing: 9 * 0.05,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
});
