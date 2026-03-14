import React, { useMemo, useState } from 'react';
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
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSearchChange: (query: string) => void;
  onSelectExercise: (option: ExerciseOption) => void;
  onRemoveExercise: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
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
  canMoveUp,
  canMoveDown,
  onSearchChange,
  onSelectExercise,
  onRemoveExercise,
  onMoveUp,
  onMoveDown,
  onAddSet,
  onRemoveSet,
  onChangeSetRepeats,
}: PlanDayExerciseViewProps) {
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);

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
      <View style={styles.fieldHeaderRow}>
        <Text style={styles.fieldLabel}>Exercise</Text>
        <View style={styles.exerciseActionsRow}>
          <Pressable
            testID={`button.planTemplates.day.${dayIndex}.exercise.${exerciseIndex}.move.up`}
            accessibilityRole="button"
            accessibilityLabel={`Move exercise ${exerciseIndex + 1} up`}
            disabled={disabled || !canMoveUp}
            onPress={onMoveUp}
            style={({ pressed }) => [
              styles.moveButton,
              (disabled || !canMoveUp) && styles.buttonDisabled,
              pressed && !(disabled || !canMoveUp) && styles.moveButtonPressed,
            ]}>
            <Text style={styles.moveButtonText}>↑</Text>
          </Pressable>

          <Pressable
            testID={`button.planTemplates.day.${dayIndex}.exercise.${exerciseIndex}.move.down`}
            accessibilityRole="button"
            accessibilityLabel={`Move exercise ${exerciseIndex + 1} down`}
            disabled={disabled || !canMoveDown}
            onPress={onMoveDown}
            style={({ pressed }) => [
              styles.moveButton,
              (disabled || !canMoveDown) && styles.buttonDisabled,
              pressed && !(disabled || !canMoveDown) && styles.moveButtonPressed,
            ]}>
            <Text style={styles.moveButtonText}>↓</Text>
          </Pressable>

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
      </View>
      <View style={styles.searchInputRow}>
        <TextInput
          testID={`input.planTemplates.day.${dayIndex}.exercise.${exerciseIndex}.search`}
          accessibilityLabel={`Search exercise for row ${exerciseIndex + 1}`}
          autoCapitalize="words"
          autoCorrect={false}
          editable={!disabled}
          onFocus={() => {
            setIsOptionsVisible(true);
          }}
          onPressIn={() => {
            setIsOptionsVisible(true);
          }}
          onChangeText={query => {
            onSearchChange(query);
            setIsOptionsVisible(true);
          }}
          placeholder="Search exercises"
          style={styles.searchInput}
          value={value.exerciseSearchQuery}
        />

        <Pressable
          testID={`button.planTemplates.day.${dayIndex}.exercise.${exerciseIndex}.selection.clear`}
          accessibilityRole="button"
          accessibilityLabel={`Clear selected exercise ${exerciseIndex + 1}`}
          disabled={disabled || !value.exerciseId}
          onPress={() => {
            onSelectExercise({ id: '', name: '' });
            setIsOptionsVisible(false);
          }}
          style={({ pressed }) => [
            styles.clearSelectionButton,
            (disabled || !value.exerciseId) && styles.clearSelectionButtonDisabled,
            pressed && !(disabled || !value.exerciseId) && styles.clearSelectionButtonPressed,
          ]}>
          <Text
            style={[
              styles.clearSelectionText,
              !value.exerciseId && styles.clearSelectionTextDisabled,
            ]}>
            X
          </Text>
        </Pressable>
      </View>

      {isOptionsVisible ? (
        visibleOptions.length > 0 ? (
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
                    setIsOptionsVisible(false);
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
        )
      ) : null}

      {errors?.exerciseId ? (
        <Text style={styles.errorText}>{errors.exerciseId}</Text>
      ) : null}

      {errors?.series ? <Text style={styles.errorText}>{errors.series}</Text> : null}

      <View style={styles.setsContainer}>
        {value.series.map((setItem, setIndex) => (
          <View key={setItem.id} style={styles.setItemCell}>
            <ExerciseSetView
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
          </View>
        ))}

        <View style={styles.setItemCell}>
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
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  moveButton: {
    minHeight: 36,
    minWidth: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  moveButtonPressed: {
    backgroundColor: '#DBEAFE',
  },
  moveButtonText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 14,
  },
  searchInputRow: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  clearSelectionButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  clearSelectionButtonPressed: {
    backgroundColor: '#EEF2FF',
  },
  clearSelectionButtonDisabled: {
    opacity: 0.4,
  },
  clearSelectionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  clearSelectionTextDisabled: {
    color: '#CBD5E1',
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
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
  },
  addSetButton: {
    width: '100%',
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  addSetButtonPressed: {
    backgroundColor: '#DBEAFE',
  },
  addSetButtonText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 24,
  },
  setsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setItemCell: {
    width: '48%',
  },
});
