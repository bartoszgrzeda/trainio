import { by, element, waitFor } from 'detox';

export class PlanTemplateNewScreen {
  private readonly nameInput = element(by.id('input.planTemplates.name'));
  private readonly saveButton = element(by.id('button.planTemplates.save'));
  private readonly firstExerciseSearchInput = element(
    by.id('input.planTemplates.day.0.exercise.0.search'),
  );
  private readonly firstExerciseOption = element(
    by.id(/^item\.planTemplates\.day\.0\.exercise\.0\.option\..+/),
  ).atIndex(0);

  async waitForVisible(timeout = 15000): Promise<void> {
    await waitFor(this.nameInput).toBeVisible().withTimeout(timeout);
    await waitFor(this.saveButton).toBeVisible().withTimeout(timeout);
  }

  async fillAndSave(name: string): Promise<void> {
    await this.nameInput.tap();
    await this.nameInput.replaceText(name);

    await waitFor(this.firstExerciseSearchInput).toBeVisible().withTimeout(15000);
    await this.firstExerciseSearchInput.tap();
    await waitFor(this.firstExerciseOption).toBeVisible().withTimeout(15000);
    await this.firstExerciseOption.tap();

    await this.saveButton.tap();
  }
}
