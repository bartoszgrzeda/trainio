import { dismissIosOkAlertIfVisible, uniqueSuffix } from './device.helper';
import { BottomMenuScreen } from '../screens/bottom-menu.screen';
import { ExerciseListScreen } from '../screens/exercise-list.screen';
import { ExerciseNewScreen } from '../screens/exercise-new.screen';
import { SettingsScreen } from '../screens/settings.screen';

type ExerciseSeedOptions = {
  bottomMenu: BottomMenuScreen;
  settings: SettingsScreen;
  exercisesList: ExerciseListScreen;
  exerciseNew: ExerciseNewScreen;
};

export async function createExerciseForPlanTemplates(
  options: ExerciseSeedOptions,
): Promise<void> {
  const { bottomMenu, settings, exercisesList, exerciseNew } = options;
  const exerciseName = `E2E Exercise ${uniqueSuffix()}`;

  await bottomMenu.openSettings();
  await settings.waitForVisible();
  await settings.openExercises();

  await exercisesList.waitForVisible();
  await exercisesList.openAddExercise();

  await exerciseNew.waitForVisible();
  await exerciseNew.fillAndSave(exerciseName);
  await dismissIosOkAlertIfVisible();

  await exercisesList.waitForVisible(30000);
  await exercisesList.expectExerciseVisible(exerciseName);
}
