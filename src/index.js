const vis = require("vis-network/standalone/esm/index.js")
//import { Network, DataSet, Options } from "vis-network/standalone/esm/index.js";
const utils = require("./utils.js")
const NodeClasses = require("./NodeClasses.js")
const $ = require("jquery")
const createGraph = require("./createGraph.js")
//const Keymap = require("./Keymap.js")
const chroma = require("chroma-js")


function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
/// utility function to convert CSV files to JSONTable (incomplete, TODO!)
const CSVToJSONTable = (data, delimiter = ',') => {
  const titles = data.slice(0, data.indexOf('\n')).split(delimiter);
  rows = data.slice(data.indexOf('\n') + 1)
    .split('\n')
  // initialize columns
  let columns = {}
  titles.forEach((title) => {
    columns[title] = []
  })
  for (let i = 1; i < rows.length; i++) {
    // strip unnecessary signs
    rows[i] = rows[i].replace(/(\r\n|\n|\r)/gm, "")
    if (rows[i].length > 0) { // only for non-empty rows
      //console.log(rows[i])
      values = rows[i].split(delimiter)
      for (let j = 0; j < titles.length; j++) {
        columns[titles[j]].push(Number(values[j]))
      }
    }
  }
  //console.log(columns)
  return columns
}


class GraphTool {
  constructor(_config, div_id, config) {
    
    this.clicked = {};
    // create all necessary elements/divs and set them up
    this.container = document.getElementById(div_id);
    this.vis_container = document.createElement("div");
    this.vis_container.setAttribute("id", "vis_container");
    //this.vis_container.width = "70%"
    this.vis_container.style = "width: 65%; height: 800px; border: 1px solid lightgray;  float:left;";
    this.options_container = document.createElement("div");
    this.options_container.setAttribute("id", "options_container");
    //this.options_container.width = "30%"
    this.options_container.style = "margin-left: 68%; width: 30%; height: 800px; border: 1px solid lightgray;";
    this.container.append(this.vis_container);
    this.container.append(this.options_container);

    const defaultConfig = {
      callbacks: {
        //setColor: (data) => this.setColorDefault(data), //default: use class methode
      }
    };

    this._config = utils.mergeDeep(defaultConfig, _config);

    this.keyObject = {
      doubleclick: (params) =>{
        this.expandNodes(params)
      },
    }
    // create a visjs network and attatch it to div
    //console.log(config)
    this.nodes = new vis.DataSet(config.nodes)
    this.edges = new vis.DataSet(config.edges)
    this.data = {
      nodes: this.nodes,
      edges: this.edges,
    };
    this.options = config.options;
    this.network = new vis.Network(this.vis_container, this.data, this.options);
    //console.log(this.config)
    this.pressed_keys = []
    this.mouseX = 0
    this.mouseY = 0
    this.copiedNodes = []
    this.copiedEdges = []
    this.classRegistry = new Map
    this.classRegistry.register = (cls) => {
      this.classRegistry.set((new cls).typeString, cls)
    }
    
    this.colorPicker(this);
    this.loadSaveFunctionality();
    this.createLegend();

    

    for (let cls of [NodeClasses.RocketBase, NodeClasses.Fountain, NodeClasses.DelayNode, NodeClasses.TextSpeechNode,NodeClasses.CameraNode, NodeClasses.ImageNode, NodeClasses.CsvNode]) {
      //console.log(cls)
      this.classRegistry.register(cls)
    }


    this.network.on("doubleClick", (params) => {
    
      this.keyObject.doubleclick(params);
  
    });






    //console.log(this.classRegistry)
    // set extended behavior of visjs Network 
    this.network.on("click", (params) => {
      //console.log("Click event, ",);
      console.log(this.edges.get(params.edges[0]))
      if (params.nodes.length > 0) {
        //console.log("show options")
        let node = this.nodes.get(params.nodes[0])
        //console.log("clicked node:", node.constructor, node, "with prototype:", Object.getPrototypeOf(node))
        if (typeof node.showOptions === 'function') {
          node.showOptions(optionsDivId = this.options_container.id)
        } else {
          this.showOptions_default(node, this.options_container.id)
        }
      }
      if (this.pressed_keys.includes('a')) {
        //console.log(params)
        addNode = new NodeClasses.CameraNode
        addNode.x = params.pointer.canvas.x
        addNode.y = params.pointer.canvas.y
        this.nodes.update(addNode)
      }
    });
    // this.network.on("doubleClick", (params) => {
    //   //console.log("doubleClick event, getNodeAt returns: " + params.nodes);
    //   let node_id = params.nodes[0]
    //   if (params.nodes.length > 0) {
    //     this.fire_recursive(node_id)
    //   }
    //   //console.log('doubleClick event finished')
    // });
    // right click
    this.network.on("oncontext", (params) => {
      console.log('in this.network.on(oncontext)')
    });
    this.network.on('dragStart', (params) => {
      //console.log("dragStart");
      if (params.nodes.length > 0) {
        let newNodeIds = []
        params.nodes.forEach((node_id) => {
          let node = this.nodes.get(node_id)
          let position = this.network.getPosition(node_id) //setting the current position is necessary to prevent snap-back to initial position
          //console.log(position)
          node.x = position.x
          node.y = position.y
          // duplicate Node if ctrl is pressed
          if (params.event.srcEvent.ctrlKey) {
            let newNode = this.duplicateNode(node)
            newNode.fixed = false
            this.nodes.update(newNode)
            this.edges.update({
              from: node.id,
              to: newNode.id
            })
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
      //console.log(params.nodes)
      params.nodes.forEach((node_id) => {
        let node = this.nodes.get(node_id)
        let position = this.network.getPosition(node_id)
        //console.log(node)
        //setting the current position is necessary to prevent snap-back to initial position
        node.x = position.x
        node.y = position.y
        //node.fixed = true
        this.nodes.update(node)
      })
    });
    // keyboard callback functions
    this.vis_container.onmousemove = (event) => {
      this.mouseX = event.clientX
      this.mouseY = event.clientY - 30
    }
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
        //console.log('copy')
        this.copiedNodes = this.network.getSelectedNodes()
        this.copiedEdges = this.network.getSelectedEdges()
        //console.log(this.copiedNodes, this.copiedEdges)
      }
      // paste
      if (event.key == "v" && this.pressed_keys.includes("Control")) {
        if (this.copiedNodes.length > 0) {
          //console.log('paste')
          let xy = this.network.DOMtoCanvas({
            x: this.mouseX,
            y: this.mouseY
          })
          let oldNode = this.nodes.get(this.copiedNodes[0])
          //console.log("copied nodes:", this.copiedNodes, oldNode)
          //console.log("Name of Constructor: ", oldNode.constructor, oldNode.constructor.Name)
          let newNode = this.duplicateNode(oldNode)
          let keys = Object.getOwnPropertyNames(oldNode)
          keys.forEach((key) => {
            if (!(key === "id") && !((typeof (oldNode[key])) == "function")) {
              newNode[key] = oldNode[key]
              // console.log("copy:",key,oldNode[key])
            } else {
              //console.log("don't copy:",key,oldNode[key])
            }
            var rect = this.vis_container.getBoundingClientRect();
            newNode.x = xy.x
            newNode.y = xy.y
          })
          this.nodes.update(newNode)
          this.edges.update({
            from: oldNode.id,
            to: newNode.id
          })
        }
      }
    }, false);
    document.addEventListener('keyup', (event) => {
      const index = this.pressed_keys.indexOf(event.key);
      if (index > -1) { // only splice array when item is found
        this.pressed_keys.splice(index, 1); // 2nd parameter means remove one item only
      }
    }, false);



    Object.filter = (obj, predicate) => 
    Object.keys(obj)
          .filter( key => predicate(obj[key]) )
          .reduce( (res, key) => (res[key] = obj[key], res), {} );


  }
  showOptions_default(node,optionsDivId = 'optionsDiv'){
      let optionsDiv = document.getElementById(optionsDivId)
      optionsDiv.innerHTML = `
          <div id = "json_div"><pre id="objectJson"></pre></div>`
      document.getElementById("objectJson").innerHTML = JSON.stringify(node,null,
        4)
  }
  duplicateNode(node) {
    //console.log('duplicateNode')
    let newNode = {}
    if (Object.getOwnPropertyNames(node).includes("typeString")) {
      let cls = this.classRegistry.get(node.typeString)
      newNode = new cls(uuidv4())
    } else {
      newNode.id = uuidv4()
    }
    let keys = Object.getOwnPropertyNames(node)
    keys.forEach((key) => {
      if (!(key === "id") && !((typeof (node[key])) == "function")) {
        newNode[key] = node[key]
      }
    })
    return (newNode)
  }
  fire_recursive(node_id) {
    let node = this.nodes.get(node_id)
    if ("fire" in node) {
      node.fire()
    } else {
      let conn_edges = network.getConnectedEdges(node.id)
      //console.log(conn_edges)
      conn_edges.forEach(function (edge_id) {
        let edge = this.edges.get(edge_id)
        if (edge.from == node_id) {
          let neighbor_node = this.nodes.get(edge.to)
          //console.log(neighbor_node)
          if (neighbor_node.fire) {
            neighbor_node.fire()
          } else {
            window.setTimeout(function () {
              //console.log("no fire, recurse in " + neighbor_node)
              fire_recursive(edge.to)
            }, 200)
          }
        }
      })
      //console.log(network.getConnectedNodes(node.id))
    }
  }

  // createTestSetup(){
  //   console.log('createTestSetup')
  // }
  ///////////////////////  ///////////////////////  ///////////////////////  ///////////////////////
  getAllEdgesWithLabel(edges, label){

    let tempArray = []
  
    for (let index = 0; index < edges.length; index++) {
      
      if(edges[index].label == label){
        tempArray.push(edges[index]);
      }
      
    }
  
    return tempArray;
  
  }
  

  // Object.filter = (obj, predicate) => 
  //   Object.keys(obj)
  //         .filter( key => predicate(obj[key]) )
  //         .reduce( (res, key) => (res[key] = obj[key], res), {} );

  recolorByProperty(){
    nodes[0].color = "#6dbfa9";
    for(let i = 0; i < edges.length; i++){
      edges[i].color = config.graph.colorObj[edges[i].label];
      for(let j = 0; j < nodes.length; j++){
        if(edges[i].to == nodes[j].id){
          nodes[j].color = edges[i].color;
        }
      }
    }
  }


  colorByValue(path, nodes, edges, startColor, endColor){

    let tempArray = [];
  
    for(let i = 0; i < path.length; i++){
  
      tempArray.push(this.getAllEdgesWithLabel(edges, path[i]));
  
    }
    

    let thingsToColor = [];
  
    if(path.length == 1){
  
      for (let index = 0; index < tempArray[0].length; index++) {
        
        for(let j = 0; j < nodes.length; j++){
  
          if(tempArray[0][index].from == nodes[j].id || tempArray[0][index].to == nodes[j].id){
  
            thingsToColor.push(nodes[j]);
            
          }
  
        }
        
        thingsToColor.push(tempArray[0][index]);
  
      }
  
    }
    
    for(let i = 0; i < tempArray.length; i++){
  
      for(let j = 0; j < tempArray[i].length; j++){
  
        if(tempArray.length == i+1){
  
          for(let p = 0; p < nodes.length; p++){
            nodes[p].color = "#ffffff"  
          }
      
          for(let p = 0; p < edges.length; p++){
            edges[p].color = "#000000"     
          }
  
          for(let l = 0; l< thingsToColor.length; l++){
            delete thingsToColor[l].path;
          }
  
          let colorPath = 0;
          let valueArray = [];
  
          for (let k = 0; k < thingsToColor.length; k++) {
            
            if(thingsToColor[k].from){
              
              let valueEdge  = Object.filter(thingsToColor, thing => thing.label == path[path.length-1]);
              let valueEdgeKey = Object.keys(valueEdge);
  
  
              for(let m = 0; m < valueEdgeKey.length; m++){
  
              let valueNode = Object.filter(thingsToColor, thing => thing.id == valueEdge[valueEdgeKey[m]].to)

              let valueNodeKey = Object.keys(valueNode)[0];

              valueArray.push(valueNode[valueNodeKey].label);
  
              }
  
              let fromNode  = Object.filter(thingsToColor, thing => thing.id == thingsToColor[k].from)

              let fromNodeKey = Object.keys(fromNode)[0];
  
              let toNode  = Object.filter(thingsToColor, thing => thing.id == thingsToColor[k].to)

              let toNodeKey = Object.keys(toNode)[0];
  
              if(fromNode[fromNodeKey].path){
  
                thingsToColor[k].path = fromNode[fromNodeKey].path
                toNode[toNodeKey].path = fromNode[fromNodeKey].path
  
              }else if(toNode[toNodeKey].path){
  
                thingsToColor[k].path = toNode[toNodeKey].path
                fromNode[fromNodeKey].path = toNode[toNodeKey].path
  
              }else{
  
                thingsToColor[k].path = colorPath;
                toNode[toNodeKey].path = colorPath;
                fromNode[fromNodeKey].path = colorPath;
                
                colorPath++;
  
              }           
  
            }
            
          }

          
          valueArray = [...new Set(valueArray)];
  
          valueArray.sort(function(a,b){
            return a - b;
          });
          let colorArray = chroma.scale([startColor, endColor]).mode('hsl').colors(valueArray.length)

          for(let n = 0; n < valueArray.length; n++){
  
            let nodeWithValue  = Object.filter(thingsToColor, thing => thing.label == valueArray[n])
          
            let nodeWithValueKey = Object.keys(nodeWithValue)[0];
    
            for(let o = 0; o < thingsToColor.length; o++){

              if(thingsToColor[o].path == nodeWithValue[nodeWithValueKey].path){

                thingsToColor[o].color = colorArray[n];
  
              }
  
            }
  
          }
  
          return;
  
        }
  
        for(let k = 0; k < tempArray[i+1].length; k++){
  
          if(tempArray[i][j].to == tempArray[i+1][k].from && tempArray[i+1][k].label == path[i+1] && tempArray[i][j].label == path[i]){ 
  
            for (let index = 0; index < nodes.length; index++) {
  
                if(nodes[index].id == tempArray[i][j].to){
  
                  thingsToColor.push(nodes[index])
  
                }
  
                if(nodes[index].id == tempArray[i+1][k].to){
  
                  thingsToColor.push(nodes[index])
  
                }
            }

            thingsToColor.push(tempArray[i][j]);
  
            thingsToColor.push(tempArray[i+1][k]);
  
          }
    
        }
    
      }
  
    }
  
  }

  removeObjectWithId(arr, id, edge) {
    if(edge){
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

  getAllReachableNodesTo(nodeId, excludeIds, reachableNodes) {
    if (reachableNodes.includes(nodeId) || excludeIds.includes(nodeId)) {
        return;
    }
    var children = this.network.getConnectedNodes(nodeId);
    reachableNodes.push(nodeId);
    for (var i = 0; i < children.length; i++) {
        this.getAllReachableNodesTo(children[i], excludeIds, reachableNodes);
        //if(excludeIds.includes(children[i]))continue;
        //reachableNodes.push(children[i]);
    }
  }
  
  deleteNodesChildren(nodeId, deleteEdge, clickedNode) {
    var excludedIds = [];
    if (deleteEdge === true) {
        console.log("deleteEdge true")
    } else {
        excludedIds.push(nodeId);
    }
    var reachableNodesTo = [];
    this.getAllReachableNodesTo(0, excludedIds, reachableNodesTo);
    var nodesToDelete = [];
    var allIds = this.nodes.getIds();
    for (var i = 0; i < allIds.length; i++) {
        if (reachableNodesTo.includes(allIds[i])) continue;
        if (allIds[i] == nodeId) {
            this.deleteEdges(nodeId);
            continue;
        }
        nodesToDelete.push(allIds[i]);
        this.deleteEdges(allIds[i]);

        nodes = this.removeObjectWithId(nodes, allIds[i])

        this.nodes.remove(allIds[i]);

    }
    return nodesToDelete;
  }

  deleteEdges(nodeID) {
    var fromEdges = this.edges.get({
        filter: function(item) {
            return item.from == nodeID;
        }
    });
    for (var j = 0; j < fromEdges.length; j++) {
        this.edges.remove(fromEdges[j]);

        edges = this.removeObjectWithId(edges, false, fromEdges[j])
    }
  }



  expandNodes(params){
    
    if (params.nodes.length > 0) {

      let node = this.nodes.get(params.nodes[0])
      
      if("object" in node && (this.clicked[params.nodes[0]] == false || !(""+params.nodes[0] in this.clicked)) && (this.network.getConnectedNodes(params.nodes[0], "to").length === 0)){

        if(node.context){

          
          config.graph.createGraphNE(config.file, node.id, node.object, node.context, node.depth, "", true);
          
        }else{
          config.graph.createGraphNE(config.file, node.id, node.object, "", node.depth, "", true);
          
        }
        

        if(document.querySelector('#myDropdown select').value == "setColorByValue"){

          this.colorByValue([document.querySelector('#setColorByValueInput').value], nodes, edges, document.querySelector('#startColor').value, document.querySelector('#endColor').value)
        }
        //this.colorByValue(["value"], nodes, edges)
        this.clicked[params.nodes[0]] = true;

        this.network.body.data.nodes.update(nodes);
        this.network.body.data.edges.update(edges);
  
        // this.nodes.update(nodes);
        // this.edges.update(edges);
  
        }else{
  
          
          this.clicked[params.nodes[0]] = false;
  
          this.deleteNodesChildren(params.nodes[0]);
  
          this.nodes.update(nodes);
          this.edges.update(edges);

          //console.log(this.nodes.get())
          
        }
  
        }

  }
colorPicker(graph){
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
  document.querySelector('#myDropdown select').addEventListener('change', function() {
    var selectedValue = this.value;

    if(selectedValue == "setColorByValue"){

      var input = document.createElement("input");
      input.type = "text";
      input.id = "setColorByValueInput";
      


      const usefulColors = ["orangered","red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "gray"];
      const usefulColors2 = ["limegreen","green", "orange", "yellow", "red", "blue", "purple", "pink", "brown", "gray"];

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
      
      if(!document.getElementById("setColorByValueInput")){
        document.getElementById("myDropdown").appendChild(input);
        document.getElementById("myDropdown").appendChild(select);
        document.getElementById("myDropdown").appendChild(select2);
        body.appendChild(button);
      }
    }

    if(selectedValue == "setColorByProperty"){
      if(document.getElementById("setColorByValueInput")){
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

  loadSaveFunctionality(){

    function saveState(){

      if(document.getElementById("setColorByValueInput")){
        new_json.state = {nodes:nodes,edges:edges,colorFunction: document.querySelector('#myDropdown select').value, colorByValue: {startColor:document.querySelector('#startColor').value,endColor:document.querySelector('#endColor').value, path: document.querySelector('#setColorByValueInput').value}};


      }else{
        new_json.state = {nodes:nodes,edges:edges,colorFunction: document.querySelector('#myDropdown select').value, colorByValue: {}};
      }
      
  
      const json = new_json
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
    element.addEventListener("click", saveState);
  
    document.getElementById("title").append(element)
  
    let element2 = document.createElement("BUTTON");
    element2.id = "load"
    element2.innerHTML = "Load state";
    element2.addEventListener("click", loadState);
  
    document.getElementById("title").append(element2)
  
  
    function loadState(){
      const input = document.createElement("input");
      input.type = "file";
  
      input.addEventListener("change", function () {
        const reader = new FileReader();
        reader.onload = function () {
          const jsonData = JSON.parse(reader.result); 
          if(jsonData.state){
            config.nodes = jsonData.state.nodes;
            config.edges = jsonData.state.edges;
    
            nodes = jsonData.state.nodes;
            edges = jsonData.state.edges;
    
            draw.edges = jsonData.state.edges;
            draw.nodes = jsonData.state.nodes;
    
            config = {nodes:jsonData.state.nodes,edges:jsonData.state.edges,options:options, graph: draw, file: new_json};
              
            document.getElementById("mynetwork").innerHTML =  "";
    
            document.getElementById('myDropdown').remove();
            document.getElementById('save').remove();
            document.getElementById('load').remove();

            if(document.getElementById('setPath')){
              document.getElementById('setPath').remove();
            }
            var graphtool = new GraphTool(_config, "mynetwork", config);
          }else{
            let nodes = [];
            let edges = [];
            let draw = new createGraph.GraphDrawer(_config, jsonData, 5, true, nodes, edges);

            let options = {interaction: {hover: true,multiselect: true,},
                  manipulation: {enabled: true,},
                  edges: {arrows: "to"},
                  groups: {
                    useDefaultGroups: false
                  }
                }
            let config = {nodes:nodes,edges:edges,options:options, graph: draw, file: new_json};
            var graphtool = new GraphTool(_config, "mynetwork", config);
          }
          

          if(jsonData.state.colorFunction == "setColorByValue"){
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
        reader.readAsText(this.files[0]);
      });
  
      input.click();
    }
  }

  createLegend(){
    var legendDiv = document.createElement("div");
    let vis_cont = document.getElementById("vis_container")
    vis_cont.append(legendDiv);
    legendDiv.style.width = '100%';
    legendDiv.style.position = 'relative';
    legendDiv.style.display = 'inline-block';
    legendDiv.id = "legendContainer";
    var legendColors = draw.colorObj
    var legendSet = {}
    for (var i = 0; i < edges.length; i++) {
      if(!legendSet[edges[i].group]){
        //legendColors[input.properties[i]] = colors[i];
        var propertyContainer = document.createElement("div");
        var propertyColor = document.createElement("div");
        var propertyName = document.createElement("div");
        propertyContainer.className = "legend-element-container";
        propertyContainer.id = edges[i].label;
        propertyColor.className = "color-container";
        propertyName.className = "name-container";
        propertyColor.style.float = "left";
        propertyName.style.float = "left";
        propertyColor.style.border = "1px solid black";
        propertyName.style.border = "1px solid black";
        propertyColor.style.background = legendColors[edges[i].group]
        propertyColor.innerHTML = "";
        propertyName.innerHTML = edges[i].label;
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
        legendSet[edges[i].group] = legendColors[edges[i].group];
      }
    }

    Object.keys(legendSet).forEach((key) => {

      options.groups[key] = {
        hidden: false
      };
    });
    
  }

  changeColorDropdown(id, valueToSelect) {    
    let element = document.querySelector('#'+ id +' select');
    element.value = valueToSelect;
  }

  changeStartEndColorDropdown(id, valueToSelect) {   
    let element = document.querySelector('#'+ id);
    element.value = valueToSelect;
   }


  setNodeVisibilityByVisiblePath = (nodeId, rootNodeId) => {
    if (nodeId == rootNodeId) return true; //root is always visible
    var node = this.nodes.get(nodeId);
    if (node.visited) return !node.hidden //prevent circles. ToDo: Reuse results between runs
    node.visited = true;
    node.hidden = true;
    var connectedEdgesIds = this.network.getConnectedEdges(nodeId);
    var connectedEdges = this.edges.get(connectedEdgesIds);
    connectedEdges.forEach((edge) => {
        if (edge.hidden) return; //don't follow hidden edges
        var connectedNodesIds = this.network.getConnectedNodes(edge.id);
        var connectedNodes = this.nodes.get(connectedNodesIds);
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

  legendFunctionality = (e) => {
    var legendGroup;
    var group;
    var nodeChildren;
    legendGroup =  e.target.parentNode.childNodes[1].innerHTML;
    var strategy = "strategy2"
    if (strategy == "strategy2") {

        //A node is visible if at least one path over visible edges to the root node exists.
        this.options.groups[legendGroup].hidden = !this.options.groups[legendGroup].hidden; //toggle state
        if (this.options.groups[legendGroup].hidden) e.target.parentNode.childNodes[1].style.background = '#FFFFFF';
        else e.target.parentNode.childNodes[1].style.background = '#DEF';

        //update all edges
        this.edges.forEach((edge) => {
            edge.hidden = this.options.groups[edge.group].hidden;
            edge.physics = !edge.hidden;
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
            this.nodes.forEach( (node) => {
                node.visited = false;
            });
            
        
        });
        //console.log(this.options)
        // console.log(this.nodes.get())
        // this.nodes.update(nodes);
        // this.edges.update(edges);

        // nodes = this.nodes.get()
        // edges = this.edges.get()



        
        this.network.setData({nodes: this.nodes.get(), edges: this.edges.get()});

        // this.network.setOptions(this.options);
        // this.network.body.emitter.emit('_dataChanged');
        // this.network.redraw();
    }

    
    // graphtool.network.setOptions(options);
    // graphtool.network.body.emitter.emit('_dataChanged');
    
    
    var allFalse = Object.keys(options.groups).every(function(k) {
        if (k === 'useDefaultGroups') {
            return true
        }
        return options.groups[k].hidden === false
    });

    if (allFalse === true) {
        /*oldGroups = {};*/
    }


  };

  ///////////////////////  ///////////////////////  ///////////////////////  ///////////////////////
}
///////// Test-Cases//////////
function test() {
  new GraphTool(div_id = "mynetwork", config = {
    nodes: [
      new RocketBase(1, "red", 0, 0),
      new RocketBase(2, "orange", 100, 0),
      new RocketBase(3, "yellow", 200, 0),
      new RocketBase(4, "green", 300, 0),
      new RocketBase(5, "blue", 400, 0),
      new RocketBase(6, "purple", 500, 0),
      new Fountain(7, "red", 50, 50),
      new Fountain(8, "orange", 150, 50),
      new Fountain(9, "yellow", 250, 50),
      new Fountain(10, "green", 350, 50),
      new Fountain(11, "blue", 450, 50),
      new Fountain(12, "purple", 550, 50),
      new delayNode(13, 0, 200, 1000),
      new delayNode(14, 500, 200, 1000),
      new delayNode(15, 250, 400, 1000),
      new textSpeechNode(16, 100, 600, "Hello"),
      new NodeClasses.CameraNode(17, 200, 600),
    ],
    edges: [{
        from: 13,
        to: 1,
        a: 5
      },
      {
        from: 13,
        to: 2
      },
      {
        from: 13,
        to: 3
      },
      {
        from: 13,
        to: 4
      },
      {
        from: 13,
        to: 5
      },
      {
        from: 13,
        to: 6
      },
      {
        from: 14,
        to: 7
      },
      {
        from: 14,
        to: 8
      },
      {
        from: 14,
        to: 9
      },
      {
        from: 14,
        to: 10
      },
      {
        from: 14,
        to: 11
      },
      {
        from: 14,
        to: 12
      },
      {
        from: 15,
        to: 13
      },
      {
        from: 15,
        to: 14
      },
    ],
    options: {
      interaction: {
        hover: true,
        multiselect: true,
      },
      manipulation: {
        enabled: true,
      },
      edges: {
        arrows: "to"
      }
    }
  })
}


let new_json = {"jsonschema": {
  "Category:Entity": {
      "@context": {
          "label": "Property:HasLabel"
      }
  },
  "Category:Item": {
      "@context": [
          "Category:Entity",
          {
              "member": {"@id": "Property:HasMember", "@type": "@id"},
              "other": {"@id": "Property:HasOther", "@type": "@id"},
              "budget": {"@id": "Property:HasBudget", "@type": "@id"},
              "some_property": {"@id": "Property:HasSomeItem", "@type": "@id"},
              "some_literal": "Property:HasSomeLiteral"
          }
          ],
      "properties": {
          "label": [{
              "type": "array",
              "title": "Labels",
              "items": {
                  "type": "object",
                  "title": "Label",
                  "properties": {
                      "text": {},
                      "lang": {}
                  }
              }
          }],
          "member": {
              "type": "string",
              "title": "Member"
          },
          "budget": {
              "type": "array",
              "title": "Budgets",
              "items": {
                  "type": "object",
                  "title": "Budget",
                  "properties": {
                      "year": {"title": "Year"},
                      "value": {"title": "BudgetValue"}
                  }
              }
          }
      }
  }
  
  }, 
"jsondata": {
  "Item:MyProject": {
      "type": ["Category:Item"],
      "label": [{"text": "My Project", "lang": "en"}],
      "member": ["Item:SomePerson", "Item:SomePerson", "Item:MyOtherItem"],
      "start": true,
      "some_literal": "Some string",
      "not_in_context": "NotinContext",
      "budget": [{
          "year": "2000",
          "value": "10000"
      },{
        "year": "2001",
        "value": "20000"
    },{
      "year": "2002",
      "value": "30000"
  },{
    "year": "2003",
    "value": "40000"
}]
  },
  "Item:SomePerson": {
      "type": ["Category:Item"],
      "label": [{"text": "Max Mustermann", "lang": "en"}],
      "some_property": "Item:MyOtherItem"
  },
  "Property:HasMember": {
      "type": ["Category:Property"],
      "label": [{"text": "Has Member", "lang": "en"}]
  },
  "Item:MyOtherItem": {
    "type": ["Category:Item"],
    "label": [{"text": "My Other", "lang": "en"}],
    "member": ["Item:MyNewItem"],
    "other":["Item:MySecondItem"],
    "some_literal": "Some string",
    "not_in_context": "Not in Context",
    
  },
  "Item:MyNewItem": {
    "type": ["Category:Item"],
    "label": [{"text": "My New Other", "lang": "en"}]
    
  },
  "Item:MySecondItem": {
    "type": ["Category:Item"],
    "label": [{"text": "My Second Other", "lang": "en"}]
    
  },

}};




let nodes = [];
let edges = []

let _config = {
  // callbacks: {
  //   getStartItem: (data) => "Item:MyOtherItem",
  //   setColor: (data) => "#491230"
  //   createContext: (data) => ""
  // }
};
let draw = new createGraph.GraphDrawer(_config, new_json, 5, true, nodes, edges);




var options = {interaction: {hover: true,multiselect: true,},
      manipulation: {enabled: true,},
      edges: {arrows: "to"},
      groups: {
        useDefaultGroups: false
      }
    }
let config = {nodes:nodes,edges:edges,options:options, graph: draw, file: new_json};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//let clicked = {};

$( document ).ready(function() {

  let _config = {

  }

  var graphtool = new GraphTool(_config, "mynetwork", config);



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// function searchJSON(json, search, keys=[]) {
//   for (var key in json) {
//     if (json.hasOwnProperty(key)) {
//       var val = json[key];
//       if (typeof val === 'object') {
//         searchJSON(val, search, keys);
//       } else if (val === search) {
//         keys.push(key);
//       }
//     }
//   }
//   return keys;
// }




// const key = searchJSON(new_json["jsondata"], "2000");
// console.log(key); // prints "person2"


// function findParentKeys(jsonObj, keyToFind, parentKey = null) {
//   let parentKeys = [];
//   if (typeof jsonObj !== "object") {
//     return parentKeys;
//   }

//   if (Array.isArray(jsonObj)) {
//     for (let i = 0; i < jsonObj.length; i++) {
//       if (jsonObj[i][keyToFind] !== undefined) {
//         if (parentKey !== null) {
//           parentKeys.push(parentKey);
//         }
//         //parentKeys.push(i);
//       } else {
//         let nestedParentKeys = findParentKeys(
//           jsonObj[i],
//           keyToFind,
//           parentKey
//         );
//         if (nestedParentKeys.length > 0) {
//           parentKeys = parentKeys.concat(nestedParentKeys);
//         }
//       }
//     }
//   } else {
//     for (let key in jsonObj) {
//       if (key === keyToFind) {
//         if (parentKey !== null) {
//           parentKeys.push(parentKey);
//         }
//       } else if (typeof jsonObj[key] === "object") {
//         let nestedParentKeys = findParentKeys(
//           jsonObj[key],
//           keyToFind,
//           key
//         );
//         if (nestedParentKeys.length > 0) {
//           parentKeys = parentKeys.concat(nestedParentKeys);
//         }
//       }
//     }
//   }
//   return parentKeys;
// }




// const out = findParentKeys(new_json["jsondata"], "not_in_context")
// console.log(out)





});



export {
  GraphTool,
  vis
}