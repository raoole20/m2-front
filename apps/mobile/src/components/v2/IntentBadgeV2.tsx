import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colorsV2, fontFamily, type V2Intent } from '@/theme';

export type IntentBadgeV2Props = {
  intent: V2Intent;
};

const LABEL_BY_INTENT: Record<V2Intent, string> = {
  pricing: 'Pricing',
  support: 'Support',
  lead: 'Lead',
  urgent: 'Urgent',
};

const DOT_SIZE = 5;

export function IntentBadgeV2({ intent }: IntentBadgeV2Props): ReactElement {
  const tint = colorsV2.intent[intent];

  return (
    <View style={styles.row}>
      <View style={styles.dotWrapper}>
        <View
          style={[
            styles.halo,
            {
              backgroundColor: tint,
              shadowColor: tint,
            },
          ]}
        />
        <View
          style={[
            styles.dot,
            {
              backgroundColor: tint,
              shadowColor: tint,
            },
          ]}
        />
      </View>
      <Text
        allowFontScaling={false}
        style={[styles.label, { color: tint }]}
      >
        {LABEL_BY_INTENT[intent]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dotWrapper: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 2,
    elevation: 4,
  },
  halo: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    opacity: 0.45,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  label: {
    fontFamily: fontFamily.inter.semibold,
    fontWeight: '600',
    fontSize: 10,
    letterSpacing: 10 * 0.06,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
});
