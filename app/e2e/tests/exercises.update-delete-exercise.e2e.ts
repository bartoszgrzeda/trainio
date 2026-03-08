import { device } from 'detox';
import {
  dismissIosOkAlertIfVisible,
  tapIosAlertButtonIfVisible,
  uniqueSuffix,
} from '../helpers/device.helper';
import { BottomMenuScreen } from '../screens/bottom-menu.screen';
import { ExerciseDetailScreen } from '../screens/exercise-detail.screen';
import { ExerciseListScreen } from '../screens/exercise-list.screen';
import { ExerciseNewScreen } from '../screens/exercise-new.screen';
import { SettingsScreen } from '../screens/settings.screen';

describe('exercises.update-delete-exercise', () => {
  const bottomMenu = new BottomMenuScreen();
  const settings = new SettingsScreen();
  const exercisesList = new ExerciseListScreen();
  const exerciseNew = new ExerciseNewScreen();
  const exerciseDetail = new ExerciseDetailScreen();

  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('updates and deletes a custom exercise from details screen', async () => {
    const initialName = `E2E Exercise ${uniqueSuffix()}`;
    const updatedName = `${initialName} Updated`;

    await bottomMenu.openSettings();
    await settings.waitForVisible();
    await settings.openExercises();

    await exercisesList.waitForVisible();
    await exercisesList.openAddExercise();

    await exerciseNew.waitForVisible();
    await exerciseNew.fillAndSave(initialName);
    await dismissIosOkAlertIfVisible();

    await exercisesList.waitForVisible(30000);
    await exercisesList.expectExerciseVisible(initialName);
    await exercisesList.openExerciseByName(initialName);

    await exerciseDetail.waitForVisible();
    await exerciseDetail.updateNameAndSave(updatedName);
    await dismissIosOkAlertIfVisible();
    await exercisesList.waitForVisible(30000);
    await exercisesList.expectExerciseVisible(updatedName);
    await exercisesList.openExerciseByName(updatedName);

    await exerciseDetail.waitForVisible();
    await exerciseDetail.deleteExercise();
    await tapIosAlertButtonIfVisible('Delete');
    await dismissIosOkAlertIfVisible();

    await exercisesList.waitForVisible(30000);
    await exercisesList.expectExerciseNotVisible(updatedName);
  });
});
