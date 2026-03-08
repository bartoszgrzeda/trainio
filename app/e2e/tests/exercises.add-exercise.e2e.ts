import { device } from 'detox';
import { dismissIosOkAlertIfVisible, uniqueSuffix } from '../helpers/device.helper';
import { BottomMenuScreen } from '../screens/bottom-menu.screen';
import { ExerciseListScreen } from '../screens/exercise-list.screen';
import { ExerciseNewScreen } from '../screens/exercise-new.screen';
import { SettingsScreen } from '../screens/settings.screen';

describe('exercises.add-exercise', () => {
  const bottomMenu = new BottomMenuScreen();
  const settings = new SettingsScreen();
  const exercisesList = new ExerciseListScreen();
  const exerciseNew = new ExerciseNewScreen();

  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('adds a new exercise and shows it in the exercises list', async () => {
    const exerciseName = `E2E Exercise ${uniqueSuffix()}`;

    await bottomMenu.openSettings();
    await settings.waitForVisible();
    await settings.openExercises();

    await exercisesList.waitForVisible();
    await exercisesList.openAddExercise();

    await exerciseNew.waitForVisible();
    await exerciseNew.fillAndSave(exerciseName);

    await dismissIosOkAlertIfVisible();

    await exercisesList.waitForVisible();
    await exercisesList.expectExerciseVisible(exerciseName);
  });
});
