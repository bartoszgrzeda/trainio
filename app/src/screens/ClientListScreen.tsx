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
const SEARCH_LENGTH_ERROR_MESSAGE = 'Search can contain up to 80 characters.';
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
    `${API_BASE_URL}/api/clients/list?query=${encodeURIComponent(query)}`,
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

export function ClientListScreen({
  navigation,
  activeTrainingId = null,
}: ClientListScreenProps) {
  const insets = useSafeAreaInsets();
  const cacheRef = useRef<ClientListItem[] | null>(null);

  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState(lastSearchQuery);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [screenState, setScreenState] = useState<ClientListViewState>('loading');
  const [loadWarningDetails, setLoadWarningDetails] = useState<string | null>(null);
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

    setLoadWarningDetails(null);

    try {
      const loadedClients = await fetchClients('');
      cacheRef.current = loadedClients;
      setClients(loadedClients);
      setScreenState(resolveScreenState(loadedClients));
      setLoadWarningDetails(null);
    } catch (error) {
      if (isOfflineError(error)) {
        setScreenState('offline');
        setLoadWarningDetails(null);
      } else {
        setScreenState(cacheRef.current ? resolveScreenState(cacheRef.current) : 'error');
        setLoadWarningDetails(LOAD_ERROR_MESSAGE);
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
      navigateToRoute(route);
    },
    [navigateToRoute],
  );

  const handleAddClientPress = useCallback(() => {
    navigateToRoute('/clients/new');
  }, [navigateToRoute]);

  const handleClientPress = useCallback(
    (clientId: string) => {
      navigateToRoute(`/clients/${encodeURIComponent(clientId)}`);
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
  const contentBottomPadding = useMemo(
    () => BOTTOM_MENU_HEIGHT + insets.bottom + 24,
    [insets.bottom],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container} testID="screen.clients.list">
        <GlobalHeader
          title="Clients"
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
          testID="scroll.clients.list"
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
          {screenState === 'error' && loadWarningDetails ? (
            <StatusBanner tone="error" message={loadWarningDetails} />
          ) : null}

          <View style={styles.controlsSection}>
            <View style={styles.searchRow}>
              <View style={styles.searchInputContainer}>
                <TextInput
                  testID="input.clients.search"
                  accessibilityLabel="Search clients"
                  autoCapitalize="words"
                  autoCorrect={false}
                  onChangeText={handleSearchChange}
                  placeholder={SEARCH_PLACEHOLDER}
                  style={styles.searchInput}
                  value={searchQuery}
                />
              </View>
              <Pressable
                testID="button.clients.add"
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
            {searchError ? (
              <Text style={styles.searchErrorText} testID="text.clients.searchError">
                {searchError}
              </Text>
            ) : null}
          </View>

          <View style={styles.listSection}>
            {screenState === 'loading' && cacheRef.current == null ? (
              <LoadingSkeleton rows={5} rowHeight={44} />
            ) : visibleClients.length > 0 ? (
              <View style={styles.listContainer} testID="list.clients">
                {visibleClients.map(client => (
                  <Pressable
                    key={client.id}
                    testID={`item.client.${client.id}`}
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
              <Text style={styles.emptyText} testID="text.clients.empty.noMatches">
                {EMPTY_SEARCH_MESSAGE}
              </Text>
            ) : showNoClients ? (
              <Text style={styles.emptyText} testID="text.clients.empty.noClients">
                {EMPTY_CLIENTS_MESSAGE}
              </Text>
            ) : null}
          </View>
        </ScrollView>

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
  searchErrorText: {
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
