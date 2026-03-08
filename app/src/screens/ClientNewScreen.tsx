import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppShellRoute,
  BOTTOM_MENU_HEIGHT,
  BottomMenu,
} from '../components/shell/BottomMenu';
import { GlobalHeader } from '../components/shell/GlobalHeader';
import { LoadingSkeleton } from '../components/shell/LoadingSkeleton';
import { StatusBanner, StatusBannerTone } from '../components/shell/StatusBanner';

type ClientGender = 'male' | 'female';

type ClientNewViewState =
  | 'loading'
  | 'default'
  | 'empty'
  | 'error'
  | 'offline'
  | 'disabled';

type ClientFormField =
  | 'firstName'
  | 'lastName'
  | 'birthDate'
  | 'phoneNumber'
  | 'gender'
  | 'notes';

interface ClientFormDraft {
  firstName: string;
  lastName: string;
  birthDate: string | null;
  phoneNumber: string;
  gender: ClientGender | null;
  notes: string;
  isDirty: boolean;
  isSaving: boolean;
}

interface ClientFormErrors {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  phoneNumber?: string;
  gender?: string;
  notes?: string;
}

interface NewClientResponse {
  id: string;
}

interface NavigationLike {
  navigate: (route: string) => void;
  goBack?: () => void;
  replace?: (route: string) => void;
}

interface ClientNewScreenProps {
  navigation?: NavigationLike;
  activeTrainingId?: string | null;
}

interface BannerState {
  tone: StatusBannerTone;
  message: string;
}

interface ApiError extends Error {
  status?: number;
}

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

const API_BASE_URL = 'http://localhost:3000';
const SUPPORTED_GENDERS: ClientGender[] = ['male', 'female'];
const PHONE_ALLOWED_REGEX = /^[0-9+\-(). ]+$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const DEFAULT_ERROR_MESSAGE = 'Could not create client. Try again.';
const OFFLINE_MESSAGE = 'No internet connection';
const CONFLICT_MESSAGE = 'A similar client already exists. Review data and try again.';
const LOAD_METADATA_ERROR_MESSAGE = 'Could not load form metadata.';

const FIRST_NAME_REQUIRED_MESSAGE = 'First name is required.';
const LAST_NAME_REQUIRED_MESSAGE = 'Last name is required.';
const BIRTHDATE_ERROR_MESSAGE = 'Select a valid birthdate.';
const PHONE_ERROR_MESSAGE = 'Enter a valid phone number.';
const GENDER_ERROR_MESSAGE = 'Select gender.';
const NOTES_ERROR_MESSAGE = 'Notes can contain up to 500 characters.';

function buildInitialDraft(): ClientFormDraft {
  return {
    firstName: '',
    lastName: '',
    birthDate: null,
    phoneNumber: '',
    gender: null,
    notes: '',
    isDirty: false,
    isSaving: false,
  };
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultSuggestedBirthDate(): string {
  const now = new Date();
  const candidate = new Date(now);
  candidate.setFullYear(now.getFullYear() - 18);
  return toIsoDate(candidate);
}

function parseIsoDate(value: string): Date | null {
  if (!ISO_DATE_REGEX.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function isFutureDate(value: string): boolean {
  const parsedDate = parseIsoDate(value);
  if (!parsedDate) {
    return true;
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return parsedDate.getTime() > today.getTime();
}

function formatBirthDate(value: string | null): string {
  if (!value) {
    return 'Select birthdate';
  }

  const parsedDate = parseIsoDate(value);
  if (!parsedDate) {
    return 'Select birthdate';
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsedDate);
}

function resolveBirthDatePickerValue(value: string | null): Date {
  if (value) {
    const parsedDate = parseIsoDate(value);
    if (parsedDate) {
      return parsedDate;
    }
  }

  const fallbackDate = parseIsoDate(getDefaultSuggestedBirthDate());
  if (fallbackDate) {
    return fallbackDate;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function normalizePhoneForSubmit(phoneNumber: string): string {
  return phoneNumber.trim().replace(/[().\- ]/g, '');
}

function isDraftEmpty(draft: ClientFormDraft): boolean {
  return (
    draft.firstName.trim().length === 0 &&
    draft.lastName.trim().length === 0 &&
    draft.birthDate == null &&
    draft.phoneNumber.trim().length === 0 &&
    draft.gender == null &&
    draft.notes.length === 0
  );
}

function resolveInteractiveState(draft: ClientFormDraft): ClientNewViewState {
  return isDraftEmpty(draft) ? 'empty' : 'default';
}

function computeDirtyFlag(draft: ClientFormDraft): boolean {
  return !isDraftEmpty(draft);
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

function validateDraft(draft: ClientFormDraft): ClientFormErrors {
  const errors: ClientFormErrors = {};

  const firstName = draft.firstName.trim();
  const lastName = draft.lastName.trim();
  const phoneNumber = draft.phoneNumber.trim();
  const phoneDigitsCount = phoneNumber.replace(/\D/g, '').length;
  const phonePlusCount = (phoneNumber.match(/\+/g) ?? []).length;
  const isPhonePlusPlacementInvalid =
    phonePlusCount > 1 || (phonePlusCount === 1 && !phoneNumber.startsWith('+'));

  if (firstName.length < 1 || firstName.length > 50) {
    errors.firstName = FIRST_NAME_REQUIRED_MESSAGE;
  }

  if (lastName.length < 1 || lastName.length > 50) {
    errors.lastName = LAST_NAME_REQUIRED_MESSAGE;
  }

  if (!draft.birthDate || !parseIsoDate(draft.birthDate) || isFutureDate(draft.birthDate)) {
    errors.birthDate = BIRTHDATE_ERROR_MESSAGE;
  }

  if (
    phoneDigitsCount < 8 ||
    phoneDigitsCount > 15 ||
    !PHONE_ALLOWED_REGEX.test(phoneNumber) ||
    isPhonePlusPlacementInvalid
  ) {
    errors.phoneNumber = PHONE_ERROR_MESSAGE;
  }

  if (!draft.gender || !SUPPORTED_GENDERS.includes(draft.gender)) {
    errors.gender = GENDER_ERROR_MESSAGE;
  }

  if (draft.notes.length > 500) {
    errors.notes = NOTES_ERROR_MESSAGE;
  }

  return errors;
}

function getFieldError(
  field: ClientFormField,
  draft: ClientFormDraft,
): string | undefined {
  const validationResult = validateDraft(draft);
  return validationResult[field];
}

function normalizeDraftForSubmit(draft: ClientFormDraft): ClientFormDraft {
  return {
    ...draft,
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    phoneNumber: draft.phoneNumber.trim(),
    notes: draft.notes,
    isDirty: computeDirtyFlag(draft),
  };
}

function mapGenderLabel(value: ClientGender): string {
  return value === 'male' ? 'Male' : 'Female';
}

async function fetchClientFormMetadata(): Promise<ClientGender[]> {
  return SUPPORTED_GENDERS;
}

async function createClient(draft: ClientFormDraft): Promise<NewClientResponse> {
  const payload = {
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    birthDate: draft.birthDate,
    phoneNumber: normalizePhoneForSubmit(draft.phoneNumber),
    gender: draft.gender,
    notes: draft.notes.trim(),
  };

  const response = await fetch(`${API_BASE_URL}/api/clients/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await createApiErrorFromResponse(response, DEFAULT_ERROR_MESSAGE);
  }

  return (await response.json()) as NewClientResponse;
}

export function ClientNewScreen({
  navigation,
  activeTrainingId = null,
}: ClientNewScreenProps) {
  const insets = useSafeAreaInsets();
  const draftRef = useRef<ClientFormDraft>(buildInitialDraft());

  const [screenState, setScreenState] = useState<ClientNewViewState>('loading');
  const [draft, setDraft] = useState<ClientFormDraft>(buildInitialDraft);
  const [fieldErrors, setFieldErrors] = useState<ClientFormErrors>({});
  const [genderOptions, setGenderOptions] =
    useState<ClientGender[]>(SUPPORTED_GENDERS);
  const [isBirthDatePickerVisible, setIsBirthDatePickerVisible] = useState(false);
  const [bannerState, setBannerState] = useState<BannerState | null>(null);
  const [didLoadMetadata, setDidLoadMetadata] = useState(false);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

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

  const navigateBackToClients = useCallback(() => {
    if (navigation?.goBack) {
      navigation.goBack();
      return;
    }

    navigateToRoute('/clients');
  }, [navigation, navigateToRoute]);

  const replaceWithClientsList = useCallback(() => {
    if (navigation?.replace) {
      navigation.replace('/clients');
      return;
    }

    navigateToRoute('/clients');
  }, [navigation, navigateToRoute]);

  const confirmDiscardChanges = useCallback(
    (onDiscard: () => void) => {
      if (draft.isSaving) {
        return;
      }

      if (!draft.isDirty) {
        onDiscard();
        return;
      }

      Alert.alert(
        'Discard changes?',
        'You have unsaved client data.',
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
    [draft.isDirty, draft.isSaving],
  );

  const handleBackAction = useCallback(() => {
    confirmDiscardChanges(() => {
      navigateBackToClients();
    });
  }, [confirmDiscardChanges, navigateBackToClients]);

  const loadClientNewForm = useCallback(
    async (isRetry: boolean) => {
      if (!isRetry) {
        setScreenState('loading');
      }

      setBannerState(null);

      try {
        const metadata = await fetchClientFormMetadata();
        setGenderOptions(metadata);
        setScreenState(resolveInteractiveState(draftRef.current));
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
            message: LOAD_METADATA_ERROR_MESSAGE,
          });
        }
      } finally {
        setDidLoadMetadata(true);
      }
    },
    [],
  );

  useEffect(() => {
    loadClientNewForm(false).catch(() => undefined);
  }, [loadClientNewForm]);

  useEffect(() => {
    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!draft.isDirty) {
          return false;
        }

        handleBackAction();
        return true;
      },
    );

    return () => {
      backSubscription.remove();
    };
  }, [draft.isDirty, handleBackAction]);

  const updateDraft = useCallback(
    (nextDraft: ClientFormDraft) => {
      const nextValue = {
        ...nextDraft,
        isDirty: computeDirtyFlag(nextDraft),
      };

      draftRef.current = nextValue;
      setDraft(nextValue);
      setScreenState(previousState => {
        if (previousState === 'offline' || previousState === 'loading') {
          return previousState;
        }

        return resolveInteractiveState(nextValue);
      });
    },
    [],
  );

  const handleFieldChange = useCallback(
    (field: Exclude<ClientFormField, 'birthDate' | 'gender'>, value: string) => {
      updateDraft({
        ...draft,
        [field]: value,
      });
      setFieldErrors(currentErrors => ({
        ...currentErrors,
        [field]: undefined,
      }));
      setBannerState(currentValue =>
        currentValue?.tone === 'error' || currentValue?.tone === 'info'
          ? null
          : currentValue,
      );
    },
    [draft, updateDraft],
  );

  const handleGenderSelect = useCallback(
    (gender: ClientGender) => {
      updateDraft({
        ...draft,
        gender,
      });
      setFieldErrors(currentErrors => ({
        ...currentErrors,
        gender: undefined,
      }));
    },
    [draft, updateDraft],
  );

  const birthDatePickerValue = useMemo(
    () => resolveBirthDatePickerValue(draft.birthDate),
    [draft.birthDate],
  );
  const maxBirthDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const commitBirthdate = useCallback(
    (selectedDate: Date) => {
      const nextBirthDate = toIsoDate(selectedDate);
      if (nextBirthDate === draft.birthDate) {
        return;
      }

      updateDraft({
        ...draft,
        birthDate: nextBirthDate,
      });
      setFieldErrors(currentErrors => ({
        ...currentErrors,
        birthDate: undefined,
      }));
    },
    [draft, updateDraft],
  );

  const handleBirthdatePress = useCallback(() => {
    if (draft.isSaving) {
      return;
    }

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'date',
        value: birthDatePickerValue,
        maximumDate: maxBirthDate,
        onChange: (event, selectedDate) => {
          if (event.type !== 'set' || !selectedDate) {
            return;
          }

          commitBirthdate(selectedDate);
        },
      });
      return;
    }

    setIsBirthDatePickerVisible(previousValue => !previousValue);
  }, [birthDatePickerValue, commitBirthdate, draft.isSaving, maxBirthDate]);

  const handleBirthdateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (event.type !== 'set' || !selectedDate) {
        return;
      }

      commitBirthdate(selectedDate);
    },
    [commitBirthdate],
  );

  const handleClearBirthdate = useCallback(() => {
    if (!draft.birthDate) {
      return;
    }

    updateDraft({
      ...draft,
      birthDate: null,
    });
    setFieldErrors(currentErrors => ({
      ...currentErrors,
      birthDate: undefined,
    }));
  }, [draft, updateDraft]);

  const handleFieldBlur = useCallback(
    (field: ClientFormField) => {
      const normalizedDraft = normalizeDraftForSubmit(draft);
      setFieldErrors(currentErrors => ({
        ...currentErrors,
        [field]: getFieldError(field, normalizedDraft),
      }));

      if (field === 'firstName' || field === 'lastName') {
        updateDraft(normalizedDraft);
      }
    },
    [draft, updateDraft],
  );

  const handleSubmitClient = useCallback(async () => {
    if (draft.isSaving) {
      return;
    }

    const normalizedDraft = normalizeDraftForSubmit(draft);
    const validationErrors = validateDraft(normalizedDraft);
    const hasValidationErrors = Object.keys(validationErrors).length > 0;

    updateDraft(normalizedDraft);
    setFieldErrors(validationErrors);

    if (hasValidationErrors || !normalizedDraft.isDirty) {
      setScreenState(
        hasValidationErrors || !normalizedDraft.isDirty
          ? 'disabled'
          : resolveInteractiveState(normalizedDraft),
      );
      return;
    }

    setDraft(currentValue => ({
      ...currentValue,
      isSaving: true,
    }));
    setScreenState('disabled');
    setBannerState(null);

    try {
      await createClient(normalizedDraft);

      Alert.alert('Client created');
      replaceWithClientsList();
    } catch (error) {
      const statusCode = (error as ApiError).status;

      if (isOfflineError(error)) {
        setScreenState('offline');
        setBannerState({
          tone: 'offline',
          message: OFFLINE_MESSAGE,
        });
      } else if (statusCode === 409) {
        setScreenState(resolveInteractiveState(normalizedDraft));
        setBannerState({
          tone: 'info',
          message: CONFLICT_MESSAGE,
        });
      } else {
        setScreenState('error');
        setBannerState({
          tone: 'error',
          message: DEFAULT_ERROR_MESSAGE,
        });
      }
    } finally {
      setDraft(currentValue => ({
        ...currentValue,
        isSaving: false,
      }));
    }
  }, [draft, replaceWithClientsList, updateDraft]);

  const handleBottomNavigation = useCallback(
    (route: AppShellRoute) => {
      if (route === '/clients') {
        confirmDiscardChanges(() => navigateToRoute('/clients'));
        return;
      }

      confirmDiscardChanges(() => navigateToRoute(route));
    },
    [confirmDiscardChanges, navigateToRoute],
  );

  const computedErrors = useMemo(() => validateDraft(draft), [draft]);
  const hasComputedErrors = useMemo(
    () => Object.keys(computedErrors).length > 0,
    [computedErrors],
  );

  const isSaveDisabled =
    screenState === 'loading' ||
    screenState === 'offline' ||
    draft.isSaving ||
    !draft.isDirty ||
    hasComputedErrors;

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
  const isLoadMetadataConnectionWarning =
    screenState === 'error' && bannerState?.message === LOAD_METADATA_ERROR_MESSAGE;
  const isConnectionIndicatorVisible =
    screenState === 'offline' ||
    bannerState?.tone === 'offline' ||
    isLoadMetadataConnectionWarning;
  const handleOfflineInfoPress = useCallback(() => {
    Alert.alert(
      isLoadMetadataConnectionWarning
        ? LOAD_METADATA_ERROR_MESSAGE
        : OFFLINE_MESSAGE,
    );
  }, [isLoadMetadataConnectionWarning]);

  const isLoadingState = screenState === 'loading' && !didLoadMetadata;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container} testID="screen.clients.new">
        <GlobalHeader
          title="New Client"
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
            testID="scroll.clients.new"
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: contentBottomPadding },
            ]}
            keyboardShouldPersistTaps="handled">
            {bannerState &&
            bannerState.tone !== 'offline' &&
            !isLoadMetadataConnectionWarning ? (
              <View style={styles.bannerBlock}>
                <StatusBanner tone={bannerState.tone} message={bannerState.message} />
              </View>
            ) : null}

            {isLoadingState ? (
              <View style={styles.section}>
                <LoadingSkeleton rows={7} rowHeight={28} />
              </View>
            ) : (
              <>
                <View style={styles.section}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>First Name</Text>
                    <TextInput
                      testID="input.clients.firstName"
                      autoCapitalize="words"
                      editable={!draft.isSaving}
                      onBlur={() => handleFieldBlur('firstName')}
                      onChangeText={value => handleFieldChange('firstName', value)}
                      placeholder="Enter first name"
                      maxLength={50}
                      style={styles.input}
                      value={draft.firstName}
                    />
                    {fieldErrors.firstName ? (
                      <Text style={styles.fieldErrorText}>{fieldErrors.firstName}</Text>
                    ) : null}
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Last Name</Text>
                    <TextInput
                      testID="input.clients.lastName"
                      autoCapitalize="words"
                      editable={!draft.isSaving}
                      onBlur={() => handleFieldBlur('lastName')}
                      onChangeText={value => handleFieldChange('lastName', value)}
                      placeholder="Enter last name"
                      maxLength={50}
                      style={styles.input}
                      value={draft.lastName}
                    />
                    {fieldErrors.lastName ? (
                      <Text style={styles.fieldErrorText}>{fieldErrors.lastName}</Text>
                    ) : null}
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Birthdate</Text>
                    <View style={styles.birthdateInput}>
                      <Pressable
                        testID="button.clients.birthDate.open"
                        accessibilityRole="button"
                        disabled={draft.isSaving}
                        onPress={handleBirthdatePress}
                        style={({ pressed }) => [
                          styles.birthdateValueButton,
                          pressed && !draft.isSaving && styles.birthdateValueButtonPressed,
                        ]}>
                        <Text
                          style={[
                            styles.readOnlyInputText,
                            !draft.birthDate && styles.placeholderText,
                          ]}>
                          {formatBirthDate(draft.birthDate)}
                        </Text>
                      </Pressable>
                      <Pressable
                        testID="button.clients.birthDate.clear"
                        accessibilityLabel="Clear birthdate"
                        accessibilityRole="button"
                        disabled={!draft.birthDate || draft.isSaving}
                        onPress={handleClearBirthdate}
                        style={({ pressed }) => [
                          styles.birthdateClearButton,
                          (!draft.birthDate || draft.isSaving) &&
                            styles.birthdateClearButtonDisabled,
                          pressed &&
                            !draft.isSaving &&
                            draft.birthDate &&
                            styles.birthdateClearButtonPressed,
                        ]}>
                        <Text
                          style={[
                            styles.birthdateClearText,
                            !draft.birthDate && styles.birthdateClearTextDisabled,
                          ]}>
                          X
                        </Text>
                      </Pressable>
                    </View>
                    {isBirthDatePickerVisible ? (
                      <View style={styles.birthdatePickerContainer}>
                        <DateTimePicker
                          testID="input.clients.birthDate.picker"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          maximumDate={maxBirthDate}
                          mode="date"
                          onChange={handleBirthdateChange}
                          value={birthDatePickerValue}
                        />
                      </View>
                    ) : null}
                    {fieldErrors.birthDate ? (
                      <Text style={styles.fieldErrorText}>{fieldErrors.birthDate}</Text>
                    ) : null}
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Gender</Text>
                    <View style={styles.segmentedRow}>
                      {genderOptions.map(gender => {
                        const isSelected = draft.gender === gender;
                        return (
                          <Pressable
                            key={gender}
                            testID={`button.clients.gender.${gender}`}
                            accessibilityRole="button"
                            onPress={() => handleGenderSelect(gender)}
                            style={({ pressed }) => [
                              styles.segmentOption,
                              isSelected && styles.segmentOptionSelected,
                              pressed && !isSelected && styles.segmentOptionPressed,
                            ]}>
                            <Text
                              style={[
                                styles.segmentText,
                                isSelected && styles.segmentTextSelected,
                              ]}>
                              {mapGenderLabel(gender)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {fieldErrors.gender ? (
                      <Text style={styles.fieldErrorText}>{fieldErrors.gender}</Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.section}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Phone Number</Text>
                    <TextInput
                      testID="input.clients.phoneNumber"
                      editable={!draft.isSaving}
                      keyboardType="phone-pad"
                      onBlur={() => handleFieldBlur('phoneNumber')}
                      onChangeText={value => handleFieldChange('phoneNumber', value)}
                      placeholder="Enter phone number"
                      style={styles.input}
                      value={draft.phoneNumber}
                    />
                    {fieldErrors.phoneNumber ? (
                      <Text style={styles.fieldErrorText}>{fieldErrors.phoneNumber}</Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.section}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Notes</Text>
                    <TextInput
                      testID="input.clients.notes"
                      editable={!draft.isSaving}
                      maxLength={500}
                      multiline
                      onBlur={() => handleFieldBlur('notes')}
                      onChangeText={value => handleFieldChange('notes', value)}
                      placeholder="Add notes (optional)"
                      scrollEnabled
                      style={styles.textArea}
                      textAlignVertical="top"
                      value={draft.notes}
                    />
                    <Text style={styles.characterCount}>{draft.notes.length}/500</Text>
                    {fieldErrors.notes ? (
                      <Text style={styles.fieldErrorText}>{fieldErrors.notes}</Text>
                    ) : null}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          <View style={[styles.saveSection, { paddingBottom: saveSectionBottomPadding }]}>
            <Pressable
              testID="button.clients.save"
              accessibilityRole="button"
              disabled={isSaveDisabled}
              onPress={() => {
                handleSubmitClient().catch(() => undefined);
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
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : null}
            </Pressable>
          </View>
        </View>

        <BottomMenu
          activeRoute="/clients"
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
    gap: 16,
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
  birthdateInput: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  birthdateValueButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  birthdateValueButtonPressed: {
    backgroundColor: '#F8FAFC',
  },
  birthdateClearButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  birthdateClearButtonPressed: {
    backgroundColor: '#EEF2FF',
  },
  birthdateClearButtonDisabled: {
    opacity: 0.4,
  },
  birthdateClearText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  birthdateClearTextDisabled: {
    color: '#CBD5E1',
  },
  birthdatePickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  readOnlyInputText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentOption: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  segmentOptionPressed: {
    backgroundColor: '#F8FAFC',
  },
  segmentOptionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#DBEAFE',
  },
  segmentText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  segmentTextSelected: {
    color: '#1E40AF',
  },
  textArea: {
    minHeight: 120,
    maxHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  characterCount: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#B91C1C',
  },
  saveSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
