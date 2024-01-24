const JSONEditors = require('jsoneditor/dist/jsoneditor') // this is the multi-mode editor https://github.com/josdejong/jsoneditor
const GT = require('./GraphTool.js') // eslint-disable-line no-unused-vars
/**
 * @function showOptionsDefault inits the visjs events
 */
function initVisjsCallbacks () {
  // set visjs network callbacks

  this.network.on('click', (params) => {
    this.visOnClick(params)
  })

  this.network.on('doubleClick', (params) => {
    this.keyObject.doubleclick(params) // TODO: implement central callback object
  })

  this.network.on('oncontext', (params) => {
    params.event.preventDefault()
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
  params.nodes.forEach((nodeId) => {
    const node = this.nodes.get(nodeId)
    const position = this.network.getPosition(nodeId)
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
    params.nodes.forEach((nodeId, index) => {
      const node = this.nodes.get(nodeId)
      const position = this.network.getPosition(nodeId) // setting the current position is necessary to prevent snap-back to initial position

      node.x = position.x
      node.y = position.y

      // duplicate Node if ctrl is pressed
      if (params.event.srcEvent.ctrlKey) {
        // now: duplicate node and connect to original one. TODO: check if this should create a new node as property of the original.
        const newNode = this.duplicateNode(node)

        // added node shall move with cursor until button is released
        newNode.fixed = false
        newNode.id = config.graph.id // eslint-disable-line no-undef
        newNode.depth = this.nodes.get(this.network.getSelectedNodes()[index]).depth + 1
        config.graph.id += 1 // eslint-disable-line no-undef

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
function delay (ms) { // eslint-disable-line no-unused-vars
  return new Promise(resolve => setTimeout(resolve, ms))
}
/**
 *
 * @param {JSON} params visjs event params
 */
function visOnContext (params) {
  console.log(this.network.getPositions())
  /**
   * @function removeContextNodes removes the context nodes
   */
  const removeContextNodes = () => {
    this.nodes.get().forEach((node) => {
      if (node.id === 'AddNode' || node.id === 'Properties' || node.id === 'AddEdge' || node.id === 'Delete') {
        this.nodes.remove(node.id)
      }
    })
    // this.nodes.update(this.nodes.get())
  }
  /**
   *
   * @param {string} nodeID visjs node id
   * @returns {JSON} properties
   */
  const generatePropertiesForOnContext = (nodeID) => {
    this.finalplaceContext = this.dataFile
    const node = this.nodes.get(nodeID)
    const properties = {}

    for (let i = 0; i < node.path.length; i++) {
      this.finalplaceContext = this.finalplaceContext[node.path[i]]
    }
    if (typeof this.finalplaceContext !== 'string' && !Array.isArray(this.finalplaceContext)) {
      const keys = Object.keys(this.finalplaceContext)

      keys.forEach((key) => {
        if (node.context[key] && key !== 'type' && key !== 'label' && key !== 'keyValues') {
          if (node.context[key]['@id']) {
            properties[key] = node.context[key]['@id']
          }
          if (typeof node.context[key] === 'string') {
            properties[key] = node.context[key]
          }
        }

        if (!node.context[key] && key !== 'type' && key !== 'label' && key !== 'keyValues') {
          properties[key] = key
        }
      })
    }

    properties.keyValues = this.finalplaceContext

    return properties
  }

  const parentElement = document.getElementById('Graph0_vis_container')
  const childElement = parentElement.getElementsByClassName('vis-network')[0]

  if (childElement.getAttribute('listener') !== 'true') {
    childElement.setAttribute('listener', 'true')
    childElement.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        // console.log(this.drawer.colorObj)
        // console.log(this.edges.get())
        // console.log(this.finalplaceContext)
        // string
        // objekt
        // array strings
        // array objekte
        this.network.selectNodes([])

        const nodes = this.nodes.get()
        const edges = this.edges.get()

        nodes.forEach((node) => {
          if (this.network.getConnectedNodes(node.id).length !== 0) {
            node.color = this.contextMenuSavedColors[node.id]
            this.nodes.update(node)
          }
        })

        edges.forEach((edge) => {
          edge.color = this.contextMenuSavedColors[edge.id]
          this.edges.update(edge)
        })

        this.contextMenuSavedColors = {}
        // this.recolorByProperty()

        const pointerAt = { x: e.layerX, y: e.layerY }

        const nodeId = this.network.getNodeAt(pointerAt)

        if (nodeId === 'Delete') {
          removeContextNodes()
          if (this.nodeIdArray !== undefined && this.nodes.get(this.nodeIdArray).group !== 'root') {
            const conEdges = this.network.getConnectedEdges(this.nodeIdArray)
            this.deleteInJson({ nodes: [this.nodeIdArray], edges: conEdges }, 'node')
            this.options.manipulation.deleteNode({ nodes: [this.nodeIdArray], edges: conEdges }, () => {})
            // let selectionArray = []
            // this.edges.get().forEach((edge) => {
            //   if(edge.from === this.nodeIdArray){
            //     selectionArray.push(edge.to)
            //   }
            // })
            // this.network.selectNodes([this.nodeIdArray])
          }
          if (this.edgeIdArray !== undefined && this.nodeIdArray === undefined) {
            this.deleteInJson({ nodes: [], edges: [this.edgeIdArray] }, 'edge')
            this.options.manipulation.deleteNode({ nodes: [], edges: [this.edgeIdArray] }, () => {})
            // this.network.selectEdges([this.edgeIdArray])

            // this.network.selectNodes([this.nodes.get(this.edges.get(this.edgeIdArray).to).id])
          }
          // this.network.deleteSelected()
          this.network.selectNodes([])
          return
        }
        if (nodeId === 'AddNode') {
          removeContextNodes()
          this.options.manipulation.enabled = !this.options.manipulation.enabled
          this.options.manipulation.initiallyActive = !this.options.manipulation.initiallyActive
          this.network.setOptions(this.options)

          this.network.addNodeMode()
          return
        }
        if (nodeId === 'AddEdge') {
          removeContextNodes()
          this.options.manipulation.enabled = !this.options.manipulation.enabled
          this.options.manipulation.initiallyActive = !this.options.manipulation.initiallyActive
          this.network.setOptions(this.options)

          this.network.addEdgeMode()
          return
        }

        if (this.propertiesContext === undefined) {
          removeContextNodes()
          return
        }
        if (this.propertiesContext.includes(nodeId)) {
          if (typeof this.finalplaceContext[this.propertiesLang[nodeId]] === 'string') {
            // string
            let newNodeId
            let nodeExists = false
            let pathContext
            let labelContext
            if (this.finalplaceContext[this.propertiesLang[nodeId]].startsWith('Item:')) {
              if (this.nodes.get('jsondata/' + this.finalplaceContext[this.propertiesLang[nodeId]]) !== null) {
                nodeExists = true
              }
              if (this.dataFile.jsondata[this.finalplaceContext[this.propertiesLang[nodeId]]]) {
                this.dataFile.jsondata[this.finalplaceContext[this.propertiesLang[nodeId]]].label.forEach((label) => {
                  if (label.lang === this.drawer.config.lang) {
                    labelContext = label.text
                  }
                })
              } else {
                labelContext = this.finalplaceContext[this.propertiesLang[nodeId]]
              }

              newNodeId = 'jsondata/' + this.finalplaceContext[this.propertiesLang[nodeId]]
              pathContext = ['jsondata', this.finalplaceContext[this.propertiesLang[nodeId]]]
            } else {
              newNodeId = this.nodes.get(this.nodeIdArray).id + '/' + this.propertiesLang[nodeId]
              pathContext = newNodeId.split('/')
              labelContext = this.keyValuesContext[this.propertiesLang[nodeId]]
            }

            const depthObjectContext = this.nodes.get(this.nodeIdArray).id
            let colorContext

            if (this.drawer.colorObj[nodeId]) {
              colorContext = this.drawer.colorObj[nodeId]
            } else {
              colorContext = this.drawer.randomHSL()
              this.drawer.colorObj[nodeId] = colorContext
            }

            if (!nodeExists) {
              const newNode = {
                id: newNodeId,
                label: labelContext,
                path: pathContext,
                key: this.propertiesLang[nodeId],
                item: this.nodes.get(this.nodeIdArray).path[1],
                incomingLabels: [nodeId],
                context: this.nodes.get(this.nodeIdArray).context,
                depth: this.nodes.get(this.nodeIdArray).depth + 1,
                depthObject: {},
                color: colorContext,
                group: nodeId,
                fixed: false,
                physics: true,
                manuallyCreated: true
              }

              newNode.depthObject[depthObjectContext] = this.nodes.get(this.nodeIdArray).depth
              this.nodes.update(newNode)
            }

            const newEdge = {
              id: this.nodeIdArray + '=' + nodeId + '=>' + newNodeId,
              from: this.nodeIdArray,
              to: newNodeId,
              label: nodeId,
              color: colorContext,
              group: nodeId,
              manuallyCreated: true,
              objectKey: this.propertiesLang[nodeId]
            }

            this.edges.update(newEdge)
          }
          // not possible
          // if(Object.prototype.toString.call(this.finalplaceContext[this.propertiesLang[nodeId]]) === '[object Object]' &&
          // this.finalplaceContext[this.propertiesLang[nodeId]] !== null){
          //   console.log('objekt')
          // }

          if (Array.isArray(this.finalplaceContext[this.propertiesLang[nodeId]]) && typeof this.finalplaceContext[this.propertiesLang[nodeId]][0] === 'string') {
            // array strings
            for (let i = 0; i < this.finalplaceContext[this.propertiesLang[nodeId]].length; i++) {
              let newNodeId
              let nodeExists = false
              let pathContext
              let labelContext
              if (this.finalplaceContext[this.propertiesLang[nodeId]][i].startsWith('Item:')) {
                if (this.nodes.get('jsondata/' + this.finalplaceContext[this.propertiesLang[nodeId]][i]) !== null) {
                  nodeExists = true
                }
                if (this.dataFile.jsondata[this.finalplaceContext[this.propertiesLang[nodeId]][i]]) {
                  this.dataFile.jsondata[this.finalplaceContext[this.propertiesLang[nodeId]][i]].label.forEach((label) => {
                    if (label.lang === this.drawer.config.lang) {
                      labelContext = label.text
                    }
                  })
                } else {
                  labelContext = this.finalplaceContext[this.propertiesLang[nodeId]][i]
                }

                newNodeId = 'jsondata/' + this.finalplaceContext[this.propertiesLang[nodeId]][i]
                pathContext = ['jsondata', this.finalplaceContext[this.propertiesLang[nodeId]][i]]
              } else {
                newNodeId = this.nodes.get(this.nodeIdArray).id + '/' + this.propertiesLang[nodeId] + '/' + i
                pathContext = newNodeId.split('/')
                labelContext = this.keyValuesContext[this.propertiesLang[nodeId]][i]
              }

              const depthObjectContext = this.nodes.get(this.nodeIdArray).id
              let colorContext

              if (this.drawer.colorObj[nodeId]) {
                colorContext = this.drawer.colorObj[nodeId]
              } else {
                colorContext = this.drawer.randomHSL()
                this.drawer.colorObj[nodeId] = colorContext
              }

              if (!nodeExists) {
                let newNode = {
                  id: newNodeId,
                  label: labelContext,
                  path: pathContext,
                  key: this.propertiesLang[nodeId],
                  item: this.nodes.get(this.nodeIdArray).path[1],
                  incomingLabels: [nodeId],
                  context: this.nodes.get(this.nodeIdArray).context,
                  depth: this.nodes.get(this.nodeIdArray).depth + 1,
                  depthObject: {},
                  color: colorContext,
                  group: nodeId,
                  fixed: false,
                  physics: true,
                  manuallyCreated: true
                }

                newNode.depthObject[depthObjectContext] = this.nodes.get(this.nodeIdArray).depth
                this.nodes.update(newNode)
                newNode = {}
              }

              let newEdge = {
                id: this.nodeIdArray + '=' + nodeId + '=>' + newNodeId,
                from: this.nodeIdArray,
                to: newNodeId,
                label: nodeId,
                color: colorContext,
                group: nodeId,
                manuallyCreated: true,
                objectKey: this.propertiesLang[nodeId]
              }

              this.edges.update(newEdge)
              newEdge = {}
            }
          }

          if (Array.isArray(this.finalplaceContext[this.propertiesLang[nodeId]]) && (typeof this.finalplaceContext[this.propertiesLang[nodeId]][0] === 'object' && this.finalplaceContext[this.propertiesLang[nodeId]][0] !== null)) {
            // array objekte
            for (let i = 0; i < this.finalplaceContext[this.propertiesLang[nodeId]].length; i++) {
              const newNodeId = this.nodes.get(this.nodeIdArray).id + '/' + this.propertiesLang[nodeId] + '/' + i
              const depthObjectContext = this.nodes.get(this.nodeIdArray).id
              let colorContext
              if (this.drawer.colorObj[nodeId]) {
                colorContext = this.drawer.colorObj[nodeId]
              } else {
                colorContext = this.drawer.randomHSL()
                this.drawer.colorObj[nodeId] = colorContext
              }

              const newNode = {
                id: newNodeId,
                label: this.propertiesLang[nodeId],
                path: newNodeId.split('/'),
                key: this.propertiesLang[nodeId],
                item: this.nodes.get(this.nodeIdArray).path[1],
                incomingLabels: [nodeId],
                context: this.nodes.get(this.nodeIdArray).context,
                depth: this.nodes.get(this.nodeIdArray).depth + 1,
                depthObject: {},
                color: colorContext,
                group: nodeId,
                fixed: false,
                physics: true,
                manuallyCreated: true
                // color: this.colorObj[nodeId],
              }
              newNode.depthObject[depthObjectContext] = this.nodes.get(this.nodeIdArray).depth

              const newEdge = {
                id: this.nodeIdArray + '=' + nodeId + '=>' + newNodeId,
                from: this.nodeIdArray,
                to: newNodeId,
                label: nodeId,
                color: colorContext,
                group: nodeId,
                manuallyCreated: true,
                objectKey: this.propertiesLang[nodeId]
              }

              this.nodes.update(newNode)
              this.edges.update(newEdge)
            }
          }

          // let this.finalplaceContext = this.dataFile
          // let node = this.nodes.get(this.nodeIdArray)

          // for (let i = 0; i < node.path.length; i++) {
          //   this.finalplaceContext = this.finalplaceContext[node.path[i]]
          // }
          // if(typeof this.finalplaceContext !== 'string' && !Array.isArray(this.finalplaceContext)){

          // }

          // old  version
          // let copiedNode
          // let copiedEdge

          // this.edges.get().forEach((edge) => {
          //   if(edge.from === this.nodeIdArray && edge.label === nodeId){
          //     edge.hidden = false
          //     edge.manuallyCreated = true
          //     copiedEdge = JSON.parse(JSON.stringify(edge))

          //     let node = this.nodes.get(edge.to)
          //     node.hidden = false
          //     node.physics = true
          //     node.fixed = false
          //     node.manuallyCreated = true
          //     copiedNode = JSON.parse(JSON.stringify(node))
          //   }
          // })

          // old version
          // this.edges.get().forEach((edge) => {
          //   if(edge.from === this.nodeIdArray && !edge.manuallyCreated){
          //     this.edges.remove(edge.id)
          //     this.nodes.remove(edge.to)
          //   }
          // })

          this.properties = []
          // let node = this.nodes.get(nodeId)
          // node.fixed = false
          // node.physics = true
          // this.nodes.update(node)

          // old version
          // this.expandNodes({nodes: [this.nodeIdArray]})
          // this.nodes.update(copiedNode)
          // this.edges.update(copiedEdge)

          // this.network.off('hoverNode')
        }

        this.nodes.get().forEach((node) => {
          if (node.contextCreated) {
            this.nodes.remove(node.id)
          }
        })
      }
      removeContextNodes()
      this.createLegend()
    })
  }
  // on every context click
  const pointer = params.pointer.DOM
  const newNodes = []
  // Use getNodesAt to get the node IDs at the clicked position
  this.nodeIdArray = this.network.getNodeAt(pointer)
  this.edgeIdArray = this.network.getEdgeAt(pointer)
  let manipulationNodes

  if (this.nodeIdArray === undefined && this.edgeIdArray === undefined) {
    manipulationNodes = ['AddNode', 'AddEdge']
  }

  const nodes = this.nodes.get()
  const edges = this.edges.get()

  this.contextMenuSavedColors = {}

  nodes.forEach((node) => {
    if (this.network.getConnectedNodes(node.id).length !== 0) {
      this.contextMenuSavedColors[node.id] = node.color
      node.color = 'white'
      this.nodes.update(node)
    }
  })

  edges.forEach((edge) => {
    this.contextMenuSavedColors[edge.id] = edge.color
    edge.color = 'black'
    this.edges.update(edge)
  })

  if ((this.nodeIdArray !== undefined && this.edgeIdArray === undefined) || (this.nodeIdArray !== undefined && this.edgeIdArray !== undefined)) {
    // manipulationNodes = ["AddNode", "Properties","AddEdge", "Delete"]
    manipulationNodes = ['Delete', 'Properties']
  }

  if (this.nodeIdArray === undefined && this.edgeIdArray !== undefined) {
    manipulationNodes = ['Delete']
  }

  console.log('in this.network.on(oncontext)')

  // Function to add nodes around a specific node
  /**
 * @function addNodesAroundCenter adds nodes around a specific node
 */
  const addNodesAroundCenter = () => {
    const numNewNodes = manipulationNodes.length // Number of new nodes to add
    let heightOfShape
    let yPos
    let radius
    if (this.nodeIdArray === undefined) {
      radius = 100 // eslint-disable-line no-var
      heightOfShape = 0
    } else {
      radius = this.network.body.nodes[this.nodeIdArray].shape.radius * 2
      heightOfShape = this.network.body.nodes[this.nodeIdArray].shape.height / 2
    }
    yPos = [-50 + heightOfShape, 50 - heightOfShape] // eslint-disable-line prefer-const

    for (let i = 0; i < numNewNodes; i++) {
      const angle = (i / numNewNodes) * 2 * Math.PI // angle = (i / (numNewNodes - 1)) * (Math.PI / 2);
      const x = radius * Math.cos(angle) // eslint-disable-line no-unused-vars
      const y = radius * Math.sin(angle) // eslint-disable-line no-unused-vars

      const newNode = {
        id: manipulationNodes[0],
        label: manipulationNodes[0],
        x: params.pointer.canvas.x, // + x,
        y: params.pointer.canvas.y + yPos[0], // y,
        fixed: true,
        physics: false,
        contextCreated: true
      }
      newNodes.push(newNode.id)
      this.nodes.update(newNode)
      manipulationNodes.shift()
      yPos.shift()

      // await delay(25)
    }
  }
  // physics: false,
  this.nodes.get(this.nodeIdArray).fixed = true
  this.nodes.get(this.nodeIdArray).physics = true

  // old version
  // this.expandNodes({nodes: [this.nodeIdArray]})

  //   // Call the function to add nodes around the center
  addNodesAroundCenter()
  if (this.nodeIdArray !== undefined) {
    this.network.selectNodes([this.nodeIdArray], false)
  }
  this.network.selectNodes(newNodes, true)

  if (this.nodeIdArray !== undefined) {
    const propertiesObject = generatePropertiesForOnContext(this.nodeIdArray)
    this.keyValuesContext = propertiesObject.keyValues
    delete propertiesObject.keyValues
    this.propertiesContext = []
    this.propertiesLang = {}

    for (const key in propertiesObject) {
      if (this.dataFile.jsondata[propertiesObject[key]]) {
        this.dataFile.jsondata[propertiesObject[key]].label.forEach((label) => {
          if (label.lang === this.drawer.config.lang) {
            this.propertiesContext.push(label.text)
            this.propertiesLang[label.text] = key
          }
        })
      }

      if (!this.dataFile.jsondata[propertiesObject[key]]) {
        if (propertiesObject[key].startsWith('Property:')) {
          this.propertiesContext.push(propertiesObject[key].split(':')[1])
          this.propertiesLang[propertiesObject[key].split(':')[1]] = key
        } else {
          this.propertiesContext.push(key)
          this.propertiesLang[key] = key
        }
      }
    }
  }

  // old version
  // this.edges.get().forEach((edge) => {

  //   if(edge.from === this.nodeIdArray){
  //     edge.hidden = true
  //     this.edges.update(edge)
  //     let node = this.nodes.get(edge.to)
  //     node.hidden = true
  //     this.nodes.update(node)
  //   }

  //   })

  let hoverTimeout
  let nodesGenerated = true

  this.network.on('hoverNode', (params) => {
    if (this.nodeIdArray !== undefined) {
      const nodeId = params.node

      const length = this.propertiesContext.length

      hoverTimeout = setTimeout(() => {
        nodesGenerated = !nodesGenerated

        if (nodeId === 'Properties' && !nodesGenerated) {
          for (let i = 0; i < length; i++) {
            const newNode = {
              id: this.propertiesContext[i], // Assuming IDs start from 2
              label: this.propertiesContext[i],
              x: this.network.getPosition(nodeId).x,
              y: this.network.getPosition(nodeId).y + 50 * (i + 1),
              fixed: true,
              physics: false,
              contextCreated: true
            }
            this.nodes.update(newNode)
          // delay(25)
          }
        }

        if (nodesGenerated && nodeId === 'Properties') {
          const reversedArray = [...this.propertiesContext].reverse()

          reversedArray.forEach((node) => {
            this.nodes.remove(node)
          // delay(25)
          })
        }
      }, 500)
    }
    params = null
  })

  this.network.on('blurNode', (params) => {
    const nodeId = params.node

    if (nodeId === 'Properties') {
      clearTimeout(hoverTimeout)
    }
  })
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
    // todo: implement changes
    const setButton = document.getElementById(this.prefix + 'setButton') // eslint-disable-line no-unused-vars

    const options = {
      mode: 'tree',
      modes: ['code', 'tree'] // ['code', 'form', 'text', 'tree', 'view', 'preview']}
    }

    const editorDiv = document.getElementById(this.prefix + 'editor_div', options)
    // create a JSONEdior in options div
    const editor = new JSONEditors(editorDiv) // TODO: Editor is currently not rendered. find error.

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
