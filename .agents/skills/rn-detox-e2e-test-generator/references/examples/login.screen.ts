import { by, element, expect, waitFor } from "detox";

export class LoginScreen {
  private screen = element(by.id("screen.login"));
  private username = element(by.id("input.username"));
  private password = element(by.id("input.password"));
  private submitButton = element(by.id("button.login.submit"));
  private loadingIndicator = element(by.id("text.auth.loading"));

  async assertVisible(): Promise<void> {
    await expect(this.screen).toBeVisible();
    await expect(this.username).toBeVisible();
    await expect(this.password).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async enterUsername(value: string): Promise<void> {
    await this.username.clearText();
    await this.username.typeText(value);
    await expect(this.username).toHaveText(value);
  }

  async enterPassword(value: string): Promise<void> {
    await this.password.clearText();
    await this.password.typeText(value);
  }

  async submit(): Promise<void> {
    await this.submitButton.tap();

    // Synchronize on app's auth transition lifecycle if loading marker is exposed.
    await waitFor(this.loadingIndicator).toBeNotVisible().withTimeout(10000);
  }
}
