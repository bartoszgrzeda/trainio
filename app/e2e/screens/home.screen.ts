import { by, element, waitFor } from 'detox';

export class HomeScreen {
  private readonly startTrainingButton = element(by.id('button.home.startTraining'));
  private readonly addTrainingButton = element(by.id('button.home.addTraining'));

  async waitForVisible(): Promise<void> {
    await waitFor(this.startTrainingButton).toBeVisible().withTimeout(15000);
    await waitFor(this.addTrainingButton).toBeVisible().withTimeout(15000);
  }

  async openAddTraining(): Promise<void> {
    await this.addTrainingButton.tap();
  }
}
