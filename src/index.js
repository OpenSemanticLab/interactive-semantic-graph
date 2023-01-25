// imports

const vis = require("vis-network/standalone/esm/index.js")
const utils = require("./utils.js")
const NodeClasses = require("./NodeClasses.js")



class GraphTool {
  constructor(div_id = "mynetwork", config = {
    nodes: [{id: 1,label: "1"},
     {id: 2,label: "2"}, 
     {id: 3,label: "3"}],
    edges: [{from: 1, to: 2}, 
     {from: 1,to: 3}],
    options: {interaction: {hover: true,multiselect: true,},
      manipulation: {enabled: true,},
      edges: {arrows: "to"}
    }
  }) {
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
    console.log(config)
    this.nodes = new vis.DataSet(config.nodes)
    this.edges = new vis.DataSet(config.edges)
    this.data = {
      nodes: this.nodes,
      edges: this.edges,
    };
    this.options = config.options;
    this.network = new vis.Network(this.vis_container, this.data, this.options);
    console.log(this.config)
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
      console.log(cls)
      this.classRegistry.register(cls)
    }
    console.log(this.classRegistry)
    // set extended behavior of visjs Network 
    this.network.on("click", (params) => {
      console.log(
        "Click event, ",
      );
      if (params.nodes.length > 0) {
        console.log("show options")
        let node = this.nodes.get(params.nodes[0])
        if (typeof node.showOptions === 'function') {
          console.log(node,node.showOptions,this.options_container.id)
          let optionsId=this.options_container.id
          node.showOptions(optionsId)
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
    this.network.on("doubleClick", (params) => {
      console.log(
        "doubleClick event, getNodeAt returns: " +
        params.nodes
      );
      let node_id = params.nodes[0]
      if (params.nodes.length > 0) {
        this.fire_recursive(node_id)
      }
      console.log('doubleClick event finished')
    });
    // right click
    this.network.on("oncontext", (params) => {
      console.log('in this.network.on(oncontext)')
    });
    this.network.on('dragStart', (params) => {
      console.log("dragStart");
      if (params.nodes.length > 0) {
        let newNodeIds = []
        params.nodes.forEach((node_id) => {
          let node = this.nodes.get(node_id)
          let position = this.network.getPosition(node_id) //setting the current position is necessary to prevent snap-back to initial position
          console.log(position)
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
      console.log(params.nodes)
      params.nodes.forEach((node_id) => {
        let node = this.nodes.get(node_id)
        let position = this.network.getPosition(node_id)
        console.log(node)
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
        console.log('copy')
        this.copiedNodes = this.network.getSelectedNodes()
        this.copiedEdges = this.network.getSelectedEdges()
        console.log(this.copiedNodes, this.copiedEdges)
      }
      // paste
      if (event.key == "v" && this.pressed_keys.includes("Control")) {
        if (this.copiedNodes.length > 0) {
          console.log('paste')
          let xy = this.network.DOMtoCanvas({
            x: this.mouseX,
            y: this.mouseY
          })
          let oldNode = this.nodes.get(this.copiedNodes[0])
          console.log("copied nodes:", this.copiedNodes, oldNode)
          console.log("Name of Constructor: ", oldNode.constructor, oldNode.constructor.Name)
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

    // Rectangular selection:
    this.initRectangleSelection()
    this.initDragAndDrop()

  } 

  initRectangleSelection(){
      // Multiselect functionality 
      this.network.setOptions({interaction:{
        dragView: false,
        multiselect: true
    }})

      var canvas;
      var ctx;
      var container = this.vis_container

      
      canvas = this.network.canvas.frame.canvas;
      ctx = canvas.getContext('2d');

      var rect = {},
        drag = false;
      var drawingSurfaceImageData;

      const saveDrawingSurface = ()=>{
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

      const getStartToEnd = (start, theLen)=> {
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
          console.log('drag',drag,prev_selectedNodes)
          if (prev_selectedNodes.length==0){
            
            selectNodesFromHighlight();
          }
          restoreDrawingSurface();
          drag = false;

          container.style.cursor = "default";

        }
        console.log("end of mouse up",)
      });

      document.body.oncontextmenu = function () {
        console.log('oncontextmenu');
        return false;
      };
  }

  initDragAndDrop(){
        // drag & drop functionality

    var container = this.vis_container
    const handleDrop = (e)=>{
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

          let reader = new FileReader();
          reader.onload = (event) => {
            //console.log(event.target.result);
            let newNode = new NodeClasses.ImageNode(utils.uuidv4(), xy.x, xy.y, event.target.result)
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

          let reader = new FileReader();
          reader.onload = (event) => {
            //console.log(event.target.result);
            let newNode = new NodeClasses.CsvNode(utils.uuidv4(), xy.x, xy.y, event.target.result)
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

  showOptions_default(node,optionsDivId = 'optionsDiv'){
      let optionsDiv = document.getElementById(optionsDivId)
      optionsDiv.innerHTML = `
          <div id = "json_div"><pre id="objectJson"></pre></div>`
      document.getElementById("objectJson").innerHTML = JSON.stringify(node,null,
        4)
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
  fire_recursive(node_id) {
    let node = this.nodes.get(node_id)
    if ("fire" in node) {
      node.fire()
    } else {
      let conn_edges = this.network.getConnectedEdges(node.id)
      console.log(conn_edges)
      conn_edges.forEach(function (edge_id) {
        let edge = this.edges.get(edge_id)
        if (edge.from == node_id) {
          let neighbor_node = this.nodes.get(edge.to)
          console.log(neighbor_node)
          if (neighbor_node.fire) {
            neighbor_node.fire()
          } else {
            window.setTimeout(function () {
              console.log("no fire, recurse in " + neighbor_node)
              fire_recursive(edge.to)
            }, 200)
          }
        }
      })
      console.log(this.network.getConnectedNodes(node.id))
    }
  }

  createTestSetup(){
    console.log('createTestSetup')
  }

}

function testGraph(){
  
  let config = {
    nodes: [
      new NodeClasses.RocketBase(1, "red", 0, 0),
      new NodeClasses.RocketBase(2, "orange", 100, 0),
      new NodeClasses.RocketBase(3, "yellow", 200, 0),
      new NodeClasses.RocketBase(4, "green", 300, 0),
      new NodeClasses.RocketBase(5, "blue", 400, 0),
      new NodeClasses.RocketBase(6, "purple", 500, 0),
      new NodeClasses.Fountain(7, "red", 50, 50),
      new NodeClasses.Fountain(8, "orange", 150, 50),
      new NodeClasses.Fountain(9, "yellow", 250, 50),
      new NodeClasses.Fountain(10, "green", 350, 50),
      new NodeClasses.Fountain(11, "blue", 450, 50),
      new NodeClasses.Fountain(12, "purple", 550, 50),
      new NodeClasses.DelayNode(13, 0, 200, 1000),
      new NodeClasses.DelayNode(14, 500, 200, 1000),
      new NodeClasses.DelayNode(15, 250, 400, 1000),
      new NodeClasses.TextSpeechNode(16, 100, 600, "Hello"),
      new NodeClasses.CameraNode(17, 200, 600),
    ],
    edges: [{from: 13,to: 1,a: 5},
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
  }
  new GraphTool(this.div_id,config)
}


export {
  GraphTool,
  vis,
  testGraph
}