import { by, device, element, expect, waitFor } from "detox";
import { LoginScreen } from "./login.screen";

describe("auth.login.happy-path", () => {
  const login = new LoginScreen();

  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  beforeEach(async () => {
    await login.assertVisible();
  });

  it("logs in and lands on home dashboard", async () => {
    await login.enterUsername("qa+valid@trainio.app");
    await login.enterPassword("StrongPass123!");
    await login.submit();

    await waitFor(element(by.id("screen.home")))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.id("screen.home"))).toBeVisible();
    await expect(element(by.id("tab.home"))).toBeVisible();
  });

  it("shows auth error for invalid credentials", async () => {
    await login.enterUsername("qa+invalid@trainio.app");
    await login.enterPassword("WrongPass!");
    await login.submit();

    await waitFor(element(by.id("text.auth.error.invalidCredentials")))
      .toBeVisible()
      .withTimeout(8000);

    await expect(element(by.id("screen.login"))).toBeVisible();
    await expect(element(by.id("text.auth.error.invalidCredentials"))).toBeVisible();
  });
});
