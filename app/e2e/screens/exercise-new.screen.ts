import { by, element, waitFor } from 'detox';

export class ExerciseNewScreen {
  private readonly nameInput = element(by.id('input.exercises.name'));
  private readonly saveButton = element(by.id('button.exercises.save'));

  async waitForVisible(timeout = 15000): Promise<void> {
    await waitFor(this.nameInput).toBeVisible().withTimeout(timeout);
    await waitFor(this.saveButton).toBeVisible().withTimeout(timeout);
  }

  async fillAndSave(name: string): Promise<void> {
    await this.nameInput.tap();
    await this.nameInput.replaceText(name);
    await this.saveButton.tap();
  }
}
