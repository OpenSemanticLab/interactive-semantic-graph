const vis = require("vis-network/standalone/esm/index.js")
const jsnx = require("jsnetworkx")
const utils = require("./utils.js")
//const NodeClasses = require("./NodeClasses.js")    // this causes firefox hanging. 
const $ = require("jquery")
const chroma = require("chroma-js")
//const RegExp = require('RegExp');
const jsonpath = require('jsonpath');


class GraphDrawer {

  constructor(config, args) {

    const defaultConfig = {
      callbacks: {
        setColor: (data) => this.setColorDefault(data), //default: use class methode
        getStartItem: (data) => this.getStartItemDefault(data),
        createContext: (file, item) => this.getItemContextDefault(file, item),
        getEdgeLabel: (item, key) => this.getEdgeLabelDefault(item, key),
        onBeforeCreateEdge: (edge) => this.onBeforeCreateEdgeDefault(edge),
        onBeforeCreateNode: (node) => this.onBeforeCreateNodeDefault(node),
        onBeforeSetColor: [(graph, property) => true],
        onBeforeGetStartItem: [(graph, item) => true],
        onBeforeCreateContext: [(graph, context) => true],
      },

      rootColor: "#6dbfa9",
      nodeDistance: 100,
      contractArrayPaths: true, // if true, object and array elements will be connected to previousNode directly
      lang: "en"
    };

    this.config = utils.mergeDeep(defaultConfig, config);

    this.file = args.file;
    this.rootItem = args.rootItem
    this.rootId = this.getIdFromPathArray(this.getItemPathArray(this.rootItem))
    this.depth = args.depth;
    this.excludeList = ["type", "label"]
    this.mode = args.mode;
    this.id = 0;
    this.lang = this.config.lang;
    this.first = true;
    this.colorObj = {};
    this.h = Math.random();
    this.golden = 0.618033988749895;
    this.createArgsDefault = {
      file: this.file,
      lastId: false,
      item: false,
      oldContext: false,
      lastDepth: false,
      givenDepth: this.depth,
      mode: this.mode
    }
    this.createArgs = utils.mergeDeep(this.createArgsDefault, args);


    //   this.context = this.config.callbacks.createContext(this.file);

    if (args.nodes) {
      this.nodes = new vis.DataSet(args.nodes);
    } else {
      this.nodes = new vis.DataSet(args.edges)
    }

    if (args.edges) {
      this.edges = new vis.DataSet(args.edges);
    } else {
      this.edges = new vis.DataSet(args.edges)
    }

    this.createGraphNodesEdges(this.createArgs);
  }

  //Adds a callback function to config 
  registerCallback(params) {
    this.config.callbacks[params.name].push(params.func)
  }

  handleCallbacks(params) {
    let result = true;
    if (!this.config.callbacks[params.id]) return true;
    for (const callback of this.config.callbacks[params.id]) {
      if (!callback(params.params)) {
        result = false
        break;
      }
    }
    return result;
  }
  //Generates a random color
  randomHSL = () => {

    this.h += this.golden;
    this.h %= 1;
    return "hsla(" + (360 * this.h) + "," +
      "70%," +
      "80%,1)";
  }

  getLabelFromLabelArray(labelArray) {
    let label
    for (let key in labelArray) {
      label = labelArray[key]["text"]
      if (labelArray[key]["lang"] == this.lang) {
        return (label)
      }
    }
  }

  getLabelFromContext(context, key) {

    // get property string of shape: Property:PropertyLabel
    let propertyFullName = key
    if (typeof (context[key]) == "object") {
      propertyFullName = context[key]["@id"]
    }
    // replace by name with correct language if available

    if (this.file.jsondata[propertyFullName]) {
      propertyFullName = this.getLabelFromLabelArray(this.file.jsondata[propertyFullName]["label"])
      //propertyFullName = this.file.jsondata[propertyFullName]["label"][this.lang]
    }

    if (propertyFullName.startsWith("Property:")) {
      return (propertyFullName.replace("Property:", ""))
    }
    return (propertyFullName)

  }

  getStartItem(file) {
    return (this.rootItem)
  }

  getItemPathArray(item) {
    for (let key in this.file.jsondata) {
      if (key == item) {
        return ["jsondata", key]
      }
    }
  }

  getIdFromPathArray(pathArray) {

    let idString
    for (let i in pathArray) {
      if (i == 0) {
        idString = pathArray[0]
      } else {
        idString += "/" + pathArray[i]
      }
    }
    return idString
  }

  //Creates Array of arrays Array of all contexts
  getSchemaContextRecursive(file, schema, fullContext = []) {


    fullContext = fullContext;

    let startContext = this.file.jsonschema[schema]["@context"];

    if (Array.isArray(startContext)) {
      for (let i = 0; i < startContext.length; i++) {

        if (!(typeof startContext[i] === 'object' && startContext[i] !== null)) {
          this.getSchemaContextRecursive(this.file, startContext[i], fullContext);
        } else {
          fullContext.push(startContext[i]);
        }
      }
    } else {
      fullContext.push(startContext);
    }
    return fullContext;
  }

  //Creates a context object out of the multidimensional array created by the recursive context function
  getItemContextDefault(file, item) {

    let itemSchema = this.file.jsondata[item].type[0];
    let contextArrayOfObjects = this.getSchemaContextRecursive(file, itemSchema);
    let context = {};

    for (let i = 0; i < contextArrayOfObjects.length; i++) {

      let partContextKeys = Object.keys(contextArrayOfObjects[i]);

      for (let j = 0; j < partContextKeys.length; j++) {

        context[partContextKeys[j]] = contextArrayOfObjects[i][partContextKeys[j]];
      }
    }

    if (this.handleCallbacks({
        id: 'onBeforeCreateContext',
        params: {
          graph: this,
          context: context
        }
      })) {
      return context;
    }
  }


  // generates colors per property (per property, not per node! Todo: consider renaming: getColorByProperty)
  registerPropertyColor(property) {
    // maps a property to a color, generates the color by randomness if not existing

    if (this.handleCallbacks({
        id: 'onBeforeSetColor',
        params: {
          graph: this,
          property: property
        }
      })) {

      for (let x in this.colorObj) {
        if (property == x) {
          return this.colorObj[x]; // this is the color-object in GraphDrawer that contains colors per property.
        }
      }
      this.colorObj[property] = this.randomHSL();
      return this.colorObj[property];
    }
  }

  getAngleFromProperty(property) {
    let hsla = this.colorObj[property]
    let angle = hsla.split(",")[0].split("(")[1]
    angle = angle / 180 * Math.PI
    return angle
  }

  onBeforeCreateEdgeDefault(edge) {
    this.registerPropertyColor(edge.label)
    return edge
  }

  onBeforeCreateNodeDefault(node) {

    // set color
    if (node.incomingLabels.length > 0) {
      node.color = this.registerPropertyColor(node.incomingLabels[0])
    }

    //set group
    if (node.depth == 0) {
      node.group = "root",
        node.color = this.config.rootColor
    } else {
      node.group = node.incomingLabels[0]
    }

    return node
  }


  getLabelFromItem(item, relativePath = "") {
    // check language for root node and set label according to this.lang

    let labelArray = this.file.jsondata[item].label
    let label = "item"
    if (labelArray) {
      this.getLabelFromLabelArray(labelArray)
    }
    return ("Itemlabel, " + label)
  }

  getValueFromPathArray(pathArr) {
    let object = this.file

    for (let key in pathArr) {

      object = object[pathArr[key]]
    }

    return (object)
  }

  getNodeLabelFromPathArray(pathArr) {
    let value = this.getValueFromPathArray(pathArr)

    if (!(typeof (value) == "object") && !(this.file.jsondata[value])) {

      //literals
      return (value)
    }

    if(!(typeof (value) == "object") && this.file.jsondata[value]){
      return (this.getLabelFromLabelArray(this.file.jsondata[value].label))
    }

    //objects, arrays
    if (value.label) {
      if (!Array.isArray(value.label) ) {
        // single label
        return (value.label)
      } else {
        // array of labels (for language)
        return (this.getLabelFromLabelArray(value.label))
      }
    }
    return (pathArr[pathArr.length - 2] )//+ "[" + pathArr[pathArr.length - 1] + "]")
  }

  createNxGraph() {

    let MDG = new jsnx.MultiDiGraph() // a jsNetworkX MultiDiGraph

    let recursionCallback = (obj, args) => {
      MDG.addNode(String(args.currentPath), {
        obj
      })
      MDG.addEdge(String(args.previousPath), String(args.currentPath), {
        "label": args.key
      }) //,{"id":(String(args.currentPath)+args.key),"key":args.key})
    }


    args = {}
    utils.callbackObjectRecursion(this.file, recursionCallback, args)

    // replace Array nodes 
    for (let val of MDG.nodes(true)) {
      let node_id = val[0]
      let node_data = val[1]

      if (Array.isArray(node_data.obj)) {
        let inEdge
        let baseNodeId
        let inEdgeData
        for (inEdge of MDG.inEdges(node_id, true)) {
          baseNodeId = inEdge[0]
          inEdgeData = inEdge[2]
        }
        // create edges between base of in edge and targets of out edges 
        for (let outEdge of MDG.outEdges(node_id)) {

          MDG.addEdge(baseNodeId, outEdge[1], inEdgeData)
        }

        MDG.removeNode(node_id)
      }
    }

    // resolve and replace references
    for (let val of MDG.nodes(true)) {
      let node_id = val[0]
      let node_data = val[1]
      if (typeof (node_data.obj) === "string") {
        let check_paths = [
          ["jsondata", node_data.obj],
          ["jsonschema", node_data.obj]
        ]
        for (let check_path of check_paths) {
          if (MDG.hasNode(String(check_path))) {


            for (let inEdge of MDG.inEdges(node_id, true)) {
              MDG.addEdge(inEdge[0], String(check_path), inEdge[2])
              MDG.removeNode(inEdge[1])
            }
          }
        }
      }
    }



    // create Vis data set from nx MultiDiGraph
    let visNodes = new vis.DataSet()
    let visEdges = new vis.DataSet()

    for (let id of MDG.nodes()) {
      let node

      node = {
        id: id,
        label: String(id),
        data: MDG.nodes()[id]
      }
      visNodes.update(node)
    }

    for (let i in MDG.edges()) {
      let edge_arr
      let edge
      edge_arr = MDG.edges(true)[i]

      edge = {
        "from": edge_arr[0],
        "to": edge_arr[1],
        "data": edge_arr[2],
        "label": edge_arr[2].label
      }
      visEdges.update(edge)
    }

    let container = document.getElementById('mynetwork');
    let data = {
      nodes: visNodes,
      edges: visEdges
    };

    let options = {
      interaction: {
        hover: true,
        multiselect: true,
      },
      manipulation: {
        enabled: true,
      },
      edges: {
        arrows: "to"
      },
      groups: {
        useDefaultGroups: false
      }
    }
    let network = new vis.Network(container, data, options);


    // color nodes in path
    let path = jsnx.bidirectionalShortestPath(new jsnx.Graph(MDG), "jsonschema,Category:Item,properties,label,0,items,properties,text", "jsondata,Item:MyProject,budget,1,budget,1,year", 19)

    function colorByPath(visNodes, path) {
      for (let node of visNodes.get()) {
        if (path.includes(node.id)) {
          node.color = "red"
        } else {
          node.color = "blue"
        }
        visNodes.update(node)
      }
    }
    colorByPath(visNodes, path)
  }

  getCurrentJSONKey(pathArray){

    let jsonKey;

    if(isNaN(pathArray[pathArray.length-1])){

      jsonKey = pathArray[pathArray.length-1]

    }else{

      jsonKey = pathArray[pathArray.length-2]

    }

    return jsonKey;
  }

  createGraphNodesEdges(args) {
    //keys of args: file, lastId, item, relPath, oldContext, lastDepth, givenDepth, mode

    // TODO: put variables to defaultArgs

    let defaultArgs = {
      recurse: false,
      recursionRootId: this.rootId,
      recursionDepth: 2
    }

    args = utils.mergeDeep(defaultArgs, args);

    let currentItem;
    // set start Item / temporary root
    if (args.item) {
      currentItem = args.item
    } else {
      currentItem = this.getStartItem(this.file);
    }

    let currentPath;
    if (args.path) {
      currentPath = args.path
    } else {
      currentPath = this.getItemPathArray(currentItem)
    }




    let currentContext = this.config.callbacks.createContext(this.file, currentItem)

    let label = this.getNodeLabelFromPathArray(currentPath);


    let depth;
    if (args.lastDepth) {
      depth = args.lastDepth
    } else {
      depth = 0
    }

    let jsonKey = this.getCurrentJSONKey(currentPath);

    // loop through keys / indices of current item 

    let currentValue = this.getValueFromPathArray(currentPath)
    // resolve references if possible
    if (Object.keys(this.file.jsondata).includes(currentValue)) {
      currentPath = this.getItemPathArray(currentValue)
      currentValue = this.file.jsondata[currentValue]
    }
    let currentNodeId = this.getIdFromPathArray(currentPath)

    // calculate distance by previous depthObject
    let depthObject = {}
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
          edgeLabel = this.getLabelFromContext(args.previousContext, args.key);
        } else {
          edgeLabel = args.key
        }

        //let newEdgeId = utils.uuidv4() // String(args.previousPath.push(edgeLabel))
        //let newEdgeId = String(args.previousPath) + "==" + String(edgeLabel) + "=>" + String(currentPath)
        let newEdgeId = this.getIdFromPathArray(args.previousPath) + "==" + String(edgeLabel) + "=>" + this.getIdFromPathArray(currentPath)


        let newEdge = {
          id: newEdgeId,
          from: args.previousNode.id,
          to: currentNodeId,
          label: edgeLabel,
          group: edgeLabel,
          //color: this.colorObj[edgeLabel],
          objectKey: args.key
        }

        if (!this.edges.get(newEdge.id)) {
          newEdge = this.config.callbacks.onBeforeCreateEdge(newEdge)
          // here the actual edge is created / initialized
          this.edges.update(newEdge)

        } else {

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
        label: label,
        path: currentPath,
        key: jsonKey,
        item: currentItem,
        value: currentValue,
        incomingLabels: [edgeLabel],
        context: currentContext,
        depth: depth,
        depthObject: depthObject,
        // x: new_x,
        // y: new_y,
        //fixed:true

      }

      if (!this.nodes.get(currentNode.id)) {

        currentNode = this.config.callbacks.onBeforeCreateNode(currentNode)

        this.nodes.update(currentNode)

        args.recurse = true

      }

    } else {
      args.recurse = true;
    }
    if (args.recurse) {
      // loop through keys / indices of current item if it is an object / array
      if (typeof (currentValue) === "object") {

        if (Array.isArray(currentValue) && this.config.contractArrayPaths) {

          for (let i in currentValue) {

            if (!this.excludeList.includes(i) && depthObject[args.recursionRootId] < args.recursionDepth + 1) {
              let nextPath = JSON.parse(JSON.stringify(currentPath))
              nextPath.push(i)
              let argsObj = {
                //  lastId: oldId,
                item: args.item, //+ "" + eightDigitRandomNumber,: 
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
          for (let key in currentValue) {
            if (!this.excludeList.includes(key) && depthObject[args.recursionRootId] < args.recursionDepth) {

              let nextPath = JSON.parse(JSON.stringify(currentPath))

              nextPath.push(key)

              let argsObj = {
                //  lastId: oldId,
                item: args.item, //+ "" + eightDigitRandomNumber,: 
                path: nextPath,
                previousPath: currentPath,
                key: key,
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


class GraphTool {
  constructor(div_id, config, callback_config) {

    const defaultConfig = {
      callbacks: {
        loadState: (e) => this.loadStateDefault(e),
        onBeforeSearchNodes: [(graph, searchString) => true],
      }
    };

    this.config = utils.mergeDeep(defaultConfig, callback_config); // overwrite default config with user callback_config

    this.initGraphContainers(div_id);
    this.drawer = config.drawer

    this.clicked = {} // object to store expanded nodes TODO: rename to expandedNodes

    this.keyObject = { // to be removed, was inteded for callback implementation
      doubleclick: (params) => {
        this.expandNodes(params)
      },
    }
    // create a visjs network and attatch it to div

    this.nodes = this.drawer.nodes //new vis.DataSet(config.nodes)

    this.edges = this.drawer.edges //new vis.DataSet(config.edges)
    this.data = {
      nodes: this.nodes,
      edges: this.edges,
    };
    this.options = config.options;
    this.network = new vis.Network(this.vis_container, this.data, this.options);

    this.recolorByProperty()


    // variables containing keyboard and mouse state
    this.pressed_keys = []
    this.mouseX = 0
    this.mouseY = 0

    // for copying function
    this.copiedNodes = []
    this.copiedEdges = []

    // for having different node classes. 
    this.classRegistry = new Map // maps from typeString to class
    this.classRegistry.register = (cls) => {
      this.classRegistry.set((new cls).typeString, cls)
    }
    // for (let cls of [NodeClasses.RocketBase, NodeClasses.RocketBase, NodeClasses.Fountain, NodeClasses.DelayNode, NodeClasses.TextSpeechNode, NodeClasses.VideoNode,
    //     NodeClasses.DrawNode,
    //     NodeClasses.CameraNode, NodeClasses.ImageNode, NodeClasses.CsvNode,
    //     NodeClasses.JSONNode, NodeClasses.JSONNode1, NodeClasses.JSONSchemaNode
    //   ]) {
    //   this.classRegistry.register(cls)
    // }

    // Initialize GUI for various functions acting on the graph.
    this.colorPicker(this);
    this.loadSaveFunctionality();
    this.createLegend();
    this.createSearchUI();
    this.oldNodeColors = {};
    this.oldEdgeColors = {};
    this.addKeyEventListeners();
    this.dataFile = this.drawer.file;
    this.idsToColor = [];
    this.deepSearchExpands = [];
    this.fullGraph;
    this.saveColorsOfPreviousExpandedNodes = [];
    this.initDeepSearch();

    // set visjs network callbacks

    this.network.on("click", (params) => {

      this.visOnClick(params);

    });

    this.network.on("doubleClick", (params) => {

      this.keyObject.doubleclick(params); // TODO: implement central callback object
    });


    this.network.on("oncontext", (params) => {

      this.visOnContext(params); // TODO: implement right click, probably Property-List, but as callback function.

    });

    this.network.on('dragStart', (params) => {


      this.visOnDragStart(params);

    });

    this.network.on('dragEnd', (params) => {

      this.visOnDragEnd(params);

    });

    // Rectangular selection:
    this.vis_container.onmousemove = (event) => {
      this.mouseX = event.clientX
      this.mouseY = event.clientY - 30
    }

    //this.initRectangleSelection()
    this.initDragAndDrop()
  }

  initGraphContainers(div_id) {

    // create all necessary elements/divs and set them up
    this.container = document.getElementById(div_id);
    this.vis_container = document.createElement("div");
    this.vis_container.setAttribute("id", "vis_container");
    //this.vis_container.width = "70%"
    this.vis_container.style = "width: 65%; height: 800px; border: 1px solid lightgray;  float:left;";
    this.options_container = document.createElement("div");
    this.options_container.setAttribute("id", "options_container");
    this.options_container.setAttribute("style", "overflow-y:scroll");
    //this.options_container.width = "30%"
    this.options_container.style = "margin-left: 68%; width: 30%; height: 800px; border: 1px solid lightgray;";
    this.container.append(this.vis_container);
    this.container.append(this.options_container);

  }

  visOnDragEnd(params) {

    params.nodes.forEach((node_id) => {
      let node = this.nodes.get(node_id)
      let position = this.network.getPosition(node_id)
      //setting the current position is necessary to prevent snap-back to initial position
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

  visOnDragStart(params) {

    if (params.nodes.length > 0) {
      let newNodeIds = []
      params.nodes.forEach((node_id, index) => {

        let node = this.nodes.get(node_id)
        let position = this.network.getPosition(node_id) //setting the current position is necessary to prevent snap-back to initial position

        node.x = position.x
        node.y = position.y


        // duplicate Node if ctrl is pressed
        if (params.event.srcEvent.ctrlKey) {

          //now: duplicate node and connect to original one. TODO: check if this should create a new node as property of the original.
          let newNode = this.duplicateNode(node)

          // added node shall move with cursor until button is released
          newNode.fixed = false;
          newNode.id = config.graph.id;
          newNode.depth = this.nodes.get(this.network.getSelectedNodes()[index]).depth + 1;
          config.graph.id += 1;

          this.copiedEdges = this.network.getSelectedEdges()

          let newEdge = {
            from: node.id,
            to: newNode.id,
            label: "InitializedByCopyFrom", //this.edges.get(this.copiedEdges[index]).label,
            color: newNode.color,
            group: newNode.group
          }

          this.nodes.update(newNode)
          this.edges.update(newEdge) //{from: node.id, to: newNode.id}
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

  visOnContext(params) {

    console.log('in this.network.on(oncontext)');

  }

  visOnClick(params) {

    this.showSelectionOptions()
    // TODO: move definition of keyboard shortcuts to this.registerKeyboardShortcuts
    if (this.pressed_keys.includes('a')) {
      //add a node to position of mouse if a is pressed during click
      // let addNode = new NodeClasses.BaseNode(this)
      // addNode.x = params.pointer.canvas.x
      // addNode.y = params.pointer.canvas.y
      // this.nodes.update(addNode)
    }

    if (this.pressed_keys.includes('q')) {
      // show global JSON vis JSONeditor in options div

      let optionsDivId = this.options_container.id

      document.getElementById(optionsDivId).innerHTML = "<button id='setButton'>set!</button><br><div id='editor_div'></div>"
      let setButton = document.getElementById("setButton") // todo: implement changes


      let options = {
        mode: 'tree',
        modes: ['code', 'tree'] // ['code', 'form', 'text', 'tree', 'view', 'preview']}
      }


      let editor_div = document.getElementById("editor_div", options)
      // create a JSONEdior in options div
      let editor = new JSONEditor(editor_div) // TODO: Editor is currently not rendered. find error.

      editor.set({
        edges: this.edges.get(),
        nodes: this.nodes.get()
      })
    }
  }


  keyUpEvent(event) {


    const index = this.pressed_keys.indexOf(event.key);
    if (index > -1) { // only splice array when item is found
      this.pressed_keys.splice(index, 1); // 2nd parameter means remove one item only
    }

  }
  
  copyNodesEdges() {


    this.copiedNodes = this.network.getSelectedNodes()
    this.copiedEdges = this.network.getSelectedEdges()

  }

  //creates an ID for a new node that is to be created by copying an existing one
  createIDForNewNode(node, receivingNode, copiedEdges) {

    //id when pasted into empty space
    if(receivingNode === false){

      return "test";
    }

    let tempPath = node.id.split('/');

    //if nodes path length is 2, that means its an item and it puts out its id so that only an edge is created
    if(this.drawer.file[tempPath[0]][tempPath[1]] && node.path.length === 2){

      return node.id;

    }

    let id;
    let keyExists = false;
    let receivingNodePath; 

    let connectedEdges = this.network.getConnectedEdges(receivingNode.id)
    let coppiedEdgeObject = this.edges.get(copiedEdges[0])

    //checks if the edge/key already exists
    connectedEdges.forEach((edge) => {
      let edgeObj = this.edges.get(edge)

      if(edgeObj.from === receivingNode.id && coppiedEdgeObject.label === edgeObj.label ){

        keyExists = true;
        
      }

    });


    receivingNodePath = receivingNode.path

    var valueOfPath = this.drawer.file;

    //gets the value at the end of the receiving node path
    for(let i = 0; i < receivingNodePath.length; i++){

      let key = receivingNodePath[i];
      valueOfPath = valueOfPath[key];

    }

  //checks if the last element of the path is not a number    
    if(isNaN(Number(node.id.split('/')[node.id.split('/').length - 1]))){

      //checks if the key does not exist
      if(!keyExists){

        id = receivingNode.id + '/' + node.id.split('/')[node.id.split('/').length - 1] + '/0'

        return id;

      }

      ////////

      //if the value of the path is not an array, but the key exists it creates the id with the number 1 (because its the second element of the array)
      if(!(Array.isArray(valueOfPath[node.id.split('/')[node.id.split('/').length - 1]]))){

        id = receivingNode.id + '/' + node.id.split('/')[node.id.split('/').length - 1] + '/1';

        return id;

      }

      //if the value of the path is an array, it creates the id with the length of the array - 1
      id = receivingNode.id + '/' + node.id.split('/')[node.id.split('/').length - 1] + '/' + valueOfPath[node.id.split('/')[node.id.split('/').length - 1]].length;
      
      return id;

    }

    //c it checks if the key exists
    if(!keyExists){

      id = receivingNode.id + '/' + node.id.split('/')[node.id.split('/').length - 2] + '/0'

      return id;

    }

    ////////

    //if the last element of the path is a number, and the key exists, it creates the id with the length of the array - 2
    id = receivingNode.id + '/' + node.id.split('/')[node.id.split('/').length - 2] + '/' + valueOfPath[node.id.split('/')[node.id.split('/').length - 2]].length;

    return id;
  }

  createNewNodesFromCopiedNodes(copiedNodes, copiedEdges, receivingNode) {
     
    let node = this.nodes.get(copiedNodes[0])

    let newNode = {};
    let keys = Object.getOwnPropertyNames(node)

    keys.forEach((key) => {
      if (!(key === "id") && !((typeof (node[key])) == "function")) {
        newNode[key] = node[key]
      }
    });
  
    newNode.id = this.createIDForNewNode(node, receivingNode, copiedEdges)
    
    return newNode;

  }

  createNewEdgeForNewNode(newNode) {
    
    let newEdge = {
      id: ''+this.network.getSelectedNodes()[0] + '=' + this.edges.get(this.copiedEdges[0]).label + '=>' + newNode.id,
      from: this.network.getSelectedNodes()[0],
      to: newNode.id,
      label: this.edges.get(this.copiedEdges[0]).label,
      color: newNode.color,
      group: newNode.group,
      //objectKey: this.edges.get(this.copiedEdges[index]).objectKey
    }

    return newEdge;
  }

  pasteNodeEdges(copiedNodes, copiedEdges) {

    let xy = this.network.DOMtoCanvas({
      x: this.mouseX,
      y: this.mouseY
    })

    //paste nodes and edges into existing nodes
    if (copiedNodes.length > 0 && this.network.getSelectedNodes().length > 0) {

      // TODO: encapsulate in: this.pasteNodeIntoExistingItem() 
      // TODO: paste node into empty space and create corresponding item this.pasteNodeIntoNewItem(node,xy) 

      let receivingNode = this.nodes.get(this.network.getSelectedNodes()[0])

      let json = this.drawer.file;

      for(let i = 0; i < receivingNode.path.length; i++){

        json = json[receivingNode.path[i]];
  
      }

      //if literal, then return
      if(typeof json === 'string' && this.drawer.file[receivingNode.path[receivingNode.path.length - 1]] === undefined){

        return;

      }

      if (this.nodes.get(this.network.getSelectedNodes()[0]).item) {


        let newNode = this.createNewNodesFromCopiedNodes(copiedNodes, copiedEdges, receivingNode);
        
        newNode.depth = this.nodes.get(this.network.getSelectedNodes()[0]).depth + 1;

        newNode.x = xy.x;
        newNode.y = xy.y;

        //config.graph.id += 1;

        let newEdge = this.createNewEdgeForNewNode(newNode);

        if (newNode.group != "root") {
          this.nodes.update(newNode);
          this.edges.update(newEdge);

          this.addToJSON(newNode, newEdge, receivingNode);
          console.log(config.file.jsondata)

        }
      }


    }

    if(copiedNodes.length > 0 && this.network.getSelectedNodes().length === 0){
      //paste nodes and edges into empty space

      let newNode = this.createNewNodesFromCopiedNodes(copiedNodes, copiedEdges, false);

      if(this.drawer.file.jsondata[newNode.path[1]]){
        
        newNode.depth = 0;

        newNode.x = xy.x;
        newNode.y = xy.y;
        
        newNode.group = "root"

        newNode.key = newNode.path[1];

        newNode.incomingLabels = [];

        newNode.color = "#6dbfa9";

        newNode.fixed = true;

        this.nodes.update(newNode);

        //TODO: add to json, id is not correct
      }

    }
  }

  addKeyEventListeners() {

    document.addEventListener('keyup', (event) => {
      this.keyUpEvent(event);
    }, false);



    // keyboard callback functions
    document.addEventListener('keydown', (event) => {
      if (!this.pressed_keys.includes(event.key)) {
        this.pressed_keys.push(event.key)
      }
      // delete function
      if (event.key == "Delete") {
        this.network.deleteSelected()
      }
      // copy
      if (event.key == "c" && this.pressed_keys.includes("Control")) {
        //copy nodes
        this.copyNodesEdges()
      }
      // paste
      if (event.key == "v" && this.pressed_keys.includes("Control")) {
        //paste copied nodes
        this.pasteNodeEdges(this.copiedNodes, this.copiedEdges);

      }
    }, false);


  }

  addContainerEventListeners(container) {

    container.addEventListener('dragenter', function (e) {

      e.preventDefault()

      container.style.border = "1px solid black"
      // container.style.cssText = "border: 5px solid lightgray"

    }, false)
    container.addEventListener('dragleave', function (e) {

      container.style.border = "1px solid lightgray"
    }, false)
    container.addEventListener('drop', function (e) {
      e.preventDefault
      handleDrop(e)
    }, false)
    container.addEventListener('dragover', function (e) {
      e.preventDefault()
    }, false)

  }

  handleCallbacks(params) {
    let result = true;
    if (!this.config.callbacks[params.id]) return true;
    for (const callback of this.config.callbacks[params.id]) {
      if (!callback(params.params)) {
        result = false
        break;
      }
    }
    return result;
  }



  imageToNode(file, currentGraphObject, dropEvent) {

    // add image node to network

    let xy = this.network.DOMtoCanvas({
      x: dropEvent.clientX,
      y: dropEvent.clientY
    })

    // read file 

    let reader = new FileReader(currentGraphObject);

    reader.onload = (event) => {

      // let newNode = new NodeClasses.ImageNode(currentGraphObject, utils.uuidv4(), xy.x, xy.y, event.target.result)

      // this.nodes.update(newNode)

    };

    reader.readAsDataURL(file)

}

csvToNode(file, currentGraphObject, dropEvent) {

    // add csv node
    let xy = this.network.DOMtoCanvas({
      x: dropEvent.clientX,
      y: dropEvent.clientY
    })

    // read file 

    let reader = new FileReader(currentGraphObject);
    reader.onload = (event) => {

      // let newNode = new NodeClasses.CsvNode(currentGraphObject, utils.uuidv4(), xy.x, xy.y, event.target.result)

      // this.nodes.update(newNode)
    };
    reader.readAsText(file)

}

videoToNode(file, currentGraphObject, dropEvent) {

    // add cameraNode node
    let xy = this.network.DOMtoCanvas({
      x: dropEvent.clientX,
      y: dropEvent.clientY
    })

    // read file 
    let reader = new FileReader(currentGraphObject);

    reader.onload = (event) => {

      // let newNode = new NodeClasses.VideoNode(currentGraphObject, utils.uuidv4(), xy.x, xy.y, reader.readAsDataURL(event.target.result))

      // this.nodes.update(newNode)
    };

    reader.readAsText(file)

}

initDragAndDrop() {
  // drag & drop functionality

  var container = this.vis_container
  const handleDrop = (e) => {

    e.stopPropagation(); // Stops some browsers from redirecting
    e.preventDefault();

    var files = e.dataTransfer.files;

    for (let file of files) {

      // images 
      if (file.type === 'image/png' || file.type === 'image/jpeg') {

        this.imageToNode(file,this, e);

      }

      // csv files
      else if (file.type === 'application/vnd.ms-excel' && file.name.endsWith('.csv')) {

        this.csvToNode(file,this, e);

      }

      // mp4 files  (not working so far)
      else if (file.type === 'video/mp4') {

        this.videoToNode(file,this, e);

      } else {
        window.alert('File type ' + file.type + ' not supported');
      }

    }

  }

  this.addContainerEventListeners(container);

}

  showOptions_default(node, optionsDivId = 'optionsDiv') {
    document.getElementById(optionsDivId).innerHTML = "<button id='setButton'>set!</button><br><div id='visual_options_editor_div'></div><div id='data_editor_div'></div>"
    let setButton = document.getElementById("setButton")
    let schema = {
      /*
            "title": "Node Options",
            "description": "Node Options",
            "type": "object",
            "properties": {
              "id": {
                "title": "ID",
                "description": "The Id of the node",
                "examples": [
                  "18a96389-de88-492f-95d5-af74f467f424"
                ],
                "anyOf": [{
                    "type": "string"
                  },
                  {
                    "type": "integer"
                  }
                ]
              },
              "x": {
                "title": "x",
                "examples": [0],
                "type": "number"
              },
              "y": {
                "title": "y",
                "examples": [0],
                "type": "number"
              },
              "label": {
                "title": "Label",
                "examples": ["Label"],
                "type": "string"
              },
              "color": {
                "title": "color",
                "examples": ["blue", "#ffffff"],
                "type": "string"
              },
              "shape": {
                "title": "shape",
                "type": "string",
                "enum": ["ellipse", "circle", "database", "box", "text", "image", "circularImage", "diamond", "dot", "star", "triangle", "triangleDown", "hexagon", "square", "icon"]
              }
            },*/
    }
    let options = {
      schema: schema,
      // schemaRefs: {"job": job},
      mode: 'tree',
      modes: ['code', 'tree'] // ['code', 'form', 'text', 'tree', 'view', 'preview']}
    }
    let visual_options_editor = new JSONEditor(visual_options_editor_div, options)
    // make object of own properties

    visual_options_editor.set(node)
    visual_options_editor.onChange = (param) => {

    }
    setButton.addEventListener('click', () => {

      node = visual_options_editor.get()
      this.nodes.update(node)
    })
    let data_editor = new JSONEditor(data_editor_div, options)

    data_editor.set(this.drawer.getValueFromPathArray(node.path))
  }



  createSearchUI() {

    // create the input element
    let inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.id = 'search_input';

    // add the event listener to the input element
    let debounceTimer;

    inputField.addEventListener('input', () => {

      // Clear previous debounce timer
      clearTimeout(debounceTimer);
      document.getElementById('input-field').value = "";

      // Set a new debounce timer
      debounceTimer = setTimeout(() => {
        // Execute the search after the debounce timeout
        this.searchNodes(inputField.value)
      }, 300); // Adjust the debounce timeout as needed (e.g., 300ms)

    });

    // add the input field to the DOM
    document.getElementById("title").appendChild(inputField);

    // create the select element
    const selectElement = document.createElement('select');
    selectElement.id = 'search_select';
    selectElement.addEventListener('change', (event) => {
      // get the selected value
      document.getElementById('search_input').value = "";
      this.searchNodes("");
    });

    // create the first option element
    const optionElement1 = document.createElement('option');
    optionElement1.value = 'search_node';
    optionElement1.text = 'Search nodes';

    // create the second option element
    const optionElement2 = document.createElement('option');
    optionElement2.value = 'search_edge';
    optionElement2.text = 'Search edges';

    // add the option elements to the select element
    selectElement.add(optionElement1);
    selectElement.add(optionElement2);

    // add the select element to the DOM
    document.getElementById("title").appendChild(selectElement);

  }

  searchNodes = (searchString) => {

    //this.updatePositions()

    if (this.handleCallbacks({id: 'onBeforeSearchNodes', params: {graph: this, searchString: searchString}})) {

      this.recolorByProperty();
      this.deepSearchExpands = [];

      //searches for edges with the given search string
      if (document.getElementById('search_select').value === 'search_edge') {


        this.edges.forEach((edge) => {

          if(edge.label.toLowerCase().includes(searchString.toLowerCase())){

            let paths = this.findAllPaths(this.drawer.rootId, edge.to);

            for(let i = 0; i < paths.length; i++){

              for(let j = 0; j < paths[i].length; j++){

                this.deepSearchExpands.push(paths[i][j]);

              }

            }

          }

        });
      }
      //searches for nodes with the given search string
      if (document.getElementById('search_select').value === 'search_node') {
        this.nodes.forEach((node) => {
          if (node.label) {

            if(node.label.toLowerCase().includes(searchString.toLowerCase()) || node.group == "root"){

              let paths = this.findAllPaths(this.drawer.rootId, node.id);
  
              for(let i = 0; i < paths.length; i++){
  
                for(let j = 0; j < paths[i].length; j++){
  
                  this.deepSearchExpands.push(paths[i][j]);
  
                }
  
              }
            }
            
          }

        });

      }

      this.deepSearchColorPath([]);

    }
  }

  //adds copied nodes to the json file
  addToJSON(newNode, newEdge, receivingNode) {

    //finalPlace is the place where the new node will be added
    let finalPlace = this.drawer.file;

    //goes through the path of the receiving node to find the place where the new node will be added
    for(let i = 0; i < receivingNode.path.length; i++){

      finalPlace = finalPlace[receivingNode.path[i]];

    }

    //contains the value of the node that will be added
    let valueToBeAdded = this.drawer.file;

    //path of the copied node gets split into an array
    let valuePath = this.copiedNodes[0].split("/");

    //goes through the path of the copied node to find the value of the node that will be added
    for(let i = 0; i < valuePath.length; i++){

      valueToBeAdded = valueToBeAdded[valuePath[i]];

    }

    //if the path of the copied node is only two elements long, take the second element of the path as the value that will be added (only relevant for items)
    if(valuePath.length == 2){
        
        valueToBeAdded = valuePath[1];
    }

    //if key of the final place is not defined, create the key and add the value inside an array
    if(!(finalPlace[newNode.key])){

      finalPlace[newNode.key] = [valueToBeAdded];

      return;

    }

    //if key of the final place key is defined but the value is not an array, create an array and add the old value of the key and then the new value
    if(!(Array.isArray(finalPlace[newNode.key]))){

      finalPlace[newNode.key] = [finalPlace[newNode.key]]

      finalPlace[newNode.key].push(valueToBeAdded);
      
      return;
    }

    //if final place key is defined and the value is an array, add the new value to the array
    finalPlace[newNode.key].push(valueToBeAdded);

    return;

  }



  //Adds copied nodes to the given JSON
  addToJSON_old(node, edge) {

    let receivingItem = this.nodes.get(this.network.getSelectedNodes()[0]).item;
    let receivingNode = this.nodes.get(this.network.getSelectedNodes()[0])

    if (!node.item) {

      if (config.file["jsondata"][receivingItem][edge.objectKey]) {
        if (Array.isArray(config.file["jsondata"][receivingItem][edge.objectKey])) {
          config.file["jsondata"][receivingItem][edge.objectKey].push(node.label);
        } else {
          let tempArray = [];
          tempArray.push(config.file["jsondata"][receivingItem][edge.objectKey]);
          tempArray.push(node.label);

          config.file["jsondata"][receivingItem][edge.objectKey] = tempArray;
        }
      } else {

        config.file["jsondata"][receivingItem][edge.objectKey] = node.label;

      }
      //add literal to object
    } else {

      if (!receivingNode.hasOwnProperty('mainObjectId') && !node.hasOwnProperty('mainObjectId')) {
        if (config.file["jsondata"][receivingItem][edge.objectKey]) {
          if (Array.isArray(config.file["jsondata"][receivingItem][edge.objectKey])) {

            config.file["jsondata"][receivingItem][edge.objectKey].push(node.item);
          } else {
            let tempArray = [];
            tempArray.push(config.file["jsondata"][receivingItem][edge.objectKey]);
            tempArray.push(node.item);

            config.file["jsondata"][receivingItem][edge.objectKey] = tempArray;
          }
        } else {

          config.file["jsondata"][receivingItem][edge.objectKey] = node.object;

        }
      } else if (!receivingNode.hasOwnProperty('mainObjectId') && node.hasOwnProperty('mainObjectId')) {

        if (config.file["jsondata"][receivingItem][edge.objectKey]) {
          if (Array.isArray(config.file["jsondata"][receivingItem][edge.objectKey])) {

            config.file["jsondata"][receivingItem][edge.objectKey].push(config.file["jsondata"][node.item]);
          } else {
            let tempArray = [];
            tempArray.push(config.file["jsondata"][receivingItem][edge.objectKey]);
            tempArray.push(config.file["jsondata"][node.item]);


            config.file["jsondata"][receivingItem][edge.objectKey] = tempArray;
          }
        } else {


          config.file["jsondata"][receivingItem][edge.objectKey] = config.file["jsondata"][node.item];


        }

      } else if (receivingNode.hasOwnProperty('mainObjectId') && !node.hasOwnProperty('mainObjectId')) {

        let mainObject = this.nodes.get(receivingNode.mainObjectId)

        let objKey = this.edges.get({
          filter: function (edge) {
            return edge.to === receivingNode.id;
          }
        })[0].objectKey


        config.file["jsondata"][mainObject.object][objKey].forEach((object, index) => {

          if (Object.is(config.file["jsondata"][receivingNode.object], object)) {

            if (Array.isArray(object[edge.objectKey])) {

              object[edge.objectKey].push(node.item);

            } else {
              let tempArray = [];

              if (object[edge.objectKey]) {
                tempArray.push(object[edge.objectKey]);
              }

              tempArray.push(node.item);
              object[edge.objectKey] = tempArray;

            }

          }

        })

      } else {

        let mainObject = this.nodes.get(receivingNode.mainObjectId)


        config.file["jsondata"][mainObject.item][edge.objectKey].forEach((object, index) => {

          if (Object.is(config.file["jsondata"][receivingNode.item], object)) {

            if (Array.isArray(object[edge.objectKey])) {

              object[edge.objectKey].push(config.file["jsondata"][node.item]);


            } else {
              let tempArray = [];

              if (object[edge.objectKey]) {
                tempArray.push(object[edge.objectKey]);
              }


              tempArray.push(config.file["jsondata"][node.item]);

              object[edge.objectKey] = tempArray;

            }

            //object[edge.objectKey] = new_json["jsondata"][node.item];

          }
        })

      }

    }

  }
  //creates a copy of a given node
  duplicateNode(node) {

    let newNode = {}
    if (Object.getOwnPropertyNames(node).includes("typeString")) {
      let cls = this.classRegistry.get(node.typeString)
      newNode = new cls(utils.uuidv4())
    } else {
      newNode.id = utils.uuidv4()
    }
    let keys = Object.getOwnPropertyNames(node)
    keys.forEach((key) => {
      if (!(key === "id") && !((typeof (node[key])) == "function")) {
        newNode[key] = node[key]
      }
    })
    return (newNode)
  }

  //not used
  run_recursive(node_id) {
    let node = this.nodes.get(node_id)
    if ("run" in node) {
      node.run()
    } else {
      let conn_edges = this.network.getConnectedEdges(node.id)

      conn_edges.forEach(function (edge_id) {
        let edge = this.edges.get(edge_id)
        if (edge.from == node_id) {
          let neighbor_node = this.nodes.get(edge.to)

          if (neighbor_node.run) {
            neighbor_node.run()
          } else {
            window.setTimeout(function () {

              run_recursive(edge.to)
            }, 200)
          }
        }
      })

    }
  }

  //Outputs all edges with given label
  getAllEdgesWithLabel(edges, label) {

    let tempArray = []

    for (let index = 0; index < edges.length; index++) {

      if (edges[index].label == label) {
        tempArray.push(edges[index]);
      }

    }

    return tempArray;

  }


  // Object.filter = (obj, predicate) => 
  //   Object.keys(obj)
  //         .filter( key => predicate(obj[key]) )
  //         .reduce( (res, key) => (res[key] = obj[key], res), {} );

  //recolos all nodes and edges
  recolorByProperty() {

    //this.updatePositions()
    let nodes = this.nodes.get();
    let edges = this.edges.get();


    for (let edge of edges) {
      edge.color = this.drawer.colorObj[edge.label];
      this.edges.update(edge)
      for (let node of nodes) {
        if (edge.to == node.id) {
          node.color = edge.color;
          this.nodes.update(node)
        }
      }
    }
    // root Node
    let rootNode = this.nodes.get(this.drawer.rootId);
    rootNode.color = this.drawer.config.rootColor;
    this.nodes.update(rootNode)

  }

  //Removes object with a given ID from the given array
  removeObjectWithId(arr, id, edge) {
    if (edge) {
      const objWithIdIndex = arr.findIndex((obj) => obj.from === edge.from && obj.to === edge.to);

      if (objWithIdIndex > -1) {
        arr.splice(objWithIdIndex, 1);
      }

    }


    const objWithIdIndex = arr.findIndex((obj) => obj.id === id);

    if (objWithIdIndex > -1) {
      arr.splice(objWithIdIndex, 1);
    }

    return arr;
  }

  //gets all nodes that are reachable from the given node ID
  getAllReachableNodesTo(nodeId, excludeIds, reachableNodes) {
    if (reachableNodes.includes(nodeId) || excludeIds.includes(nodeId)) {
      return [];
    }
    let children = this.network.getConnectedNodes(nodeId, "to");
    reachableNodes.push(nodeId);
    for (let i = 0; i < children.length; i++) {
      this.getAllReachableNodesTo(children[i], excludeIds, reachableNodes);
      if (!reachableNodes.includes(children[i])) {
        reachableNodes.push(children[i]);
      }

    }
    return (reachableNodes)
  }

  //deletes the reachable nodes from the given node ID
  deleteNodesChildren(nodeId, deleteEdge, clickedNode) {

    let excludedIds = [];
    if (deleteEdge === true) {
    } else {
      excludedIds.push(nodeId);
    }

    let reachableNodesTo = [];
    reachableNodesTo = this.getAllReachableNodesTo(this.drawer.rootId, excludedIds, reachableNodesTo);

    let nodesToDelete = [];
    let allIds = this.nodes.getIds();


    for (let i = 0; i < allIds.length; i++) {
      if (reachableNodesTo.includes(allIds[i])) {
        continue;
      }

      if (allIds[i] == nodeId) {
        this.deleteEdges(nodeId);
        continue;
      }

      nodesToDelete.push(allIds[i]);
      this.deleteEdges(allIds[i]);


      this.nodes.remove(allIds[i]);

    }
    return nodesToDelete;
  }
  //deletes edges that are connected to the given node ID
  deleteEdges(nodeID) {

   
    this.network.getConnectedEdges(nodeID).forEach((edgeID) => {
      this.edges.remove(edgeID)
    
    })



    // delete from drawer edges list. // TODO: sync drawer edges with GraphTool edges

    /*
       var fromEdges = this.edges.get({
         filter: function (item) {
           return item.from == nodeID;
         }
       });

       for (var j = 0; j < fromEdges.length; j++) {
         this.edges.remove(fromthis.edges.get(j));

         edges = this.removeObjectWithId(edges, false, fromthis.edges.get(j))
       }*/
  }

  updatePositions() {
    this.nodes.forEach((node) => {
      //setting the current position is necessary to prevent snap-back to initial position

      let position = this.network.getPosition(node.id)

      node.x = position.x
      node.y = position.y
      this.nodes.update(node)
    })
  }

  //repeats the invisibility of properties that are set invisible in the legend
  repeatInvisibility(options) {


    for (const [key, value] of Object.entries(options.groups)) {

      for (const [subKey, subValue] of Object.entries(value)) {
        if (subValue == true) {

          let objectToRepeat = {
            repeat: key
          }

          this.legendFunctionality(objectToRepeat);

        }
      }
    }


    // Array.from(options.groups).forEach((group)=> {

    // });

    // let legend = document.getElementById("legendContainer");
    // let children = Array.from(legend.children);

    // children.forEach(child => {

    //   if(window.getComputedStyle(child.children[1]).backgroundColor == "rgb(255, 255, 255)"){

    //     let objectToRepeat = {repeat:child.children[1].innerHTML}

    //     this.legendFunctionality(objectToRepeat);

    //   }

    // });

  }
  //gets all groups that are set to hidden = true
  legendInvisibleGroups(options) {

    let invisibleGroups = [];

    for (const [key, value] of Object.entries(options.groups)) {

      for (const [subKey, subValue] of Object.entries(value)) {
        if (subValue == true) {

          invisibleGroups.push(key);
        }
      }
    }

    // let legend = document.getElementById("legendContainer");
    // let children = Array.from(legend.children);

    // let invisibleGroups = [];

    // children.forEach(child => {

    //   if(window.getComputedStyle(child.children[1]).backgroundColor == "rgb(255, 255, 255)"){

    //     invisibleGroups.push(child.children[1].innerHTML);

    //   }

    // });

    return invisibleGroups;

  }
  //sets the color of the legend white if the group is set to hidden = true
  setInvisibleLegendGroupsWhite(invisibleGroups) {

    let legend = document.getElementById("legendContainer");
    let children = Array.from(legend.children);


    children.forEach((child) => {

      if (invisibleGroups.includes(child.children[1].innerHTML)) {

        child.children[1].style.background = "rgb(255, 255, 255)"

      }

    });

  }

  // resets nodes and edges visibility
  resetNodesAndEdgesVisibility() {

    this.nodes.forEach((node) => {
      node.hidden = false;
      node.physics = !node.hidden;
      node.visited = false;
      this.nodes.update(node);
    });

    this.edges.forEach((edge) => {
      edge.hidden = false;
      edge.physics = !edge.hidden;
      this.edges.update(edge);
    });

  }
  // expands the object that is saved inside a node and on second doubleclick deletes nodes and edges that go out of the clicked node
  expandNodes(params) {
    
    this.searchNodes("");
    document.getElementById("search_input").value = "";

    if (params.nodes.length > 0) {

      let node = this.nodes.get(params.nodes[0]);
      // console.log(params.nodes)
      // console.log(node)
      // console.log(this.nodes.get())

      if ("item" in node && (this.clicked[params.nodes[0]] == false || !("" + params.nodes[0] in this.clicked)) && (this.network.getConnectedNodes(params.nodes[0], "to").length === 0)) {

        // expand node

        let args = {
          //file: config.file, not needed since drawer has own file
          lastId: node.id,
          recursionDepth: 1,
          recursionRootId: node.id,
          recurse: true,
          item: node.item,
          path: node.path,
          oldContext: "",
          lastDepth: node.depth,
          givenDepth: 1,
          mode: true,
          previousNode: node,
        };

        config.drawer.createGraphNodesEdges(args);
        this.recolorByProperty()

        this.createLegend()

        if (document.querySelector('#myDropdown select').value == "setColorByValue") {

          this.colorByValue([document.querySelector('#setColorByValueInput').value], this.nodes, this.edges, document.querySelector('#startColor').value, document.querySelector('#endColor').value)
        }
        this.clicked[params.nodes[0]] = true;


        // this.network.body.data.nodes.update(nodes);
        // this.network.body.data.edges.update(edges);


        //  this.nodes.update(nodes);
        //  this.edges.update(edges);

      } else {

        // collapse Nodes
        this.clicked[params.nodes[0]] = false;
        //let conEdges = this.network.getConnectedEdges(params.nodes[0], "from")
        this.deleteNodesChildren(params.nodes[0]);
        this.createLegend()

        if (this.legendInvisibleGroups(this.options).length == 0) {
          //this.nodes.update(nodes);
          //this.edges.update(edges);
        }

      }

    }
    /*
    
    this.repeatInvisibility(this.options);

    if (this.legendInvisibleGroups(this.options).length == 0) {
      this.resetNodesAndEdgesVisibility()
    }
    */

    //this.createLegend()

  }
  //creates the color by value ui
  colorPicker(graph) {
    // Create the dropdown menu

    var graph = graph;
    var dropdownDiv = document.createElement("div");
    dropdownDiv.id = "dropdown";
    dropdownDiv.setAttribute("id", "myDropdown");

    var dropdown = document.createElement("select");

    var option1 = document.createElement("option");
    option1.setAttribute("value", "setColorByProperty");
    option1.innerHTML = "Color by Property";

    var option2 = document.createElement("option");
    option2.setAttribute("value", "setColorByValue");
    option2.innerHTML = "Color by Value";

    // var option3 = document.createElement("option");
    // option3.setAttribute("value", "option3");
    // option3.innerHTML = "Option 3";

    dropdown.appendChild(option1);
    dropdown.appendChild(option2);
    //dropdown.appendChild(option3);

    dropdownDiv.appendChild(dropdown);

    // Add the dropdown menu to the page
    var body = document.getElementById("title")
    body.appendChild(dropdownDiv);

    // Get the selected value
    function getPath() {
      let path = "" + document.querySelector('#setColorByValueInput').value;

      let tempArray = path.split(".")

      let startColor = document.querySelector('#startColor').value;
      let endColor = document.querySelector('#endColor').value;

      graph.colorByValue(tempArray, graph.nodes.get(), graph.edges.get(), startColor, endColor);

      graph.nodes.update(graph.nodes.get())
      graph.edges.update(graph.edges.get())

      // graph.network.body.emitter.emit('_dataChanged');

      // graph.network.redraw();
    }


    // Add an event listener to get the selected value
    document.querySelector('#myDropdown select').addEventListener('change', function () {
      var selectedValue = this.value;

      if (selectedValue == "setColorByValue") {

        var input = document.createElement("input");
        input.type = "text";
        input.id = "setColorByValueInput";



        const usefulColors = ["orangered", "red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "gray"];
        const usefulColors2 = ["limegreen", "green", "orange", "yellow", "red", "blue", "purple", "pink", "brown", "gray"];

        // Create the select element
        const select = document.createElement("select");

        // Add options to the select element
        for (let i = 0; i < usefulColors.length; i++) {
          const option = document.createElement("option");
          option.value = usefulColors[i];
          option.text = usefulColors[i];
          select.appendChild(option);
        }
        select.id = "startColor";


        const select2 = document.createElement("select");

        // Add options to the select element
        for (let i = 0; i < usefulColors2.length; i++) {
          const option = document.createElement("option");
          option.value = usefulColors2[i];
          option.text = usefulColors2[i];
          select2.appendChild(option);
        }
        select2.id = "endColor";

        // Add a button to get the selected value
        var button = document.createElement("button");
        button.id = "setPath";
        button.innerHTML = "Set path";
        button.addEventListener("click", getPath);

        if (!document.getElementById("setColorByValueInput")) {
          document.getElementById("myDropdown").appendChild(input);
          document.getElementById("myDropdown").appendChild(select);
          document.getElementById("myDropdown").appendChild(select2);
          document.getElementById("myDropdown").appendChild(button);
        }
      }

      if (selectedValue == "setColorByProperty") {
        if (document.getElementById("setColorByValueInput")) {
          document.getElementById("setColorByValueInput").remove();
          document.getElementById("startColor").remove();
          document.getElementById("endColor").remove();
          document.getElementById("setPath").remove();
        }
        graph.recolorByProperty();
        graph.nodes.update(graph.nodes.get())
        graph.edges.update(graph.edges.get())
      }
      //alert("Selected value: " + selectedValue);
    });

  }
  // loads or saves the graph to a .txt file
  loadSaveFunctionality() {

    function saveState() {

      if (document.getElementById("setColorByValueInput")) {
        config.file.state = {
          nodes: nodes,
          edges: edges,
          colorFunction: document.querySelector('#myDropdown select').value,
          colorByValue: {
            startColor: document.querySelector('#startColor').value,
            endColor: document.querySelector('#endColor').value,
            path: document.querySelector('#setColorByValueInput').value
          }
        };


      } else {
        config.file.state = {
          nodes: nodes,
          edges: edges,
          colorFunction: document.querySelector('#myDropdown select').value,
          colorByValue: {}
        };
      }


      const json = config.file
      const filename = "data.txt";
      const text = JSON.stringify(json);

      const element = document.createElement("a");
      element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
      element.setAttribute("download", filename);
      element.style.display = "none";
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);

    }

    let element = document.createElement("BUTTON");
    element.innerHTML = "Save state";
    element.id = "save";
    element.addEventListener("click", () => {
      this.createSaveStateFunctionality()
    });
    document.getElementById("title").append(element)

    let element2 = document.createElement("BUTTON");
    element2.id = "load"
    element2.innerHTML = "Load state";
    element2.addEventListener("click", () => {
      this.createLoadStateFunctionality()
    });

    document.getElementById("title").append(element2)

  }


  createSaveStateFunctionality() {

    if (document.getElementById("setColorByValueInput")) {

      config.file.state = {
        nodes: this.nodes.get(),
        edges: this.edges.get(),
        colorFunction: document.querySelector('#myDropdown select').value,
        colorByValue: {
          startColor: document.querySelector('#startColor').value,
          endColor: document.querySelector('#endColor').value,
          path: document.querySelector('#setColorByValueInput').value
        }
      };


    } else {
      config.file.state = {
        nodes: this.nodes.get(),
        edges: this.edges.get(),
        colorFunction: document.querySelector('#myDropdown select').value,
        colorByValue: {}
      };
    }


    const json = config.file
    const filename = "data.txt";
    const text = JSON.stringify(json);

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);

  }


  createLoadStateFunctionality() {
    const input = document.createElement("input");
    input.type = "file";


    const loadState = this.config.callbacks.loadState
    input.addEventListener("change", (ev) => {
      loadState(ev)
    }) //,()=> this.config.callbacks.loadState(input) );
    input.click();
  }

  loadStateDefault(input) {

    const reader = new FileReader();
    reader.onload = () => {
      const jsonData = JSON.parse(reader.result);
      if (jsonData.state) {
        config.nodes = jsonData.state.nodes;
        config.edges = jsonData.state.edges;

        this.nodes = new vis.DataSet(jsonData.state.nodes);
        this.edges = new vis.DataSet(jsonData.state.edges);

        //this.drawer = new GraphDrawer(callback_config, jsonData, 5, true, nodes, edges);

        this.drawer.nodes = this.nodes;
        this.drawer.edges = this.edges;

        config = {
          nodes: jsonData.state.nodes,
          edges: jsonData.state.edges,
          options: options,
          drawer: drawer,
          file: config.file
        };

        delete jsonData.state;
        config.file = jsonData;

        document.getElementById("mynetwork").innerHTML = "";


        document.getElementById('myDropdown').remove();
        document.getElementById('save').remove();
        document.getElementById('load').remove();
        document.getElementById('search_input').remove();
        document.getElementById('search_select').remove();

        if (document.getElementById('setPath')) {
          document.getElementById('setPath').remove();
        }
        let graphTool = new GraphTool("mynetwork", config);
      } else {
        let nodes = [];
        let edges = [];
        this.drawer = new GraphDrawer(callback_config, jsonData, 5, true, nodes, edges);
        let options = {
          interaction: {
            hover: true,
            multiselect: true,
          },
          manipulation: {
            enabled: true,
          },
          edges: {
            arrows: "to"
          },
          groups: {
            useDefaultGroups: false
          }
        }
        let config = {
          nodes: nodes,
          edges: edges,
          options: options,
          graph: this.drawer,
          file: config.file
        };
        let graphtool = new GraphTool("mynetwork", config, callback_config, );
      }

      // if (jsonData.state.colorFunction == "setColorByValue") {
      //   graphtool.changeColorDropdown("myDropdown", "setColorByValue")
      //   document.querySelector('#myDropdown select').dispatchEvent(new Event("change"));
      //   graphtool.changeStartEndColorDropdown("startColor", jsonData.state.colorByValue.startColor);
      //   graphtool.changeStartEndColorDropdown("endColor", jsonData.state.colorByValue.endColor);
      //   document.getElementById("setColorByValueInput").value = jsonData.state.colorByValue.path;
      //   graphtool.nodes.update(nodes);
      //   graphtool.edges.update(edges);
      // }

      delete jsonData.state;
      config.file = jsonData;

    };
    reader.readAsText(input.target.files[0]);

  }

  //generates the legend for the graph
  createLegend() {
    var invisibleGroups = [];


    if (!document.getElementById("legendContainer")) {

      Object.keys(this.drawer.colorObj).forEach((key) => {

        options.groups[key] = {
          hidden: false
        };
      });

    }

    if (document.getElementById("legendContainer")) {

      invisibleGroups = this.legendInvisibleGroups(this.options);

      document.getElementById("legendContainer").remove();
    }
    var legendDiv = document.createElement("div");
    let vis_cont = document.getElementById("vis_container")
    vis_cont.append(legendDiv);
    legendDiv.style.width = '100%';
    legendDiv.style.position = 'relative';
    legendDiv.style.display = 'inline-block';
    legendDiv.id = "legendContainer";
    var legendColors = this.drawer.colorObj
    var legendSet = {}

    for (let edge of this.edges.get()) {

      if (!legendSet[edge.group]) {

        //legendColors[input.properties[i]] = colors[i];
        var propertyContainer = document.createElement("div");
        var propertyColor = document.createElement("div");
        var propertyName = document.createElement("div");
        propertyContainer.className = "legend-element-container";
        propertyContainer.id = edge.label;
        propertyColor.className = "color-container";
        propertyName.className = "name-container";
        propertyColor.style.float = "left";
        propertyName.style.float = "left";
        propertyColor.style.border = "1px solid black";
        propertyName.style.border = "1px solid black";
        propertyColor.style.background = legendColors[edge.group]
        propertyColor.innerHTML = "";
        propertyName.innerHTML = edge.label;
        propertyColor.style.width = "30px";
        propertyColor.style.height = "30px";
        propertyName.style.height = "30px";
        propertyName.style.background = '#DEF';
        //propertyName.text-align = 'center';
        propertyContainer.paddinng = '5px 5px 5px 5px';
        propertyName.addEventListener("click", (e) => this.legendFunctionality(e));
        propertyColor.addEventListener("click", (e) => this.legendFunctionality(e));
        legendDiv.append(propertyContainer);
        propertyContainer.append(propertyColor);
        propertyContainer.append(propertyName);

        legendSet[edge.group] = legendColors[edge.group];
      }
    }


    this.setInvisibleLegendGroupsWhite(invisibleGroups);
  }

  changeColorDropdown(id, valueToSelect) {
    let element = document.querySelector('#' + id + ' select');
    element.value = valueToSelect;
  }

  changeStartEndColorDropdown(id, valueToSelect) {
    let element = document.querySelector('#' + id);
    element.value = valueToSelect;
  }

  //function to set nodes and edges hidden when legend is clicked
  setNodeVisibilityByVisiblePath = (nodeId, rootNodeId) => {

    if (nodeId == this.drawer.rootId) return true; //root is always visible
    let node = this.nodes.get(nodeId);
    if (node.visited) return !node.hidden //prevent circles. ToDo: Reuse results between runs
    node.visited = true;
    node.hidden = true;
    let connectedEdgesIds = this.network.getConnectedEdges(nodeId);
    let connectedEdges = this.edges.get(connectedEdgesIds);
    connectedEdges.forEach((edge) => {
      if (edge.hidden) return; //don't follow hidden edges
      let connectedNodesIds = this.network.getConnectedNodes(edge.id);
      let connectedNodes = this.nodes.get(connectedNodesIds);
      connectedNodes.forEach((connectedNode) => {
        if (connectedNode.id == nodeId) return; //prevent self evaluation
        if (this.setNodeVisibilityByVisiblePath(connectedNode.id, rootNodeId)) {
          node.hidden = false; //set node visible, if at least one connected node is visible
        }
      });
    });
    node.physics = !node.hidden; //disable physics for hidden nodes
    return !node.hidden;
  }

  //turns clicked properties of the legend invisible or back to visible
  legendFunctionality = (e) => {

    let legendGroup;
    let group;
    let nodeChildren;
    let strategy = "strategy2"


    //this.updatePositions()
    if (strategy == "strategy2") {

      if (!e.repeat) {
        legendGroup = e.target.parentNode.childNodes[1].innerHTML;
        //A node is visible if at least one path over visible edges to the root node exists.
        this.options.groups[legendGroup].hidden = !this.options.groups[legendGroup].hidden; //toggle state
        if (this.options.groups[legendGroup].hidden) e.target.parentNode.childNodes[1].style.background = '#FFFFFF';
        else e.target.parentNode.childNodes[1].style.background = '#DEF';
      }
      //update all edges. ToDo: Consider: https://visjs.github.io/vis-network/examples/network/data/dynamicFiltering.html
      this.edges.forEach((edge) => {
        edge.hidden = this.options.groups[edge.group].hidden;
        edge.physics = !edge.hidden;
        this.edges.update(edge); //see also: https://visjs.github.io/vis-network/examples/network/data/datasets.html
      });

      //reset nodes
      this.nodes.forEach((node) => {
        node.hidden = false;
        node.physics = !node.hidden;
        node.visited = false;
      });

      //check each node
      this.nodes.forEach((node) => {
        this.setNodeVisibilityByVisiblePath(node.id, 0)
        //reset visited state. Todo: Reuse visited nodes between runs
        this.nodes.forEach((node) => {
          node.visited = false;
        });

        this.nodes.update(node); //see also: https://visjs.github.io/vis-network/examples/network/data/datasets.html
      });
    }

    var allFalse = Object.keys(options.groups).every((k) => {
      if (k === 'useDefaultGroups') {
        return true
      }
      return options.groups[k].hidden === false
    });

    if (allFalse === true) {
      /*oldGroups = {};*/
    }


  };

  showSelectionOptions() {
    let sel_nodes = this.network.getSelectedNodes()
    if (sel_nodes.length == 0) {
      // remove options
      if (!this.pressed_keys.includes('q')) {
        this.options_container.innerHTML = ""
      }


    } else if (sel_nodes.length == 1) {
      // show options of single node

      let node = this.nodes.get(sel_nodes[0])
      if (typeof node.showOptions === 'function') {

        let optionsId = this.options_container.id
        node.showOptions(optionsId)
      } else {
        this.showOptions_default(node, this.options_container.id)
      }
    } else {
      // show common properties
      /**/

      if (true) {

        // make options gui

        this.options_container.innerHTML = "<h3>comparison between nodes</h3>"
        let comparison_container = document.createElement("div")
        comparison_container.setAttribute("id", "comparison_container")
        this.options_container.append(comparison_container)
        this.options_container.append(document.createElement("H2").appendChild(document.createTextNode("common types")))

        let setForAllContainer = document.createElement("div")
        setForAllContainer.setAttribute("id", "setForAllContainer")
        this.options_container.append(setForAllContainer)


        // create table_data for comparison

        let table_data = []
        for (let node_id of sel_nodes) {
          let node = this.nodes.get(node_id)
          table_data.push({
            'id': node_id,
            color: JSON.stringify(node.color),
            x: node.x,
            y: node.y,
            typeString: node.typeString,
            fixed: node.fixed,
          })
        }

        const fixedEdit = (cell) => {

          let node = this.nodes.get(cell._cell.row.data.id)
          let id = cell._cell.row.data.id
          node.fixed = Boolean(cell._cell.value)

          this.nodes.update(node)
        }

        const xEdit = (cell) => {

          let node = this.nodes.get(cell._cell.row.data.id)

          let id = cell._cell.row.data.id
          let x = cell._cell.value
          let y = node.y

          this.network.moveNode(id, x, y)
          this.nodes.update({
            id: id,
            x: x
          })
        }

        const yEdit = (cell) => {

          let node = this.nodes.get(cell._cell.row.data.id)

          let id = cell._cell.row.data.id
          let x = node.x
          let y = cell._cell.value

          this.network.moveNode(id, x, y)
          this.nodes.update({
            id: id,
            y: y
          })
        }

        const colorEdit = (cell) => {

          let node = this.nodes.get(cell._cell.row.data.id)

          let id = cell._cell.row.data.id

          node.color = JSON.parse(cell._cell.value)

          this.nodes.update(node)
        }

        let tabul = new Tabulator("#" + comparison_container.id, {
          data: table_data,
          columns: [{
              title: "id",
              field: "id",
              editor: "input"
            },
            {
              title: "typeString",
              field: "typeString"
            },
            {
              title: "x",
              field: "x",
              editor: "input",
              cellEdited: xEdit
            },
            {
              title: "y",
              field: "y",
              editor: "input",
              cellEdited: yEdit
            },
            {
              title: "fixed",
              field: "fixed",
              editor: true,
              formatter: "tickCross",
              cellEdited: fixedEdit
            },
            {
              title: "color",
              field: "color",
              editor: "input",
              cellEdited: colorEdit
            },
          ]
        })

        const allXEdit = (cell) => {

          for (let node_id of this.network.getSelectedNodes()) {
            let node = this.nodes.get(node_id)
            let id = node_id
            let x = cell._cell.value
            let y = node.x
            this.network.moveNode(id, x, y)
            this.nodes.update({
              id: id,
              y: y
            })
          }
        }
        const allYEdit = (cell) => {

          for (let node_id of this.network.getSelectedNodes()) {
            let node = this.nodes.get(node_id)
            let id = node_id
            let x = node.x
            let y = cell._cell.value

            this.network.moveNode(id, x, y)
            this.nodes.update({
              id: id,
              y: y
            })
          }
        }
        const allColorEdit = (cell) => {

          for (let node_id of this.network.getSelectedNodes()) {
            let node = this.nodes.get(node_id)
            node.color = JSON.parse(cell._cell.value)
            this.nodes.update(node)
          }
        }

        const allFixedEdit = (cell) => {

          for (let node_id of this.network.getSelectedNodes()) {
            let node = this.nodes.get(node_id)
            node.fixed = Boolean(cell._cell.value)

            this.nodes.update(node)
          }
        }

        let setForAllTable = new Tabulator("#" + setForAllContainer.id, {
          data: [table_data[0]],
          columns: [{
              title: "id",
              field: "id",
              editor: "input"
            },
            {
              title: "typeString",
              field: "typeString"
            },
            {
              title: "x",
              field: "x",
              editor: "input",
              cellEdited: allXEdit
            },
            {
              title: "y",
              field: "y",
              editor: "input",
              cellEdited: allYEdit
            },
            {
              title: "fixed",
              field: "fixed",
              editor: true,
              formatter: "tickCross",
              cellEdited: allFixedEdit
            },
            {
              title: "color",
              field: "color",
              editor: "input",
              cellEdited: allColorEdit
            },
          ]
        })
      } else {
        let content = "<h3>Node IDs</h3><br>"
        for (let node_id of sel_nodes) {

          content += "<br>" + node_id

        }
        this.options_container.innerHTML = content
      }


    }

  }

//checks if the given node id exists in the current graph
itemExists(node_id){

  if(this.nodes.get(node_id)){

    return true;

  }

  return false;

}
//checks if the given node is open/expanded
isNodeOpen(node_id) {
  const edges = this.edges.get();
  
  for (const edge of edges) {
    if (edge.from === node_id.trim()) {
      return true;
    }
  }

  return false;
}

searchItem(node_id, search) {
  //if node id is not in the current graph
  if (!this.itemExists(node_id)) {
    //get node from this.fullGraph
    const searchValue = search.nodes.get(node_id);
    //get parent item from this.fullGraph of the given node id
    const parentItem = this.searchJSON(this.drawer.file, `${searchValue.path[1]}`);
    //get parent item id
    const parentItemId = `${parentItem[0].split('.')[1]}/${parentItem[0].split('.')[2]}`;

    //if the parent item node is not in the current graph, go recursively back in the graph until you find a node that is in the current graph
    if (!this.itemExists(parentItemId)) {
      this.searchItem(parentItemId, search);
      this.expandNodesCleanedUp({ nodes: [parentItemId] });

      return;
    }

    //if the parent item node is in the current graph, expand it 
    this.expandNodesCleanedUp({ nodes: [parentItemId] });

    return;
  }

  this.expandNodesCleanedUp({ nodes: [node_id] });

}

deepSearchExpandNodes(foundNode, search) {

  
  const path = foundNode.path;
  const firstPath = `${path[0]}/${path[1]}`;
  const firstPathExists = this.itemExists(firstPath);
  let currentID = firstPath;


  // If the node is already open, don't expand it again but note the nodes that would have been expanded
  
  if (this.itemExists(foundNode.id)) {
   
    return;
    
  }


  //if the path starting node is not open, open it
  if (!firstPathExists) {
    this.searchItem(firstPath, search);
    this.expandNodesCleanedUp({ nodes: [firstPath] });


    this.deepSearchExpandNodes(foundNode);
    
    return;
  }


  //expand path if starting node is given
  for (let i = 2; i < path.length; i += 2) {
    if (path[i + 1] === undefined) {
      break;
    }
    currentID += `/${path[i]}/${path[i + 1]}`;

    if (this.itemExists(currentID) && !this.isNodeOpen(currentID)) {
      this.expandNodesCleanedUp({ nodes: [currentID] });

    }
  }

}

//collapses all nodes that were expanded during deep search
collapseSearch(){

  if(!document.getElementById("myCheckbox").checked ){
    
  
    this.deepSearchExpands.forEach(node => {

      if(this.itemExists(node) && node != this.drawer.rootId){

        this.expandNodesCleanedUp({nodes:[node]});
        this.nodes.update(this.nodes.get(node));

      }

    });

    this.deepSearchExpands = [];
    this.clicked = {};

  }
  

}

//colors the nodes and edges that were found during deep search
deepSearchColorPath(foundNodes){

  this.nodes.get().forEach(node => {
    //if the node is not expanded by deep search and is not in the found nodes, color it white
    if(!this.deepSearchExpands.includes(node.id) && !foundNodes.some(obj => obj.id === node.id) && !this.saveColorsOfPreviousExpandedNodes.includes(node.id)){


      if(node.group != "root"){

        //console.log(node.id)

        node.color = "#ffffff"

        this.nodes.update(node);

      }

    }else{

      // this.saveColorsOfPreviousExpandedNodes.push(node.id);

    }

  });

  this.edges.get().forEach(edge => {

    //if the edge is connected to colored nodes but not white nodes, color it black
    if(!(this.nodes.get(edge.from).color != "#ffffff" && this.nodes.get(edge.to).color != "#ffffff") && !this.saveColorsOfPreviousExpandedNodes.includes(edge.id)){

      edge.color = "#000000"

      this.edges.update(edge);

    }else{

      // this.saveColorsOfPreviousExpandedNodes.push(edge.id);

    }

  });

  //console.log(this.saveColorsOfPreviousExpandedNodes)


}

expandNodesCleanedUp(params) {
    
  if (params.nodes.length > 0) {

    let node = this.nodes.get(params.nodes[0]);

    if ("item" in node && (this.clicked[params.nodes[0]] == false || !("" + params.nodes[0] in this.clicked)) && (this.network.getConnectedNodes(params.nodes[0], "to").length === 0)) {

      // expand node

      let args = {
        //file: config.file, not needed since drawer has own file
        lastId: node.id,
        recursionDepth: 1,
        recursionRootId: node.id,
        recurse: true,
        item: node.item,
        path: node.path,
        oldContext: "",
        lastDepth: node.depth,
        givenDepth: 1,
        mode: true,
        previousNode: node,
      };

      config.drawer.createGraphNodesEdges(args);

      this.clicked[params.nodes[0]] = true;

    } else {

      // collapse Nodes
      this.clicked[params.nodes[0]] = false;

      this.deleteNodesChildren(params.nodes[0]);

    }

  }

}

deepSearch(searchValue){

  //console.log(this.saveColorsOfPreviousExpandedNodes)

  //args to generate full graph
  let args = {
    file: this.drawer.file,
    depth: this.drawer.depth,
    mode: this.drawer.mode,
    rootItem: this.drawer.rootItem,
    recursionDepth: 100000000000,
  }

  //if full graph is not generated, generate it else use it
  if(this.fullGraph == undefined){
      
      this.fullGraph = new isg.GraphDrawer(drawer_config={lang:this.drawer.lang,contractArrayPaths: true}, args);

      var search = this.fullGraph;
  }else{
      
      var search = this.fullGraph;
  }

  //if search value is empty, collapse all expanded nodes and return
  if(searchValue == ""){

    this.collapseSearch();
    this.recolorByProperty();
    // this.saveColorsOfPreviousExpandedNodes = [];
    return;

  }

  //before searching, collapse all expanded nodes from previous search
  this.collapseSearch();

  //search for nodes with label containing search value
  let foundNodes = [];

  const lowercaseSearchValue = searchValue.toLowerCase();
  foundNodes = search.nodes.get().filter(node =>
    node.label.toLowerCase().includes(lowercaseSearchValue)
  );

  if(foundNodes.length == 0){

    this.collapseSearch();
    this.recolorByProperty();
    if(document.getElementById("myCheckbox").checked){

      this.setGraphColorsBlackAndWhite(this.nodes.get(), this.edges.get());

    }
    return;

  }

  this.deepSearchExpands = [];
  
  foundNodes.forEach(node => {

    //expand the paths to the found nodes
    this.deepSearchExpandNodes(node, search);

    let pathsToColor = this.findAllPaths(this.drawer.rootId, node.id);

    for(let i = 0; i < pathsToColor.length; i++){
        
      for(let j = 0; j < pathsToColor[i].length; j++){

        if(!this.deepSearchExpands.includes(pathsToColor[i][j])){

          this.deepSearchExpands.push(pathsToColor[i][j]);

        }

      }
    }

  });

  this.recolorByProperty();
  this.deepSearchColorPath(foundNodes);


  //let search1 = this.searchJSON(this.drawer.file, searchValue)

  //this.expandNodes({nodes:["jsondata/Item:SomePerson"]})

  //console.log(this.itemExists("jsondata/Item:SomePersons"))

}



  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  searchJSON(data, searchValue) {

    // const searchValue = '2022';
    // const jsonPathExpression = `$..[?(@=="${searchValue}")]`;
    const matches = jsonpath.query(data, `$..[?(@=="${searchValue}")]`);

    const result = [...new Set(matches.flatMap(match =>
      jsonpath.paths(data, `$..[?(@=="${match}")]`).map(key =>
        `${key.join('.')}` //: ${match}
      )
    ))];

    return result;

  }


  searchFunctionality(data, searchValue) {

    document.getElementById('search_input').value = "";

    this.deepSearch(searchValue);

  }

  initDeepSearch(){

    const container = document.getElementById('title');

    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.id = 'input-field';
  
    const submitButton = document.createElement('button');
    submitButton.id = 'submit-button';
    submitButton.textContent = 'Submit';
  
    container.appendChild(inputField);
    container.appendChild(submitButton);

    //this.deepSearch("");

    // Create the checkbox element
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    
    // Optionally set additional properties for the checkbox
    checkbox.id = 'myCheckbox';
    container.appendChild(checkbox);
 
    submitButton.addEventListener('click', () => {
      const inputValue = inputField.value;
  
      let inputString = inputValue;
  
      this.searchFunctionality(this.dataFile, inputString)
  
    });

  }





//Removes the given value from the given array
removeItem(arr, value) {
  var index = arr.indexOf(value);
  if (index > -1) {
      arr.splice(index, 1);
  }
  return arr;
}

//Returns all paths between startNode and endNode (main function)
findAllPaths(startNode, endNode) {
  var visitedNodes = [];
  var currentPath = [];
  var allPaths = [];
  this.dfs(startNode, endNode, currentPath, allPaths, visitedNodes);
  return allPaths;
}

//Algorithm to search for all paths between two nodes
dfs(start, end, currentPath, allPaths, visitedNodes) {
  if (visitedNodes.includes(start)) return;
  visitedNodes.push(start);
  currentPath.push(start);
  if (start == end) {
      var localCurrentPath = currentPath.slice();
      allPaths.push(localCurrentPath);
      this.removeItem(visitedNodes, start);
      currentPath.pop();
      return;
  }
  var neighbours = graphtool.network.getConnectedNodes(start);
  for (var i = 0; i < neighbours.length; i++) {
      var current = neighbours[i];
      this.dfs(current, end, currentPath, allPaths, visitedNodes);
  }
  currentPath.pop();
  this.removeItem(visitedNodes, start);


}

//Gets Path array with nodes, returns all possible edge paths
getEdgeLabelStringsForPath(path) {
  var allEdgePaths = this.getEdgePathsForPath(path);
  var allStrings = new Array(allEdgePaths.length);
  for (var i = 0; i < allEdgePaths.length; i++) {
      var s = "";
      for (var j = 0; j < allEdgePaths[i].length; j++) {
          var edge = allEdgePaths[i][j];
          var label = edge.label;
          var nodeId1 = path[j];
          var nodeId2 = path[j + 1];
          if (edge.to == nodeId1 && edge.from == nodeId2) {
              label = this.reverseLabel(label);
          }
          if (j == (allEdgePaths[i].length - 1)) {
              s = s + label;
          } else {
              s = s + label + ".";
          }
      }
      allStrings[i] = s;
  }
  return allStrings;
}

//Gets Path arrays with nodes, returns all possible edge paths (main function)
getAllStringsForAllPaths(paths) {
  var arrayOfAllStrings = [];
  for (var i = 0; i < paths.length; i++) {
      var path = paths[i];
      var allStrings = this.getEdgeLabelStringsForPath(path);
      arrayOfAllStrings.push(allStrings);
  }
  return arrayOfAllStrings;
}

//Gets Path array with nodes, returns Cartesian Product  of edges
getEdgePathsForPath(path) {
  var arraysOfEdgesForNodeInPath = [];
  for (var i = 1; i < path.length; i++) {
      var edgesBetween = this.getAllEdgesBetween(path[i - 1], path[i]);
      var localedgesBetween = edgesBetween.slice();
      
      arraysOfEdgesForNodeInPath.push(localedgesBetween);
  }
  var allEdgePaths = this.getAllCombs(arraysOfEdgesForNodeInPath);
  return allEdgePaths;
}

//Given Label is reversed with "-" or "-" is removed
reverseLabel(label) {
  if (label[0] == "-") {
      return label.substring(1);
  } else {
      return "-" + label;
  }
}

//The function getAllEdgesBetween() returns all edges between two nodes
getAllEdgesBetween(node1, node2) {
  return graphtool.edges.get().filter(function(edge) {
      return (edge.from === node1 && edge.to === node2) || (edge.from === node2 && edge.to === node1);
  });
}

//Cartesian Product of arrays
cartesianProduct(arr) {
  return arr.reduce(function(a,b){
      return a.map(function(x){
          return b.map(function(y){
              return x.concat([y]);
          })
      }).reduce(function(a,b){ return a.concat(b) },[])
  }, [[]])
}

//Cartesian Product of given arrays
getAllCombs(arrays) {
  var allCombs = this.cartesianProduct(arrays);
    return allCombs;
}

//Gets all start nodes and end nodes for the given path

getStartAndEndNodesForPath(path) {
  let startNodes = [];
  let endNodes = [];

  // Get all edges that match the first element of the path
  let allStartEdges = graphtool.edges.get().filter((edge) => {

    return edge.label == path[0];

  });

  // For each start edge, get the "from" node and add it to the start nodes array
  allStartEdges.forEach((startEdge) => {

    let fromNodeId = startEdge.from;

    startNodes.push(graphtool.nodes.get(fromNodeId));

  });

  // Get all edges that match the last element of the path
  let allEndEdges = graphtool.edges.get().filter((edge) => {

    return edge.label == path[path.length - 1];

  });

  // For each end edge, get the "to" node and add it to the end nodes array
  allEndEdges.forEach((endEdge) => {

    let toNodeId = endEdge.to;

    endNodes.push(graphtool.nodes.get(toNodeId));

  });

  return { startNodes, endNodes };

}
//Compares the given path with the current paths and outputs the path nodes if they are equal
comparePaths(path, currentPaths, pathNodes) {

  for(let i = 0; i < currentPaths.length; i++) {

    if(path.join(".") === currentPaths[i]) {

      return pathNodes[0];

    }
  }

  return false;

}
//gets the edge by the given node ids and label
getEdgeByIDsAndLabel(fromNodeID, toNodeID, label){

  const edges = this.edges.get();

  const edge = edges.find((edge) => {
    return edge.from === fromNodeID && edge.to === toNodeID && edge.label === label;
  });

 
  return edge;
}

//Builds the full path (nodes and edges) out of the given path of nodes
buildFullPath(path, currentNodePath){

  let fullPath = [];

  for(let i = 0; i < currentNodePath.length; i++) {
      
      fullPath.push(this.nodes.get(currentNodePath[i]));
  
      if(i < currentNodePath.length - 1) {

        const edge = this.getEdgeByIDsAndLabel(currentNodePath[i], currentNodePath[i + 1], path[i]);
        
        fullPath.push(edge);
  
      }
  
  }

  return fullPath;

}

//removes duplicates from multidimensional array
arrayExistsInMultidimensionalArray(arr, multidimensionalArr) {
  return multidimensionalArr.some((element) => {
    return JSON.stringify(element) === JSON.stringify(arr);
  });
}

//Gets all paths between start and end nodes, that match the given path
getRightPathsBetweenNodes(path, startNodes, endNodes) {

  let rightPaths = [];

  for(let i = 0; i < startNodes.length; i++) {
    for(let j = 0; j < endNodes.length; j++) {

      //gets paths between start and end nodes
      let currentNodePaths = this.findAllPaths(startNodes[i].id, endNodes[j].id);

      //gets edge paths between start and end nodes
      let currentEdgePaths = this.getAllStringsForAllPaths(currentNodePaths);

      //compares the given path with the current paths and outputs the path nodes if they are equal
      let foundPath = this.comparePaths(path, currentEdgePaths[0], currentNodePaths);

      if(foundPath) {
        //builds the full path (nodes and edges)
        let fullPath = this.buildFullPath(path, foundPath);
        
        //removes duplicates
        if(!(this.arrayExistsInMultidimensionalArray(fullPath, rightPaths))){
          rightPaths.push(fullPath);
        }
      }


    }
  }

  return rightPaths;

}

//generates the values array for the color gradient
createValuesArray(paths) {

  let valueArray = [];

  for(let i = 0; i < paths.length; i++) {

      valueArray.push(paths[i][paths[i].length - 1].label);
      
  }
  return valueArray;

}

setGraphColorsBlackAndWhite(nodes, edges) {
  
    //sets all nodes to white
    for(let i = 0; i < nodes.length; i++) {
      nodes[i].color = "#ffffff";
      this.nodes.update(nodes[i]);
    }
  
    //sets all edges to black
    for(let i = 0; i < edges.length; i++) {
      edges[i].color = "#000000";
      this.edges.update(edges[i]);
    }
  
}

//creates an array with all start nodes that are in multiple paths
createOverlapArray(paths) {
  
    let overlap = [];
  
    for(let i = 0 ; i < paths.length; i++) {
      for(let j = 0; j < paths.length; j++) {

        if(i == j) {
          continue;
        }

        if(paths[i][0].id == paths[j][0].id){
          overlap.push(paths[i][0].id);
        }
    
      }
    }
  
    return overlap;
  
}

//colors the paths with the given color array
colorPaths(paths, colorArray, valueArray){

  //creates an array with all start nodes that are in multiple paths
  let overlap = this.createOverlapArray(paths);

  for(let i = 0 ; i < valueArray.length; i++) {
    for(let j = 0; j < paths.length; j++) {

      //only color the paths with the given value
      if(!(paths[j][paths[j].length - 1].label == valueArray[i])){
        continue;
      }

      for(let k = 0; k < paths[j].length; k++) {

        //dont color root node
        if(paths[j][k].group == "root") {

          paths[j][k].color = "#6dbfa9";
          this.nodes.update(paths[j][k]);
          continue;
        }

        //color nodes that are in multiple paths grey
        if(overlap.includes(paths[j][k].id)) {
          paths[j][k].color = "#D3D3D3";
          this.nodes.update(paths[j][k]);
          continue;
        }

        //color nodes with the given color array
        paths[j][k].color = colorArray[i];

        //update nodes and edges
        if(paths[j][k].from) {

          this.edges.update(paths[j][k]);

        }else{

          this.nodes.update(paths[j][k]);

        }

      }
      
    }

  }

}
//chcec if array only contains numbers
containsOnlyNumbers(array) {
  for(let i = 0; i < array.length; i++) {
    if(isNaN(array[i])) {
      return false;
    }
  }
  return true;
}

//creates the color array for the color gradient
createColorArray(startColor, endColor, valueArray) {
  if(this.containsOnlyNumbers(valueArray)) {
    return chroma.scale([startColor, endColor]).mode('hsl').colors(valueArray.length);
  }else{
    let colorArray = chroma.scale([startColor, endColor]).mode('hsl').colors(1);

    for(let i = 0; i < valueArray.length-1; i++) {
      colorArray.push(colorArray[0]);
    }
    return colorArray;
  }
}

//Colors all nodes and edges connected by the given path. The colors are a gradient between the given colors. 
colorByValue(path, nodes, edges, startColor, endColor){

  //this.updatePositions()

  //All start and end nodes for the given path
  let startEndNodes = this.getStartAndEndNodesForPath(path);

  //All paths between start and end nodes, that match the given path
  let pathsToColor = this.getRightPathsBetweenNodes(path, startEndNodes.startNodes, startEndNodes.endNodes);

  //generates the values array for the color gradient
  let valueArray = this.createValuesArray(pathsToColor);  

  //removes duplicates
  valueArray = [...new Set(valueArray)];

  //sorts the array
  valueArray.sort(function (a, b) {
    return a - b;
  });
  
  //creates the color array for the color gradient
  let colorArray = this.createColorArray(startColor, endColor, valueArray);
  
  //sets all nodes to white and all edges to black
  this.setGraphColorsBlackAndWhite(nodes, edges);

  //colors the paths
  this.colorPaths(pathsToColor, colorArray, valueArray);
  
}


}


//let clicked = {};
$(document).ready(function () {

//console.log(graphtool.getAllStringsForAllPaths(graphtool.findAllPaths("jsondata/Item:MyProject/budget/1/value","jsondata/Item:MyProject")))


//let result = jsonpath.query(draw.file, '$..[?(@=="2000")]');

// function pathIsObjectInObject(paths) {

//   for (let i = 0; i < paths.length; i++) {

//     let path = paths[i].split(".");

//     if (Array.isArray(data[path[1]][path[2]]) && typeof data[path[1]][path[2]][0] === 'object' && data[path[1]][path[2]][0] !== null) {

//       let startId = 0;

//       for (let i = 2; i < path.length; i += 2) {

//         if (!(path[i + 1] == undefined)) {
//           const connectedNodeIds = graphtool.network.getConnectedNodes(startId, "to");

//           const connectedNodes = graphtool.nodes.get(connectedNodeIds);

//           const filteredNodes = connectedNodes.filter(node => node.label === path[i]);

//           const filteredNodeIds = filteredNodes.map(node => node.id);

//           let params = {
//             nodes: [filteredNodeIds[path[i + 1]]]
//           }

//           graphtool.expandNodes(params);

//           startId = filteredNodeIds[path[i + 1]];

//         }

//       }


//     } else {

//     }
//   }
// }





});


export {
  GraphTool,
  GraphDrawer,
  vis
}
