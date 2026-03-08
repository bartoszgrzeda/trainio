import { by, element, waitFor } from 'detox';

export class ClientListScreen {
  private readonly addButton = element(by.id('button.clients.add'));
  private readonly clientListScroll = by.id('scroll.clients.list');
  private readonly searchInput = element(by.id('input.clients.search'));
  private readonly noMatchesText = element(by.id('text.clients.empty.noMatches'));

  private clientRowByName(fullName: string) {
    return element(
      by
        .id(/^item\.client\..+/)
        .withDescendant(by.text(fullName)),
    );
  }

  async waitForVisible(): Promise<void> {
    await waitFor(this.addButton).toBeVisible().withTimeout(15000);
    await waitFor(this.searchInput).toBeVisible().withTimeout(15000);
  }

  async openAddClient(): Promise<void> {
    await this.addButton.tap();
  }

  async search(query: string): Promise<void> {
    await waitFor(this.searchInput).toBeVisible().withTimeout(15000);
    await this.searchInput.replaceText(query);
  }

  async expectClientVisible(fullName: string): Promise<void> {
    await waitFor(this.clientRowByName(fullName))
      .toBeVisible()
      .whileElement(this.clientListScroll)
      .scroll(220, 'down');
  }

  async openClientByName(fullName: string): Promise<void> {
    await waitFor(this.clientRowByName(fullName))
      .toBeVisible()
      .whileElement(this.clientListScroll)
      .scroll(220, 'down');
    await this.clientRowByName(fullName).tap();
  }

  async expectNoSearchResults(): Promise<void> {
    await waitFor(this.noMatchesText).toBeVisible().withTimeout(15000);
  }

  async expectClientNotVisible(fullName: string): Promise<void> {
    await waitFor(this.clientRowByName(fullName)).not.toExist().withTimeout(15000);
  }
}
