import {
  ExerciseOption,
  ExerciseSetDraft,
  ExerciseSetErrors,
  PlanDayDraft,
  PlanDayErrors,
  PlanDayExerciseDraft,
  PlanDayExerciseErrors,
  PlanTemplateErrors,
} from '../components/planTemplates/types';

export interface PlanTemplateExerciseSetRequest {
  repeatsCount: number;
}

export interface PlanTemplateDayExerciseRequest {
  exerciseId: string;
  order: number;
  series: PlanTemplateExerciseSetRequest[];
}

export interface PlanTemplateDayRequest {
  name: string;
  exercises: PlanTemplateDayExerciseRequest[];
}

export interface PlanTemplateMutationRequest {
  id?: string;
  name: string;
  days: PlanTemplateDayRequest[];
}

export interface PlanTemplateExerciseSetResponse {
  repeatsCount: number;
}

export interface PlanTemplateDayExerciseResponse {
  exerciseId: string;
  order: number;
  series: PlanTemplateExerciseSetResponse[];
}

export interface PlanTemplateDayResponse {
  name: string;
  exercises: PlanTemplateDayExerciseResponse[];
}

export interface PlanTemplateResponse {
  id: string;
  name: string;
  days: PlanTemplateDayResponse[];
}

export interface ApiError extends Error {
  status?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: PlanTemplateErrors;
}

let localIdCounter = 0;

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const PLAN_NAME_INVALID_MESSAGE = 'Plan name is invalid.';
export const PLAN_DAY_NAME_INVALID_MESSAGE = 'Plan day name is invalid.';
export const PLAN_DAYS_REQUIRED_MESSAGE = 'At least one day is required.';
export const PLAN_DAY_EXERCISES_REQUIRED_MESSAGE =
  'At least one exercise is required in each day.';
export const EXERCISE_SELECTION_INVALID_MESSAGE = 'Exercise selection is invalid.';
export const EXERCISE_SETS_REQUIRED_MESSAGE =
  'At least one set is required for each exercise.';
export const REPEATS_COUNT_INVALID_MESSAGE =
  'Repeats count must be between 1 and 1000.';

function nextLocalId(prefix: string): string {
  localIdCounter += 1;
  return `${prefix}-${localIdCounter}`;
}

export function createExerciseSetDraft(repeatsCount = '1'): ExerciseSetDraft {
  return {
    id: nextLocalId('set'),
    repeatsCount,
  };
}

export function createPlanDayExerciseDraft(): PlanDayExerciseDraft {
  return {
    id: nextLocalId('exercise'),
    exerciseId: '',
    exerciseName: '',
    exerciseSearchQuery: '',
    series: [createExerciseSetDraft()],
  };
}

export function createPlanDayDraft(dayIndex: number): PlanDayDraft {
  return {
    id: nextLocalId('day'),
    name: `Day ${dayIndex + 1}`,
    exercises: [createPlanDayExerciseDraft()],
  };
}

export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeName(value: string): string {
  return value.trim();
}

function parseRepeatsCount(value: string): number | null {
  const normalized = value.trim();

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

function isValidGuid(value: string): boolean {
  return GUID_REGEX.test(value.trim());
}

export function createApiError(status: number, message: string): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  return error;
}

export function isOfflineError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return /offline|internet|network/i.test(error.message);
}

export function sortExerciseOptionsByName(options: ExerciseOption[]): ExerciseOption[] {
  return options
    .map((option, index) => ({ option, index }))
    .sort((left, right) => {
      const nameComparison = left.option.name.localeCompare(right.option.name, undefined, {
        sensitivity: 'base',
      });

      if (nameComparison !== 0) {
        return nameComparison;
      }

      const idComparison = left.option.id.localeCompare(right.option.id, undefined, {
        sensitivity: 'base',
      });

      if (idComparison !== 0) {
        return idComparison;
      }

      return left.index - right.index;
    })
    .map(item => item.option);
}

export function dedupeExerciseOptions(options: ExerciseOption[]): ExerciseOption[] {
  const seen = new Set<string>();

  return options.filter(option => {
    if (seen.has(option.id)) {
      return false;
    }

    seen.add(option.id);
    return true;
  });
}

function createEmptySetErrors(setCount: number): ExerciseSetErrors[] {
  return Array.from({ length: setCount }, () => ({}));
}

function createEmptyExerciseErrors(
  exercise: PlanDayExerciseDraft,
): PlanDayExerciseErrors {
  return {
    sets: createEmptySetErrors(exercise.series.length),
  };
}

function createEmptyDayErrors(day: PlanDayDraft): PlanDayErrors {
  return {
    exerciseItems: day.exercises.map(createEmptyExerciseErrors),
  };
}

export function createEmptyErrors(days: PlanDayDraft[]): PlanTemplateErrors {
  return {
    dayItems: days.map(createEmptyDayErrors),
  };
}

export function validatePlanTemplateDraft(
  name: string,
  days: PlanDayDraft[],
): ValidationResult {
  const errors = createEmptyErrors(days);
  let isValid = true;

  const normalizedName = normalizeName(name);
  if (normalizedName.length === 0 || normalizedName.length > 200) {
    errors.name = PLAN_NAME_INVALID_MESSAGE;
    isValid = false;
  }

  if (days.length === 0) {
    errors.days = PLAN_DAYS_REQUIRED_MESSAGE;
    return {
      isValid: false,
      errors,
    };
  }

  days.forEach((day, dayIndex) => {
    const dayErrors = errors.dayItems[dayIndex];

    const normalizedDayName = normalizeName(day.name);
    if (normalizedDayName.length === 0 || normalizedDayName.length > 128) {
      dayErrors.name = PLAN_DAY_NAME_INVALID_MESSAGE;
      isValid = false;
    }

    if (day.exercises.length === 0) {
      dayErrors.exercises = PLAN_DAY_EXERCISES_REQUIRED_MESSAGE;
      isValid = false;
      return;
    }

    day.exercises.forEach((exercise, exerciseIndex) => {
      const exerciseErrors = dayErrors.exerciseItems[exerciseIndex];

      if (!isValidGuid(exercise.exerciseId)) {
        exerciseErrors.exerciseId = EXERCISE_SELECTION_INVALID_MESSAGE;
        isValid = false;
      }

      if (exercise.series.length === 0) {
        exerciseErrors.series = EXERCISE_SETS_REQUIRED_MESSAGE;
        isValid = false;
        return;
      }

      exercise.series.forEach((setItem, setIndex) => {
        const parsedRepeats = parseRepeatsCount(setItem.repeatsCount);
        if (parsedRepeats == null || parsedRepeats < 1 || parsedRepeats > 1000) {
          exerciseErrors.sets[setIndex] = {
            repeatsCount: REPEATS_COUNT_INVALID_MESSAGE,
          };
          isValid = false;
        }
      });
    });
  });

  return {
    isValid,
    errors,
  };
}

export function buildMutationPayload(
  templateId: string | undefined,
  name: string,
  days: PlanDayDraft[],
): PlanTemplateMutationRequest {
  return {
    ...(templateId ? { id: templateId } : {}),
    name: normalizeName(name),
    days: days.map(day => ({
      name: normalizeName(day.name),
      exercises: day.exercises.map((exercise, exerciseIndex) => ({
        exerciseId: exercise.exerciseId,
        order: exerciseIndex,
        series: exercise.series.map(setItem => ({
          repeatsCount: Number.parseInt(setItem.repeatsCount.trim(), 10),
        })),
      })),
    })),
  };
}

export function buildComparableSnapshot(name: string, days: PlanDayDraft[]): string {
  return JSON.stringify({
    name: normalizeName(name),
    days: days.map(day => ({
      name: normalizeName(day.name),
      exercises: day.exercises.map(exercise => ({
        exerciseId: exercise.exerciseId.trim(),
        series: exercise.series.map(setItem => setItem.repeatsCount.trim()),
      })),
    })),
  });
}

export function mapResponseToDraft(
  response: PlanTemplateResponse,
  exerciseOptions: ExerciseOption[],
): {
  id: string;
  name: string;
  days: PlanDayDraft[];
} {
  const exerciseNameLookup = new Map(exerciseOptions.map(item => [item.id, item.name]));

  const mappedDays = response.days.map((day, dayIndex) => {
    const orderedExercises = day.exercises
      .map((exercise, exerciseIndex) => ({ exercise, exerciseIndex }))
      .sort((left, right) => {
        const leftOrder = Number.isFinite(left.exercise.order)
          ? left.exercise.order
          : left.exerciseIndex;
        const rightOrder = Number.isFinite(right.exercise.order)
          ? right.exercise.order
          : right.exerciseIndex;

        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }

        return left.exerciseIndex - right.exerciseIndex;
      });

    const mappedExercises = orderedExercises.map(({ exercise }) => {
      const resolvedExerciseName =
        exerciseNameLookup.get(exercise.exerciseId) ?? 'Unknown exercise';

      return {
        id: nextLocalId('exercise'),
        exerciseId: exercise.exerciseId,
        exerciseName: resolvedExerciseName,
        exerciseSearchQuery: resolvedExerciseName,
        series: exercise.series.map(setItem => ({
          id: nextLocalId('set'),
          repeatsCount: setItem.repeatsCount.toString(),
        })),
      };
    });

    return {
      id: nextLocalId('day'),
      name: day.name || `Day ${dayIndex + 1}`,
      exercises:
        mappedExercises.length > 0
          ? mappedExercises
          : [createPlanDayExerciseDraft()],
    };
  });

  return {
    id: response.id,
    name: response.name,
    days: mappedDays.length > 0 ? mappedDays : [createPlanDayDraft(0)],
  };
}
