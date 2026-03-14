import { by, element, waitFor } from 'detox';

export class ClientTrainingPlanScreen {
  private readonly nameInput = element(by.id('input.clients.trainingPlan.name'));
  private readonly copyButton = element(
    by.id('button.clients.trainingPlan.copyFromTemplate'),
  );
  private readonly saveButton = element(by.id('button.clients.trainingPlan.save'));

  private templateOptionByName(name: string) {
    return element(
      by
        .id(/^button\.clients\.trainingPlan\.template\.option\.[0-9]+$/)
        .withDescendant(by.text(name)),
    );
  }

  async waitForVisible(timeout = 15000): Promise<void> {
    await waitFor(this.nameInput).toBeVisible().withTimeout(timeout);
    await waitFor(this.saveButton).toBeVisible().withTimeout(timeout);
  }

  async copyFromTemplate(templateName: string): Promise<void> {
    await this.copyButton.tap();
    const option = this.templateOptionByName(templateName);
    await waitFor(option).toBeVisible().withTimeout(20000);
    await option.tap();
  }

  async save(): Promise<void> {
    await this.saveButton.tap();
  }

  async waitForName(name: string, timeout = 15000): Promise<void> {
    await waitFor(this.nameInput).toHaveText(name).withTimeout(timeout);
  }
}
