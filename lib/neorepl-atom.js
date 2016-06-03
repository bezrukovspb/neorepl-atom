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
      'neorepl-atom:toggle': () => this.toggle()
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

  toggle() {
    console.log('NeoreplAtom was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
