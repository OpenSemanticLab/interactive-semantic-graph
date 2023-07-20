const JSONEditors = require('jsoneditor/dist/jsoneditor') // this is the multi-mode editor https://github.com/josdejong/jsoneditor

function showOptions_default (node, optionsDivId = 'optionsDiv') {
  document.getElementById(optionsDivId).innerHTML = "<button id='" + this.prefix + "setButton'>set!</button><br><div id='" + this.prefix + "visual_options_editor_div'></div><div id='" + this.prefix + "data_editor_div'></div>"
  const setButton = document.getElementById(this.prefix + 'setButton')
  const schema = {
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
                }, */
  }
  const options = {
    schema,
    // schemaRefs: {"job": job},
    mode: 'tree',
    modes: ['code', 'tree'] // ['code', 'form', 'text', 'tree', 'view', 'preview']}
  }
  const visual_options_editor_div = document.getElementById(this.prefix + 'visual_options_editor_div')
  const visual_options_editor = new JSONEditors(visual_options_editor_div, options)
  // make object of own properties

  visual_options_editor.set(node)
  visual_options_editor.onChange = (param) => {

  }
  setButton.addEventListener('click', () => {
    node = visual_options_editor.get()
    this.nodes.update(node)
  })
  const data_editor_div = document.getElementById(this.prefix + 'data_editor_div')
  const data_editor = new JSONEditors(data_editor_div, options)

  data_editor.set(this.drawer.getValueFromPathArray(node.path))
}

function showSelectionOptions () {
  const sel_nodes = this.network.getSelectedNodes()
  if (sel_nodes.length == 0) {
    // remove options
    if (!this.pressed_keys.includes('q')) {
      this.options_container.innerHTML = ''
    }
  } else if (sel_nodes.length == 1) {
    // show options of single node

    const node = this.nodes.get(sel_nodes[0])
    if (typeof node.showOptions === 'function') {
      const optionsId = this.options_container.id
      node.showOptions(optionsId)
    } else {
      this.showOptions_default(node, this.options_container.id)
    }
  } else {
    // show common properties
    /**/

    if (true) {
      // make options gui

      this.options_container.innerHTML = '<h3>comparison between nodes</h3>'
      const comparison_container = document.createElement('div')
      comparison_container.setAttribute('id', this.prefix + 'comparison_container')
      this.options_container.append(comparison_container)
      this.options_container.append(document.createElement('H2').appendChild(document.createTextNode('common types')))

      const setForAllContainer = document.createElement('div')
      setForAllContainer.setAttribute('id', this.prefix + 'setForAllContainer')
      this.options_container.append(setForAllContainer)

      // create table_data for comparison

      const table_data = []
      for (const node_id of sel_nodes) {
        const node = this.nodes.get(node_id)
        table_data.push({
          id: node_id,
          color: JSON.stringify(node.color),
          x: node.x,
          y: node.y,
          typeString: node.typeString,
          fixed: node.fixed
        })
      }

      const fixedEdit = (cell) => {
        const node = this.nodes.get(cell._cell.row.data.id)
        const id = cell._cell.row.data.id
        node.fixed = Boolean(cell._cell.value)

        this.nodes.update(node)
      }

      const xEdit = (cell) => {
        const node = this.nodes.get(cell._cell.row.data.id)

        const id = cell._cell.row.data.id
        const x = cell._cell.value
        const y = node.y

        this.network.moveNode(id, x, y)
        this.nodes.update({
          id,
          x
        })
      }

      const yEdit = (cell) => {
        const node = this.nodes.get(cell._cell.row.data.id)

        const id = cell._cell.row.data.id
        const x = node.x
        const y = cell._cell.value

        this.network.moveNode(id, x, y)
        this.nodes.update({
          id,
          y
        })
      }

      const colorEdit = (cell) => {
        const node = this.nodes.get(cell._cell.row.data.id)

        const id = cell._cell.row.data.id

        node.color = JSON.parse(cell._cell.value)

        this.nodes.update(node)
      }

      const tabul = new Tabulator('#' + comparison_container.id, {
        data: table_data,
        columns: [{
          title: 'id',
          field: 'id',
          editor: 'input'
        },
        {
          title: 'typeString',
          field: 'typeString'
        },
        {
          title: 'x',
          field: 'x',
          editor: 'input',
          cellEdited: xEdit
        },
        {
          title: 'y',
          field: 'y',
          editor: 'input',
          cellEdited: yEdit
        },
        {
          title: 'fixed',
          field: 'fixed',
          editor: true,
          formatter: 'tickCross',
          cellEdited: fixedEdit
        },
        {
          title: 'color',
          field: 'color',
          editor: 'input',
          cellEdited: colorEdit
        }
        ]
      })

      const allXEdit = (cell) => {
        for (const node_id of this.network.getSelectedNodes()) {
          const node = this.nodes.get(node_id)
          const id = node_id
          const x = cell._cell.value
          const y = node.x
          this.network.moveNode(id, x, y)
          this.nodes.update({
            id,
            y
          })
        }
      }
      const allYEdit = (cell) => {
        for (const node_id of this.network.getSelectedNodes()) {
          const node = this.nodes.get(node_id)
          const id = node_id
          const x = node.x
          const y = cell._cell.value

          this.network.moveNode(id, x, y)
          this.nodes.update({
            id,
            y
          })
        }
      }
      const allColorEdit = (cell) => {
        for (const node_id of this.network.getSelectedNodes()) {
          const node = this.nodes.get(node_id)
          node.color = JSON.parse(cell._cell.value)
          this.nodes.update(node)
        }
      }

      const allFixedEdit = (cell) => {
        for (const node_id of this.network.getSelectedNodes()) {
          const node = this.nodes.get(node_id)
          node.fixed = Boolean(cell._cell.value)

          this.nodes.update(node)
        }
      }

      const setForAllTable = new Tabulator('#' + setForAllContainer.id, {
        data: [table_data[0]],
        columns: [{
          title: 'id',
          field: 'id',
          editor: 'input'
        },
        {
          title: 'typeString',
          field: 'typeString'
        },
        {
          title: 'x',
          field: 'x',
          editor: 'input',
          cellEdited: allXEdit
        },
        {
          title: 'y',
          field: 'y',
          editor: 'input',
          cellEdited: allYEdit
        },
        {
          title: 'fixed',
          field: 'fixed',
          editor: true,
          formatter: 'tickCross',
          cellEdited: allFixedEdit
        },
        {
          title: 'color',
          field: 'color',
          editor: 'input',
          cellEdited: allColorEdit
        }
        ]
      })
    } else {
      let content = '<h3>Node IDs</h3><br>'
      for (const node_id of sel_nodes) {
        content += '<br>' + node_id
      }
      this.options_container.innerHTML = content
    }
  }
}

export {

  showOptions_default,
  showSelectionOptions

}
