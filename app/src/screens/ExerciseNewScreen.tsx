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

type ExerciseNewViewState =
  | 'default'
  | 'loading'
  | 'empty'
  | 'error'
  | 'offline'
  | 'disabled';

interface ExerciseFormDraft {
  name: string;
  isDirty: boolean;
  isSaving: boolean;
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

interface NewExerciseResponse {
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

interface ExerciseNewScreenProps {
  navigation?: NavigationLike;
  activeTrainingId?: string | null;
}

const API_BASE_URL = 'http://localhost:3000';

const NAME_PLACEHOLDER = 'Enter exercise name';
const NAME_REQUIRED_MESSAGE = 'Exercise name is required.';
const NAME_LENGTH_MESSAGE = 'Exercise name must be between 2 and 80 characters.';
const NAME_DUPLICATE_MESSAGE = 'Exercise with this name already exists.';
const LOAD_FORM_ERROR_MESSAGE = 'Could not load exercises list. Try again.';
const CREATE_EXERCISE_ERROR_MESSAGE = 'Could not create exercise. Try again.';
const OFFLINE_MESSAGE = 'No internet connection';

function buildInitialDraft(): ExerciseFormDraft {
  return {
    name: '',
    isDirty: false,
    isSaving: false,
  };
}

function normalizeNameForSubmit(value: string): string {
  return value.trim();
}

function normalizeNameForCompare(value: string): string {
  return normalizeNameForSubmit(value).toLocaleLowerCase();
}

function computeDirtyFlag(name: string): boolean {
  return name.length > 0;
}

function resolveInteractiveState(draft: ExerciseFormDraft): ExerciseNewViewState {
  return normalizeNameForSubmit(draft.name).length === 0 ? 'empty' : 'default';
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

async function fetchCustomExerciseNames(): Promise<Set<string>> {
  const params = new URLSearchParams({
    query: '',
    includeSeeded: 'true',
  });

  const response = await fetch(`${API_BASE_URL}/api/exercises/list?${params.toString()}`);
  if (!response.ok) {
    throw createApiError(response.status, LOAD_FORM_ERROR_MESSAGE);
  }

  const payload = (await response.json()) as ExercisesResponse;
  const customNames = (payload.exercises ?? [])
    .filter(exercise => (exercise.source ?? '').toLocaleLowerCase() === 'custom')
    .map(exercise => normalizeNameForCompare(exercise.name))
    .filter(name => name.length > 0);

  return new Set(customNames);
}

async function createExercise(name: string): Promise<NewExerciseResponse> {
  const response = await fetch(`${API_BASE_URL}/api/exercises/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw createApiError(response.status, CREATE_EXERCISE_ERROR_MESSAGE);
  }

  return (await response.json()) as NewExerciseResponse;
}

export function ExerciseNewScreen({
  navigation,
  activeTrainingId = null,
}: ExerciseNewScreenProps) {
  const insets = useSafeAreaInsets();
  const draftRef = useRef<ExerciseFormDraft>(buildInitialDraft());

  const [screenState, setScreenState] = useState<ExerciseNewViewState>('empty');
  const [draft, setDraft] = useState<ExerciseFormDraft>(buildInitialDraft);
  const [fieldErrors, setFieldErrors] = useState<ExerciseFormErrors>({});
  const [existingCustomNames, setExistingCustomNames] = useState<Set<string>>(
    () => new Set<string>(),
  );
  const [bannerState, setBannerState] = useState<BannerState | null>(null);
  const [isLoadingExistingNames, setIsLoadingExistingNames] = useState(true);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const updateDraft = useCallback((nextDraft: ExerciseFormDraft) => {
    const normalizedDraft: ExerciseFormDraft = {
      ...nextDraft,
      isDirty: computeDirtyFlag(nextDraft.name),
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
      if (draftRef.current.isSaving) {
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

  const loadExerciseNewForm = useCallback(async () => {
    setIsLoadingExistingNames(true);

    try {
      const loadedCustomNames = await fetchCustomExerciseNames();
      setExistingCustomNames(loadedCustomNames);
      setScreenState(resolveInteractiveState(draftRef.current));
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
          message: LOAD_FORM_ERROR_MESSAGE,
        });
      }
    } finally {
      setIsLoadingExistingNames(false);
    }
  }, []);

  useEffect(() => {
    loadExerciseNewForm().catch(() => undefined);
  }, [loadExerciseNewForm]);

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

  const isSaveDisabled =
    isLoadingExistingNames ||
    draft.isSaving ||
    screenState === 'offline' ||
    !draft.isDirty ||
    computedNameError != null;

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

        return resolveInteractiveState(nextDraft);
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

  const handleSubmitExercise = useCallback(async () => {
    if (draftRef.current.isSaving) {
      return;
    }

    const normalizedName = normalizeNameForSubmit(draftRef.current.name);
    const normalizedDraft: ExerciseFormDraft = {
      ...draftRef.current,
      name: normalizedName,
      isDirty: computeDirtyFlag(normalizedName),
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
      const response = await createExercise(normalizedName);
      setExistingCustomNames(currentNames => {
        const nextNames = new Set(currentNames);
        nextNames.add(normalizeNameForCompare(response.name));
        return nextNames;
      });

      Alert.alert('Exercise created');
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
          message: CREATE_EXERCISE_ERROR_MESSAGE,
        });
      }
    } finally {
      setDraft(currentValue => ({
        ...currentValue,
        isSaving: false,
      }));
    }
  }, [
    existingCustomNames,
    replaceWithExercisesList,
    screenState,
    updateDraft,
  ]);

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
  const saveSectionBottomPadding = useMemo(
    () =>
      BOTTOM_MENU_HEIGHT +
      insets.bottom +
      12,
    [insets.bottom],
  );

  const isLoadFormConnectionWarning =
    screenState === 'error' && bannerState?.message === LOAD_FORM_ERROR_MESSAGE;
  const isConnectionIndicatorVisible =
    screenState === 'offline' ||
    bannerState?.tone === 'offline' ||
    isLoadFormConnectionWarning;
  const handleOfflineInfoPress = useCallback(() => {
    Alert.alert(
      isLoadFormConnectionWarning ? LOAD_FORM_ERROR_MESSAGE : OFFLINE_MESSAGE,
    );
  }, [isLoadFormConnectionWarning]);

  const displayedNameError =
    fieldErrors.name ??
    (screenState === 'disabled' ? validateName(draft.name, existingCustomNames) : undefined);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        <GlobalHeader
          title="New Exercise"
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
            {bannerState &&
            bannerState.tone !== 'offline' &&
            !isLoadFormConnectionWarning ? (
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
                  autoFocus
                  editable={!draft.isSaving}
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

          <View style={[styles.saveSection, { paddingBottom: saveSectionBottomPadding }]}>
            <Pressable
              accessibilityRole="button"
              disabled={isSaveDisabled}
              onPress={() => {
                handleSubmitExercise().catch(() => undefined);
              }}
              style={({ pressed }) => [
                styles.saveButton,
                isSaveDisabled && styles.buttonDisabled,
                pressed && !isSaveDisabled && styles.saveButtonPressed,
              ]}>
              <Text style={styles.saveButtonText}>
                {draft.isSaving ? 'Saving...' : 'Save'}
              </Text>
              {draft.isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : null}
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
  saveSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
    backgroundColor: '#F5F7FA',
  },
  saveButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  saveButtonPressed: {
    backgroundColor: '#1E40AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
