/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';

import {
  dialog,
  resolveCurrentDialog,
  useDialogStore,
} from '@/shared/feedback/dialog';
import { DialogHost } from '@/shared/feedback/DialogHost';

const current = () => useDialogStore.getState().queue[0];

beforeEach(() => useDialogStore.setState({ queue: [] }));

describe('dialog', () => {
  it('defaults to a single OK action', () => {
    dialog.alert('Heads up', 'Something happened');
    expect(current()).toMatchObject({
      title: 'Heads up',
      message: 'Something happened',
      actions: [{ label: 'OK' }],
    });
  });

  it('queues dialogs and shows them one at a time', () => {
    dialog.alert('First');
    dialog.alert('Second');
    expect(current().title).toBe('First');
    resolveCurrentDialog(current().actions[0]);
    expect(current().title).toBe('Second');
    resolveCurrentDialog(current().actions[0]);
    expect(current()).toBeUndefined();
  });

  it('confirm resolves true on confirm and false on cancel', async () => {
    const yes = dialog.confirm({ title: 'Delete?', destructive: true });
    const [, confirmAction] = current().actions;
    expect(confirmAction).toMatchObject({ style: 'destructive' });
    resolveCurrentDialog(confirmAction);
    await expect(yes).resolves.toBe(true);

    const no = dialog.confirm({ title: 'Delete?' });
    resolveCurrentDialog(current().actions[0]);
    await expect(no).resolves.toBe(false);
  });

  it('runs the chosen action callback', () => {
    const onPress = jest.fn();
    dialog.show({ title: 'Settings', actions: [{ label: 'Open', onPress }] });
    resolveCurrentDialog(current().actions[0]);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the current dialog in DialogHost', async () => {
    dialog.alert('Rendered title', 'Rendered message');
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(<DialogHost />);
    });
    const texts = tree.root
      .findAllByType(Text)
      .map(node => node.props.children);
    expect(texts).toEqual(
      expect.arrayContaining(['Rendered title', 'Rendered message', 'OK']),
    );
  });
});
