import { by, element, waitFor } from 'detox';

export interface NewTrainingData {
  startDateTime: string;
  endDateTime: string;
  notes?: string;
}

export class TrainingNewScreen {
  private readonly clientOpenButton = element(by.id('button.trainings.client.open'));
  private readonly clientFirstOption = element(
    by.id(/^item\.trainings\.client\..+/),
  ).atIndex(0);
  private readonly startDateOpenButton = element(by.id('button.trainings.startAt.open'));
  private readonly startDatePicker = element(by.id('input.trainings.startAt.picker'));
  private readonly endDateOpenButton = element(by.id('button.trainings.endAt.open'));
  private readonly endDatePicker = element(by.id('input.trainings.endAt.picker'));
  private readonly notesInput = element(by.id('input.trainings.notes'));
  private readonly saveButton = element(by.id('button.trainings.save'));
  private readonly warningConfirmButton = element(by.id('button.trainings.warnings.confirm'));

  async waitForVisible(timeout = 15000): Promise<void> {
    await waitFor(this.clientOpenButton).toBeVisible().withTimeout(timeout);
    await waitFor(this.saveButton).toBeVisible().withTimeout(timeout);
  }

  async fillAndSave(data: NewTrainingData): Promise<void> {
    await this.clientOpenButton.tap();
    await waitFor(this.clientFirstOption).toBeVisible().withTimeout(15000);
    await this.clientFirstOption.tap();

    await this.startDateOpenButton.tap();
    await waitFor(this.startDatePicker).toBeVisible().withTimeout(15000);
    await this.startDatePicker.setDatePickerDate(data.startDateTime, 'yyyy-MM-dd HH:mm');

    await this.endDateOpenButton.tap();
    await waitFor(this.endDatePicker).toBeVisible().withTimeout(15000);
    await this.endDatePicker.setDatePickerDate(data.endDateTime, 'yyyy-MM-dd HH:mm');

    if (data.notes) {
      await this.notesInput.tap();
      await this.notesInput.replaceText(data.notes);
    }

    await this.saveButton.tap();
  }

  async confirmWarningsIfVisible(): Promise<void> {
    try {
      await waitFor(this.warningConfirmButton).toBeVisible().withTimeout(2000);
      await this.warningConfirmButton.tap();
    } catch {
      // Warning modal was not visible for this run.
    }
  }
}
