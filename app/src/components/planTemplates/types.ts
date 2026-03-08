export interface ExerciseOption {
  id: string;
  name: string;
  source?: string;
}

export interface ExerciseSetDraft {
  id: string;
  repeatsCount: string;
}

export interface PlanDayExerciseDraft {
  id: string;
  exerciseId: string;
  exerciseName: string;
  exerciseSearchQuery: string;
  series: ExerciseSetDraft[];
}

export interface PlanDayDraft {
  id: string;
  name: string;
  exercises: PlanDayExerciseDraft[];
}

export interface ExerciseSetErrors {
  repeatsCount?: string;
}

export interface PlanDayExerciseErrors {
  exerciseId?: string;
  series?: string;
  sets: ExerciseSetErrors[];
}

export interface PlanDayErrors {
  name?: string;
  exercises?: string;
  exerciseItems: PlanDayExerciseErrors[];
}

export interface PlanTemplateErrors {
  name?: string;
  days?: string;
  dayItems: PlanDayErrors[];
}
