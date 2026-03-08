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
import { PlanDayView } from '../components/planTemplates/PlanDayView';
import { ExerciseOption, PlanDayDraft } from '../components/planTemplates/types';
import {
  ApiError,
  buildComparableSnapshot,
  buildMutationPayload,
  createApiError,
  createPlanDayDraft,
  createPlanDayExerciseDraft,
  createExerciseSetDraft,
  dedupeExerciseOptions,
  isOfflineError,
  mapResponseToDraft,
  PlanTemplateResponse,
  sortExerciseOptionsByName,
  validatePlanTemplateDraft,
} from './planTemplateEditorUtils';

type PlanTemplateViewState =
  | 'loading'
  | 'default'
  | 'error'
  | 'offline'
  | 'disabled'
  | 'notFound';

interface PlanTemplateDraft {
  id: string;
  name: string;
  days: PlanDayDraft[];
  activeDayIndex: number;
  isSaving: boolean;
  isDeleting: boolean;
}

interface BannerState {
  tone: StatusBannerTone;
  message: string;
}

interface ExercisesResponse {
  exercises?: ExerciseOption[];
}

interface ErrorResponse {
  message?: string;
}

interface NavigationLike {
  navigate: (route: string) => void;
  goBack?: () => void;
  replace?: (route: string) => void;
}

interface PlanTemplateScreenProps {
  navigation?: NavigationLike;
  activeTrainingId?: string | null;
  planTemplateId: string;
}

const API_BASE_URL = 'http://localhost:3000';

const OFFLINE_MESSAGE = 'No internet connection';
const PLAN_TEMPLATE_NOT_FOUND_MESSAGE = 'Plan template not found.';
const LOAD_PLAN_TEMPLATE_ERROR_MESSAGE = 'Could not load plan template. Try again.';
const LOAD_EXERCISES_ERROR_MESSAGE = 'Could not load exercises list. Try again.';
const UPDATE_PLAN_TEMPLATE_ERROR_MESSAGE = 'Could not update plan template. Try again.';
const DELETE_PLAN_TEMPLATE_ERROR_MESSAGE = 'Could not delete plan template. Try again.';

function buildInitialDraft(planTemplateId: string): PlanTemplateDraft {
  return {
    id: planTemplateId,
    name: '',
    days: [createPlanDayDraft(0)],
    activeDayIndex: 0,
    isSaving: false,
    isDeleting: false,
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

async function fetchPlanTemplate(
  planTemplateId: string,
): Promise<PlanTemplateResponse> {
  const params = new URLSearchParams({
    id: planTemplateId,
  });

  const response = await fetch(`${API_BASE_URL}/api/plan-templates/get?${params.toString()}`);

  if (!response.ok) {
    const fallback =
      response.status === 404
        ? PLAN_TEMPLATE_NOT_FOUND_MESSAGE
        : LOAD_PLAN_TEMPLATE_ERROR_MESSAGE;
    const errorMessage = await readErrorMessage(response, fallback);
    throw createApiError(response.status, errorMessage);
  }

  return (await response.json()) as PlanTemplateResponse;
}

async function updatePlanTemplate(
  requestBody: ReturnType<typeof buildMutationPayload>,
): Promise<PlanTemplateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/plan-templates/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: requestBody.id,
      name: requestBody.name,
      days: requestBody.days,
    }),
  });

  if (!response.ok) {
    const fallback =
      response.status === 404
        ? PLAN_TEMPLATE_NOT_FOUND_MESSAGE
        : UPDATE_PLAN_TEMPLATE_ERROR_MESSAGE;
    const errorMessage = await readErrorMessage(response, fallback);
    throw createApiError(response.status, errorMessage);
  }

  return (await response.json()) as PlanTemplateResponse;
}

async function deletePlanTemplate(planTemplateId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/plan-templates/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: planTemplateId,
    }),
  });

  if (!response.ok) {
    const fallback =
      response.status === 404
        ? PLAN_TEMPLATE_NOT_FOUND_MESSAGE
        : DELETE_PLAN_TEMPLATE_ERROR_MESSAGE;
    const errorMessage = await readErrorMessage(response, fallback);
    throw createApiError(response.status, errorMessage);
  }
}

export function PlanTemplateScreen({
  navigation,
  activeTrainingId = null,
  planTemplateId,
}: PlanTemplateScreenProps) {
  const insets = useSafeAreaInsets();

  const draftRef = useRef<PlanTemplateDraft>(buildInitialDraft(planTemplateId));
  const originalSnapshotRef = useRef<string | null>(null);
  const isDirtyRef = useRef(false);

  const [screenState, setScreenState] = useState<PlanTemplateViewState>('loading');
  const [draft, setDraft] = useState<PlanTemplateDraft>(() =>
    buildInitialDraft(planTemplateId),
  );
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [bannerState, setBannerState] = useState<BannerState | null>(null);
  const [hasLoadedTemplate, setHasLoadedTemplate] = useState(false);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const updateDraft = useCallback(
    (updater: (current: PlanTemplateDraft) => PlanTemplateDraft) => {
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

  const navigateBackToPlanTemplates = useCallback(() => {
    if (navigation?.goBack) {
      navigation.goBack();
      return;
    }

    navigateToRoute('/settings/plan-templates');
  }, [navigation, navigateToRoute]);

  const currentSnapshot = useMemo(
    () => buildComparableSnapshot(draft.name, draft.days),
    [draft.days, draft.name],
  );
  const isDirty = useMemo(() => {
    if (originalSnapshotRef.current == null) {
      return false;
    }

    return originalSnapshotRef.current !== currentSnapshot;
  }, [currentSnapshot]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const confirmDiscardChanges = useCallback(
    (onDiscard: () => void) => {
      if (draftRef.current.isSaving || draftRef.current.isDeleting) {
        return;
      }

      if (!isDirtyRef.current) {
        onDiscard();
        return;
      }

      Alert.alert(
        'Discard changes?',
        'You have unsaved plan template data.',
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
    },
    [],
  );

  const handleBackAction = useCallback(() => {
    confirmDiscardChanges(() => {
      navigateBackToPlanTemplates();
    });
  }, [confirmDiscardChanges, navigateBackToPlanTemplates]);

  const loadData = useCallback(async () => {
    setScreenState('loading');

    try {
      const [loadedExerciseOptions, loadedPlanTemplate] = await Promise.all([
        fetchExerciseOptions(),
        fetchPlanTemplate(planTemplateId),
      ]);

      setExerciseOptions(loadedExerciseOptions);

      const mappedDraft = mapResponseToDraft(loadedPlanTemplate, loadedExerciseOptions);
      const nextDraft: PlanTemplateDraft = {
        id: mappedDraft.id,
        name: mappedDraft.name,
        days: mappedDraft.days,
        activeDayIndex: 0,
        isSaving: false,
        isDeleting: false,
      };

      updateDraft(() => nextDraft);
      originalSnapshotRef.current = buildComparableSnapshot(
        nextDraft.name,
        nextDraft.days,
      );

      setBannerState(null);
      setHasLoadedTemplate(true);
      setScreenState('default');
      setHasSubmitted(false);
    } catch (error) {
      const statusCode = (error as ApiError).status;

      if (statusCode === 404) {
        setHasLoadedTemplate(false);
        setScreenState('notFound');
        setBannerState({
          tone: 'error',
          message: PLAN_TEMPLATE_NOT_FOUND_MESSAGE,
        });
      } else if (isOfflineError(error)) {
        setScreenState('offline');
        setBannerState({
          tone: 'offline',
          message: OFFLINE_MESSAGE,
        });
      } else {
        setHasLoadedTemplate(false);
        setScreenState('error');
        setBannerState({
          tone: 'error',
          message: (error as Error).message || LOAD_PLAN_TEMPLATE_ERROR_MESSAGE,
        });
      }
    }
  }, [planTemplateId, updateDraft]);

  useEffect(() => {
    loadData().catch(() => undefined);
  }, [loadData]);

  useEffect(() => {
    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
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
    !hasLoadedTemplate ||
    draft.isSaving ||
    draft.isDeleting ||
    screenState === 'offline' ||
    screenState === 'notFound' ||
    !isDirty ||
    !validation.isValid;

  const isDeleteDisabled =
    !hasLoadedTemplate ||
    draft.isSaving ||
    draft.isDeleting ||
    screenState === 'offline' ||
    screenState === 'notFound';

  const isConnectionIndicatorVisible =
    screenState === 'offline' || bannerState?.tone === 'offline';

  const handleOfflineInfoPress = useCallback(() => {
    Alert.alert(OFFLINE_MESSAGE);
  }, []);

  const handleTemplateNameChange = useCallback(
    (value: string) => {
      updateDraft(current => ({
        ...current,
        name: value,
      }));

      setScreenState(previousState => {
        if (previousState === 'loading' || previousState === 'offline') {
          return previousState;
        }

        return 'default';
      });
    },
    [updateDraft],
  );

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
  }, [updateDraft]);

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
          activeDayIndex: nextActiveIndex,
        };
      });
    },
    [updateDraft],
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
    },
    [updateDraft],
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
    },
    [updateDraft],
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
    },
    [updateDraft],
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
        const nextExercise = {
          ...nextDay.exercises[exerciseIndex],
          exerciseSearchQuery: query,
        };
        nextDay.exercises[exerciseIndex] = nextExercise;
        nextDays[dayIndex] = nextDay;

        return {
          ...current,
          days: nextDays,
        };
      });
    },
    [updateDraft],
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
    },
    [updateDraft],
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
    },
    [updateDraft],
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
    },
    [updateDraft],
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
    },
    [updateDraft],
  );

  const handleSubmitUpdate = useCallback(async () => {
    if (draftRef.current.isSaving || draftRef.current.isDeleting) {
      return;
    }

    setHasSubmitted(true);

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

    const payload = buildMutationPayload(
      draftRef.current.id,
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
      const updated = await updatePlanTemplate(payload);
      const normalizedDraft = mapResponseToDraft(updated, exerciseOptions);

      const nextActiveDayIndex = Math.min(
        draftRef.current.activeDayIndex,
        normalizedDraft.days.length - 1,
      );

      const nextDraft: PlanTemplateDraft = {
        id: normalizedDraft.id,
        name: normalizedDraft.name,
        days: normalizedDraft.days,
        activeDayIndex: Math.max(nextActiveDayIndex, 0),
        isSaving: false,
        isDeleting: false,
      };

      updateDraft(() => nextDraft);
      originalSnapshotRef.current = buildComparableSnapshot(
        nextDraft.name,
        nextDraft.days,
      );

      setScreenState('default');
      setBannerState(null);
      setHasSubmitted(false);
      Alert.alert('Plan template updated');
    } catch (error) {
      const statusCode = (error as ApiError).status;

      if (statusCode === 404) {
        setHasLoadedTemplate(false);
        setScreenState('notFound');
        setBannerState({
          tone: 'error',
          message: PLAN_TEMPLATE_NOT_FOUND_MESSAGE,
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
          message: (error as Error).message || UPDATE_PLAN_TEMPLATE_ERROR_MESSAGE,
        });
      }

      updateDraft(current => ({
        ...current,
        isSaving: false,
      }));
    }
  }, [exerciseOptions, screenState, updateDraft]);

  const executeDelete = useCallback(async () => {
    if (draftRef.current.isSaving || draftRef.current.isDeleting) {
      return;
    }

    if (screenState === 'offline') {
      setBannerState({
        tone: 'offline',
        message: OFFLINE_MESSAGE,
      });
      return;
    }

    updateDraft(current => ({
      ...current,
      isDeleting: true,
    }));
    setScreenState('loading');
    setBannerState(null);

    try {
      await deletePlanTemplate(draftRef.current.id);
      Alert.alert('Plan template deleted');
      replaceRoute('/settings/plan-templates');
    } catch (error) {
      const statusCode = (error as ApiError).status;

      if (statusCode === 404) {
        setHasLoadedTemplate(false);
        setScreenState('notFound');
        setBannerState({
          tone: 'error',
          message: PLAN_TEMPLATE_NOT_FOUND_MESSAGE,
        });
      } else if (isOfflineError(error)) {
        setScreenState('offline');
        setBannerState({
          tone: 'offline',
          message: OFFLINE_MESSAGE,
        });
      } else {
        setScreenState('error');
        setBannerState({
          tone: 'error',
          message: (error as Error).message || DELETE_PLAN_TEMPLATE_ERROR_MESSAGE,
        });
      }

      updateDraft(current => ({
        ...current,
        isDeleting: false,
      }));
    }
  }, [replaceRoute, screenState, updateDraft]);

  const handleDeletePress = useCallback(() => {
    Alert.alert(
      'Delete plan template?',
      'This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            executeDelete().catch(() => undefined);
          },
        },
      ],
      { cancelable: true },
    );
  }, [executeDelete]);

  const handleBottomNavigation = useCallback(
    (route: AppShellRoute) => {
      confirmDiscardChanges(() => {
        navigateToRoute(route);
      });
    },
    [confirmDiscardChanges, navigateToRoute],
  );

  const contentBottomPadding = useMemo(() => 24, []);
  const actionSectionBottomPadding = useMemo(
    () => BOTTOM_MENU_HEIGHT + insets.bottom + 12,
    [insets.bottom],
  );

  const visibleNameError = hasSubmitted ? validation.errors.name : undefined;
  const visibleDaysError = hasSubmitted ? validation.errors.days : undefined;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container} testID="screen.planTemplates.details">
        <GlobalHeader
          title="Plan Template"
          leftAction={{
            label: 'Back',
            onPress: handleBackAction,
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
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: contentBottomPadding }]}
            keyboardShouldPersistTaps="handled">
            {bannerState && bannerState.tone !== 'offline' ? (
              <View style={styles.bannerBlock}>
                <StatusBanner tone={bannerState.tone} message={bannerState.message} />
              </View>
            ) : null}

            {screenState === 'loading' && !hasLoadedTemplate ? (
              <View style={styles.loadingCard}>
                <LoadingSkeleton rows={6} rowHeight={40} />
              </View>
            ) : null}

            {screenState === 'notFound' ? (
              <View style={styles.notFoundSection} testID="text.planTemplates.notFound">
                <Text style={styles.notFoundTitle}>Plan template not found.</Text>
                <Pressable
                  testID="button.planTemplates.backToList"
                  accessibilityRole="button"
                  onPress={navigateBackToPlanTemplates}
                  style={({ pressed }) => [
                    styles.notFoundButton,
                    pressed && styles.notFoundButtonPressed,
                  ]}>
                  <Text style={styles.notFoundButtonText}>Back to list</Text>
                </Pressable>
              </View>
            ) : hasLoadedTemplate ? (
              <>
                <View style={styles.section}>
                  <Text style={styles.fieldLabel}>Name</Text>
                  <TextInput
                    testID="input.planTemplates.name"
                    accessibilityLabel="Plan template name"
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!draft.isSaving && !draft.isDeleting && hasLoadedTemplate}
                    onChangeText={handleTemplateNameChange}
                    placeholder="Enter plan template name"
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
                            testID={`tab.planTemplates.day.${dayIndex}`}
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
                      testID="button.planTemplates.day.add"
                      accessibilityRole="button"
                      accessibilityLabel="Add plan day"
                      disabled={!hasLoadedTemplate || draft.isSaving || draft.isDeleting}
                      onPress={handleAddDay}
                      style={({ pressed }) => [
                        styles.addDayButton,
                        (!hasLoadedTemplate || draft.isSaving || draft.isDeleting) &&
                          styles.buttonDisabled,
                        pressed &&
                          !(!hasLoadedTemplate || draft.isSaving || draft.isDeleting) &&
                          styles.addDayButtonPressed,
                      ]}>
                      <Text style={styles.addDayButtonText}>+</Text>
                    </Pressable>
                  </View>

                  {visibleDaysError ? <Text style={styles.fieldErrorText}>{visibleDaysError}</Text> : null}
                </View>

                {activeDay ? (
                  <PlanDayView
                    dayIndex={draft.activeDayIndex}
                    value={activeDay}
                    errors={activeDayErrors}
                    exerciseOptions={exerciseOptions}
                    disabled={!hasLoadedTemplate || draft.isSaving || draft.isDeleting}
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

          {screenState !== 'notFound' && hasLoadedTemplate ? (
            <View style={[styles.actionsSection, { paddingBottom: actionSectionBottomPadding }]}>
              <View style={styles.actionsRow}>
                <Pressable
                  testID="button.planTemplates.save"
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

                <Pressable
                  testID="button.planTemplates.delete"
                  accessibilityRole="button"
                  disabled={isDeleteDisabled}
                  onPress={handleDeletePress}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    isDeleteDisabled && styles.buttonDisabled,
                    pressed && !isDeleteDisabled && styles.deleteButtonPressed,
                  ]}>
                  <Text style={styles.deleteButtonText}>
                    {draft.isDeleting ? 'Deleting...' : 'X'}
                  </Text>
                  {draft.isDeleting ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        <BottomMenu
          activeRoute="/settings"
          activeTrainingId={activeTrainingId}
          onNavigate={handleBottomNavigation}
        />
      </View>
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
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButton: {
    flex: 1,
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
  deleteButton: {
    minHeight: 48,
    minWidth: 48,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
  },
  deleteButtonPressed: {
    backgroundColor: '#B91C1C',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
