const vis = require("vis-network/standalone/esm/index.js")
const JSONEditors = require("jsoneditor/dist/jsoneditor") // this is the multi-mode editor https://github.com/josdejong/jsoneditor
const jsnx = require("jsnetworkx")
const utils = require("./utils.js")
const GTHelper = require("./GraphToolHelper.js")
//const NodeClasses = require("./NodeClasses.js")    // this causes firefox hanging. 
const chroma = require("chroma-js")
//const RegExp = require('RegExp');
const jsonpath = require('jsonpath');
const G = require("./Graph.js");

class GraphTool {

    static instanceCount = 0;
  
    constructor(div_id, config, callback_config) {

      this.BindToClass(GTHelper, this)
  
      this.graphContainerId = div_id; 
  
      this.prefix = 'Graph' + GraphTool.instanceCount + '_';

      GraphTool.instanceCount += 1;
  
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
  
      this.rootNodesArray = [];
  
      let copiedConfig = JSON.parse(JSON.stringify(config.configFile));
  
      copiedConfig.root_node_objects.forEach((node) => {
  
        node.expansion_depth = 100000;
  
        this.rootNodesArray.push('jsondata/' + node.node_id);
  
      });
  
      let newInstanceOfGraphClass = new G.Graph();
  
      this.fullGraph = newInstanceOfGraphClass.createGraphByConfig(config.file, copiedConfig, true);
  
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
  
        //args to generate full graph
  
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
      this.createLegend();
      this.oldNodeColors = {};
      this.oldEdgeColors = {};
      this.addKeyEventListeners();
      this.dataFile = this.drawer.file;
      this.idsToColor = [];
      this.deepSearchExpands = [];
      this.deepSearchExpandsFull = [];
      this.searchExpands = [];
      this.fullGraph;
      this.configFile = config.configFile;
  
      this.colorsBeforeVisualSearch = {};
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

    BindToClass(functionsObject, thisClass) {
      for (let [ functionKey, functionValue ] of Object.entries(functionsObject)) {
          thisClass[functionKey] = functionValue.bind(thisClass);
      }
    }

  
    initGraphContainers(div_id) {
  
      // create all necessary elements/divs and set them up
      this.container = document.getElementById(div_id);
      this.vis_container = document.createElement("div");
      this.vis_container.setAttribute("id", this.prefix + "vis_container");
      //this.vis_container.width = "70%"
      this.vis_container.style = "width: 65%; height: 800px; border: 1px solid lightgray;  float:left;";
      this.options_container = document.createElement("div");
      this.options_container.setAttribute("id", this.prefix + "options_container");
      this.options_container.setAttribute("style", "overflow-y:scroll");
      //this.options_container.width = "30%"
      this.options_container.style = "margin-left: 68%; width: 30%; height: 800px; border: 1px solid lightgray;";
  
      this.tool_container = document.createElement("div");
      this.tool_container.style = "display:flex";
      this.container.append(this.tool_container);
  
      // Todo: the following should go to vue.js templates
      let io_container = document.createElement("fieldset");
      io_container.style = "margin: 8px; border: 1px solid silver; padding: 8px; border-radius: 4px;";
      let io_legend = document.createElement("legend");
      io_legend.textContent = "Load / Safe";
      io_legend.style = "padding: 2px; font-size: 1.0rem;";
      io_container.append( io_legend );
      this.tool_container.append( io_container );
      this.loadSaveFunctionality(io_container);
  
      let search_container = document.createElement("fieldset");
      search_container.style = "margin: 8px; border: 1px solid silver; padding: 8px; border-radius: 4px;";
      let search_legend = document.createElement("legend");
      search_legend.textContent = "Search";
      search_legend.style = "padding: 2px; font-size: 1.0rem;";
      search_container.append( search_legend );
      this.tool_container.append( search_container );
      this.createSearchUI(search_container);
  
      let deepsearch_container = document.createElement("fieldset");
      deepsearch_container.style = "margin: 8px; border: 1px solid silver; padding: 8px; border-radius: 4px;";
      let deepsearch_legend = document.createElement("legend");
      deepsearch_legend.textContent = "Deep Search";
      deepsearch_legend.style = "padding: 2px; font-size: 1.0rem;";
      deepsearch_container.append( deepsearch_legend );
      this.tool_container.append( deepsearch_container );
      this.initDeepSearch(deepsearch_container);
  
      let coloring_container = document.createElement("fieldset");
      coloring_container.style = "margin: 8px; border: 1px solid silver; padding: 8px; border-radius: 4px;";
      let coloring_legend = document.createElement("legend");
      coloring_legend.textContent = "Coloring";
      coloring_legend.style = "padding: 2px; font-size: 1.0rem;";
      coloring_container.append( coloring_legend );
      this.tool_container.append( coloring_container );
      this.colorPicker(this, coloring_container);
  
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
  
        document.getElementById(optionsDivId).innerHTML = "<button id='" + this.prefix + "setButton'>set!</button><br><div id='" + this.prefix + "editor_div'></div>"
        let setButton = document.getElementById(this.prefix + "setButton") // todo: implement changes
  
  
        let options = {
          mode: 'tree',
          modes: ['code', 'tree'] // ['code', 'form', 'text', 'tree', 'view', 'preview']}
        }
  
  
        let editor_div = document.getElementById(this.prefix + "editor_div", options)
        // create a JSONEdior in options div
        let editor = new JSONEditors(editor_div) // TODO: Editor is currently not rendered. find error.
  
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
      document.getElementById(optionsDivId).innerHTML = "<button id='" + this.prefix + "setButton'>set!</button><br><div id='" + this.prefix + "visual_options_editor_div'></div><div id='" + this.prefix + "data_editor_div'></div>"
      let setButton = document.getElementById(this.prefix + "setButton")
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
      let visual_options_editor_div = document.getElementById(this.prefix + "visual_options_editor_div")
      let visual_options_editor = new JSONEditors(visual_options_editor_div, options)
      // make object of own properties
  
      visual_options_editor.set(node)
      visual_options_editor.onChange = (param) => {
  
      }
      setButton.addEventListener('click', () => {
  
        node = visual_options_editor.get()
        this.nodes.update(node)
      })
      let data_editor_div = document.getElementById(this.prefix + "data_editor_div")
      let data_editor = new JSONEditors(data_editor_div, options)
  
      data_editor.set(this.drawer.getValueFromPathArray(node.path))
    }
  
  
  
    createSearchUI(container) {
  
      // create the container if not defined
      if (!container) container = document.createElement('div');
  
      // create the input element
      let inputField = document.createElement('input');
      inputField.type = 'text';
      inputField.id = this.prefix + 'search_input';
  
      // add the event listener to the input element
      let debounceTimer;
  
      let firstInput = true;
      inputField.addEventListener('input', () => {
  
        // Clear previous debounce timer
        clearTimeout(debounceTimer);
        //document.getElementById('input-field').value = "";
  
        // Set a new debounce timer
        debounceTimer = setTimeout(() => {
  
          if(firstInput && inputField.value.length > 0){
  
  
            this.saveGraphColorsVisualSearch();
  
            firstInput = false;
    
          }
    
          if(inputField.value.length === 0 && !firstInput){
    
              //this.recolorByProperty();
  
              this.loadGraphColorsVisualSearch();
              
              firstInput = true;
    
              return;
          }
  
          // Execute the search after the debounce timeout
          this.searchNodes(inputField.value)
        }, 300); // Adjust the debounce timeout as needed (e.g., 300ms)
  
      });
  
      // add the input field to the DOM
      container.appendChild(inputField);
  
      // create the select element
      const selectElement = document.createElement('select');
      selectElement.id = this.prefix + 'search_select';
      selectElement.addEventListener('change', (event) => {
        // get the selected value
        document.getElementById(this.prefix + 'search_input').value = "";
        document.getElementById(this.prefix + 'input-field').value = "";
        this.collapseSearch();
        this.recolorByProperty();
        //this.searchNodes("");
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
      container.appendChild(selectElement);
  
      return container;
    }
  
    //saves colors of nodes and edges before visual search
    saveGraphColorsVisualSearch() {
  
      for(let i = 0; i < this.nodes.get().length; i++){
  
        let node = this.nodes.get()[i];
  
        if(node.color){
  
          this.colorsBeforeVisualSearch[node.id] = node.color;
  
  
  
        }
  
      }
  
      for(let i = 0; i < this.edges.get().length; i++){
          
          let edge = this.edges.get()[i];
    
          if(edge.color){
    
            this.colorsBeforeVisualSearch[edge.id] = edge.color;
    
          }
      }
  
    }
  
    //loads colors of nodes and edges after visual search
    loadGraphColorsVisualSearch() {
  
      for(let i = 0; i < this.nodes.get().length; i++){
  
        let node = this.nodes.get()[i];
  
        if(node.color){
  
          node.color = this.colorsBeforeVisualSearch[node.id];
  
          this.nodes.update(node);
  
        }
  
      }
  
      for(let i = 0; i < this.edges.get().length; i++){
          
          let edge = this.edges.get()[i];
    
          if(edge.color){
    
            edge.color = this.colorsBeforeVisualSearch[edge.id];
  
            this.edges.update(edge);
    
          }
      }
      
    }
  
    //resets deep search if user accepts the search results to open further nodes
    searchAlert() {
  
      if(this.deepSearchExpands.length > 0 || this.deepSearchExpandsFull.length > 0){
  
        var result = confirm("Apply search results?");
        
        if (result) {
          //alert("You clicked 'Yes'!");
          document.getElementById(this.prefix + 'input-field').value = "";
          this.deepSearchExpands = [];
          this.deepSearchExpandsFull = [];
          return true;
        } else {
          //alert("You clicked 'No'!");
          return false;
        }
      }
  
      return true;
    }
  
    //visual search for nodes and edges
    searchNodes = (searchString) => {
  
      //this.updatePositions()
  
      if (this.handleCallbacks({id: 'onBeforeSearchNodes', params: {graph: this, searchString: searchString}})) {
  
        this.recolorByProperty();
        this.searchExpands = [];
        this.deepSearchExpands = [];
  
        //searches for edges with the given search string
        if (document.getElementById(this.prefix + 'search_select').value === 'search_edge') {
  
  
          this.edges.forEach((edge) => {
  
            if(edge.label.toLowerCase().includes(searchString.toLowerCase())){
  
              //gets all paths from root to the node that the edge points to
              let paths = [];
  
              for(let i = 0; i < this.rootNodesArray.length; i++){
          
                let tempPaths = this.findAllPaths(this.rootNodesArray[i], edge.to);
          
                for(let j = 0; j < tempPaths.length; j++){
          
                  paths.push(tempPaths[j]);
          
                }
                
              }
  
              //let paths = this.findAllPaths(this.drawer.rootId, edge.to);
  
              for(let i = 0; i < paths.length; i++){
  
                for(let j = 0; j < paths[i].length; j++){
  
                  //pushes all nodes that get colored
                  this.searchExpands.push(paths[i][j]);
  
                }
  
              }
  
            }
  
          });
        }
        //searches for nodes with the given search string
        if (document.getElementById(this.prefix + 'search_select').value === 'search_node') {
          this.nodes.forEach((node) => {
            if (node.label) {
  
              if(node.label.toLowerCase().includes(searchString.toLowerCase()) || node.group == "root"){
  
                let paths = [];
  
                for(let i = 0; i < this.rootNodesArray.length; i++){
            
                  let tempPaths = this.findAllPaths(this.rootNodesArray[i], node.id);
            
                  for(let j = 0; j < tempPaths.length; j++){
            
                    paths.push(tempPaths[j]);
            
                  }
                  
                }
                
                //let paths = this.findAllPaths(this.drawer.rootId, node.id);
    
                for(let i = 0; i < paths.length; i++){
    
                  for(let j = 0; j < paths[i].length; j++){
    
                    this.searchExpands.push(paths[i][j]);
    
                  }
    
                }
              }
              
            }
  
          });
  
        }
        //colors all nodes and edges that get found
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

    // Object.filter = (obj, predicate) => 
    //   Object.keys(obj)
    //         .filter( key => predicate(obj[key]) )
    //         .reduce( (res, key) => (res[key] = obj[key], res), {} );
  
    //recolos all nodes and edges
  
    recolorByProperty = () => {
  
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
      // root Nodes
  
      for(let i = 0; i < this.rootNodesArray.length; i++){
  
        let rootNode = this.nodes.get(this.rootNodesArray[i]); //this.drawer.rootId;
        rootNode.color = this.drawer.config.rootColor;
        this.nodes.update(rootNode)
  
      }
  
      
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
  
      for(let i = 0; i < this.configFile.root_node_objects.length; i++){
  
        let tempReachableNodesTo = this.getAllReachableNodesTo('jsondata/' + this.configFile.root_node_objects[i].node_id, excludedIds, reachableNodesTo);
  
        reachableNodesTo = [...reachableNodesTo, ...tempReachableNodesTo];
  
      }
      
  
      let nodesToDelete = [];
      let allIds = this.nodes.getIds();
  
  
      for (let i = 0; i < allIds.length; i++) {
  
        if (allIds[i] == nodeId) {
          this.deleteEdges(nodeId);
          continue;
        }
  
        if (reachableNodesTo.includes(allIds[i])) {
  
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
      var fromEdges = this.edges.get({
          filter: function(item) {
              return item.from == nodeID;
          }
      });
      for (var j = 0; j < fromEdges.length; j++) {
          this.edges.remove(fromEdges[j]);
  
          //let edges = this.removeObjectWithId(this.edges.get(), false, fromEdges[j])
      }
    }
    // deleteEdges(nodeID) {
  
     
    //   // this.network.getConnectedEdges(nodeID).forEach((edgeID) => {
    //   //   this.edges.remove(edgeID)
      
    //   // })
  
  
  
    //   // delete from drawer edges list. // TODO: sync drawer edges with GraphTool edges
  
    //   var fromEdges = this.edges.get({
    //        filter: function (item) {
    //          return item.from == nodeID;
    //        }
    //      });
  
    //      for (var j = 0; j < fromEdges.length; j++) {
    //        this.edges.remove(fromthis.edges.get(j));
  
    //        edges = this.removeObjectWithId(edges, false, fromthis.edges.get(j))
    //      }
    // }
  
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

    //sets the color of the legend white if the group is set to hidden = true
    setInvisibleLegendGroupsWhite(invisibleGroups) {
  
      let legend = document.getElementById(this.prefix + "legendContainer");
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
  
      if(!this.searchAlert()){
        return;
      }
      
      this.searchNodes("");
      document.getElementById(this.prefix + "search_input").value = "";
  
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
  
          this.drawer.createGraphNodesEdges(args);
          this.recolorByProperty()
  
          this.createLegend()
  
          if (document.querySelector('#'+ this.prefix + 'myDropdown select').value == "setColorByValue") {
  
            this.colorByValue([document.querySelector('#' + this.prefix + 'setColorByValueInput').value], this.nodes, this.edges, document.querySelector('#' + this.prefix + 'startColor').value, document.querySelector('#' + this.prefix + 'endColor').value)
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
      
      
      this.repeatInvisibility(this.options);
  
      if (this.legendInvisibleGroups(this.options).length == 0) {
        this.resetNodesAndEdgesVisibility()
      }
      
  
      //this.createLegend()
  
    }
    //creates the color by value ui
    colorPicker = (graph, container) => {
      // Create the dropdown menu
      // Todo: replace global ids with prefixed ids or class members to allow multiple instances on one page
  
      // create container if not specified
      if (!container) container = document.createElement("div");
  
      var graph = graph;
      var prefix = this.prefix;
      var dropdownDiv = document.createElement("div");
      dropdownDiv.id = this.prefix + "dropdown";
      dropdownDiv.setAttribute("id", this.prefix + "myDropdown");
  
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
  
      // Add the dropdown menu to the container
      container.appendChild(dropdownDiv);
  
      // Get the selected value
      function getPath() {
        let path = "" + document.querySelector('#' + prefix + 'setColorByValueInput').value;
  
        let tempArray = path.split(".")
  
        let startColor = document.querySelector('#' + prefix + 'startColor').value;
        let endColor = document.querySelector('#'+ prefix +'endColor').value;
  
        graph.colorByValue(tempArray, graph.nodes.get(), graph.edges.get(), startColor, endColor);
  
        graph.nodes.update(graph.nodes.get())
        graph.edges.update(graph.edges.get())
  
        // graph.network.body.emitter.emit('_dataChanged');
  
        // graph.network.redraw();
      }
  
  
      // Add an event listener to get the selected value
      document.querySelector('#' + this.prefix + 'myDropdown select').addEventListener('change', function () {
        var selectedValue = this.value;
  
        if (selectedValue == "setColorByValue") {
  
          var input = document.createElement("input");
          input.type = "text";
          input.id = prefix + "setColorByValueInput";
  
  
  
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
          select.id = prefix + "startColor";
  
  
          const select2 = document.createElement("select");
  
          // Add options to the select element
          for (let i = 0; i < usefulColors2.length; i++) {
            const option = document.createElement("option");
            option.value = usefulColors2[i];
            option.text = usefulColors2[i];
            select2.appendChild(option);
          }
          select2.id = prefix + "endColor";
  
          // Add a button to get the selected value
          var button = document.createElement("button");
          button.id = prefix + "setPath";
          button.innerHTML = "Set path";
          button.addEventListener("click", getPath);
  
          if (!document.getElementById(this.prefix + "setColorByValueInput")) {
  
            document.getElementById(prefix + "myDropdown").appendChild(input);
            document.getElementById(prefix + "myDropdown").appendChild(select);
            document.getElementById(prefix + "myDropdown").appendChild(select2);
            document.getElementById(prefix + "myDropdown").appendChild(button);
          }
        }
  
        if (selectedValue == "setColorByProperty") {
          if (document.getElementById(prefix + "setColorByValueInput")) {
            document.getElementById(prefix + "setColorByValueInput").remove();
            document.getElementById(prefix + "startColor").remove();
            document.getElementById(prefix + "endColor").remove();
            document.getElementById(prefix + "setPath").remove();
          }
          graph.recolorByProperty();
          graph.nodes.update(graph.nodes.get())
          graph.edges.update(graph.edges.get())
        }
        //alert("Selected value: " + selectedValue);
      });
  
    }
  
    isNodeLastInPath(node){
        
      let edges = this.edges.get();
  
      for(let i = 0; i < edges.length; i++) {
  
        if(edges[i].from == node) {
          return false;
        }
  
      }
  
      return true;
  
    } 
    // loads or saves the graph to a .txt file
    loadSaveFunctionality(container) {
  
  
      // Todo: replace global ids with prefixed ids or class members to allow multiple instances on one page
  
  
      // create container element if not defined
      if (!container) container = document.createElement("div");
  
      let element = document.createElement("BUTTON");
      element.innerHTML = "Save state";
      element.id = this.prefix + "save";
      element.addEventListener("click", () => {
        this.createSaveStateFunctionality()
      });
      container.append(element)
  
      let element2 = document.createElement("BUTTON");
      element2.id = this.prefix + "load"
      element2.innerHTML = "Load state";
      element2.addEventListener("click", () => {
        this.createLoadStateFunctionality()
      });
  
      container.append(element2)
      return container;
    }
  
  
    createSaveStateFunctionality() {
  
      let coloringDiv = document.getElementById(this.prefix + "myDropdown");
  
      let dropdown = coloringDiv.querySelector("select");
  
      if(dropdown.value == "setColorByValue"){
  
        this.configFile.coloring_function_object.function_name = "colorByValue";
  
        let inputField = document.getElementById(this.prefix + "setColorByValueInput");
        this.configFile.coloring_function_object.path = inputField.value;
  
        let startColor = document.getElementById(this.prefix + "startColor");
        this.configFile.coloring_function_object.start_color = startColor.value;
  
        let endColor = document.getElementById(this.prefix + "endColor");
        this.configFile.coloring_function_object.end_color = endColor.value;
  
      }else if(dropdown.value == "setColorByProperty"){
  
        this.configFile.coloring_function_object.function_name = "colorByProperty";
  
        this.configFile.coloring_function_object.path = "";
  
        this.configFile.coloring_function_object.start_color = "";
  
        this.configFile.coloring_function_object.end_color = "";
  
      }
  
  
      let deepSearchDropdown = document.getElementById(this.prefix + "search_select");
  
      if(deepSearchDropdown.value == "search_node"){
  
        this.configFile.dataset_search_function_object.search_on = "nodes";
        this.configFile.visual_search_function_object.search_on = "nodes";
  
      }else if(deepSearchDropdown.value == "search_edge"){
  
        this.configFile.dataset_search_function_object.search_on = "edges";
        this.configFile.visual_search_function_object.search_on = "edges";
          
      }
  
      let inputField = document.getElementById(this.prefix + "input-field");
  
      this.configFile.dataset_search_function_object.search_string = inputField.value;
  
      let inputFieldVisual = document.getElementById(this.prefix + "search_input");
      this.configFile.visual_search_function_object.search_string = inputFieldVisual.value;
  
      let checkBox = document.getElementById(this.prefix + "myCheckbox");
  
      this.configFile.dataset_search_function_object.keep_expanded = checkBox.checked;
  
      let openPaths = [];
      for(let i = 0; i < this.nodes.get().length; i++){
  
        if(this.isNodeLastInPath(this.nodes.get()[i].id)){
    
          let paths = this.findAllPaths('jsondata/' + this.configFile.root_node_objects[0].node_id, this.nodes.get()[i].id)
    
          for(let j = 0; j < paths.length; j++){
    
            openPaths.push(paths[j]);
    
          }
    
        }
    
      }
    
      this.configFile.expanded_paths = openPaths;
  
      this.configFile.visual_nodes_edges_object.nodes = this.nodes.get();
      this.configFile.visual_nodes_edges_object.edges = this.edges.get();
    
      this.configFile.initial_dataset = this.drawer.file;
  
      console.log(this.configFile)
  
      let files = {file: this.drawer.file, config: this.configFile};
  
      const json = files;
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
  
      document.getElementById(this.graphContainerId).innerHTML = "";
  
      const reader = new FileReader();
      reader.onload = () => {
        const jsonData = JSON.parse(reader.result);
  
        console.log(jsonData.file)
        console.log(jsonData.config)
  
        let graph = new isg.Graph(jsonData.file, jsonData.config);
  
  
          // document.getElementById("mynetwork").innerHTML = "";
  
          // document.getElementById('myDropdown').remove();
          // document.getElementById('save').remove();
          // document.getElementById('load').remove();
          // document.getElementById('search_input').remove();
          // document.getElementById('search_select').remove();
  
          // if (document.getElementById('setPath')) {
          //   document.getElementById('setPath').remove();
          // }
  
        
  
      };
      reader.readAsText(input.target.files[0]);
  
    }
  
    //generates the legend for the graph
    createLegend() {
      var invisibleGroups = [];
  
  
      //if (!document.getElementById("legendContainer")) {
  
        Object.keys(this.drawer.colorObj).forEach((key) => {
  
  
          if(!this.options.groups[key]){
  
            this.options.groups[key] = {
              hidden: false
            };
  
          }
          // options.groups[key] = {
          //   hidden: false
          // };
  
        });
  
      //}
  
      if (document.getElementById(this.prefix + "legendContainer")) {
  
        invisibleGroups = this.legendInvisibleGroups(this.options);
  
        document.getElementById(this.prefix + "legendContainer").remove();
      }
      var legendDiv = document.createElement("div");
      let vis_cont = document.getElementById(this.prefix + "vis_container")
      vis_cont.append(legendDiv);
      legendDiv.style.width = '100%';
      legendDiv.style.position = 'relative';
      legendDiv.style.display = 'inline-block';
      legendDiv.id = this.prefix + "legendContainer";
      var legendColors = this.drawer.colorObj
      var legendSet = {}
  
      for (let edge of this.edges.get()) {
  
        if (!legendSet[edge.group]) {
  
          //legendColors[input.properties[i]] = colors[i];
          var propertyContainer = document.createElement("div");
          var propertyColor = document.createElement("div");
          var propertyName = document.createElement("div");
          propertyContainer.className = "legend-element-container";
          propertyContainer.id = this.prefix + edge.label;
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
  
  
    //function to set nodes and edges hidden when legend is clicked
    setNodeVisibilityByVisiblePath = (nodeId, rootNodeId) => {
  
      for(let i = 0; i < this.configFile.root_node_objects.length; i++) {
        if(nodeId == 'jsondata/' + this.configFile.root_node_objects[i].node_id) {
          
          return true;
  
        }
      }
      //if (nodeId == this.drawer.rootId) return true; //root is always visible
  
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
  
      console.log(this.options.groups)
  
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
  
      var allFalse = Object.keys(this.options.groups).every((k) => {
        if (k === 'useDefaultGroups') {
          return true
        }
        return this.options.groups[k].hidden === false
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
          comparison_container.setAttribute("id", this.prefix + "comparison_container")
          this.options_container.append(comparison_container)
          this.options_container.append(document.createElement("H2").appendChild(document.createTextNode("common types")))
  
          let setForAllContainer = document.createElement("div")
          setForAllContainer.setAttribute("id", this.prefix + "setForAllContainer")
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
  
  searchItem(node_id, fullGraph) {
    //if node id is not in the current graph
    if (!this.itemExists(node_id)) {
      //get node from this.fullGraph
      const searchValue = fullGraph.nodes.get(node_id);
      //get parent item from this.fullGraph of the given node id
      const parentItem = this.searchJSON(this.drawer.file, `${searchValue.path[1]}`);
      //get parent item id
      const parentItemId = `${parentItem[0].split('.')[1]}/${parentItem[0].split('.')[2]}`;
  
      //if the parent item node is not in the current graph, go recursively back in the graph until you find a node that is in the current graph
      if (!this.itemExists(parentItemId)) {
        this.searchItem(parentItemId, fullGraph);
        this.expandNodesCleanedUp({ nodes: [parentItemId] });
  
        return;
      }
  
      //if the parent item node is in the current graph, expand it 
      this.expandNodesCleanedUp({ nodes: [parentItemId] });
  
      return;
    }
  
    this.expandNodesCleanedUp({ nodes: [node_id] });
  
  }
  
  deepSearchExpandNodes(foundNode, fullGraph) {
  
    
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
      this.searchItem(firstPath, fullGraph);
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
  
    //if the checkbox is not checked, collapse all nodes that were expanded during deep search
    if(!document.getElementById(this.prefix + "myCheckbox").checked ){
  
      //remove duplicates from the deep search expands array
      this.deepSearchExpandsFull = [...new Set(this.deepSearchExpandsFull)];
      
      this.deepSearchExpandsFull.forEach(node => {
  
        //if the node exists and is not the root node, collapse it
        if(this.itemExists(node) && /*node != this.drawer.rootId*/ (!this.rootNodesArray.includes(node))){
  
  
          if(this.isNodeOpen(node)){
  
            this.expandNodesCleanedUp({nodes:[node]});
            this.nodes.update(this.nodes.get(node));
  
          }
  
        }
      });
  
      //reset the deep search expands and clicked nodes arrays
      this.deepSearchExpands = [];
      this.deepSearchExpandsFull = [];
      this.clicked = {};
  
    }
    
  }
  
  //colors the nodes and edges that were found during deep search
  deepSearchColorPath(foundNodes){
  
    this.nodes.get().forEach(node => {
      //if the node is not expanded by deep search and is not in the found nodes, color it white
      if(!this.deepSearchExpands.includes(node.id) && !foundNodes.some(obj => obj.id === node.id) && !this.searchExpands.includes(node.id) ){
  
        if(node.group != "root"){
  
          //console.log(node.id)
  
          node.color = "#ffffff"
  
          this.nodes.update(node);
  
        }
  
      }
  
    });
  
    this.edges.get().forEach(edge => {
  
      //if the edge is connected to colored nodes but not white nodes, color it black
      if(!(this.nodes.get(edge.from).color != "#ffffff" && this.nodes.get(edge.to).color != "#ffffff")){
  
        edge.color = "#000000"
  
        this.edges.update(edge);
  
      }
  
    });
  
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
  
        this.drawer.createGraphNodesEdges(args);
  
        this.clicked[params.nodes[0]] = true;
  
      } else {
  
        // collapse Nodes
        this.clicked[params.nodes[0]] = false;
  
        this.deleteNodesChildren(params.nodes[0]);
  
      }
  
    }
  
  }
  
  deepSearch(searchValue){
  
    var fullGraph = this.fullGraph;
  
    //if search value is empty, collapse all expanded nodes and return
    if(searchValue == ""){
  
      this.collapseSearch();
      this.recolorByProperty();
  
      return;
  
    }
  
    //before searching, collapse all expanded nodes from previous search
    this.collapseSearch();
  
    //search for nodes with label containing search value
    let foundNodes = [];
  
    if (document.getElementById(this.prefix + 'search_select').value === 'search_node') {
  
      const lowercaseSearchValue = searchValue.toLowerCase();
      foundNodes = fullGraph.nodes.get().filter(node =>
        node.label.toLowerCase().includes(lowercaseSearchValue)
      );
    }
  
    if (document.getElementById(this.prefix + 'search_select').value === 'search_edge') {
        
        //search for edges with label containing search value
        let foundEdges = [];
    
        const lowercaseSearchValue = searchValue.toLowerCase();
        foundEdges = fullGraph.edges.get().filter(edge =>
          edge.label.toLowerCase().includes(lowercaseSearchValue)
        );
  
        for(let i = 0; i<foundEdges.length; i++){
  
          foundNodes.push(this.fullGraph.nodes.get(foundEdges[i].to));
  
        }
  
    }
  
    if(foundNodes.length == 0){
  
      this.collapseSearch();
      this.recolorByProperty();
      if(document.getElementById(this.prefix + "myCheckbox").checked){
  
        this.setGraphColorsBlackAndWhite(this.nodes.get(), this.edges.get());
  
      }
      return;
  s
    }
  
    
    this.deepSearchExpands = [];
    
  
  
    foundNodes.forEach(node => {
  
      //expand the paths to the found nodes
      this.deepSearchExpandNodes(node, fullGraph);
  
      var pathsToColor = [];
  
      for(let i = 0; i < this.rootNodesArray.length; i++){
  
        let tempPaths = this.findAllPaths(this.rootNodesArray[i], node.id);
  
        for(let j = 0; j < tempPaths.length; j++){
  
          pathsToColor.push(tempPaths[j]);
  
        }
        
        //pathsToColor = [...pathsToColor, ...tempPaths] //this.findAllPaths(this.drawer.rootId, node.id);
  
      }
  
      for(let i = 0; i < pathsToColor.length; i++){
          
        for(let j = 0; j < pathsToColor[i].length; j++){
  
          if(!this.deepSearchExpands.includes(pathsToColor[i][j])){
  
            if(/*pathsToColor[i][j] != this.drawer.rootId*/!this.rootNodesArray.includes(pathsToColor[i][j])){
              
              this.deepSearchExpands.push(pathsToColor[i][j]);
            }
          }
  
        }
      }
  
    });
  
    this.recolorByProperty();
    this.deepSearchColorPath(foundNodes);
    this.deepSearchExpandsFull = this.deepSearchExpandsFull.concat(this.deepSearchExpands);
        
    this.createLegend()
    this.repeatInvisibility(this.options);
  
    if (this.legendInvisibleGroups(this.options).length == 0) {
      this.resetNodesAndEdgesVisibility()
    }
      
  }
  
  
  
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
  
    searchFunctionality(data, searchValue) {
  
      document.getElementById(this.prefix + 'search_input').value = "";
  
      this.deepSearch(searchValue);
  
    }
  
    initDeepSearch(container){
  
      // create container if not defined
      if (!container) container = document.createElement('div');
  
      const inputField = document.createElement('input');
      inputField.type = 'text';
      inputField.id = this.prefix + 'input-field';
    
      const submitButton = document.createElement('button');
      submitButton.id = this.prefix + 'submit-button';
      submitButton.textContent = 'Submit';
    
      container.appendChild(inputField);
      container.appendChild(submitButton);
  
      //this.deepSearch("");
  
      // Create the checkbox element
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      
      // Optionally set additional properties for the checkbox
      checkbox.id = this.prefix + 'myCheckbox';
      container.appendChild(checkbox);
   
      submitButton.addEventListener('click', () => {
        this.searchExpands = [];
  
        const inputValue = inputField.value;
    
        let inputString = inputValue;
    
        this.searchFunctionality(this.dataFile, inputString)
    
      });
  
      return container;
  
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
    var neighbours = this.network.getConnectedNodes(start);
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
    return this.edges.get().filter(function(edge) {
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
    let allStartEdges = this.edges.get().filter((edge) => {
  
      return edge.label == path[0];
  
    });
  
    // For each start edge, get the "from" node and add it to the start nodes array
    allStartEdges.forEach((startEdge) => {
  
      let fromNodeId = startEdge.from;
  
      startNodes.push(this.nodes.get(fromNodeId));
  
    });
  
    // Get all edges that match the last element of the path
    let allEndEdges = this.edges.get().filter((edge) => {
  
      return edge.label == path[path.length - 1];
  
    });
  
    // For each end edge, get the "to" node and add it to the end nodes array
    allEndEdges.forEach((endEdge) => {
  
      let toNodeId = endEdge.to;
  
      endNodes.push(this.nodes.get(toNodeId));
  
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
  
        if(currentEdgePaths.length == 0) {
          continue;
        }
  
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

export {

    GraphTool,

}