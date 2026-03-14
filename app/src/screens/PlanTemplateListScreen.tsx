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
import { StatusBanner } from '../components/shell/StatusBanner';
import { getApiBaseUrl } from '../config/api';

type PlanTemplateListViewState =
  | 'loading'
  | 'default'
  | 'empty'
  | 'error'
  | 'offline';

interface PlanTemplateListItem {
  id: string;
  name: string;
}

interface PlanTemplatesApiResponse {
  planTemplates?: PlanTemplateListItem[];
  templates?: PlanTemplateListItem[];
}

interface NavigationLike {
  navigate: (route: string) => void;
  goBack?: () => void;
}

interface PlanTemplateListScreenProps {
  navigation?: NavigationLike;
  activeTrainingId?: string | null;
}

const API_BASE_URL = getApiBaseUrl();
const LOAD_ERROR_MESSAGE = 'Could not load plan templates. Try again.';
const OFFLINE_MESSAGE = 'No internet connection';
const SEARCH_PLACEHOLDER = 'Search templates';
const SEARCH_MAX_LENGTH = 80;
const SEARCH_LENGTH_ERROR_MESSAGE = 'Search can contain up to 80 characters.';
const EMPTY_TEMPLATES_MESSAGE = 'No plan templates yet. Add your first template.';
const EMPTY_SEARCH_MESSAGE = 'No plan templates found.';

let lastSearchQuery = '';

function isOfflineError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return /offline|internet|network/i.test(error.message);
}

function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function dedupeById(items: PlanTemplateListItem[]): PlanTemplateListItem[] {
  const seen = new Set<string>();

  return items.filter(item => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function sortPlanTemplatesByName(
  planTemplates: PlanTemplateListItem[],
): PlanTemplateListItem[] {
  return planTemplates
    .map((planTemplate, index) => ({ planTemplate, index }))
    .sort((left, right) => {
      const nameComparison = left.planTemplate.name.localeCompare(
        right.planTemplate.name,
        undefined,
        {
          sensitivity: 'base',
        },
      );

      if (nameComparison !== 0) {
        return nameComparison;
      }

      const idComparison = left.planTemplate.id.localeCompare(
        right.planTemplate.id,
        undefined,
        {
          sensitivity: 'base',
        },
      );

      if (idComparison !== 0) {
        return idComparison;
      }

      return left.index - right.index;
    })
    .map(item => item.planTemplate);
}

async function fetchPlanTemplates(query: string): Promise<PlanTemplateListItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/plan-templates/list?query=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    throw new Error(LOAD_ERROR_MESSAGE);
  }

  const payload = (await response.json()) as PlanTemplatesApiResponse;
  const planTemplates = payload.planTemplates ?? payload.templates ?? [];

  return sortPlanTemplatesByName(dedupeById(planTemplates));
}

function resolveScreenState(
  planTemplates: PlanTemplateListItem[],
): PlanTemplateListViewState {
  if (planTemplates.length === 0) {
    return 'empty';
  }

  return 'default';
}

export function PlanTemplateListScreen({
  navigation,
  activeTrainingId = null,
}: PlanTemplateListScreenProps) {
  const insets = useSafeAreaInsets();
  const cacheRef = useRef<PlanTemplateListItem[] | null>(null);

  const [planTemplates, setPlanTemplates] = useState<PlanTemplateListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState(lastSearchQuery);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [screenState, setScreenState] =
    useState<PlanTemplateListViewState>('loading');
  const [loadWarningDetails, setLoadWarningDetails] = useState<string | null>(
    null,
  );
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

  useEffect(() => {
    lastSearchQuery = searchQuery;
  }, [searchQuery]);

  const loadPlanTemplates = useCallback(async (isRefresh: boolean) => {
    if (!isRefresh && cacheRef.current == null) {
      setScreenState('loading');
    }

    setLoadWarningDetails(null);

    try {
      const loadedPlanTemplates = await fetchPlanTemplates('');
      cacheRef.current = loadedPlanTemplates;
      setPlanTemplates(loadedPlanTemplates);
      setScreenState(resolveScreenState(loadedPlanTemplates));
      setLoadWarningDetails(null);
    } catch (error) {
      if (isOfflineError(error)) {
        setScreenState('offline');
        setLoadWarningDetails(null);
      } else {
        setScreenState(
          cacheRef.current ? resolveScreenState(cacheRef.current) : 'error',
        );
        setLoadWarningDetails(LOAD_ERROR_MESSAGE);
      }

      if (cacheRef.current) {
        setPlanTemplates(cacheRef.current);
      } else {
        setPlanTemplates([]);
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadPlanTemplates(false).catch(() => undefined);
  }, [loadPlanTemplates]);

  const handleRefresh = useCallback(() => {
    if (screenState === 'offline') {
      return;
    }

    setRefreshing(true);
    loadPlanTemplates(true).catch(() => undefined);
  }, [loadPlanTemplates, screenState]);

  const handleBottomNavigation = useCallback(
    (route: AppShellRoute) => {
      navigateToRoute(route);
    },
    [navigateToRoute],
  );

  const handleBack = useCallback(() => {
    if (navigation?.goBack) {
      navigation.goBack();
      return;
    }

    navigateToRoute('/settings');
  }, [navigation, navigateToRoute]);

  const handleAddPlanTemplatePress = useCallback(() => {
    navigateToRoute('/settings/plan-templates/new');
  }, [navigateToRoute]);

  const handlePlanTemplatePress = useCallback(
    (planTemplateId: string) => {
      navigateToRoute(
        `/settings/plan-templates/${encodeURIComponent(planTemplateId)}`,
      );
    },
    [navigateToRoute],
  );

  const handleSearchChange = useCallback((value: string) => {
    if (value.length > SEARCH_MAX_LENGTH) {
      setSearchError(SEARCH_LENGTH_ERROR_MESSAGE);
      return;
    }

    setSearchQuery(value);
    setSearchError(null);
  }, []);

  const handleOfflineInfoPress = useCallback(() => {
    const statusMessage =
      screenState === 'offline'
        ? OFFLINE_MESSAGE
        : loadWarningDetails ?? OFFLINE_MESSAGE;

    Alert.alert(statusMessage);
  }, [loadWarningDetails, screenState]);

  const normalizedSearchQuery = useMemo(
    () => normalizeForSearch(searchQuery),
    [searchQuery],
  );

  const visiblePlanTemplates = useMemo(() => {
    if (!normalizedSearchQuery) {
      return planTemplates;
    }

    return planTemplates.filter(planTemplate =>
      normalizeForSearch(planTemplate.name).includes(normalizedSearchQuery),
    );
  }, [planTemplates, normalizedSearchQuery]);

  const isHardLoading =
    screenState === 'loading' && cacheRef.current == null && planTemplates.length === 0;
  const showNoMatches =
    normalizedSearchQuery.length > 0 &&
    planTemplates.length > 0 &&
    visiblePlanTemplates.length === 0;
  const showNoTemplates = planTemplates.length === 0;

  const contentBottomPadding = useMemo(
    () => BOTTOM_MENU_HEIGHT + insets.bottom + 24,
    [insets.bottom],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container} testID="screen.planTemplates.list">
        <GlobalHeader
          title="Plans Templates"
          leftAction={{
            label: 'Back',
            onPress: handleBack,
          }}
          statusIndicator={
            screenState === 'offline' || loadWarningDetails
              ? {
                  accessibilityLabel: 'No internet connection details',
                  onPress: handleOfflineInfoPress,
                }
              : undefined
          }
        />

        <ScrollView
          testID="scroll.planTemplates.list"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: contentBottomPadding },
          ]}
          refreshControl={
            screenState !== 'offline' ? (
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            ) : undefined
          }>
          {screenState === 'error' && loadWarningDetails ? (
            <StatusBanner tone="error" message={loadWarningDetails} />
          ) : null}

          <View style={styles.controlsSection}>
            <View style={styles.searchRow}>
              <View style={styles.searchInputContainer}>
                <TextInput
                  testID="input.planTemplates.search"
                  accessibilityLabel="Search plan templates"
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isHardLoading}
                  onChangeText={handleSearchChange}
                  placeholder={SEARCH_PLACEHOLDER}
                  style={styles.searchInput}
                  value={searchQuery}
                />
              </View>

              <Pressable
                testID="button.planTemplates.add"
                accessibilityLabel="Add plan template"
                accessibilityRole="button"
                disabled={isHardLoading}
                onPress={handleAddPlanTemplatePress}
                style={({ pressed }) => [
                  styles.addButton,
                  isHardLoading && styles.buttonDisabled,
                  pressed && !isHardLoading && styles.addButtonPressed,
                ]}>
                <Text style={styles.addButtonText}>+</Text>
              </Pressable>
            </View>

            {searchError ? (
              <Text style={styles.searchErrorText} testID="text.planTemplates.searchError">
                {searchError}
              </Text>
            ) : null}
          </View>

          <View style={styles.listSection}>
            {isHardLoading ? (
              <LoadingSkeleton rows={5} rowHeight={44} />
            ) : visiblePlanTemplates.length > 0 ? (
              <View style={styles.listContainer} testID="list.planTemplates">
                {visiblePlanTemplates.map(planTemplate => (
                  <Pressable
                    key={planTemplate.id}
                    testID={`item.planTemplate.${planTemplate.id}`}
                    accessibilityRole="button"
                    onPress={() => handlePlanTemplatePress(planTemplate.id)}
                    style={({ pressed }) => [
                      styles.listRow,
                      pressed && styles.listRowPressed,
                    ]}>
                    <Text
                      numberOfLines={1}
                      style={styles.planTemplateName}
                      accessibilityLabel={planTemplate.name}>
                      {planTemplate.name}
                    </Text>
                    <Text style={styles.listChevron}>›</Text>
                  </Pressable>
                ))}
              </View>
            ) : showNoMatches ? (
              <Text style={styles.emptyText} testID="text.planTemplates.empty.noMatches">
                {EMPTY_SEARCH_MESSAGE}
              </Text>
            ) : showNoTemplates ? (
              <Text style={styles.emptyText} testID="text.planTemplates.empty.noTemplates">
                {EMPTY_TEMPLATES_MESSAGE}
              </Text>
            ) : null}
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
  addButton: {
    flex: 15,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addButtonPressed: {
    backgroundColor: '#1E40AF',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 22,
  },
  searchInput: {
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
  listRow: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4EAF1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#FAFCFF',
  },
  listRowPressed: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  planTemplateName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  listChevron: {
    fontSize: 22,
    lineHeight: 22,
    color: '#64748B',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchErrorText: {
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
