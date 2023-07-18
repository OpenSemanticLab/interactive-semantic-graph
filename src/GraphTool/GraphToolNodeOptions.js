const JSONEditors = require("jsoneditor/dist/jsoneditor") // this is the multi-mode editor https://github.com/josdejong/jsoneditor
    
    function showOptions_default(node, optionsDivId = 'optionsDiv') {
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

    function showSelectionOptions() {
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

export{

    showOptions_default,
    showSelectionOptions

}