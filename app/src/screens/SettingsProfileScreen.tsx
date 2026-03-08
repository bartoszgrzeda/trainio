import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Pressable,
  RefreshControl,
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

type ProfileViewState =
  | 'default'
  | 'loading'
  | 'empty'
  | 'error'
  | 'offline'
  | 'disabled';

interface ProfileRecord {
  id: string;
  photoUrl: string | null;
  photoAssetId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface ProfileDraft extends ProfileRecord {
  isDirty: boolean;
}

interface ProfileResponse {
  id: string;
  photoUrl?: string | null;
  photoAssetId?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string | null;
}

interface UploadPhotoResponse {
  assetId: string;
  url: string;
}

interface ProfileErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  photo?: string;
}

interface SelectedPhoto {
  uri: string;
  mimeType: string;
  sizeBytes: number;
  fileName: string;
}

interface NavigationLike {
  navigate: (route: string) => void;
  goBack?: () => void;
}

interface SettingsProfileScreenProps {
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

const API_BASE_URL = 'http://localhost:3000';
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const PHOTO_RULE_MESSAGE = 'Use JPG, PNG, or WEBP up to 5 MB.';
const LOAD_PROFILE_ERROR_MESSAGE = 'Could not load profile. Pull to refresh and try again.';
const SAVE_PROFILE_ERROR_MESSAGE = 'Could not save profile. Try again.';
const OFFLINE_MESSAGE = 'No internet connection';
const SAVE_SUCCESS_MESSAGE = 'Profile updated';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-() ]{7,20}$/;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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

function normalizeProfileResponse(payload: ProfileResponse): ProfileRecord {
  return {
    id: payload.id,
    photoUrl: payload.photoUrl ?? null,
    photoAssetId: payload.photoAssetId ?? null,
    firstName: payload.firstName ?? '',
    lastName: payload.lastName ?? '',
    email: payload.email ?? '',
    phoneNumber: payload.phoneNumber ?? '',
  };
}

function normalizeDraftValues(draft: ProfileDraft): ProfileDraft {
  return {
    ...draft,
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    email: draft.email.trim().toLowerCase(),
    phoneNumber: draft.phoneNumber.trim(),
  };
}

function getInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0);
  const last = lastName.trim().charAt(0);
  const initials = `${first}${last}`.trim().toUpperCase();
  return initials || 'TR';
}

function resolveProfileState(profile: ProfileRecord): ProfileViewState {
  if (!profile.photoUrl && !profile.phoneNumber) {
    return 'empty';
  }

  return 'default';
}

function validateProfileDraft(draft: ProfileDraft): ProfileErrors {
  const errors: ProfileErrors = {};

  if (draft.firstName.length < 1 || draft.firstName.length > 50) {
    errors.firstName = 'First name is required.';
  }

  if (draft.lastName.length < 1 || draft.lastName.length > 50) {
    errors.lastName = 'Last name is required.';
  }

  if (!EMAIL_REGEX.test(draft.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (draft.phoneNumber && !PHONE_REGEX.test(draft.phoneNumber)) {
    errors.phoneNumber = 'Enter a valid phone number.';
  }

  return errors;
}

function hasProfileChanges(original: ProfileRecord, draft: ProfileDraft): boolean {
  return (
    original.photoAssetId !== draft.photoAssetId ||
    original.firstName !== draft.firstName ||
    original.lastName !== draft.lastName ||
    original.email !== draft.email ||
    original.phoneNumber !== draft.phoneNumber
  );
}

async function fetchProfile(): Promise<ProfileRecord> {
  const response = await fetch(`${API_BASE_URL}/api/profile/get`);

  if (!response.ok) {
    throw createApiError(response.status, LOAD_PROFILE_ERROR_MESSAGE);
  }

  const payload = (await response.json()) as ProfileResponse;
  return normalizeProfileResponse(payload);
}

async function uploadProfilePhoto(photo: SelectedPhoto): Promise<UploadPhotoResponse> {
  const formData = new FormData();
  formData.append('file', {
    uri: photo.uri,
    type: photo.mimeType,
    name: photo.fileName,
  } as never);

  const response = await fetch(`${API_BASE_URL}/api/uploads/profile-photo`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw createApiError(response.status, PHOTO_RULE_MESSAGE);
  }

  return (await response.json()) as UploadPhotoResponse;
}

async function saveProfile(profile: ProfileDraft): Promise<ProfileRecord> {
  const response = await fetch(`${API_BASE_URL}/api/profile/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      photoAssetId: profile.photoAssetId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phoneNumber: profile.phoneNumber || null,
    }),
  });

  if (!response.ok) {
    throw createApiError(response.status, SAVE_PROFILE_ERROR_MESSAGE);
  }

  const payload = (await response.json()) as ProfileResponse;
  return normalizeProfileResponse(payload);
}

function choosePhotoFromDevice(): Promise<SelectedPhoto | null> {
  return new Promise(resolve => {
    let wasResolved = false;

    const resolveOnce = (photo: SelectedPhoto | null) => {
      if (wasResolved) {
        return;
      }

      wasResolved = true;
      resolve(photo);
    };

    Alert.alert(
      'Upload Photo',
      'Choose image source.',
      [
        {
          text: 'Camera',
          onPress: () =>
            resolveOnce({
              uri: 'file:///mock/camera-profile.jpg',
              mimeType: 'image/jpeg',
              sizeBytes: 425_000,
              fileName: 'camera-profile.jpg',
            }),
        },
        {
          text: 'Gallery',
          onPress: () =>
            resolveOnce({
              uri: 'file:///mock/gallery-profile.jpg',
              mimeType: 'image/jpeg',
              sizeBytes: 380_000,
              fileName: 'gallery-profile.jpg',
            }),
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolveOnce(null),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => resolveOnce(null),
      },
    );
  });
}

export function SettingsProfileScreen({
  navigation,
  activeTrainingId = null,
}: SettingsProfileScreenProps) {
  const insets = useSafeAreaInsets();

  const [screenState, setScreenState] = useState<ProfileViewState>('loading');
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [bannerState, setBannerState] = useState<BannerState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ProfileErrors>({});
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const navigateBack = useCallback(() => {
    if (navigation?.goBack) {
      navigation.goBack();
      return;
    }

    navigateToRoute('/settings');
  }, [navigation, navigateToRoute]);

  const loadProfileData = useCallback(
    async (isRefresh: boolean) => {
      if (!isRefresh) {
        setScreenState('loading');
      }

      if (!isRefresh) {
        setBannerState(null);
      }

      try {
        const loadedProfile = await fetchProfile();
        const initialDraft: ProfileDraft = {
          ...loadedProfile,
          isDirty: false,
        };

        setProfile(loadedProfile);
        setDraft(initialDraft);
        setScreenState(resolveProfileState(loadedProfile));
        setFieldErrors({});
        setPhotoUploadError(null);
        setPendingPhotoUri(null);
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
            message: LOAD_PROFILE_ERROR_MESSAGE,
          });
        }
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    loadProfileData(false).catch(() => undefined);
  }, [loadProfileData]);

  const normalizedDraft = useMemo(
    () => (draft ? normalizeDraftValues(draft) : null),
    [draft],
  );

  const computedErrors = useMemo(
    () => (normalizedDraft ? validateProfileDraft(normalizedDraft) : {}),
    [normalizedDraft],
  );

  const isDirty = useMemo(() => {
    if (!profile || !normalizedDraft) {
      return false;
    }

    return hasProfileChanges(profile, normalizedDraft);
  }, [profile, normalizedDraft]);

  useEffect(() => {
    setDraft(currentValue =>
      currentValue ? { ...currentValue, isDirty } : currentValue,
    );
  }, [isDirty]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfileData(true).catch(() => undefined);
  }, [loadProfileData]);

  const handleBottomNavigation = useCallback(
    (route: AppShellRoute) => {
      if (route === '/settings') {
        navigateToRoute('/settings');
        return;
      }

      navigateToRoute(route);
    },
    [navigateToRoute],
  );

  const handleBackAction = useCallback(() => {
    if (!isDirty) {
      navigateBack();
      return;
    }

    Alert.alert(
      'Discard changes?',
      'You have unsaved profile changes.',
      [
        {
          text: 'Continue Editing',
          style: 'cancel',
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigateBack(),
        },
      ],
      { cancelable: true },
    );
  }, [isDirty, navigateBack]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!isDirty) {
          return false;
        }

        handleBackAction();
        return true;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [handleBackAction, isDirty]);

  const handleInputChange = useCallback(
    (field: keyof Pick<ProfileDraft, 'firstName' | 'lastName' | 'email' | 'phoneNumber'>, value: string) => {
      setDraft(currentValue =>
        currentValue ? { ...currentValue, [field]: value } : currentValue,
      );
      setFieldErrors(currentValue => ({ ...currentValue, [field]: undefined }));
      setBannerState(null);
    },
    [],
  );

  const handleEmailBlur = useCallback(() => {
    if (!draft) {
      return;
    }

    const normalizedEmail = draft.email.trim().toLowerCase();
    setFieldErrors(currentValue => ({
      ...currentValue,
      email: EMAIL_REGEX.test(normalizedEmail)
        ? undefined
        : 'Enter a valid email address.',
    }));
  }, [draft]);

  const handleChoosePhoto = useCallback(async () => {
    if (isUploadingPhoto || isSaving) {
      return;
    }

    if (screenState === 'offline') {
      setBannerState({
        tone: 'offline',
        message: OFFLINE_MESSAGE,
      });
      return;
    }

    const selectedPhoto = await choosePhotoFromDevice();

    if (!selectedPhoto) {
      return;
    }

    if (
      !ALLOWED_MIME_TYPES.has(selectedPhoto.mimeType) ||
      selectedPhoto.sizeBytes > MAX_PHOTO_SIZE_BYTES
    ) {
      setPhotoUploadError(PHOTO_RULE_MESSAGE);
      setFieldErrors(currentValue => ({
        ...currentValue,
        photo: PHOTO_RULE_MESSAGE,
      }));
      return;
    }

    setPendingPhotoUri(selectedPhoto.uri);
    setPhotoUploadError(null);
    setFieldErrors(currentValue => ({ ...currentValue, photo: undefined }));
    setIsUploadingPhoto(true);
    setBannerState(null);

    try {
      const uploadResult = await uploadProfilePhoto(selectedPhoto);

      setDraft(currentValue =>
        currentValue
          ? {
              ...currentValue,
              photoAssetId: uploadResult.assetId,
              photoUrl: uploadResult.url,
            }
          : currentValue,
      );
      setPendingPhotoUri(uploadResult.url);
    } catch (error) {
      setPendingPhotoUri(null);
      setPhotoUploadError(PHOTO_RULE_MESSAGE);

      if (isOfflineError(error)) {
        setScreenState('offline');
        setBannerState({
          tone: 'offline',
          message: OFFLINE_MESSAGE,
        });
      } else {
        setBannerState({
          tone: 'error',
          message: 'Could not upload photo. Try again.',
        });
      }
    } finally {
      setIsUploadingPhoto(false);
    }
  }, [isSaving, isUploadingPhoto, screenState]);

  const handleSaveProfile = useCallback(async () => {
    if (!profile || !draft) {
      return;
    }

    if (screenState === 'offline') {
      setBannerState({
        tone: 'offline',
        message: OFFLINE_MESSAGE,
      });
      return;
    }

    const normalized = normalizeDraftValues(draft);
    const validationErrors = validateProfileDraft(normalized);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (!hasProfileChanges(profile, normalized)) {
      return;
    }

    setIsSaving(true);
    setScreenState('disabled');
    setBannerState(null);

    try {
      const savedProfile = await saveProfile(normalized);
      const nextDraft: ProfileDraft = { ...savedProfile, isDirty: false };

      setProfile(savedProfile);
      setDraft(nextDraft);
      setPendingPhotoUri(null);
      setPhotoUploadError(null);
      setScreenState(resolveProfileState(savedProfile));
      Alert.alert(SAVE_SUCCESS_MESSAGE);
    } catch (error) {
      const status = (error as ApiError).status;

      if (isOfflineError(error)) {
        setScreenState('offline');
        setBannerState({
          tone: 'offline',
          message: OFFLINE_MESSAGE,
        });
      } else if (status === 409) {
        setScreenState('default');
        setFieldErrors(currentValue => ({
          ...currentValue,
          email: 'This email is already used by another account.',
        }));
      } else {
        setScreenState('error');
        setBannerState({
          tone: 'error',
          message: SAVE_PROFILE_ERROR_MESSAGE,
        });
      }
    } finally {
      setIsSaving(false);
      setScreenState(previousState =>
        previousState === 'disabled' ? 'default' : previousState,
      );
    }
  }, [draft, profile, screenState]);

  const handleSavePress = useCallback(() => {
    handleSaveProfile().catch(() => undefined);
  }, [handleSaveProfile]);

  const contentBottomPadding = useMemo(
    () => 24,
    [],
  );
  const saveSectionBottomPadding = useMemo(
    () => BOTTOM_MENU_HEIGHT + insets.bottom + 12,
    [insets.bottom],
  );
  const isLoadProfileConnectionWarning =
    screenState === 'error' && bannerState?.message === LOAD_PROFILE_ERROR_MESSAGE;
  const isConnectionIndicatorVisible =
    screenState === 'offline' ||
    bannerState?.tone === 'offline' ||
    isLoadProfileConnectionWarning;
  const handleOfflineInfoPress = useCallback(() => {
    Alert.alert(
      isLoadProfileConnectionWarning ? LOAD_PROFILE_ERROR_MESSAGE : OFFLINE_MESSAGE,
    );
  }, [isLoadProfileConnectionWarning]);

  const displayedPhotoUri = pendingPhotoUri ?? draft?.photoUrl ?? null;
  const initials = getInitials(draft?.firstName ?? '', draft?.lastName ?? '');
  const isSaveDisabled =
    !draft ||
    !profile ||
    !isDirty ||
    isSaving ||
    isUploadingPhoto ||
    screenState === 'offline' ||
    Object.keys(computedErrors).length > 0;
  const isUploadDisabled =
    isUploadingPhoto || isSaving || screenState === 'offline';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container} testID="screen.settings.profile">
        <GlobalHeader
          title="Profile"
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
            testID="scroll.settings.profile"
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: contentBottomPadding },
            ]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }>
            {bannerState &&
            screenState !== 'offline' &&
            !isLoadProfileConnectionWarning ? (
              <StatusBanner tone={bannerState.tone} message={bannerState.message} />
            ) : null}

            {screenState === 'loading' && !draft ? (
              <View style={styles.section}>
                <LoadingSkeleton rows={6} rowHeight={20} />
              </View>
            ) : (
              <>
                <View style={styles.section}>
                  <View style={styles.photoRow}>
                    {displayedPhotoUri ? (
                      <Image source={{ uri: displayedPhotoUri }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarInitials}>{initials}</Text>
                      </View>
                    )}

                    <View style={styles.photoActions}>
                      <Pressable
                        testID="button.profile.uploadPhoto"
                        accessibilityRole="button"
                        disabled={isUploadDisabled}
                        onPress={() => {
                          handleChoosePhoto().catch(() => undefined);
                        }}
                        style={({ pressed }) => [
                          styles.secondaryButton,
                          isUploadDisabled && styles.buttonDisabled,
                          pressed && !isUploadDisabled && styles.secondaryButtonPressed,
                        ]}>
                        <Text style={styles.secondaryButtonText}>
                          {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                        </Text>
                        {isUploadingPhoto ? (
                          <ActivityIndicator size="small" color="#1D4ED8" />
                        ) : null}
                      </Pressable>
                    </View>
                  </View>

                  {photoUploadError ? (
                    <Text testID="text.profile.error.photo" style={styles.fieldErrorText}>
                      {photoUploadError}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.section}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>First Name</Text>
                    <TextInput
                      testID="input.profile.firstName"
                      autoCapitalize="words"
                      editable={!isSaving}
                      onChangeText={value => handleInputChange('firstName', value)}
                      placeholder="Enter first name"
                      style={styles.input}
                      value={draft?.firstName ?? ''}
                    />
                    {fieldErrors.firstName ? (
                      <Text
                        testID="text.profile.error.firstName"
                        style={styles.fieldErrorText}>
                        {fieldErrors.firstName}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Last Name</Text>
                    <TextInput
                      testID="input.profile.lastName"
                      autoCapitalize="words"
                      editable={!isSaving}
                      onChangeText={value => handleInputChange('lastName', value)}
                      placeholder="Enter last name"
                      style={styles.input}
                      value={draft?.lastName ?? ''}
                    />
                    {fieldErrors.lastName ? (
                      <Text
                        testID="text.profile.error.lastName"
                        style={styles.fieldErrorText}>
                        {fieldErrors.lastName}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.section}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Email</Text>
                    <TextInput
                      testID="input.profile.email"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSaving}
                      keyboardType="email-address"
                      onBlur={handleEmailBlur}
                      onChangeText={value => handleInputChange('email', value)}
                      placeholder="Enter email"
                      style={styles.input}
                      value={draft?.email ?? ''}
                    />
                    {fieldErrors.email ? (
                      <Text
                        testID="text.profile.error.email"
                        style={styles.fieldErrorText}>
                        {fieldErrors.email}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Phone Number</Text>
                    <TextInput
                      testID="input.profile.phoneNumber"
                      autoCapitalize="none"
                      editable={!isSaving}
                      keyboardType="phone-pad"
                      onChangeText={value => handleInputChange('phoneNumber', value)}
                      placeholder="Enter phone number"
                      style={styles.input}
                      value={draft?.phoneNumber ?? ''}
                    />
                    {fieldErrors.phoneNumber ? (
                      <Text
                        testID="text.profile.error.phoneNumber"
                        style={styles.fieldErrorText}>
                        {fieldErrors.phoneNumber}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          <View style={[styles.saveSection, { paddingBottom: saveSectionBottomPadding }]}>
            <Pressable
              testID="button.profile.save"
              accessibilityRole="button"
              disabled={isSaveDisabled}
              onPress={handleSavePress}
              style={({ pressed }) => [
                styles.primaryButton,
                isSaveDisabled && styles.buttonDisabled,
                pressed && !isSaveDisabled && styles.primaryButtonPressed,
              ]}>
              <Text style={styles.primaryButtonText}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
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
    gap: 16,
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
    color: '#111827',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  photoActions: {
    flex: 1,
    gap: 8,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#E2E8F0',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: '#334155',
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
  saveSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#F5F7FA',
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonPressed: {
    backgroundColor: '#1E40AF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButtonPressed: {
    backgroundColor: '#DBEAFE',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  fieldErrorText: {
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '500',
  },
});
