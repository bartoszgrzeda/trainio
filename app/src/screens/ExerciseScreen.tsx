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

type ExerciseViewState =
  | 'default'
  | 'loading'
  | 'empty'
  | 'error'
  | 'offline'
  | 'disabled';

interface ExerciseDraft {
  id: string;
  name: string;
  originalName: string;
  source: string;
  isDirty: boolean;
  isSaving: boolean;
  isDeleting: boolean;
}

interface ExerciseFormErrors {
  name?: string;
}

interface ExerciseItem {
  id: string;
  name: string;
  source?: string;
}

interface ExercisesResponse {
  exercises?: ExerciseItem[];
}

interface ExerciseMutationResponse {
  id: string;
  name: string;
  source?: string;
}

interface BannerState {
  tone: StatusBannerTone;
  message: string;
}

interface ApiError extends Error {
  status?: number;
}

interface NavigationLike {
  navigate: (route: string) => void;
  goBack?: () => void;
  replace?: (route: string) => void;
}

interface ExerciseScreenProps {
  navigation?: NavigationLike;
  activeTrainingId?: string | null;
  exerciseId: string;
}

const API_BASE_URL = 'http://localhost:3000';

const NAME_PLACEHOLDER = 'Enter exercise name';
const NAME_REQUIRED_MESSAGE = 'Exercise name is required.';
const NAME_LENGTH_MESSAGE = 'Exercise name must be between 2 and 80 characters.';
const NAME_DUPLICATE_MESSAGE = 'Exercise with this name already exists.';
const OFFLINE_MESSAGE = 'No internet connection';
const LOAD_EXERCISE_ERROR_MESSAGE = 'Could not load exercise. Try again.';
const UPDATE_EXERCISE_ERROR_MESSAGE = 'Could not update exercise. Try again.';
const DELETE_EXERCISE_ERROR_MESSAGE = 'Could not delete exercise. Try again.';
const EXERCISE_NOT_FOUND_MESSAGE = 'Exercise not found.';

function buildInitialDraft(exerciseId: string): ExerciseDraft {
  return {
    id: exerciseId,
    name: '',
    originalName: '',
    source: 'custom',
    isDirty: false,
    isSaving: false,
    isDeleting: false,
  };
}

function normalizeNameForSubmit(value: string): string {
  return value.trim();
}

function normalizeNameForCompare(value: string): string {
  return normalizeNameForSubmit(value).toLocaleLowerCase();
}

function computeDirtyFlag(name: string, originalName: string): boolean {
  return normalizeNameForSubmit(name) !== normalizeNameForSubmit(originalName);
}

function validateName(
  rawName: string,
  existingCustomNames: Set<string>,
): string | undefined {
  const normalizedName = normalizeNameForSubmit(rawName);
  if (normalizedName.length === 0) {
    return NAME_REQUIRED_MESSAGE;
  }

  if (normalizedName.length < 2 || normalizedName.length > 80) {
    return NAME_LENGTH_MESSAGE;
  }

  if (existingCustomNames.has(normalizeNameForCompare(normalizedName))) {
    return NAME_DUPLICATE_MESSAGE;
  }

  return undefined;
}

function createApiError(status: number, fallbackMessage: string): ApiError {
  const error = new Error(fallbackMessage) as ApiError;
  error.status = status;
  return error;
}

function isOfflineError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return /offline|internet|network/i.test(error.message);
}

async function fetchExercises(): Promise<ExerciseItem[]> {
  const params = new URLSearchParams({
    query: '',
    includeSeeded: 'true',
  });

  const response = await fetch(`${API_BASE_URL}/api/exercises/list?${params.toString()}`);
  if (!response.ok) {
    throw createApiError(response.status, LOAD_EXERCISE_ERROR_MESSAGE);
  }

  const payload = (await response.json()) as ExercisesResponse;
  return payload.exercises ?? [];
}

async function updateExercise(
  id: string,
  name: string,
): Promise<ExerciseMutationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/exercises/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, name }),
  });

  if (!response.ok) {
    throw createApiError(response.status, UPDATE_EXERCISE_ERROR_MESSAGE);
  }

  return (await response.json()) as ExerciseMutationResponse;
}

async function deleteExercise(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/exercises/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    throw createApiError(response.status, DELETE_EXERCISE_ERROR_MESSAGE);
  }
}

export function ExerciseScreen({
  navigation,
  activeTrainingId = null,
  exerciseId,
}: ExerciseScreenProps) {
  const insets = useSafeAreaInsets();
  const draftRef = useRef<ExerciseDraft>(buildInitialDraft(exerciseId));

  const [screenState, setScreenState] = useState<ExerciseViewState>('loading');
  const [draft, setDraft] = useState<ExerciseDraft>(() => buildInitialDraft(exerciseId));
  const [fieldErrors, setFieldErrors] = useState<ExerciseFormErrors>({});
  const [existingCustomNames, setExistingCustomNames] = useState<Set<string>>(
    () => new Set<string>(),
  );
  const [bannerState, setBannerState] = useState<BannerState | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isExerciseAvailable, setIsExerciseAvailable] = useState(false);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const updateDraft = useCallback((nextDraft: ExerciseDraft) => {
    const normalizedDraft: ExerciseDraft = {
      ...nextDraft,
      isDirty: computeDirtyFlag(nextDraft.name, nextDraft.originalName),
    };

    draftRef.current = normalizedDraft;
    setDraft(normalizedDraft);
  }, []);

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

  const navigateBackToExercises = useCallback(() => {
    if (navigation?.goBack) {
      navigation.goBack();
      return;
    }

    navigateToRoute('/settings/exercises');
  }, [navigation, navigateToRoute]);

  const replaceWithExercisesList = useCallback(() => {
    if (navigation?.replace) {
      navigation.replace('/settings/exercises');
      return;
    }

    navigateToRoute('/settings/exercises');
  }, [navigation, navigateToRoute]);

  const confirmDiscardChanges = useCallback(
    (onDiscard: () => void) => {
      if (draftRef.current.isSaving || draftRef.current.isDeleting) {
        return;
      }

      if (!draftRef.current.isDirty) {
        onDiscard();
        return;
      }

      Alert.alert(
        'Discard changes?',
        'You have unsaved exercise data.',
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
      navigateBackToExercises();
    });
  }, [confirmDiscardChanges, navigateBackToExercises]);

  const loadExercise = useCallback(async () => {
    setIsInitializing(true);
    setScreenState('loading');

    try {
      const exercises = await fetchExercises();
      const selectedExercise = exercises.find(item => item.id === exerciseId);

      if (!selectedExercise) {
        setIsExerciseAvailable(false);
        setScreenState('error');
        setBannerState({
          tone: 'error',
          message: EXERCISE_NOT_FOUND_MESSAGE,
        });
        return;
      }

      const nextDraft: ExerciseDraft = {
        id: selectedExercise.id,
        name: selectedExercise.name,
        originalName: selectedExercise.name,
        source: selectedExercise.source ?? 'custom',
        isDirty: false,
        isSaving: false,
        isDeleting: false,
      };

      const customNames = exercises
        .filter(
          item =>
            (item.source ?? '').toLocaleLowerCase() === 'custom' &&
            item.id !== selectedExercise.id,
        )
        .map(item => normalizeNameForCompare(item.name))
        .filter(name => name.length > 0);

      updateDraft(nextDraft);
      setExistingCustomNames(new Set(customNames));
      setFieldErrors({});
      setBannerState(null);
      setIsExerciseAvailable(true);
      setScreenState('default');
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
          message: LOAD_EXERCISE_ERROR_MESSAGE,
        });
      }
    } finally {
      setIsInitializing(false);
    }
  }, [exerciseId, updateDraft]);

  useEffect(() => {
    loadExercise().catch(() => undefined);
  }, [loadExercise]);

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

  const computedNameError = useMemo(
    () => validateName(draft.name, existingCustomNames),
    [draft.name, existingCustomNames],
  );

  const isUpdateDisabled =
    !isExerciseAvailable ||
    isInitializing ||
    draft.isSaving ||
    draft.isDeleting ||
    screenState === 'offline' ||
    !draft.isDirty ||
    computedNameError != null;

  const isDeleteDisabled =
    !isExerciseAvailable ||
    isInitializing ||
    draft.isSaving ||
    draft.isDeleting ||
    screenState === 'offline';

  const handleNameChange = useCallback(
    (value: string) => {
      const nextDraft = {
        ...draftRef.current,
        name: value,
      };

      updateDraft(nextDraft);
      setFieldErrors(currentErrors => ({
        ...currentErrors,
        name: undefined,
      }));

      setBannerState(currentValue =>
        currentValue?.tone === 'error' || currentValue?.tone === 'info'
          ? null
          : currentValue,
      );

      setScreenState(previousState => {
        if (previousState === 'offline' || previousState === 'loading') {
          return previousState;
        }

        return normalizeNameForSubmit(nextDraft.name).length === 0
          ? 'empty'
          : 'default';
      });
    },
    [updateDraft],
  );

  const handleNameBlur = useCallback(() => {
    setFieldErrors(currentErrors => ({
      ...currentErrors,
      name: validateName(draftRef.current.name, existingCustomNames),
    }));
  }, [existingCustomNames]);

  const handleSubmitUpdate = useCallback(async () => {
    if (draftRef.current.isSaving || draftRef.current.isDeleting) {
      return;
    }

    const normalizedName = normalizeNameForSubmit(draftRef.current.name);
    const normalizedDraft: ExerciseDraft = {
      ...draftRef.current,
      name: normalizedName,
      isDirty: computeDirtyFlag(normalizedName, draftRef.current.originalName),
    };

    updateDraft(normalizedDraft);

    const nameError = validateName(normalizedName, existingCustomNames);
    setFieldErrors({ name: nameError });

    if (nameError || !normalizedDraft.isDirty) {
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

    setDraft(currentValue => ({
      ...currentValue,
      isSaving: true,
    }));
    setScreenState('loading');
    setBannerState(null);

    try {
      const response = await updateExercise(normalizedDraft.id, normalizedName);
      const updatedName = response.name ?? normalizedName;

      setDraft(currentValue => ({
        ...currentValue,
        name: updatedName,
        originalName: updatedName,
        isDirty: false,
      }));

      Alert.alert('Exercise updated');
      replaceWithExercisesList();
    } catch (error) {
      const statusCode = (error as ApiError).status;

      if (isOfflineError(error)) {
        setScreenState('offline');
        setBannerState({
          tone: 'offline',
          message: OFFLINE_MESSAGE,
        });
      } else if (statusCode === 409) {
        setScreenState('disabled');
        setFieldErrors({
          name: NAME_DUPLICATE_MESSAGE,
        });
        setBannerState(null);
      } else {
        setScreenState('error');
        setBannerState({
          tone: 'error',
          message: UPDATE_EXERCISE_ERROR_MESSAGE,
        });
      }
    } finally {
      setDraft(currentValue => ({
        ...currentValue,
        isSaving: false,
      }));
    }
  }, [existingCustomNames, replaceWithExercisesList, screenState, updateDraft]);

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

    setDraft(currentValue => ({
      ...currentValue,
      isDeleting: true,
    }));
    setScreenState('loading');
    setBannerState(null);

    try {
      await deleteExercise(draftRef.current.id);
      Alert.alert('Exercise deleted');
      replaceWithExercisesList();
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
          message: DELETE_EXERCISE_ERROR_MESSAGE,
        });
      }
    } finally {
      setDraft(currentValue => ({
        ...currentValue,
        isDeleting: false,
      }));
    }
  }, [replaceWithExercisesList, screenState]);

  const handleDeletePress = useCallback(() => {
    Alert.alert(
      'Delete exercise?',
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

  const contentBottomPadding = useMemo(
    () => 24,
    [],
  );
  const actionSectionBottomPadding = useMemo(
    () => BOTTOM_MENU_HEIGHT + insets.bottom + 12,
    [insets.bottom],
  );

  const isConnectionIndicatorVisible =
    screenState === 'offline' ||
    bannerState?.tone === 'offline';
  const handleOfflineInfoPress = useCallback(() => {
    Alert.alert(OFFLINE_MESSAGE);
  }, []);

  const displayedNameError =
    fieldErrors.name ??
    (screenState === 'disabled' ? validateName(draft.name, existingCustomNames) : undefined);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        <GlobalHeader
          title="Exercise"
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

            <View style={styles.section}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput
                  accessibilityLabel="Exercise name"
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!draft.isSaving && !draft.isDeleting && isExerciseAvailable}
                  onBlur={handleNameBlur}
                  onChangeText={handleNameChange}
                  placeholder={NAME_PLACEHOLDER}
                  style={styles.input}
                  value={draft.name}
                />
                {displayedNameError ? (
                  <Text style={styles.fieldErrorText}>{displayedNameError}</Text>
                ) : null}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.actionsSection, { paddingBottom: actionSectionBottomPadding }]}>
            <View style={styles.actionsRow}>
              <Pressable
                accessibilityRole="button"
                disabled={isUpdateDisabled}
                onPress={() => {
                  handleSubmitUpdate().catch(() => undefined);
                }}
                style={({ pressed }) => [
                  styles.updateButton,
                  isUpdateDisabled && styles.buttonDisabled,
                  pressed && !isUpdateDisabled && styles.updateButtonPressed,
                ]}>
                <Text style={styles.updateButtonText}>
                  {draft.isSaving ? 'Saving...' : 'Save'}
                </Text>
                {draft.isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : null}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={isDeleteDisabled}
                onPress={handleDeletePress}
                style={({ pressed }) => [
                  styles.deleteButton,
                  isDeleteDisabled && styles.buttonDisabled,
                  pressed && !isDeleteDisabled && styles.deleteButtonPressed,
                ]}>
                <Text style={styles.deleteButtonText}>X</Text>
              </Pressable>
            </View>
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
    padding: 16,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#B91C1C',
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
  updateButton: {
    flex: 85,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  updateButtonPressed: {
    backgroundColor: '#1E40AF',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteButton: {
    flex: 15,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  deleteButtonPressed: {
    backgroundColor: '#B91C1C',
  },
  deleteButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
