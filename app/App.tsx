import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClientListScreen } from './src/screens/ClientListScreen';
import { ClientNewScreen } from './src/screens/ClientNewScreen';
import { ClientScreen } from './src/screens/ClientScreen';
import { ExerciseScreen } from './src/screens/ExerciseScreen';
import { ExerciseNewScreen } from './src/screens/ExerciseNewScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { PlanTemplateListScreen } from './src/screens/PlanTemplateListScreen';
import { PlanTemplateNewScreen } from './src/screens/PlanTemplateNewScreen';
import { PlanTemplateScreen } from './src/screens/PlanTemplateScreen';
import { SettingsExercisesScreen } from './src/screens/SettingsExercisesScreen';
import { SettingsProfileScreen } from './src/screens/SettingsProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type StaticAppRoute =
  | '/home'
  | '/training'
  | '/training/start'
  | '/training/finish'
  | '/trainings/new'
  | '/clients'
  | '/clients/new'
  | '/settings'
  | '/settings/profile'
  | '/settings/exercises'
  | '/settings/exercises/new'
  | '/settings/plan-templates'
  | '/settings/plan-templates/new';

type ExerciseDetailsRoute = `/settings/exercises/${string}`;
type ClientDetailsRoute = `/clients/${string}`;
type PlanTemplateDetailsRoute = `/settings/plan-templates/${string}`;

type AppRoute =
  | StaticAppRoute
  | ExerciseDetailsRoute
  | ClientDetailsRoute
  | PlanTemplateDetailsRoute;

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

function normalizePlanTemplateDetailsRoute(route: string): PlanTemplateDetailsRoute | null {
  const match = route.match(/^\/settings\/plan-templates\/([^/]+)$/);
  if (!match) {
    return null;
  }

  const decodedPlanTemplateId = decodeURIComponent(match[1] ?? '');
  const normalizedPlanTemplateId = decodedPlanTemplateId.trim();
  if (!normalizedPlanTemplateId || normalizedPlanTemplateId.toLowerCase() === 'new') {
    return null;
  }

  return `/settings/plan-templates/${encodeURIComponent(normalizedPlanTemplateId)}`;
}

function normalizeRoute(route: string): AppRoute | null {
  if (route === '/home') {
    return '/home';
  }

  if (route === '/training') {
    return '/training';
  }

  if (route === '/training/start') {
    return '/training/start';
  }

  if (route === '/training/finish') {
    return '/training/finish';
  }

  if (route === '/trainings/new') {
    return '/trainings/new';
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

  if (
    route === '/settings/plan-templates' ||
    route === 'plan-template-list'
  ) {
    return '/settings/plan-templates';
  }

  if (route === '/settings/plan-templates/new') {
    return '/settings/plan-templates/new';
  }

  const planTemplateDetailsRoute = normalizePlanTemplateDetailsRoute(route);
  if (planTemplateDetailsRoute) {
    return planTemplateDetailsRoute;
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

interface RoutePlaceholderScreenProps {
  testID: string;
  title: string;
  onBack: () => void;
}

function RoutePlaceholderScreen({
  testID,
  title,
  onBack,
}: RoutePlaceholderScreenProps) {
  return (
    <View style={styles.placeholderContainer} testID={testID}>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        style={({ pressed }) => [
          styles.placeholderBackButton,
          pressed && styles.placeholderBackButtonPressed,
        ]}>
        <Text style={styles.placeholderBackButtonText}>Back</Text>
      </Pressable>
    </View>
  );
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
  const planTemplateDetailsRouteMatch = currentRoute.match(/^\/settings\/plan-templates\/([^/]+)$/);
  const planTemplateIdFromRoute =
    planTemplateDetailsRouteMatch &&
    currentRoute !== '/settings/plan-templates/new'
      ? decodeURIComponent(planTemplateDetailsRouteMatch[1] ?? '')
      : null;

  const renderCurrentScreen = () => {
    if (currentRoute === '/trainings/new') {
      return (
        <RoutePlaceholderScreen
          testID="screen.trainings.new"
          title="Training Creation"
          onBack={goBack}
        />
      );
    }

    if (currentRoute === '/training/start') {
      return (
        <RoutePlaceholderScreen
          testID="screen.training.start"
          title="Training Start"
          onBack={goBack}
        />
      );
    }

    if (currentRoute === '/training') {
      return (
        <RoutePlaceholderScreen
          testID="screen.training.inProgress"
          title="Training In Progress"
          onBack={goBack}
        />
      );
    }

    if (currentRoute === '/training/finish') {
      return (
        <RoutePlaceholderScreen
          testID="screen.training.finish"
          title="Finish Training"
          onBack={goBack}
        />
      );
    }

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

    if (currentRoute === '/settings/plan-templates') {
      return <PlanTemplateListScreen navigation={navigation} />;
    }

    if (currentRoute === '/settings/plan-templates/new') {
      return <PlanTemplateNewScreen navigation={navigation} />;
    }

    if (planTemplateIdFromRoute) {
      return (
        <PlanTemplateScreen
          navigation={navigation}
          planTemplateId={planTemplateIdFromRoute}
        />
      );
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
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
    backgroundColor: '#F5F7FA',
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  placeholderBackButton: {
    minHeight: 44,
    minWidth: 120,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  placeholderBackButtonPressed: {
    backgroundColor: '#1E40AF',
  },
  placeholderBackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default App;
