import { device } from 'detox';
import { BottomMenuScreen } from '../screens/bottom-menu.screen';
import { SettingsProfileScreen } from '../screens/settings-profile.screen';
import { SettingsScreen } from '../screens/settings.screen';

describe('profile.settings', () => {
  const bottomMenu = new BottomMenuScreen();
  const settings = new SettingsScreen();
  const profile = new SettingsProfileScreen();

  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('opens profile settings and shows email validation feedback', async () => {
    await bottomMenu.openSettings();
    await settings.waitForVisible();
    await settings.openProfile();

    await profile.waitForVisible();
    await profile.replaceEmail('invalid-email');
    await profile.blurEmail();
    await profile.expectEmailValidationError();

    await bottomMenu.openSettings();
    await settings.waitForVisible();
  });
});
