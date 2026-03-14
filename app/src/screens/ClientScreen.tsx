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
import { LoadingSkeleton } from '../components/shell/LoadingSkeleton';
import { StatusBanner, StatusBannerTone } from '../components/shell/StatusBanner';
import { getApiBaseUrl } from '../config/api';

type ClientGender = 'male' | 'female';

type ClientViewState =
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

interface ClientFormValues {
  firstName: string;
  lastName: string;
  birthDate: string | null;
  phoneNumber: string;
  gender: ClientGender | null;
  notes: string;
}

interface ClientFormDraft extends ClientFormValues {
  id: string;
  original: ClientFormValues;
  isDirty: boolean;
  isSaving: boolean;
  isDeleting: boolean;
}

interface ClientFormErrors {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  phoneNumber?: string;
  gender?: string;
  notes?: string;
}

interface ClientResponse {
  id?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  phoneNumber?: string;
  gender?: string;
  notes?: string;
  fullName?: string;
}

interface ClientListItem {
  id: string;
  fullName: string;
}

interface ClientsListResponse {
  clients?: ClientListItem[];
}

interface NavigationLike {
  navigate: (route: string) => void;
  goBack?: () => void;
  replace?: (route: string) => void;
}

interface ClientScreenProps {
  navigation?: NavigationLike;
  activeTrainingId?: string | null;
  clientId: string;
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

interface ClientUpdatePayload {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  phoneNumber: string;
  gender: ClientGender;
  notes: string;
}

const API_BASE_URL = getApiBaseUrl();
const SUPPORTED_GENDERS: ClientGender[] = ['male', 'female'];
const PHONE_ALLOWED_REGEX = /^[0-9+\-(). ]+$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const OFFLINE_MESSAGE = 'No internet connection';
const LOAD_CLIENT_ERROR_MESSAGE = 'Could not load client. Try again.';
const UPDATE_CLIENT_ERROR_MESSAGE = 'Could not update client. Try again.';
const DELETE_CLIENT_ERROR_MESSAGE = 'Could not delete client. Try again.';
const CLIENT_NOT_FOUND_MESSAGE = 'Client not found.';
const CONFLICT_MESSAGE = 'A similar client already exists. Review data and try again.';

const FIRST_NAME_REQUIRED_MESSAGE = 'First name is required.';
const LAST_NAME_REQUIRED_MESSAGE = 'Last name is required.';
const BIRTHDATE_ERROR_MESSAGE = 'Select a valid birthdate.';
const PHONE_ERROR_MESSAGE = 'Enter a valid phone number.';
const GENDER_ERROR_MESSAGE = 'Select gender.';
const NOTES_ERROR_MESSAGE = 'Notes can contain up to 500 characters.';

function buildEmptyValues(): ClientFormValues {
  return {
    firstName: '',
    lastName: '',
    birthDate: null,
    phoneNumber: '',
    gender: null,
    notes: '',
  };
}

function buildInitialDraft(clientId: string): ClientFormDraft {
  return {
    id: clientId,
    ...buildEmptyValues(),
    original: buildEmptyValues(),
    isDirty: false,
    isSaving: false,
    isDeleting: false,
  };
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function normalizePhoneForSubmit(phoneNumber: string): string {
  return phoneNumber.trim().replace(/[().\- ]/g, '');
}

function normalizeValuesForSubmit(values: ClientFormValues): ClientFormValues {
  return {
    ...values,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    phoneNumber: values.phoneNumber.trim(),
  };
}

function normalizeValuesForCompare(values: ClientFormValues): ClientFormValues {
  return normalizeValuesForSubmit(values);
}

function isValuesEmpty(values: ClientFormValues): boolean {
  return (
    values.firstName.trim().length === 0 &&
    values.lastName.trim().length === 0 &&
    values.birthDate == null &&
    values.phoneNumber.trim().length === 0 &&
    values.gender == null &&
    values.notes.length === 0
  );
}

function resolveInteractiveState(values: ClientFormValues): ClientViewState {
  return isValuesEmpty(values) ? 'empty' : 'default';
}

function extractValues(draft: ClientFormDraft): ClientFormValues {
  return {
    firstName: draft.firstName,
    lastName: draft.lastName,
    birthDate: draft.birthDate,
    phoneNumber: draft.phoneNumber,
    gender: draft.gender,
    notes: draft.notes,
  };
}

function areValuesEqual(left: ClientFormValues, right: ClientFormValues): boolean {
  return (
    left.firstName === right.firstName &&
    left.lastName === right.lastName &&
    left.birthDate === right.birthDate &&
    left.phoneNumber === right.phoneNumber &&
    left.gender === right.gender &&
    left.notes === right.notes
  );
}

function computeDirtyFlag(draft: ClientFormDraft): boolean {
  const currentValues = normalizeValuesForCompare(extractValues(draft));
  const originalValues = normalizeValuesForCompare(draft.original);
  return !areValuesEqual(currentValues, originalValues);
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

function mapGenderLabel(value: ClientGender): string {
  return value === 'male' ? 'Male' : 'Female';
}

function mapGenderFromApi(value: string | undefined): ClientGender | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'male' || normalized === 'm') {
    return 'male';
  }

  if (normalized === 'female' || normalized === 'f') {
    return 'female';
  }

  return null;
}

function mapBirthDateFromApi(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!ISO_DATE_REGEX.test(normalized)) {
    return null;
  }

  return normalized;
}

function mapClientValuesFromResponse(response: ClientResponse): ClientFormValues {
  return {
    firstName: response.firstName ?? '',
    lastName: response.lastName ?? '',
    birthDate: mapBirthDateFromApi(response.birthDate),
    phoneNumber: response.phoneNumber ?? '',
    gender: mapGenderFromApi(response.gender),
    notes: response.notes ?? '',
  };
}

function validateValues(values: ClientFormValues): ClientFormErrors {
  const errors: ClientFormErrors = {};

  const normalizedValues = normalizeValuesForSubmit(values);
  const firstName = normalizedValues.firstName;
  const lastName = normalizedValues.lastName;
  const phoneNumber = normalizedValues.phoneNumber;
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

  if (
    !normalizedValues.birthDate ||
    !parseIsoDate(normalizedValues.birthDate) ||
    isFutureDate(normalizedValues.birthDate)
  ) {
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

  if (!normalizedValues.gender || !SUPPORTED_GENDERS.includes(normalizedValues.gender)) {
    errors.gender = GENDER_ERROR_MESSAGE;
  }

  if (normalizedValues.notes.length > 500) {
    errors.notes = NOTES_ERROR_MESSAGE;
  }

  return errors;
}

function getFieldError(field: ClientFormField, draft: ClientFormDraft): string | undefined {
  const validationResult = validateValues(extractValues(draft));
  return validationResult[field];
}

function normalizeDraftForSubmit(draft: ClientFormDraft): ClientFormDraft {
  const normalizedValues = normalizeValuesForSubmit(extractValues(draft));

  return {
    ...draft,
    ...normalizedValues,
    isDirty: computeDirtyFlag({
      ...draft,
      ...normalizedValues,
    }),
  };
}

function buildUpdatePayload(draft: ClientFormDraft): ClientUpdatePayload | null {
  const normalizedDraft = normalizeDraftForSubmit(draft);
  if (!normalizedDraft.birthDate || !normalizedDraft.gender) {
    return null;
  }

  return {
    id: normalizedDraft.id,
    firstName: normalizedDraft.firstName,
    lastName: normalizedDraft.lastName,
    birthDate: normalizedDraft.birthDate,
    phoneNumber: normalizePhoneForSubmit(normalizedDraft.phoneNumber),
    gender: normalizedDraft.gender,
    notes: normalizedDraft.notes.trim(),
  };
}

async function fetchClient(clientId: string): Promise<ClientResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/clients/get?id=${encodeURIComponent(clientId)}`,
  );

  if (!response.ok) {
    throw await createApiErrorFromResponse(response, LOAD_CLIENT_ERROR_MESSAGE);
  }

  return (await response.json()) as ClientResponse;
}

async function checkClientExists(clientId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/clients/list?query=`);
  if (!response.ok) {
    return false;
  }

  const payload = (await response.json()) as ClientsListResponse;
  const clients = payload.clients ?? [];
  return clients.some(client => client.id === clientId);
}

async function updateClient(payload: ClientUpdatePayload): Promise<ClientResponse> {
  const response = await fetch(`${API_BASE_URL}/api/clients/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await createApiErrorFromResponse(response, UPDATE_CLIENT_ERROR_MESSAGE);
  }

  return (await response.json()) as ClientResponse;
}

async function deleteClient(clientId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/clients/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: clientId }),
  });

  if (!response.ok) {
    throw await createApiErrorFromResponse(response, DELETE_CLIENT_ERROR_MESSAGE);
  }
}

export function ClientScreen({
  navigation,
  activeTrainingId = null,
  clientId,
}: ClientScreenProps) {
  const insets = useSafeAreaInsets();
  const draftRef = useRef<ClientFormDraft>(buildInitialDraft(clientId));

  const [screenState, setScreenState] = useState<ClientViewState>('loading');
  const [draft, setDraft] = useState<ClientFormDraft>(() => buildInitialDraft(clientId));
  const [fieldErrors, setFieldErrors] = useState<ClientFormErrors>({});
  const [genderOptions] = useState<ClientGender[]>(SUPPORTED_GENDERS);
  const [isBirthDatePickerVisible, setIsBirthDatePickerVisible] = useState(false);
  const [bannerState, setBannerState] = useState<BannerState | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isClientAvailable, setIsClientAvailable] = useState(false);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const updateDraft = useCallback((nextDraft: ClientFormDraft) => {
    const normalizedDraft: ClientFormDraft = {
      ...nextDraft,
      isDirty: computeDirtyFlag(nextDraft),
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
      if (draftRef.current.isSaving || draftRef.current.isDeleting) {
        return;
      }

      if (!draftRef.current.isDirty) {
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
    [],
  );

  const handleBackAction = useCallback(() => {
    confirmDiscardChanges(() => {
      navigateBackToClients();
    });
  }, [confirmDiscardChanges, navigateBackToClients]);

  const loadClient = useCallback(async () => {
    setIsInitializing(true);
    setScreenState('loading');

    try {
      const response = await fetchClient(clientId);
      const mappedValues = mapClientValuesFromResponse(response);
      const resolvedId = response.id?.trim() || clientId;

      const nextDraft: ClientFormDraft = {
        id: resolvedId,
        ...mappedValues,
        original: mappedValues,
        isDirty: false,
        isSaving: false,
        isDeleting: false,
      };

      updateDraft(nextDraft);
      setFieldErrors({});
      setBannerState(null);
      setIsClientAvailable(true);
      setScreenState(resolveInteractiveState(mappedValues));
    } catch (error) {
      const statusCode = (error as ApiError).status;

      if (isOfflineError(error)) {
        setScreenState('offline');
        setBannerState({
          tone: 'offline',
          message: OFFLINE_MESSAGE,
        });
      } else if (statusCode === 404) {
        const existsInList = await checkClientExists(clientId);
        setScreenState('error');
        setBannerState({
          tone: 'error',
          message: existsInList ? LOAD_CLIENT_ERROR_MESSAGE : CLIENT_NOT_FOUND_MESSAGE,
        });
      } else {
        setScreenState('error');
        setBannerState({
          tone: 'error',
          message: LOAD_CLIENT_ERROR_MESSAGE,
        });
      }

      setIsClientAvailable(false);
    } finally {
      setIsInitializing(false);
    }
  }, [clientId, updateDraft]);

  useEffect(() => {
    loadClient().catch(() => undefined);
  }, [loadClient]);

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
      if (nextBirthDate === draftRef.current.birthDate) {
        return;
      }

      const nextDraft: ClientFormDraft = {
        ...draftRef.current,
        birthDate: nextBirthDate,
      };

      updateDraft(nextDraft);
      setFieldErrors(currentErrors => ({
        ...currentErrors,
        birthDate: undefined,
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

        return resolveInteractiveState(extractValues(nextDraft));
      });
    },
    [updateDraft],
  );

  const handleBirthdatePress = useCallback(() => {
    if (draft.isSaving || draft.isDeleting || !isClientAvailable) {
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
  }, [
    birthDatePickerValue,
    commitBirthdate,
    draft.isDeleting,
    draft.isSaving,
    isClientAvailable,
    maxBirthDate,
  ]);

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
    if (!draftRef.current.birthDate || draftRef.current.isSaving || draftRef.current.isDeleting) {
      return;
    }

    const nextDraft: ClientFormDraft = {
      ...draftRef.current,
      birthDate: null,
    };

    updateDraft(nextDraft);
    setFieldErrors(currentErrors => ({
      ...currentErrors,
      birthDate: undefined,
    }));

    setScreenState(previousState => {
      if (previousState === 'offline' || previousState === 'loading') {
        return previousState;
      }

      return resolveInteractiveState(extractValues(nextDraft));
    });
  }, [updateDraft]);

  const handleFieldChange = useCallback(
    (field: Exclude<ClientFormField, 'birthDate' | 'gender'>, value: string) => {
      const nextDraft: ClientFormDraft = {
        ...draftRef.current,
        [field]: value,
      };

      updateDraft(nextDraft);
      setFieldErrors(currentErrors => ({
        ...currentErrors,
        [field]: undefined,
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

        return resolveInteractiveState(extractValues(nextDraft));
      });
    },
    [updateDraft],
  );

  const handleGenderSelect = useCallback(
    (gender: ClientGender) => {
      const nextDraft: ClientFormDraft = {
        ...draftRef.current,
        gender,
      };

      updateDraft(nextDraft);
      setFieldErrors(currentErrors => ({
        ...currentErrors,
        gender: undefined,
      }));

      setScreenState(previousState => {
        if (previousState === 'offline' || previousState === 'loading') {
          return previousState;
        }

        return resolveInteractiveState(extractValues(nextDraft));
      });
    },
    [updateDraft],
  );

  const handleFieldBlur = useCallback(
    (field: ClientFormField) => {
      const currentDraft = draftRef.current;
      let nextDraft = currentDraft;

      if (field === 'firstName') {
        nextDraft = {
          ...currentDraft,
          firstName: currentDraft.firstName.trim(),
        };
      } else if (field === 'lastName') {
        nextDraft = {
          ...currentDraft,
          lastName: currentDraft.lastName.trim(),
        };
      }

      if (nextDraft !== currentDraft) {
        updateDraft(nextDraft);
      }

      setFieldErrors(currentErrors => ({
        ...currentErrors,
        [field]: getFieldError(field, nextDraft),
      }));
    },
    [updateDraft],
  );

  const handleSubmitUpdate = useCallback(async () => {
    if (draftRef.current.isSaving || draftRef.current.isDeleting) {
      return;
    }

    const normalizedDraft = normalizeDraftForSubmit(draftRef.current);
    const validationErrors = validateValues(extractValues(normalizedDraft));
    const hasValidationErrors = Object.keys(validationErrors).length > 0;

    updateDraft(normalizedDraft);
    setFieldErrors(validationErrors);

    if (hasValidationErrors || !normalizedDraft.isDirty) {
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

    const payload = buildUpdatePayload(normalizedDraft);
    if (!payload) {
      setScreenState('disabled');
      return;
    }

    setDraft(currentValue => ({
      ...currentValue,
      isSaving: true,
    }));
    setScreenState('loading');
    setBannerState(null);

    try {
      const response = await updateClient(payload);
      const updatedValues = mapClientValuesFromResponse({
        ...response,
        firstName: response.firstName ?? payload.firstName,
        lastName: response.lastName ?? payload.lastName,
        birthDate: response.birthDate ?? payload.birthDate,
        phoneNumber: response.phoneNumber ?? payload.phoneNumber,
        gender: response.gender ?? payload.gender,
        notes: response.notes ?? payload.notes,
      });

      setDraft(currentValue => {
        const nextDraft: ClientFormDraft = {
          ...currentValue,
          ...updatedValues,
          original: updatedValues,
          isDirty: false,
        };

        draftRef.current = nextDraft;
        return nextDraft;
      });

      Alert.alert('Client updated');
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
        setScreenState(resolveInteractiveState(extractValues(draftRef.current)));
        setBannerState({
          tone: 'info',
          message: CONFLICT_MESSAGE,
        });
      } else {
        setScreenState('error');
        setBannerState({
          tone: 'error',
          message: UPDATE_CLIENT_ERROR_MESSAGE,
        });
      }
    } finally {
      setDraft(currentValue => ({
        ...currentValue,
        isSaving: false,
      }));
    }
  }, [replaceWithClientsList, screenState, updateDraft]);

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
      await deleteClient(draftRef.current.id);
      Alert.alert('Client deleted');
      replaceWithClientsList();
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
          message: DELETE_CLIENT_ERROR_MESSAGE,
        });
      }
    } finally {
      setDraft(currentValue => ({
        ...currentValue,
        isDeleting: false,
      }));
    }
  }, [replaceWithClientsList, screenState]);

  const handleDeletePress = useCallback(() => {
    Alert.alert(
      'Delete client?',
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

  const computedErrors = useMemo(
    () => validateValues(extractValues(draft)),
    [draft],
  );

  const hasComputedErrors = useMemo(
    () => Object.keys(computedErrors).length > 0,
    [computedErrors],
  );

  const isUpdateDisabled =
    !isClientAvailable ||
    isInitializing ||
    draft.isSaving ||
    draft.isDeleting ||
    screenState === 'offline' ||
    !draft.isDirty ||
    hasComputedErrors;

  const isDeleteDisabled =
    !isClientAvailable ||
    isInitializing ||
    draft.isSaving ||
    draft.isDeleting ||
    screenState === 'offline';

  const contentBottomPadding = useMemo(() => 24, []);

  const actionSectionBottomPadding = useMemo(
    () => BOTTOM_MENU_HEIGHT + insets.bottom + 12,
    [insets.bottom],
  );

  const isLoadClientConnectionWarning =
    screenState === 'error' && bannerState?.message === LOAD_CLIENT_ERROR_MESSAGE;

  const isConnectionIndicatorVisible =
    screenState === 'offline' ||
    bannerState?.tone === 'offline' ||
    isLoadClientConnectionWarning;

  const handleOfflineInfoPress = useCallback(() => {
    Alert.alert(
      isLoadClientConnectionWarning
        ? LOAD_CLIENT_ERROR_MESSAGE
        : OFFLINE_MESSAGE,
    );
  }, [isLoadClientConnectionWarning]);

  const isLoadingState = screenState === 'loading' && isInitializing;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container} testID="screen.clients.details">
        <GlobalHeader
          title="Client"
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
            !isLoadClientConnectionWarning ? (
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
                      editable={!draft.isSaving && !draft.isDeleting && isClientAvailable}
                      maxLength={50}
                      onBlur={() => handleFieldBlur('firstName')}
                      onChangeText={value => handleFieldChange('firstName', value)}
                      placeholder="Enter first name"
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
                      editable={!draft.isSaving && !draft.isDeleting && isClientAvailable}
                      maxLength={50}
                      onBlur={() => handleFieldBlur('lastName')}
                      onChangeText={value => handleFieldChange('lastName', value)}
                      placeholder="Enter last name"
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
                        disabled={draft.isSaving || draft.isDeleting || !isClientAvailable}
                        onPress={handleBirthdatePress}
                        style={({ pressed }) => [
                          styles.birthdateValueButton,
                          pressed &&
                            !draft.isSaving &&
                            !draft.isDeleting &&
                            isClientAvailable &&
                            styles.birthdateValueButtonPressed,
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
                        disabled={
                          !draft.birthDate ||
                          draft.isSaving ||
                          draft.isDeleting ||
                          !isClientAvailable
                        }
                        onPress={handleClearBirthdate}
                        style={({ pressed }) => [
                          styles.birthdateClearButton,
                          (!draft.birthDate ||
                            draft.isSaving ||
                            draft.isDeleting ||
                            !isClientAvailable) &&
                            styles.birthdateClearButtonDisabled,
                          pressed &&
                            !draft.isSaving &&
                            !draft.isDeleting &&
                            draft.birthDate &&
                            isClientAvailable &&
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
                            disabled={draft.isSaving || draft.isDeleting || !isClientAvailable}
                            onPress={() => handleGenderSelect(gender)}
                            style={({ pressed }) => [
                              styles.segmentOption,
                              isSelected && styles.segmentOptionSelected,
                              pressed && !isSelected && styles.segmentOptionPressed,
                              (draft.isSaving || draft.isDeleting || !isClientAvailable) &&
                                styles.buttonDisabled,
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
                      editable={!draft.isSaving && !draft.isDeleting && isClientAvailable}
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
                      editable={!draft.isSaving && !draft.isDeleting && isClientAvailable}
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

          <View style={[styles.actionsSection, { paddingBottom: actionSectionBottomPadding }]}>
            <View style={styles.actionsRow}>
              <Pressable
                testID="button.clients.save"
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
                testID="button.clients.delete"
                accessibilityRole="button"
                disabled={isDeleteDisabled}
                onPress={handleDeletePress}
                style={({ pressed }) => [
                  styles.deleteButton,
                  isDeleteDisabled && styles.buttonDisabled,
                  pressed && !isDeleteDisabled && styles.deleteButtonPressed,
                ]}>
                {draft.isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.deleteButtonText}>X</Text>
                )}
              </Pressable>
            </View>
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
