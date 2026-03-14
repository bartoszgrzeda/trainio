import { by, element, waitFor } from 'detox';

export class BottomMenuScreen {
  private readonly homeTab = element(by.id('tab.home'));
  private readonly clientsTab = element(by.id('tab.clients'));
  private readonly settingsTab = element(by.id('tab.settings'));

  async openHome(): Promise<void> {
    await waitFor(this.homeTab).toBeVisible().withTimeout(15000);
    await this.homeTab.tap();
  }

  async openClients(): Promise<void> {
    await waitFor(this.clientsTab).toBeVisible().withTimeout(15000);
    await this.clientsTab.tap();
  }

  async openSettings(): Promise<void> {
    await waitFor(this.settingsTab).toBeVisible().withTimeout(15000);
    await this.settingsTab.tap();
  }
}
