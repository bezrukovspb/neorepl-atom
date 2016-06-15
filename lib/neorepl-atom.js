'use babel';

import NeoreplAtomView from './neorepl-atom-view';
import { CompositeDisposable } from 'atom';

export default {

  neoreplAtomView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.neoreplAtomView = new NeoreplAtomView(state.neoreplAtomViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.neoreplAtomView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'neorepl-atom:eval': () => this.neoreplEval()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.neoreplAtomView.destroy();
  },

  serialize() {
    return {
      neoreplAtomViewState: this.neoreplAtomView.serialize()
    };
  },

  coordsToPosition(row, col, code) {
    // row and col are 0 based.
    return code.split("\n").filter((it, currentRowNumber) => {
        return currentRowNumber < row;
      }).reduce((sum, it) => {
        return sum + it.length + 1/*\n*/;
      }, 0) - 1/*-\n*/ + col;
  },

  neoreplEval() {
    const child_process = require("child_process");

    const editor = atom.workspace.getActiveTextEditor();
    const replPath = editor.getPath();
    const code = editor.getText();
    const cursorCoords = editor.getCursorBufferPosition();
    const currentPosition = this.coordsToPosition(cursorCoords.row, cursorCoords.column, code);

    const cmd = `neorepl --repl-position=${currentPosition} --repl-path="${replPath}"`;
    const answer = child_process.execSync(cmd, {input: code,
                                                encoding: "utf8",
                                                timeout: 15 * 1000})

    console.log(answer);
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
