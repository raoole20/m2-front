import type { ReactElement } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

import { fontFamily } from '@/theme';

export type StatusBarV2Props = {
  time?: string;
};

const ICON_COLOR = '#ffffff';

function SignalIcon(): ReactElement {
  return (
    <Svg width={17} height={11} viewBox="0 0 17 11">
      <Rect x={0} y={7} width={3} height={4} rx={0.5} fill={ICON_COLOR} />
      <Rect x={4.5} y={5} width={3} height={6} rx={0.5} fill={ICON_COLOR} />
      <Rect x={9} y={2.5} width={3} height={8.5} rx={0.5} fill={ICON_COLOR} />
      <Rect x={13.5} y={0} width={3} height={11} rx={0.5} fill={ICON_COLOR} />
    </Svg>
  );
}

function WifiIcon(): ReactElement {
  return (
    <Svg width={15} height={11} viewBox="0 0 15 11" fill="none">
      <Path
        d="M7.5 9.5a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z"
        fill={ICON_COLOR}
      />
      <Path
        d="M3.5 6.2a5.7 5.7 0 018 0"
        stroke={ICON_COLOR}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M1 3.6a9.3 9.3 0 0113 0"
        stroke={ICON_COLOR}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BatteryIcon(): ReactElement {
  return (
    <Svg width={27} height={12} viewBox="0 0 27 12" fill="none">
      <Rect
        x={0.5}
        y={0.5}
        width={22}
        height={11}
        rx={2.5}
        stroke={ICON_COLOR}
        strokeOpacity={0.45}
      />
      <Rect x={2} y={2} width={19} height={8} rx={1.5} fill={ICON_COLOR} />
      <Rect
        x={24}
        y={4}
        width={2}
        height={4}
        rx={1}
        fill={ICON_COLOR}
        fillOpacity={0.45}
      />
    </Svg>
  );
}

export function StatusBarV2({ time = '9:41' }: StatusBarV2Props): ReactElement {
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'ios' ? insets.top : 0;

  return (
    <View style={[styles.container, { paddingTop }]}>
      <View style={styles.inner}>
        <Text allowFontScaling={false} style={styles.time}>
          {time}
        </Text>
        <View style={styles.icons}>
          <SignalIcon />
          <WifiIcon />
          <BatteryIcon />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inner: {
    height: 44,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    fontFamily: fontFamily.inter.semibold,
    fontWeight: '600',
    fontSize: 17,
    color: '#ffffff',
    includeFontPadding: false,
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
