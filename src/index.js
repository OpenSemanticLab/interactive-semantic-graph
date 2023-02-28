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
  constructor(div_id, config) {
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
    for (let cls of [NodeClasses.RocketBase, NodeClasses.Fountain, NodeClasses.DelayNode, NodeClasses.TextSpeechNode,NodeClasses.CameraNode, NodeClasses.ImageNode, NodeClasses.CsvNode]) {
      //console.log(cls)
      this.classRegistry.register(cls)
    }
    //console.log(this.classRegistry)
    // set extended behavior of visjs Network 
    this.network.on("click", (params) => {
      //console.log("Click event, ",);
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
      //console.log('in this.network.on(oncontext)')
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
        node.fixed = true
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

  createTestSetup(){
    //console.log('createTestSetup')
  }
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
      "not_in_context": "Not in Context",
      "budget": [{
          "year": "2000",
          "value": "10000"
      },{
        "year": "2001",
        "value": "20000"
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


//import data from './test.json'


// let nodes = [];
// let edges = [];
// let id = 0;
// let first = true;
// let rootId;
// let context = data['@context']

let nodes = [];
let edges = [];

let draw = new createGraph.drawGraph(new_json, 3, true, nodes, edges);


var options = {interaction: {hover: true,multiselect: true,},
      manipulation: {enabled: true,},
      edges: {arrows: "to"}
    }
let config = {nodes:nodes,edges:edges,options:options};





let clicked = {};

$( document ).ready(function() {

  $(document).keydown(function(e){
    console.log(e.keyCode);
  });



  // var keymap = new Keymap.Keymap({                      // Create a new instance of Keymap
  //                 "shift_b": function(event, keyid) {         // Bind key combi: ctrl+a
  //                     alert("Key pressed down! KeyId: " + keyid)
  //                 }
  //             });
  //             keymap.install(document.body); 



let keyObject = {
  doubleclick: function(params){
    expandNodes(params)
  },
}

function getAllEdgesWithLabel(edges, label){

  let tempArray = []

  for (let index = 0; index < edges.length; index++) {
    
    if(edges[index].label == label){
      tempArray.push(edges[index]);
    }
    
  }

  return tempArray;

}




function colorByValue(path, nodes, edges){

  let tempArray = [];

  for(let i = 0; i < path.length; i++){

    tempArray.push(getAllEdgesWithLabel(edges, path[i]));

  }



  let thingsToColor = [];
  let colorPath = 0;

  if(path.length == 1){

    for (let index = 0; index < tempArray[0].length; index++) {
      
      for(let j = 0; j < nodes.length; j++){

        if(tempArray[0][index].from == nodes[j].id || tempArray[0][index].to == nodes[j].id){

          nodes[j].color = "#ff0000";
          thingsToColor.push(nodes[j]);
          
        }

      }
      tempArray[0][index].color = "#ff0000";
      thingsToColor.push(tempArray[0][index]);

    }

  }


  for(let i = 0; i < tempArray.length; i++){

    for(let j = 0; j < tempArray[i].length; j++){

      if(tempArray.length == i+1){
        console.log(thingsToColor)
        console.log(thingsToColor.filter(x => x.label=="value").length);
        return;
      }

      for(let k = 0; k < tempArray[i+1].length; k++){

        if(tempArray[i][j].to == tempArray[i+1][k].from && tempArray[i+1][k].label == path[i+1] && tempArray[i][j].label == path[i]){

          

          for (let index = 0; index < nodes.length; index++) {

              if(nodes[index].id == tempArray[i][j].to){
                nodes[index].color = "#ff0000"
                thingsToColor.push(nodes[index])

              }


              if(nodes[index].id == tempArray[i+1][k].to){
                nodes[index].color = "#ff0000"
                thingsToColor.push(nodes[index])

              }
            
          }

          tempArray[i][j]["color"] = "#ff0000"

          thingsToColor.push(tempArray[i][j]);

          tempArray[i+1][k]["color"] = "#ff0000"

          thingsToColor.push(tempArray[i+1][k]);



        }


        //console.log("not +1",tempArray[i][j])
        //console.log("+1", tempArray[i+1][k])

  
      }
  
    }

  }

  

  //console.log(tempArray);

}

function expandNodes(params){

  let newcolor = chroma.scale(["green", "red"]).mode('hsl').colors(6);
  console.log(newcolor);



  if (params.nodes.length > 0) {

    let node = graphtool.nodes.get(params.nodes[0])
    
    if("object" in node && (clicked[params.nodes[0]] == false || !(""+params.nodes[0] in clicked))){
      
      if(node.context){
        draw.createGraphNE(new_json, node.id, node.object, node.context, node.depth, "", true);
      }else{
        draw.createGraphNE(new_json, node.id, node.object, "", node.depth, "", true);
      }

      //getAllProperties(node.leftJSON, node.id);

      colorByValue(["value"], nodes, edges)
      clicked[params.nodes[0]] = true;

      graphtool.nodes.update(nodes);
      graphtool.edges.update(edges);

      }else{
        clicked[params.nodes[0]] = false;
        //let nodesToDelete = graphtool.network.getConnectedNodes(params.nodes[0], "to");
        let nodesToDelete = [];
        
        recNodes(params.nodes[0], nodesToDelete);



        for(let i = 0; i<nodesToDelete.length;i++){
          if(!(nodesToDelete[i] == params.nodes[0])){
            graphtool.nodes.remove(nodesToDelete[i])
          }
        }

        for(let i = 0; i<nodes.length;i++){
          if(nodesToDelete.includes(nodes[i].id) && nodes[i].id != params.nodes[0]){
            //console.log(nodes[i])
            nodes.splice(i, 1);
            i =  i-1;
            //console.log(nodes); 
          }
          
        }
        

        //graphtool.nodes.update(nodes);
        //graphtool.edges.update(edges);
        //deleteNodesChildren(params.nodes[0], "", params.nodes[0]);
        
      }
      //console.log(clicked)
      }



function getAllReachableNodesTo(nodeId, excludeIds, reachableNodes) {
                  if (reachableNodes.includes(nodeId) || excludeIds.includes(nodeId)) {
                      return;
                  }
                  var children = graphtool.network.getConnectedNodes(nodeId);
                  reachableNodes.push(nodeId);
                  for (var i = 0; i < children.length; i++) {
                      getAllReachableNodesTo(children[i], excludeIds, reachableNodes);
                      //if(excludeIds.includes(children[i]))continue;
                      //reachableNodes.push(children[i]);
                  }
              }
function deleteNodesChildren(nodeId, deleteEdge, clickedNode) {
                  var excludedIds = [];
                  if (deleteEdge === true) {
                      console.log("deleteEdge true")
                  } else {
                      excludedIds.push(nodeId);
                  }
                  var reachableNodesTo = [];
                  getAllReachableNodesTo(graphtool.nodes.get("0"), excludedIds, reachableNodesTo);
                  var nodesToDelete = [];
                  var allIds = graphtool.nodes.getIds();
                  for (var i = 0; i < allIds.length; i++) {
                      if (reachableNodesTo.includes(allIds[i])) continue;
                      if (allIds[i] == nodeId) {
                          deleteEdges(nodeId);
                          continue;
                      }
                      nodesToDelete.push(allIds[i]);
                      deleteEdges(allIds[i]);
                      graphtool.nodes.remove(allIds[i]);

                  }
                  return nodesToDelete;
              }

function deleteEdges(nodeID) {
                  var fromEdges = graphtool.edges.get({
                      filter: function(item) {
                          return item.from == nodeID;
                      }
                  });
                  for (var j = 0; j < fromEdges.length; j++) {
                      graphtool.edges.remove(fromEdges[j]);
                  }
              }

              function recNodes(nodeId, reachableNodes){
                if (graphtool.network.getConnectedNodes(nodeId, "to") == []) {
                  return reachableNodes;
                }
                var children = graphtool.network.getConnectedNodes(nodeId, "to");
                reachableNodes.push(nodeId);
                for (var i = 0; i < children.length; i++) {
                    delete clicked[children[i]];
                    recNodes(children[i], reachableNodes);
                    //if(excludeIds.includes(children[i]))continue;
                    //reachableNodes.push(children[i]);
              }
              
              
              }

              
              //deleteNodesChildren(params.nodes[0]);


}

  var graphtool = new GraphTool("mynetwork",config);

  // var legendDiv = document.createElement("div");
  //               let vis_cont = document.getElementById("vis_container")
  //               vis_cont.append(legendDiv);
  //               legendDiv.style.width = '100%';
  //               legendDiv.style.position = 'relative';
  //               legendDiv.style.display = 'inline-block';
  //               legendDiv.id = "legendContainer";
  //               var legendColors = {};
  //               for (var i = 0; i < edges.length; i++) {
  //                   //legendColors[input.properties[i]] = colors[i];
  //                   var propertyContainer = document.createElement("div");
  //                   var propertyColor = document.createElement("div");
  //                   var propertyName = document.createElement("div");
  //                   propertyContainer.className = "legend-element-container";
  //                   propertyContainer.id = edges[i].label;
  //                   propertyColor.className = "color-container";
  //                   propertyName.className = "name-container";
  //                   propertyColor.style.float = "left";
  //                   propertyName.style.float = "left";
  //                   propertyColor.style.border = "1px solid black";
  //                   propertyName.style.border = "1px solid black";
  //                   //propertyColor.style.background = colors[i];
  //                   propertyColor.innerHTML = "";
  //                   propertyName.innerHTML = edges[i].label;
  //                   propertyColor.style.width = "30px";
  //                   propertyColor.style.height = "30px";
  //                   propertyName.style.height = "30px";
  //                   propertyName.style.background = '#DEF';
  //                   //propertyName.text-align = 'center';
  //                   propertyContainer.paddinng = '5px 5px 5px 5px';
  //                   //propertyName.addEventListener("click", legendFunctionality);
  //                   //propertyColor.addEventListener("click", legendFunctionality);
  //                   legendDiv.append(propertyContainer);
  //                   propertyContainer.append(propertyColor);
  //                   propertyContainer.append(propertyName);
  //               }


  graphtool.network.on("doubleClick", (params) => {
    
    keyObject.doubleclick(params);

  });
});



export {
  GraphTool,
  vis
}