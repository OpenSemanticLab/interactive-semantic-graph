/**
 *
 * @param {string} divId id of the div where the graph should be placed
 */
function initGraphContainers (divId) {
  if (this.handleCallbacks({ id: 'onBeforeInitGraphContainers', params: { graph: this, divId } })) {
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
    this.tool_container.style = 'display: flex; justify-content: start; padding: 16px 16px 8px 16px; margin: 24px 0; border-radius: 8px; background: rgb(0, 91, 127);'
    this.tool_container.setAttribute('class', 'navbar')
    this.container.append(this.tool_container)

    // Todo: the following should go to vue.js templates
    // Bootstrap class for open button
    const openContainer = document.createElement('fieldset')
    const openButton = document.createElement('button')
    openButton.setAttribute('type', 'button')
    openButton.setAttribute('class', 'btn btn-outline-light')
    openButton.style = 'margin: 0 8px 8px 0;'
    openButton.innerHTML = "<i class='fa-regular fa-xl fa-folder-open me-1'></i> Open"
    openContainer.append(openButton)
    this.tool_container.append(openContainer)
    this.loadFunctionality(openButton)

    // Bootstrap class for save button
    const saveContainer = document.createElement('fieldset')
    const saveButton = document.createElement('button')
    saveButton.setAttribute('type', 'button')
    saveButton.setAttribute('class', 'btn btn-outline-light')
    saveButton.style = 'margin: 0 8px 8px 8px;'
    saveButton.innerHTML = "<i class='fa-regular fa-xl fa-floppy-disk me-1'></i> Save"
    saveContainer.append(saveButton)
    this.tool_container.append(saveContainer)
    this.saveFunctionality(saveButton)

    // Bootstrap class for edit button
    const editContainer = document.createElement('fieldset')
    const editButton = document.createElement('button')
    const addNodeButton = document.createElement('button')
    const addEdgeButton = document.createElement('button')
    const deleteButton = document.createElement('button')

    deleteButton.setAttribute('type', 'button')
    deleteButton.setAttribute('class', 'btn btn-light')
    deleteButton.setAttribute('id', this.prefix + 'deleteButton')
    deleteButton.style = 'margin: 0 0 8px 8px; width: 90px;'
    deleteButton.innerHTML = "<i class='fa-regular fa-xl fa-pen-to-square me-1'></i> Delete"
    deleteButton.addEventListener('click', () => {
      // this.options.manipulation.enabled = !this.options.manipulation.enabled
      // this.options.manipulation.initiallyActive = !this.options.manipulation.initiallyActive
      // this.network.setOptions(this.options)
      if (this.nodes.get(this.network.getSelection().nodes[0]).group !== 'root') {
        if (this.network.getSelection().nodes.length > 0) {
          this.deleteInJson(this.network.getSelection(), 'node')
          this.options.manipulation.deleteNode(this.network.getSelection(), () => {})
        } else {
          this.deleteInJson(this.network.getSelection(), 'edge')
          this.options.manipulation.deleteEdge(this.network.getSelection(), () => {})
        }
      }

      // Deselect all nodes
      this.network.selectNodes([])

      // Deselect all edges
      this.network.selectEdges([])
    })

    addNodeButton.setAttribute('type', 'button')
    addNodeButton.setAttribute('class', 'btn btn-light')
    addNodeButton.setAttribute('id', this.prefix + 'addNodeButton')
    addNodeButton.style = 'margin: 0 0 8px 8px; width: 90px;'
    addNodeButton.innerHTML = "<i class='fa-regular fa-xl fa-pen-to-square me-1'></i> Add Node"
    addNodeButton.addEventListener('click', () => {
      this.options.manipulation.enabled = !this.options.manipulation.enabled
      this.options.manipulation.initiallyActive = !this.options.manipulation.initiallyActive
      this.network.setOptions(this.options)

      this.network.addNodeMode()

      for (let i = 0; i < document.getElementsByClassName('vis-button vis-back').length; i++) {
        document.getElementsByClassName('vis-button vis-back')[i].addEventListener('pointerdown', () => {
          this.options.manipulation.enabled = !this.options.manipulation.enabled
          this.options.manipulation.initiallyActive = !this.options.manipulation.initiallyActive
          this.network.setOptions(this.options)
        })
        document.getElementsByClassName('vis-button vis-back')[i].addEventListener('keyup', () => {
          this.options.manipulation.enabled = !this.options.manipulation.enabled
          this.options.manipulation.initiallyActive = !this.options.manipulation.initiallyActive
          this.network.setOptions(this.options)
        })
      }

      if (this.options.manipulation.enabled) {
        document.getElementById(this.prefix + 'vis_container').querySelector('.vis-close').style = 'display: none;'
      }
    })

    addEdgeButton.setAttribute('type', 'button')
    addEdgeButton.setAttribute('class', 'btn btn-light')
    addEdgeButton.setAttribute('id', this.prefix + 'addEdgeButton')
    addEdgeButton.style = 'margin: 0 0 8px 8px; width: 90px;'
    addEdgeButton.innerHTML = "<i class='fa-regular fa-xl fa-pen-to-square me-1'></i> Add Edge"
    addEdgeButton.addEventListener('click', () => {
      this.options.manipulation.enabled = !this.options.manipulation.enabled
      this.options.manipulation.initiallyActive = !this.options.manipulation.initiallyActive
      this.network.setOptions(this.options)

      this.network.addEdgeMode()

      for (let i = 0; i < document.getElementsByClassName('vis-button vis-back').length; i++) {
        document.getElementsByClassName('vis-button vis-back')[i].addEventListener('pointerdown', () => {
          this.options.manipulation.enabled = !this.options.manipulation.enabled
          this.options.manipulation.initiallyActive = !this.options.manipulation.initiallyActive
          this.network.setOptions(this.options)
        })
        document.getElementsByClassName('vis-button vis-back')[i].addEventListener('keyup', () => {
          this.options.manipulation.enabled = !this.options.manipulation.enabled
          this.options.manipulation.initiallyActive = !this.options.manipulation.initiallyActive
          this.network.setOptions(this.options)
        })
      }

      if (this.options.manipulation.enabled) {
        document.getElementById(this.prefix + 'vis_container').querySelector('.vis-close').style = 'display: none;'
      }
    })

    editButton.setAttribute('type', 'button')
    editButton.setAttribute('class', 'btn btn-light')
    editButton.setAttribute('id', this.prefix + 'editButton')
    editButton.style = 'margin: 0 0 8px 8px; width: 90px;'
    editButton.innerHTML = "<i class='fa-regular fa-xl fa-pen-to-square me-1'></i> Edit"

    let isEditMode = true
    editButton.addEventListener('click', () => {
      editButton.innerHTML = isEditMode ? "<i class='fa-regular fa-xl fa-circle-xmark'></i> Exit" : "<i class='fa-regular fa-xl fa-pen-to-square me-1'></i> Edit"
      this.network.enableEditMode()
      if (isEditMode) {
        editButton.insertAdjacentElement('afterend', deleteButton)
        editButton.insertAdjacentElement('afterend', addEdgeButton)
        editButton.insertAdjacentElement('afterend', addNodeButton)

        // this.tool_container.append(addNodeButton)
        // this.tool_container.append(addEdgeButton)
        // this.tool_container.append(deleteButton)
      } else {
        addNodeButton.remove()
        addEdgeButton.remove()
        deleteButton.remove()
      }
      isEditMode = !isEditMode
    })

    editContainer.append(editButton)
    this.tool_container.append(editButton)

    // visual filter
    const searchContainer = document.createElement('fieldset')
    searchContainer.style = 'padding: 0 8px; margin: 0 8px 8px 8px; border-left: 2px dotted lightgrey; border-right: 2px dotted lightgrey;'
    this.tool_container.append(searchContainer)
    this.createSearchUI(searchContainer)

    const deepSearchContainer = document.createElement('fieldset')
    deepSearchContainer.style = 'padding: 0 8px 0 0; margin: 0 8px 8px 0; border-right: 2px dotted lightgrey; '
    this.tool_container.append(deepSearchContainer)
    this.initDeepSearch(deepSearchContainer)

    const coloringContainer = document.createElement('fieldset')
    coloringContainer.style = 'margin-bottom: 8px;'
    this.tool_container.append(coloringContainer)
    this.colorPicker(this, coloringContainer)

    this.container.append(this.vis_container)
    this.container.append(this.options_container)
  }
}

// creates the color by value ui
/**
 *
 * @param {JSON} graph visjs graph object
 * @param {*} container DOM element where the color picker should be placed
 */
function colorPicker (graph, container) {
  const colorPickerArgs = { graph, container }
  if (this.handleCallbacks({ id: 'onBeforeColorPicker', params: { graph: this, colorPickerArgs } })) {
    // Create the dropdown menu
    // Todo: replace global ids with prefixed ids or class members to allow multiple instances on one page

    // create container if not specified
    if (!container) container = document.createElement('div')

    var graph /* eslint-disable-line no-redeclare */ = graph // eslint-disable-line no-var
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

      if (selectedValue === 'setColorByValue') {
        const input = document.createElement('input')
        input.type = 'text'
        input.placeholder = 'Set path'
        input.style = 'padding-left: 8px; margin: 0 4px 0 4px; border-radius: 4px;'
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
        select2.style = 'margin: 0 4px;'

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
        button.innerHTML = 'Apply'
        button.style = 'border-radius: 4px;'
        button.addEventListener('click', getPath)

        if (!document.getElementById(this.prefix + 'setColorByValueInput')) {
          document.getElementById(prefix + 'myDropdown').appendChild(input)
          document.getElementById(prefix + 'myDropdown').appendChild(select)
          document.getElementById(prefix + 'myDropdown').appendChild(select2)
          document.getElementById(prefix + 'myDropdown').appendChild(button)
        }
      }

      if (selectedValue === 'setColorByProperty') {
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
}

/**
 *
 * @param {*} container DOM element where the deep search should be placed
 */
function initDeepSearch (container) {
  // create container if not defined
  if (!container) container = document.createElement('div')

  const inputField = document.createElement('input')
  inputField.type = 'text'
  inputField.placeholder = 'Deep Search'
  inputField.id = this.prefix + 'input-field'
  inputField.style = 'padding-left: 8px; border-radius: 4px; margin-right: 4px;'

  const submitButton = document.createElement('button')
  submitButton.id = this.prefix + 'submit-button'
  submitButton.textContent = 'Submit'
  submitButton.style = 'border-radius: 4px; margin-right: 4px;'

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
