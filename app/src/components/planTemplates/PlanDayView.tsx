import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PlanDayExerciseView } from './PlanDayExerciseView';
import {
  ExerciseOption,
  PlanDayDraft,
  PlanDayErrors,
} from './types';

interface PlanDayViewProps {
  dayIndex: number;
  value: PlanDayDraft;
  errors?: PlanDayErrors;
  topSlot?: React.ReactNode;
  topSlotError?: string;
  showDayHeader?: boolean;
  exerciseOptions: ExerciseOption[];
  disabled?: boolean;
  canRemoveDay: boolean;
  onChangeName: (value: string) => void;
  onRemoveDay: () => void;
  onAddExercise: () => void;
  onRemoveExercise: (exerciseIndex: number) => void;
  onMoveExerciseUp: (exerciseIndex: number) => void;
  onMoveExerciseDown: (exerciseIndex: number) => void;
  onExerciseSearchChange: (exerciseIndex: number, query: string) => void;
  onSelectExercise: (exerciseIndex: number, exerciseId: string, exerciseName: string) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onChangeSetRepeats: (exerciseIndex: number, setIndex: number, value: string) => void;
}

export function PlanDayView({
  dayIndex,
  value,
  errors,
  topSlot,
  topSlotError,
  showDayHeader = true,
  exerciseOptions,
  disabled = false,
  canRemoveDay,
  onChangeName,
  onRemoveDay,
  onAddExercise,
  onRemoveExercise,
  onMoveExerciseUp,
  onMoveExerciseDown,
  onExerciseSearchChange,
  onSelectExercise,
  onAddSet,
  onRemoveSet,
  onChangeSetRepeats,
}: PlanDayViewProps) {
  return (
    <View style={styles.container} testID={`section.planTemplates.day.${dayIndex}.editor`}>
      {topSlot ? (
        <View style={styles.topSlotContainer}>
          {topSlot}
          {topSlotError ? <Text style={styles.errorText}>{topSlotError}</Text> : null}
        </View>
      ) : null}

      {showDayHeader ? (
        <View style={styles.headerRow}>
          <Text style={styles.dayTitle}>{`Day ${dayIndex + 1}`}</Text>

          <Pressable
            testID={`button.planTemplates.day.${dayIndex}.remove`}
            accessibilityRole="button"
            accessibilityLabel={`Remove day ${dayIndex + 1}`}
            disabled={disabled || !canRemoveDay}
            onPress={onRemoveDay}
            style={({ pressed }) => [
              styles.removeDayButton,
              (disabled || !canRemoveDay) && styles.buttonDisabled,
              pressed && !(disabled || !canRemoveDay) && styles.removeDayButtonPressed,
            ]}>
            <Text style={styles.removeDayButtonText}>X</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.fieldLabel}>Day name</Text>
      <TextInput
        testID={`input.planTemplates.day.${dayIndex}.name`}
        accessibilityLabel={`Plan day ${dayIndex + 1} name`}
        autoCapitalize="words"
        autoCorrect={false}
        editable={!disabled}
        onChangeText={onChangeName}
        placeholder="Enter day name"
        style={styles.input}
        value={value.name}
      />

      {errors?.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

      <View style={styles.exercisesHeaderRow}>
        <Text style={styles.exercisesTitle}>Exercises</Text>

        <Pressable
          testID={`button.planTemplates.day.${dayIndex}.exercise.add`}
          accessibilityRole="button"
          accessibilityLabel={`Add exercise to day ${dayIndex + 1}`}
          disabled={disabled}
          onPress={onAddExercise}
          style={({ pressed }) => [
            styles.addExerciseButton,
            disabled && styles.buttonDisabled,
            pressed && !disabled && styles.addExerciseButtonPressed,
          ]}>
          <Text style={styles.addExerciseButtonText}>+</Text>
        </Pressable>
      </View>

      {errors?.exercises ? <Text style={styles.errorText}>{errors.exercises}</Text> : null}

      <View style={styles.exerciseRowsContainer}>
        {value.exercises.map((exercise, exerciseIndex) => (
          <PlanDayExerciseView
            key={exercise.id}
            dayIndex={dayIndex}
            exerciseIndex={exerciseIndex}
            value={exercise}
            errors={errors?.exerciseItems[exerciseIndex]}
            exerciseOptions={exerciseOptions}
            disabled={disabled}
            canRemoveExercise={value.exercises.length > 1}
            canMoveUp={exerciseIndex > 0}
            canMoveDown={exerciseIndex < value.exercises.length - 1}
            onSearchChange={query => {
              onExerciseSearchChange(exerciseIndex, query);
            }}
            onSelectExercise={option => {
              onSelectExercise(exerciseIndex, option.id, option.name);
            }}
            onRemoveExercise={() => {
              onRemoveExercise(exerciseIndex);
            }}
            onMoveUp={() => {
              onMoveExerciseUp(exerciseIndex);
            }}
            onMoveDown={() => {
              onMoveExerciseDown(exerciseIndex);
            }}
            onAddSet={() => {
              onAddSet(exerciseIndex);
            }}
            onRemoveSet={setIndex => {
              onRemoveSet(exerciseIndex, setIndex);
            }}
            onChangeSetRepeats={(setIndex, nextValue) => {
              onChangeSetRepeats(exerciseIndex, setIndex, nextValue);
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  topSlotContainer: {
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  removeDayButton: {
    minHeight: 36,
    minWidth: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  removeDayButtonPressed: {
    backgroundColor: '#FEE2E2',
  },
  removeDayButtonText: {
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
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
  },
  exercisesHeaderRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exercisesTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  addExerciseButton: {
    minHeight: 36,
    minWidth: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
  },
  addExerciseButtonPressed: {
    backgroundColor: '#1E40AF',
  },
  addExerciseButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 20,
  },
  exerciseRowsContainer: {
    gap: 10,
  },
});
