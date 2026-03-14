import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppShellRoute,
  BOTTOM_MENU_HEIGHT,
  BottomMenu,
} from '../components/shell/BottomMenu';
import { GlobalHeader } from '../components/shell/GlobalHeader';
import { LoadingSkeleton } from '../components/shell/LoadingSkeleton';
import { StatusBanner, StatusBannerTone } from '../components/shell/StatusBanner';
import { SearchableSelectModal } from '../components/shared/SearchableSelectModal';
import { PlanDayView } from '../components/planTemplates/PlanDayView';
import { ExerciseOption, PlanDayDraft } from '../components/planTemplates/types';
import { getApiBaseUrl } from '../config/api';
import {
  ApiError,
  buildComparableSnapshot,
  createApiError,
  createPlanDayDraft,
  createPlanDayExerciseDraft,
  createExerciseSetDraft,
  dedupeExerciseOptions,
  isOfflineError,
  PlanTemplateResponse,
  sortExerciseOptionsByName,
  validatePlanTemplateDraft,
} from './planTemplateEditorUtils';

type ClientTrainingPlanViewState =
  | 'loading'
  | 'default'
  | 'empty'
  | 'error'
  | 'offline'
  | 'disabled'
  | 'notFound';

interface ClientTrainingPlanDraft {
  clientId: string;
  name: string;
  days: PlanDayDraft[];
  activeDayIndex: number;
  isSaving: boolean;
  isCopying: boolean;
  forceDirty: boolean;
}

interface SourceSetResponse {
  repeatsCount?: number;
}

interface SourceExerciseResponse {
  exerciseId?: string;
  series?: SourceSetResponse[];
}

interface SourceDayResponse {
  name?: string;
  exercises?: SourceExerciseResponse[];
}

interface PlanTemplateListItem {
  id: string;
  name: string;
}

interface PlanTemplateListItemResponse {
  id?: string;
  name?: string;
}

interface PlanTemplatesListResponse {
  planTemplates?: PlanTemplateListItemResponse[];
  templates?: PlanTemplateListItemResponse[];
}

interface ClientTrainingPlanResponse {
  clientId?: string;
  name?: string;
  days?: SourceDayResponse[];
}

interface UpdatedClientTrainingPlanResponse {
  clientId?: string;
  name?: string;
  days?: SourceDayResponse[];
  updatedAt?: string;
}

interface ClientTrainingPlanSetRequest {
  repeatsCount: number;
}

interface ClientTrainingPlanExerciseRequest {
  exerciseId: string;
  series: ClientTrainingPlanSetRequest[];
}

interface ClientTrainingPlanDayRequest {
  name: string;
  exercises: ClientTrainingPlanExerciseRequest[];
}

interface UpdateClientTrainingPlanRequest {
  clientId: string;
  name: string;
  days: ClientTrainingPlanDayRequest[];
}

interface ExercisesResponse {
  exercises?: ExerciseOption[];
}

interface ErrorResponse {
  message?: string;
}

interface BannerState {
  tone: StatusBannerTone;
  message: string;
}

interface NavigationLike {
  navigate: (route: string) => void;
  goBack?: () => void;
  replace?: (route: string) => void;
}

interface ClientTrainingPlanScreenProps {
  navigation?: NavigationLike;
  activeTrainingId?: string | null;
  clientId: string;
}

const API_BASE_URL = getApiBaseUrl();
const TEST_ID_PREFIX = 'clientsTrainingPlan';

const OFFLINE_MESSAGE = 'No internet connection';
const LOAD_CLIENT_TRAINING_PLAN_ERROR_MESSAGE =
  'Could not load client training plan. Try again.';
const LOAD_EXERCISES_ERROR_MESSAGE = 'Could not load exercises list. Try again.';
const LOAD_PLAN_TEMPLATES_ERROR_MESSAGE = 'Could not load plan templates. Try again.';
const COPY_FROM_TEMPLATE_ERROR_MESSAGE = 'Could not copy plan template. Try again.';
const UPDATE_CLIENT_TRAINING_PLAN_ERROR_MESSAGE =
  'Could not update client training plan. Try again.';
const CLIENT_NOT_FOUND_MESSAGE = 'Client not found.';
const COPY_SUCCESS_MESSAGE = 'Plan copied to form';
const SAVE_SUCCESS_MESSAGE = 'Client training plan saved';
const TEMPLATE_PICKER_EMPTY_MESSAGE = 'No plan templates available.';

function buildInitialDraft(clientId: string): ClientTrainingPlanDraft {
  return {
    clientId,
    name: '',
    days: [],
    activeDayIndex: 0,
    isSaving: false,
    isCopying: false,
    forceDirty: false,
  };
}

function cloneDay(day: PlanDayDraft): PlanDayDraft {
  return {
    ...day,
    exercises: day.exercises.map(exercise => ({
      ...exercise,
      series: exercise.series.map(setItem => ({ ...setItem })),
    })),
  };
}

function resolveDayLabel(day: PlanDayDraft, index: number): string {
  const normalizedName = day.name.trim();
  if (normalizedName.length === 0) {
    return `Day ${index + 1}`;
  }

  return normalizedName;
}

function resolveInteractiveState(
  name: string,
  days: PlanDayDraft[],
): ClientTrainingPlanViewState {
  return name.trim().length === 0 && days.length === 0 ? 'empty' : 'default';
}

function isDraftNonEmpty(name: string, days: PlanDayDraft[]): boolean {
  return name.trim().length > 0 || days.length > 0;
}

function mapSourceDaysToDraft(
  sourceDays: SourceDayResponse[] | undefined,
  exerciseOptions: ExerciseOption[],
): PlanDayDraft[] {
  const exerciseNameLookup = new Map(exerciseOptions.map(item => [item.id, item.name]));
  const days = sourceDays ?? [];

  return days.map((day, dayIndex) => {
    const mappedExercises = (day.exercises ?? []).map(exercise => {
      const exerciseId = exercise.exerciseId?.trim() ?? '';
      const resolvedExerciseName =
        exerciseNameLookup.get(exerciseId) ??
        (exerciseId.length > 0 ? 'Unknown exercise' : '');

      const series = (exercise.series ?? []).map(setItem => ({
        id: createExerciseSetDraft().id,
        repeatsCount: `${setItem.repeatsCount ?? ''}`,
      }));

      return {
        id: createPlanDayExerciseDraft().id,
        exerciseId,
        exerciseName: resolvedExerciseName,
        exerciseSearchQuery: resolvedExerciseName,
        series: series.length > 0 ? series : [createExerciseSetDraft()],
      };
    });

    return {
      id: createPlanDayDraft(dayIndex).id,
      name: day.name?.trim().length ? day.name : `Day ${dayIndex + 1}`,
      exercises: mappedExercises.length > 0 ? mappedExercises : [createPlanDayExerciseDraft()],
    };
  });
}

function mapTemplateDaysToSourceDays(template: PlanTemplateResponse): SourceDayResponse[] {
  return template.days.map(day => ({
    name: day.name,
    exercises: day.exercises.map(exercise => ({
      exerciseId: exercise.exerciseId,
      series: exercise.series.map(setItem => ({
        repeatsCount: setItem.repeatsCount,
      })),
    })),
  }));
}

async function readErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorResponse;
    if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
      return payload.message;
    }
  } catch {
    // Ignore payload parse failures and fallback to generic message.
  }

  return fallbackMessage;
}

async function fetchExerciseOptions(): Promise<ExerciseOption[]> {
  const params = new URLSearchParams({
    query: '',
    includeSeeded: 'true',
  });

  const response = await fetch(`${API_BASE_URL}/api/exercises/list?${params.toString()}`);
  if (!response.ok) {
    const errorMessage = await readErrorMessage(response, LOAD_EXERCISES_ERROR_MESSAGE);
    throw createApiError(response.status, errorMessage);
  }

  const payload = (await response.json()) as ExercisesResponse;
  return sortExerciseOptionsByName(dedupeExerciseOptions(payload.exercises ?? []));
}

async function fetchClientTrainingPlan(
  clientId: string,
): Promise<ClientTrainingPlanResponse> {
  const params = new URLSearchParams({
    clientId,
  });

  const response = await fetch(
    `${API_BASE_URL}/api/clients/training-plan/get?${params.toString()}`,
  );

  if (!response.ok) {
    const fallback =
      response.status === 404
        ? CLIENT_NOT_FOUND_MESSAGE
        : LOAD_CLIENT_TRAINING_PLAN_ERROR_MESSAGE;
    const errorMessage = await readErrorMessage(response, fallback);
    throw createApiError(response.status, errorMessage);
  }

  return (await response.json()) as ClientTrainingPlanResponse;
}

async function fetchPlanTemplate(
  planTemplateId: string,
): Promise<PlanTemplateResponse> {
  const params = new URLSearchParams({
    id: planTemplateId,
  });

  const response = await fetch(`${API_BASE_URL}/api/plan-templates/get?${params.toString()}`);
  if (!response.ok) {
    const errorMessage = await readErrorMessage(response, COPY_FROM_TEMPLATE_ERROR_MESSAGE);
    throw createApiError(response.status, errorMessage);
  }

  return (await response.json()) as PlanTemplateResponse;
}

function dedupeAndSortPlanTemplates(
  templates: PlanTemplateListItem[],
): PlanTemplateListItem[] {
  const dedupedTemplates = templates.filter((template, index, source) => {
    return source.findIndex(candidate => candidate.id === template.id) === index;
  });

  return dedupedTemplates.sort((left, right) => {
    const nameComparison = left.name.localeCompare(right.name, undefined, {
      sensitivity: 'base',
    });
    if (nameComparison !== 0) {
      return nameComparison;
    }

    return left.id.localeCompare(right.id, undefined, {
      sensitivity: 'base',
    });
  });
}

async function fetchPlanTemplatesList(query: string): Promise<PlanTemplateListItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/plan-templates/list?query=${encodeURIComponent(query)}`,
  );
  if (!response.ok) {
    const errorMessage = await readErrorMessage(
      response,
      LOAD_PLAN_TEMPLATES_ERROR_MESSAGE,
    );
    throw createApiError(response.status, errorMessage);
  }

  const payload = (await response.json()) as PlanTemplatesListResponse;
  const rawPlanTemplates = payload.planTemplates ?? payload.templates ?? [];
  const normalizedPlanTemplates = rawPlanTemplates
    .map(template => ({
      id: template.id?.trim() ?? '',
      name: template.name?.trim() ?? '',
    }))
    .filter(template => template.id.length > 0);

  return dedupeAndSortPlanTemplates(normalizedPlanTemplates);
}

function buildClientTrainingPlanPayload(
  clientId: string,
  name: string,
  days: PlanDayDraft[],
): UpdateClientTrainingPlanRequest {
  return {
    clientId,
    name: name.trim(),
    days: days.map(day => ({
      name: day.name.trim(),
      exercises: day.exercises.map(exercise => ({
        exerciseId: exercise.exerciseId,
        series: exercise.series.map(setItem => ({
          repeatsCount: Number.parseInt(setItem.repeatsCount.trim(), 10),
        })),
      })),
    })),
  };
}

async function updateClientTrainingPlan(
  requestBody: UpdateClientTrainingPlanRequest,
): Promise<UpdatedClientTrainingPlanResponse> {
  const response = await fetch(`${API_BASE_URL}/api/clients/training-plan/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const fallback =
      response.status === 404
        ? CLIENT_NOT_FOUND_MESSAGE
        : UPDATE_CLIENT_TRAINING_PLAN_ERROR_MESSAGE;
    const errorMessage = await readErrorMessage(response, fallback);
    throw createApiError(response.status, errorMessage);
  }

  return (await response.json()) as UpdatedClientTrainingPlanResponse;
}

export function ClientTrainingPlanScreen({
  navigation,
  activeTrainingId = null,
  clientId,
}: ClientTrainingPlanScreenProps) {
  const insets = useSafeAreaInsets();

  const draftRef = useRef<ClientTrainingPlanDraft>(buildInitialDraft(clientId));
  const originalSnapshotRef = useRef<string | null>(null);
  const isDirtyRef = useRef(false);
  const templateSearchRequestIdRef = useRef(0);

  const [screenState, setScreenState] =
    useState<ClientTrainingPlanViewState>('loading');
  const [draft, setDraft] = useState<ClientTrainingPlanDraft>(() =>
    buildInitialDraft(clientId),
  );
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);
  const [hasLoadedTrainingPlan, setHasLoadedTrainingPlan] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isNameTouched, setIsNameTouched] = useState(false);
  const [bannerState, setBannerState] = useState<BannerState | null>(null);
  const [templateOptions, setTemplateOptions] = useState<PlanTemplateListItem[]>([]);
  const [isTemplatePickerVisible, setIsTemplatePickerVisible] = useState(false);
  const [isTemplateListLoading, setIsTemplateListLoading] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const updateDraft = useCallback(
    (updater: (current: ClientTrainingPlanDraft) => ClientTrainingPlanDraft) => {
      setDraft(current => {
        const nextDraft = updater(current);
        draftRef.current = nextDraft;
        return nextDraft;
      });
    },
    [],
  );

  const navigateToRoute = useCallback(
    (route: string) => {
      if (navigation?.navigate) {
        navigation.navigate(route);
        return;
      }

      Alert.alert('Navigation placeholder', `Navigate to ${route}`);
    },
    [navigation],
  );

  const replaceRoute = useCallback(
    (route: string) => {
      if (navigation?.replace) {
        navigation.replace(route);
        return;
      }

      navigateToRoute(route);
    },
    [navigateToRoute, navigation],
  );

  const navigateBackToClient = useCallback(() => {
    if (navigation?.goBack) {
      navigation.goBack();
      return;
    }

    const resolvedClientId = draftRef.current.clientId.trim() || clientId;
    navigateToRoute(`/clients/${encodeURIComponent(resolvedClientId)}`);
  }, [clientId, navigation, navigateToRoute]);

  const currentSnapshot = useMemo(
    () => buildComparableSnapshot(draft.name, draft.days),
    [draft.days, draft.name],
  );

  const isDirty = useMemo(() => {
    const isChangedFromOriginal =
      originalSnapshotRef.current != null &&
      originalSnapshotRef.current !== currentSnapshot;

    return isChangedFromOriginal || draft.forceDirty;
  }, [currentSnapshot, draft.forceDirty]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const confirmDiscardChanges = useCallback((onDiscard: () => void) => {
    if (draftRef.current.isSaving) {
      return;
    }

    if (!isDirtyRef.current) {
      onDiscard();
      return;
    }

    Alert.alert(
      'Discard changes?',
      'You have unsaved client training plan data.',
      [
        {
          text: 'Continue Editing',
          style: 'cancel',
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: onDiscard,
        },
      ],
      { cancelable: true },
    );
  }, []);

  const handleBackAction = useCallback(() => {
    confirmDiscardChanges(() => {
      navigateBackToClient();
    });
  }, [confirmDiscardChanges, navigateBackToClient]);

  const loadData = useCallback(async () => {
    setScreenState('loading');

    try {
      const [loadedExerciseOptions, loadedTrainingPlan] = await Promise.all([
        fetchExerciseOptions(),
        fetchClientTrainingPlan(clientId),
      ]);

      setExerciseOptions(loadedExerciseOptions);

      const mappedDays = mapSourceDaysToDraft(
        loadedTrainingPlan.days,
        loadedExerciseOptions,
      );

      const nextDraft: ClientTrainingPlanDraft = {
        clientId: loadedTrainingPlan.clientId?.trim() || clientId,
        name: loadedTrainingPlan.name ?? '',
        days: mappedDays,
        activeDayIndex: 0,
        isSaving: false,
        isCopying: false,
        forceDirty: false,
      };

      updateDraft(() => nextDraft);
      originalSnapshotRef.current = buildComparableSnapshot(
        nextDraft.name,
        nextDraft.days,
      );
      isDirtyRef.current = false;

      setHasLoadedTrainingPlan(true);
      setBannerState(null);
      setHasSubmitted(false);
      setIsNameTouched(false);
      setTemplateOptions([]);
      setIsTemplatePickerVisible(false);
      setIsTemplateListLoading(false);
      setTemplateSearchQuery('');
      setScreenState(resolveInteractiveState(nextDraft.name, nextDraft.days));
    } catch (error) {
      const statusCode = (error as ApiError).status;

      if (statusCode === 404) {
        setHasLoadedTrainingPlan(false);
        setScreenState('notFound');
        setBannerState({
          tone: 'error',
          message: CLIENT_NOT_FOUND_MESSAGE,
        });
      } else if (isOfflineError(error)) {
        setHasLoadedTrainingPlan(false);
        setScreenState('offline');
        setBannerState({
          tone: 'offline',
          message: OFFLINE_MESSAGE,
        });
      } else {
        setHasLoadedTrainingPlan(false);
        setScreenState('error');
        setBannerState({
          tone: 'error',
          message:
            (error as Error).message || LOAD_CLIENT_TRAINING_PLAN_ERROR_MESSAGE,
        });
      }
    }
  }, [clientId, updateDraft]);

  useEffect(() => {
    loadData().catch(() => undefined);
  }, [loadData]);

  useEffect(() => {
    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (draftRef.current.isSaving) {
          return true;
        }

        if (!isDirtyRef.current) {
          return false;
        }

        handleBackAction();
        return true;
      },
    );

    return () => {
      backSubscription.remove();
    };
  }, [handleBackAction]);

  const validation = useMemo(
    () => validatePlanTemplateDraft(draft.name, draft.days),
    [draft.days, draft.name],
  );

  const activeDay = draft.days[draft.activeDayIndex] ?? null;
  const activeDayErrors = hasSubmitted
    ? validation.errors.dayItems[draft.activeDayIndex]
    : undefined;

  const isSaveDisabled =
    !hasLoadedTrainingPlan ||
    draft.isSaving ||
    draft.isCopying ||
    screenState === 'offline' ||
    screenState === 'notFound' ||
    !isDirty ||
    !validation.isValid;

  const isCopyDisabled =
    !hasLoadedTrainingPlan ||
    draft.isSaving ||
    draft.isCopying ||
    isTemplateListLoading ||
    screenState === 'offline' ||
    screenState === 'notFound';

  const isConnectionIndicatorVisible =
    screenState === 'offline' || bannerState?.tone === 'offline';

  const handleOfflineInfoPress = useCallback(() => {
    Alert.alert(OFFLINE_MESSAGE);
  }, []);

  const clearErrorBanner = useCallback(() => {
    setBannerState(currentState => {
      if (currentState?.tone === 'error' || currentState?.tone === 'info') {
        return null;
      }

      return currentState;
    });
  }, []);

  const handlePlanNameChange = useCallback(
    (value: string) => {
      updateDraft(current => ({
        ...current,
        name: value,
      }));

      clearErrorBanner();
      setScreenState(previousState => {
        if (
          previousState === 'loading' ||
          previousState === 'offline' ||
          previousState === 'notFound'
        ) {
          return previousState;
        }

        return value.trim().length === 0 && draftRef.current.days.length === 0
          ? 'empty'
          : 'default';
      });
    },
    [clearErrorBanner, updateDraft],
  );

  const handlePlanNameBlur = useCallback(() => {
    setIsNameTouched(true);
  }, []);

  const handleSelectDayTab = useCallback((nextIndex: number) => {
    setDraft(current => {
      if (nextIndex < 0 || nextIndex >= current.days.length) {
        return current;
      }

      return {
        ...current,
        activeDayIndex: nextIndex,
      };
    });
  }, []);

  const handleAddDay = useCallback(() => {
    updateDraft(current => {
      const nextDay = createPlanDayDraft(current.days.length);
      const nextDays = [...current.days, nextDay];

      return {
        ...current,
        days: nextDays,
        activeDayIndex: nextDays.length - 1,
      };
    });

    clearErrorBanner();
    setScreenState(previousState => {
      if (
        previousState === 'loading' ||
        previousState === 'offline' ||
        previousState === 'notFound'
      ) {
        return previousState;
      }

      return 'default';
    });
  }, [clearErrorBanner, updateDraft]);

  const handleRemoveDay = useCallback(
    (dayIndex: number) => {
      updateDraft(current => {
        if (current.days.length <= 1 || dayIndex < 0 || dayIndex >= current.days.length) {
          return current;
        }

        const nextDays = current.days.filter((_, index) => index !== dayIndex);
        const nextActiveIndex =
          current.activeDayIndex > dayIndex
            ? current.activeDayIndex - 1
            : Math.min(current.activeDayIndex, nextDays.length - 1);

        return {
          ...current,
          days: nextDays,
          activeDayIndex: Math.max(nextActiveIndex, 0),
        };
      });

      clearErrorBanner();
    },
    [clearErrorBanner, updateDraft],
  );

  const handleChangeDayName = useCallback(
    (dayIndex: number, value: string) => {
      updateDraft(current => {
        if (!current.days[dayIndex]) {
          return current;
        }

        const nextDays = [...current.days];
        const nextDay = cloneDay(nextDays[dayIndex]);
        nextDay.name = value;
        nextDays[dayIndex] = nextDay;

        return {
          ...current,
          days: nextDays,
        };
      });

      clearErrorBanner();
    },
    [clearErrorBanner, updateDraft],
  );

  const handleAddExercise = useCallback(
    (dayIndex: number) => {
      updateDraft(current => {
        if (!current.days[dayIndex]) {
          return current;
        }

        const nextDays = [...current.days];
        const nextDay = cloneDay(nextDays[dayIndex]);
        nextDay.exercises = [...nextDay.exercises, createPlanDayExerciseDraft()];
        nextDays[dayIndex] = nextDay;

        return {
          ...current,
          days: nextDays,
        };
      });

      clearErrorBanner();
    },
    [clearErrorBanner, updateDraft],
  );

  const handleRemoveExercise = useCallback(
    (dayIndex: number, exerciseIndex: number) => {
      updateDraft(current => {
        const day = current.days[dayIndex];
        if (!day || day.exercises.length <= 1) {
          return current;
        }

        const nextDays = [...current.days];
        const nextDay = cloneDay(day);
        nextDay.exercises = nextDay.exercises.filter((_, index) => index !== exerciseIndex);
        nextDays[dayIndex] = nextDay;

        return {
          ...current,
          days: nextDays,
        };
      });

      clearErrorBanner();
    },
    [clearErrorBanner, updateDraft],
  );

  const handleMoveExercise = useCallback(
    (dayIndex: number, exerciseIndex: number, direction: 'up' | 'down') => {
      updateDraft(current => {
        const day = current.days[dayIndex];
        if (!day || day.exercises.length <= 1) {
          return current;
        }

        const targetIndex = direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1;
        if (targetIndex < 0 || targetIndex >= day.exercises.length) {
          return current;
        }

        const nextDays = [...current.days];
        const nextDay = cloneDay(day);
        const nextExercises = [...nextDay.exercises];
        const [movedExercise] = nextExercises.splice(exerciseIndex, 1);
        nextExercises.splice(targetIndex, 0, movedExercise);
        nextDay.exercises = nextExercises;
        nextDays[dayIndex] = nextDay;

        return {
          ...current,
          days: nextDays,
        };
      });

      clearErrorBanner();
    },
    [clearErrorBanner, updateDraft],
  );

  const handleExerciseSearchChange = useCallback(
    (dayIndex: number, exerciseIndex: number, query: string) => {
      updateDraft(current => {
        const day = current.days[dayIndex];
        if (!day || !day.exercises[exerciseIndex]) {
          return current;
        }

        const nextDays = [...current.days];
        const nextDay = cloneDay(day);
        nextDay.exercises[exerciseIndex] = {
          ...nextDay.exercises[exerciseIndex],
          exerciseSearchQuery: query,
        };
        nextDays[dayIndex] = nextDay;

        return {
          ...current,
          days: nextDays,
        };
      });

      clearErrorBanner();
    },
    [clearErrorBanner, updateDraft],
  );

  const handleSelectExercise = useCallback(
    (
      dayIndex: number,
      exerciseIndex: number,
      exerciseId: string,
      exerciseName: string,
    ) => {
      updateDraft(current => {
        const day = current.days[dayIndex];
        if (!day || !day.exercises[exerciseIndex]) {
          return current;
        }

        const nextDays = [...current.days];
        const nextDay = cloneDay(day);
        nextDay.exercises[exerciseIndex] = {
          ...nextDay.exercises[exerciseIndex],
          exerciseId,
          exerciseName,
          exerciseSearchQuery: exerciseName,
        };
        nextDays[dayIndex] = nextDay;

        return {
          ...current,
          days: nextDays,
        };
      });

      clearErrorBanner();
    },
    [clearErrorBanner, updateDraft],
  );

  const handleAddSet = useCallback(
    (dayIndex: number, exerciseIndex: number) => {
      updateDraft(current => {
        const day = current.days[dayIndex];
        if (!day || !day.exercises[exerciseIndex]) {
          return current;
        }

        const nextDays = [...current.days];
        const nextDay = cloneDay(day);
        nextDay.exercises[exerciseIndex].series = [
          ...nextDay.exercises[exerciseIndex].series,
          createExerciseSetDraft(),
        ];
        nextDays[dayIndex] = nextDay;

        return {
          ...current,
          days: nextDays,
        };
      });

      clearErrorBanner();
    },
    [clearErrorBanner, updateDraft],
  );

  const handleRemoveSet = useCallback(
    (dayIndex: number, exerciseIndex: number, setIndex: number) => {
      updateDraft(current => {
        const day = current.days[dayIndex];
        const exercise = day?.exercises[exerciseIndex];
        if (!day || !exercise || exercise.series.length <= 1) {
          return current;
        }

        const nextDays = [...current.days];
        const nextDay = cloneDay(day);
        nextDay.exercises[exerciseIndex].series = nextDay.exercises[exerciseIndex].series.filter(
          (_, index) => index !== setIndex,
        );
        nextDays[dayIndex] = nextDay;

        return {
          ...current,
          days: nextDays,
        };
      });

      clearErrorBanner();
    },
    [clearErrorBanner, updateDraft],
  );

  const handleChangeSetRepeats = useCallback(
    (dayIndex: number, exerciseIndex: number, setIndex: number, nextValue: string) => {
      updateDraft(current => {
        const day = current.days[dayIndex];
        const exercise = day?.exercises[exerciseIndex];
        if (!day || !exercise || !exercise.series[setIndex]) {
          return current;
        }

        const nextDays = [...current.days];
        const nextDay = cloneDay(day);
        nextDay.exercises[exerciseIndex].series[setIndex] = {
          ...nextDay.exercises[exerciseIndex].series[setIndex],
          repeatsCount: nextValue,
        };
        nextDays[dayIndex] = nextDay;

        return {
          ...current,
          days: nextDays,
        };
      });

      clearErrorBanner();
    },
    [clearErrorBanner, updateDraft],
  );

  const executeCopyFromTemplate = useCallback(async (templateId: string) => {
    if (screenState === 'offline') {
      setBannerState({
        tone: 'offline',
        message: OFFLINE_MESSAGE,
      });
      return;
    }

    updateDraft(current => ({
      ...current,
      isCopying: true,
    }));

    try {
      const template = await fetchPlanTemplate(templateId);
      const copiedName = template.name ?? '';
      const copiedDays = mapSourceDaysToDraft(
        mapTemplateDaysToSourceDays(template),
        exerciseOptions,
      );

      updateDraft(current => ({
        ...current,
        name: copiedName,
        days: copiedDays,
        activeDayIndex: 0,
        forceDirty: true,
      }));

      setBannerState(null);
      setHasSubmitted(false);
      setIsNameTouched(false);
      setScreenState(resolveInteractiveState(copiedName, copiedDays));
      Alert.alert(COPY_SUCCESS_MESSAGE);
    } catch (error) {
      if (isOfflineError(error)) {
        setScreenState('offline');
        setBannerState({
          tone: 'offline',
          message: OFFLINE_MESSAGE,
        });
      } else {
        setScreenState('error');
        setBannerState({
          tone: 'error',
          message: (error as Error).message || COPY_FROM_TEMPLATE_ERROR_MESSAGE,
        });
      }
    } finally {
      updateDraft(current => ({
        ...current,
        isCopying: false,
      }));
    }
  }, [exerciseOptions, screenState, updateDraft]);

  const loadTemplateOptions = useCallback(async (query: string) => {
    const requestId = templateSearchRequestIdRef.current + 1;
    templateSearchRequestIdRef.current = requestId;
    setIsTemplateListLoading(true);

    try {
      const loadedTemplateOptions = await fetchPlanTemplatesList(query);
      if (templateSearchRequestIdRef.current !== requestId) {
        return;
      }

      setTemplateOptions(loadedTemplateOptions);
      setBannerState(null);
    } catch (error) {
      if (templateSearchRequestIdRef.current !== requestId) {
        return;
      }

      if (isOfflineError(error)) {
        setScreenState('offline');
        setBannerState({
          tone: 'offline',
          message: OFFLINE_MESSAGE,
        });
      } else {
        setBannerState({
          tone: 'error',
          message: (error as Error).message || LOAD_PLAN_TEMPLATES_ERROR_MESSAGE,
        });
      }
    } finally {
      if (templateSearchRequestIdRef.current === requestId) {
        setIsTemplateListLoading(false);
      }
    }
  }, []);

  const handleSelectTemplate = useCallback(
    (templateId: string) => {
      if (templateId.trim().length === 0) {
        return;
      }

      const shouldAskForConfirmation = isDraftNonEmpty(
        draftRef.current.name,
        draftRef.current.days,
      );

      const copySelectedTemplate = () => {
        setIsTemplatePickerVisible(false);
        executeCopyFromTemplate(templateId).catch(() => undefined);
      };

      if (!shouldAskForConfirmation) {
        copySelectedTemplate();
        return;
      }

      Alert.alert(
        'Replace draft with template?',
        'Current draft values will be replaced.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Copy',
            onPress: copySelectedTemplate,
          },
        ],
        { cancelable: true },
      );
    },
    [executeCopyFromTemplate],
  );

  const handleCopyFromTemplate = useCallback(() => {
    if (isCopyDisabled) {
      return;
    }

    setTemplateSearchQuery('');
    setTemplateOptions([]);
    setIsTemplatePickerVisible(true);
    loadTemplateOptions('').catch(() => undefined);
  }, [isCopyDisabled, loadTemplateOptions]);

  const handleTemplateSearchChange = useCallback(
    (query: string) => {
      setTemplateSearchQuery(query);
      loadTemplateOptions(query).catch(() => undefined);
    },
    [loadTemplateOptions],
  );

  const handleSubmitUpdate = useCallback(async () => {
    if (draftRef.current.isSaving || draftRef.current.isCopying) {
      return;
    }

    setHasSubmitted(true);
    setIsNameTouched(true);

    const validationResult = validatePlanTemplateDraft(
      draftRef.current.name,
      draftRef.current.days,
    );

    if (!validationResult.isValid) {
      setScreenState('disabled');
      return;
    }

    if (screenState === 'offline') {
      setBannerState({
        tone: 'offline',
        message: OFFLINE_MESSAGE,
      });
      return;
    }

    const payload = buildClientTrainingPlanPayload(
      draftRef.current.clientId,
      draftRef.current.name,
      draftRef.current.days,
    );

    updateDraft(current => ({
      ...current,
      isSaving: true,
    }));
    setScreenState('loading');
    setBannerState(null);

    try {
      const updated = await updateClientTrainingPlan(payload);
      const normalizedName = updated.name ?? payload.name;
      const normalizedDays = mapSourceDaysToDraft(updated.days, exerciseOptions);

      const nextActiveDayIndex = Math.min(
        draftRef.current.activeDayIndex,
        Math.max(normalizedDays.length - 1, 0),
      );

      const nextDraft: ClientTrainingPlanDraft = {
        ...draftRef.current,
        clientId: updated.clientId?.trim() || draftRef.current.clientId,
        name: normalizedName,
        days: normalizedDays,
        activeDayIndex: nextActiveDayIndex,
        isSaving: false,
        isCopying: false,
        forceDirty: false,
      };

      updateDraft(() => nextDraft);
      originalSnapshotRef.current = buildComparableSnapshot(
        nextDraft.name,
        nextDraft.days,
      );
      isDirtyRef.current = false;

      setHasSubmitted(false);
      setIsNameTouched(false);
      setScreenState(resolveInteractiveState(nextDraft.name, nextDraft.days));
      setBannerState(null);
      Alert.alert(SAVE_SUCCESS_MESSAGE);
    } catch (error) {
      const statusCode = (error as ApiError).status;

      if (statusCode === 404) {
        setHasLoadedTrainingPlan(false);
        setScreenState('notFound');
        setBannerState({
          tone: 'error',
          message: CLIENT_NOT_FOUND_MESSAGE,
        });
      } else if (isOfflineError(error)) {
        setScreenState('offline');
        setBannerState({
          tone: 'offline',
          message: OFFLINE_MESSAGE,
        });
      } else {
        setScreenState(statusCode === 400 ? 'disabled' : 'error');
        setBannerState({
          tone: 'error',
          message:
            (error as Error).message || UPDATE_CLIENT_TRAINING_PLAN_ERROR_MESSAGE,
        });
      }
    } finally {
      updateDraft(current => ({
        ...current,
        isSaving: false,
      }));
    }
  }, [exerciseOptions, screenState, updateDraft]);

  const handleBottomNavigation = useCallback(
    (route: AppShellRoute) => {
      confirmDiscardChanges(() => {
        navigateToRoute(route);
      });
    },
    [confirmDiscardChanges, navigateToRoute],
  );

  const handleBackToClientList = useCallback(() => {
    replaceRoute('/clients');
  }, [replaceRoute]);

  const contentBottomPadding = useMemo(() => 24, []);
  const actionSectionBottomPadding = useMemo(
    () => BOTTOM_MENU_HEIGHT + insets.bottom + 12,
    [insets.bottom],
  );

  const isInitialLoading = screenState === 'loading' && !hasLoadedTrainingPlan;
  const visibleNameError =
    hasSubmitted || isNameTouched ? validation.errors.name : undefined;
  const visibleDaysError = hasSubmitted ? validation.errors.days : undefined;
  const copyButtonLabel = draft.isCopying ? 'Copying...' : 'Copy from template';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container} testID="screen.clients.trainingPlan">
        <GlobalHeader
          title="Client Training Plan"
          leftAction={{
            label: 'Back',
            onPress: handleBackAction,
            disabled: draft.isSaving,
          }}
          statusIndicator={
            isConnectionIndicatorVisible
              ? {
                  accessibilityLabel: 'No internet connection details',
                  onPress: handleOfflineInfoPress,
                }
              : undefined
          }
        />

        <View style={styles.content}>
          <ScrollView
            testID="scroll.clients.trainingPlan"
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: contentBottomPadding },
            ]}
            keyboardShouldPersistTaps="handled">
            {bannerState && bannerState.tone !== 'offline' ? (
              <View style={styles.bannerBlock}>
                <StatusBanner tone={bannerState.tone} message={bannerState.message} />
              </View>
            ) : null}

            {screenState === 'notFound' ? (
              <View style={styles.notFoundSection} testID="text.clients.trainingPlan.notFound">
                <Text style={styles.notFoundTitle}>{CLIENT_NOT_FOUND_MESSAGE}</Text>
                <Pressable
                  testID="button.clients.trainingPlan.backToClientList"
                  accessibilityRole="button"
                  onPress={handleBackToClientList}
                  style={({ pressed }) => [
                    styles.notFoundButton,
                    pressed && styles.notFoundButtonPressed,
                  ]}>
                  <Text style={styles.notFoundButtonText}>Back to client list</Text>
                </Pressable>
              </View>
            ) : null}

            {isInitialLoading ? (
              <View style={styles.loadingCard}>
                <LoadingSkeleton rows={8} rowHeight={36} />
              </View>
            ) : null}

            {screenState !== 'notFound' && hasLoadedTrainingPlan ? (
              <>
                <View style={styles.section}>
                  <Pressable
                    testID="button.clients.trainingPlan.copyFromTemplate"
                    accessibilityRole="button"
                    disabled={isCopyDisabled}
                    onPress={handleCopyFromTemplate}
                    style={({ pressed }) => [
                      styles.copyButton,
                      isCopyDisabled && styles.buttonDisabled,
                      pressed && !isCopyDisabled && styles.copyButtonPressed,
                    ]}>
                    <Text style={styles.copyButtonText}>{copyButtonLabel}</Text>
                    {draft.isCopying || isTemplateListLoading ? (
                      <ActivityIndicator color="#1D4ED8" size="small" />
                    ) : null}
                  </Pressable>
                </View>

                <View style={styles.section}>
                  <Text style={styles.fieldLabel}>Plan Name</Text>
                  <TextInput
                    testID="input.clients.trainingPlan.name"
                    accessibilityLabel="Client training plan name"
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!draft.isSaving}
                    onBlur={handlePlanNameBlur}
                    onChangeText={handlePlanNameChange}
                    placeholder="Enter client plan name"
                    style={styles.input}
                    value={draft.name}
                  />

                  {visibleNameError ? (
                    <Text style={styles.fieldErrorText}>{visibleNameError}</Text>
                  ) : null}
                </View>

                <View style={styles.section}>
                  <View style={styles.dayTabsHeaderRow}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.dayTabsContainer}>
                      {draft.days.map((day, dayIndex) => {
                        const isActive = dayIndex === draft.activeDayIndex;

                        return (
                          <Pressable
                            key={day.id}
                            testID={`tab.clients.trainingPlan.day.${dayIndex}`}
                            accessibilityRole="button"
                            accessibilityLabel={`Open ${resolveDayLabel(day, dayIndex)} tab`}
                            onPress={() => {
                              handleSelectDayTab(dayIndex);
                            }}
                            style={({ pressed }) => [
                              styles.dayTab,
                              isActive && styles.dayTabActive,
                              pressed && styles.dayTabPressed,
                            ]}>
                            <Text style={[styles.dayTabText, isActive && styles.dayTabTextActive]}>
                              {resolveDayLabel(day, dayIndex)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    <Pressable
                      testID="button.clients.trainingPlan.day.add"
                      accessibilityRole="button"
                      accessibilityLabel="Add plan day"
                      disabled={draft.isSaving}
                      onPress={handleAddDay}
                      style={({ pressed }) => [
                        styles.addDayButton,
                        draft.isSaving && styles.buttonDisabled,
                        pressed && !draft.isSaving && styles.addDayButtonPressed,
                      ]}>
                      <Text style={styles.addDayButtonText}>+</Text>
                    </Pressable>
                  </View>

                  {visibleDaysError ? (
                    <Text style={styles.fieldErrorText}>{visibleDaysError}</Text>
                  ) : null}
                </View>

                {draft.days.length === 0 ? (
                  <View style={styles.emptyDaysSection}>
                    <Text style={styles.emptyDaysText} testID="text.clients.trainingPlan.empty.days">
                      Add your first day.
                    </Text>
                  </View>
                ) : null}

                {activeDay ? (
                  <PlanDayView
                    dayIndex={draft.activeDayIndex}
                    testIdPrefix={TEST_ID_PREFIX}
                    value={activeDay}
                    errors={activeDayErrors}
                    exerciseOptions={exerciseOptions}
                    disabled={draft.isSaving}
                    canRemoveDay={draft.days.length > 1}
                    onChangeName={value => {
                      handleChangeDayName(draft.activeDayIndex, value);
                    }}
                    onRemoveDay={() => {
                      handleRemoveDay(draft.activeDayIndex);
                    }}
                    onAddExercise={() => {
                      handleAddExercise(draft.activeDayIndex);
                    }}
                    onRemoveExercise={exerciseIndex => {
                      handleRemoveExercise(draft.activeDayIndex, exerciseIndex);
                    }}
                    onMoveExerciseUp={exerciseIndex => {
                      handleMoveExercise(draft.activeDayIndex, exerciseIndex, 'up');
                    }}
                    onMoveExerciseDown={exerciseIndex => {
                      handleMoveExercise(draft.activeDayIndex, exerciseIndex, 'down');
                    }}
                    onExerciseSearchChange={(exerciseIndex, query) => {
                      handleExerciseSearchChange(
                        draft.activeDayIndex,
                        exerciseIndex,
                        query,
                      );
                    }}
                    onSelectExercise={(exerciseIndex, exerciseId, exerciseName) => {
                      handleSelectExercise(
                        draft.activeDayIndex,
                        exerciseIndex,
                        exerciseId,
                        exerciseName,
                      );
                    }}
                    onAddSet={exerciseIndex => {
                      handleAddSet(draft.activeDayIndex, exerciseIndex);
                    }}
                    onRemoveSet={(exerciseIndex, setIndex) => {
                      handleRemoveSet(draft.activeDayIndex, exerciseIndex, setIndex);
                    }}
                    onChangeSetRepeats={(exerciseIndex, setIndex, value) => {
                      handleChangeSetRepeats(
                        draft.activeDayIndex,
                        exerciseIndex,
                        setIndex,
                        value,
                      );
                    }}
                  />
                ) : null}
              </>
            ) : null}
          </ScrollView>

          {screenState !== 'notFound' ? (
            <View style={[styles.actionsSection, { paddingBottom: actionSectionBottomPadding }]}>
              <Pressable
                testID="button.clients.trainingPlan.save"
                accessibilityRole="button"
                disabled={isSaveDisabled}
                onPress={() => {
                  handleSubmitUpdate().catch(() => undefined);
                }}
                style={({ pressed }) => [
                  styles.saveButton,
                  isSaveDisabled && styles.buttonDisabled,
                  pressed && !isSaveDisabled && styles.saveButtonPressed,
                ]}>
                <Text style={styles.saveButtonText}>
                  {draft.isSaving ? 'Saving...' : 'Save'}
                </Text>
                {draft.isSaving ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
              </Pressable>
            </View>
          ) : null}
        </View>

        <BottomMenu
          activeRoute="/clients"
          activeTrainingId={activeTrainingId}
          onNavigate={handleBottomNavigation}
        />
      </View>

      <SearchableSelectModal
        visible={isTemplatePickerVisible}
        title="Select template"
        options={templateOptions}
        isLoading={isTemplateListLoading}
        emptyMessage={TEMPLATE_PICKER_EMPTY_MESSAGE}
        searchValue={templateSearchQuery}
        searchPlaceholder="Search template"
        searchAccessibilityLabel="Plan template search"
        getOptionLabel={(template, index) =>
          template.name.length > 0 ? template.name : `Template ${index + 1}`
        }
        onSearchChange={handleTemplateSearchChange}
        onSelectOption={template => {
          handleSelectTemplate(template.id);
        }}
        onRequestClose={() => setIsTemplatePickerVisible(false)}
        getOptionTestID={(_, index) =>
          `button.clients.trainingPlan.template.option.${index}`
        }
        closeButtonTestID="button.clients.trainingPlan.template.close"
        searchInputTestID="input.clients.trainingPlan.template.search"
        clearSearchButtonTestID="button.clients.trainingPlan.template.search.clear"
        listTestID="list.clients.trainingPlan.templates"
        loadingTestID="loading.clients.trainingPlan.templates"
        emptyTextTestID="text.clients.trainingPlan.template.empty"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  bannerBlock: {
    gap: 8,
  },
  loadingCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  section: {
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
  copyButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  copyButtonPressed: {
    backgroundColor: '#DBEAFE',
  },
  copyButtonText: {
    color: '#1D4ED8',
    fontSize: 15,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 14,
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
  fieldErrorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
  },
  dayTabsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayTabsContainer: {
    gap: 8,
    paddingRight: 4,
  },
  dayTab: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTabActive: {
    borderColor: '#60A5FA',
    backgroundColor: '#EFF6FF',
  },
  dayTabPressed: {
    backgroundColor: '#EEF2FF',
  },
  dayTabText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  dayTabTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  addDayButton: {
    minHeight: 40,
    minWidth: 40,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDayButtonPressed: {
    backgroundColor: '#1E40AF',
  },
  addDayButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 22,
  },
  emptyDaysSection: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  emptyDaysText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
  },
  notFoundSection: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  notFoundTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  notFoundButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  notFoundButtonPressed: {
    backgroundColor: '#1E40AF',
  },
  notFoundButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionsSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#F5F7FA',
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  saveButtonPressed: {
    backgroundColor: '#1E40AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
