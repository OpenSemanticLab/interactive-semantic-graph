
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


class CameraNode {
    constructor(id, x = 0, y = 0) {
      this.typeString = "CameraNode"
      //console.log('constructor of CameraNode', id, x, y)
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
      //console.log("this in cameraNode Show Options ", this.constructor, this)
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
        //console.log("use button clicked")
        //console.log(canvas.toDataURL('image/jpeg'))
        this.image = canvas.toDataURL('image/jpeg')
        this.shape = "image"
        //console.log("update nodes in EventListener",this.constructor,this)
        nodes.update(this)
      })
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
      //console.log("fire", this)
      let position = network.getPosition(this.id)
      this.shot(position.x, position.y - 10, nodes.get(this.id).color.background)
      //console.log(this)
    }
    shot = (x, y, color) => {
      this.constructor.shot_recorder.play()
      let new_id = uuidv4()
      //console.log('bin in release_shot')
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
        //console.log(nodes.get(new_id))
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
          //console.log("Timeout")
          //console.log(added_nodes_ids)
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
            //console.log("Timeout")
            //console.log(added_nodes_ids)
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
  class DelayNode {
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
        //console.log(conn_edges)
        conn_edges.forEach((edge_id) => {
          let edge = this.edges.get(edge_id)
          if (edge.from == this.id) {
            let neighbor_node = nodes.get(edge.to)
            //console.log(neighbor_node)
            if (neighbor_node.fire) {
              window.setTimeout(() => {
                neighbor_node.fire()
              }, this.delay_ms)
            } else {
              window.setTimeout(() => {
                //console.log("no fire, recurse in " + neighbor_node)
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
        //console.log("input changed")
        this.delay_ms = document.getElementById("delay_input").value
      })
      //console.log("show Options of ", this)
      document.getElementById("break_input").addEventListener('click', () => {
        //console.log("break_input changed", document.getElementById("break_input").checked)
        this.break = document.getElementById("break_input").checked
      })
      document.getElementById("objectJson").innerHTML = JSON.stringify(this, null,
        4)
    }
  }
  class TextSpeechNode {
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
          //console.log(this)
          let conn_edges = network.getConnectedEdges(this.id)
          //console.log(conn_edges)
          conn_edges.forEach((edge_id) => {
            let edge = this.edges.get(edge_id)
            if (edge.from == this.id) {
              let neighbor_node = nodes.get(edge.to)
              //console.log(neighbor_node)
              if (neighbor_node.fire) {
                window.setTimeout(() => {
                  neighbor_node.fire()
                }, this.delay_ms)
              } else {
                window.setTimeout(() => {
                  //console.log("no fire, recurse in " + neighbor_node)
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
      //console.log('Add event Listener')
      document.getElementById("textSpeechNode_input").addEventListener('change', () => {
        //console.log("input changed")
        this.text = document.getElementById("textSpeechNode_input").value
      })
      document.getElementById("objectJson").innerHTML = JSON.stringify(this, null, 4)
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
      //console.log(this)
      if (this.hasOwnProperty("image")) {
        //console.log('Hasown')
        let img = new Image;
        img.src = this.image
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      use_button.addEventListener('click', () => {
        //console.log("use button clicked")
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
        //console.log(key)
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
        //console.log('x change')
        this.visualization_definition.x = xSelect.value
        plotData()
      })
      ySelect.addEventListener('change', () => {
        //console.log('y change')
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

export {
    CameraNode,
    RocketBase,
    Fountain,
    DelayNode,
    TextSpeechNode,
    ImageNode,
    CsvNode
}