import { by, element, waitFor } from 'detox';

export class ClientDetailScreen {
  private readonly firstNameInput = element(by.id('input.clients.firstName'));
  private readonly saveButton = element(by.id('button.clients.save'));
  private readonly deleteButton = element(by.id('button.clients.delete'));

  async waitForVisible(): Promise<void> {
    await waitFor(this.firstNameInput).toBeVisible().withTimeout(15000);
  }

  async updateFirstNameAndSave(firstName: string): Promise<void> {
    await this.firstNameInput.tap();
    await this.firstNameInput.replaceText(firstName);
    await this.saveButton.tap();
  }

  async deleteClient(): Promise<void> {
    await this.deleteButton.tap();
  }
}
