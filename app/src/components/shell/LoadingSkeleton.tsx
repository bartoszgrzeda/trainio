import React from 'react';
import { StyleSheet, View } from 'react-native';

interface LoadingSkeletonProps {
  rows?: number;
  rowHeight?: number;
}

export function LoadingSkeleton({
  rows = 3,
  rowHeight = 16,
}: LoadingSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={`skeleton-row-${index}`}
          style={[
            styles.row,
            {
              height: rowHeight,
              opacity: 1 - index * 0.08,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    borderRadius: 8,
    backgroundColor: '#E5EAF0',
  },
});
