import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type AppShellRoute = '/home' | '/training' | '/clients' | '/settings';

interface MenuItem {
  label: string;
  route: AppShellRoute;
  icon: string;
}

interface BottomMenuProps {
  activeRoute: AppShellRoute;
  activeTrainingId: string | null;
  onNavigate?: (route: AppShellRoute) => void;
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Home', route: '/home', icon: 'H' },
  { label: 'Training', route: '/training', icon: 'T' },
  { label: 'Clients', route: '/clients', icon: 'C' },
  { label: 'Settings', route: '/settings', icon: 'S' },
];

export const BOTTOM_MENU_HEIGHT = 72;

export function BottomMenu({
  activeRoute,
  activeTrainingId,
  onNavigate,
}: BottomMenuProps) {
  const insets = useSafeAreaInsets();
  const isTrainingDisabled = activeTrainingId == null;

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.row}>
        {MENU_ITEMS.map(item => {
          const isActive = activeRoute === item.route;
          const isDisabled = item.route === '/training' && isTrainingDisabled;

          const handlePress = () => {
            if (isDisabled || !onNavigate) {
              return;
            }

            onNavigate(item.route);
          };

          return (
            <Pressable
              key={item.route}
              accessibilityRole="button"
              disabled={isDisabled}
              onPress={handlePress}
              style={({ pressed }) => [
                styles.item,
                isActive && styles.activeItem,
                isDisabled && styles.disabledItem,
                pressed && !isDisabled && styles.pressedItem,
              ]}>
              <Text style={[styles.icon, isDisabled && styles.disabledText]}>
                {item.icon}
              </Text>
              <Text
                style={[
                  styles.label,
                  isActive && styles.activeLabel,
                  isDisabled && styles.disabledText,
                ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    minHeight: BOTTOM_MENU_HEIGHT,
    borderTopWidth: 1,
    borderTopColor: '#D5DCE5',
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    zIndex: 5,
  },
  row: {
    flexDirection: 'row',
  },
  item: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeItem: {
    backgroundColor: '#E8F0FF',
  },
  disabledItem: {
    opacity: 0.45,
  },
  pressedItem: {
    backgroundColor: '#EDF2FF',
  },
  icon: {
    fontSize: 12,
    color: '#2D3A4A',
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    color: '#2D3A4A',
    fontWeight: '600',
  },
  activeLabel: {
    color: '#1D4ED8',
  },
  disabledText: {
    color: '#8A96A6',
  },
});
