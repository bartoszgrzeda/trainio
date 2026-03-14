import { by, device, element, waitFor } from 'detox';
import { HomeScreen } from '../screens/home.screen';

describe('home.navigation', () => {
  const home = new HomeScreen();

  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('shows home controls and navigates to add training route', async () => {
    await home.waitForVisible();
    await home.openAddTraining();

    await waitFor(element(by.id('button.trainings.client.open')))
      .toBeVisible()
      .withTimeout(15000);
    await waitFor(element(by.id('button.trainings.save')))
      .toBeVisible()
      .withTimeout(15000);
  });
});
