import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type StatusBannerTone = 'offline' | 'error' | 'info';

interface StatusBannerProps {
  tone: StatusBannerTone;
  message: string;
}

const TONE_STYLES: Record<
  StatusBannerTone,
  { container: object; text: object }
> = {
  offline: {
    container: {
      backgroundColor: '#FFF7ED',
      borderColor: '#FDBA74',
    },
    text: {
      color: '#9A3412',
    },
  },
  error: {
    container: {
      backgroundColor: '#FEF2F2',
      borderColor: '#FCA5A5',
    },
    text: {
      color: '#991B1B',
    },
  },
  info: {
    container: {
      backgroundColor: '#EFF6FF',
      borderColor: '#93C5FD',
    },
    text: {
      color: '#1E40AF',
    },
  },
};

export function StatusBanner({ tone, message }: StatusBannerProps) {
  return (
    <View style={[styles.container, TONE_STYLES[tone].container]}>
      <Text style={[styles.text, TONE_STYLES[tone].text]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});
