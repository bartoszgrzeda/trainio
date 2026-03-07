import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import { BottomMenu } from '../BottomMenu';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

function findButtonByLabel(
  buttons: ReactTestInstance[],
  label: string,
): ReactTestInstance | undefined {
  return buttons.find(button =>
    button
      .findAllByType(Text)
      .some(textNode => textNode.props.children === label),
  );
}

describe('BottomMenu', () => {
  test('calls onNavigate when pressing the active settings tab', async () => {
    const onNavigate = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <BottomMenu
          activeRoute="/settings"
          activeTrainingId="training-1"
          onNavigate={onNavigate}
        />,
      );
    });

    const buttons =
      renderer?.root.findAll(
        node => typeof node.props.onPress === 'function' && node.props.accessibilityRole === 'button',
      ) ?? [];
    const settingsButton = findButtonByLabel(buttons, 'Settings');

    expect(settingsButton).toBeDefined();

    ReactTestRenderer.act(() => {
      settingsButton?.props.onPress();
    });

    expect(onNavigate).toHaveBeenCalledWith('/settings');
  });
});
