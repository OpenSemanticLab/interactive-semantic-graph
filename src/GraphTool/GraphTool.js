const vis = require('vis-network/standalone/esm/index.js')
const utils = require('../utils.js')
const GTHelper = require('./GraphToolHelper.js')
// const NodeClasses = require("./NodeClasses.js")    // this causes firefox hanging.
// const RegExp = require('RegExp');
const G = require('../Graph/Graph.js')
const GTContainers = require('./GraphToolContainers.js')
const GTVisjsEvents = require('./GraphToolVisjsEvents.js')
const GTCopyPaste = require('./GraphToolCopyPaste.js')
const GTEventListeners = require('./GraphToolEventListeners.js')
const GTDragAndDrop = require('./GraphToolDragAndDrop.js')
const GTNodeOptions = require('./GraphToolNodeOptions.js')
const GTVisualSearch = require('./GraphToolVisualSearch.js')
const GTDeepSearch = require('./GraphToolDeepSearch.js')
const GTColoring = require('./GraphToolColoring.js')
const GTAlgorithms = require('./GraphToolAlgorithms.js')
const GTLegend = require('./GraphToolLegend.js')
const GTLoadSave = require('./GraphToolLoadSave.js')
const GTManipulation = require('./GraphToolManipulation.js')

/**
 * @class GraphTool
 * @classdesc This class is used to create a graph into the given div while using visjs.
 * @param {JSON} file Main file with JSON data
 * @param {JSON} config JSON config for the graph
 * @param {JSON} callbackConfig JSON config file for callbacks
 */
class GraphTool {
  static instanceCount = 0

  constructor (divId, config, callbackConfig) {
    if ((divId || config) === undefined) {
      return
    }

    this.BindToClass(GTHelper, this)
    this.BindToClass(GTContainers, this)
    this.BindToClass(GTEventListeners, this)
    this.BindToClass(GTDragAndDrop, this)
    this.BindToClass(GTNodeOptions, this)
    this.BindToClass(GTDeepSearch, this)
    this.BindToClass(GTVisualSearch, this)
    this.BindToClass(GTAlgorithms, this)
    this.BindToClass(GTLegend, this)
    this.BindToClass(GTLoadSave, this)

    this.graphContainerId = divId

    this.prefix = 'Graph' + GraphTool.instanceCount + '_'

    GraphTool.instanceCount += 1

    const defaultConfig = {
      callbacks: {
        loadState: (e) => this.loadStateDefault(e),
        onBeforeSearchNodes: [(graph, searchString) => true],
        onBeforeRecolorByProperty: [(graph) => true],
        onBeforeColorByValue: [(graph, colorByValueArgs) => true],
        onBeforeInitGraphContainers: [(graph, divId) => true],
        onBeforeColorPicker: [(graph, colorPickerArgs) => true],
        onBeforeInitDeepSearch: [(graph, container) => true],
        onBeforeCopyNodesEdges: [(graph) => true],
        onBeforePasteNodesEdges: [(graph, copiedNodes, copiedEdges) => true],
        onBeforeDeepSearch: [(graph, searchValue) => true],
        onBeforeLegendFunctionality: [(graph, e) => true],
        onBeforeCreateLegend: [(graph) => true],
        onBeforeCreateSaveStateFunctionality: [(graph) => true],
        onBeforeCreateLoadStateFunctionality: [(graph) => true],
        onBeforeCreateSearchUI: [(graph, container) => true]

      }
    }

    this.config = utils.mergeDeep(defaultConfig, callbackConfig) // overwrite default config with user callbackConfig

    this.initGraphContainers(divId)
    this.drawer = config.drawer

    this.clicked = {} // object to store expanded nodes TODO: rename to expandedNodes

    this.keyObject = { // to be removed, was inteded for callback implementation
      doubleclick: (params) => {
        this.expandNodes(params)
      }
    }
    // create a visjs network and attatch it to div

    this.nodes = this.drawer.nodes // new vis.DataSet(config.nodes)

    this.edges = this.drawer.edges // new vis.DataSet(config.edges)
    this.data = {
      nodes: this.nodes,
      edges: this.edges
    }
    this.options = config.options
    this.options.manipulation.enabled = false
    this.options.manipulation.initiallyActive = false
    this.network = new vis.Network(this.vis_container, this.data, this.options)
    this.BindToClass(GTManipulation, this)
    this.setManipulationOptions(this.data)

    this.BindToClass(GTVisjsEvents, this)
    this.BindToClass(GTCopyPaste, this)

    this.rootNodesArray = []

    const copiedConfig = JSON.parse(JSON.stringify(config.configFile))

    copiedConfig.root_node_objects.forEach((node) => {
      node.expansion_depth = 100000

      this.rootNodesArray.push('jsondata/' + node.node_id)
    })

    const newInstanceOfGraphClass = new G.Graph()

    this.fullGraphData = {}
    this.fullGraphData.file = config.file
    this.fullGraphData.copiedConfig = copiedConfig

    this.fullGraph = newInstanceOfGraphClass.createGraphByConfig(config.file, copiedConfig, true)

    this.BindToClass(GTColoring, this)

    this.recolorByProperty()

    // variables containing keyboard and mouse state
    this.pressed_keys = []
    this.mouseX = 0
    this.mouseY = 0

    // for copying function
    this.copiedNodes = []
    this.copiedEdges = []

    // for having different node classes.
    this.classRegistry = new Map() // maps from typeString to class
    this.classRegistry.register = (cls) => {
      this.classRegistry.set((new cls()).typeString, cls) // eslint-disable-line new-cap
    }
    // for (let cls of [NodeClasses.RocketBase, NodeClasses.RocketBase, NodeClasses.Fountain, NodeClasses.DelayNode, NodeClasses.TextSpeechNode, NodeClasses.VideoNode,
    //     NodeClasses.DrawNode,
    //     NodeClasses.CameraNode, NodeClasses.ImageNode, NodeClasses.CsvNode,
    //     NodeClasses.JSONNode, NodeClasses.JSONNode1, NodeClasses.JSONSchemaNode
    //   ]) {
    //   this.classRegistry.register(cls)
    // }

    // args to generate full graph

    // this.fullGraphArgs = {
    //   file: this.drawer.file,
    //   depth: this.drawer.depth,
    //   mode: this.drawer.mode,
    //   rootItem: this.drawer.rootItem,
    //   recursionDepth: 100000000000,
    //   nodes: this.drawer.nodes.get(),
    //   edges: this.drawer.edges.get(),
    // }

    // this.drawer_config  = {lang:"en",contractArrayPaths: true}

    // this.fullGraph = new isg.GraphDrawer(this.drawer_config, this.fullGraphArgs);

    // Initialize GUI for various functions acting on the graph.
    this.createLegend()
    this.oldNodeColors = {}
    this.oldEdgeColors = {}
    this.addKeyEventListeners()
    this.addContainerEventListeners(this.vis_container)
    this.dataFile = this.drawer.file
    this.idsToColor = []
    this.deepSearchExpands = []
    this.deepSearchExpandsFull = []
    this.searchExpands = []
    // this.fullGraph
    this.configFile = config.configFile

    this.colorsBeforeVisualSearch = {}
    this.initDeepSearch()

    this.initVisjsCallbacks()

    // Rectangular selection:
    this.vis_container.onmousemove = (event) => {
      this.mouseX = event.clientX
      this.mouseY = event.clientY - 30
    }

    // this.initRectangleSelection()
    this.initDragAndDrop()
    this.visibilityByVisiblePath = {}

    this.initPopUpHTML()
    this.expandNodes = this.expandNodes.bind(this)
  }

  /**
   *
   * @param {JSON} functionsObject  Object containing functions to bind to thisClass
   * @param {JSON} thisClass Class to bind functions to
   */
  BindToClass (functionsObject, thisClass) {
    for (const [functionKey, functionValue] of Object.entries(functionsObject)) {
      thisClass[functionKey] = functionValue.bind(thisClass)
    }
  }

  /**
 *
 * @param {JSON} params params.id: id of the callback, params.params: params for the callback function
 * @returns {boolean} true if all callbacks return true, false if not
 */
  handleCallbacks (params) {
    let result = true
    if (!this.config.callbacks[params.id]) return true
    for (const callback of this.config.callbacks[params.id]) {
      if (!callback(params.params)) {
        result = false
        break
      }
    }
    return result
  }

  // not used
  run_recursive (nodeId) {
    const node = this.nodes.get(nodeId)
    if ('run' in node) {
      node.run()
    } else {
      const connEdges = this.network.getConnectedEdges(node.id)

      connEdges.forEach(function (edgeId) {
        const edge = this.edges.get(edgeId)
        if (edge.from === nodeId) {
          const neighborNode = this.nodes.get(edge.to)

          if (neighborNode.run) {
            neighborNode.run()
          } else {
            window.setTimeout(function () {
              this.run_recursive(edge.to)
            }, 200)
          }
        }
      })
    }
  }

  // Object.filter = (obj, predicate) =>
  //   Object.keys(obj)
  //         .filter( key => predicate(obj[key]) )
  //         .reduce( (res, key) => (res[key] = obj[key], res), {} );

  isNodeToOpenWithContext (node) {
    let openNodesCount = 0

    this.edges.get().forEach((edge) => {
      if (edge.from === node.id) {
        openNodesCount += 1
      }
    })

    let finalPlace = this.drawer.file

    for (let i = 0; i < node.path.length; i++) {
      finalPlace = finalPlace[node.path[i]]
    }

    if (typeof finalPlace === 'object' && finalPlace !== null) {
      const _finalPlace = { ...finalPlace }

      delete _finalPlace.type
      delete _finalPlace.label

      const numberOfKeys = Object.keys(_finalPlace).length

      if (numberOfKeys === openNodesCount) {
        return false
      }
      if (numberOfKeys > openNodesCount) {
        return true
      }
    }

    if (Array.isArray(finalPlace)) {
      if (finalPlace.length > openNodesCount) {
        return true
      }
      if (finalPlace.length === openNodesCount) {
        return false
      }
    }

    if ((typeof finalPlace === 'string') && (openNodesCount > 0)) {
      return false
    }
  }

  // expands the object that is saved inside a node and on second doubleclick deletes nodes and edges that go out of the clicked node
  /**
   *
   * @param {JSON} params params.nodes: array with visjs node id
   */
  expandNodes (params) {
    if (!this.searchAlert()) {
      return
    }

    this.dataFile.jsondata['Item:SomePerson'] = {
      type: ['Category:Item'],
      label: [{ text: 'Max Mustermann', lang: 'en' }],
      some_property: 'Item:MyOtherItem'
    }

    this.searchNodes('')
    document.getElementById(this.prefix + 'search_input').value = ''

    if (params.nodes.length > 0) {
      const node = this.nodes.get(params.nodes[0])
      let manuallyCreatedExits = false

      this.network.getConnectedNodes(params.nodes[0]).forEach((nodeId) => {
        if (this.nodes.get(nodeId).manuallyCreated) {
          manuallyCreatedExits = this.isNodeToOpenWithContext(node)
          if (manuallyCreatedExits === false) {
            this.clicked[params.nodes[0]] = true
          }
        }
      })

      this.edges.get().forEach((edge) => {
        if ((edge.from === params.nodes[0] || edge.to === params.nodes[0]) && edge.manuallyCreated) {
          this.edges.remove(edge.id)
        }
      })

      console.log(manuallyCreatedExits)
      if ('item' in node && (this.clicked[params.nodes[0]] === false || !('' + params.nodes[0] in this.clicked)) && (this.network.getConnectedNodes(params.nodes[0], 'to').length === 0 || manuallyCreatedExits === true)) {
        // expand node

        const args = {
          // file: config.file, not needed since drawer has own file
          lastId: node.id,
          recursionDepth: 1,
          recursionRootId: node.id,
          recurse: true,
          item: node.item,
          path: node.path,
          oldContext: '',
          lastDepth: node.depth,
          givenDepth: 1,
          mode: true,
          previousNode: node
        }

        this.drawer.createGraphNodesEdges(args)
        this.recolorByProperty()

        this.createLegend()

        if (document.querySelector('#' + this.prefix + 'myDropdown select').value === 'setColorByValue') {
          this.colorByValue([document.querySelector('#' + this.prefix + 'setColorByValueInput').value], this.nodes, this.edges, document.querySelector('#' + this.prefix + 'startColor').value, document.querySelector('#' + this.prefix + 'endColor').value)
        }
        this.clicked[params.nodes[0]] = true

        // this.network.body.data.nodes.update(nodes);
        // this.network.body.data.edges.update(edges);

        //  this.nodes.update(nodes);
        //  this.edges.update(edges);
      } else {
        // collapse Nodes
        this.clicked[params.nodes[0]] = false
        // let conEdges = this.network.getConnectedEdges(params.nodes[0], "from")
        this.deleteNodesChildren(params.nodes[0])
        this.createLegend()

        if (this.legendInvisibleGroups(this.options).length === 0) {
          // this.nodes.update(nodes);
          // this.edges.update(edges);
        }
      }
    }

    this.repeatInvisibility(this.options)

    if (this.legendInvisibleGroups(this.options).length === 0) {
      this.resetNodesAndEdgesVisibility()
    }

    // this.createLegend()
  }

  unit () {
    return 'GraphTool'
  }
}

export {

  GraphTool

}
