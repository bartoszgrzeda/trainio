import { by, element, waitFor } from 'detox';

export class PlanTemplateListScreen {
  private readonly addButton = element(by.id('button.planTemplates.add'));
  private readonly planTemplateListScroll = by.id('scroll.planTemplates.list');
  private readonly searchInput = element(by.id('input.planTemplates.search'));
  private readonly noMatchesText = element(
    by.id('text.planTemplates.empty.noMatches'),
  );

  private planTemplateRowByName(name: string) {
    return element(
      by
        .id(/^item\.planTemplate\..+/)
        .withDescendant(by.text(name)),
    );
  }

  async waitForVisible(timeout = 15000): Promise<void> {
    await waitFor(this.addButton).toBeVisible().withTimeout(timeout);
    await waitFor(this.searchInput).toBeVisible().withTimeout(timeout);
  }

  async openAddPlanTemplate(): Promise<void> {
    await this.addButton.tap();
  }

  async search(query: string): Promise<void> {
    await waitFor(this.searchInput).toBeVisible().withTimeout(15000);
    await this.searchInput.replaceText(query);
  }

  async expectPlanTemplateVisible(name: string): Promise<void> {
    await element(this.planTemplateListScroll).scrollTo('top');
    await waitFor(this.planTemplateRowByName(name))
      .toBeVisible()
      .whileElement(this.planTemplateListScroll)
      .scroll(220, 'down', 0.5, 0.3);
  }

  async openPlanTemplateByName(name: string): Promise<void> {
    await element(this.planTemplateListScroll).scrollTo('top');
    await waitFor(this.planTemplateRowByName(name))
      .toBeVisible()
      .whileElement(this.planTemplateListScroll)
      .scroll(220, 'down', 0.5, 0.3);
    await this.planTemplateRowByName(name).tap();
  }

  async expectNoSearchResults(): Promise<void> {
    await waitFor(this.noMatchesText).toBeVisible().withTimeout(15000);
  }

  async expectPlanTemplateNotVisible(name: string): Promise<void> {
    await waitFor(this.planTemplateRowByName(name)).not.toExist().withTimeout(15000);
  }
}
