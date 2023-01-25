const vis = require("vis-network/standalone/esm/index.js")
//import { Network, DataSet, Options } from "vis-network/standalone/esm/index.js";
const utils = require("./utils.js")
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
      console.log(rows[i])
      values = rows[i].split(delimiter)
      for (let j = 0; j < titles.length; j++) {
        columns[titles[j]].push(Number(values[j]))
      }
    }
  }
  console.log(columns)
  return columns
}
class recorder {
  constructor() {
    this.arr = new Float32Array()
    this.recording = false
  }
  drawToDiv = (div_id) => {
    this.div_id = div_id
    var record_button = document.createElement("button")
    record_button.innerText = "record"
    document.getElementById(this.div_id).appendChild(record_button)
    record_button.addEventListener('click', this.startRecording)
    var stop_button = document.createElement("button")
    stop_button.innerText = "stop"
    document.getElementById(this.div_id).appendChild(stop_button);
    stop_button.addEventListener('click', this.stopRecording)
    var play_button = document.createElement("button")
    play_button.innerText = "play"
    document.getElementById(this.div_id).appendChild(play_button);
    play_button.addEventListener('click', this.play)
  }
  startRecording = () => {
    this.arr = []
    this.recording = true
    script_processor_node.onaudioprocess = this.process_microphone_buffer
    console.log('startRecording')
    console.log(this, this.arr)
  }
  stopRecording = () => {
    this.recording = false
    script_processor_node.onaudioprocess = () => {}
    console.log("stopRecording")
    console.log(this, this.arr)
  }
  process_microphone_buffer = (event) => { // invoked by event loop
    console.log(event.inputBuffer.getChannelData(0))
    console.log(this.arr, this.arr.concat(event.inputBuffer.getChannelData(0)))
    this.arr = this.arr.concat(event.inputBuffer.getChannelData(0))
  }
  play = () => {
    //flatten this.arr
    let len = 0
    for (let elem of this.arr) {
      len += elem.length
    }
    let flat_arr = new Float32Array(len)
    let passed = 0
    for (let elem of this.arr) {
      flat_arr.set(elem, passed)
      passed += elem.length
    }
    console.log(flat_arr)
    if (flat_arr.length > 0) {
      playSound(flat_arr)
    }
  }
}
class GraphTool {
  constructor(div_id = "mynetwork", config = {
    nodes: [{
      id: 1,
      label: "1"
    }, {
      id: 2,
      label: "2"
    }, {
      id: 3,
      label: "3"
    }],
    edges: [{
      from: 1,
      to: 2
    }, {
      from: 1,
      to: 3
    }],
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
  }) {
    // create a visjs network and attatch it to div
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
    this.nodes = new vis.DataSet(config.nodes)
    this.edges = new vis.DataSet(config.edges)
    this.data = {
      nodes: this.nodes,
      edges: this.edges,
    };
    this.options = config.options;
    this.network = new vis.Network(this.vis_container, this.data, this.options);
    this.pressed_keys = []
    this.mouseX = 0
    this.mouseY = 0
    this.copiedNodes = []
    this.copiedEdges = []
    this.classRegistry = new Map
    this.classRegistry.register = (cls) => {
      this.classRegistry.set((new cls).typeString, cls)
    }
    for (let cls of [RocketBase, Fountain, delayNode, textSpeechNode, CameraNode, ImageNode, CsvNode]) {
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
        console.log("clicked node:", node.constructor, node, "with prototype:", Object.getPrototypeOf(node))
        if (typeof node.showOptions === 'function') {
          node.showOptions(optionsDivId = this.options_container.id)
        } else {
          this.showOptions_default(node, this.options_container.id)
        }
      }
      if (this.pressed_keys.includes('a')) {
        //console.log(params)
        addNode = new RocketBase
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
      console.log(network.getConnectedNodes(node.id))
    }
  }
}
class RocketBase {
  static shot_recorder = new recorder()
  static explosion_recorder = new recorder()
  constructor(id, color, x, y, optionsDivId = "optionsDiv") {
    this.typeString = "RocketBase"
    this.id = id
    this.optionsDivId = optionsDivId
    this.label = "RocketBase"
    this.title = color
    this.fixed = true
    this.color = {
      border: '#000000',
      background: color,
      highlight: {
        border: '#000000',
        background: color
      },
      hover: {
        border: '#000000',
        background: color
      }
    }
    this.x = x
    this.y = y
    this.shape = "database"
    this.explosion_time_ms = 1000
  }
  fire = () => {
    console.log("fire", this)
    let position = network.getPosition(this.id)
    this.shot(position.x, position.y - 10, nodes.get(this.id).color.background)
    console.log(this)
  }
  shot = (x, y, color) => {
    this.constructor.shot_recorder.play()
    let new_id = uuidv4()
    console.log('bin in release_shot')
    nodes.update({
      id: new_id,
      label: "bomb",
      x: x,
      y: y,
      mass: 10000,
      color: "black",
      shape: "dot",
      hidden: false,
      physics: true
    })
    window.setTimeout(() => {
      let position = network.getPosition(new_id)
      this.explosion(position.x, position.y - 100, color)
      console.log(nodes.get(new_id))
      nodes.remove(new_id)
    }, this.explosion_time_ms)
  }
  explosion = (x, y, color) => {
    this.constructor.explosion_recorder.play()
    var added_nodes_ids = [];
    for (let i = 0; i < 20; i++) {
      let new_id = uuidv4()
      nodes.update({
        id: new_id,
        label: "pew",
        x: x,
        y: y,
        color: color,
        shape: "dot",
        hidden: false,
        physics: true,
      })
      added_nodes_ids.push(new_id)
      window.setTimeout(function () {
        console.log("Timeout")
        console.log(added_nodes_ids)
        nodes.remove(new_id)
      }, 700 + 300 * Math.random())
    }
  }
  showOptions = (optionsDivId = "optionsDiv") => {
    optionsDiv = document.getElementById(optionsDivId)
    optionsDiv.innerHTML = `<div id="explosion_rec_div"></div>    <div id="shot_rec_div"></div><br>    <label>explosion time (ms)</label><input id="explosion_time_input"></input>    <div id = "json_div"><pre id="objectJson"></pre></div>`
    this.constructor.shot_recorder.drawToDiv("explosion_rec_div")
    this.constructor.explosion_recorder.drawToDiv("shot_rec_div")
    document.getElementById("explosion_time_input").value = this.explosion_time_ms
    document.getElementById("explosion_time_input").addEventListener('change', () => {
      this.explosion_time_ms = document.getElementById("explosion_time_input").value
    })
    document.getElementById("objectJson").innerHTML = JSON.stringify(this, null,
      4)
  }
}
class Fountain {
  constructor(id, color, x, y) {
    this.typeString = "Fountain"
    this.id = id
    this.label = "Fountain"
    this.title = color
    this.fixed = true
    this.color = color
    this.x = x
    this.y = y
    this.shape = "triangle"
    this.recorder = new recorder()
  }
  fire = () => {
    let position = network.getPosition(this.id)
    this.spray(position.x, position.y - 10, nodes.get(this.id).color)
  }
  spray = (x, y, color) => {
    this.recorder.play()
    var added_nodes_ids = [];
    for (let i = 0; i < 20; i++) {
      window.setTimeout(function () {
        let new_id = uuidv4()
        nodes.update({
          id: new_id,
          label: "pew",
          x: x,
          y: y,
          color: color,
          shape: "dot",
          hidden: false,
          physics: true,
        })
        added_nodes_ids.push(new_id)
        window.setTimeout(function () {
          console.log("Timeout")
          console.log(added_nodes_ids)
          network.setSelection({
            nodes: [new_id],
            edges: []
          })
          network.deleteSelected()
        }, 1700 + 300 * Math.random())
      }, 100 * i)
    }
  }
  showOptions = (optionsDivId = "optionsDiv") => {
    optionsDiv = document.getElementById(optionsDivId)
    optionsDiv.innerHTML = `<div id="spray_rec_div"></div><br>    <div id = "json_div"><pre id="objectJson"></pre></div>`
    this.recorder.drawToDiv("spray_rec_div")
    document.getElementById("objectJson").innerHTML = JSON.stringify(this, null, 4)
  }
}
class delayNode {
  constructor(id, x, y, delay_ms = 1000) {
    this.typeString = "delayNode"
    this.id = id
    this.label = "Delay"
    this.title = "Delay"
    this.fixed = true
    this.color = "gray"
    this.x = x
    this.y = y
    this.shape = "ellipse"
    this.delay_ms = delay_ms
    this.break = false
  }
  fire = () => {
    if (!this.break) {
      let conn_edges = network.getConnectedEdges(this.id)
      console.log(conn_edges)
      conn_edges.forEach((edge_id) => {
        let edge = this.edges.get(edge_id)
        if (edge.from == this.id) {
          let neighbor_node = nodes.get(edge.to)
          console.log(neighbor_node)
          if (neighbor_node.fire) {
            window.setTimeout(() => {
              neighbor_node.fire()
            }, this.delay_ms)
          } else {
            window.setTimeout(() => {
              console.log("no fire, recurse in " + neighbor_node)
              fire_recursive(edge.to)
            }, this.delay_ms)
          }
        }
      })
    }
  }
  showOptions = (optionsDivId = "optionsDiv") => {
    optionsDiv = document.getElementById(optionsDivId)
    optionsDiv.innerHTML = `<div id="delay_options_div">delay<input id="delay_input"></input></div> <input id="break_input" type="checkbox"></input><label for=break_input">break</label><br></div><br>    <div id = "json_div"><pre id="objectJson"></pre></div>`
    document.getElementById("delay_input").value = this.delay_ms
    document.getElementById("break_input").checked = this.break
    document.getElementById("delay_input").addEventListener('change', () => {
      console.log("input changed")
      this.delay_ms = document.getElementById("delay_input").value
    })
    console.log("show Options of ", this)
    document.getElementById("break_input").addEventListener('click', () => {
      console.log("break_input changed", document.getElementById("break_input").checked)
      this.break = document.getElementById("break_input").checked
    })
    document.getElementById("objectJson").innerHTML = JSON.stringify(this, null,
      4)
  }
}
class textSpeechNode {
  constructor(id, x = 0, y = 0, text = "Hello") {
    this.typeString = "textSpeechNode"
    this.id = id
    this.label = "TextToSpeech"
    this.title = "TextToSpeech"
    this.fixed = true
    this.color = "orange"
    this.x = x
    this.y = y
    this.shape = "rectangle"
    this.text = text
    this.language = "de"
  }
  fire = () => {
    var msg = new SpeechSynthesisUtterance();
    msg.text = this.text
    msg.lang = this.language
    msg.pitch = 1
    window.speechSynthesis.speak(msg);
    msg.addEventListener("end", () => {
        console.log(this)
        let conn_edges = network.getConnectedEdges(this.id)
        console.log(conn_edges)
        conn_edges.forEach((edge_id) => {
          let edge = this.edges.get(edge_id)
          if (edge.from == this.id) {
            let neighbor_node = nodes.get(edge.to)
            console.log(neighbor_node)
            if (neighbor_node.fire) {
              window.setTimeout(() => {
                neighbor_node.fire()
              }, this.delay_ms)
            } else {
              window.setTimeout(() => {
                console.log("no fire, recurse in " + neighbor_node)
                fire_recursive(edge.to)
              }, this.delay_ms)
            }
          }
        })
      }
    )
  }
  showOptions = (optionsDivId = "optionsDiv") => {
    optionsDiv = document.getElementById(optionsDivId)
    optionsDiv.innerHTML = `<div id="textSpeechNode_options_div">textSpeechNode<input id="textSpeechNode_input"></input></div> <br></div><br>    <div id = "json_div"><pre id="objectJson"></pre></div>`
    document.getElementById("textSpeechNode_input").value = this.text
    console.log('Add event Listener')
    document.getElementById("textSpeechNode_input").addEventListener('change', () => {
      console.log("input changed")
      this.text = document.getElementById("textSpeechNode_input").value
    })
    document.getElementById("objectJson").innerHTML = JSON.stringify(this, null, 4)
  }
}
class CameraNode {
  constructor(id, x = 0, y = 0) {
    this.typeString = "CameraNode"
    console.log('constructor of CameraNode', id, x, y)
    this.id = id
    this.label = "Camera"
    this.title = "Camera"
    this.fixed = true
    this.color = "orange"
    this.x = x
    this.y = y
    this.shape = "rectangle"
    this.language = "de"
  }
  fire = () => {}
  showOptions = (optionsDivId = "optionsDiv") => {
    console.log("this in cameraNode Show Options ", this.constructor, this)
    optionsDiv = document.getElementById(optionsDivId)
    optionsDiv.innerHTML = `
<button id="start-camera">Start Camera</button><button id="click-photo">Click Photo</button><button id="use-photo">Use Photo</button><div id="Camera_options_div"><canvas id="canvas" width="320" height="240"></canvas><video id="video" width="320" height="240" autoplay></video><div id = "json_div"><pre id="objectJson"></pre></div></div>`
    let camera_button = document.querySelector("#start-camera");
    let video = document.querySelector("#video");
    let click_button = document.querySelector("#click-photo");
    let canvas = document.querySelector("#canvas");
    let use_button = document.querySelector("#use-photo")
    document.getElementById("objectJson").innerHTML = JSON.stringify(this, null, 4)
    if ("image" in this) {
      let img = new Image;
      img.src = this.image
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    camera_button.addEventListener('click', async function () {
      let stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      video.srcObject = stream;
    });
    click_button.addEventListener('click', () => {
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      let image_data_url = canvas.toDataURL('image/jpeg');
      // data url of the image
      //    console.log(image_data_url);
    });
    use_button.addEventListener('click', () => {
      console.log("use button clicked")
      console.log(canvas.toDataURL('image/jpeg'))
      this.image = canvas.toDataURL('image/jpeg')
      this.shape = "image"
      //console.log("update nodes in EventListener",this.constructor,this)
      nodes.update(this)
    })
  }
}
class ImageNode {
  constructor(id, x = 0, y = 0, image = undefined) {
    this.typeString = "ImageNode"
    this.id = id
    this.label = "Image"
    this.title = "Image"
    this.fixed = true
    this.color = "black"
    this.x = x
    this.y = y
    this.shape = "square"
    if (image !== undefined) {
      this.image = image
      this.shape = "image"
    }
  }
  fire = () => {}
  showOptions = (optionsDivId = "optionsDiv") => {
    optionsDiv = document.getElementById(optionsDivId)
    optionsDiv.innerHTML = `
<button id="use-photo">Use Photo</button><div id="Camera_options_div"><canvas id="canvas" width="320" height="240"></canvas><div id = "json_div"><pre id="objectJson"></pre></div></div>`
    let canvas = document.querySelector("#canvas");
    let use_button = document.querySelector("#use-photo")
    document.getElementById("objectJson").innerHTML = JSON.stringify(this, null, 4)
    console.log(this)
    if (this.hasOwnProperty("image")) {
      console.log('Hasown')
      let img = new Image;
      img.src = this.image
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    use_button.addEventListener('click', () => {
      console.log("use button clicked")
      this.image = canvas.toDataURL('image/jpeg')
      this.shape = "image"
      nodes.update(this)
    })
  }
}
class CsvNode {
  constructor(id, x = 0, y = 0, csvFile = undefined) {
    this.typeString = "ImageNode"
    this.id = id
    this.label = "CSV"
    this.title = "CSV"
    this.fixed = true
    this.color = {
      border: '#000000',
      background: "white",
      highlight: {
        border: '#000000',
        background: "white"
      },
      hover: {
        border: '#000000',
        background: "white"
      }
    }
    this.x = x
    this.y = y
    this.shape = "square"
    if (csvFile !== undefined) {
      this.csvText = csvFile
      this.color = {
        border: '#000000',
        background: "lightblue",
        highlight: {
          border: '#000000',
          background: "lightblue"
        },
        hover: {
          border: '#000000',
          background: "lightblue"
        }
      }
      this.columns = CSVToJSONTable(this.csvText, "\t")
    }
  }
  fire = () => {}
  showOptions = (optionsDivId = "optionsDiv") => {
    optionsDiv = document.getElementById(optionsDivId)
    optionsDiv.innerHTML = `
<table style="width:100%"><tr><th>x axis</th><th>y axis</th></tr><tr><th><select id="xSelect"name = "x"></select></th><th><select id="ySelect"name = "y"></select></th></tr></table>  <div id="plotDiv" width="320" height="240"></canvas>    <button id="usePlotAsThumbnail">Use Plot as Icon</button>  <div id = "json_div"><pre id="objectJson"></pre></div></div>`
    let plot_div = document.querySelector("#plotDiv")
    let usePlotAsThumbnailButton = document.querySelector("#usePlotAsThumbnail")
    document.getElementById("objectJson").innerHTML = JSON.stringify(this, null, 4)
    //initialize dropdowns
    xSelect = document.getElementById("xSelect")
    ySelect = document.getElementById("ySelect")
    Object.keys(this.columns).forEach((key) => {
      console.log(key)
      var el = document.createElement("option");
      el.textContent = key;
      el.value = key;
      xSelect.appendChild(el);
      var el = document.createElement("option");
      el.textContent = key;
      el.value = key;
      ySelect.appendChild(el);
    })
    if (this.visualization_definition == undefined) {
      this.visualization_definition = {
        x: Object.keys(this.columns)[0],
        y: Object.keys(this.columns)[1]
      }
    }
    // plot some data 
    const plotData = () => {
      var trace1 = {
        x: this.columns[this.visualization_definition.x],
        y: this.columns[this.visualization_definition.y],
        mode: 'lines+markers',
        type: 'scatter'
      }
      var data = [trace1];
      var layout = {
        autosize: false,
        width: 400,
        height: 300,
        margin: {
          l: 30,
          r: 30,
          b: 30,
          t: 20,
          pad: 0
        },
        xaxis: {
          title: this.visualization_definition.x
        },
        yaxis: {
          title: this.visualization_definition.y
        }
      };
      Plotly.newPlot(plotDiv, data, layout);
    }
    plotData()
    xSelect.addEventListener('change', () => {
      console.log('x change')
      this.visualization_definition.x = xSelect.value
      plotData()
    })
    ySelect.addEventListener('change', () => {
      console.log('y change')
      this.visualization_definition.y = ySelect.value
      plotData()
    })
    usePlotAsThumbnailButton.addEventListener('click', () => {
      Plotly.toImage(plot_div, {
        format: 'png',
        width: 800,
        height: 600
      }).then((dataUrl) => {
        nodes.update({
          id: this.id,
          image: dataUrl,
          shape: "image"
        })
      })
    })
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
      new CameraNode(17, 200, 600),
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
export {
  GraphTool,
  vis
}