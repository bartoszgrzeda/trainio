import { by, device, element, waitFor } from 'detox';

export interface NewClientData {
  firstName: string;
  lastName: string;
  birthDate: string;
  phoneNumber: string;
  gender: 'male' | 'female';
}

export class ClientNewScreen {
  private readonly formScrollMatcher = by.id('scroll.clients.new');
  private readonly firstNameInput = element(by.id('input.clients.firstName'));
  private readonly lastNameInput = element(by.id('input.clients.lastName'));
  private readonly birthDateOpenButton = element(by.id('button.clients.birthDate.open'));
  private readonly birthDatePicker = element(by.id('input.clients.birthDate.picker'));
  private readonly genderMaleButton = element(by.id('button.clients.gender.male'));
  private readonly genderFemaleButton = element(by.id('button.clients.gender.female'));
  private readonly phoneNumberInput = element(by.id('input.clients.phoneNumber'));
  private readonly saveButton = element(by.id('button.clients.save'));

  async waitForVisible(): Promise<void> {
    await waitFor(this.firstNameInput).toBeVisible().withTimeout(15000);
  }

  async fillAndSave(data: NewClientData): Promise<void> {
    await this.firstNameInput.tap();
    await this.firstNameInput.replaceText(data.firstName);

    await this.lastNameInput.tap();
    await this.lastNameInput.replaceText(data.lastName);

    await this.birthDateOpenButton.tap();
    await waitFor(this.birthDatePicker).toBeVisible().withTimeout(5000);
    await this.birthDatePicker.setDatePickerDate(data.birthDate, 'yyyy-MM-dd');

    if (device.getPlatform() === 'ios') {
      await this.birthDateOpenButton.tap();
    }

    const genderButton =
      data.gender === 'male' ? this.genderMaleButton : this.genderFemaleButton;
    await waitFor(genderButton)
      .toBeVisible()
      .whileElement(this.formScrollMatcher)
      .scroll(120, 'down');
    await genderButton.tap();

    await waitFor(this.phoneNumberInput)
      .toBeVisible()
      .whileElement(this.formScrollMatcher)
      .scroll(180, 'down');
    await this.phoneNumberInput.replaceText(data.phoneNumber);

    await this.saveButton.tap();
  }
}
