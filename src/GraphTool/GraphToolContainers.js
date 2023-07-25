function initGraphContainers (divId) {
  // create all necessary elements/divs and set them up
  this.container = document.getElementById(divId)
  this.vis_container = document.createElement('div')
  this.vis_container.setAttribute('id', this.prefix + 'vis_container')
  // this.vis_container.width = "70%"
  this.vis_container.style = 'width: 65%; height: 800px; border: 1px solid lightgray;  float:left;'
  this.options_container = document.createElement('div')
  this.options_container.setAttribute('id', this.prefix + 'options_container')
  this.options_container.setAttribute('style', 'overflow-y:scroll')
  // this.options_container.width = "30%"
  this.options_container.style = 'margin-left: 68%; width: 30%; height: 800px; border: 1px solid lightgray;'

  this.tool_container = document.createElement('div')
  this.tool_container.style = 'display:flex'
  this.container.append(this.tool_container)

  // Todo: the following should go to vue.js templates
  const ioContainer = document.createElement('fieldset')
  ioContainer.style = 'margin: 8px; border: 1px solid silver; padding: 8px; border-radius: 4px;'
  const ioLegend = document.createElement('legend')
  ioLegend.textContent = 'Load / Safe'
  ioLegend.style = 'padding: 2px; font-size: 1.0rem;'
  ioContainer.append(ioLegend)
  this.tool_container.append(ioContainer)
  this.loadSaveFunctionality(ioContainer)

  const searchContainer = document.createElement('fieldset')
  searchContainer.style = 'margin: 8px; border: 1px solid silver; padding: 8px; border-radius: 4px;'
  const searchLegend = document.createElement('legend')
  searchLegend.textContent = 'Search'
  searchLegend.style = 'padding: 2px; font-size: 1.0rem;'
  searchContainer.append(searchLegend)
  this.tool_container.append(searchContainer)
  this.createSearchUI(searchContainer)

  const deepsearchContainer = document.createElement('fieldset')
  deepsearchContainer.style = 'margin: 8px; border: 1px solid silver; padding: 8px; border-radius: 4px;'
  const deepsearchLegend = document.createElement('legend')
  deepsearchLegend.textContent = 'Deep Search'
  deepsearchLegend.style = 'padding: 2px; font-size: 1.0rem;'
  deepsearchContainer.append(deepsearchLegend)
  this.tool_container.append(deepsearchContainer)
  this.initDeepSearch(deepsearchContainer)

  const coloringContainer = document.createElement('fieldset')
  coloringContainer.style = 'margin: 8px; border: 1px solid silver; padding: 8px; border-radius: 4px;'
  const coloringLegend = document.createElement('legend')
  coloringLegend.textContent = 'Coloring'
  coloringLegend.style = 'padding: 2px; font-size: 1.0rem;'
  coloringContainer.append(coloringLegend)
  this.tool_container.append(coloringContainer)
  this.colorPicker(this, coloringContainer)

  this.container.append(this.vis_container)
  this.container.append(this.options_container)
}

// creates the color by value ui
function colorPicker (graph, container) {
  // Create the dropdown menu
  // Todo: replace global ids with prefixed ids or class members to allow multiple instances on one page

  // create container if not specified
  if (!container) container = document.createElement('div')

  var graph = graph
  const prefix = this.prefix
  const dropdownDiv = document.createElement('div')
  dropdownDiv.id = this.prefix + 'dropdown'
  dropdownDiv.setAttribute('id', this.prefix + 'myDropdown')

  const dropdown = document.createElement('select')

  const option1 = document.createElement('option')
  option1.setAttribute('value', 'setColorByProperty')
  option1.innerHTML = 'Color by Property'

  const option2 = document.createElement('option')
  option2.setAttribute('value', 'setColorByValue')
  option2.innerHTML = 'Color by Value'

  // var option3 = document.createElement("option");
  // option3.setAttribute("value", "option3");
  // option3.innerHTML = "Option 3";

  dropdown.appendChild(option1)
  dropdown.appendChild(option2)
  // dropdown.appendChild(option3);

  dropdownDiv.appendChild(dropdown)

  // Add the dropdown menu to the container
  container.appendChild(dropdownDiv)

  // Get the selected value
  function getPath () {
    const path = '' + document.querySelector('#' + prefix + 'setColorByValueInput').value

    const tempArray = path.split('.')

    const startColor = document.querySelector('#' + prefix + 'startColor').value
    const endColor = document.querySelector('#' + prefix + 'endColor').value

    graph.colorByValue(tempArray, graph.nodes.get(), graph.edges.get(), startColor, endColor)

    graph.nodes.update(graph.nodes.get())
    graph.edges.update(graph.edges.get())

    // graph.network.body.emitter.emit('_dataChanged');

    // graph.network.redraw();
  }

  // Add an event listener to get the selected value
  document.querySelector('#' + this.prefix + 'myDropdown select').addEventListener('change', function () {
    const selectedValue = this.value

    if (selectedValue == 'setColorByValue') {
      const input = document.createElement('input')
      input.type = 'text'
      input.id = prefix + 'setColorByValueInput'

      const usefulColors = ['orangered', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'gray']
      const usefulColors2 = ['limegreen', 'green', 'orange', 'yellow', 'red', 'blue', 'purple', 'pink', 'brown', 'gray']

      // Create the select element
      const select = document.createElement('select')

      // Add options to the select element
      for (let i = 0; i < usefulColors.length; i++) {
        const option = document.createElement('option')
        option.value = usefulColors[i]
        option.text = usefulColors[i]
        select.appendChild(option)
      }
      select.id = prefix + 'startColor'

      const select2 = document.createElement('select')

      // Add options to the select element
      for (let i = 0; i < usefulColors2.length; i++) {
        const option = document.createElement('option')
        option.value = usefulColors2[i]
        option.text = usefulColors2[i]
        select2.appendChild(option)
      }
      select2.id = prefix + 'endColor'

      // Add a button to get the selected value
      const button = document.createElement('button')
      button.id = prefix + 'setPath'
      button.innerHTML = 'Set path'
      button.addEventListener('click', getPath)

      if (!document.getElementById(this.prefix + 'setColorByValueInput')) {
        document.getElementById(prefix + 'myDropdown').appendChild(input)
        document.getElementById(prefix + 'myDropdown').appendChild(select)
        document.getElementById(prefix + 'myDropdown').appendChild(select2)
        document.getElementById(prefix + 'myDropdown').appendChild(button)
      }
    }

    if (selectedValue == 'setColorByProperty') {
      if (document.getElementById(prefix + 'setColorByValueInput')) {
        document.getElementById(prefix + 'setColorByValueInput').remove()
        document.getElementById(prefix + 'startColor').remove()
        document.getElementById(prefix + 'endColor').remove()
        document.getElementById(prefix + 'setPath').remove()
      }
      graph.recolorByProperty()
      graph.nodes.update(graph.nodes.get())
      graph.edges.update(graph.edges.get())
    }
    // alert("Selected value: " + selectedValue);
  })
}

function initDeepSearch (container) {
  // create container if not defined
  if (!container) container = document.createElement('div')

  const inputField = document.createElement('input')
  inputField.type = 'text'
  inputField.id = this.prefix + 'input-field'

  const submitButton = document.createElement('button')
  submitButton.id = this.prefix + 'submit-button'
  submitButton.textContent = 'Submit'

  container.appendChild(inputField)
  container.appendChild(submitButton)

  // this.deepSearch("");

  // Create the checkbox element
  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'

  // Optionally set additional properties for the checkbox
  checkbox.id = this.prefix + 'myCheckbox'
  container.appendChild(checkbox)

  submitButton.addEventListener('click', () => {
    this.searchExpands = []

    const inputValue = inputField.value

    const inputString = inputValue

    this.searchFunctionality(this.dataFile, inputString)
  })

  return container
}

export {
  initGraphContainers,
  colorPicker,
  initDeepSearch
}
