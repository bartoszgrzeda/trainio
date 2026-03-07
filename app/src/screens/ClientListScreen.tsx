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

type ClientListViewState = 'loading' | 'default' | 'empty' | 'error' | 'offline';

interface ClientListItem {
  id: string;
  fullName: string;
}

interface ClientsApiResponse {
  clients: ClientListItem[];
}

interface NavigationLike {
  navigate: (route: string) => void;
}

interface ClientListScreenProps {
  navigation?: NavigationLike;
  activeTrainingId?: string | null;
}

const API_BASE_URL = 'http://localhost:3000';
const LOAD_ERROR_MESSAGE = 'Could not load clients. Try again.';
const OFFLINE_MESSAGE = 'No internet connection';
const SEARCH_PLACEHOLDER = 'Search clients';
const SEARCH_MAX_LENGTH = 80;
const EMPTY_CLIENTS_MESSAGE = 'No clients yet. Add your first client.';
const EMPTY_SEARCH_MESSAGE = 'No clients found.';

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

function sortClientsByFullName(clients: ClientListItem[]): ClientListItem[] {
  return [...clients].sort((left, right) =>
    left.fullName.localeCompare(right.fullName, undefined, {
      sensitivity: 'base',
    }),
  );
}

async function fetchClients(query: string): Promise<ClientListItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/clients?query=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    throw new Error(LOAD_ERROR_MESSAGE);
  }

  const payload = (await response.json()) as ClientsApiResponse;
  return sortClientsByFullName(payload.clients ?? []);
}

function resolveScreenState(clients: ClientListItem[]): ClientListViewState {
  if (clients.length === 0) {
    return 'empty';
  }

  return 'default';
}

function clampSearchValue(value: string): string {
  if (value.length <= SEARCH_MAX_LENGTH) {
    return value;
  }

  return value.slice(0, SEARCH_MAX_LENGTH);
}

export function ClientListScreen({
  navigation,
  activeTrainingId = null,
}: ClientListScreenProps) {
  const insets = useSafeAreaInsets();
  const cacheRef = useRef<ClientListItem[] | null>(null);

  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState(lastSearchQuery);
  const [screenState, setScreenState] = useState<ClientListViewState>('loading');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
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

  const loadClients = useCallback(async (isRefresh: boolean) => {
    if (!isRefresh && cacheRef.current == null) {
      setScreenState('loading');
    }

    setBannerMessage(null);

    try {
      const loadedClients = await fetchClients('');
      cacheRef.current = loadedClients;
      setClients(loadedClients);
      setScreenState(resolveScreenState(loadedClients));
    } catch (error) {
      if (isOfflineError(error)) {
        setScreenState('offline');
        setBannerMessage(OFFLINE_MESSAGE);
      } else {
        setScreenState(cacheRef.current ? resolveScreenState(cacheRef.current) : 'error');
        setBannerMessage(LOAD_ERROR_MESSAGE);
      }

      if (cacheRef.current) {
        setClients(cacheRef.current);
      } else {
        setClients([]);
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadClients(false).catch(() => undefined);
  }, [loadClients]);

  const handleRefresh = useCallback(() => {
    if (screenState === 'offline') {
      return;
    }

    setRefreshing(true);
    loadClients(true).catch(() => undefined);
  }, [loadClients, screenState]);

  const handleBottomNavigation = useCallback(
    (route: AppShellRoute) => {
      if (route === '/clients') {
        return;
      }

      navigateToRoute(route);
    },
    [navigateToRoute],
  );

  const handleAddClientPress = useCallback(() => {
    navigateToRoute('/clients/new');
  }, [navigateToRoute]);

  const handleClientPress = useCallback(
    (clientId: string) => {
      navigateToRoute(`/clients/${clientId}`);
    },
    [navigateToRoute],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(clampSearchValue(value));
  }, []);

  const normalizedSearchQuery = useMemo(
    () => normalizeForSearch(searchQuery),
    [searchQuery],
  );

  const visibleClients = useMemo(() => {
    if (!normalizedSearchQuery) {
      return clients;
    }

    return clients.filter(client =>
      normalizeForSearch(client.fullName).includes(normalizedSearchQuery),
    );
  }, [clients, normalizedSearchQuery]);

  const showNoMatches =
    normalizedSearchQuery.length > 0 &&
    clients.length > 0 &&
    visibleClients.length === 0;
  const showNoClients = clients.length === 0;
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
        <GlobalHeader title="Clients" />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: contentBottomPadding },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              enabled={screenState !== 'offline'}
            />
          }>
          {bannerMessage && screenState !== 'offline' ? (
            <StatusBanner tone="error" message={bannerMessage} />
          ) : null}

          <View style={styles.section}>
            <View style={styles.searchRow}>
              <TextInput
                accessibilityLabel="Search clients"
                autoCapitalize="words"
                autoCorrect={false}
                onChangeText={handleSearchChange}
                placeholder={SEARCH_PLACEHOLDER}
                style={styles.searchInput}
                value={searchQuery}
              />
              <Pressable
                accessibilityLabel="Add client"
                accessibilityRole="button"
                disabled={screenState === 'loading'}
                onPress={handleAddClientPress}
                style={({ pressed }) => [
                  styles.addButton,
                  screenState === 'loading' && styles.buttonDisabled,
                  pressed &&
                    screenState !== 'loading' &&
                    styles.addButtonPressed,
                ]}>
                <Text style={styles.addButtonText}>+</Text>
              </Pressable>
            </View>

            {screenState === 'loading' && cacheRef.current == null ? (
              <LoadingSkeleton rows={5} rowHeight={44} />
            ) : visibleClients.length > 0 ? (
              <View style={styles.listContainer}>
                {visibleClients.map(client => (
                  <Pressable
                    key={client.id}
                    accessibilityRole="button"
                    onPress={() => handleClientPress(client.id)}
                    style={({ pressed }) => [
                      styles.listRow,
                      pressed && styles.listRowPressed,
                    ]}>
                    <Text
                      numberOfLines={1}
                      style={styles.clientName}
                      accessibilityLabel={client.fullName}>
                      {client.fullName}
                    </Text>
                    <Text style={styles.listChevron}>›</Text>
                  </Pressable>
                ))}
              </View>
            ) : showNoMatches ? (
              <Text style={styles.emptyText}>{EMPTY_SEARCH_MESSAGE}</Text>
            ) : showNoClients ? (
              <Text style={styles.emptyText}>{EMPTY_CLIENTS_MESSAGE}</Text>
            ) : null}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    flex: 85,
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
  clientName: {
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
  buttonDisabled: {
    opacity: 0.45,
  },
  fixedOfflineBanner: {
    position: 'absolute',
    right: 16,
    left: 16,
    zIndex: 6,
  },
});
