import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClientListScreen } from './src/screens/ClientListScreen';
import { ClientNewScreen } from './src/screens/ClientNewScreen';
import { ClientScreen } from './src/screens/ClientScreen';
import { ExerciseScreen } from './src/screens/ExerciseScreen';
import { ExerciseNewScreen } from './src/screens/ExerciseNewScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsExercisesScreen } from './src/screens/SettingsExercisesScreen';
import { SettingsProfileScreen } from './src/screens/SettingsProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type StaticAppRoute =
  | '/home'
  | '/clients'
  | '/clients/new'
  | '/settings'
  | '/settings/profile'
  | '/settings/exercises'
  | '/settings/exercises/new';

type ExerciseDetailsRoute = `/settings/exercises/${string}`;
type ClientDetailsRoute = `/clients/${string}`;

type AppRoute = StaticAppRoute | ExerciseDetailsRoute | ClientDetailsRoute;

function normalizeExerciseDetailsRoute(route: string): ExerciseDetailsRoute | null {
  const match = route.match(/^\/settings\/exercises\/([^/]+)$/);
  if (!match) {
    return null;
  }

  const decodedExerciseId = decodeURIComponent(match[1] ?? '');
  const normalizedExerciseId = decodedExerciseId.trim();
  if (!normalizedExerciseId) {
    return null;
  }

  return `/settings/exercises/${encodeURIComponent(normalizedExerciseId)}`;
}

function normalizeClientDetailsRoute(route: string): ClientDetailsRoute | null {
  const match = route.match(/^\/clients\/([^/]+)$/);
  if (!match) {
    return null;
  }

  const decodedClientId = decodeURIComponent(match[1] ?? '');
  const normalizedClientId = decodedClientId.trim();
  if (!normalizedClientId || normalizedClientId.toLowerCase() === 'new') {
    return null;
  }

  return `/clients/${encodeURIComponent(normalizedClientId)}`;
}

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

  if (route === '/clients/new') {
    return '/clients/new';
  }

  if (route === '/settings/profile' || route === 'settings-profile') {
    return '/settings/profile';
  }

  if (route === '/settings/exercises' || route === 'settings-exercises') {
    return '/settings/exercises';
  }

  if (
    route === '/settings/exercises/new' ||
    route === 'exercise-new'
  ) {
    return '/settings/exercises/new';
  }

  const clientDetailsRoute = normalizeClientDetailsRoute(route);
  if (clientDetailsRoute) {
    return clientDetailsRoute;
  }

  const exerciseDetailsRoute = normalizeExerciseDetailsRoute(route);
  if (exerciseDetailsRoute) {
    return exerciseDetailsRoute;
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

  const detailsRouteMatch = currentRoute.match(/^\/settings\/exercises\/([^/]+)$/);
  const exerciseIdFromRoute =
    detailsRouteMatch &&
    currentRoute !== '/settings/exercises/new'
      ? decodeURIComponent(detailsRouteMatch[1] ?? '')
      : null;
  const clientDetailsRouteMatch = currentRoute.match(/^\/clients\/([^/]+)$/);
  const clientIdFromRoute =
    clientDetailsRouteMatch &&
    currentRoute !== '/clients/new'
      ? decodeURIComponent(clientDetailsRouteMatch[1] ?? '')
      : null;

  const renderCurrentScreen = () => {
    if (currentRoute === '/clients/new') {
      return <ClientNewScreen navigation={navigation} />;
    }

    if (currentRoute === '/clients') {
      return <ClientListScreen navigation={navigation} />;
    }

    if (clientIdFromRoute) {
      return (
        <ClientScreen
          navigation={navigation}
          clientId={clientIdFromRoute}
        />
      );
    }

    if (currentRoute === '/settings') {
      return <SettingsScreen navigation={navigation} />;
    }

    if (currentRoute === '/settings/profile') {
      return <SettingsProfileScreen navigation={navigation} />;
    }

    if (currentRoute === '/settings/exercises') {
      return <SettingsExercisesScreen navigation={navigation} />;
    }

    if (currentRoute === '/settings/exercises/new') {
      return <ExerciseNewScreen navigation={navigation} />;
    }

    if (exerciseIdFromRoute) {
      return (
        <ExerciseScreen
          navigation={navigation}
          exerciseId={exerciseIdFromRoute}
        />
      );
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
