/* global Y */

window.onload = function () {
  window.domBinding = new Y.DomBinding(window.yXmlType, document.body, { scrollingElement: document.scrollingElement })
}

let y = new Y('htmleditor', {
  connector: {
    name: 'websockets-client',
    url: 'http://127.0.0.1:1234'
  }
})

window.y = y
window.yXmlType = y.define('xml', Y.XmlFragment)
window.undoManager = new Y.utils.UndoManager(window.yXmlType, {
  captureTimeout: 500
})

document.onkeydown = function interceptUndoRedo (e) {
  if (e.keyCode === 90 && (e.metaKey || e.ctrlKey)) {
    if (!e.shiftKey) {
      window.undoManager.undo()
    } else {
      window.undoManager.redo()
    }
    e.preventDefault()
  }
}
