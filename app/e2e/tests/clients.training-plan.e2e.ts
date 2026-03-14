import { device } from 'detox';
import {
  dismissIosOkAlertIfVisible,
  uniqueSuffix,
} from '../helpers/device.helper';
import { createExerciseForPlanTemplates } from '../helpers/exercise.helper';
import { BottomMenuScreen } from '../screens/bottom-menu.screen';
import { ClientDetailScreen } from '../screens/client-detail.screen';
import { ClientListScreen } from '../screens/client-list.screen';
import { ClientNewScreen } from '../screens/client-new.screen';
import { ClientTrainingPlanScreen } from '../screens/client-training-plan.screen';
import { ExerciseListScreen } from '../screens/exercise-list.screen';
import { ExerciseNewScreen } from '../screens/exercise-new.screen';
import { PlanTemplateListScreen } from '../screens/plan-template-list.screen';
import { PlanTemplateNewScreen } from '../screens/plan-template-new.screen';
import { SettingsScreen } from '../screens/settings.screen';

describe('clients.training-plan', () => {
  const bottomMenu = new BottomMenuScreen();
  const settings = new SettingsScreen();
  const exercisesList = new ExerciseListScreen();
  const exerciseNew = new ExerciseNewScreen();
  const planTemplateList = new PlanTemplateListScreen();
  const planTemplateNew = new PlanTemplateNewScreen();
  const clientList = new ClientListScreen();
  const clientNew = new ClientNewScreen();
  const clientDetail = new ClientDetailScreen();
  const clientTrainingPlan = new ClientTrainingPlanScreen();

  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('copies selected template into client training plan and saves it', async () => {
    const suffix = uniqueSuffix().replace('-', '');
    const templateName = `Default Plan ${suffix.slice(-6)}`;
    const firstName = `Plan${suffix.slice(-5)}`;
    const lastName = `Client${suffix.slice(0, 5)}`;
    const fullName = `${firstName} ${lastName}`;

    await createExerciseForPlanTemplates({
      bottomMenu,
      settings,
      exercisesList,
      exerciseNew,
    });

    await bottomMenu.openSettings();
    await settings.waitForVisible();
    await settings.openPlanTemplates();

    await planTemplateList.waitForVisible();
    await planTemplateList.openAddPlanTemplate();

    await planTemplateNew.waitForVisible();
    await planTemplateNew.fillAndSave(templateName);
    await dismissIosOkAlertIfVisible();

    await bottomMenu.openClients();
    await clientList.waitForVisible();
    await clientList.openAddClient();

    await clientNew.waitForVisible();
    await clientNew.fillAndSave({
      firstName,
      lastName,
      birthDate: '1994-09-18',
      phoneNumber: '48123123999',
      gender: 'female',
    });
    await dismissIosOkAlertIfVisible();

    await clientList.waitForVisible();
    await clientList.expectClientVisible(fullName);
    await clientList.openClientByName(fullName);

    await clientDetail.waitForVisible();
    await clientDetail.openClientTrainingPlan();

    await clientTrainingPlan.waitForVisible();
    await clientTrainingPlan.copyFromTemplate(templateName);
    await dismissIosOkAlertIfVisible();
    await clientTrainingPlan.waitForName(templateName);

    await clientTrainingPlan.save();
    await dismissIosOkAlertIfVisible();

    await bottomMenu.openClients();
    await clientList.waitForVisible();
    await clientList.openClientByName(fullName);

    await clientDetail.waitForVisible();
    await clientDetail.openClientTrainingPlan();

    await clientTrainingPlan.waitForVisible();
    await clientTrainingPlan.waitForName(templateName);
  });
});
