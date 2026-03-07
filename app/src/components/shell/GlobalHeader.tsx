import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface HeaderAction {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

interface HeaderStatusIndicator {
  onPress: () => void;
  accessibilityLabel: string;
  label?: string;
  disabled?: boolean;
}

interface GlobalHeaderProps {
  title: string;
  leftAction?: HeaderAction;
  rightAction?: HeaderAction;
  statusIndicator?: HeaderStatusIndicator;
}

export function GlobalHeader({
  title,
  leftAction,
  rightAction,
  statusIndicator,
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
        {rightAction || statusIndicator ? (
          <View style={styles.rightSlotActions}>
            {statusIndicator ? (
              <Pressable
                accessibilityLabel={statusIndicator.accessibilityLabel}
                accessibilityRole="button"
                disabled={statusIndicator.disabled}
                onPress={statusIndicator.onPress}
                style={({ pressed }) => [
                  styles.statusButton,
                  statusIndicator.disabled && styles.actionButtonDisabled,
                  pressed &&
                    !statusIndicator.disabled &&
                    styles.statusButtonPressed,
                ]}>
                <Text style={styles.statusButtonText}>
                  {statusIndicator.label ?? '!'}
                </Text>
              </Pressable>
            ) : null}

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
            ) : null}
          </View>
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
  rightSlotActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
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
  statusButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  statusButtonPressed: {
    backgroundColor: '#FEE2E2',
  },
  statusButtonText: {
    fontSize: 17,
    color: '#B91C1C',
    fontWeight: '700',
    lineHeight: 20,
  },
  placeholder: {
    minWidth: 44,
    minHeight: 44,
  },
});
