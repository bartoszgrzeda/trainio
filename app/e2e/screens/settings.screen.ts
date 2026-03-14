import { by, element, waitFor } from 'detox';

export class SettingsScreen {
  private readonly profileButton = element(by.id('button.settings.menu.profile'));
  private readonly exercisesButton = element(by.id('button.settings.menu.exercises'));
  private readonly planTemplatesButton = element(
    by.id('button.settings.menu.plansTemplates'),
  );

  async waitForVisible(): Promise<void> {
    await waitFor(this.profileButton).toBeVisible().withTimeout(15000);
    await waitFor(this.exercisesButton).toBeVisible().withTimeout(15000);
    await waitFor(this.planTemplatesButton).toBeVisible().withTimeout(15000);
  }

  async openProfile(): Promise<void> {
    await this.profileButton.tap();
  }

  async openExercises(): Promise<void> {
    await this.exercisesButton.tap();
  }

  async openPlanTemplates(): Promise<void> {
    await this.planTemplatesButton.tap();
  }
}
