import { device } from 'detox';
import { dismissIosOkAlertIfVisible, uniqueSuffix } from '../helpers/device.helper';
import { BottomMenuScreen } from '../screens/bottom-menu.screen';
import { PlanTemplateListScreen } from '../screens/plan-template-list.screen';
import { PlanTemplateNewScreen } from '../screens/plan-template-new.screen';
import { SettingsScreen } from '../screens/settings.screen';

describe('plan-templates.add-plan-template', () => {
  const bottomMenu = new BottomMenuScreen();
  const settings = new SettingsScreen();
  const planTemplateList = new PlanTemplateListScreen();
  const planTemplateNew = new PlanTemplateNewScreen();

  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('adds a plan template and shows it in the list', async () => {
    const planTemplateName = `E2E Plan Template ${uniqueSuffix()}`;

    await bottomMenu.openSettings();
    await settings.waitForVisible();
    await settings.openPlanTemplates();

    await planTemplateList.waitForVisible();
    await planTemplateList.openAddPlanTemplate();

    await planTemplateNew.waitForVisible();
    await planTemplateNew.fillAndSave(planTemplateName);
    await dismissIosOkAlertIfVisible();

    await bottomMenu.openSettings();
    await settings.waitForVisible();
    await settings.openPlanTemplates();

    await planTemplateList.waitForVisible();
    await planTemplateList.expectPlanTemplateVisible(planTemplateName);
  });
});
