const G = require('../Graph/Graph.js')

// loads or saves the graph to a .txt file
function loadSaveFunctionality (container) {
  // Todo: replace global ids with prefixed ids or class members to allow multiple instances on one page

  // create container element if not defined
  if (!container) container = document.createElement('div')

  const element = document.createElement('BUTTON')
  element.innerHTML = 'Save state'
  element.id = this.prefix + 'save'
  element.addEventListener('click', () => {
    this.createSaveStateFunctionality()
  })
  container.append(element)

  const element2 = document.createElement('BUTTON')
  element2.id = this.prefix + 'load'
  element2.innerHTML = 'Load state'
  element2.addEventListener('click', () => {
    this.createLoadStateFunctionality()
  })

  container.append(element2)
  return container
}

function createSaveStateFunctionality () {
  const coloringDiv = document.getElementById(this.prefix + 'myDropdown')

  const dropdown = coloringDiv.querySelector('select')

  if (dropdown.value == 'setColorByValue') {
    this.configFile.coloring_function_object.function_name = 'colorByValue'

    const inputField = document.getElementById(this.prefix + 'setColorByValueInput')
    this.configFile.coloring_function_object.path = inputField.value

    const startColor = document.getElementById(this.prefix + 'startColor')
    this.configFile.coloring_function_object.start_color = startColor.value

    const endColor = document.getElementById(this.prefix + 'endColor')
    this.configFile.coloring_function_object.end_color = endColor.value
  } else if (dropdown.value == 'setColorByProperty') {
    this.configFile.coloring_function_object.function_name = 'colorByProperty'

    this.configFile.coloring_function_object.path = ''

    this.configFile.coloring_function_object.start_color = ''

    this.configFile.coloring_function_object.end_color = ''
  }

  const deepSearchDropdown = document.getElementById(this.prefix + 'search_select')

  if (deepSearchDropdown.value == 'search_node') {
    this.configFile.dataset_search_function_object.search_on = 'nodes'
    this.configFile.visual_search_function_object.search_on = 'nodes'
  } else if (deepSearchDropdown.value == 'search_edge') {
    this.configFile.dataset_search_function_object.search_on = 'edges'
    this.configFile.visual_search_function_object.search_on = 'edges'
  }

  const inputField = document.getElementById(this.prefix + 'input-field')

  this.configFile.dataset_search_function_object.search_string = inputField.value

  const inputFieldVisual = document.getElementById(this.prefix + 'search_input')
  this.configFile.visual_search_function_object.search_string = inputFieldVisual.value

  const checkBox = document.getElementById(this.prefix + 'myCheckbox')

  this.configFile.dataset_search_function_object.keep_expanded = checkBox.checked

  const openPaths = []
  for (let i = 0; i < this.nodes.get().length; i++) {
    if (this.isNodeLastInPath(this.nodes.get()[i].id)) {
      const paths = this.findAllPaths('jsondata/' + this.configFile.root_node_objects[0].node_id, this.nodes.get()[i].id)

      for (let j = 0; j < paths.length; j++) {
        openPaths.push(paths[j])
      }
    }
  }

  this.configFile.expanded_paths = openPaths

  this.configFile.visual_nodes_edges_object.nodes = this.nodes.get()
  this.configFile.visual_nodes_edges_object.edges = this.edges.get()

  this.configFile.initial_dataset = this.drawer.file

  const files = { file: this.drawer.file, config: this.configFile }

  const json = files
  const filename = 'data.txt'
  const text = JSON.stringify(json)

  const element = document.createElement('a')
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
  element.setAttribute('download', filename)
  element.style.display = 'none'
  document.body.appendChild(element)

  element.click()

  document.body.removeChild(element)
}

function createLoadStateFunctionality () {
  const input = document.createElement('input')
  input.type = 'file'

  const loadState = this.config.callbacks.loadState
  input.addEventListener('change', (ev) => {
    loadState(ev)
  }) //, ()=> this.config.callbacks.loadState(input) );
  input.click()
}

function loadStateDefault (input) {
  document.getElementById(this.graphContainerId).innerHTML = ''

  const reader = new FileReader()
  reader.onload = () => {
    const jsonData = JSON.parse(reader.result)

    const graph = new G.Graph(jsonData.file, jsonData.config)

    // document.getElementById("mynetwork").innerHTML = "";

    // document.getElementById('myDropdown').remove();
    // document.getElementById('save').remove();
    // document.getElementById('load').remove();
    // document.getElementById('search_input').remove();
    // document.getElementById('search_select').remove();

    // if (document.getElementById('setPath')) {
    //   document.getElementById('setPath').remove();
    // }
  }
  reader.readAsText(input.target.files[0])
}

export {

  loadSaveFunctionality,
  createSaveStateFunctionality,
  createLoadStateFunctionality,
  loadStateDefault

}
