import { wait, initArrays, compareUsers, Y, flushAll, applyRandomTests } from '../../yjs/tests-lib/helper.js'
import { test } from 'cutest'

test('set property', async function xml0 (t) {
  var { users, xml0, xml1 } = await initArrays(t, { users: 2 })
  xml0.setAttribute('height', '10')
  t.assert(xml0.getAttribute('height') === '10', 'Simple set+get works')
  await flushAll(t, users)
  t.assert(xml1.getAttribute('height') === '10', 'Simple set+get works (remote)')
  await compareUsers(t, users)
})

test('events', async function xml1 (t) {
  var { users, xml0, xml1 } = await initArrays(t, { users: 2 })
  var event
  var remoteEvent
  xml0.observe(function (e) {
    delete e._content
    delete e.nodes
    delete e.values
    event = e
  })
  xml1.observe(function (e) {
    delete e._content
    delete e.nodes
    delete e.values
    remoteEvent = e
  })
  xml0.setAttribute('key', 'value')
  t.assert(event.attributesChanged.has('key'), 'YXmlEvent.attributesChanged on updated key')
  await flushAll(t, users)
  t.assert(remoteEvent.attributesChanged.has('key'), 'YXmlEvent.attributesChanged on updated key (remote)')
  // check attributeRemoved
  xml0.removeAttribute('key')
  t.assert(event.attributesChanged.has('key'), 'YXmlEvent.attributesChanged on removed attribute')
  await flushAll(t, users)
  t.assert(remoteEvent.attributesChanged.has('key'), 'YXmlEvent.attributesChanged on removed attribute (remote)')
  xml0.insert(0, [new Y.XmlText('some text')])
  t.assert(event.childListChanged, 'YXmlEvent.childListChanged on inserted element')
  await flushAll(t, users)
  t.assert(remoteEvent.childListChanged, 'YXmlEvent.childListChanged on inserted element (remote)')
  // test childRemoved
  xml0.delete(0)
  t.assert(event.childListChanged, 'YXmlEvent.childListChanged on deleted element')
  await flushAll(t, users)
  t.assert(remoteEvent.childListChanged, 'YXmlEvent.childListChanged on deleted element (remote)')
  await compareUsers(t, users)
})

test('attribute modifications (y -> dom)', async function xml2 (t) {
  var { users, xml0, dom0 } = await initArrays(t, { users: 3 })
  xml0.setAttribute('height', '100px')
  await wait()
  t.assert(dom0.getAttribute('height') === '100px', 'setAttribute')
  xml0.removeAttribute('height')
  await wait()
  t.assert(dom0.getAttribute('height') == null, 'removeAttribute')
  xml0.setAttribute('class', 'stuffy stuff')
  await wait()
  t.assert(dom0.getAttribute('class') === 'stuffy stuff', 'set class attribute')
  await compareUsers(t, users)
})

test('attribute modifications (dom -> y)', async function xml3 (t) {
  var { users, xml0, dom0 } = await initArrays(t, { users: 3 })
  dom0.setAttribute('height', '100px')
  await wait()
  t.assert(xml0.getAttribute('height') === '100px', 'setAttribute')
  dom0.removeAttribute('height')
  await wait()
  t.assert(xml0.getAttribute('height') == null, 'removeAttribute')
  dom0.setAttribute('class', 'stuffy stuff')
  await wait()
  t.assert(xml0.getAttribute('class') === 'stuffy stuff', 'set class attribute')
  await compareUsers(t, users)
})

test('element insert (dom -> y)', async function xml4 (t) {
  var { users, xml0, dom0 } = await initArrays(t, { users: 3 })
  dom0.insertBefore(document.createTextNode('some text'), null)
  dom0.insertBefore(document.createElement('p'), null)
  await wait()
  t.assert(xml0.get(0).toString() === 'some text', 'Retrieve Text Node')
  t.assert(xml0.get(1).nodeName === 'P', 'Retrieve Element node')
  await compareUsers(t, users)
})

test('element insert (y -> dom)', async function xml5 (t) {
  var { users, xml0, dom0 } = await initArrays(t, { users: 3 })
  xml0.insert(0, [new Y.XmlText('some text')])
  xml0.insert(1, [new Y.XmlElement('p')])
  t.assert(dom0.childNodes[0].textContent === 'some text', 'Retrieve Text node')
  t.assert(dom0.childNodes[1].nodeName === 'P', 'Retrieve Element node')
  await compareUsers(t, users)
})

test('y on insert, then delete (dom -> y)', async function xml6 (t) {
  var { users, xml0, dom0 } = await initArrays(t, { users: 3 })
  dom0.insertBefore(document.createElement('p'), null)
  await wait()
  t.assert(xml0.length === 1, 'one node present')
  dom0.childNodes[0].remove()
  await wait()
  t.assert(xml0.length === 0, 'no node present after delete')
  await compareUsers(t, users)
})

test('y on insert, then delete (y -> dom)', async function xml7 (t) {
  var { users, xml0, dom0 } = await initArrays(t, { users: 3 })
  xml0.insert(0, [new Y.XmlElement('p')])
  t.assert(dom0.childNodes[0].nodeName === 'P', 'Get inserted element from dom')
  xml0.delete(0, 1)
  t.assert(dom0.childNodes.length === 0, '#childNodes is empty after delete')
  await compareUsers(t, users)
})

test('delete consecutive (1) (Text)', async function xml8 (t) {
  var { users, xml0, dom0 } = await initArrays(t, { users: 3 })
  xml0.insert(0, [new Y.XmlText('1'), new Y.XmlText('2'), new Y.XmlText('3')])
  await wait()
  xml0.delete(1, 2)
  await wait()
  t.assert(xml0.length === 1, 'check length (y)')
  t.assert(dom0.childNodes.length === 1, 'check length (dom)')
  t.assert(dom0.childNodes[0].textContent === '1', 'check content')
  await compareUsers(t, users)
})

test('delete consecutive (2) (Text)', async function xml9 (t) {
  var { users, xml0, dom0 } = await initArrays(t, { users: 3 })
  xml0.insert(0, [new Y.XmlText('1'), new Y.XmlText('2'), new Y.XmlText('3')])
  await wait()
  xml0.delete(0, 1)
  xml0.delete(1, 1)
  await wait()
  t.assert(xml0.length === 1, 'check length (y)')
  t.assert(dom0.childNodes.length === 1, 'check length (dom)')
  t.assert(dom0.childNodes[0].textContent === '2', 'check content')
  await compareUsers(t, users)
})

test('delete consecutive (1) (Element)', async function xml10 (t) {
  var { users, xml0, dom0 } = await initArrays(t, { users: 3 })
  xml0.insert(0, [new Y.XmlElement('A'), new Y.XmlElement('B'), new Y.XmlElement('C')])
  await wait()
  xml0.delete(1, 2)
  await wait()
  t.assert(xml0.length === 1, 'check length (y)')
  t.assert(dom0.childNodes.length === 1, 'check length (dom)')
  t.assert(dom0.childNodes[0].nodeName === 'A', 'check content')
  await compareUsers(t, users)
})

test('delete consecutive (2) (Element)', async function xml11 (t) {
  var { users, xml0, dom0 } = await initArrays(t, { users: 3 })
  xml0.insert(0, [new Y.XmlElement('A'), new Y.XmlElement('B'), new Y.XmlElement('C')])
  await wait()
  xml0.delete(0, 1)
  xml0.delete(1, 1)
  await wait()
  t.assert(xml0.length === 1, 'check length (y)')
  t.assert(dom0.childNodes.length === 1, 'check length (dom)')
  t.assert(dom0.childNodes[0].nodeName === 'B', 'check content')
  await compareUsers(t, users)
})

test('Receive a bunch of elements (with disconnect)', async function xml12 (t) {
  var { users, xml0, xml1, dom0, dom1 } = await initArrays(t, { users: 3 })
  users[1].disconnect()
  xml0.insert(0, [new Y.XmlElement('A'), new Y.XmlElement('B'), new Y.XmlElement('C')])
  xml0.insert(0, [new Y.XmlElement('X'), new Y.XmlElement('Y'), new Y.XmlElement('Z')])
  await users[1].reconnect()
  await flushAll(t, users)
  t.assert(xml0.length === 6, 'check length (y)')
  t.assert(xml1.length === 6, 'check length (y) (reconnected user)')
  t.assert(dom0.childNodes.length === 6, 'check length (dom)')
  t.assert(dom1.childNodes.length === 6, 'check length (dom) (reconnected user)')
  await compareUsers(t, users)
})

test('move element to a different position', async function xml13 (t) {
  var { users, dom0, dom1 } = await initArrays(t, { users: 3 })
  dom0.append(document.createElement('div'))
  dom0.append(document.createElement('h1'))
  await flushAll(t, users)
  dom1.insertBefore(dom1.childNodes[0], null)
  t.assert(dom1.childNodes[0].nodeName === 'H1', 'div was deleted (user 0)')
  t.assert(dom1.childNodes[1].nodeName === 'DIV', 'div was moved to the correct position (user 0)')
  t.assert(dom1.childNodes[0].nodeName === 'H1', 'div was deleted (user 1)')
  t.assert(dom1.childNodes[1].nodeName === 'DIV', 'div was moved to the correct position (user 1)')
  await compareUsers(t, users)
})

test('filter node', async function xml14 (t) {
  var { users, dom0, dom1, domBinding0, domBinding1 } = await initArrays(t, { users: 3 })
  let domFilter = (nodeName, attrs) => {
    if (nodeName === 'H1') {
      return null
    } else {
      return attrs
    }
  }
  domBinding0.setFilter(domFilter)
  domBinding1.setFilter(domFilter)
  dom0.append(document.createElement('div'))
  dom0.append(document.createElement('h1'))
  await flushAll(t, users)
  t.assert(dom1.childNodes.length === 1, 'Only one node was not transmitted')
  t.assert(dom1.childNodes[0].nodeName === 'DIV', 'div node was transmitted')
  await compareUsers(t, users)
})

test('filter attribute', async function xml15 (t) {
  var { users, dom0, dom1, domBinding0, domBinding1 } = await initArrays(t, { users: 3 })
  let domFilter = (nodeName, attrs) => {
    attrs.delete('hidden')
    return attrs
  }
  domBinding0.setFilter(domFilter)
  domBinding1.setFilter(domFilter)
  dom0.setAttribute('hidden', 'true')
  dom0.setAttribute('style', 'height: 30px')
  dom0.setAttribute('data-me', '77')
  await flushAll(t, users)
  t.assert(dom0.getAttribute('hidden') === 'true', 'User 0 still has the attribute')
  t.assert(dom1.getAttribute('hidden') == null, 'User 1 did not receive update')
  t.assert(dom1.getAttribute('style') === 'height: 30px', 'User 1 received style update')
  t.assert(dom1.getAttribute('data-me') === '77', 'User 1 received data update')
  await compareUsers(t, users)
})

test('deep element insert', async function xml16 (t) {
  var { users, dom0, dom1 } = await initArrays(t, { users: 3 })
  let deepElement = document.createElement('p')
  let boldElement = document.createElement('b')
  let attrElement = document.createElement('img')
  attrElement.setAttribute('src', 'http:localhost:8080/nowhere')
  boldElement.append(document.createTextNode('hi'))
  deepElement.append(boldElement)
  deepElement.append(attrElement)
  dom0.append(deepElement)
  let str0 = dom0.outerHTML
  await flushAll(t, users)
  let str1 = dom1.outerHTML
  t.compare(str0, str1, 'Dom string representation matches')
  await compareUsers(t, users)
})

test('treeWalker', async function xml17 (t) {
  var { users, xml0 } = await initArrays(t, { users: 3 })
  let paragraph1 = new Y.XmlElement('p')
  let paragraph2 = new Y.XmlElement('p')
  let text1 = new Y.XmlText('init')
  let text2 = new Y.XmlText('text')
  paragraph1.insert(0, [text1, text2])
  xml0.insert(0, [paragraph1, paragraph2, new Y.XmlElement('img')])
  let allParagraphs = xml0.querySelectorAll('p')
  t.assert(allParagraphs.length === 2, 'found exactly two paragraphs')
  t.assert(allParagraphs[0] === paragraph1, 'querySelectorAll found paragraph1')
  t.assert(allParagraphs[1] === paragraph2, 'querySelectorAll found paragraph2')
  t.assert(xml0.querySelector('p') === paragraph1, 'querySelector found paragraph1')
  await compareUsers(t, users)
})

/**
 * The expected behavior is that changes on your own dom (e.g. malicious attributes) persist.
 * Yjs should just ignore them, never propagate those attributes.
 * Incoming changes that contain malicious attributes should be deleted.
 */
test('Filtering remote changes', async function xmlFilteringRemote (t) {
  var { users, xml0, xml1, domBinding0 } = await initArrays(t, { users: 3 })
  domBinding0.setFilter(function (nodeName, attributes) {
    attributes.delete('malicious')
    if (nodeName === 'HIDEME') {
      return null
    } else if (attributes.has('isHidden')) {
      return null
    } else {
      return attributes
    }
  })
  let paragraph = new Y.XmlElement('p')
  let hideMe = new Y.XmlElement('hideMe')
  let span = new Y.XmlElement('span')
  span.setAttribute('malicious', 'alert("give me money")')
  let tag = new Y.XmlElement('tag')
  tag.setAttribute('isHidden', 'true')
  paragraph.insert(0, [hideMe, span, tag])
  xml0.insert(0, [paragraph])
  let tag2 = new Y.XmlElement('tag')
  tag2.setAttribute('isHidden', 'true')
  paragraph.insert(0, [tag2])
  await flushAll(t, users)
  // check dom
  domBinding0.typeToDom.get(paragraph).setAttribute('malicious', 'true')
  domBinding0.typeToDom.get(span).setAttribute('malicious', 'true')
  // check incoming attributes
  xml1.get(0).get(0).setAttribute('malicious', 'true')
  xml1.insert(0, [new Y.XmlElement('hideMe')])
  await flushAll(t, users)

  await compareUsers(t, users)
})

// TODO: move elements
var xmlTransactions = [
  function attributeChange (t, user, chance) {
    user.dom.setAttribute(chance.word(), chance.word())
  },
  function attributeChangeHidden (t, user, chance) {
    user.dom.setAttribute('hidden', chance.word())
  },
  function insertText (t, user, chance) {
    let dom = user.dom
    var succ = dom.children.length > 0 ? chance.pickone(dom.children) : null
    dom.insertBefore(document.createTextNode(chance.word()), succ)
  },
  function insertHiddenDom (t, user, chance) {
    let dom = user.dom
    var succ = dom.children.length > 0 ? chance.pickone(dom.children) : null
    dom.insertBefore(document.createElement('hidden'), succ)
  },
  function insertDom (t, user, chance) {
    let dom = user.dom
    var succ = dom.children.length > 0 ? chance.pickone(dom.children) : null
    dom.insertBefore(document.createElement(chance.word()), succ)
  },
  function deleteChild (t, user, chance) {
    let dom = user.dom
    if (dom.childNodes.length > 0) {
      var d = chance.pickone(dom.childNodes)
      d.remove()
    }
  },
  function insertTextSecondLayer (t, user, chance) {
    let dom = user.dom
    if (dom.children.length > 0) {
      let dom2 = chance.pickone(dom.children)
      let succ = dom2.childNodes.length > 0 ? chance.pickone(dom2.childNodes) : null
      dom2.insertBefore(document.createTextNode(chance.word()), succ)
    }
  },
  function insertDomSecondLayer (t, user, chance) {
    let dom = user.dom
    if (dom.children.length > 0) {
      let dom2 = chance.pickone(dom.children)
      let succ = dom2.childNodes.length > 0 ? chance.pickone(dom2.childNodes) : null
      dom2.insertBefore(document.createElement(chance.word()), succ)
    }
  },
  function deleteChildSecondLayer (t, user, chance) {
    let dom = user.dom
    if (dom.children.length > 0) {
      let dom2 = chance.pickone(dom.children)
      if (dom2.childNodes.length > 0) {
        let d = chance.pickone(dom2.childNodes)
        d.remove()
      }
    }
  }
]

test('y-xml: Random tests (10)', async function xmlRandom10 (t) {
  await applyRandomTests(t, xmlTransactions, 10)
})

test('y-xml: Random tests (42)', async function xmlRandom42 (t) {
  await applyRandomTests(t, xmlTransactions, 42)
})

test('y-xml: Random tests (43)', async function xmlRandom43 (t) {
  await applyRandomTests(t, xmlTransactions, 43)
})

test('y-xml: Random tests (44)', async function xmlRandom44 (t) {
  await applyRandomTests(t, xmlTransactions, 44)
})

test('y-xml: Random tests (45)', async function xmlRandom45 (t) {
  await applyRandomTests(t, xmlTransactions, 45)
})

test('y-xml: Random tests (46)', async function xmlRandom46 (t) {
  await applyRandomTests(t, xmlTransactions, 46)
})

test('y-xml: Random tests (47)', async function xmlRandom47 (t) {
  await applyRandomTests(t, xmlTransactions, 47)
})

test('y-xml: Random tests (100)', async function xmlRandom100 (t) {
  await applyRandomTests(t, xmlTransactions, 100)
})

test('y-xml: Random tests (200)', async function xmlRandom200 (t) {
  await applyRandomTests(t, xmlTransactions, 200)
})

test('y-xml: Random tests (500)', async function xmlRandom500 (t) {
  await applyRandomTests(t, xmlTransactions, 500)
})

test('y-xml: Random tests (1000)', async function xmlRandom1000 (t) {
  await applyRandomTests(t, xmlTransactions, 1000)
})
