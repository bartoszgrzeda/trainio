import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppShellRoute,
  BOTTOM_MENU_HEIGHT,
  BottomMenu,
} from '../components/shell/BottomMenu';
import { GlobalHeader } from '../components/shell/GlobalHeader';
import { StatusBanner, StatusBannerTone } from '../components/shell/StatusBanner';
import { SearchableSelectModal } from '../components/shared/SearchableSelectModal';
import { getApiBaseUrl } from '../config/api';

type DateTimeField = 'startAt' | 'endAt';

type TrainingNewViewState =
  | 'loading'
  | 'default'
  | 'empty'
  | 'error'
  | 'offline'
  | 'disabled'
  | 'warning-confirmation';

interface ClientOption {
  id: string;
  fullName: string;
}

interface WarningItem {
  code: string;
  message: string;
}

interface TrainingFormDraft {
  clientId: string | null;
  clientDisplayName: string;
  clientSearchQuery: string;
  startAt: Date | null;
  endAt: Date | null;
  notes: string;
  isDirty: boolean;
  isCheckingWarnings: boolean;
  isSaving: boolean;
  pendingWarnings: WarningItem[];
}

interface TrainingFormErrors {
  clientId?: string;
  startAt?: string;
  endAt?: string;
  notes?: string;
}

interface ClientsListResponse {
  clients?: ClientOption[];
}

interface CheckWarningsResponse {
  warnings?: WarningItem[];
}

interface CreateTrainingResponse {
  id: string;
  clientId: string;
  startAt: string;
  endAt: string;
  notes: string;
}

interface ApiError extends Error {
  status?: number;
}

interface ApiErrorResponse {
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

interface TrainingNewScreenProps {
  navigation?: NavigationLike;
  activeTrainingId?: string | null;
}

const API_BASE_URL = getApiBaseUrl();

const CLIENT_REQUIRED_MESSAGE = 'Select client.';
const START_REQUIRED_MESSAGE = 'Select start date and time.';
const END_REQUIRED_MESSAGE = 'Select end date and time.';
const END_AFTER_START_MESSAGE = 'End date and time must be later than start date and time.';
const NOTES_LENGTH_MESSAGE = 'Notes can contain up to 500 characters.';

const CLIENT_PLACEHOLDER = 'Select client';
const START_PLACEHOLDER = 'Select start date and time';
const END_PLACEHOLDER = 'Select end date and time';
const NOTES_PLACEHOLDER = 'Add notes (optional)';
const OFFLINE_MESSAGE = 'No internet connection';
const SAVE_ERROR_MESSAGE = 'Could not save training. Try again.';
const LOAD_CLIENTS_ERROR_MESSAGE = 'Could not load clients list. Try again.';

function buildInitialDraft(): TrainingFormDraft {
  return {
    clientId: null,
    clientDisplayName: '',
    clientSearchQuery: '',
    startAt: null,
    endAt: null,
    notes: '',
    isDirty: false,
    isCheckingWarnings: false,
    isSaving: false,
    pendingWarnings: [],
  };
}

function isDraftEmpty(draft: TrainingFormDraft): boolean {
  return (
    draft.clientId == null &&
    draft.startAt == null &&
    draft.endAt == null &&
    draft.notes.length === 0
  );
}

function computeDirtyFlag(draft: TrainingFormDraft): boolean {
  return !isDraftEmpty(draft);
}

function resolveInteractiveState(draft: TrainingFormDraft): TrainingNewViewState {
  return isDraftEmpty(draft) ? 'empty' : 'default';
}

function createApiError(status: number, fallbackMessage: string): ApiError {
  const error = new Error(fallbackMessage) as ApiError;
  error.status = status;
  return error;
}

async function createApiErrorFromResponse(
  response: Response,
  fallbackMessage: string,
): Promise<ApiError> {
  try {
    const payload = (await response.json()) as ApiErrorResponse;
    const message = payload.message?.trim() || fallbackMessage;
    return createApiError(response.status, message);
  } catch {
    return createApiError(response.status, fallbackMessage);
  }
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

function padTwoDigits(value: number): string {
  return `${value}`.padStart(2, '0');
}

function formatDateTimeToLocalLabel(value: Date | null): string {
  if (!value) {
    return '';
  }

  return (
    `${value.getFullYear()}-${padTwoDigits(value.getMonth() + 1)}-${padTwoDigits(
      value.getDate(),
    )} ` + `${padTwoDigits(value.getHours())}:${padTwoDigits(value.getMinutes())}`
  );
}

function formatDateTimeOffset(value: Date): string {
  const timezoneOffsetMinutes = -value.getTimezoneOffset();
  const sign = timezoneOffsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(timezoneOffsetMinutes);
  const offsetHours = Math.floor(absoluteOffset / 60);
  const offsetMinutes = absoluteOffset % 60;

  return (
    `${value.getFullYear()}-${padTwoDigits(value.getMonth() + 1)}-${padTwoDigits(
      value.getDate(),
    )}` +
    `T${padTwoDigits(value.getHours())}:${padTwoDigits(value.getMinutes())}:${padTwoDigits(
      value.getSeconds(),
    )}` +
    `${sign}${padTwoDigits(offsetHours)}:${padTwoDigits(offsetMinutes)}`
  );
}

function resolveDateTimePickerValue(
  value: Date | null,
  fallback: Date | null = null,
): Date {
  if (value) {
    return value;
  }

  if (fallback) {
    return fallback;
  }

  const now = new Date();
  now.setSeconds(0, 0);
  return now;
}

function validateDraft(draft: TrainingFormDraft): TrainingFormErrors {
  const errors: TrainingFormErrors = {};

  if (!draft.clientId) {
    errors.clientId = CLIENT_REQUIRED_MESSAGE;
  }

  if (!draft.startAt) {
    errors.startAt = START_REQUIRED_MESSAGE;
  }

  if (!draft.endAt) {
    errors.endAt = END_REQUIRED_MESSAGE;
  } else if (draft.startAt && draft.endAt.getTime() <= draft.startAt.getTime()) {
    errors.endAt = END_AFTER_START_MESSAGE;
  }

  if (draft.notes.length > 500) {
    errors.notes = NOTES_LENGTH_MESSAGE;
  }

  return errors;
}

async function fetchClients(query: string): Promise<ClientOption[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/clients/list?query=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    throw await createApiErrorFromResponse(response, LOAD_CLIENTS_ERROR_MESSAGE);
  }

  const payload = (await response.json()) as ClientsListResponse;
  return payload.clients ?? [];
}

async function checkTrainingWarnings(
  clientId: string,
  startAt: Date,
  endAt: Date,
): Promise<WarningItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/trainings/check-warnings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clientId,
      startAt: formatDateTimeOffset(startAt),
      endAt: formatDateTimeOffset(endAt),
    }),
  });

  if (!response.ok) {
    throw await createApiErrorFromResponse(response, SAVE_ERROR_MESSAGE);
  }

  const payload = (await response.json()) as CheckWarningsResponse;
  return payload.warnings ?? [];
}

async function createTraining(draft: TrainingFormDraft): Promise<CreateTrainingResponse> {
  const response = await fetch(`${API_BASE_URL}/api/trainings/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clientId: draft.clientId,
      startAt: formatDateTimeOffset(draft.startAt as Date),
      endAt: formatDateTimeOffset(draft.endAt as Date),
      notes: draft.notes.trim(),
    }),
  });

  if (!response.ok) {
    throw await createApiErrorFromResponse(response, SAVE_ERROR_MESSAGE);
  }

  return (await response.json()) as CreateTrainingResponse;
}

export function TrainingNewScreen({
  navigation,
  activeTrainingId = null,
}: TrainingNewScreenProps) {
  const insets = useSafeAreaInsets();
  const draftRef = useRef<TrainingFormDraft>(buildInitialDraft());
  const clientSearchRequestIdRef = useRef(0);

  const [screenState, setScreenState] = useState<TrainingNewViewState>('loading');
  const [draft, setDraft] = useState<TrainingFormDraft>(buildInitialDraft);
  const [fieldErrors, setFieldErrors] = useState<TrainingFormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [bannerState, setBannerState] = useState<BannerState | null>(null);
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isClientPickerVisible, setIsClientPickerVisible] = useState(false);
  const [isWarningsModalVisible, setIsWarningsModalVisible] = useState(false);
  const [activeDateTimePicker, setActiveDateTimePicker] = useState<DateTimeField | null>(
    null,
  );

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const updateDraft = useCallback(
    (
      updater: (current: TrainingFormDraft) => TrainingFormDraft,
      options: { syncScreenState?: boolean } = {},
    ) => {
      const shouldSyncScreenState = options.syncScreenState ?? true;

      setDraft(current => {
        const nextValue = updater(current);
        const normalizedDraft: TrainingFormDraft = {
          ...nextValue,
          isDirty: computeDirtyFlag(nextValue),
        };

        draftRef.current = normalizedDraft;

        if (shouldSyncScreenState) {
          setScreenState(previousState => {
            if (previousState === 'offline' || previousState === 'loading') {
              return previousState;
            }

            if (isWarningsModalVisible) {
              return 'warning-confirmation';
            }

            return resolveInteractiveState(normalizedDraft);
          });
        }

        return normalizedDraft;
      });
    },
    [isWarningsModalVisible],
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

  const navigateBackToHome = useCallback(() => {
    if (navigation?.goBack) {
      navigation.goBack();
      return;
    }

    navigateToRoute('/home');
  }, [navigation, navigateToRoute]);

  const confirmDiscardChanges = useCallback((onDiscard: () => void) => {
    const currentDraft = draftRef.current;
    if (currentDraft.isSaving || currentDraft.isCheckingWarnings) {
      return;
    }

    if (!currentDraft.isDirty) {
      onDiscard();
      return;
    }

    Alert.alert(
      'Discard changes?',
      'You have unsaved training data.',
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
      navigateBackToHome();
    });
  }, [confirmDiscardChanges, navigateBackToHome]);

  const loadClientsList = useCallback(
    async (query: string, isInitialLoad: boolean) => {
      const requestId = clientSearchRequestIdRef.current + 1;
      clientSearchRequestIdRef.current = requestId;

      if (isInitialLoad) {
        setScreenState('loading');
      }
      setIsLoadingClients(true);

      try {
        const nextClients = await fetchClients(query);
        if (clientSearchRequestIdRef.current !== requestId) {
          return;
        }

        setClientOptions(nextClients);
        setBannerState(null);
        setScreenState(resolveInteractiveState(draftRef.current));
      } catch (error) {
        if (clientSearchRequestIdRef.current !== requestId) {
          return;
        }

        if (isOfflineError(error)) {
          setScreenState('offline');
        } else {
          setScreenState('error');
          setBannerState({
            tone: 'error',
            message: LOAD_CLIENTS_ERROR_MESSAGE,
          });
        }
      } finally {
        if (clientSearchRequestIdRef.current === requestId) {
          setIsLoadingClients(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    loadClientsList('', true).catch(() => undefined);
  }, [loadClientsList]);

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

  const handleClientPickerOpen = useCallback(() => {
    if (draftRef.current.isSaving || draftRef.current.isCheckingWarnings) {
      return;
    }

    setIsClientPickerVisible(true);
    if (!isLoadingClients && clientOptions.length === 0) {
      loadClientsList(draftRef.current.clientSearchQuery, false).catch(() => undefined);
    }
  }, [clientOptions.length, isLoadingClients, loadClientsList]);

  const handleClientSearchChange = useCallback(
    (value: string) => {
      updateDraft(current => ({
        ...current,
        clientSearchQuery: value,
      }));

      loadClientsList(value, false).catch(() => undefined);
    },
    [loadClientsList, updateDraft],
  );

  const handleClientSelect = useCallback(
    (client: ClientOption) => {
      updateDraft(current => ({
        ...current,
        clientId: client.id,
        clientDisplayName: client.fullName,
      }));

      setFieldErrors(currentErrors => ({
        ...currentErrors,
        clientId: undefined,
      }));
      setBannerState(currentValue =>
        currentValue?.tone === 'error' || currentValue?.tone === 'info'
          ? null
          : currentValue,
      );
      setIsClientPickerVisible(false);
    },
    [updateDraft],
  );

  const commitDateTime = useCallback(
    (field: DateTimeField, selectedDate: Date) => {
      const sanitizedDate = new Date(selectedDate);
      sanitizedDate.setSeconds(0, 0);

      updateDraft(current => ({
        ...current,
        [field]: sanitizedDate,
      }));

      setFieldErrors(currentErrors => ({
        ...currentErrors,
        [field]: undefined,
        endAt: field === 'startAt' ? currentErrors.endAt : undefined,
      }));
      setBannerState(currentValue =>
        currentValue?.tone === 'error' || currentValue?.tone === 'info'
          ? null
          : currentValue,
      );
    },
    [updateDraft],
  );

  const handleDateTimeFieldPress = useCallback(
    (field: DateTimeField) => {
      if (draftRef.current.isSaving || draftRef.current.isCheckingWarnings) {
        return;
      }

      const currentValue = draftRef.current[field];
      const fallbackValue =
        field === 'endAt' ? draftRef.current.startAt : draftRef.current.endAt;
      const pickerValue = resolveDateTimePickerValue(currentValue, fallbackValue);

      if (Platform.OS === 'android') {
        DateTimePickerAndroid.open({
          mode: 'date',
          value: pickerValue,
          minimumDate: field === 'endAt' ? draftRef.current.startAt ?? undefined : undefined,
          onChange: (dateEvent, selectedDate) => {
            if (dateEvent.type !== 'set' || !selectedDate) {
              return;
            }

            const selectedDateTime = new Date(selectedDate);
            selectedDateTime.setSeconds(0, 0);

            DateTimePickerAndroid.open({
              mode: 'time',
              value: selectedDateTime,
              is24Hour: true,
              onChange: (timeEvent, selectedTime) => {
                if (timeEvent.type !== 'set' || !selectedTime) {
                  return;
                }

                const combinedDateTime = new Date(selectedDateTime);
                combinedDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

                commitDateTime(field, combinedDateTime);
              },
            });
          },
        });
        return;
      }

      setActiveDateTimePicker(currentValueForPicker =>
        currentValueForPicker === field ? null : field,
      );
    },
    [commitDateTime],
  );

  const handleIosDateTimeChange = useCallback(
    (field: DateTimeField, event: DateTimePickerEvent, selectedDate?: Date) => {
      if (event.type !== 'set' || !selectedDate) {
        return;
      }

      commitDateTime(field, selectedDate);
    },
    [commitDateTime],
  );

  const handleNotesChange = useCallback(
    (value: string) => {
      updateDraft(current => ({
        ...current,
        notes: value,
      }));

      setFieldErrors(currentErrors => ({
        ...currentErrors,
        notes: undefined,
      }));
      setBannerState(currentValue =>
        currentValue?.tone === 'error' || currentValue?.tone === 'info'
          ? null
          : currentValue,
      );
    },
    [updateDraft],
  );

  const getNormalizedDraftForSubmit = useCallback(
    (sourceDraft: TrainingFormDraft): TrainingFormDraft => ({
      ...sourceDraft,
      notes: sourceDraft.notes,
    }),
    [],
  );

  const handleSaveFailure = useCallback((error: unknown) => {
    if (isOfflineError(error)) {
      setScreenState('offline');
      return;
    }

    setScreenState('error');
    setBannerState({
      tone: 'error',
      message: SAVE_ERROR_MESSAGE,
    });
  }, []);

  const submitCreate = useCallback(
    async (sourceDraft: TrainingFormDraft) => {
      updateDraft(current => ({
        ...current,
        isSaving: true,
      }), { syncScreenState: false });
      setScreenState('loading');
      setBannerState(null);

      try {
        await createTraining(sourceDraft);
        Alert.alert('Training created');
        replaceRoute('/home');
      } catch (error) {
        handleSaveFailure(error);
      } finally {
        updateDraft(current => ({
          ...current,
          isSaving: false,
        }), { syncScreenState: false });
      }
    },
    [handleSaveFailure, replaceRoute, updateDraft],
  );

  const handleSubmitTraining = useCallback(async () => {
    if (draftRef.current.isSaving || draftRef.current.isCheckingWarnings) {
      return;
    }

    const normalizedDraft = getNormalizedDraftForSubmit(draftRef.current);
    const validationErrors = validateDraft(normalizedDraft);
    const hasValidationErrors = Object.keys(validationErrors).length > 0;

    setHasSubmitted(true);
    setFieldErrors(validationErrors);
    updateDraft(current => ({
      ...current,
      notes: normalizedDraft.notes,
    }));

    if (hasValidationErrors) {
      setScreenState('disabled');
      return;
    }

    setBannerState(null);
    updateDraft(current => ({
      ...current,
      isCheckingWarnings: true,
      pendingWarnings: [],
    }), { syncScreenState: false });
    setScreenState('loading');

    try {
      const warnings = await checkTrainingWarnings(
        normalizedDraft.clientId as string,
        normalizedDraft.startAt as Date,
        normalizedDraft.endAt as Date,
      );

      updateDraft(current => ({
        ...current,
        isCheckingWarnings: false,
        pendingWarnings: warnings,
      }), { syncScreenState: false });

      if (warnings.length > 0) {
        setIsWarningsModalVisible(true);
        setScreenState('warning-confirmation');
        return;
      }

      await submitCreate({
        ...normalizedDraft,
        pendingWarnings: [],
      });
    } catch (error) {
      updateDraft(current => ({
        ...current,
        isCheckingWarnings: false,
      }), { syncScreenState: false });
      handleSaveFailure(error);
    }
  }, [getNormalizedDraftForSubmit, handleSaveFailure, submitCreate, updateDraft]);

  const handleConfirmSaveWithWarnings = useCallback(() => {
    if (draftRef.current.isSaving || draftRef.current.isCheckingWarnings) {
      return;
    }

    setIsWarningsModalVisible(false);
    submitCreate(draftRef.current).catch(() => undefined);
  }, [submitCreate]);

  const handleCancelWarnings = useCallback(() => {
    setIsWarningsModalVisible(false);
    setScreenState(resolveInteractiveState(draftRef.current));
  }, []);

  const handleBottomNavigation = useCallback(
    (route: AppShellRoute) => {
      confirmDiscardChanges(() => {
        navigateToRoute(route);
      });
    },
    [confirmDiscardChanges, navigateToRoute],
  );

  const computedErrors = useMemo(() => validateDraft(draft), [draft]);
  const hasComputedErrors = useMemo(
    () => Object.keys(computedErrors).length > 0,
    [computedErrors],
  );

  const displayedClientError =
    fieldErrors.clientId ?? (hasSubmitted ? computedErrors.clientId : undefined);
  const displayedStartError =
    fieldErrors.startAt ?? (hasSubmitted ? computedErrors.startAt : undefined);
  const displayedEndError =
    fieldErrors.endAt ?? (hasSubmitted ? computedErrors.endAt : undefined);
  const displayedNotesError =
    fieldErrors.notes ?? (hasSubmitted ? computedErrors.notes : undefined);

  const isSaveDisabled =
    screenState === 'offline' ||
    draft.isCheckingWarnings ||
    draft.isSaving ||
    hasComputedErrors;

  const contentBottomPadding = useMemo(() => 24, []);
  const saveSectionBottomPadding = useMemo(
    () => BOTTOM_MENU_HEIGHT + insets.bottom + 12,
    [insets.bottom],
  );
  const isConnectionIndicatorVisible = screenState === 'offline';
  const handleOfflineInfoPress = useCallback(() => {
    Alert.alert(OFFLINE_MESSAGE);
  }, []);

  const startLabel =
    draft.startAt != null ? formatDateTimeToLocalLabel(draft.startAt) : START_PLACEHOLDER;
  const endLabel =
    draft.endAt != null ? formatDateTimeToLocalLabel(draft.endAt) : END_PLACEHOLDER;

  const startPickerValue = useMemo(
    () => resolveDateTimePickerValue(draft.startAt),
    [draft.startAt],
  );
  const endPickerValue = useMemo(
    () => resolveDateTimePickerValue(draft.endAt, draft.startAt),
    [draft.endAt, draft.startAt],
  );

  const saveButtonLabel = draft.isCheckingWarnings
    ? 'Checking...'
    : draft.isSaving
      ? 'Saving...'
      : 'Save';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container} testID="screen.trainings.new">
        <GlobalHeader
          title="New Training"
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
            testID="scroll.trainings.new"
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
                <Text style={styles.fieldLabel}>Client</Text>
                <Pressable
                  testID="button.trainings.client.open"
                  accessibilityRole="button"
                  disabled={draft.isSaving || draft.isCheckingWarnings}
                  onPress={handleClientPickerOpen}
                  style={({ pressed }) => [
                    styles.selectorButton,
                    pressed &&
                      !draft.isSaving &&
                      !draft.isCheckingWarnings &&
                      styles.selectorButtonPressed,
                  ]}>
                  <Text
                    style={[
                      styles.selectorValue,
                      !draft.clientId && styles.placeholderText,
                    ]}>
                    {draft.clientId ? draft.clientDisplayName : CLIENT_PLACEHOLDER}
                  </Text>
                </Pressable>
                {displayedClientError ? (
                  <Text style={styles.fieldErrorText}>{displayedClientError}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Start date</Text>
                <Pressable
                  testID="button.trainings.startAt.open"
                  accessibilityRole="button"
                  disabled={draft.isSaving || draft.isCheckingWarnings}
                  onPress={() => handleDateTimeFieldPress('startAt')}
                  style={({ pressed }) => [
                    styles.selectorButton,
                    pressed &&
                      !draft.isSaving &&
                      !draft.isCheckingWarnings &&
                      styles.selectorButtonPressed,
                  ]}>
                  <Text
                    style={[
                      styles.selectorValue,
                      draft.startAt == null && styles.placeholderText,
                    ]}>
                    {startLabel}
                  </Text>
                </Pressable>
                {displayedStartError ? (
                  <Text style={styles.fieldErrorText}>{displayedStartError}</Text>
                ) : null}
                {Platform.OS === 'ios' && activeDateTimePicker === 'startAt' ? (
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      testID="input.trainings.startAt.picker"
                      mode="datetime"
                      value={startPickerValue}
                      onChange={(event, selectedDate) =>
                        handleIosDateTimeChange('startAt', event, selectedDate)
                      }
                    />
                  </View>
                ) : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>End date</Text>
                <Pressable
                  testID="button.trainings.endAt.open"
                  accessibilityRole="button"
                  disabled={draft.isSaving || draft.isCheckingWarnings}
                  onPress={() => handleDateTimeFieldPress('endAt')}
                  style={({ pressed }) => [
                    styles.selectorButton,
                    pressed &&
                      !draft.isSaving &&
                      !draft.isCheckingWarnings &&
                      styles.selectorButtonPressed,
                  ]}>
                  <Text
                    style={[
                      styles.selectorValue,
                      draft.endAt == null && styles.placeholderText,
                    ]}>
                    {endLabel}
                  </Text>
                </Pressable>
                {displayedEndError ? (
                  <Text style={styles.fieldErrorText}>{displayedEndError}</Text>
                ) : null}
                {Platform.OS === 'ios' && activeDateTimePicker === 'endAt' ? (
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      testID="input.trainings.endAt.picker"
                      mode="datetime"
                      value={endPickerValue}
                      minimumDate={draft.startAt ?? undefined}
                      onChange={(event, selectedDate) =>
                        handleIosDateTimeChange('endAt', event, selectedDate)
                      }
                    />
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  testID="input.trainings.notes"
                  accessibilityLabel="Training notes"
                  editable={!draft.isSaving && !draft.isCheckingWarnings}
                  multiline
                  onChangeText={handleNotesChange}
                  placeholder={NOTES_PLACEHOLDER}
                  style={[styles.input, styles.notesInput]}
                  textAlignVertical="top"
                  value={draft.notes}
                />
                {displayedNotesError ? (
                  <Text style={styles.fieldErrorText}>{displayedNotesError}</Text>
                ) : null}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.saveSection, { paddingBottom: saveSectionBottomPadding }]}>
            <Pressable
              testID="button.trainings.save"
              accessibilityRole="button"
              disabled={isSaveDisabled}
              onPress={() => {
                handleSubmitTraining().catch(() => undefined);
              }}
              style={({ pressed }) => [
                styles.saveButton,
                isSaveDisabled && styles.buttonDisabled,
                pressed && !isSaveDisabled && styles.saveButtonPressed,
              ]}>
              <Text style={styles.saveButtonText}>{saveButtonLabel}</Text>
              {draft.isCheckingWarnings || draft.isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : null}
            </Pressable>
          </View>
        </View>

        <BottomMenu
          activeRoute="/home"
          activeTrainingId={activeTrainingId}
          onNavigate={handleBottomNavigation}
        />
      </View>

      <SearchableSelectModal
        visible={isClientPickerVisible}
        title="Select client"
        options={clientOptions}
        isLoading={isLoadingClients}
        selectedOptionId={draft.clientId}
        emptyMessage="No clients found"
        searchValue={draft.clientSearchQuery}
        searchPlaceholder="Search client"
        searchAccessibilityLabel="Client search"
        onSearchChange={handleClientSearchChange}
        onSelectOption={handleClientSelect}
        onRequestClose={() => setIsClientPickerVisible(false)}
        getOptionLabel={option => option.fullName}
        getOptionTestID={option => `item.trainings.client.${option.id}`}
        closeButtonTestID="button.trainings.client.close"
        searchInputTestID="input.trainings.client.search"
        clearSearchButtonTestID="button.trainings.client.search.clear"
        listTestID="list.trainings.clients"
        loadingTestID="loading.trainings.clients"
        emptyTextTestID="text.trainings.clients.empty"
      />

      <Modal
        visible={isWarningsModalVisible}
        animationType="fade"
        transparent
        onRequestClose={handleCancelWarnings}>
        <View style={styles.warningModalBackdrop}>
          <View style={styles.warningModalCard} testID="modal.trainings.warnings">
            <Text style={styles.warningModalTitle}>Warnings detected</Text>
            <Text style={styles.warningModalSubtitle}>
              Confirm save to create training anyway.
            </Text>

            <ScrollView style={styles.warningList}>
              {draft.pendingWarnings.map((warning, index) => (
                <View
                  key={`${warning.code}-${index}`}
                  style={styles.warningRow}
                  testID={`item.trainings.warning.${index}`}>
                  <Text style={styles.warningBullet}>•</Text>
                  <Text style={styles.warningText}>{warning.message}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.warningActions}>
              <Pressable
                testID="button.trainings.warnings.cancel"
                accessibilityRole="button"
                onPress={handleCancelWarnings}
                style={({ pressed }) => [
                  styles.warningCancelButton,
                  pressed && styles.warningCancelButtonPressed,
                ]}>
                <Text style={styles.warningCancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                testID="button.trainings.warnings.confirm"
                accessibilityRole="button"
                onPress={handleConfirmSaveWithWarnings}
                style={({ pressed }) => [
                  styles.warningConfirmButton,
                  pressed && styles.warningConfirmButtonPressed,
                ]}>
                <Text style={styles.warningConfirmButtonText}>Confirm save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  selectorButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectorButtonPressed: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFC',
  },
  selectorValue: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  iosPickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
    marginTop: 2,
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
  notesInput: {
    minHeight: 110,
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
  warningModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningModalCard: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
  },
  warningModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  warningModalSubtitle: {
    fontSize: 14,
    color: '#4B5563',
  },
  warningList: {
    maxHeight: 220,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 4,
  },
  warningBullet: {
    fontSize: 18,
    lineHeight: 22,
    color: '#B45309',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  warningActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  warningCancelButton: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  warningCancelButtonPressed: {
    backgroundColor: '#E5E7EB',
  },
  warningCancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  warningConfirmButton: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
  },
  warningConfirmButtonPressed: {
    backgroundColor: '#1E40AF',
  },
  warningConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
