import { by, element, waitFor } from 'detox';

export class ClientDetailScreen {
  private readonly detailScrollMatcher = by.id('scroll.clients.details');
  private readonly firstNameInput = element(by.id('input.clients.firstName'));
  private readonly openTrainingPlanButton = element(
    by.id('button.clients.trainingPlan.open'),
  );
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

  async openClientTrainingPlan(): Promise<void> {
    await waitFor(this.openTrainingPlanButton)
      .toBeVisible()
      .whileElement(this.detailScrollMatcher)
      .scroll(220, 'down');
    await this.openTrainingPlanButton.tap();
  }

  async deleteClient(): Promise<void> {
    await this.deleteButton.tap();
  }
}
