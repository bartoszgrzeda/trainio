import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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
import { StatusBanner } from '../components/shell/StatusBanner';

type TrainingStatus = 'planned' | 'finished' | 'canceled' | 'started';

interface TrainingItem {
  id: string;
  startTime: string;
  name: string;
  status: TrainingStatus;
}

interface HomeApiResponse {
  date: string;
  nextTraining: TrainingItem | null;
  activeTrainingId: string | null;
  trainings: TrainingItem[];
}

interface HomeData {
  date: string;
  nextTraining: TrainingItem | null;
  activeTrainingId: string | null;
  trainings: TrainingItem[];
}

type HomeViewState = 'loading' | 'default' | 'empty' | 'error' | 'offline';

interface NavigationLike {
  navigate: (route: string) => void;
}

interface HomeScreenProps {
  navigation?: NavigationLike;
}

interface ApiError extends Error {
  status?: number;
}

const STATUS_LABELS: Record<TrainingStatus, string> = {
  planned: 'Planned',
  finished: 'Finished',
  canceled: 'Canceled',
  started: 'Started',
};

const API_BASE_URL = 'http://localhost:3000';
const LOAD_ERROR_MESSAGE = 'Could not load trainings. Try again.';
const OFFLINE_MESSAGE = 'No internet connection';

function createApiError(status: number, fallbackMessage: string): ApiError {
  const error = new Error(fallbackMessage) as ApiError;
  error.status = status;
  return error;
}

function getLocalDateKey(now: Date): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMinutesFromTime(time: string): number {
  const [hours, minutes] = time.split(':').map(value => Number(value));

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return hours * 60 + minutes;
}

function isUpcomingTraining(startTime: string, now: Date): boolean {
  const candidate = new Date(now);
  const [hours, minutes] = startTime.split(':').map(value => Number(value));
  candidate.setHours(hours, minutes, 0, 0);
  return candidate.getTime() >= now.getTime();
}

function sortTrainingsByStartTime(trainings: TrainingItem[]): TrainingItem[] {
  return trainings
    .map((training, index) => ({ training, index }))
    .sort((left, right) => {
      const minuteDifference =
        getMinutesFromTime(left.training.startTime) -
        getMinutesFromTime(right.training.startTime);

      if (minuteDifference !== 0) {
        return minuteDifference;
      }

      return left.index - right.index;
    })
    .map(item => item.training);
}

function resolveNextTraining(
  trainings: TrainingItem[],
  apiNextTraining: TrainingItem | null,
): TrainingItem | null {
  const now = new Date();

  if (
    apiNextTraining &&
    apiNextTraining.status === 'planned' &&
    isUpcomingTraining(apiNextTraining.startTime, now)
  ) {
    return apiNextTraining;
  }

  return (
    trainings.find(
      training =>
        training.status === 'planned' &&
        isUpcomingTraining(training.startTime, now),
    ) ?? null
  );
}

function normalizeHomeResponse(payload: HomeApiResponse): HomeData {
  const sortedTrainings = sortTrainingsByStartTime(payload.trainings ?? []);
  return {
    date: payload.date,
    activeTrainingId: payload.activeTrainingId ?? null,
    trainings: sortedTrainings,
    nextTraining: resolveNextTraining(sortedTrainings, payload.nextTraining),
  };
}

function resolveScreenState(homeData: HomeData): HomeViewState {
  if (homeData.nextTraining == null && homeData.trainings.length === 0) {
    return 'empty';
  }

  return 'default';
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

async function fetchHomeData(dateKey: string): Promise<HomeData> {
  const response = await fetch(
    `${API_BASE_URL}/api/trainings/home?date=${dateKey}`,
  );

  if (!response.ok) {
    throw createApiError(response.status, LOAD_ERROR_MESSAGE);
  }

  const payload = (await response.json()) as HomeApiResponse;
  return normalizeHomeResponse(payload);
}

async function startTraining(trainingId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/trainings/${trainingId}/start`,
    {
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw createApiError(response.status, 'Could not start training.');
  }
}

function getStartErrorMessage(error: unknown): string {
  if (isOfflineError(error)) {
    return OFFLINE_MESSAGE;
  }

  if ((error as ApiError).status === 404 || (error as ApiError).status === 409) {
    return 'Selected training is no longer available. Refreshing list.';
  }

  return 'Could not start training. Please try again.';
}

function isInvalidNextTrainingError(error: unknown): boolean {
  return (error as ApiError).status === 404 || (error as ApiError).status === 409;
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const cacheRef = useRef<HomeData | null>(null);

  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [screenState, setScreenState] = useState<HomeViewState>('loading');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isStartingTraining, setIsStartingTraining] = useState(false);

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

  const loadHome = useCallback(async (isRefresh: boolean, clearBanner = true) => {
    if (!isRefresh && cacheRef.current == null) {
      setScreenState('loading');
    }

    if (clearBanner) {
      setBannerMessage(null);
    }

    try {
      const data = await fetchHomeData(getLocalDateKey(new Date()));
      cacheRef.current = data;
      setHomeData(data);
      setScreenState(resolveScreenState(data));
    } catch (error) {
      if (isOfflineError(error)) {
        setScreenState('offline');
        if (cacheRef.current) {
          setHomeData(cacheRef.current);
        }
        setBannerMessage(OFFLINE_MESSAGE);
      } else {
        setScreenState(cacheRef.current ? resolveScreenState(cacheRef.current) : 'error');
        if (cacheRef.current) {
          setHomeData(cacheRef.current);
        }
        setBannerMessage(LOAD_ERROR_MESSAGE);
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadHome(false).catch(() => undefined);
  }, [loadHome]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadHome(true).catch(() => undefined);
  }, [loadHome]);

  const handleBottomNavigation = useCallback(
    (route: AppShellRoute) => {
      navigateToRoute(route);
    },
    [navigateToRoute],
  );

  const handleOpenAddTraining = useCallback(() => {
    navigateToRoute('/trainings/new');
  }, [navigateToRoute]);

  const handleStartTraining = useCallback(async () => {
    if (!homeData?.nextTraining || homeData.activeTrainingId != null) {
      return;
    }

    if (screenState === 'offline') {
      setBannerMessage(OFFLINE_MESSAGE);
      return;
    }

    setIsStartingTraining(true);
    setBannerMessage(null);

    try {
      await startTraining(homeData.nextTraining.id);

      const startedTrainingId = homeData.nextTraining.id;

      setHomeData(previousValue => {
        if (!previousValue) {
          return previousValue;
        }

        const updatedTrainings = previousValue.trainings.map(training =>
          training.id === startedTrainingId
            ? { ...training, status: 'started' as const }
            : training,
        );

        return {
          ...previousValue,
          activeTrainingId: startedTrainingId,
          trainings: updatedTrainings,
          nextTraining: resolveNextTraining(updatedTrainings, null),
        };
      });

      Alert.alert('Training started');
      navigateToRoute('/training/start');
    } catch (error) {
      setBannerMessage(getStartErrorMessage(error));

      if (isOfflineError(error)) {
        setScreenState('offline');
      }

      if (isInvalidNextTrainingError(error)) {
        await loadHome(true, false);
      }
    } finally {
      setIsStartingTraining(false);
    }
  }, [homeData, loadHome, navigateToRoute, screenState]);

  const handleStartTrainingPress = useCallback(() => {
    handleStartTraining().catch(() => undefined);
  }, [handleStartTraining]);

  const trainings = homeData?.trainings ?? [];
  const nextTraining = homeData?.nextTraining ?? null;
  const activeTrainingId = homeData?.activeTrainingId ?? null;
  const isStartDisabled =
    screenState === 'loading' ||
    screenState === 'offline' ||
    isStartingTraining ||
    nextTraining == null ||
    activeTrainingId != null;
  const offlineBannerBottomOffset = useMemo(
    () =>
      BOTTOM_MENU_HEIGHT +
      Math.max(insets.bottom, 8) +
      (activeTrainingId == null ? 24 : 0) +
      8,
    [activeTrainingId, insets.bottom],
  );

  const contentBottomPadding = useMemo(
    () =>
      BOTTOM_MENU_HEIGHT +
      insets.bottom +
      24 +
      (screenState === 'offline' ? 72 : 0),
    [insets.bottom, screenState],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        <GlobalHeader title="Home" />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: contentBottomPadding },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }>
          {bannerMessage && screenState !== 'offline' ? (
            <StatusBanner tone="error" message={bannerMessage} />
          ) : null}

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, styles.sectionTitleWithAction]}>
                Next Training
              </Text>
              <Pressable
                accessibilityLabel="Start Training"
                accessibilityRole="button"
                disabled={isStartDisabled}
                onPress={handleStartTrainingPress}
                style={({ pressed }) => [
                  styles.actionButton,
                  isStartDisabled && styles.buttonDisabled,
                  pressed && !isStartDisabled && styles.actionButtonPressed,
                ]}>
                <Text style={styles.actionButtonText}>▶</Text>
              </Pressable>
            </View>
            {screenState === 'loading' && !homeData ? (
              <LoadingSkeleton rows={2} rowHeight={18} />
            ) : nextTraining ? (
              <View style={styles.nextTrainingCard}>
                <Text style={styles.nextTrainingText}>
                  Next Training: {nextTraining.name} - {nextTraining.startTime}
                </Text>
                <Text style={styles.statusPill}>
                  {STATUS_LABELS[nextTraining.status]}
                </Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>No next training scheduled</Text>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, styles.sectionTitleWithAction]}>
                Today Training
              </Text>
              <Pressable
                accessibilityLabel="Add training"
                accessibilityRole="button"
                disabled={screenState === 'loading'}
                onPress={handleOpenAddTraining}
                style={({ pressed }) => [
                  styles.actionButton,
                  screenState === 'loading' && styles.buttonDisabled,
                  pressed &&
                    screenState !== 'loading' &&
                    styles.actionButtonPressed,
                ]}>
                <Text style={styles.actionButtonText}>+</Text>
              </Pressable>
            </View>
            {screenState === 'loading' && !homeData ? (
              <LoadingSkeleton rows={4} rowHeight={22} />
            ) : trainings.length > 0 ? (
              <View style={styles.listContainer}>
                {trainings.map(training => (
                  <View key={training.id} style={styles.listRow}>
                    <Text style={styles.timeText}>{training.startTime}</Text>
                    <View style={styles.listDetails}>
                      <Text style={styles.nameText}>{training.name}</Text>
                      <Text style={styles.listStatusText}>
                        {STATUS_LABELS[training.status]}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No trainings planned for today</Text>
            )}
          </View>
        </ScrollView>

        {screenState === 'offline' ? (
          <View
            style={[
              styles.fixedOfflineBanner,
              { bottom: offlineBannerBottomOffset },
            ]}>
            <StatusBanner tone="offline" message={OFFLINE_MESSAGE} />
          </View>
        ) : null}

        <BottomMenu
          activeRoute="/home"
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionTitleWithAction: {
    flex: 85,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextTrainingCard: {
    borderWidth: 1,
    borderColor: '#D8E1EB',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    backgroundColor: '#FAFCFF',
  },
  nextTrainingText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
    color: '#075985',
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    flex: 15,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButtonPressed: {
    backgroundColor: '#1E40AF',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 22,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  listContainer: {
    gap: 8,
  },
  listRow: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4EAF1',
    padding: 10,
    alignItems: 'center',
  },
  timeText: {
    width: 52,
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  listDetails: {
    flex: 1,
    gap: 4,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  listStatusText: {
    fontSize: 13,
    color: '#4B5563',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  fixedOfflineBanner: {
    position: 'absolute',
    right: 16,
    left: 16,
    zIndex: 6,
  },
});
