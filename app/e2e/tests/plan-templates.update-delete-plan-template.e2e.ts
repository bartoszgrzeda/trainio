import { device } from 'detox';
import {
  dismissIosOkAlertIfVisible,
  tapIosAlertButtonIfVisible,
  uniqueSuffix,
} from '../helpers/device.helper';
import { BottomMenuScreen } from '../screens/bottom-menu.screen';
import { PlanTemplateDetailScreen } from '../screens/plan-template-detail.screen';
import { PlanTemplateListScreen } from '../screens/plan-template-list.screen';
import { PlanTemplateNewScreen } from '../screens/plan-template-new.screen';
import { SettingsScreen } from '../screens/settings.screen';

describe('plan-templates.update-delete-plan-template', () => {
  const bottomMenu = new BottomMenuScreen();
  const settings = new SettingsScreen();
  const planTemplateList = new PlanTemplateListScreen();
  const planTemplateNew = new PlanTemplateNewScreen();
  const planTemplateDetail = new PlanTemplateDetailScreen();

  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('updates and deletes a plan template from details screen', async () => {
    const initialName = `E2E Plan Template ${uniqueSuffix()}`;
    const updatedName = `${initialName} Updated`;

    await bottomMenu.openSettings();
    await settings.waitForVisible();
    await settings.openPlanTemplates();

    await planTemplateList.waitForVisible();
    await planTemplateList.openAddPlanTemplate();

    await planTemplateNew.waitForVisible();
    await planTemplateNew.fillAndSave(initialName);
    await dismissIosOkAlertIfVisible();

    await bottomMenu.openSettings();
    await settings.waitForVisible();
    await settings.openPlanTemplates();

    await planTemplateList.waitForVisible();
    await planTemplateList.expectPlanTemplateVisible(initialName);
    await planTemplateList.openPlanTemplateByName(initialName);

    await planTemplateDetail.waitForVisible();
    await planTemplateDetail.updateNameAndSave(updatedName);
    await dismissIosOkAlertIfVisible();

    await bottomMenu.openSettings();
    await settings.waitForVisible();
    await settings.openPlanTemplates();

    await planTemplateList.waitForVisible();
    await planTemplateList.expectPlanTemplateVisible(updatedName);
    await planTemplateList.openPlanTemplateByName(updatedName);

    await planTemplateDetail.waitForVisible();
    await planTemplateDetail.deletePlanTemplate();
    await tapIosAlertButtonIfVisible('Delete');
    await dismissIosOkAlertIfVisible();

    await planTemplateList.waitForVisible(30000);
    await planTemplateList.expectPlanTemplateNotVisible(updatedName);
  });
});
