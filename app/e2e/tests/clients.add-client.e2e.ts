import { device } from 'detox';
import { dismissIosOkAlertIfVisible, uniqueSuffix } from '../helpers/device.helper';
import { BottomMenuScreen } from '../screens/bottom-menu.screen';
import { ClientListScreen } from '../screens/client-list.screen';
import { ClientNewScreen } from '../screens/client-new.screen';

describe('clients.add-client', () => {
  const bottomMenu = new BottomMenuScreen();
  const clientList = new ClientListScreen();
  const clientNew = new ClientNewScreen();

  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('adds a new client and shows it in the clients list', async () => {
    const suffix = uniqueSuffix().replace('-', '');
    const firstName = `Client${suffix.slice(-6)}`;
    const lastName = `Flow${suffix.slice(0, 6)}`;
    const fullName = `${firstName} ${lastName}`;

    await bottomMenu.openClients();
    await clientList.waitForVisible();
    await clientList.openAddClient();

    await clientNew.waitForVisible();
    await clientNew.fillAndSave({
      firstName,
      lastName,
      birthDate: '1995-05-20',
      phoneNumber: '48123456789',
      gender: 'male',
    });

    await dismissIosOkAlertIfVisible();

    await clientList.waitForVisible();
    await clientList.expectClientVisible(fullName);
  });
});
