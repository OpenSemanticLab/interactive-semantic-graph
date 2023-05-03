const vis = require("vis-network/standalone/esm/index.js")
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
        createContext: (file,item) => this.getItemContextDefault(file,item),
        getEdgeLabel: (item, key) => this.getEdgeLabelDefault(item, key),
        onBeforeCreateEdge: (edge) => this.onBeforeCreateEdgeDefault(edge),
        onBeforeCreateNode: (node) => this.onBeforeCreateNodeDefault(node),
        onBeforeSetColor: [(graph, property) => true],
        onBeforeGetStartItem: [(graph, item) => true],
        onBeforeCreateContext: [(graph, context) => true],
      },

      rootColor: "#6dbfa9",
      nodeDistance: 150,
      lang: "en"
    };

    this.config = utils.mergeDeep(defaultConfig, config);
    console.log("this.config  = ",this.config)
    console.log("args", args)

    this.file = args.file;
    this.rootItem = args.rootItem
    this.rootId = String(this.getItemPathArray(this.rootItem))
    this.depth = args.depth;
    this.mode = args.mode;
    this.id = 0;
    this.lang = this.config.lang;
    this.first = true;
    this.colorObj = {};
    this.h = Math.random();
    this.golden = 0.618033988749895;
    this.createArgs = {
      file: this.file,
      lastId: false,
      item: false,
      oldContext: false,
      lastDepth: false,
      givenDepth: this.depth,
      mode: this.mode
    }

 //   this.context = this.config.callbacks.createContext(this.file);

    if (args.nodes){
      this.nodes = new vis.DataSet(args.nodes);
    }
    else{
      this.nodes = new vis.DataSet()
    }

    if (args.edges){
      this.edges = new vis.DataSet(args.edges);
    }
    else{
      this.edges = new vis.DataSet()
    }
    
    this.createGraphNodesEdges(this.createArgs);

    Object.filter = (obj, predicate) =>
      Object.keys(obj)
      .filter(key => predicate(obj[key]))
      .reduce((res, key) => (res[key] = obj[key], res), {});
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

  getLabelFromLabelArray(labelArray){
    let label
    for (let key in labelArray){
      label = labelArray[key]["text"]
      if (labelArray[key]["lang"] == this.lang){
        return(label)
      }
    }
  }

  getLabelFromContext(context, key) {

    // get property string of shape: Property:PropertyLabel
    let propertyFullName = key
    if (typeof(context[key]) == "object"){
      propertyFullName = context[key]["@id"]
    }
    // replace by name with correct language if available

    if(this.file.jsondata[propertyFullName]){
      propertyFullName = this.getLabelFromLabelArray(this.file.jsondata[propertyFullName]["label"])
      //propertyFullName = this.file.jsondata[propertyFullName]["label"][this.lang]
    }

    if (propertyFullName.startsWith("Property:")){
      return(propertyFullName.replace("Property:", ""))
    }
    return(propertyFullName)
    
  }

  getStartItem(file){
    return(this.rootItem)
  }

  getItemPathArray(item){
    for (let key in this.file.jsondata){
      if (key == item){
        return ["jsondata",key]
      }
    }
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
   // console.log("createCentextDefault file,item:", file, item)
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

  getAngleFromProperty(property){
    let hsla = this.colorObj[property]
    console.log("hsla",hsla)
    let angle = hsla.split(",")[0].split("(")[1]
    angle=angle/180*Math.PI
    return angle
  }

  onBeforeCreateEdgeDefault(edge){
    this.registerPropertyColor(edge.label)
    return edge
  }

  onBeforeCreateNodeDefault(node){

    // set color
    if (node.incomingLabels.length > 0) {
      node.color = this.registerPropertyColor(node.incomingLabels[0])
    }

    //set group
    if (node.depth == 0) {
      node.group = "root",
      node.color = this.config.rootColor
    }
    else{
      node.group = node.incomingLabels[0]
    }

    return node
  }


  getLabelFromItem(item,relativePath = ""){
    // check language for root node and set label according to this.lang
    console.log("item, this.file.jsondata[item]", item, this.file.jsondata[item])

    let labelArray = this.file.jsondata[item].label
    let label = "item"
    if (labelArray){
      this.getLabelFromLabelArray(labelArray)
    }
    return(label)
  }

  getValueFromPathArray(pathArr){
    let object = this.file
    //console.log("object, pathArr: ",object,pathArr)
    
    for (let key in pathArr) {
     // console.log("path_loop:",key,object,pathArr)
      object = object[pathArr[key]]
    }
    //console.log("getValue.. return: ",object)
    return(object)
  }

  getLabelFromPathArray(pathArr){
    let value = this.getValueFromPathArray(pathArr)
    if (typeof(value) == "object" || typeof(value) == "array"){
      return(pathArr[pathArr.length-1])
    }
    else{
      return(value)
    }
  }

  createGraphNodesEdges(args){
    //keys of args: file, lastId, item, relPath, oldContext, lastDepth, givenDepth, mode

    //console.log("args at beginning:", args)
    // TODO: put variables to defaultArgs

    let defaultArgs = {recurse:false,
                       recursionRootId:this.rootId,
                      targetDepth:2}

    

    args = utils.mergeDeep(defaultArgs, args);
    
    let currentItem;
    // set start Item
    if (args.item){
      currentItem = args.item
    }
    else{
      currentItem = this.getStartItem(this.file);
    }
    //console.log("currentItem:", currentItem)

    let currentPath; 
    if (args.path){
      currentPath = args.path
    }
    else{
      currentPath = this.getItemPathArray(currentItem)
    }

    
    //console.log("currentItem, currentPath:", currentItem, currentPath)

    let  currentContext = this.config.callbacks.createContext(this.file, currentItem)
    
    let label = this.getLabelFromPathArray(currentPath);
    
    
    let depth;
    if (args.lastDepth){
      depth = args.lastDepth
    }
    else{
      depth = 0
    }  

    

    // loop through keys / indices of current item 
    
    let currentValue = this.getValueFromPathArray(currentPath)
    // resolve references if possible
    if (Object.keys(this.file.jsondata).includes(currentValue)){
      currentPath = this.getItemPathArray(currentValue)
      currentValue = this.file.jsondata[currentValue]
    }
    let currentNodeId = String(currentPath)

    // calculate distance by previous distances
    let distances = {}
    if (args.previousNode){
      distances[args.recursionRootId] = args.previousNode.distances[args.recursionRootId] + 1
    }
    if (args.recursionRootId == currentNodeId){
      distances[args.recursionRootId] = 0
    }
    // create edge 
    // register color for property and add edge to next node
    //console.log("currentContext,key:",currentContext,key)
    let edgeLabel
    if (args.previousContext){
      if (Object.keys(args.previousContext).includes(args.key)){
        edgeLabel = this.getLabelFromContext(args.previousContext, args.key);
      }
      else{
        edgeLabel = args.key
      }
      
      //let newEdgeId = utils.uuidv4() // String(args.previousPath.push(edgeLabel))
      let newEdgeId = String(args.previousPath) + String(edgeLabel)

      let newEdge = {
        id: newEdgeId,
        from: args.previousNode.id,
        to: currentNodeId,
        label: edgeLabel,
        group: edgeLabel,
        color: this.colorObj[edgeLabel],
        objectKey: args.key
      }
      if (!this.edges.get(newEdge.id)){
        newEdge = this.config.callbacks.onBeforeCreateEdge(newEdge)
      // here the actual edge is created / initialized
      this.edges.update(
        (newEdge)
      )
      }
    }

    // prepare position of new node (after edge is created, such that HSLA is registered)
    let new_x;
    let new_y;
    if(!args.previousNode){
      new_x = 0;
      new_y = 0;
    }
    
    else{
      let angle = this.getAngleFromProperty(edgeLabel)
      console.log("angle",angle)
      new_x = args.previousNode.x + this.config.nodeDistance*Math.cos(angle);
      new_y = args.previousNode.y + this.config.nodeDistance*Math.sin(angle);
    } 
    console.log("x,y",new_x,new_y)

    // create current Node
    let currentNode = {
      id: currentNodeId,
      label: label,
      path: currentPath,
      item: currentItem,
      value: currentValue,
      incomingLabels: [edgeLabel],
      context: currentContext,
      depth: depth,
      distances: distances,
      x: new_x,
      y: new_y,
      //fixed:true

    }
    
    if(!this.nodes.get(currentNode.id)){

      currentNode = this.config.callbacks.onBeforeCreateNode(currentNode)
      console.log("createdNode",currentNode)
      this.nodes.update(currentNode)
      args.recurse = true
    
    }
    if(args.recurse){
      // loop through keys / indices of current item if it is an object / array
      if(typeof(currentValue) === "object"){
      
        for (let key in currentValue){
          let exclude_list = ["type","label"]
          if (!exclude_list.includes(key) && currentNode.distances[args.recursionRootId] < args.targetDepth){
            //console.log("key",key)
            let nextPath = JSON.parse(JSON.stringify(currentPath))
            //console.log("currentPath, key, currentValue, typeof(currentValue):", currentPath, key, currentValue, typeof(currentValue))
            nextPath.push(key)
            //console.log("nextPath:", nextPath)

            
        


            let argsObj = {
              //  lastId: oldId,
                item: args.item, //+ "" + eightDigitRandomNumber,: 
                path: nextPath,
                previousPath:currentPath,
                key: key,
                previousContext: currentContext,
                previousNode: currentNode,
                recursionRootId: args.recursionRootId,
                targetDepth: args.targetDepth,
                lastDepth: depth + 1,
                givenDepth: args.givenDepth,
                mode: args.mode
              }

            this.createGraphNodesEdges(argsObj)
          }
        }
      }
    }
    else{
      console.log("Node: ",currentNode.id," already exists")
    }

      
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


    console.log(this.config)

    this.drawer = config.drawer
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

    this.clicked = {} // object to store expanded nodes TODO: rename to expandedNodes

    this.keyObject = {   // to be removed, was inteded for callback implementation
      doubleclick: (params) => {
        this.expandNodes(params)
      },
    }
    // create a visjs network and attatch it to div
    //console.log(config)

    
    this.nodes = this.drawer.nodes//new vis.DataSet(config.nodes)
    console.log("this.drawer.edges",this.drawer.edges)
    this.edges = this.drawer.edges//new vis.DataSet(config.edges)
    this.data = {
      nodes: this.nodes,
      edges: this.edges,
    };
    this.options = config.options;
    this.network = new vis.Network(this.vis_container, this.data, this.options);
   

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
    /*for (let cls of [NodeClasses.RocketBase, NodeClasses.RocketBase, NodeClasses.Fountain, NodeClasses.DelayNode, NodeClasses.TextSpeechNode, NodeClasses.VideoNode,
        NodeClasses.DrawNode,
        NodeClasses.CameraNode, NodeClasses.ImageNode, NodeClasses.CsvNode,
        NodeClasses.JSONNode, NodeClasses.JSONNode1, NodeClasses.JSONSchemaNode
      ]) {
      console.log(cls)
      this.classRegistry.register(cls)
    }*/

    // Initialize GUI for various functions acting on the graph.
    this.colorPicker(this);
    this.loadSaveFunctionality();
    this.createLegend();
    this.createSearchUI()
    this.oldNodeColors = {};
    this.oldEdgeColors = {};


    // set visjs network callbacks

    this.network.on("click", (params) => {
      console.log(
        "Click event, ",
      );
      this.showSelectionOptions()
      // TODO: move definition of keyboard shortcuts to this.registerKeyboardShortcuts
      if (this.pressed_keys.includes('a')) {
        //add a node to position of mouse if a is pressed during click
        let addNode = new NodeClasses.BaseNode(this)
        addNode.x = params.pointer.canvas.x
        addNode.y = params.pointer.canvas.y
        this.nodes.update(addNode)
      }

      if (this.pressed_keys.includes('q')) {
        // show global JSON vis JSONeditor in options div

        let optionsDivId = this.options_container.id
        console.log('show global JSON')
        document.getElementById(optionsDivId).innerHTML = "<button id='setButton'>set!</button><br><div id='editor_div'></div>"
        let setButton = document.getElementById("setButton") // todo: implement changes


        let options = {
          mode: 'tree',
          modes: ['code', 'tree'] // ['code', 'form', 'text', 'tree', 'view', 'preview']}
        }

        let editor_div = document.getElementById("editor_div",options)
        // create a JSONEdior in options div
        let editor = new JSONEditor(editor_div)  // TODO: Editor is currently not rendered. find error.
        
        editor.set({
          edges: this.edges.get(),
          nodes: this.nodes.get()
        })
      }
    });

    this.network.on("doubleClick", (params) => {

      this.keyObject.doubleclick(params); // TODO: implement central callback object
    });


    this.network.on("oncontext", (params) => {
      console.log('in this.network.on(oncontext)') // TODO: implement right click, probably Property-List, but as callback function.
    });

    this.network.on('dragStart', (params) => {
      console.log("dragStart");
      
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
            newNode.id = config.drawer.id;
            newNode.depth = this.nodes.get(this.network.getSelectedNodes()[index]).depth + 1;
            config.drawer.id += 1;
            
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
    });

    this.network.on('dragEnd', (params) => {
    
      params.nodes.forEach((node_id) => {
        let node = this.nodes.get(node_id)
        let position = this.network.getPosition(node_id)
        //setting the current position is necessary to prevent snap-back to initial position
        node.x = position.x
        node.y = position.y
        node.fixed = true
        this.nodes.update(node)
      })

    });
    

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
        this.copiedNodes = this.network.getSelectedNodes()
        this.copiedEdges = this.network.getSelectedEdges()
      }
      // paste
      if (event.key == "v" && this.pressed_keys.includes("Control")) {
        //paste copied nodes
        
        if (this.copiedNodes.length > 0 && this.network.getSelectedNodes().length > 0) {
          //console.log('paste')

          // TODO: encapsulate in: this.pasteNodeIntoExistingItem() 
          // TODO: paste node into empty space and create corresponding item this.pasteNodeIntoNewItem(node,xy) 
          let xy = this.network.DOMtoCanvas({
            x: this.mouseX,
            y: this.mouseY
          })

          this.copiedNodes.forEach((node_id, index) => {
            if (this.nodes.get(this.network.getSelectedNodes()[index]).item) {
              let oldNode = this.nodes.get(node_id)

              let newNode = this.duplicateNode(oldNode)
              let keys = Object.getOwnPropertyNames(oldNode)

              keys.forEach((key) => {
                if (!(key === "id") && !((typeof (oldNode[key])) == "function")) {
                  newNode[key] = oldNode[key]
                  // console.log("copy:",key,oldNode[key])
                } else {
                  //console.log("don't copy:",key,oldNode[key])
                }
                newNode.x = xy.x
                newNode.y = xy.y
              })
              newNode.id = config.drawer.id;
              newNode.depth = this.nodes.get(this.network.getSelectedNodes()[index]).depth + 1;

              config.drawer.id += 1;

              let newEdge = {
                from: this.network.getSelectedNodes()[0],
                to: newNode.id,
                label: this.edges.get(this.copiedEdges[index]).label,
                color: newNode.color,
                group: newNode.group,
                objectKey: this.edges.get(this.copiedEdges[index]).objectKey
              }

              if (newNode.group != "root") {
                this.nodes.update(newNode);
                this.edges.update(newEdge);
                console.log(config,config.file)
                if (newNode.item) {

                  if (newNode.context) {

                    config.drawer.createGraphNodesEdges(config.file, newNode.id, newNode.item, newNode.context, newNode.depth, "", true);   

                  } else {
                    config.drawer.createGraphNodesEdges(config.file, newNode.id, newNode.item, "", newNode.depth, "", true);

                  }

                  this.nodes.update(nodes);
                  this.edges.update(edges);
                }

                this.addToJSON(newNode, newEdge);

              }
            }
          });
        }
      }
    }, false);
    document.addEventListener('keyup', (event) => {
      const index = this.pressed_keys.indexOf(event.key);
      if (index > -1) { // only splice array when item is found
        this.pressed_keys.splice(index, 1); // 2nd parameter means remove one item only
      }
    }, false);

    // Rectangular selection:
    this.vis_container.onmousemove = (event) => {
      this.mouseX = event.clientX
      this.mouseY = event.clientY - 30
    }

   // this.initRectangleSelection()
    this.initDragAndDrop()
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

  initRectangleSelection() {
    // Multiselect functionality 
    this.network.setOptions({
      interaction: {
        dragView: false,
        multiselect: true
      }
    })

    var canvas;
    var ctx;
    var container = this.vis_container


    canvas = this.network.canvas.frame.canvas;
    ctx = canvas.getContext('2d');

    var rect = {},
      drag = false;
    var drawingSurfaceImageData;

    const saveDrawingSurface = () => {
      drawingSurfaceImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    const restoreDrawingSurface = () => {
      ctx.putImageData(drawingSurfaceImageData, 0, 0);
    }

    const selectNodesFromHighlight = () => {
      var fromX, toX, fromY, toY;
      var nodesIdInDrawing = [];
      var xRange = getStartToEnd(rect.startX, rect.w);
      var yRange = getStartToEnd(rect.startY, rect.h);


      var allNodes = this.nodes.get();
      for (var i = 0; i < allNodes.length; i++) {
        var curNode = allNodes[i];
        var nodePosition = this.network.getPositions([curNode.id]);
        var nodeXY = this.network.canvasToDOM({
          x: nodePosition[curNode.id].x,
          y: nodePosition[curNode.id].y
        });
        if (xRange.start <= nodeXY.x && nodeXY.x <= xRange.end && yRange.start <= nodeXY.y && nodeXY.y <= yRange
          .end) {
          nodesIdInDrawing.push(curNode.id);
        }
      }
      console.log(nodesIdInDrawing)

      console.log("network.selectNodes")
      this.network.selectNodes(nodesIdInDrawing);


    }

    const getStartToEnd = (start, theLen) => {
      return theLen > 0 ? {
        start: start,
        end: start + theLen
      } : {
        start: start + theLen,
        end: start
      };
    }

    container.addEventListener("mousemove", function (e) {
      if (drag) {

        drag = "mousemove"
        restoreDrawingSurface();
        rect.w = (e.pageX - this.offsetLeft) - rect.startX;
        rect.h = (e.pageY - this.offsetTop) - rect.startY;

        ctx.setLineDash([5]);
        ctx.strokeStyle = "rgb(0, 102, 0)";
        ctx.strokeRect(rect.startX, rect.startY, rect.w, rect.h);
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
        ctx.fillRect(rect.startX, rect.startY, rect.w, rect.h);
      }
    });

    container.addEventListener("mousedown", function (e) {
      console.log(e)
      if (e.button == 0) {
        //var selectedNodes = e.ctrlKey ? this.network.getSelectedNodes() : null;

        saveDrawingSurface();
        var that = this;
        rect.startX = e.pageX - this.offsetLeft;
        rect.startY = e.pageY - this.offsetTop;
        drag = "mousedown";
        container.style.cursor = "crosshair";
      }
    });

    container.addEventListener("mouseup", (e) => {
      if (e.button == 0) {



        let prev_selectedNodes = this.network.getSelectedNodes()
        console.log('drag', drag, prev_selectedNodes)

        if (prev_selectedNodes.length == 0) {

          selectNodesFromHighlight();
          this.showSelectionOptions();
        }
        restoreDrawingSurface();
        drag = false;

        container.style.cursor = "default";

      }
      console.log("end of mouse up", )
    });

    document.body.oncontextmenu = function () {
      console.log('oncontextmenu');
      return false;
    };
  }


  initDragAndDrop() {
    // drag & drop functionality

    var container = this.vis_container
    const handleDrop = (e) => {
      console.log(e)
      e.stopPropagation(); // Stops some browsers from redirecting
      e.preventDefault();

      var files = e.dataTransfer.files;
      console.log(files)
      for (let file of files) {

        // images 
        if (file.type === 'image/png' ||
          file.type === 'image/jpeg') {
          // add image node to network

          let xy = this.network.DOMtoCanvas({
            x: e.clientX,
            y: e.clientY
          })
          console.log("xy", xy)

          // read file 
          console.log(file);

          let reader = new FileReader(this);
          reader.onload = (event) => {
            //console.log(event.target.result);
            let newNode = new NodeClasses.ImageNode(this, utils.uuidv4(), xy.x, xy.y, event.target.result)
            console.log("create Image node", newNode)
            this.nodes.update(newNode)
          };
          console.log(file);
          console.log(reader.readAsDataURL(file));
        }

        // csv files
        else if (file.type === 'application/vnd.ms-excel' && file.name.endsWith('.csv')) {
          // add csv node
          let xy = this.network.DOMtoCanvas({
            x: e.clientX,
            y: e.clientY
          })
          console.log("xy", xy)

          // read file 
          console.log(file);

          let reader = new FileReader(this);
          reader.onload = (event) => {
            //console.log(event.target.result);
            let newNode = new NodeClasses.CsvNode(this, utils.uuidv4(), xy.x, xy.y, event.target.result)
            console.log("create CSV Node", newNode)
            this.nodes.update(newNode)
          };
          console.log(file);
          console.log(reader.readAsText(file));
        }

        // mp4 files  (not working so far)
        else if (file.type === 'video/mp4') {
          // add cameraNode node
          let xy = this.network.DOMtoCanvas({
            x: e.clientX,
            y: e.clientY
          })
          console.log("xy", xy)

          // read file 
          console.log(file);

          let reader = new FileReader(this);
          reader.onload = (event) => {
            console.log(event.target.result);
            console.log(event.target)
            console.log(reader.readAsDataURL(event.target.result))
            let newNode = new NodeClasses.VideoNode(this, utils.uuidv4(), xy.x, xy.y, reader.readAsDataURL(event.target.result))

            console.log("create CSV Node", newNode)
            this.nodes.update(newNode)
          };
          console.log(file);
          console.log(reader.readAsText(file));
        } else {
          window.alert('File type ' + file.type + ' not supported');
        }



      }
    }

    container.addEventListener('dragenter', function (e) {
      console.log("dragenter", e)
      e.preventDefault()
      console.log("container.style", container, container.style.border)
      container.style.border = "1px solid black"
      // container.style.cssText = "border: 5px solid lightgray"

    }, false)
    container.addEventListener('dragleave', function (e) {
      console.log("dragleave", e)
      container.style.border = "1px solid lightgray"
    }, false)
    container.addEventListener('drop', function (e) {
      console.log("dragdrop", e);
      e.preventDefault
      handleDrop(e)
    }, false)
    container.addEventListener('dragover', function (e) {
      e.preventDefault()
    }, false)
  }

  showOptions_default(node, optionsDivId = 'optionsDiv') {
    document.getElementById(optionsDivId).innerHTML = "<button id='setButton'>set!</button><br><div id='editor_div'></div>"
    let setButton = document.getElementById("setButton")
    let schema = {
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
      },
    }
    let options = {
      schema: schema,
      // schemaRefs: {"job": job},
      mode: 'tree',
      modes: ['code', 'tree'] // ['code', 'form', 'text', 'tree', 'view', 'preview']}
    }
    let editor = new JSONEditor(editor_div, options)
    // make object of own properties

    editor.set(node)
    console.log(editor)
    editor.onChange = (param) => {
      console.log(param)
    }
    setButton.addEventListener('click', () => {
      console.log("editor:", editor, editor.navBar.textContent.split('►'), editor.navBar.textContent.split('j'))

      console.log(node, editor.get())
      node = editor.get()
      this.nodes.update(node)
    })
  }



  createSearchUI() {

    // create the input element
    let inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.id = 'search_input';

    // add the event listener to the input element
    inputField.addEventListener('input', () => {

      this.searchNodes(inputField.value)


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

    this.updatePositions()

    if (this.handleCallbacks({
        id: 'onBeforeSearchNodes',
        params: {
          graph: this,
          searchString: searchString
        }
      })) {
      // let nodes = this.nodes.get();
      // let edges = this.edges.get();

      this.nodes.forEach((node) => {
        if (!this.oldNodeColors[node.id]) {
          this.oldNodeColors[node.id] = node.color;
        }
      });

      this.edges.forEach((edge) => {
        if (!this.oldEdgeColors[edge.id]) {
          this.oldEdgeColors[edge.id] = edge.color;
        }
      });

      this.nodes.forEach((node) => {

        node.color = this.oldNodeColors[node.id];
        this.nodes.update(node);
      });

      this.edges.forEach((edge) => {

        edge.color = this.oldEdgeColors[edge.id]
        this.edges.update(edge);
      });
      if (document.getElementById('search_select').value === 'search_edge') {
        this.edges.forEach((edge) => {

          if (!(edge.label.toLowerCase().includes(searchString.toLowerCase()))) {

            edge.color = "#000000";
            this.edges.update(edge);

            this.nodes.forEach((node) => {

              if (edge.to == node.id) {
                node.color = "#ffffff";
                this.nodes.update(node);
              }

            });

          }

        });
      }

      if (document.getElementById('search_select').value === 'search_node') {
        this.nodes.forEach((node) => {

          if (!(node.label.toLowerCase().includes(searchString.toLowerCase()))) {

            if (node.group != "root") {

              node.color = "#ffffff";
              this.nodes.update(node);
            }

          }

        });
        if (searchString != "") {
          this.edges.forEach((edge) => {


            edge.color = "#000000";
            this.edges.update(edge);


          });
        }
      }

      // this.nodes.update(nodes);
      // this.edges.update(edges);

    }
  }



  //Adds copied nodes to the given JSON
  addToJSON(node, edge) {

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

        //console.log(new_json["jsondata"][mainObject.item])
      }
      //console.log(new_json["jsondata"])
    }


    console.log(config.file["jsondata"])

  }

  duplicateNode(node) {
    console.log('duplicateNode')
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

  run_recursive(node_id) {
    let node = this.nodes.get(node_id)
    if ("run" in node) {
      node.run()
    } else {
      let conn_edges = this.network.getConnectedEdges(node.id)
      console.log(conn_edges)
      conn_edges.forEach(function (edge_id) {
        let edge = this.edges.get(edge_id)
        if (edge.from == node_id) {
          let neighbor_node = this.nodes.get(edge.to)
          console.log(neighbor_node)
          if (neighbor_node.run) {
            neighbor_node.run()
          } else {
            window.setTimeout(function () {
              console.log("no run, recurse in " + neighbor_node)
              run_recursive(edge.to)
            }, 200)
          }
        }
      })
      console.log(this.network.getConnectedNodes(node.id))
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

  recolorByProperty() {
    this.updatePositions()
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

  //Colors all nodes and edges connected by the given path. The colors are a gradient between the given colors. 
  colorByValue(path, nodes, edges, startColor, endColor) {

    let tempArray = [];

    for (let i = 0; i < path.length; i++) {

      tempArray.push(this.getAllEdgesWithLabel(edges, path[i]));

    }


    let thingsToColor = [];

    if (path.length == 1) {

      for (let index = 0; index < tempArray[0].length; index++) {
        
        for (let node of this.nodes.get()) {

          if (tempArray[0][index].from == node.id || tempArray[0][index].to == node.id) {

            thingsToColor.push(node);

          }

        }

        thingsToColor.push(tempArray[0][index]);

      }

    }

    for (let i = 0; i < tempArray.length; i++) {

      for (let j = 0; j < tempArray[i].length; j++) {

        if (tempArray.length == i + 1) {

          for (let p = 0; p < nodes.length; p++) {
            nodes[p].color = "#ffffff"
          }

          for (let p = 0; p < edges.length; p++) {
            edges[p].color = "#000000"
          }

          for (let l = 0; l < thingsToColor.length; l++) {
            delete thingsToColor[l].path;
          }

          let colorPath = 0;
          let valueArray = [];

          for (let k = 0; k < thingsToColor.length; k++) {

            if (thingsToColor[k].from) {

              let valueEdge = Object.filter(thingsToColor, thing => thing.label == path[path.length - 1]);
              let valueEdgeKey = Object.keys(valueEdge);


              for (let m = 0; m < valueEdgeKey.length; m++) {

                let valueNode = Object.filter(thingsToColor, thing => thing.id == valueEdge[valueEdgeKey[m]].to)

                let valueNodeKey = Object.keys(valueNode)[0];

                valueArray.push(valueNode[valueNodeKey].label);

              }

              let fromNode = Object.filter(thingsToColor, thing => thing.id == thingsToColor[k].from)

              let fromNodeKey = Object.keys(fromNode)[0];

              let toNode = Object.filter(thingsToColor, thing => thing.id == thingsToColor[k].to)

              let toNodeKey = Object.keys(toNode)[0];

              if (fromNode[fromNodeKey].path) {

                thingsToColor[k].path = fromNode[fromNodeKey].path
                toNode[toNodeKey].path = fromNode[fromNodeKey].path

              } else if (toNode[toNodeKey].path) {

                thingsToColor[k].path = toNode[toNodeKey].path
                fromNode[fromNodeKey].path = toNode[toNodeKey].path

              } else {

                thingsToColor[k].path = colorPath;
                toNode[toNodeKey].path = colorPath;
                fromNode[fromNodeKey].path = colorPath;

                colorPath++;

              }

            }

          }


          valueArray = [...new Set(valueArray)];

          valueArray.sort(function (a, b) {
            return a - b;
          });

          if (valueArray.length == 0) {
            var colorArray = chroma.scale([startColor, endColor]).mode('hsl').colors(colorPath)
          } else {
            var colorArray = chroma.scale([startColor, endColor]).mode('hsl').colors(valueArray.length)
          }


          for (let n = 0; n < valueArray.length; n++) {

            let nodeWithValue = Object.filter(thingsToColor, thing => thing.label == valueArray[n])

            let nodeWithValueKey = Object.keys(nodeWithValue)[0];

            for (let o = 0; o < thingsToColor.length; o++) {

              if (thingsToColor[o].path == nodeWithValue[nodeWithValueKey].path) {

                thingsToColor[o].color = colorArray[n];

              }

            }

          }

          return;

        }

        for (let k = 0; k < tempArray[i + 1].length; k++) {

          if (tempArray[i][j].to == tempArray[i + 1][k].from && tempArray[i + 1][k].label == path[i + 1] && tempArray[i][j].label == path[i]) {

            for (let index = 0; index < nodes.length; index++) {

              if (nodes[index].id == tempArray[i][j].to) {

                thingsToColor.push(nodes[index])

              }

              if (nodes[index].id == tempArray[i + 1][k].to) {

                thingsToColor.push(nodes[index])

              }
            }

            thingsToColor.push(tempArray[i][j]);

            thingsToColor.push(tempArray[i + 1][k]);

          }

        }

      }

    }

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
      if(!reachableNodes.includes(children[i])){
        reachableNodes.push(children[i]);
      }
      
    }
    return(reachableNodes)
  }

  //deletes the reachable nodes from the given node ID
  deleteNodesChildren(nodeId, deleteEdge, clickedNode) {

    console.log("deleteNodesChildren")
    console.log("before",this.edges.get(),this.drawer.edges)
    let excludedIds = [];
    if (deleteEdge === true) {
      console.log("deleteEdge true")
    } else {
      excludedIds.push(nodeId);
    }

    let reachableNodesTo = [];
    reachableNodesTo = this.getAllReachableNodesTo(this.drawer.rootId, excludedIds, reachableNodesTo);
    let nodesToDelete = [];
    let allIds = this.nodes.getIds();
    
    console.log("allIds, reachableNodesTo",allIds, reachableNodesTo)

    for (let i = 0; i < allIds.length; i++) {
      if (reachableNodesTo.includes(allIds[i])) {
        console.log("continued")
        continue;
      }
      
      if (allIds[i] == nodeId) {
        console.log("deleteEdges nodeId", nodeId)
        this.deleteEdges(nodeId);
        continue;
      }
      
      nodesToDelete.push(allIds[i]);
      this.deleteEdges(allIds[i]);
      console.log("short after",this.edges.get(),this.drawer.edges)
    

      nodes = this.removeObjectWithId(nodes, allIds[i])

      this.nodes.remove(allIds[i]);

    }
    console.log("after",this.edges.get(),this.drawer.edges)
    return nodesToDelete;
  }
  //deletes edges that are connected to the given node ID
  deleteEdges(nodeID) {

    console.log("deleteEdges, nodeID", nodeID)
    this.network.getConnectedEdges(nodeID).forEach((edgeID)=>{
      this.edges.remove(edgeID)
      console.log("removed edge with ID:", edgeID)
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

  updatePositions(){
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
          //console.log(key,subValue);
          let objectToRepeat = {
            repeat: key
          }

          this.legendFunctionality(objectToRepeat);

        }
      }
    }


    // Array.from(options.groups).forEach((group)=> {

    //   console.log(group)

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
          //console.log(key,subValue);
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
     

    console.log("expandNodes, params:", params)

    this.searchNodes("");
    document.getElementById("search_input").value = "";

    if (params.nodes.length > 0) {
      
      let node = this.nodes.get(params.nodes[0]);
      console.log ("node:", node)
      if ("item" in node && (this.clicked[params.nodes[0]] == false || !("" + params.nodes[0] in this.clicked)) && (this.network.getConnectedNodes(params.nodes[0], "to").length === 0)) {
        console.log("fist case",config)
        // expand node

        let args = {
          //file: config.file, not needed since drawer has own file
          lastId: node.id,
          targetDepth: 1,
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
        console.log("expand nodes with args:",args)
        config.drawer.createGraphNodesEdges(args);

        this.createLegend()

        if (document.querySelector('#myDropdown select').value == "setColorByValue") {

          this.colorByValue([document.querySelector('#setColorByValueInput').value], nodes, edges, document.querySelector('#startColor').value, document.querySelector('#endColor').value)
        }
        //this.colorByValue(["value"], nodes, edges)
        this.clicked[params.nodes[0]] = true;

        // this.network.body.data.nodes.update(nodes);
        // this.network.body.data.edges.update(edges);


      //  this.nodes.update(nodes);
      //  this.edges.update(edges);

      } else {
        // collapse Nodes
        console.log("second case, clollapse nodes, config:",config)
        this.clicked[params.nodes[0]] = false;
        //let conEdges = this.network.getConnectedEdges(params.nodes[0], "from")
        this.deleteNodesChildren(params.nodes[0]);
        this.createLegend()

        if (this.legendInvisibleGroups(this.options).length == 0) {
          this.nodes.update(nodes);
          this.edges.update(edges);
        }
        //console.log(this.nodes.get())

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

      let tempArray = path.split(",")

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
        graph.nodes.update(nodes)
        graph.edges.update(edges)
      }
      //alert("Selected value: " + selectedValue);
    });

  }
  // loads or saves the graph to a .txt file
  loadSaveFunctionality() {

    let element = document.createElement("BUTTON");
    element.innerHTML = "Save state";
    element.id = "save";
    element.addEventListener("click", this.createSaveStateFunctionality);
    document.getElementById("title").append(element)

    let element2 = document.createElement("BUTTON");
    element2.id = "load"
    element2.innerHTML = "Load state";
    element2.addEventListener("click", ()=>{this.createLoadStateFunctionality()});

    document.getElementById("title").append(element2)

  }

  createSaveStateFunctionality() {

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

  createLoadStateFunctionality() {
    const input = document.createElement("input");
    input.type = "file";
    console.log(this)

    const loadState = this.config.callbacks.loadState
    input.addEventListener("change", (ev)=>{
      console.log("in callback funktion, ev:",ev)
      loadState(ev)})//,()=> this.config.callbacks.loadState(input) );
    input.click();
  }

  loadStateDefault(input){
    console.log("input:",input)
    const reader = new FileReader();
    reader.onload = () => {
      const jsonData = JSON.parse(reader.result);
      if (jsonData.state) {
        config.nodes = jsonData.state.nodes;
        config.edges = jsonData.state.edges;

        nodes = jsonData.state.nodes;
        edges = jsonData.state.edges;

        //this.drawer = new GraphDrawer(callback_config, jsonData, 5, true, nodes, edges);
        console.log(this)
        this.drawer.edges = jsonData.state.edges;
        this.drawer.nodes = jsonData.state.nodes;

        config = {
          nodes: jsonData.state.nodes,
          edges: jsonData.state.edges,
          options: options,
          drawer: drawer,
          file: config.file
        };

        document.getElementById("mynetwork").innerHTML = "";

        document.getElementById('myDropdown').remove();
        document.getElementById('save').remove();
        document.getElementById('load').remove();
        document.getElementById('search_input').remove();
        document.getElementById('search_select').remove();

        if (document.getElementById('setPath')) {
          document.getElementById('setPath').remove();
        }
        let  graphtool = new GraphTool("mynetwork", config);
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

      if (jsonData.state.colorFunction == "setColorByValue") {
        graphtool.changeColorDropdown("myDropdown", "setColorByValue")
        document.querySelector('#myDropdown select').dispatchEvent(new Event("change"));
        graphtool.changeStartEndColorDropdown("startColor", jsonData.state.colorByValue.startColor);
        graphtool.changeStartEndColorDropdown("endColor", jsonData.state.colorByValue.endColor);
        document.getElementById("setColorByValueInput").value = jsonData.state.colorByValue.path;
        graphtool.colorByValue([jsonData.state.colorByValue.path], nodes, edges, jsonData.state.colorByValue.startColor, jsonData.state.colorByValue.endColor)
        graphtool.nodes.update(nodes);
        graphtool.edges.update(edges);
      }

      delete jsonData.state;
      config.file = jsonData;


    };
    reader.readAsText(input.target.files[0]);
    
  }
  //generates the legend for the graph
  createLegend() {
    var invisibleGroups = [];
    console.log('createLegend')

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
      //console.log("legendSet,edges",legendSet,edge)
      
      if (!legendSet[edge.group]) {
        //console.log('add item to legend, edge.group, legendSet[edge.group]',edge.group, legendSet[edge.group])
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

        //console.log("legendColors:",legendColors)
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


    console.log("setNodeVisibility")
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
      let  connectedNodes = this.nodes.get(connectedNodesIds);
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
    console.log(this.options.groups);
    let legendGroup;
    let group;
    let nodeChildren;
    let strategy = "strategy2"

    console.log("begining of legend Functionality",e)
    this.updatePositions()
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
      if (!this.pressed_keys.includes('q')){
        this.options_container.innerHTML = ""
      }


    } else if (sel_nodes.length == 1) {
      // show options of single node
      console.log("show options")
      let node = this.nodes.get(sel_nodes[0])
      if (typeof node.showOptions === 'function') {
        console.log(node, node.showOptions, this.options_container.id)
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
          console.log(cell)
          let node = this.nodes.get(cell._cell.row.data.id)
          let id = cell._cell.row.data.id
          node.fixed = Boolean(cell._cell.value)
          console.log(node)
          this.nodes.update(node)
        }

        const xEdit = (cell) => {
          console.log(cell)
          console.log(cell._cell.row.data.id)
          let node = this.nodes.get(cell._cell.row.data.id)

          let id = cell._cell.row.data.id
          let x = cell._cell.value
          let y = node.y
          console.log(id, x, y)
          this.network.moveNode(id, x, y)
          this.nodes.update({
            id: id,
            x: x
          })
        }

        const yEdit = (cell) => {
          console.log(cell)
          console.log(cell._cell.row.data.id)
          let node = this.nodes.get(cell._cell.row.data.id)

          let id = cell._cell.row.data.id
          let x = node.x
          let y = cell._cell.value
          console.log(id, x, y)
          this.network.moveNode(id, x, y)
          this.nodes.update({
            id: id,
            y: y
          })
        }

        const colorEdit = (cell) => {
          console.log(cell)
          console.log(cell._cell.row.data.id)
          let node = this.nodes.get(cell._cell.row.data.id)

          let id = cell._cell.row.data.id

          node.color = JSON.parse(cell._cell.value)
          console.log('new node color: ', node.color)
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
          console.log(cell)
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
          console.log(cell)
          for (let node_id of this.network.getSelectedNodes()) {
            let node = this.nodes.get(node_id)
            let id = node_id
            let x = node.x
            let y = cell._cell.value
            console.log(id, x, y)
            this.network.moveNode(id, x, y)
            this.nodes.update({
              id: id,
              y: y
            })
          }
        }
        const allColorEdit = (cell) => {
          console.log(cell)
          for (let node_id of this.network.getSelectedNodes()) {
            let node = this.nodes.get(node_id)
            node.color = JSON.parse(cell._cell.value)
            this.nodes.update(node)
          }
        }

        const allFixedEdit = (cell) => {
          console.log(cell)
          for (let node_id of this.network.getSelectedNodes()) {
            let node = this.nodes.get(node_id)
            node.fixed = Boolean(cell._cell.value)
            console.log(node)
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
}


//let clicked = {};

$(document).ready( () => {

  //let result = jsonpath.query(this.drawer.file, '$..[?(@=="2000")]');

  let data = clone.jsondata;


  console.log(data)

  function findKeyPath(obj, key, path = '', results = []) {
    for (let prop in obj) {
      if (prop === key && Array.isArray(obj[prop]) && obj[prop].every(item => typeof item === 'object' && item !== null)) {
        results.push(path + prop);
      }
      if (typeof obj[prop] === 'object' && obj[prop] !== null) {
        findKeyPath(obj[prop], key, path + prop + '.', results);
      }
    }
    return results;
  }


  function searchJSON(data, searchValue) {

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
  var idsToColor = [];

  var coloredNodesConnectedToRoot = [];

  function IsStartObjectInGraph(foundPaths, searchValue, initialSearchValue) {

    //console.log(foundPaths)

    let nodesWithObject = [];

    let objectInOnject = [] //findKeyPath(data, searchValue);

    if (objectInOnject.length == 0) {

      for (let i = 0; i < foundPaths.length; i++) {

        let path = foundPaths[i].split(".")[1];

        let path2 = foundPaths[i].split(".");


        if (Array.isArray(data[path2[1]][path2[2]]) && typeof data[path2[1]][path2[2]][0] === 'object' && data[path2[1]][path2[2]][0] !== null) {

          let startId = 0;
          let nodes = graphtool.nodes.get();
          //let idsToColor = [];

          const nodesWithLabel = graphtool.nodes.get({
            filter: function (node) {
              return (node.item === path2[1]);
            }
          });

          if (nodesWithLabel.length > 0) {

            startId = nodesWithLabel[0].id;

          }

          if (!(path2[1] == nodes[0].item) && nodesWithLabel.length == 0) {

            let searchExistingNodes = searchJSON(data, path2[1]);
            //console.log(searchExistingNodes)
            let found = IsStartObjectInGraph(searchExistingNodes, false, initialSearchValue);
            //console.log(found)
            idsToColor.push(found[0].id);

            let params = {
              nodes: [found[0].id]
            }

            graphtool.expandNodes(params);

            let objectInOnject = findKeyPath(data, initialSearchValue);

            if (objectInOnject.length == 0) {

              console.log("here")
              searchExistingNodes = searchJSON(data, searchValue);

              found = IsStartObjectInGraph(searchExistingNodes, false, initialSearchValue);
            } else {

              const nodesWithLabel = graphtool.nodes.get({
                filter: function (node) {
                  return (node.item === path2[1]);
                }
              });

              for (let i = 0; i < nodesWithLabel.length; i++) {

                idsToColor.push(nodesWithLabel[i].id);

                let params = {
                  nodes: [nodesWithLabel[i].id]
                }

                graphtool.expandNodes(params);
              }

              console.log(idsToColor)

              let nodes = graphtool.nodes.get();

              nodes.forEach((node) => {

                if (node.label == initialSearchValue || idsToColor.includes(node.id)) {
                  node.color = this.drawer.colorObj[node.group];
                  graphtool.nodes.update(node);
                  idsToColor.push(node.id)
                }

                if (!(idsToColor.includes(node.id)) && node.id != 0 && node.label != initialSearchValue) {
                  node.color = "#ffffff"
                  graphtool.nodes.update(node);
                }

              });

              let edges = graphtool.edges.get();

              edges.forEach((edge) => {

                if (idsToColor.includes(edge.to)) {
                  edge.color = this.drawer.colorObj[edge.group];
                  graphtool.edges.update(edge);
                }

                if (!(idsToColor.includes(edge.to))) {
                  edge.color = "#000000"
                  graphtool.edges.update(edge);
                }




              });

            }

          }
          if (nodesWithLabel.length > 0 || path2[1] == nodes[0].item) {


            for (let i = 2; i < path2.length; i += 2) {
              // console.log(startId)
              // console.log(path2)

              if (!(path2[i + 1] == undefined)) {


                let connectedNodeIds = graphtool.network.getConnectedNodes(startId, "to");

                if (connectedNodeIds.length == 0) {

                  idsToColor.push(startId);

                  let params = {
                    nodes: [startId]
                  }

                  graphtool.expandNodes(params);

                }

                connectedNodeIds = graphtool.network.getConnectedNodes(startId, "to");

                const connectedNodes = graphtool.nodes.get(connectedNodeIds);

                const filteredNodes = connectedNodes.filter(node => node.label === path2[i]);

                const filteredNodeIds = filteredNodes.map(node => node.id);

                idsToColor.push(filteredNodeIds[path2[i + 1]]);

                let params = {
                  nodes: [filteredNodeIds[path2[i + 1]]]
                }

                let connectedNodesSet = graphtool.network.getConnectedNodes(filteredNodeIds[path2[i + 1]], "to");

                if (connectedNodesSet.length == 0) {

                  graphtool.expandNodes(params);

                }

                startId = filteredNodeIds[path2[i + 1]];

              }

            }


            let nodes = graphtool.nodes.get();

            nodes.forEach((node) => {



              if (node.label == initialSearchValue || idsToColor.includes(node.id)) {
                node.color = this.drawer.colorObj[node.group];
                graphtool.nodes.update(node);
                idsToColor.push(node.id)
              }

              if (!(idsToColor.includes(node.id)) && node.id != 0 && node.label != initialSearchValue) {
                node.color = "#ffffff"
                graphtool.nodes.update(node);
              }



            });

            let edges = graphtool.edges.get();

            edges.forEach((edge) => {

              if (idsToColor.includes(edge.to)) {
                edge.color = this.drawer.colorObj[edge.group];
                graphtool.edges.update(edge);
              }



              if (!(idsToColor.includes(edge.to))) {
                edge.color = "#000000"
                graphtool.edges.update(edge);
              }

            });
          }

        } else {

          let nodes = graphtool.nodes.get();
          let edges = graphtool.edges.get();

          if (path == nodes[0].item) {

            if (idsToColor.length == 0) {

              let connectedNodesToRoot = graphtool.network.getConnectedNodes(0, "to");

              for (let i = 0; i < connectedNodesToRoot.length; i++) {

                graphtool.nodes.get(connectedNodesToRoot[i]).color = "#ffffff";
                graphtool.nodes.update(graphtool.nodes.get(connectedNodesToRoot[i]));

              }

              let connectedEdgesToRoot = graphtool.network.getConnectedEdges(this.drawer.rootId);

              for (let i = 0; i < connectedEdgesToRoot.length; i++) {

                graphtool.edges.get(connectedEdgesToRoot[i]).color = "#000000";
                graphtool.edges.update(graphtool.edges.get(connectedEdgesToRoot[i]));

              }

            }

            nodes.forEach((node) => {
              if (node.label == initialSearchValue || idsToColor.includes(node.id)) {

                node.color = this.drawer.colorObj[node.group];

                graphtool.nodes.update(node);
                if (!(idsToColor.includes(node.id))) {
                  idsToColor.push(node.id);
                }

              }

            });

            edges.forEach((edge) => {
              if (idsToColor.includes(edge.to) || idsToColor.includes(edge.to)) {
                edge.color = this.drawer.colorObj[edge.group];
                graphtool.edges.update(edge);
              }
            });




            //console.log("here")
            continue;
          }

          nodes = graphtool.nodes.get();

          nodes.forEach((node) => {

            if (node.item === path) {

              nodesWithObject.push(node);

            }

          });
          if (nodesWithObject.length == 0) {

            let searchExistingNodes = searchJSON(data, path);
            let found = IsStartObjectInGraph(searchExistingNodes);
            nodesWithObject.push(found);
          }

        }

      }
    } else {
      for (let i = 0; i < objectInOnject.length; i++) {
        objectInOnjectNodes(objectInOnject[i], searchValue, initialSearchValue)
      }
    }
    nodesWithObject = [...new Set(nodesWithObject.map(obj => JSON.stringify(obj)))].map(str => JSON.parse(str));

    nodesWithObject = nodesWithObject.flat(Infinity);

    return nodesWithObject;

  }

  function objectInOnjectNodes(path, searchValue, initialSearchValue) {



  }

  function expandNodesTillFoundValue(startingNode, searchValue) {


    if (startingNode.length == 0) {
      return;
    }

    for (let i = 0; i < startingNode.length; i++) {
      idsToColor.push(startingNode[i].id);
      let params = {
        nodes: [startingNode[i].id]
      }

      let connectedNodesTo = graphtool.network.getConnectedNodes(startingNode[i].id, "to");
      if (connectedNodesTo.length == 0) {
        graphtool.expandNodes(params);
      }

    }



    let nodes = graphtool.nodes.get();
    //console.log(nodes)
    let nodeExists = false;


    nodes.forEach((node) => {



      if (node.label == searchValue || idsToColor.includes(node.id)) {
        node.color = this.drawer.colorObj[node.group];
        graphtool.nodes.update(node);
        idsToColor.push(node.id);
      }

      if (!(idsToColor.includes(node.id)) && node.id != 0 && node.label != searchValue) {
        node.color = "#ffffff"
        graphtool.nodes.update(node);
      }



    });
    let edges = graphtool.edges.get();

    edges.forEach((edge) => {

      if (idsToColor.includes(edge.to)) {
        edge.color = this.drawer.colorObj[edge.group];
        graphtool.edges.update(edge);
      }

      if (!(idsToColor.includes(edge.to))) {
        edge.color = "#000000"
        graphtool.edges.update(edge);
      }

    });

    nodes.forEach((node) => {

      if (node.label === searchValue) {

        var edgesToNode = graphtool.network.getConnectedEdges(node.id, {
          to: true
        }).filter(function (edgeId) {
          return graphtool.edges.get(edgeId).to == node.id;
        });

        if (graphtool.edges.get(edgesToNode)[0].from != 0) {

          nodeExists = true;
          return;

        }
      }
    });

    if (nodeExists === false) {
      console.log("here")
      let found = searchJSON(data, searchValue);
      let nodesToStart = IsStartObjectInGraph(found);
      //console.log(nodesToStart)
      let done = expandNodesTillFoundValue(nodesToStart, searchValue);
      return;
    }

  }

  function pathIsObjectInObject(paths) {

    for (let i = 0; i < paths.length; i++) {

      let path = paths[i].split(".");

      if (Array.isArray(data[path[1]][path[2]]) && typeof data[path[1]][path[2]][0] === 'object' && data[path[1]][path[2]][0] !== null) {

        let startId = 0;

        for (let i = 2; i < path.length; i += 2) {

          if (!(path[i + 1] == undefined)) {
            const connectedNodeIds = graphtool.network.getConnectedNodes(startId, "to");

            const connectedNodes = graphtool.nodes.get(connectedNodeIds);

            const filteredNodes = connectedNodes.filter(node => node.label === path[i]);

            const filteredNodeIds = filteredNodes.map(node => node.id);

            let params = {
              nodes: [filteredNodeIds[path[i + 1]]]
            }

            graphtool.expandNodes(params);

            startId = filteredNodeIds[path[i + 1]];

          }

        }


      } else {

      }
    }
  }

  function searchFunctionality(data, searchValue) {

    let found;

    if (findKeyPath(data, searchValue).length > 0) {
      found = findKeyPath(data, searchValue);

      for (let i = 0; i < found.length; i++) {
        found[i] = '$.' + found[i];
      }
    } else {
      found = searchJSON(data, searchValue)
    }

    let nodesToStart = IsStartObjectInGraph(found, searchValue, searchValue);


    let done = expandNodesTillFoundValue(nodesToStart, searchValue);

  }

  const container = document.getElementById('title');

  const inputField = document.createElement('input');
  inputField.type = 'text';
  inputField.id = 'input-field';

  const submitButton = document.createElement('button');
  submitButton.id = 'submit-button';
  submitButton.textContent = 'Submit';

  container.appendChild(inputField);
  container.appendChild(submitButton);

  submitButton.addEventListener('click', function () {
    const inputValue = inputField.value;

    let inputString = inputValue;

    searchFunctionality(data, inputString)

  });


});


export {
  GraphTool,
  GraphDrawer,
  vis
}
