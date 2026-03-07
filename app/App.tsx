import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClientListScreen } from './src/screens/ClientListScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsProfileScreen } from './src/screens/SettingsProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type AppRoute = '/home' | '/clients' | '/settings' | '/settings/profile';

function normalizeRoute(route: string): AppRoute | null {
  if (route === '/home') {
    return '/home';
  }

  if (route === '/settings') {
    return '/settings';
  }

  if (route === '/clients') {
    return '/clients';
  }

  if (route === '/settings/profile' || route === 'settings-profile') {
    return '/settings/profile';
  }

  return null;
}

function App() {
  const [routeStack, setRouteStack] = useState<AppRoute[]>(['/home']);

  const navigate = useCallback((route: string) => {
    const nextRoute = normalizeRoute(route);

    if (!nextRoute) {
      Alert.alert('Navigation placeholder', `Navigate to ${route}`);
      return;
    }

    setRouteStack(previousStack => {
      const currentRoute = previousStack[previousStack.length - 1];
      if (currentRoute === nextRoute) {
        return previousStack;
      }

      return [...previousStack, nextRoute];
    });
  }, []);

  const replace = useCallback((route: string) => {
    const nextRoute = normalizeRoute(route);

    if (!nextRoute) {
      Alert.alert('Navigation placeholder', `Navigate to ${route}`);
      return;
    }

    setRouteStack(previousStack => {
      if (previousStack.length === 0) {
        return [nextRoute];
      }

      const updatedStack = [...previousStack];
      updatedStack[updatedStack.length - 1] = nextRoute;
      return updatedStack;
    });
  }, []);

  const goBack = useCallback(() => {
    setRouteStack(previousStack => {
      if (previousStack.length <= 1) {
        return previousStack;
      }

      return previousStack.slice(0, -1);
    });
  }, []);

  const navigation = useMemo(
    () => ({
      navigate,
      replace,
      goBack,
    }),
    [goBack, navigate, replace],
  );

  const currentRoute = routeStack[routeStack.length - 1] ?? '/home';

  const renderCurrentScreen = () => {
    if (currentRoute === '/clients') {
      return <ClientListScreen navigation={navigation} />;
    }

    if (currentRoute === '/settings') {
      return <SettingsScreen navigation={navigation} />;
    }

    if (currentRoute === '/settings/profile') {
      return <SettingsProfileScreen navigation={navigation} />;
    }

    return <HomeScreen navigation={navigation} />;
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {renderCurrentScreen()}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
});

export default App;
