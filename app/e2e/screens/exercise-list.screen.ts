import { by, element, waitFor } from 'detox';

export class ExerciseListScreen {
  private readonly addButton = element(by.id('button.exercises.add'));
  private readonly exerciseListScroll = by.id('scroll.exercises.list');
  private readonly searchInput = element(by.id('input.exercises.search'));
  private readonly noMatchesText = element(by.id('text.exercises.empty.noMatches'));

  private exerciseRowByName(name: string) {
    return element(
      by
        .id(/^item\.exercise\..+/)
        .withDescendant(by.text(name)),
    );
  }

  async waitForVisible(timeout = 15000): Promise<void> {
    await waitFor(this.addButton).toBeVisible().withTimeout(timeout);
    await waitFor(this.searchInput).toBeVisible().withTimeout(timeout);
  }

  async openAddExercise(): Promise<void> {
    await this.addButton.tap();
  }

  async search(query: string): Promise<void> {
    await waitFor(this.searchInput).toBeVisible().withTimeout(15000);
    await this.searchInput.replaceText(query);
  }

  async expectExerciseVisible(name: string): Promise<void> {
    await element(this.exerciseListScroll).scrollTo('top');
    await waitFor(this.exerciseRowByName(name))
      .toBeVisible()
      .whileElement(this.exerciseListScroll)
      .scroll(180, 'down', 0.5, 0.3);
  }

  async openExerciseByName(name: string): Promise<void> {
    await element(this.exerciseListScroll).scrollTo('top');
    await waitFor(this.exerciseRowByName(name))
      .toBeVisible()
      .whileElement(this.exerciseListScroll)
      .scroll(180, 'down', 0.5, 0.3);
    await this.exerciseRowByName(name).tap();
  }

  async expectNoSearchResults(): Promise<void> {
    await waitFor(this.noMatchesText).toBeVisible().withTimeout(15000);
  }

  async expectExerciseNotVisible(name: string): Promise<void> {
    await waitFor(this.exerciseRowByName(name)).not.toExist().withTimeout(15000);
  }
}
