import { by, device, element, waitFor } from 'detox';

export function uniqueSuffix(): string {
  const randomPart = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${Date.now()}-${randomPart}`;
}

export async function dismissIosOkAlertIfVisible(): Promise<void> {
  if (device.getPlatform() !== 'ios') {
    return;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await waitFor(element(by.text('OK'))).toBeVisible().withTimeout(2000);
      await element(by.text('OK')).tap();
    } catch {
      // No alert was presented.
      break;
    }
  }
}

export async function tapIosAlertButtonIfVisible(label: string): Promise<void> {
  if (device.getPlatform() !== 'ios') {
    return;
  }

  try {
    await waitFor(element(by.text(label))).toBeVisible().withTimeout(2000);
    await element(by.text(label)).tap();
  } catch {
    // The requested alert button is not currently visible.
  }
}
