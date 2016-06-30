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

  positionToCoords(position, code) {
    let row = 0;
    let col = 0;

    for (let i = 0; i < code.length && i < position; i++) {
      if (code.charAt(i) === "\n") {
        row++;
        col = 0;
      } else {
        col++;
      }
    }

    return {row: row, col: col};
  },

  showResult(result, start, end) {
    var e = atom.workspace.getActiveTextEditor();
    var m = e.markBufferRange([[start.row, start.col], [end.row, end.col]], {invalidate: "touch"});
    var el = document.createElement("span");

    el.innerHTML = result;
    el.style.backgroundColor = "lightyellow";
    el.style.color = "black";
    e.decorateMarker(m, {type: 'block', item: el, position: "after"});
    e.decorateMarker(m, {type: 'line-number', class: "line-number-green"});


    e.onDidChange(() => {
     e.getMarkers().forEach((it) => it.destroy())
    });
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
    const ans = JSON.parse(answer);

    const start = this.positionToCoords(ans.start, code);
    const end = this.positionToCoords(ans.end, code);

    this.showResult(ans.result, start, end);
  }

};
