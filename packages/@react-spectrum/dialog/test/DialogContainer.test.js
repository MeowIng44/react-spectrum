/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {act, fireEvent, render, within} from '@testing-library/react';
import {DialogContainerExample, MenuExample, NestedDialogContainerExample} from '../stories/DialogContainerExamples';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {theme} from '@react-spectrum/theme-default';
import {triggerPress} from '@react-spectrum/test-utils';

describe('DialogContainer', function () {
  beforeAll(() => {
    jest.useFakeTimers('legacy');
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => setTimeout(cb, 0));
  });

  afterEach(() => {
    jest.runAllTimers();
    window.requestAnimationFrame.mockRestore();
  });

  it('should open and close a dialog based on controlled state', function () {
    let {getByRole, queryByRole} = render(
      <Provider theme={theme}>
        <DialogContainerExample />
      </Provider>
    );

    let button = getByRole('button');
    act(() => button.focus());
    expect(queryByRole('dialog')).toBeNull();

    triggerPress(button);
    act(() => {jest.runAllTimers();});

    let dialog = getByRole('dialog');
    expect(document.activeElement).toBe(dialog);

    triggerPress(within(dialog).getByText('Confirm'));
    act(() => {jest.runAllTimers();});

    expect(queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('should support closing a dialog via the Escape key', function () {
    let {getByRole, queryByRole} = render(
      <Provider theme={theme}>
        <DialogContainerExample />
      </Provider>
    );

    let button = getByRole('button');
    act(() => button.focus());
    expect(queryByRole('dialog')).toBeNull();

    triggerPress(button);
    act(() => {jest.runAllTimers();});

    let dialog = getByRole('dialog');
    expect(document.activeElement).toBe(dialog);

    fireEvent.keyDown(dialog, {key: 'Escape'});
    fireEvent.keyUp(dialog, {key: 'Escape'});
    act(() => {jest.runAllTimers();});

    expect(queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('should not close a dialog via the Escape key if isKeyboardDismissDisabled', function () {
    let {getByRole, queryByRole} = render(
      <Provider theme={theme}>
        <DialogContainerExample isKeyboardDismissDisabled />
      </Provider>
    );

    let button = getByRole('button');
    expect(queryByRole('dialog')).toBeNull();

    triggerPress(button);
    act(() => {jest.runAllTimers();});

    let dialog = getByRole('dialog');
    expect(document.activeElement).toBe(dialog);

    fireEvent.keyDown(dialog, {key: 'Escape'});
    fireEvent.keyUp(dialog, {key: 'Escape'});
    act(() => {jest.runAllTimers();});

    expect(getByRole('dialog')).toBeVisible();
  });

  it('should not close when clicking outside the dialog by default', function () {
    let {getByRole, queryByRole} = render(
      <Provider theme={theme}>
        <DialogContainerExample />
      </Provider>
    );

    let button = getByRole('button');
    expect(queryByRole('dialog')).toBeNull();

    triggerPress(button);
    act(() => {jest.runAllTimers();});

    expect(getByRole('dialog')).toBeVisible();

    triggerPress(document.body);
    act(() => {jest.runAllTimers();});

    expect(getByRole('dialog')).toBeVisible();
  });

  it('should close when clicking outside the dialog when isDismissible', function () {
    let {getByRole, queryByRole} = render(
      <Provider theme={theme}>
        <DialogContainerExample isDismissable />
      </Provider>
    );

    let button = getByRole('button');
    act(() => button.focus());
    expect(queryByRole('dialog')).toBeNull();

    triggerPress(button);
    act(() => {jest.runAllTimers();});

    expect(getByRole('dialog')).toBeVisible();

    triggerPress(document.body);
    act(() => {jest.runAllTimers();});

    expect(queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('should not close the dialog when a trigger unmounts', function () {
    let {getByRole, queryByRole} = render(
      <Provider theme={theme}>
        <MenuExample />
      </Provider>
    );

    let button = getByRole('button');
    act(() => button.focus());
    expect(queryByRole('dialog')).toBeNull();

    triggerPress(button);
    act(() => {jest.runAllTimers();});

    expect(queryByRole('dialog')).toBeNull();

    let menu = getByRole('menu');
    let menuitem = within(menu).getByRole('menuitem');

    triggerPress(menuitem);
    act(() => {jest.runAllTimers();});

    expect(queryByRole('menu')).toBeNull();
    expect(queryByRole('menuitem')).toBeNull();

    let dialog = getByRole('dialog');
    button = within(dialog).getByText('Confirm');

    triggerPress(button);
    act(() => {jest.runAllTimers();});

    expect(queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(getByRole('button'));
  });

  it('should restore focus to trigger when a dialog opens from and replaces another dialog', function () {
    let {getByRole, queryByRole} = render(
      <Provider theme={theme}>
        <NestedDialogContainerExample />
      </Provider>
    );

    // 1. Focus and press menu button
    let button = getByRole('button');
    act(() => button.focus());
    expect(queryByRole('dialog')).toBeNull();

    triggerPress(button);
    act(() => {jest.runAllTimers();});

    // 2. Press "Do this…" menu item to open "This" dialog.
    let menu = getByRole('menu');
    let menuitem = within(menu).getByText('Do this…');
    act(() => menuitem.focus());
    triggerPress(menuitem);
    act(() => {jest.runAllTimers();});

    let dialog = getByRole('dialog');
    let actionButton = within(dialog).getByText('Do that').closest('button');
    act(() => actionButton.focus());
    expect(document.activeElement).toBe(actionButton);

    // 3. Press "Escape" key to close "This" dialog.
    fireEvent.keyDown(dialog, {key: 'Escape'});
    fireEvent.keyUp(dialog, {key: 'Escape'});
    act(() => {jest.runAllTimers();});

    // 4. Focus is restored to the menu button.
    expect(queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(button);

    // 5. Press menu button to open menu.
    triggerPress(button);
    act(() => {jest.runAllTimers();});

    // 6. Press "Do that…" menu item to open "That" dialog.
    menu = getByRole('menu');
    menuitem = within(menu).getByText('Do that…');
    act(() => menuitem.focus());
    triggerPress(menuitem);
    act(() => {jest.runAllTimers();});

    // 7. Press "Do this" action button to open "This" dialog.
    dialog = getByRole('dialog');
    actionButton = within(dialog).getByText('Do this').closest('button');
    act(() => actionButton.focus());
    expect(document.activeElement).toBe(actionButton);
    triggerPress(actionButton);
    act(() => {jest.runAllTimers();});

    // 8. "This" dialog opens with autoFocus on the button, "Do that".
    dialog = getByRole('dialog');
    actionButton = within(dialog).getByText('Do that').closest('button');
    expect(document.activeElement).toBe(actionButton);

    // 9. Press "Escape" key to close "This" dialog.
    fireEvent.keyDown(dialog, {key: 'Escape'});
    fireEvent.keyUp(dialog, {key: 'Escape'});
    act(() => {jest.runAllTimers();});

    // 10. Dialog closes and its FocusScope restores focus to the menu button.
    expect(queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('should support restoreFocus as ref', function () {
    let {getAllByRole, getByRole, queryByRole} = render(
      <Provider theme={theme}>
        <NestedDialogContainerExample useRestoreFocusRef />
      </Provider>
    );

    // 1. Focus and press menu button
    let button = getByRole('button');
    act(() => button.focus());
    expect(queryByRole('dialog')).toBeNull();

    triggerPress(button);
    act(() => {jest.runAllTimers();});

    // 2. Press "Do this…" menu item to open "This" dialog.
    let menu = getByRole('menu');
    let menuitem = within(menu).getByText('Do this…');
    act(() => menuitem.focus());
    triggerPress(menuitem);
    act(() => {jest.runAllTimers();});

    // 3. Press "Cancel" button to close "This" dialog, without completing the "This" action.
    let dialog = getByRole('dialog');
    let actionButton = within(dialog).getAllByRole('button')[1];
    expect(actionButton.textContent).toBe('Cancel');
    act(() => actionButton.focus());
    expect(document.activeElement).toBe(actionButton);
    triggerPress(actionButton);
    act(() => {jest.runAllTimers();});

    // 4. Focus is restored to the menu button.
    expect(queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(button);
    
    // 5. Press menu button to open menu.
    triggerPress(button);
    act(() => {jest.runAllTimers();});

    // 6. Press "Do that…" menu item to open "That" dialog.
    menu = getByRole('menu');
    menuitem = within(menu).getByText('Do that…');
    act(() => menuitem.focus());
    triggerPress(menuitem);
    act(() => {jest.runAllTimers();});

    // 7. Press "Do this" button to close "That" dialog and open "This" dialog.
    dialog = getByRole('dialog');
    actionButton = within(dialog).getAllByRole('button')[0];
    expect(actionButton.textContent).toBe('Do this');
    act(() => actionButton.focus());
    expect(document.activeElement).toBe(actionButton);
    triggerPress(actionButton);
    act(() => {jest.runAllTimers();});

    // 8. "This" dialog opens with autoFocus on the first button, "Do that".
    dialog = getByRole('dialog');
    actionButton = within(dialog).getAllByRole('button')[0];
    expect(actionButton.textContent).toBe('Do that');
    expect(document.activeElement).toBe(actionButton);

    // 9. Move focus to and press the "This" cta button, to "complete" the "This" action.
    let confirmButton = within(dialog).getAllByRole('button')[2];
    expect(confirmButton.textContent).toBe('This');
    act(() => confirmButton.focus());
    triggerPress(confirmButton);
    act(() => {jest.runAllTimers();});

    // 10. Dialog closes and moves focus to the the restoreFocus ref, the "Focus after this" input.
    expect(queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(getAllByRole('textbox')[0]);

    // 11. Focus and press menu button to open menu.
    act(() => button.focus());
    triggerPress(button);
    act(() => {jest.runAllTimers();});

    // 12. Press "Do that…" menu item to open "That" dialog.
    menu = getByRole('menu');
    menuitem = within(menu).getByText('Do that…');
    act(() => menuitem.focus());
    triggerPress(menuitem);
    act(() => {jest.runAllTimers();});

    // 13. Move focus to and press the "That" cta button, to "complete" the "That" action.
    dialog = getByRole('dialog');
    confirmButton = within(dialog).getAllByRole('button')[2];
    expect(confirmButton.textContent).toBe('That');
    act(() => confirmButton.focus());
    triggerPress(confirmButton);
    act(() => {jest.runAllTimers();});

    // 14. Dialog closes and moves focus to the the restoreFocus ref, the "Focus after that" input.
    expect(queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(getAllByRole('textbox')[1]);
  });
});
