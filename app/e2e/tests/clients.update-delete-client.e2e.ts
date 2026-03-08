import { device } from 'detox';
import {
  dismissIosOkAlertIfVisible,
  tapIosAlertButtonIfVisible,
  uniqueSuffix,
} from '../helpers/device.helper';
import { BottomMenuScreen } from '../screens/bottom-menu.screen';
import { ClientDetailScreen } from '../screens/client-detail.screen';
import { ClientListScreen } from '../screens/client-list.screen';
import { ClientNewScreen } from '../screens/client-new.screen';

describe('clients.update-delete-client', () => {
  const bottomMenu = new BottomMenuScreen();
  const clientList = new ClientListScreen();
  const clientNew = new ClientNewScreen();
  const clientDetail = new ClientDetailScreen();

  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('updates and deletes a client from details screen', async () => {
    const suffix = uniqueSuffix().replace('-', '');
    const firstName = `Client${suffix.slice(-6)}`;
    const lastName = `Update${suffix.slice(0, 6)}`;
    const fullName = `${firstName} ${lastName}`;
    const updatedFirstName = `${firstName}X`;
    const updatedFullName = `${updatedFirstName} ${lastName}`;

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
    await clientDetail.updateFirstNameAndSave(updatedFirstName);
    await dismissIosOkAlertIfVisible();

    await clientList.waitForVisible();
    await clientList.expectClientVisible(updatedFullName);
    await clientList.openClientByName(updatedFullName);

    await clientDetail.waitForVisible();
    await clientDetail.deleteClient();
    await tapIosAlertButtonIfVisible('Delete');
    await dismissIosOkAlertIfVisible();

    await clientList.waitForVisible();
    await clientList.expectClientNotVisible(updatedFullName);
  });
});
