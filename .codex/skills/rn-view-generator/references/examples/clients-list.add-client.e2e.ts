import { by, device, element, waitFor } from 'detox';

function uniqueName(): string {
  return `E2E Client ${Date.now()}`;
}

describe('clients.add-client', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('creates a client and shows it in clients list', async () => {
    const fullName = uniqueName();

    await waitFor(element(by.id('screen.clients.list')))
      .toBeVisible()
      .withTimeout(15000);

    await element(by.id('button.clients.add')).tap();

    await waitFor(element(by.id('screen.clients.new')))
      .toBeVisible()
      .withTimeout(15000);

    await element(by.id('input.clients.firstName')).replaceText(fullName);
    await element(by.id('input.clients.lastName')).replaceText('Flow');
    await element(by.id('input.clients.phoneNumber')).replaceText('+48123456789');
    await element(by.id('button.clients.gender.male')).tap();
    await element(by.id('button.clients.birthDate.open')).tap();
    await element(by.id('input.clients.birthDate.picker')).setDatePickerDate('1995-05-20', 'yyyy-MM-dd');
    await element(by.id('button.clients.save')).tap();

    await waitFor(element(by.id('screen.clients.list')))
      .toBeVisible()
      .withTimeout(15000);

    await element(by.id('input.clients.search')).replaceText(fullName);
    await waitFor(element(by.text(fullName)))
      .toBeVisible()
      .withTimeout(15000);
  });
});
