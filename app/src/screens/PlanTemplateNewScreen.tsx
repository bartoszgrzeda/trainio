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
import { StatusBanner, StatusBannerTone } from '../components/shell/StatusBanner';
import { getApiBaseUrl } from '../config/api';
import { PlanDayView } from '../components/planTemplates/PlanDayView';
import { ExerciseOption, PlanDayDraft } from '../components/planTemplates/types';
import {
  ApiError,
  buildMutationPayload,
  createApiError,
  createPlanDayDraft,
  createPlanDayExerciseDraft,
  createExerciseSetDraft,
  dedupeExerciseOptions,
  isOfflineError,
  mapResponseToDraft,
  sortExerciseOptionsByName,
  validatePlanTemplateDraft,
  PlanTemplateResponse,
} from './planTemplateEditorUtils';

type PlanTemplateNewViewState =
  | 'default'
  | 'loading'
  | 'error'
  | 'offline'
  | 'disabled';

interface PlanTemplateNewDraft {
  name: string;
  days: PlanDayDraft[];
  activeDayIndex: number;
  isDirty: boolean;
  isSaving: boolean;
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

interface PlanTemplateNewScreenProps {
  navigation?: NavigationLike;
  activeTrainingId?: string | null;
}

const API_BASE_URL = getApiBaseUrl();

const OFFLINE_MESSAGE = 'No internet connection';
const LOAD_EXERCISES_ERROR_MESSAGE = 'Could not load exercises list. Try again.';
const CREATE_PLAN_TEMPLATE_ERROR_MESSAGE = 'Could not create plan template. Try again.';

function buildInitialDraft(): PlanTemplateNewDraft {
  return {
    name: '',
    days: [createPlanDayDraft(0)],
    activeDayIndex: 0,
    isDirty: false,
    isSaving: false,
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

async function createPlanTemplate(
  requestBody: ReturnType<typeof buildMutationPayload>,
): Promise<PlanTemplateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/plan-templates/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: requestBody.name,
      days: requestBody.days,
    }),
  });

  if (!response.ok) {
    const errorMessage = await readErrorMessage(response, CREATE_PLAN_TEMPLATE_ERROR_MESSAGE);
    throw createApiError(response.status, errorMessage);
  }

  return (await response.json()) as PlanTemplateResponse;
}

export function PlanTemplateNewScreen({
  navigation,
  activeTrainingId = null,
}: PlanTemplateNewScreenProps) {
  const insets = useSafeAreaInsets();
  const draftRef = useRef<PlanTemplateNewDraft>(buildInitialDraft());

  const [screenState, setScreenState] = useState<PlanTemplateNewViewState>('loading');
  const [draft, setDraft] = useState<PlanTemplateNewDraft>(buildInitialDraft);
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [bannerState, setBannerState] = useState<BannerState | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const updateDraft = useCallback(
    (updater: (current: PlanTemplateNewDraft) => PlanTemplateNewDraft) => {
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

  const confirmDiscardChanges = useCallback(
    (onDiscard: () => void) => {
      if (draftRef.current.isSaving) {
        return;
      }

      if (!draftRef.current.isDirty) {
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

  const loadExerciseCatalog = useCallback(async () => {
    setIsInitializing(true);

    try {
      const loadedExerciseOptions = await fetchExerciseOptions();
      setExerciseOptions(loadedExerciseOptions);
      setScreenState('default');
      setBannerState(null);
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
          message: (error as Error).message || LOAD_EXERCISES_ERROR_MESSAGE,
        });
      }
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    loadExerciseCatalog().catch(() => undefined);
  }, [loadExerciseCatalog]);

  useEffect(() => {
    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!draftRef.current.isDirty) {
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
    isInitializing ||
    draft.isSaving ||
    screenState === 'offline' ||
    !draft.isDirty ||
    !validation.isValid;

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
        isDirty: true,
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
        isDirty: true,
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
          isDirty: true,
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
          isDirty: true,
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
          isDirty: true,
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
          isDirty: true,
        };
      });
    },
    [updateDraft],
  );

  const handleMoveExercise = useCallback(
    (dayIndex: number, exerciseIndex: number, direction: 'up' | 'down') => {
      updateDraft(current => {
        const day = current.days[dayIndex];
        if (!day || day.exercises.length <= 1) {
          return current;
        }

        const targetIndex =
          direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1;

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
          isDirty: true,
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
          isDirty: true,
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
          isDirty: true,
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
          isDirty: true,
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
          isDirty: true,
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
          isDirty: true,
        };
      });
    },
    [updateDraft],
  );

  const handleSubmitCreate = useCallback(async () => {
    if (draftRef.current.isSaving) {
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

    const payload = buildMutationPayload(undefined, draftRef.current.name, draftRef.current.days);

    updateDraft(current => ({
      ...current,
      isSaving: true,
    }));
    setScreenState('loading');
    setBannerState(null);

    try {
      const created = await createPlanTemplate(payload);
      const normalizedDraft = mapResponseToDraft(created, exerciseOptions);

      updateDraft(current => ({
        ...current,
        name: normalizedDraft.name,
        days: normalizedDraft.days,
        activeDayIndex: 0,
        isSaving: false,
      }));

      Alert.alert('Plan template created');
      replaceRoute(`/settings/plan-templates/${encodeURIComponent(created.id)}`);
    } catch (error) {
      if (isOfflineError(error)) {
        setScreenState('offline');
        setBannerState({
          tone: 'offline',
          message: OFFLINE_MESSAGE,
        });
      } else {
        const statusCode = (error as ApiError).status;
        setScreenState(statusCode === 400 ? 'disabled' : 'error');
        setBannerState({
          tone: 'error',
          message: (error as Error).message || CREATE_PLAN_TEMPLATE_ERROR_MESSAGE,
        });
      }

      updateDraft(current => ({
        ...current,
        isSaving: false,
      }));
    }
  }, [exerciseOptions, replaceRoute, screenState, updateDraft]);

  const handleBottomNavigation = useCallback(
    (route: AppShellRoute) => {
      confirmDiscardChanges(() => {
        navigateToRoute(route);
      });
    },
    [confirmDiscardChanges, navigateToRoute],
  );

  const contentBottomPadding = useMemo(() => 24, []);
  const saveSectionBottomPadding = useMemo(
    () => BOTTOM_MENU_HEIGHT + insets.bottom + 12,
    [insets.bottom],
  );

  const visibleNameError = hasSubmitted ? validation.errors.name : undefined;
  const visibleDaysError = hasSubmitted ? validation.errors.days : undefined;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container} testID="screen.planTemplates.new">
        <GlobalHeader
          title="New Plan Template"
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

            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                testID="input.planTemplates.name"
                accessibilityLabel="Plan template name"
                autoCapitalize="words"
                autoCorrect={false}
                editable={!draft.isSaving}
                onChangeText={handleTemplateNameChange}
                placeholder="Enter plan template name"
                style={styles.input}
                value={draft.name}
              />

              {visibleNameError ? (
                <Text style={styles.fieldErrorText}>{visibleNameError}</Text>
              ) : null}
            </View>

            {isInitializing && exerciseOptions.length === 0 ? (
              <View style={styles.loadingSection}>
                <ActivityIndicator color="#1D4ED8" size="small" />
                <Text style={styles.loadingText}>Loading exercise options...</Text>
              </View>
            ) : null}

            {activeDay ? (
              <PlanDayView
                dayIndex={draft.activeDayIndex}
                value={activeDay}
                errors={activeDayErrors}
                topSlot={
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

                    <View style={styles.dayActionsRow}>
                      <Pressable
                        testID="button.planTemplates.day.add"
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

                      <Pressable
                        testID={`button.planTemplates.day.${draft.activeDayIndex}.remove`}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove day ${draft.activeDayIndex + 1}`}
                        disabled={draft.isSaving || draft.days.length <= 1}
                        onPress={() => {
                          handleRemoveDay(draft.activeDayIndex);
                        }}
                        style={({ pressed }) => [
                          styles.removeDayButton,
                          (draft.isSaving || draft.days.length <= 1) && styles.buttonDisabled,
                          pressed &&
                            !(draft.isSaving || draft.days.length <= 1) &&
                            styles.removeDayButtonPressed,
                        ]}>
                        <Text style={styles.removeDayButtonText}>X</Text>
                      </Pressable>
                    </View>
                  </View>
                }
                topSlotError={visibleDaysError}
                showDayHeader={false}
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
                  handleExerciseSearchChange(draft.activeDayIndex, exerciseIndex, query);
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
          </ScrollView>

          <View style={[styles.saveSection, { paddingBottom: saveSectionBottomPadding }]}>
            <Pressable
              testID="button.planTemplates.save"
              accessibilityRole="button"
              disabled={isSaveDisabled}
              onPress={() => {
                handleSubmitCreate().catch(() => undefined);
              }}
              style={({ pressed }) => [
                styles.saveButton,
                isSaveDisabled && styles.buttonDisabled,
                pressed && !isSaveDisabled && styles.saveButtonPressed,
              ]}>
              <Text style={styles.saveButtonText}>{draft.isSaving ? 'Saving...' : 'Save'}</Text>
              {draft.isSaving ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
            </Pressable>
          </View>
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
  dayActionsRow: {
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
  removeDayButton: {
    minHeight: 40,
    minWidth: 40,
    borderRadius: 12,
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
    fontSize: 15,
  },
  loadingSection: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
  saveSection: {
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
