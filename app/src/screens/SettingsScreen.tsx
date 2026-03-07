import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
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
import { StatusBanner, StatusBannerTone } from '../components/shell/StatusBanner';

type SettingsViewState =
  | 'default'
  | 'loading'
  | 'empty'
  | 'error'
  | 'offline'
  | 'disabled';

type SettingsMenuId = 'profile' | 'exercises' | 'subscription';

interface SettingsMenuItem {
  id: SettingsMenuId;
  label: string;
  targetView: 'settings-profile' | 'settings-exercises' | 'settings-subscription';
}

interface NavigationLike {
  navigate: (route: string) => void;
  replace?: (route: string) => void;
}

interface SettingsScreenProps {
  navigation?: NavigationLike;
  activeTrainingId?: string | null;
}

interface BannerState {
  tone: StatusBannerTone;
  message: string;
}

const API_BASE_URL = 'http://localhost:3000';
const SIGN_OUT_ERROR_MESSAGE = 'Could not sign out. Try again.';
const OFFLINE_SIGN_OUT_MESSAGE =
  'You are offline. Connect to the internet to sign out.';
const ROUTE_UNAVAILABLE_MESSAGE =
  'This settings section is temporarily unavailable.';
const MENU_FALLBACK_MESSAGE = 'Using default settings menu configuration.';

const DEFAULT_MENU_ITEMS: SettingsMenuItem[] = [
  { id: 'profile', label: 'Profile', targetView: 'settings-profile' },
  {
    id: 'exercises',
    label: 'Exercises',
    targetView: 'settings-exercises',
  },
  {
    id: 'subscription',
    label: 'Subscription',
    targetView: 'settings-subscription',
  },
];

function isOfflineError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return /offline|internet|network/i.test(error.message);
}

async function loadMenuItems(): Promise<SettingsMenuItem[]> {
  return Promise.resolve(DEFAULT_MENU_ITEMS);
}

async function signOutRequest(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/sign-out`, {
    method: 'POST',
  });

  if (response.ok) {
    return;
  }

  if (response.status === 401 || response.status === 403) {
    return;
  }

  throw new Error(SIGN_OUT_ERROR_MESSAGE);
}

async function clearLocalAuthSession(): Promise<void> {
  // Placeholder for token/session cleanup wiring.
  return Promise.resolve();
}

export function SettingsScreen({
  navigation,
  activeTrainingId = null,
}: SettingsScreenProps) {
  const insets = useSafeAreaInsets();

  const [menuItems, setMenuItems] =
    useState<SettingsMenuItem[]>(DEFAULT_MENU_ITEMS);
  const [screenState, setScreenState] = useState<SettingsViewState>('default');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [bannerState, setBannerState] = useState<BannerState | null>(null);

  useEffect(() => {
    const loadMenuConfiguration = async () => {
      try {
        const loadedItems = await loadMenuItems();
        setMenuItems(loadedItems);
      } catch {
        setMenuItems(DEFAULT_MENU_ITEMS);
        setScreenState('empty');
      }
    };

    loadMenuConfiguration().catch(() => undefined);
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

  const handleBottomNavigation = useCallback(
    (route: AppShellRoute) => {
      navigateToRoute(route);
    },
    [navigateToRoute],
  );

  const handleMenuNavigation = useCallback(
    (targetView: SettingsMenuItem['targetView']) => {
      setBannerState(null);

      try {
        navigateToRoute(targetView);
      } catch {
        setBannerState({
          tone: 'error',
          message: ROUTE_UNAVAILABLE_MESSAGE,
        });
      }
    },
    [navigateToRoute],
  );

  const handleSignOut = useCallback(async () => {
    if (isSigningOut) {
      return;
    }

    if (screenState === 'offline') {
      setBannerState({
        tone: 'offline',
        message: OFFLINE_SIGN_OUT_MESSAGE,
      });
      return;
    }

    setIsSigningOut(true);
    setScreenState('loading');
    setBannerState(null);

    try {
      await signOutRequest();
      await clearLocalAuthSession();

      if (navigation?.replace) {
        navigation.replace('/auth/login');
      } else {
        navigateToRoute('/auth/login');
      }
    } catch (error) {
      if (isOfflineError(error)) {
        setScreenState('offline');
        setBannerState({
          tone: 'offline',
          message: OFFLINE_SIGN_OUT_MESSAGE,
        });
      } else {
        setScreenState('error');
        setBannerState({
          tone: 'error',
          message: SIGN_OUT_ERROR_MESSAGE,
        });
      }
    } finally {
      setIsSigningOut(false);
      setScreenState(previousState =>
        previousState === 'loading' ? 'default' : previousState,
      );
    }
  }, [isSigningOut, navigation, navigateToRoute, screenState]);

  const handleSignOutPress = useCallback(() => {
    handleSignOut().catch(() => undefined);
  }, [handleSignOut]);

  const signOutBottomPadding = useMemo(
    () => BOTTOM_MENU_HEIGHT + insets.bottom + 12,
    [insets.bottom],
  );

  const isSignOutDisabled =
    screenState === 'offline' || screenState === 'disabled' || isSigningOut;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        <GlobalHeader title="Settings" />

        <View style={styles.content}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}>
            {bannerState ? (
              <StatusBanner tone={bannerState.tone} message={bannerState.message} />
            ) : null}

            {screenState === 'empty' ? (
              <StatusBanner tone="info" message={MENU_FALLBACK_MESSAGE} />
            ) : null}

            <View style={styles.actionsList}>
              {menuItems.map(item => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => handleMenuNavigation(item.targetView)}
                  style={({ pressed }) => [
                    styles.menuRow,
                    pressed && styles.menuRowPressed,
                  ]}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuChevron}>›</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View
            style={[
              styles.signOutSection,
              { paddingBottom: signOutBottomPadding },
            ]}>
            <Pressable
              accessibilityRole="button"
              disabled={isSignOutDisabled}
              onPress={handleSignOutPress}
              style={({ pressed }) => [
                styles.signOutButton,
                isSignOutDisabled && styles.buttonDisabled,
                pressed && !isSignOutDisabled && styles.signOutButtonPressed,
              ]}>
              <Text style={styles.signOutButtonText}>
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </Text>
              {isSigningOut ? (
                <ActivityIndicator color="#B91C1C" size="small" />
              ) : null}
            </Pressable>

            {screenState === 'offline' ? (
              <Text style={styles.helperText}>{OFFLINE_SIGN_OUT_MESSAGE}</Text>
            ) : null}
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
    paddingBottom: 16,
    gap: 16,
  },
  actionsList: {
    gap: 12,
  },
  signOutSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
    backgroundColor: '#F5F7FA',
  },
  menuRow: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#D8E1EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFCFF',
  },
  menuRowPressed: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  menuLabel: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  menuChevron: {
    fontSize: 22,
    color: '#64748B',
    lineHeight: 22,
  },
  signOutButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutButtonPressed: {
    backgroundColor: '#FECACA',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B91C1C',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  helperText: {
    fontSize: 13,
    color: '#7C2D12',
  },
});
