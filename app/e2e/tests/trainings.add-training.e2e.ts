import { device } from 'detox';
import { dismissIosOkAlertIfVisible, uniqueSuffix } from '../helpers/device.helper';
import { BottomMenuScreen } from '../screens/bottom-menu.screen';
import { ClientListScreen } from '../screens/client-list.screen';
import { ClientNewScreen } from '../screens/client-new.screen';
import { HomeScreen } from '../screens/home.screen';
import { TrainingNewScreen } from '../screens/training-new.screen';

function formatDateTimeForPicker(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  const hours = `${value.getHours()}`.padStart(2, '0');
  const minutes = `${value.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

describe('trainings.add-training', () => {
  const bottomMenu = new BottomMenuScreen();
  const clientList = new ClientListScreen();
  const clientNew = new ClientNewScreen();
  const home = new HomeScreen();
  const trainingNew = new TrainingNewScreen();

  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('creates a planned training from the new training form and returns home', async () => {
    const suffix = uniqueSuffix().replace('-', '');
    const firstName = `Train${suffix.slice(-6)}`;
    const lastName = `Client${suffix.slice(0, 6)}`;

    await bottomMenu.openClients();
    await clientList.waitForVisible();
    await clientList.openAddClient();

    await clientNew.waitForVisible();
    await clientNew.fillAndSave({
      firstName,
      lastName,
      birthDate: '1993-04-21',
      phoneNumber: '48123456789',
      gender: 'female',
    });
    await dismissIosOkAlertIfVisible();

    const startAt = new Date();
    startAt.setDate(startAt.getDate() + 10);
    startAt.setHours(11, 0, 0, 0);
    const endAt = new Date(startAt);
    endAt.setHours(12, 0, 0, 0);

    await bottomMenu.openHome();
    await home.waitForVisible();
    await home.openAddTraining();

    await trainingNew.waitForVisible();
    await trainingNew.fillAndSave({
      startDateTime: formatDateTimeForPicker(startAt),
      endDateTime: formatDateTimeForPicker(endAt),
      notes: `E2E training ${suffix}`,
    });
    await trainingNew.confirmWarningsIfVisible();
    await dismissIosOkAlertIfVisible();

    await home.waitForVisible();
  });
});
