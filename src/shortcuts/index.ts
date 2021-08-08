import { Editor } from '../editor';

import moveShortcuts from './move';
import copyLineShortcuts from './copyLine';
import copyCursorShortcuts from './copyCursor';
import clipboardShortcuts from './clipboard';
import commonShortcuts from './common';

export interface KeyboardShortcut {
  key?: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;

  name: string;
  description?: string;
  exec: (editor: Editor, event: KeyboardEvent) => unknown;
}

const shortcuts: KeyboardShortcut[] = [];
shortcuts.push(...moveShortcuts);
shortcuts.push(...copyLineShortcuts);
shortcuts.push(...copyCursorShortcuts);
shortcuts.push(...clipboardShortcuts);
shortcuts.push(...commonShortcuts);

export default shortcuts;