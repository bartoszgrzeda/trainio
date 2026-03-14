import { by, element, waitFor } from 'detox';

export class PlanTemplateDetailScreen {
  private readonly nameInput = element(by.id('input.planTemplates.name'));
  private readonly saveButton = element(by.id('button.planTemplates.save'));
  private readonly deleteButton = element(by.id('button.planTemplates.delete'));

  async waitForVisible(timeout = 15000): Promise<void> {
    await waitFor(this.deleteButton).toBeVisible().withTimeout(timeout);
    await waitFor(this.nameInput).toBeVisible().withTimeout(timeout);
  }

  async updateNameAndSave(name: string): Promise<void> {
    await this.nameInput.tap();
    await this.nameInput.replaceText(name);
    await this.saveButton.tap();
  }

  async deletePlanTemplate(): Promise<void> {
    await this.deleteButton.tap();
  }
}
