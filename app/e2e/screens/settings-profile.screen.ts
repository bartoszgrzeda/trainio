import { by, element, waitFor } from 'detox';

export class SettingsProfileScreen {
  private readonly profileScroll = by.id('scroll.settings.profile');
  private readonly firstNameInput = element(by.id('input.profile.firstName'));
  private readonly emailInput = element(by.id('input.profile.email'));
  private readonly phoneNumberInput = element(by.id('input.profile.phoneNumber'));
  private readonly emailError = element(by.id('text.profile.error.email'));

  async waitForVisible(timeout = 15000): Promise<void> {
    await waitFor(this.firstNameInput).toBeVisible().withTimeout(timeout);
  }

  async replaceEmail(email: string): Promise<void> {
    await waitFor(this.emailInput)
      .toBeVisible()
      .whileElement(this.profileScroll)
      .scroll(160, 'down', 0.5, 0.3);
    await this.emailInput.tap();
    await this.emailInput.replaceText(email);
  }

  async blurEmail(): Promise<void> {
    await waitFor(this.phoneNumberInput)
      .toBeVisible()
      .whileElement(this.profileScroll)
      .scroll(120, 'down', 0.5, 0.3);
    await this.phoneNumberInput.tap();
  }

  async expectEmailValidationError(): Promise<void> {
    await waitFor(this.emailError).toBeVisible().withTimeout(5000);
  }
}
