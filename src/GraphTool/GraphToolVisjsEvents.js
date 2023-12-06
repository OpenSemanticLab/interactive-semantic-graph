const JSONEditors = require('jsoneditor/dist/jsoneditor') // this is the multi-mode editor https://github.com/josdejong/jsoneditor

function initVisjsCallbacks () {
  // set visjs network callbacks

  this.network.on('click', (params) => {
    this.visOnClick(params)
  })

  this.network.on('doubleClick', (params) => {
    this.keyObject.doubleclick(params) // TODO: implement central callback object
  })

  this.network.on('oncontext', (params) => {
    params.event.preventDefault();
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
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function visOnContext (params) {
  document.getElementById('Graph0_vis_container').addEventListener('mouseup', (e) => {
    this.nodes.get().forEach((node) => {
      if(node.contextCreated){
        this.network.selectNodes([node.id], false);
        this.nodes.remove(node.id)
      }
    })
  })

  var pointer = params.pointer.DOM;
  let newNodes = [];
  // Use getNodesAt to get the node IDs at the clicked position
  var nodeIdArray = this.network.getNodeAt(pointer);
  console.log(params)

  let nodes = this.nodes.get()
  let edges = this.edges.get()

  // nodes.forEach((node) => {
  //   node.color = 'white'
  //   this.nodes.update(node)
  // })

  // edges.forEach((edge) => {
  //   edge.color = 'black'
  //   this.edges.update(edge)
  // })
  let manipulationNodes = ["AddNode", "Properties","AddEdge", "Delete"]

  console.log('in this.network.on(oncontext)')
  console.log(this.network.body.nodes[nodeIdArray])
// Function to add nodes around a specific node
  let addNodesAroundCenter = async () => {
    var numNewNodes = 4; // Number of new nodes to add
    var radius = this.network.body.nodes[nodeIdArray].shape.radius * 2; // Radius of the circle around the center node

    for (var i = 0; i < numNewNodes; i++) {

      var angle = (i / numNewNodes) * 2 * Math.PI; //angle = (i / (numNewNodes - 1)) * (Math.PI / 2);
      var x = radius * Math.cos(angle);
      var y = radius * Math.sin(angle);

      var newNode = {
        id: manipulationNodes[0], // Assuming IDs start from 2
        label: manipulationNodes[0],
        x: params.pointer.canvas.x + x,
        y: params.pointer.canvas.y + y,
        fixed: true,
        physics: false,
        contextCreated: true,
      };
      newNodes.push(newNode.id);
      this.nodes.update(newNode);
      manipulationNodes.shift();

      await delay(25)
    }
  }

//   // Call the function to add nodes around the center
   addNodesAroundCenter();
   this.network.selectNodes([nodeIdArray], false);
   this.network.selectNodes(newNodes, true);

  let properties = ["AddNode1", "Properties1","AddEdge1", "Delete1"]
  let hoverTimeout
  let nodesGenerated = true

  this.network.on('hoverNode', (params) => {
    
    const nodeId = params.node;
    
    let length = 4

    hoverTimeout = setTimeout( () => {
    nodesGenerated = !nodesGenerated

    if(nodeId === "Properties" && !nodesGenerated){
      for (var i = 0; i < length; i++) {
        let newNode = {
          id: properties[i], // Assuming IDs start from 2
          label: properties[i],
          x: this.network.getPosition(nodeId).x,
          y: this.network.getPosition(nodeId).y + 50 * (i + 1),
          fixed: true,
          physics: false,
          contextCreated: true,
        };
        this.nodes.update(newNode);
        delay(25)
      }

    }

    if(nodesGenerated && nodeId === "Properties"){
      let reversedArray = [...properties].reverse();

      reversedArray.forEach((node) => {
        this.nodes.remove(node)
        delay(25)
      })

    }
  }, 500)

  })

  this.network.on('blurNode', (params) => {
    
    const nodeId = params.node

    if(nodeId === "Properties"){
      clearTimeout(hoverTimeout)
    }
  });
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
