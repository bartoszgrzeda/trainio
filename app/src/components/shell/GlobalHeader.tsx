import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface HeaderAction {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

interface GlobalHeaderProps {
  title: string;
  leftAction?: HeaderAction;
  rightAction?: HeaderAction;
}

export function GlobalHeader({
  title,
  leftAction,
  rightAction,
}: GlobalHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.sideSlot, styles.sideSlotLeft]}>
        {leftAction ? (
          <Pressable
            accessibilityRole="button"
            disabled={leftAction.disabled}
            onPress={leftAction.onPress}
            style={({ pressed }) => [
              styles.actionButton,
              leftAction.disabled && styles.actionButtonDisabled,
              pressed && !leftAction.disabled && styles.actionButtonPressed,
            ]}>
            <Text style={styles.actionText}>{leftAction.label}</Text>
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <View style={styles.titleSlot}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={[styles.sideSlot, styles.sideSlotRight]}>
        {rightAction ? (
          <Pressable
            accessibilityRole="button"
            disabled={rightAction.disabled}
            onPress={rightAction.onPress}
            style={({ pressed }) => [
              styles.actionButton,
              rightAction.disabled && styles.actionButtonDisabled,
              pressed && !rightAction.disabled && styles.actionButtonPressed,
            ]}>
            <Text style={styles.actionText}>{rightAction.label}</Text>
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5EAF0',
    borderBottomWidth: 1,
  },
  sideSlot: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  sideSlotLeft: {
    alignItems: 'flex-start',
  },
  sideSlotRight: {
    alignItems: 'flex-end',
  },
  titleSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  actionButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  actionButtonPressed: {
    backgroundColor: '#E0E7FF',
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionText: {
    fontSize: 14,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  placeholder: {
    minWidth: 44,
    minHeight: 44,
  },
});
