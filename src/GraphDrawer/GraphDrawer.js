const utils = require('../utils.js')
const vis = require('vis-network/standalone/esm/index.js')
const GDHelper = require('./GraphDrawerHelper.js')
const GDCallback = require('./GraphDrawerCallback.js')
const GDAlternative = require('./GraphDrawerAlternative.js')
const GDColoring = require('./GraphDrawerColoring.js')

class GraphDrawer {
  constructor (config, args) {
    this.BindToClass(GDHelper, this)
    this.BindToClass(GDCallback, this)
    this.BindToClass(GDAlternative, this)
    this.BindToClass(GDColoring, this)

    const defaultConfig = {
      callbacks: {
        setColor: (data) => this.setColorDefault(data), // default: use class methode
        getStartItem: (data) => this.getStartItemDefault(data),
        createContext: (file, item) => this.getItemContextDefault(file, item),
        getEdgeLabel: (item, key) => this.getEdgeLabelDefault(item, key),
        onBeforeCreateEdge: (edge) => this.onBeforeCreateEdgeDefault(edge),
        onBeforeCreateNode: (node) => this.onBeforeCreateNodeDefault(node),
        onBeforeSetColor: [(graph, property) => true],
        onBeforeGetStartItem: [(graph, item) => true],
        onBeforeCreateContext: [(graph, context) => true]
      },

      rootColor: '#6dbfa9',
      nodeDistance: 100,
      contractArrayPaths: true, // if true, object and array elements will be connected to previousNode directly
      lang: 'en'
    }

    this.config = utils.mergeDeep(defaultConfig, config)

    this.file = args.file
    this.rootItem = args.rootItem
    this.rootId = this.getIdFromPathArray(this.getItemPathArray(this.rootItem))
    this.depth = args.depth
    this.excludeList = ['type', 'label']
    this.mode = args.mode
    this.id = 0
    this.lang = this.config.lang
    this.first = true
    if (args.colorObj) {
      this.colorObj = args.colorObj
    } else {
      this.colorObj = {}
    }
    // this.colorObj = {};
    this.h = Math.random()
    this.golden = 0.618033988749895
    this.createArgsDefault = {
      file: this.file,
      lastId: false,
      item: false,
      oldContext: false,
      lastDepth: false,
      givenDepth: this.depth,
      mode: this.mode
    }
    this.createArgs = utils.mergeDeep(this.createArgsDefault, args)

    //   this.context = this.config.callbacks.createContext(this.file);

    // if (args.nodes) {
    //   this.nodes = new vis.DataSet(args.nodes);
    // } else {
    //   this.nodes = new vis.DataSet(args.edges)
    // }

    // if (args.edges) {
    //   this.edges = new vis.DataSet(args.edges);
    // } else {
    //   this.edges = new vis.DataSet(args.edges)
    // }

    this.nodes = new vis.DataSet(args.nodes)

    this.edges = new vis.DataSet(args.edges)

    // console.log(this.nodes.get())
    // console.log(this.edges.get())
    // console.log(args.nodes)

    this.createGraphNodesEdges(this.createArgs)
  }

  BindToClass (functionsObject, thisClass) {
    for (const [functionKey, functionValue] of Object.entries(functionsObject)) {
      thisClass[functionKey] = functionValue.bind(thisClass)
    }
  }

  createGraphNodesEdges (args) {
    // keys of args: file, lastId, item, relPath, oldContext, lastDepth, givenDepth, mode

    // TODO: put variables to defaultArgs

    const defaultArgs = {
      recurse: false,
      recursionRootId: this.rootId,
      recursionDepth: 2
    }

    args = utils.mergeDeep(defaultArgs, args)

    let currentItem
    // set start Item / temporary root
    if (args.item) {
      currentItem = args.item
    } else {
      currentItem = this.getStartItem(this.file)
    }

    let currentPath
    if (args.path) {
      currentPath = args.path
    } else {
      currentPath = this.getItemPathArray(currentItem)
    }

    const currentContext = this.config.callbacks.createContext(this.file, currentItem)

    const label = this.getNodeLabelFromPathArray(currentPath)

    let depth
    if (args.lastDepth) {
      depth = args.lastDepth
    } else {
      depth = 0
    }

    const jsonKey = this.getCurrentJSONKey(currentPath)

    // loop through keys / indices of current item

    let currentValue = this.getValueFromPathArray(currentPath)
    const reverseCurrentValue = currentValue

    // resolve references if possible
    if (Object.keys(this.file.jsondata).includes(currentValue)) {
      currentPath = this.getItemPathArray(currentValue)
      currentValue = this.file.jsondata[currentValue]
    }
    const currentNodeId = this.getIdFromPathArray(currentPath)

    // calculate distance by previous depthObject
    const depthObject = {}
    if (args.previousNode) {
      depthObject[args.recursionRootId] = args.previousNode.depthObject[args.recursionRootId] + 1
    }
    if (args.recursionRootId == currentNodeId) {
      depthObject[args.recursionRootId] = 0
    }
    // create edge and node
    let currentNode

    if (!(Array.isArray(currentValue) && this.config.contractArrayPaths)) {
      let edgeLabel
      if (args.previousContext) {
        if (Object.keys(args.previousContext).includes(args.key)) {
          edgeLabel = this.getLabelFromContext(args.previousContext, args.key)
        } else {
          edgeLabel = args.key
        }

        // let newEdgeId = utils.uuidv4() // String(args.previousPath.push(edgeLabel))
        // let newEdgeId = String(args.previousPath) + "==" + String(edgeLabel) + "=>" + String(currentPath)
        const newEdgeId = this.getIdFromPathArray(args.previousPath) + '==' + String(edgeLabel) + '=>' + this.getIdFromPathArray(currentPath)

        let newEdge = {
          id: newEdgeId,
          from: args.previousNode.id,
          to: currentNodeId,
          label: edgeLabel,
          group: edgeLabel,
          // color: this.colorObj[edgeLabel],
          objectKey: args.key
        }

        if (args.key.startsWith('^') && Object.keys(this.file.jsondata).includes(reverseCurrentValue)) {
          if (Object.keys(this.file.jsondata[reverseCurrentValue]).includes(args.key.slice(1))) {
            delete this.file.jsondata[reverseCurrentValue][args.key.slice(1)]
          }

          newEdge.id = this.getIdFromPathArray(currentPath) + '==' + String(edgeLabel) + '=>' + this.getIdFromPathArray(args.previousPath)
          newEdge.from = currentNodeId
          newEdge.to = args.previousNode.id
        }

        if (!this.edges.get(newEdge.id)) {
          newEdge = this.config.callbacks.onBeforeCreateEdge(newEdge)
          // here the actual edge is created / initialized
          this.edges.update(newEdge)
        }
      }

      // prepare position of new node
      // let new_x;
      // let new_y;
      // if (!args.previousNode) {
      //   new_x = 0;
      //   new_y = 0;
      // } else {
      //   let angle = this.getAngleFromProperty(edgeLabel)

      //   new_x = args.previousNode.x + this.config.nodeDistance * Math.cos(angle);
      //   new_y = args.previousNode.y + this.config.nodeDistance * Math.sin(angle);
      // }

      // create current Node
      currentNode = {
        id: currentNodeId,
        label,
        path: currentPath,
        key: jsonKey,
        item: currentItem,
        value: currentValue,
        incomingLabels: [edgeLabel],
        context: currentContext,
        depth,
        depthObject
        // x: new_x,
        // y: new_y,
        // fixed:true

      }

      if (!this.nodes.get(currentNode.id)) {
        currentNode = this.config.callbacks.onBeforeCreateNode(currentNode)

        this.nodes.update(currentNode)

        args.recurse = true
      }
    } else {
      args.recurse = true
    }
    if (args.recurse) {
      // loop through keys / indices of current item if it is an object / array
      if (typeof (currentValue) == 'object') {
        if (Array.isArray(currentValue) && this.config.contractArrayPaths) {
          for (const i in currentValue) {
            if (!this.excludeList.includes(i) && depthObject[args.recursionRootId] < args.recursionDepth + 1) {
              const nextPath = JSON.parse(JSON.stringify(currentPath))
              nextPath.push(i)
              const argsObj = {
                //  lastId: oldId,
                item: args.item, // + "" + eightDigitRandomNumber,:
                path: nextPath,
                previousPath: args.previousNode.path,
                key: args.key,
                previousContext: args.previousContext,
                previousNode: args.previousNode,
                recursionRootId: args.recursionRootId,
                recursionDepth: args.recursionDepth,
                lastDepth: depth,
                givenDepth: args.givenDepth,
                mode: args.mode
              }

              this.createGraphNodesEdges(argsObj)
            }
          }
        } else {
          for (const key in currentValue) {
            if (!this.excludeList.includes(key) && depthObject[args.recursionRootId] < args.recursionDepth) {
              const nextPath = JSON.parse(JSON.stringify(currentPath))

              nextPath.push(key)

              const argsObj = {
                //  lastId: oldId,
                item: args.item, // + "" + eightDigitRandomNumber,:
                path: nextPath,
                previousPath: currentPath,
                key,
                previousContext: currentContext,
                previousNode: currentNode,
                recursionRootId: args.recursionRootId,
                recursionDepth: args.recursionDepth,
                lastDepth: depth + 1,
                givenDepth: args.givenDepth,
                mode: args.mode
              }

              this.createGraphNodesEdges(argsObj)
            }
          }
        }
      }
    }
    // else {

    // }
  }
}

export {

  GraphDrawer

}
