import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ExerciseSetView } from './ExerciseSetView';
import { SearchableSelectModal } from '../shared/SearchableSelectModal';
import {
  ExerciseOption,
  PlanDayExerciseDraft,
  PlanDayExerciseErrors,
} from './types';

interface PlanDayExerciseViewProps {
  dayIndex: number;
  exerciseIndex: number;
  testIdPrefix?: string;
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
  testIdPrefix = 'planTemplates',
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
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const visibleOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(value.exerciseSearchQuery);

    if (!normalizedQuery) {
      return exerciseOptions;
    }

    return exerciseOptions.filter(option =>
      normalizeSearchValue(option.name).includes(normalizedQuery),
    );
  }, [exerciseOptions, value.exerciseSearchQuery]);

  const selectedExerciseLabel =
    value.exerciseId.trim().length > 0 && value.exerciseName.trim().length > 0
      ? value.exerciseName
      : 'Select exercise';

  return (
    <View
      style={styles.container}
      testID={`section.${testIdPrefix}.day.${dayIndex}.exercise.${exerciseIndex}`}>
      <View style={styles.fieldHeaderRow}>
        <Text style={styles.fieldLabel}>Exercise</Text>
        <View style={styles.exerciseActionsRow}>
          <Pressable
            testID={`button.${testIdPrefix}.day.${dayIndex}.exercise.${exerciseIndex}.move.up`}
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
            testID={`button.${testIdPrefix}.day.${dayIndex}.exercise.${exerciseIndex}.move.down`}
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
            testID={`button.${testIdPrefix}.day.${dayIndex}.exercise.${exerciseIndex}.remove`}
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
        <Pressable
          testID={`input.${testIdPrefix}.day.${dayIndex}.exercise.${exerciseIndex}.search`}
          accessibilityRole="button"
          accessibilityLabel={`Select exercise for row ${exerciseIndex + 1}`}
          disabled={disabled}
          onPress={() => {
            setIsPickerVisible(true);
          }}
          style={({ pressed }) => [
            styles.searchInputButton,
            disabled && styles.buttonDisabled,
            pressed && !disabled && styles.searchInputButtonPressed,
          ]}>
          <Text
            style={[
              styles.searchInputValueText,
              value.exerciseId.trim().length === 0 && styles.searchInputPlaceholderText,
            ]}>
            {selectedExerciseLabel}
          </Text>
        </Pressable>

        <Pressable
          testID={`button.${testIdPrefix}.day.${dayIndex}.exercise.${exerciseIndex}.selection.clear`}
          accessibilityRole="button"
          accessibilityLabel={`Clear selected exercise ${exerciseIndex + 1}`}
          disabled={disabled || !value.exerciseId}
          onPress={() => {
            onSelectExercise({ id: '', name: '' });
            setIsPickerVisible(false);
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
              testIdPrefix={testIdPrefix}
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
            testID={`button.${testIdPrefix}.day.${dayIndex}.exercise.${exerciseIndex}.set.add`}
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

      <SearchableSelectModal
        visible={isPickerVisible}
        title="Select exercise"
        options={visibleOptions}
        disabled={disabled}
        isLoading={false}
        selectedOptionId={value.exerciseId}
        emptyMessage="No exercises found."
        searchValue={value.exerciseSearchQuery}
        searchPlaceholder="Search exercises"
        searchAccessibilityLabel={`Search exercise options for row ${exerciseIndex + 1}`}
        getOptionLabel={option => option.name}
        onSearchChange={onSearchChange}
        onSelectOption={option => {
          onSelectExercise(option);
          setIsPickerVisible(false);
        }}
        onRequestClose={() => setIsPickerVisible(false)}
        getOptionTestID={option =>
          `item.${testIdPrefix}.day.${dayIndex}.exercise.${exerciseIndex}.option.${option.id}`
        }
        closeButtonTestID={`button.${testIdPrefix}.day.${dayIndex}.exercise.${exerciseIndex}.search.close`}
        searchInputTestID={`input.${testIdPrefix}.day.${dayIndex}.exercise.${exerciseIndex}.search.query`}
        clearSearchButtonTestID={`button.${testIdPrefix}.day.${dayIndex}.exercise.${exerciseIndex}.search.clear`}
        listTestID={`list.${testIdPrefix}.day.${dayIndex}.exercise.${exerciseIndex}.options`}
      />
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
  searchInputButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInputButtonPressed: {
    backgroundColor: '#F8FAFC',
  },
  searchInputValueText: {
    fontSize: 16,
    color: '#111827',
  },
  searchInputPlaceholderText: {
    color: '#9CA3AF',
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
