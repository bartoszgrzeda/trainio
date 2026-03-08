import { by, element, waitFor } from 'detox';

export class ExerciseDetailScreen {
  private readonly nameInput = element(by.id('input.exercises.name'));
  private readonly saveButton = element(by.id('button.exercises.save'));
  private readonly deleteButton = element(by.id('button.exercises.delete'));
  private readonly updateErrorMessage = element(
    by.text('Could not update exercise. Try again.'),
  );

  async waitForVisible(timeout = 15000): Promise<void> {
    await waitFor(this.deleteButton).toBeVisible().withTimeout(timeout);
    await waitFor(this.nameInput).toBeVisible().withTimeout(timeout);
  }

  async updateNameAndSave(name: string): Promise<void> {
    await this.nameInput.tap();
    await this.nameInput.replaceText(name);
    await this.saveButton.tap();
  }

  async retrySaveIfUpdateFailed(): Promise<void> {
    try {
      await waitFor(this.updateErrorMessage).toBeVisible().withTimeout(3000);
      await this.saveButton.tap();
    } catch {
      // Save did not fail in this attempt.
    }
  }

  async deleteExercise(): Promise<void> {
    await this.deleteButton.tap();
  }
}
