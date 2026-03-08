import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ExerciseSetView } from './ExerciseSetView';
import {
  ExerciseOption,
  PlanDayExerciseDraft,
  PlanDayExerciseErrors,
} from './types';

interface PlanDayExerciseViewProps {
  dayIndex: number;
  exerciseIndex: number;
  value: PlanDayExerciseDraft;
  errors?: PlanDayExerciseErrors;
  exerciseOptions: ExerciseOption[];
  disabled?: boolean;
  canRemoveExercise: boolean;
  onSearchChange: (query: string) => void;
  onSelectExercise: (option: ExerciseOption) => void;
  onRemoveExercise: () => void;
  onAddSet: () => void;
  onRemoveSet: (setIndex: number) => void;
  onChangeSetRepeats: (setIndex: number, value: string) => void;
}

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function PlanDayExerciseView({
  dayIndex,
  exerciseIndex,
  value,
  errors,
  exerciseOptions,
  disabled = false,
  canRemoveExercise,
  onSearchChange,
  onSelectExercise,
  onRemoveExercise,
  onAddSet,
  onRemoveSet,
  onChangeSetRepeats,
}: PlanDayExerciseViewProps) {
  const visibleOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(value.exerciseSearchQuery);

    if (!normalizedQuery) {
      return exerciseOptions.slice(0, 8);
    }

    return exerciseOptions
      .filter(option => normalizeSearchValue(option.name).includes(normalizedQuery))
      .slice(0, 8);
  }, [exerciseOptions, value.exerciseSearchQuery]);

  return (
    <View
      style={styles.container}
      testID={`section.planTemplates.day.${dayIndex}.exercise.${exerciseIndex}`}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{`Exercise ${exerciseIndex + 1}`}</Text>

        <Pressable
          testID={`button.planTemplates.day.${dayIndex}.exercise.${exerciseIndex}.remove`}
          accessibilityRole="button"
          accessibilityLabel={`Remove exercise ${exerciseIndex + 1}`}
          disabled={disabled || !canRemoveExercise}
          onPress={onRemoveExercise}
          style={({ pressed }) => [
            styles.removeButton,
            (disabled || !canRemoveExercise) && styles.buttonDisabled,
            pressed && !(disabled || !canRemoveExercise) && styles.removeButtonPressed,
          ]}>
          <Text style={styles.removeButtonText}>X</Text>
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>Exercise</Text>
      <TextInput
        testID={`input.planTemplates.day.${dayIndex}.exercise.${exerciseIndex}.search`}
        accessibilityLabel={`Search exercise for row ${exerciseIndex + 1}`}
        autoCapitalize="words"
        autoCorrect={false}
        editable={!disabled}
        onChangeText={onSearchChange}
        placeholder="Search exercises"
        style={styles.input}
        value={value.exerciseSearchQuery}
      />

      {visibleOptions.length > 0 ? (
        <View style={styles.optionsList}>
          {visibleOptions.map(option => {
            const isSelected = option.id === value.exerciseId;

            return (
              <Pressable
                key={option.id}
                testID={`item.planTemplates.day.${dayIndex}.exercise.${exerciseIndex}.option.${option.id}`}
                accessibilityRole="button"
                disabled={disabled}
                onPress={() => {
                  onSelectExercise(option);
                }}
                style={({ pressed }) => [
                  styles.optionRow,
                  isSelected && styles.optionRowSelected,
                  pressed && !disabled && styles.optionRowPressed,
                ]}>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyOptionsText}>No exercises found.</Text>
      )}

      {value.exerciseId ? (
        <Text style={styles.selectedText}>Selected: {value.exerciseName || 'Unknown exercise'}</Text>
      ) : null}

      {errors?.exerciseId ? (
        <Text style={styles.errorText}>{errors.exerciseId}</Text>
      ) : null}

      <View style={styles.setsHeaderRow}>
        <Text style={styles.setsTitle}>Sets</Text>

        <Pressable
          testID={`button.planTemplates.day.${dayIndex}.exercise.${exerciseIndex}.set.add`}
          accessibilityRole="button"
          accessibilityLabel={`Add set to exercise ${exerciseIndex + 1}`}
          disabled={disabled}
          onPress={onAddSet}
          style={({ pressed }) => [
            styles.addSetButton,
            disabled && styles.buttonDisabled,
            pressed && !disabled && styles.addSetButtonPressed,
          ]}>
          <Text style={styles.addSetButtonText}>+</Text>
        </Pressable>
      </View>

      {errors?.series ? <Text style={styles.errorText}>{errors.series}</Text> : null}

      <View style={styles.setsContainer}>
        {value.series.map((setItem, setIndex) => (
          <ExerciseSetView
            key={setItem.id}
            dayIndex={dayIndex}
            exerciseIndex={exerciseIndex}
            setIndex={setIndex}
            value={setItem}
            errors={errors?.sets[setIndex]}
            disabled={disabled}
            canRemove={value.series.length > 1}
            onChangeRepeatsCount={nextValue => {
              onChangeSetRepeats(setIndex, nextValue);
            }}
            onRemove={() => {
              onRemoveSet(setIndex);
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
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
    color: '#334155',
    fontSize: 13,
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
  optionsList: {
    gap: 6,
  },
  optionRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionRowSelected: {
    borderColor: '#60A5FA',
    backgroundColor: '#EFF6FF',
  },
  optionRowPressed: {
    backgroundColor: '#EEF2FF',
  },
  optionText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  emptyOptionsText: {
    fontSize: 13,
    color: '#64748B',
  },
  selectedText: {
    color: '#0369A1',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
  },
  setsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  setsTitle: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
  },
  addSetButton: {
    minHeight: 36,
    minWidth: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
  },
  addSetButtonPressed: {
    backgroundColor: '#1E40AF',
  },
  addSetButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 20,
  },
  setsContainer: {
    gap: 8,
  },
});
