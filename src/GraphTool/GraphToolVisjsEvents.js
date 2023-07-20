function initVisjsCallbacks () {
  // set visjs network callbacks

  this.network.on('click', (params) => {
    this.visOnClick(params)
  })

  this.network.on('doubleClick', (params) => {
    this.keyObject.doubleclick(params) // TODO: implement central callback object
  })

  this.network.on('oncontext', (params) => {
    this.visOnContext(params) // TODO: implement right click, probably Property-List, but as callback function.
  })

  this.network.on('dragStart', (params) => {
    this.visOnDragStart(params)
  })

  this.network.on('dragEnd', (params) => {
    this.visOnDragEnd(params)
  })
}

function visOnDragEnd (params) {
  params.nodes.forEach((node_id) => {
    const node = this.nodes.get(node_id)
    const position = this.network.getPosition(node_id)
    // setting the current position is necessary to prevent snap-back to initial position
    node.x = position.x
    node.y = position.y
    node.fixed = true
    this.nodes.update(node)
  })
  // show selection options if multiple nodes are selected i.e. not a single one was dragged
  if (this.network.getSelectedNodes().length > 0) {
    this.showSelectionOptions()
  }
}

function visOnDragStart (params) {
  if (params.nodes.length > 0) {
    const newNodeIds = []
    params.nodes.forEach((node_id, index) => {
      const node = this.nodes.get(node_id)
      const position = this.network.getPosition(node_id) // setting the current position is necessary to prevent snap-back to initial position

      node.x = position.x
      node.y = position.y

      // duplicate Node if ctrl is pressed
      if (params.event.srcEvent.ctrlKey) {
        // now: duplicate node and connect to original one. TODO: check if this should create a new node as property of the original.
        const newNode = this.duplicateNode(node)

        // added node shall move with cursor until button is released
        newNode.fixed = false
        newNode.id = config.graph.id
        newNode.depth = this.nodes.get(this.network.getSelectedNodes()[index]).depth + 1
        config.graph.id += 1

        this.copiedEdges = this.network.getSelectedEdges()

        const newEdge = {
          from: node.id,
          to: newNode.id,
          label: 'InitializedByCopyFrom', // this.edges.get(this.copiedEdges[index]).label,
          color: newNode.color,
          group: newNode.group
        }

        this.nodes.update(newNode)
        this.edges.update(newEdge) // {from: node.id, to: newNode.id}
        newNodeIds.push(newNode.id)
      } else {
        node.fixed = false
        this.nodes.update(node)
      }
    })
    if (params.event.srcEvent.ctrlKey) {
      this.network.setSelection({
        nodes: newNodeIds
      })
    }
  }
}

function visOnContext (params) {
  console.log('in this.network.on(oncontext)')
}

function visOnClick (params) {
  this.showSelectionOptions()
  // TODO: move definition of keyboard shortcuts to this.registerKeyboardShortcuts
  if (this.pressed_keys.includes('a')) {
    // add a node to position of mouse if a is pressed during click
    // let addNode = new NodeClasses.BaseNode(this)
    // addNode.x = params.pointer.canvas.x
    // addNode.y = params.pointer.canvas.y
    // this.nodes.update(addNode)
  }

  if (this.pressed_keys.includes('q')) {
    // show global JSON vis JSONeditor in options div

    const optionsDivId = this.options_container.id

    document.getElementById(optionsDivId).innerHTML = "<button id='" + this.prefix + "setButton'>set!</button><br><div id='" + this.prefix + "editor_div'></div>"
    const setButton = document.getElementById(this.prefix + 'setButton') // todo: implement changes

    const options = {
      mode: 'tree',
      modes: ['code', 'tree'] // ['code', 'form', 'text', 'tree', 'view', 'preview']}
    }

    const editor_div = document.getElementById(this.prefix + 'editor_div', options)
    // create a JSONEdior in options div
    const editor = new JSONEditors(editor_div) // TODO: Editor is currently not rendered. find error.

    editor.set({
      edges: this.edges.get(),
      nodes: this.nodes.get()
    })
  }
}

export {
  visOnDragEnd,
  visOnDragStart,
  visOnContext,
  visOnClick,
  initVisjsCallbacks

}
