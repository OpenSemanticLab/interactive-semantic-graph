function keyUpEvent (event) {
  const index = this.pressed_keys.indexOf(event.key)
  if (index > -1) { // only splice array when item is found
    this.pressed_keys.splice(index, 1) // 2nd parameter means remove one item only
  }
}

function addKeyEventListeners () {
  document.addEventListener('keyup', (event) => {
    this.keyUpEvent(event)
  }, false)

  // keyboard callback functions
  document.addEventListener('keydown', (event) => {
    if (!this.pressed_keys.includes(event.key)) {
      this.pressed_keys.push(event.key)
    }
    // delete function
    if (event.key === 'Delete') {
      this.network.deleteSelected()
    }
    // copy
    if (event.key === 'c' && this.pressed_keys.includes('Control')) {
      // copy nodes
      this.copyNodesEdges()
    }
    // paste
    if (event.key === 'v' && this.pressed_keys.includes('Control')) {
      // paste copied nodes
      this.pasteNodeEdges(this.copiedNodes, this.copiedEdges)
    }
  }, false)
}

function addContainerEventListeners (container) {
  container.addEventListener('dragenter', function (e) {
    e.preventDefault()

    container.style.border = '1px solid black'
    // container.style.cssText = "border: 5px solid lightgray"
  }, false)
  container.addEventListener('dragleave', function (e) {
    container.style.border = '1px solid lightgray'
  }, false)
  container.addEventListener('drop', function (e) {
    e.preventDefault()
    handleDrop(e) // eslint-disable-line no-undef
  }, false)
  container.addEventListener('dragover', function (e) {
    e.preventDefault()
  }, false)
}

export {
  addKeyEventListeners,
  keyUpEvent,
  addContainerEventListeners

}
