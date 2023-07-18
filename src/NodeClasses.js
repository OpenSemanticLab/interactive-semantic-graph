const Plotly = require("plotly.js-dist")
const JSONEditor_ = require("@json-editor/json-editor")
//const JSONEditor = require("jsoneditor/dist/jsoneditor")
const utils = require("./utils.js")
const defaults = require('./defaults')


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
      //console.log('startRecording')
      //console.log(this, this.arr)
    }
    stopRecording = () => {
      this.recording = false
      script_processor_node.onaudioprocess = () => {}
      //console.log("stopRecording")
      //console.log(this, this.arr)
    }
    process_microphone_buffer = (event) => { // invoked by event loop
      //console.log(event.inputBuffer.getChannelData(0))
      //console.log(this.arr, this.arr.concat(event.inputBuffer.getChannelData(0)))
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
      //console.log(flat_arr)
      if (flat_arr.length > 0) {
        playSound(flat_arr)
      }
    }
  }

class BaseNode{
  // here shall be defined all the interfacing stuff that is necessary for rendering, showing 
  constructor(container,id, x = 0, y = 0){
    this.container = container
    this.content = {}
    this.id = id
    this.x = x
    this.y = y
    this.typeString = "BaseNode"
  }
  replacer(key,value)
  {
      if (key=="container") return undefined;
     // else if (key=="privateProperty2") return undefined;
      else return value;
  }
  
  appendJsonToOptions = (optionsDivId = 'optionsDiv',schema = undefined) => {
    let optionsDiv = document.getElementById(optionsDivId)
    let JsonDiv = document.createElement('div')
    optionsDiv.appendChild(JsonDiv)
    let setButton = document.createElement('button')
    setButton.innerHTML="Set JSON properties"
    optionsDiv.appendChild(setButton)
    let EditorDiv = document.createElement('div')
    //EditorDiv.height = 300; // in px
    EditorDiv.style = "overflow-y: scroll;height: 400px;position: relative;bottom: 0"
    
    JsonDiv.appendChild(EditorDiv)
    
    if (schema===undefined){
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
            "anyOf":[
              {"type": "string"},
              {"type": "integer"}
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
            "examples": ["blue","#ffffff"],
            "type": "string"
          },
          "shape": {
            "title": "shape",
            "type": "string",
            "enum": ["ellipse","circle","database","box","text","image", "circularImage", "diamond", "dot", "star", "triangle", "triangleDown", "hexagon", "square","icon"]
          }
        }
      }

      }

      let options = {
        schema: schema,
       // schemaRefs: {"job": job},
        mode: 'tree',
        modes: ['code', 'tree'] // ['code', 'form', 'text', 'tree', 'view', 'preview']
      }

      let editor = new JSONEditor(EditorDiv,options)
      editor.set(JSON.parse(JSON.stringify(this, this.replacer, 4)))

      setButton.addEventListener('click', ()=>{
        console.log("editor:",editor,editor.navBar.textContent.split('►'),editor.navBar.textContent.split('j'))
        
        let node = editor.get()
        for (let key in node){
          this[key] = node[key]
        }
        console.log(this)
        this.container.nodes.update(this)
      })
}
}


class VideoNode extends BaseNode {
    constructor(container, id, x = 0, y = 0, video=undefined) {
      super(container, id, x, y)
      this.typeString = "VideoNode"
      this.label = "Video"
      this.title = "Video"
      this.fixed = true
      this.color = "blue"
      this.video = video
      
      this.shape = "rectangle"
      this.language = "de"
    }
    run = () => {}
    showOptions = (optionsDivId = "optionsDiv") => {
      let optionsDiv = document.getElementById(optionsDivId)
      optionsDiv.innerHTML = `
  <button id="play-button">play</button><button id="pause-button">pause</button><br>`
      let play_button = document.querySelector("#play-button");
      let pause_button = document.querySelector("#pause-button");
      let video = document.createElement('video')
      video.src = this.video
      video.controls = true
      video.muted = false
      video.height = 240; // in px
      video.width = 320; // in px
      optionsDiv.appendChild(video)

      play_button.addEventListener('click', function () {
        console.log(this.video)
        video.play()
      });
      pause_button.addEventListener('click', function () {
        video.pause()
      });

      this.appendJsonToOptions(optionsDivId = optionsDivId)
    }
  }

  class CameraNode extends BaseNode {
    constructor(container, id, x = 0, y = 0, video=undefined) {
      super(container, id, x, y)
      this.typeString = "CameraNode"
      this.label = "Camera"
      this.title = "Camera"
      this.fixed = true
      this.color = "orange"
      
      this.shape = "rectangle"
      this.language = "de"
    }
    run = () => {}
    showOptions = (optionsDivId = "optionsDiv") => {
      let optionsDiv = document.getElementById(optionsDivId)
      optionsDiv.innerHTML = `
  <button id="start-camera">Start Camera</button><button id="click-photo">Click Photo</button><button id="use-photo">Use Photo</button><div id="Camera_options_div"><canvas id="canvas" width="320" height="240"></canvas><video id="video" width="320" height="240" autoplay></video></div>`
      let camera_button = document.querySelector("#start-camera");
      let video = document.querySelector("#video");
      let click_button = document.querySelector("#click-photo");
      let canvas = document.querySelector("#canvas");
      let use_button = document.querySelector("#use-photo")
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
      });
      use_button.addEventListener('click', () => {
        this.image = canvas.toDataURL('image/jpeg')
        this.shape = "image"
        this.container.nodes.update(this)
      })
      this.appendJsonToOptions(optionsDivId = optionsDivId)
    }
  }


  class DrawNode extends BaseNode {
    constructor(container, id, x = 0, y = 0, image = undefined) {
      super(container, id, x, y)
      this.typeString = "DrawNode"
      this.label = "Draw"
      this.title = "Draw"
      this.fixed = true
      this.color = "purple"
      this.draw_color = "black"
      
      
      this.shape = "ellipse"
      this.language = "en"
      this.break = false
      this.delay_ms = 1000 //ms
    }
    run = () => {
      // check if node has successor and show its options
      console.log("run in DivID")
      this.showOptions(this.container.options_container.id)
      if (!this.break) {
        let conn_edges = this.container.network.getConnectedEdges(this.id)
        console.log(conn_edges)
        conn_edges.forEach((edge_id) => {
          
        let edge = this.container.edges.get(edge_id)
        if (edge.from == this.id) {
          let neighbor_node = this.container.nodes.get(edge.to)
          if (neighbor_node.run) {
            window.setTimeout(() => {
              neighbor_node.run()
            }, this.delay_ms)
          } else {
            window.setTimeout(() => {
              run_recursive(edge.to)
            }, this.delay_ms)
          }
        }
         
        })
      }
    }
    showOptions = (optionsDivId = "optionsDiv") => {
      let optionsDiv = document.getElementById(optionsDivId)
      optionsDiv.innerHTML = `<button id="use-photo">Use Photo</button><input id="break_input" type="checkbox">break</input>
      <div id="Camera_options_div"><canvas id="canvas" width="320" height="240"></canvas></div>`
      let canvas = document.querySelector("#canvas");
      let context = canvas.getContext('2d');
      let use_button = document.querySelector("#use-photo");

      break_input = document.getElementById("break_input")
      break_input.checked = this.break      
      break_input.addEventListener('click', () => {
        this.break = break_input.checked
      })

      if ("image" in this) {
        let img = new Image;
        img.src = this.image
        context.drawImage(img, 0, 0, canvas.width, canvas.height)
      }

      let radius = 5;  
      let start = 0; 
      let end = Math.PI * 2;  
      let dragging = false;

      //canvas.width = window.innerWidth; 
      //canvas.height = window.innerHeight;  

      context.lineWidth = radius * 2; 
      
      let putPoint = (e)=>{
        
        if(dragging){

          context.lineTo(e.offsetX, e.offsetY);
          context.stroke();
          context.beginPath(); 
          context.arc(e.offsetX, e.offsetY, radius, start, end);
          context.fill();  
          context.beginPath();
          context.moveTo(e.offsetX, e.offsetY);
        }
      }

      let engage = (e)=>{
        context.fillStyle = this.draw_color
        context.strokeStyle = this.draw_color
        dragging = true;
        putPoint(e);
      }

      let disengage = ()=>{
        dragging = false;
        context.beginPath();
      }

      canvas.addEventListener('mousedown', engage);
      canvas.addEventListener('mousemove', putPoint);
      canvas.addEventListener('mouseup', disengage);

      use_button.addEventListener('click', () => {
        
        this.image = canvas.toDataURL('image/png')
        this.shape = "image"
        this.container.nodes.update(this)
        console.log('use image',this.image)
      })
      this.appendJsonToOptions(optionsDivId = optionsDivId)
    }
  }



  class RocketBase extends BaseNode {
    static shot_recorder = new recorder()
    static explosion_recorder = new recorder()
    constructor(container, id, color, x, y, optionsDivId = "optionsDiv") {
      super(container, id, x, y)
      this.typeString = "RocketBase"
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
      this.shape = "database"
      this.explosion_time_ms = 1000
    }
    run = () => {
      let position = this.container.network.getPosition(this.id)
      this.shot(position.x, position.y - 10, this.container.nodes.get(this.id).color.background)
    }
    shot = (x, y, color) => {
      this.constructor.shot_recorder.play()
      let new_id = utils.uuidv4()
      this.container.nodes.update({
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
      window.setTimeout(()=>{
        let position = this.container.network.getPosition(new_id)
        this.explosion(position.x, position.y - 100, color)
        this.container.nodes.remove(new_id)
      }, this.explosion_time_ms)
    }
    explosion = (x, y, color) => {
      this.constructor.explosion_recorder.play()
      var added_nodes_ids = [];
      for (let i = 0; i < 20; i++) {
        let new_id = utils.uuidv4()
        this.container.nodes.update({
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
        window.setTimeout(()=>{
          this.container.nodes.remove(new_id)
        }, 700 + 300 * Math.random())
      }
    }
    showOptions = (optionsDivId="optionsDiv") => {
      let optionsDiv = document.getElementById(optionsDivId)
      optionsDiv.innerHTML = `<div id="explosion_rec_div"></div>    <div id="shot_rec_div"></div><br>    <label>explosion time (ms)</label><input id="explosion_time_input"></input>`
      this.constructor.shot_recorder.drawToDiv("explosion_rec_div")
      this.constructor.explosion_recorder.drawToDiv("shot_rec_div")
      document.getElementById("explosion_time_input").value = this.explosion_time_ms
      document.getElementById("explosion_time_input").addEventListener('change', () => {
        this.explosion_time_ms = document.getElementById("explosion_time_input").value
      })
      
      this.appendJsonToOptions(optionsDivId = optionsDivId)
    }
  }
  class Fountain extends BaseNode {
    constructor(container, id, color, x, y) {
      super(container, id, x, y)
      this.typeString = "Fountain"
      this.label = "Fountain"
      this.title = color
      this.fixed = true
      this.color = color
      this.shape = "triangle"
      this.recorder = new recorder()
    }
    run = () => {
      let position = this.container.network.getPosition(this.id)
      this.spray(position.x, position.y - 10, this.container.nodes.get(this.id).color)
    }
    spray = (x, y, color) => {
      this.recorder.play()
      var added_nodes_ids = [];
      for (let i = 0; i < 20; i++) {
        window.setTimeout(()=> {
          let new_id = utils.uuidv4()
          this.container.nodes.update({
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
          window.setTimeout(()=> {
            this.container.network.setSelection({
              nodes: [new_id],
              edges: []
            })
            this.container.network.deleteSelected()
          }, 1700 + 300 * Math.random())
        }, 100 * i)
      }
    }
    showOptions = (optionsDivId = "optionsDiv") => {
      let optionsDiv = document.getElementById(optionsDivId)
      optionsDiv.innerHTML = `<div id="spray_rec_div"></div><br>`
      this.recorder.drawToDiv("spray_rec_div")
      this.appendJsonToOptions(optionsDivId=optionsDivId)
    }
  }
  class DelayNode extends BaseNode {
    constructor(container, id, x, y, delay_ms = 1000) {
      super(container, id, x, y)
      this.typeString = "DelayNode"
      this.label = "Delay"
      this.title = "Delay"
      this.fixed = true
      this.color = "gray"
      this.shape = "ellipse"
      this.delay_ms = delay_ms
      this.break = false
    }
    run = () => {
      if (!this.break) {
        let conn_edges = this.container.network.getConnectedEdges(this.id)
        conn_edges.forEach((edge_id) => {
          let edge = this.container.edges.get(edge_id)
          if (edge.from == this.id) {
            let neighbor_node = this.container.nodes.get(edge.to)
            if (neighbor_node.run) {
              window.setTimeout(() => {
                neighbor_node.run()
              }, this.delay_ms)
            } else {
              window.setTimeout(() => {
                run_recursive(edge.to)
              }, this.delay_ms)
            }
          }
        })
      }
    }
    showOptions = (optionsDivId = "optionsDiv") => {
      let optionsDiv = document.getElementById(optionsDivId)
      optionsDiv.innerHTML = `<div id="delay_options_div">delay<input id="delay_input"></input></div> <input id="break_input" type="checkbox"></input><label for=break_input">break</label><br></div><br> </div>`
      document.getElementById("delay_input").value = this.delay_ms
      document.getElementById("delay_input").addEventListener('change', () => {
        this.delay_ms = document.getElementById("delay_input").value
      })

      break_input = document.getElementById("break_input")
      break_input.checked = this.break
      
      break_input.addEventListener('click', () => {
        this.break = break_input.checked
      })
      this.appendJsonToOptions(optionsDivId=optionsDivId)
    }
  }
  class TextSpeechNode extends BaseNode {
    constructor(container, id, x = 0, y = 0, text = "Hello") {
      super(container, id, x, y)
      this.typeString = "TextSpeechNode"
      this.label = "TextToSpeech"
      this.title = "TextToSpeech"
      this.fixed = true
      this.color = "orange"
      this.shape = "rectangle"
      this.text = text
      this.language = "de"
    }
    run = () => {
      var msg = new SpeechSynthesisUtterance();
      msg.text = this.text
      msg.lang = this.language
      msg.pitch = 1
      window.speechSynthesis.speak(msg);
      msg.addEventListener("end", () => {
          let conn_edges = this.container.network.getConnectedEdges(this.id)
          conn_edges.forEach((edge_id) => {
            let edge = this.container.edges.get(edge_id)
            if (edge.from == this.id) {
              let neighbor_node = this.container.nodes.get(edge.to)
              if (neighbor_node.run) {
                window.setTimeout(() => {
                  neighbor_node.run()
                }, this.delay_ms)
              } else {
                window.setTimeout(() => {
                  run_recursive(edge.to)
                }, this.delay_ms)
              }
            }
          })
        }
      )
    }
    showOptions = (optionsDivId = "optionsDiv") => {
      let optionsDiv = document.getElementById(optionsDivId)
      optionsDiv.innerHTML = `<div id="textSpeechNode_options_div">textSpeechNode<input id="textSpeechNode_input"></input></div> <br></div><br>    <div id = "json_div"><pre id="objectJson"></pre></div>`
      document.getElementById("textSpeechNode_input").value = this.text
      document.getElementById("textSpeechNode_input").addEventListener('change', () => {
        this.text = document.getElementById("textSpeechNode_input").value
      })
      this.appendJsonToOptions(optionsDivId = optionsDivId)
    }
  }
  class ImageNode extends BaseNode {
    constructor(container, id, x = 0, y = 0, image = undefined) {
      super(container, id, x, y)
      this.typeString = "ImageNode"
      this.label = "Image"
      this.title = "Image"
      this.fixed = true
      this.color = "black"
      this.shape = "square"
      if (image !== undefined) {
        this.image = image
        this.shape = "image"
      }
    }
    run = () => {}
    showOptions = (optionsDivId = "optionsDiv") => {
      let optionsDiv = document.getElementById(optionsDivId)
      optionsDiv.innerHTML = `
  <button id="use-photo">Use Photo</button><div id="Camera_options_div"><canvas id="canvas" width="320" height="240"></canvas></div>`
      let canvas = document.querySelector("#canvas");
      let use_button = document.querySelector("#use-photo")
      this.appendJsonToOptions(optionsDivId = optionsDivId)
 
      if (this.hasOwnProperty("image")) {

        let img = new Image;
        img.src = this.image
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      use_button.addEventListener('click', () => {
        this.image = canvas.toDataURL('image/jpeg')
        this.shape = "image"
        this.container.nodes.update(this)
      })
    }
  }

  
  class JSONNode extends BaseNode {
    constructor(container, id, x = 0, y = 0, obj = undefined) {
      super(container, id, x, y)
      this.typeString = "JSONNode"
      this.label = "JSON"
      this.title = "JSON"
      this.fixed = true
      this.color = "green"
      this.shape = "ellipse"
      if (obj !== undefined) {
        this.obj = obj
      }
    }
    run = () => {}
    showOptions = (optionsDivId = "optionsDiv") => {

      let defaultSchema = {
        "title": "Node Options",
        "description": "Node Options",
        "type": "object",
        // "format":"table",
        "properties": {
          "id": {
            "title": "ID",
            "description": "The Id of the node",
            "examples": [
              "18a96389-de88-492f-95d5-af74f467f424"
            ],
            "type": "string"
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
            "examples": ["blue","#ffffff"],
            "type": "string"
          },
          "shape": {
            "title": "shape",
            "type": "string",
            "enum": ["ellipse","circle","database","box","text","image", "circularImage", "diamond", "dot", "star", "triangle", "triangleDown", "hexagon", "square","icon"]
          }
        }
      }
            


      let editor = new JSONEditor_.JSONEditor(document.getElementById(optionsDivId),{
        schema: defaultSchema,
        startval: this.obj,
        iconlib: 'fontawesome5',
        show_errors: 'interaction',
        theme: 'bootstrap4',
        object_layout: "grid"
        },
      );

    }
  }
  

  
  class JSONNode1 extends BaseNode {
    constructor(container, id, x = 0, y = 0, jsondata = undefined) {
      super(container, id, x, y)
      this.typeString = "JSONNode1"
      this.label = "JSON"
      this.title = "JSON"
      this.fixed = true
      this.color = "green"
      this.shape = "ellipse"
      if (jsondata !== undefined) {
        this.jsondata = jsondata
      }
    }
    run = () => {}
    showOptions = (optionsDivId = "optionsDiv") => {
      
      document.getElementById(optionsDivId).innerHTML="<button id='setButton'>set!</button><br><div id='editor_div'></div>"
      let setButton = document.getElementById("setButton")
      

      // search for JsonSchema via HasType Arrow
      let schema = undefined
      let schema_cache = undefined
      this.container.edges.forEach((edge)=>{
        
        if (this.id==edge.from){
          if (edge.label=="HasType"){
            let schema_node = this.container.nodes.get(edge.to)
            schema = schema_node.schema
            console.log(schema)
            schema_cache = schema_node.schema_cache
            console.log(schema_cache)
          }
        }
    })

    // create editor with schema (if available)
    let options = {
      schema: schema,
      schemaRefs: schema_cache,
      mode: 'tree',
      modes: ['code', 'tree'], // ['code', 'form', 'text', 'tree', 'view', 'preview']
      autocomplete: {
        applyTo:['value'],
        filter: 'contain',
        trigger: 'focus',
        getOptions: function (text, path, input, editor) {
          return new Promise(function (resolve, reject) {
            const options = extractUniqueWords(editor.get())
            if (options.length > 0) {
              resolve(options)
            } else {
              reject()
            }
          })
        }
      }
    }


      let editor = new JSONEditor(editor_div,options)
      // make object of own properties
      editor.set(this.jsondata)
      console.log(editor)
      editor.onChange = (param)=>{
        console.log(param)
      }
      setButton.addEventListener('click', ()=>{
        this.jsondata=editor.get()
        console.log("editor:",editor,editor.navBar.textContent.split('►'),editor.navBar.textContent.split('j'))
      })
      this.appendJsonToOptions(optionsDivId)
    }
  }

  
  class JSONSchemaNode extends BaseNode {
    constructor(container, id, x = 0, y = 0, obj = undefined, schema = undefined) {
      super(container, id, x, y)
      this.typeString = "JSONSchemaNode"
      this.label = "JSONSchema"
      this.title = "JSONSchema"
      this.fixed = true
      this.color = "lightblue"
      this.shape = "ellipse"
      this.schema_cache = {}
      if (obj !== undefined) {
        this.obj = obj
      }
      console.log(schema)
      if (schema !== undefined) {
        this.schema = schema
      }
    }

    

    showOptions = (optionsDivId = "optionsDiv") => {
      
      document.getElementById(optionsDivId).innerHTML="<div id='schemaDiv'></div><br>"
      let schemaDiv = document.getElementById("schemaDiv")

      let setSchemaButton = document.createElement('button')
      setSchemaButton.innerHTML="Set schema"
      schemaDiv.appendChild(setSchemaButton)

      let resolveReferencesButton = document.createElement('button')
      resolveReferencesButton.innerHTML="resolve References"
      schemaDiv.appendChild(resolveReferencesButton)

      schemaDiv.style = "overflow-y: scroll;height: 400px;position: relative;bottom: 0"
      let schemaEditorDiv = document.createElement('div')
      schemaEditorDiv.style = "height: 350px"
      schemaDiv.appendChild(schemaEditorDiv)
      let createInstanceButton = document.createElement('button')
      createInstanceButton.innerHTML="CreateInstance"
      schemaDiv.appendChild(createInstanceButton)

      let createChildButton = document.createElement('button')
      createChildButton.innerHTML="CreateChild"
      schemaDiv.appendChild(createChildButton)


      let meta_schema={
        //"$schema": "http://json-schema.org/draft-07/schema#",
        //"$id": "http://json-schema.org/draft-07/schema#",
        "title": "Core schema meta-schema",
        "definitions": {
            "schemaArray": {
                "type": "array",
                "minItems": 1,
                "items": { "$ref": "meta_schema" }      //"items": { "$ref": "#" } 
            },
            "nonNegativeInteger": {
                "type": "integer",
                "minimum": 0
            },
            "nonNegativeIntegerDefault0": {
                "allOf": [
                    { "$ref": "#/definitions/nonNegativeInteger" },
                    { "default": 0 }
                ]
            },
            "simpleTypes": {
                "enum": [
                    "array",
                    "boolean",
                    "integer",
                    "null",
                    "number",
                    "object",
                    "string"
                ]
            },
            "stringArray": {
                "type": "array",
                "items": { "type": "string" },
                "uniqueItems": true,
                "default": []
            }
        },
        "type": ["object", "boolean"],
        "properties": {
            "$id": {
                "type": "string",
                "format": "uri-reference"
            },
            "$schema": {
                "type": "string",
                "format": "uri"
            },
            "$ref": {
                "type": "string",
                "format": "uri-reference"
            },
            "$comment": {
                "type": "string"
            },
            "title": {
                "type": "string"
            },
            "description": {
                "type": "string"
            },
            "default": true,
            "readOnly": {
                "type": "boolean",
                "default": false
            },
            "examples": {
                "type": "array",
                "items": true
            },
            "multipleOf": {
                "type": "number",
                "exclusiveMinimum": 0
            },
            "maximum": {
                "type": "number"
            },
            "exclusiveMaximum": {
                "type": "number"
            },
            "minimum": {
                "type": "number"
            },
            "exclusiveMinimum": {
                "type": "number"
            },
            // append by Matthias 
            /*
            "enum":[
              "title",
              "description",
              "default",
              "examples",
              "readOnly",
              "multipleOf",
              "maximum",
              "exclusiveMaximum",
              "minimum",
              "exclusiveMinimum",
              "$id",
              "$schema",
              "$ref",
              "$comment",
            ],*/

            "maxLength": { "$ref": "#/definitions/nonNegativeInteger" },
            "minLength": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
            "pattern": {
                "type": "string",
                "format": "regex"
            },
            "additionalItems": { "$ref": "meta_schema" },
            "items": {
                "anyOf": [
                    { "$ref": "meta_schema" },
                    { "$ref": "#/definitions/schemaArray" }
                ],
                "default": true
            },
            "maxItems": { "$ref": "#/definitions/nonNegativeInteger" },
            "minItems": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
            "uniqueItems": {
                "type": "boolean",
                "default": false
            },
            "contains": { "$ref": "meta_schema" },
            "maxProperties": { "$ref": "#/definitions/nonNegativeInteger" },
            "minProperties": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
            "required": { "$ref": "#/definitions/stringArray" },
            "additionalProperties": { "$ref": "meta_schema" },
            "definitions": {
                "type": "object",
                "additionalProperties": { "$ref": "meta_schema" },
                "default": {}
            },
            "properties": {
                "type": "object",
                "additionalProperties": { "$ref": "meta_schema" },
                "default": {}
            },
            "patternProperties": {
                "type": "object",
                "additionalProperties": { "$ref": "meta_schema" },
                "propertyNames": { "format": "regex" },
                "default": {}
            },
            "dependencies": {
                "type": "object",
                "additionalProperties": {
                    "anyOf": [
                        { "$ref": "meta_schema" },
                        { "$ref": "#/definitions/stringArray" }
                    ]
                }
            },
            "propertyNames": { "$ref": "meta_schema" },
            "const": true,
            "enum": {
                "type": "array",
                "items": true,
                "minItems": 1,
                "uniqueItems": true
            },
            "type": {
                "anyOf": [
                    { "$ref": "#/definitions/simpleTypes" },
                    {
                        "type": "array",
                        "items": { "$ref": "#/definitions/simpleTypes" },
                        "minItems": 1,
                        "uniqueItems": true,
                       /* "enum": [
                          "array",
                          "boolean",
                          "integer",
                          "null",
                          "number",
                          "object",
                          "string"
                      ]*/
                    }
                ]
            },
            "format": { "type": "string" },
            "contentMediaType": { "type": "string" },
            "contentEncoding": { "type": "string" },
            "if": {"$ref": "meta_schema"},
            "then": {"$ref": "meta_schema"},
            "else": {"$ref": "meta_schema"},
            "allOf": { "$ref": "#/definitions/schemaArray" },
            "anyOf": { "$ref": "#/definitions/schemaArray" },
            "oneOf": { "$ref": "#/definitions/schemaArray" },
            "not": { "$ref": "meta_schema" }
        },
        "default": true
    }
      let options = {
        schema: meta_schema,
        schemaRefs: {"meta_schema": meta_schema,
          "#/definitions/nonNegativeInteger": meta_schema.definitions.nonNegativeInteger,
          "#/definitions/schemaArray": meta_schema.definitions.schemaArray,
          "#/definitions/nonNegativeInteger": meta_schema.definitions.nonNegativeInteger,
          "#/definitions/onNegativeIntegerDefault0": meta_schema.definitions.onNegativeIntegerDefault0,
          "#/definitions/simpleTypes": meta_schema.definitions.simpleTypes,
          "#/definitions/stringArray": meta_schema.definitions.stringArray,
        },
        mode: 'tree',
        modes: ['code', 'tree'], // ['code', 'form', 'text', 'tree', 'view', 'preview']
        autocomplete: {
          applyTo:['value'],
          filter: 'contain',
          trigger: 'focus',
          getOptions: function (text, path, input, editor) {
            return new Promise(function (resolve, reject) {
              const options = extractUniqueWords(editor.get())
              if (options.length > 0) {
                resolve(options)
              } else {
                reject()
              }
            })
          }
        }
      }
    
      // helper function to extract all unique words in the keys and values of a JSON object
      function extractUniqueWords (json) {
        console.log("extractUniqueWords",_.uniq(_.flatMapDeep(json, function (value, key) {
          return _.isObject(value)
                  ? [key]
                  : [key, String(value)]
        })))
        return _.uniq(_.flatMapDeep(json, function (value, key) {
          return _.isObject(value)
                  ? [key]
                  : [key, String(value)]
        }))
      }

      let schemaEditor = new JSONEditor(schemaEditorDiv,options)
      if (this.schema!==undefined){
        console.log(this.schema)

        let editor_content = {}
        editor_content = utils.mergeDeep (editor_content, this.schema)
        schemaEditor.set(editor_content)
        console.log(this.schema)
      }
      setSchemaButton.addEventListener('click', ()=>{        
        this.schema = schemaEditor.get()

        this.container.nodes.update(this)
      })

      resolveReferencesButton.addEventListener("click",()=>{
        /// resolve all $ref referneces and save into this.schema_cache
        this.schema_copy = this.resolveRefRecursive(this.schema)
      })
      
    
    createInstanceButton.addEventListener('click',() =>{
      /// a function to create an example instance from the current schema
      this.createInstance()
      
  })

    createChildButton.addEventListener('click',() =>{
   
    let schema = {"allOf": [
      { "$ref": this.id.toString() },
  ]}
    let newNode = new JSONSchemaNode(this.container,"OSW"+utils.uuidv4(), this.x+100, this.y-100,{},schema)
    this.container.nodes.update(newNode)

    //Add HasType edge
    this.container.edges.update({from: newNode.id,to: this.id,label: "allOf",title:"allOf"})
    })

    this.appendJsonToOptions(optionsDivId)
    }
    resolveRefRecursive = (schema)=>{
      schema = JSON.parse(JSON.stringify(schema))
      for (let key in schema){
        console.log(key)
        {
          if (typeof schema[key] == "object" && schema[key] !== null)
          this.resolveRefRecursive(schema[key]);
          else{
              if (typeof schema[key] == "array" && schema[key] !== []){
                
                console.log("do something wiht arrays")
              }
              if (key="$ref"){
                let ref  = this.container.nodes.get(schema[key])
                if(ref!==null && schema[key]!==undefined){
                  console.log("Write reference schema to this.schema_cache",schema[key])
                  this.schema_cache[schema[key]]=ref.schema
                  this.resolveRefRecursive(ref.schema)
                }
                else{
                  console.log("reference is null cannot replace",schema[key])
                }
                

              }
            }
      }
      } 
    this.container.nodes.update(this)     
    }
    createInstance = () =>{
      this.resolveRefRecursive(this.schema)
      let schema_copy = structuredClone(this.schema)//JSON.parse(JSON.stringify(this.schema))
      console.log("this.schema",this.schema)
      console.log("schema_copy",schema_copy)
      console.log("json.stringify(schema_copy)",JSON.stringify(schema_copy))
      console.log("schema_copy:",schema_copy)
      let data = defaults.defaults(schema_copy,this.schema_cache)
      console.log("data of new node:", data)
      let newNode = new JSONNode1(this.container,"OSW"+utils.uuidv4(), this.x+100, this.y-100,{data})
      this.container.nodes.update(newNode)
      //Add HasType edge
      this.container.edges.update({from: newNode.id,to: this.id,label: "HasType",title:"HasType"})
     
    }
  }

  class CsvNode extends BaseNode {
    constructor(container, id, x = 0, y = 0, csvFile = undefined) {
      super(container, id, x, y)
      this.typeString = "CsvNode"
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
        this.columns = this.CSVToJSONTable(this.csvText, "\t")
      }
    }
    
    showOptions = (optionsDivId = "optionsDiv") => {
      let optionsDiv = document.getElementById(optionsDivId)
      optionsDiv.innerHTML = `
  <table style="width:100%"><tr><th>x axis</th><th>y axis</th></tr><tr><th><select id="xSelect"name = "x"></select></th><th><select id="ySelect"name = "y"></select></th></tr></table>  <div id="plotDiv" width="320" height="240"></canvas>    <button id="usePlotAsThumbnail">Use Plot as Icon</button></div>`
      let plot_div = document.querySelector("#plotDiv")
      let usePlotAsThumbnailButton = document.querySelector("#usePlotAsThumbnail")
      //initialize dropdowns
      let xSelect = document.getElementById("xSelect")
      let ySelect = document.getElementById("ySelect")
      Object.keys(this.columns).forEach((key) => {
        let axis_option_x = document.createElement("option");
        axis_option_x.textContent = key;
        axis_option_x.value = key;
        xSelect.appendChild(axis_option_x);

        let axis_option_y = document.createElement("option");
        axis_option_y.textContent = key;
        axis_option_y.value = key;
        ySelect.appendChild(axis_option_y);
      })

      // initialize column selection if not present so far
      if (this.visualization_definition == undefined) {
        this.visualization_definition = {
          x: Object.keys(this.columns)[0],
          y: Object.keys(this.columns)[1]
        }
      }
      // set column selection 
      xSelect.value = this.visualization_definition.x;
      ySelect.value = this.visualization_definition.y;

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
        this.visualization_definition.x = xSelect.value
        plotData()
      })
      ySelect.addEventListener('change', () => {
        this.visualization_definition.y = ySelect.value
        plotData()
      })
      usePlotAsThumbnailButton.addEventListener('click', () => {
        Plotly.toImage(plot_div, {
          format: 'png',
          width: 800,
          height: 600
        }).then((dataUrl) => {
          this.container.nodes.update({
            id: this.id,
            image: dataUrl,
            shape: "image"
          })
        })
      })
      this.appendJsonToOptions(optionsDivId = optionsDivId)
    }
    


    

    
/// utility function to convert CSV files to JSONTable (incomplete, TODO!)
    CSVToJSONTable (data, delimiter = ','){
    const titles = data.slice(0, data.indexOf('\n')).split(delimiter);
    let rows = data.slice(data.indexOf('\n') + 1)
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
        let values = rows[i].split(delimiter)
        for (let j = 0; j < titles.length; j++) {
          columns[titles[j]].push(Number(values[j]))
        }
      }
    }
    return columns
  }
  }

export {
    CameraNode,
    VideoNode,
    DrawNode,
    RocketBase,
    Fountain,
    DelayNode,
    TextSpeechNode,
    ImageNode,
    CsvNode,
    BaseNode,
    JSONNode,
    JSONNode1,
    JSONSchemaNode,
}