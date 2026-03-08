import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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

type ExercisesViewState = 'default' | 'loading' | 'empty' | 'error' | 'offline';

type ExerciseSource = 'seeded' | 'custom';

interface ExerciseItem {
  id: string;
  name: string;
  source: ExerciseSource | string;
}

interface ExercisesResponse {
  exercises?: ExerciseItem[];
}

interface ApiError extends Error {
  status?: number;
}

interface NavigationLike {
  navigate: (route: string) => void;
  goBack?: () => void;
}

interface SettingsExercisesScreenProps {
  navigation?: NavigationLike;
  activeTrainingId?: string | null;
}

const API_BASE_URL = 'http://localhost:3000';
const LOAD_EXERCISES_ERROR_MESSAGE = 'Could not load exercises. Try again.';
const OFFLINE_MESSAGE = 'No internet connection';
const NO_EXERCISES_MESSAGE = 'No exercises yet. Add your first exercise.';
const NO_SEARCH_RESULTS_MESSAGE = 'No exercises found.';
const SEARCH_LENGTH_ERROR_MESSAGE = 'Search can contain up to 80 characters.';
const MAX_SEARCH_QUERY_LENGTH = 80;

let persistedSearchQuery = '';

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

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function sortExercisesByName(exercises: ExerciseItem[]): ExerciseItem[] {
  return exercises
    .map((exercise, index) => ({ exercise, index }))
    .sort((left, right) => {
      const nameComparison = left.exercise.name.localeCompare(right.exercise.name, undefined, {
        sensitivity: 'base',
      });

      if (nameComparison !== 0) {
        return nameComparison;
      }

      const idComparison = left.exercise.id.localeCompare(right.exercise.id, undefined, {
        sensitivity: 'base',
      });

      if (idComparison !== 0) {
        return idComparison;
      }

      return left.index - right.index;
    })
    .map(item => item.exercise);
}

function dedupeById(exercises: ExerciseItem[]): ExerciseItem[] {
  const seen = new Set<string>();

  return exercises.filter(exercise => {
    if (seen.has(exercise.id)) {
      return false;
    }

    seen.add(exercise.id);
    return true;
  });
}

function sanitizeQuery(value: string): string {
  return value.trim();
}

function filterExercises(exercises: ExerciseItem[], query: string): ExerciseItem[] {
  const sanitizedQuery = sanitizeQuery(query);

  if (!sanitizedQuery) {
    return sortExercisesByName(exercises);
  }

  const normalizedQuery = normalizeSearchValue(sanitizedQuery);

  return sortExercisesByName(
    exercises.filter(exercise =>
      normalizeSearchValue(exercise.name).includes(normalizedQuery),
    ),
  );
}

function resolveScreenState(exercises: ExerciseItem[]): ExercisesViewState {
  if (exercises.length === 0) {
    return 'empty';
  }

  return 'default';
}

async function fetchExercises(query: string): Promise<ExerciseItem[]> {
  const params = new URLSearchParams({
    query,
    includeSeeded: 'true',
  });

  const response = await fetch(`${API_BASE_URL}/api/exercises/list?${params.toString()}`);

  if (!response.ok) {
    throw createApiError(response.status, LOAD_EXERCISES_ERROR_MESSAGE);
  }

  const payload = (await response.json()) as ExercisesResponse;
  const exercises = payload.exercises ?? [];

  return dedupeById(exercises);
}

export function SettingsExercisesScreen({
  navigation,
  activeTrainingId = null,
}: SettingsExercisesScreenProps) {
  const insets = useSafeAreaInsets();
  const cacheRef = useRef<ExerciseItem[] | null>(null);

  const [screenState, setScreenState] = useState<ExercisesViewState>('loading');
  const [allExercises, setAllExercises] = useState<ExerciseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(() => persistedSearchQuery);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const loadExercises = useCallback(async (isRefresh: boolean) => {
    if (!isRefresh && cacheRef.current == null) {
      setScreenState('loading');
    }

    try {
      const loadedExercises = await fetchExercises('');
      const sortedExercises = sortExercisesByName(loadedExercises);

      cacheRef.current = sortedExercises;
      setAllExercises(sortedExercises);
      setScreenState(resolveScreenState(sortedExercises));
    } catch (error) {
      if (isOfflineError(error)) {
        setScreenState('offline');

        if (cacheRef.current) {
          setAllExercises(cacheRef.current);
        } else {
          setAllExercises([]);
        }
      } else {
        setScreenState('error');

        if (cacheRef.current) {
          setAllExercises(cacheRef.current);
        }
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadExercises(false).catch(() => undefined);
  }, [loadExercises]);

  useEffect(() => {
    persistedSearchQuery = searchQuery;
  }, [searchQuery]);

  const visibleExercises = useMemo(
    () => filterExercises(allExercises, searchQuery),
    [allExercises, searchQuery],
  );

  const handleBottomNavigation = useCallback(
    (route: AppShellRoute) => {
      navigateToRoute(route);
    },
    [navigateToRoute],
  );

  const handleRefresh = useCallback(() => {
    if (screenState === 'offline') {
      return;
    }

    setRefreshing(true);
    loadExercises(true).catch(() => undefined);
  }, [loadExercises, screenState]);

  const handleSearchChange = useCallback((value: string) => {
    if (value.length > MAX_SEARCH_QUERY_LENGTH) {
      setSearchError(SEARCH_LENGTH_ERROR_MESSAGE);
      return;
    }

    setSearchQuery(value);
    setSearchError(null);
  }, []);

  const handleOpenAddExercise = useCallback(() => {
    navigateToRoute('/settings/exercises/new');
  }, [navigateToRoute]);

  const handleOpenExerciseDetails = useCallback(
    (exerciseId: string) => {
      navigateToRoute(`/settings/exercises/${encodeURIComponent(exerciseId)}`);
    },
    [navigateToRoute],
  );
  const handleOfflineInfoPress = useCallback(() => {
    Alert.alert(
      screenState === 'error' ? LOAD_EXERCISES_ERROR_MESSAGE : OFFLINE_MESSAGE,
    );
  }, [screenState]);

  const isHardLoading =
    screenState === 'loading' && cacheRef.current == null && allExercises.length === 0;

  const contentBottomPadding = useMemo(
    () => BOTTOM_MENU_HEIGHT + insets.bottom + 24,
    [insets.bottom],
  );

  const emptyMessage =
    allExercises.length === 0 ? NO_EXERCISES_MESSAGE : NO_SEARCH_RESULTS_MESSAGE;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        <GlobalHeader
          title="Exercises"
          leftAction={{
            label: 'Back',
            onPress: navigateBack,
          }}
          statusIndicator={
            screenState === 'offline' || screenState === 'error'
              ? {
                  accessibilityLabel: 'No internet connection details',
                  onPress: handleOfflineInfoPress,
                }
              : undefined
          }
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: contentBottomPadding },
          ]}
          refreshControl={
            screenState !== 'offline' ? (
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            ) : undefined
          }>
          <View style={styles.controlsSection}>
            <View style={styles.searchRow}>
              <View style={styles.searchInputContainer}>
                <TextInput
                  accessibilityLabel="Search exercises"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isHardLoading}
                  onChangeText={handleSearchChange}
                  placeholder="Search exercises"
                  style={styles.searchInput}
                  value={searchQuery}
                />
              </View>

              <Pressable
                accessibilityLabel="Add exercise"
                accessibilityRole="button"
                disabled={isHardLoading}
                onPress={handleOpenAddExercise}
                style={({ pressed }) => [
                  styles.addButton,
                  isHardLoading && styles.buttonDisabled,
                  pressed && !isHardLoading && styles.addButtonPressed,
                ]}>
                <Text style={styles.addButtonText}>+</Text>
              </Pressable>
            </View>

            {searchError ? (
              <Text style={styles.searchErrorText}>{searchError}</Text>
            ) : null}
          </View>

          <View style={styles.listSection}>
            {isHardLoading ? (
              <LoadingSkeleton rows={6} rowHeight={44} />
            ) : visibleExercises.length > 0 ? (
              <View style={styles.listContainer}>
                {visibleExercises.map(exercise => (
                  <Pressable
                    key={exercise.id}
                    accessibilityLabel={exercise.name}
                    accessibilityRole="button"
                    onPress={() => handleOpenExerciseDetails(exercise.id)}
                    style={({ pressed }) => [
                      styles.row,
                      pressed && styles.rowPressed,
                    ]}>
                    <Text
                      ellipsizeMode="tail"
                      numberOfLines={1}
                      style={styles.rowTitle}>
                      {exercise.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            )}
          </View>
        </ScrollView>

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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  controlsSection: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputContainer: {
    flex: 85,
  },
  searchInput: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    flex: 15,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  addButtonPressed: {
    backgroundColor: '#1E40AF',
  },
  addButtonText: {
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  searchErrorText: {
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '500',
  },
  listSection: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  listContainer: {
    gap: 8,
  },
  row: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#D8E1EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#FAFCFF',
  },
  rowPressed: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
