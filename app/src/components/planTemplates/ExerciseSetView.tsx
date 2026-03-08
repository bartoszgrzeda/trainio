import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ExerciseSetDraft, ExerciseSetErrors } from './types';

interface ExerciseSetViewProps {
  dayIndex: number;
  exerciseIndex: number;
  setIndex: number;
  value: ExerciseSetDraft;
  errors?: ExerciseSetErrors;
  disabled?: boolean;
  canRemove: boolean;
  onChangeRepeatsCount: (value: string) => void;
  onRemove: () => void;
}

export function ExerciseSetView({
  dayIndex,
  exerciseIndex,
  setIndex,
  value,
  errors,
  disabled = false,
  canRemove,
  onChangeRepeatsCount,
  onRemove,
}: ExerciseSetViewProps) {
  return (
    <View style={styles.container} testID={`section.planTemplates.day.${dayIndex}.exercise.${exerciseIndex}.set.${setIndex}`}>
      <View style={styles.headerRow}>
        <Text style={styles.setLabel}>{`Set ${setIndex + 1}`}</Text>

        <Pressable
          testID={`button.planTemplates.day.${dayIndex}.exercise.${exerciseIndex}.set.${setIndex}.remove`}
          accessibilityRole="button"
          accessibilityLabel={`Remove set ${setIndex + 1}`}
          disabled={disabled || !canRemove}
          onPress={onRemove}
          style={({ pressed }) => [
            styles.removeButton,
            (disabled || !canRemove) && styles.buttonDisabled,
            pressed && !(disabled || !canRemove) && styles.removeButtonPressed,
          ]}>
          <Text style={styles.removeButtonText}>X</Text>
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>Repeats</Text>
      <TextInput
        testID={`input.planTemplates.day.${dayIndex}.exercise.${exerciseIndex}.set.${setIndex}.repeats`}
        accessibilityLabel={`Set ${setIndex + 1} repeats`}
        editable={!disabled}
        keyboardType="number-pad"
        onChangeText={onChangeRepeatsCount}
        placeholder="Enter repeats"
        style={styles.input}
        value={value.repeatsCount}
      />

      {errors?.repeatsCount ? (
        <Text style={styles.errorText}>{errors.repeatsCount}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4EAF1',
    backgroundColor: '#F8FAFC',
    padding: 10,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  removeButton: {
    minHeight: 36,
    minWidth: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  removeButtonPressed: {
    backgroundColor: '#FEE2E2',
  },
  removeButtonText: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
  },
});
