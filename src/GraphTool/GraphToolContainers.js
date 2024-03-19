function initGraphContainers (divId) {
  if (this.handleCallbacks({ id: 'onBeforeInitGraphContainers', params: { graph: this, divId } })) {
    // create all necessary elements/divs and set them up
    this.container = document.getElementById(divId)
    this.vis_container = document.createElement('div')
    this.vis_container.setAttribute('id', this.prefix + 'vis_container')
    // this.vis_container.width = "70%"
    this.vis_container.style = 'width: 70%; height: 800px; border: 1px solid lightgray;  float:left;'
    this.options_container = document.createElement('div')
    this.options_container.setAttribute('id', this.prefix + 'options_container')
    this.options_container.setAttribute('style', 'overflow-y:scroll; margin-left: 68%; width: 30%; height: 800px; border: 1px solid lightgray;')
    // this.options_container.width = "30%"
    // this.options_container.style = 'margin-left: 68%; width: 30%; height: 800px; border: 1px solid lightgray;'

    // ------------- Toggle button show / hide  tool_container
    const toolbarWrapper = document.createElement('div')
    toolbarWrapper.style.width = '60rem' // -------------------------------- for test purposes

    const self = this
    const toggleButton = document.createElement('button')
    toggleButton.setAttribute('type', 'button')
    toggleButton.setAttribute('class', 'btn btn-outline-secondary btn-sm')
    toggleButton.style = 'margin-bottom: 0.5rem'
    toggleButton.innerHTML = "<i class='fa-solid fa-lg fa-angle-down me-1'></i> Toolbar"
    toggleButton.addEventListener('click', function () {
      const isVisible = self.tool_container.style.display !== 'none'
      if (isVisible) {
        self.tool_container.style.display = 'none'
        this.querySelector('i').classList.replace('fa-angle-up', 'fa-angle-down')
      } else {
        self.tool_container.style.display = 'flex'
        self.tool_container.style.width = '100%' // -------------------------------- for test purposes
        self.tool_container.style.justifyContent = 'start'
        self.tool_container.style.alignItems = 'start'
        self.tool_container.style.gap = '0.75rem'
        self.tool_container.style.padding = '0.75rem 0.75rem 0.5rem 0.75rem'
        self.tool_container.style.marginBottom = '0.5rem'
        self.tool_container.style.borderRadius = '4px'
        self.tool_container.style.background = '#f1f3f4'
        this.querySelector('i').classList.replace('fa-angle-down', 'fa-angle-up')
      }
    })

    // this.container.append(toggleButton)
    toolbarWrapper.append(toggleButton)

    this.tool_container = document.createElement('div')
    this.tool_container.style = 'display: none;'
    this.tool_container.setAttribute('class', 'navbar')
    toolbarWrapper.append(this.tool_container)
    this.container.append(toolbarWrapper)
    // this.container.append(this.tool_container)

    // this.tool_container = document.createElement('div')
    // this.tool_container.style = 'display: flex; justify-content: start; align-items: center; row-gap: 0.5rem; padding: 1rem; margin: 1.5rem 0; background: rgb(220, 236, 251);'
    // this.tool_container.setAttribute('class', 'navbar')
    // this.container.append(this.tool_container)

    // Todo: the following should go to vue.js templates

    // ----------Bootstrap class for File-Dropdown
    const dropdownContainer = document.createElement('div')
    dropdownContainer.classList.add('dropdown')

    const dropdownButton = document.createElement('button')
    dropdownButton.setAttribute('type', 'button')
    dropdownButton.setAttribute('class', 'btn btn-outline-secondary btn-sm dropdown-toggle')
    dropdownButton.setAttribute('id', 'dropdownMenuButton')
    dropdownButton.setAttribute('data-bs-toggle', 'dropdown')
    dropdownButton.setAttribute('aria-expanded', 'false')
    dropdownButton.innerHTML = "<i class='fa-solid fa-lg fa-file me-1'></i> File"
    dropdownContainer.append(dropdownButton)

    const dropdownMenu = document.createElement('ul')
    dropdownMenu.classList.add('dropdown-menu')
    dropdownMenu.setAttribute('aria-labelledby', 'dropdownMenuButton')

    const openItem = document.createElement('li')
    const openButton = document.createElement('button')
    openButton.setAttribute('class', 'dropdown-item')
    openButton.setAttribute('type', 'button')
    openButton.innerHTML = 'Open'
    openItem.appendChild(openButton)
    dropdownMenu.appendChild(openItem)

    const saveItem = document.createElement('li')
    const saveButton = document.createElement('button')
    saveButton.setAttribute('class', 'dropdown-item')
    saveButton.setAttribute('type', 'button')
    saveButton.innerHTML = 'Save'
    saveItem.appendChild(saveButton)
    dropdownMenu.appendChild(saveItem)

    dropdownContainer.appendChild(dropdownMenu)

    this.tool_container.appendChild(dropdownContainer)

    this.loadFunctionality(openButton)
    this.saveFunctionality(saveButton)

    const editContainer = document.createElement('div')
    editContainer.classList.add('dropdown')

    // -------Bootstrap for Edit-Dropdown
    const editButton = document.createElement('button')
    editButton.setAttribute('type', 'button')
    editButton.setAttribute('class', 'btn btn-outline-secondary btn-sm dropdown-toggle')
    editButton.setAttribute('id', 'dropdownMenuButton')
    editButton.setAttribute('data-bs-toggle', 'dropdown')
    editButton.setAttribute('aria-expanded', 'false')
    editButton.setAttribute('id', this.prefix + 'editButton')
    editButton.innerHTML = "<i class='fa-solid fa-lg fa-pen-to-square me-1'></i> Edit"
    editContainer.append(editButton)

    const editDropdownMenu = document.createElement('ul')
    editDropdownMenu.classList.add('dropdown-menu')
    editDropdownMenu.setAttribute('aria-labelledby', 'dropdownMenuButton')

    const nodeItem = document.createElement('li')
    const nodeButton = document.createElement('button')
    nodeButton.setAttribute('class', 'dropdown-item')
    nodeButton.setAttribute('type', 'button')
    nodeButton.setAttribute('id', this.prefix + 'nodeButton')

    nodeButton.innerHTML = 'Add Node'
    nodeButton.addEventListener('click', () => {
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

    nodeItem.appendChild(nodeButton)
    editDropdownMenu.appendChild(nodeItem)

    const edgeItem = document.createElement('li')
    const edgeButton = document.createElement('button')
    edgeButton.setAttribute('class', 'dropdown-item')
    edgeButton.setAttribute('type', 'button')
    edgeButton.setAttribute('id', this.prefix + 'edgeButton')

    edgeButton.innerHTML = 'Add Edge'
    edgeButton.addEventListener('click', () => {
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

    edgeItem.appendChild(edgeButton)
    editDropdownMenu.appendChild(edgeItem)

    const deleteItem = document.createElement('li')
    const deleteButton = document.createElement('button')
    deleteButton.setAttribute('class', 'dropdown-item')
    deleteButton.setAttribute('type', 'button')
    deleteButton.setAttribute('id', this.prefix + 'deleteButton')
    deleteButton.style.color = 'red'
    deleteButton.innerHTML = 'Delete selected'
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

    deleteItem.appendChild(deleteButton)
    editDropdownMenu.appendChild(deleteItem)

    editContainer.appendChild(editDropdownMenu)

    this.tool_container.appendChild(editContainer)

    // Create Coloring Container
    const coloringContainer = document.createElement('div')
    this.tool_container.append(coloringContainer)
    this.colorPicker(this, coloringContainer)

    // --------------- Create Search Wrapper
    const searchWrapper = document.createElement('fieldset')
    searchWrapper.style = 'display: flex; flex-wrap: no-wrap; flex: 1; justify-content: end; gap: 1rem'

    const searchContainer = document.createElement('fieldset')
    this.createSearchUI(searchContainer)

    const backendButtonContainer = document.createElement('fieldset')
    backendButtonContainer.style = 'flex-shrink: 0; order: 3'

    const backendButton = document.createElement('button')
    backendButton.setAttribute('type', 'button')
    backendButton.setAttribute('class', 'btn btn-outline-secondary btn-sm')
    backendButton.innerHTML = "<i class='fa-solid fa-sm fa-magnifying-glass me-1'></i> Backend"
    backendButton.addEventListener('click', toggleSearchContainers)

    // ------------Toggle between search and deepsearch
    function toggleSearchContainers () {
      if (deepSearchContainer.style.display === 'none') {
        searchContainer.style.display = 'none'
        deepSearchContainer.style.display = 'inline-block'
        backendButton.innerHTML = "<i class='fa-solid fa-sm fa-magnifying-glass me-1'></i> Node/Edge"
      } else {
        searchContainer.style.display = 'inline-block'
        deepSearchContainer.style.display = 'none'
        backendButton.innerHTML = "<i class='fa-solid fa-sm fa-magnifying-glass me-1'></i> Backend"
      }
    }

    backendButtonContainer.append(backendButton)

    searchContainer.append(backendButtonContainer)

    const deepSearchContainer = document.createElement('fieldset')
    deepSearchContainer.style = 'display: none;'
    deepSearchContainer.addEventListener('click', function () {
      searchContainer.style.display = 'none'
    })
    // searchContainer.append(deepSearchContainer)
    // this.tool_container.append(deepSearchContainer)
    this.initDeepSearch(deepSearchContainer)

    searchWrapper.append(searchContainer)
    searchWrapper.append(backendButtonContainer)
    searchWrapper.append(deepSearchContainer)

    this.tool_container.append(searchWrapper)

    this.container.append(this.vis_container)
    this.container.append(this.options_container)
  }
}

// creates the color by value ui
function colorPicker (graph, container) {
  const colorPickerArgs = { graph, container }
  if (this.handleCallbacks({ id: 'onBeforeColorPicker', params: { graph: this, colorPickerArgs } })) {
    // Todo: replace global ids with prefixed ids or class members to allow multiple instances on one page

    // create container if not specified
    if (!container) container = document.createElement('div')

    var graph /* eslint-disable-line no-redeclare */ = graph // eslint-disable-line no-var
    const prefix = this.prefix
    const dropdownDiv = document.createElement('div')
    dropdownDiv.classList.add('dropdown')
    dropdownDiv.id = this.prefix + 'dropdown'
    dropdownDiv.setAttribute('id', this.prefix + 'myDropdown')

    const dropdown = document.createElement('button')
    dropdown.setAttribute('type', 'button')
    dropdown.setAttribute('class', 'btn btn-outline-secondary btn-sm mb-1 dropdown-toggle')
    dropdown.setAttribute('id', 'dropdownMenuButton')
    dropdown.setAttribute('data-bs-toggle', 'dropdown')
    dropdown.setAttribute('aria-expanded', 'false')
    dropdown.innerHTML = "<i class='fa-solid fa-lg fa-droplet me-1'></i> Coloring"
    dropdownDiv.append(dropdown)

    const colorDropdownMenu = document.createElement('ul')
    colorDropdownMenu.classList.add('dropdown-menu')
    colorDropdownMenu.setAttribute('aria-labelledby', 'dropdownMenuButton')

    const colorPropertyItem = document.createElement('li')
    const colorPropertyButton = document.createElement('button')
    colorPropertyButton.setAttribute('class', 'dropdown-item')
    colorPropertyButton.setAttribute('type', 'button')
    colorPropertyButton.innerHTML = 'By Property'
    colorPropertyButton.setAttribute('value', 'setColorByProperty')
    colorPropertyButton.addEventListener('click', function () {
      if (document.getElementById(prefix + 'setColorByValueInput')) {
        document.getElementById(prefix + 'setColorByValueInput').remove()
        document.getElementById(prefix + 'startColor').remove()
        document.getElementById(prefix + 'endColor').remove()
        document.getElementById(prefix + 'setPath').remove()
      }
      graph.recolorByProperty()
      graph.nodes.update(graph.nodes.get())
      graph.edges.update(graph.edges.get())
    })
    colorPropertyItem.appendChild(colorPropertyButton)
    colorDropdownMenu.appendChild(colorPropertyItem)

    const colorValueItem = document.createElement('li')
    const colorValueButton = document.createElement('button')
    colorValueButton.setAttribute('class', 'dropdown-item')
    colorValueButton.setAttribute('type', 'button')
    colorValueButton.innerHTML = 'By Value'
    colorValueButton.setAttribute('value', 'setColorByValue')
    colorValueButton.addEventListener('click', function () {
      const inputGroupDiv = document.createElement('div')
      inputGroupDiv.classList.add('input-group', 'input-group-sm')
      const input = document.createElement('input')
      input.setAttribute('type', 'text')
      input.classList.add('form-control')
      input.setAttribute('placeholder', 'e.g. HasBudget.value')
      input.setAttribute('aria-label', 'Color by Value')
      input.setAttribute('aria-describedby', 'basic-addon2')
      input.id = prefix + 'setColorByValueInput'

      const appendDiv = document.createElement('div')
      appendDiv.classList.add('input-group-append')

      const usefulColors = ['orangered', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'gray']
      const usefulColors2 = ['limegreen', 'green', 'orange', 'yellow', 'red', 'blue', 'purple', 'pink', 'brown', 'gray']

      const select = document.createElement('select')
      select.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'dropdown-toggle')
      select.setAttribute('data-toggle', 'dropdown')
      select.setAttribute('aria-haspopup', 'true')
      select.setAttribute('aria-expanded', 'false')
      select.style = 'border-top-right-radius: 0; border-bottom-right-radius: 0;'

      for (let i = 0; i < usefulColors.length; i++) {
        const option = document.createElement('option')
        option.value = usefulColors[i]
        option.text = usefulColors[i]
        select.appendChild(option)
      }
      select.id = prefix + 'startColor'

      const select2 = document.createElement('select')
      select2.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'dropdown-toggle')
      select2.setAttribute('data-toggle', 'dropdown')
      select2.setAttribute('aria-haspopup', 'true')
      select2.setAttribute('aria-expanded', 'false')
      select2.style = 'border-top-left-radius: 0; border-bottom-left-radius: 0; margin-right: 0.5rem'

      // Add options to the select element
      for (let i = 0; i < usefulColors2.length; i++) {
        const option = document.createElement('option')
        option.value = usefulColors2[i]
        option.text = usefulColors2[i]
        select2.appendChild(option)
      }
      select2.id = prefix + 'endColor'

      const button = document.createElement('button')
      button.setAttribute('class', 'btn btn-outline-primary btn-sm')
      button.id = prefix + 'setPath'
      button.innerHTML = 'Apply'
      button.addEventListener('click', getPath)

      if (!document.getElementById(this.prefix + 'setColorByValueInput')) {
        document.getElementById(prefix + 'myDropdown').appendChild(input)
        document.getElementById(prefix + 'myDropdown').appendChild(select)
        document.getElementById(prefix + 'myDropdown').appendChild(select2)
        document.getElementById(prefix + 'myDropdown').appendChild(button)
      }

      // inputGroupDiv.appendChild(dropdownDiv)
      inputGroupDiv.appendChild(input)
      appendDiv.appendChild(select)
      appendDiv.appendChild(select2)
      appendDiv.appendChild(button)
      inputGroupDiv.appendChild(appendDiv)

      container.appendChild(inputGroupDiv)
    })
    colorValueItem.appendChild(colorValueButton)
    colorDropdownMenu.appendChild(colorValueItem)

    // ---------------- Working Code ---------------------

    // const option1 = document.createElement('option')
    // option1.setAttribute('value', 'setColorByProperty')
    // option1.innerHTML = 'Color by Property'

    // const option2 = document.createElement('option')
    // option2.setAttribute('value', 'setColorByValue')
    // option2.innerHTML = 'Color by Value'

    // dropdown.appendChild(option1)
    // dropdown.appendChild(option2)

    // --------------------- End ---------------

    // Add the dropdown menu to the container
    dropdownDiv.appendChild(colorDropdownMenu)
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
  }
}

function initDeepSearch (container) {
  // create container if not defined
  if (!container) container = document.createElement('div')

  // ------------------Bootstrap input group
  const inputGroupDiv = document.createElement('div')
  inputGroupDiv.classList.add('input-group', 'input-group-sm')

  const inputField = document.createElement('input')
  inputField.setAttribute('type', 'text')
  inputField.classList.add('form-control')
  inputField.setAttribute('placeholder', 'Search Backend')
  inputField.setAttribute('aria-label', 'Deep Search')
  inputField.setAttribute('aria-describedby', 'basic-addon2')
  inputField.id = this.prefix + 'input-field'

  const appendDiv = document.createElement('div')
  appendDiv.classList.add('input-group-append')

  const submitButton = document.createElement('button')
  submitButton.setAttribute('type', 'button')
  submitButton.setAttribute('class', 'btn btn-outline-secondary btn-sm')
  submitButton.id = this.prefix + 'submit-button'
  submitButton.textContent = 'Submit'
  submitButton.style = 'margin-right: 4px'
  // submitButton.title = 'tbd'

  inputGroupDiv.appendChild(inputField)
  appendDiv.appendChild(submitButton)
  inputGroupDiv.appendChild(appendDiv)

  container.appendChild(inputGroupDiv)

  inputField.id = this.prefix + 'input-field'

  // ----------------Working Code

  // const inputField = document.createElement('input')
  // inputField.type = 'text'
  // inputField.placeholder = 'Deep Search'
  // inputField.id = this.prefix + 'input-field'
  // inputField.style = 'padding-left: 8px; border-radius: 4px; margin-right: 4px;'

  // const submitButton = document.createElement('button')
  // submitButton.setAttribute('type', 'button')
  // submitButton.setAttribute('class', 'btn btn-secondary btn-sm')
  // submitButton.id = this.prefix + 'submit-button'
  // submitButton.textContent = 'Submit'
  // submitButton.style = 'margin-right: 4px;'
  // submitButton.title = 'tbd'

  container.appendChild(inputGroupDiv)
  // container.appendChild(inputField)
  // container.appendChild(submitButton)

  // this.deepSearch("");

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  // checkbox.title = 'tbd - e.g. Show nodes that were expanded during Deep Search'

  // Optionally set additional properties for the checkbox
  checkbox.id = this.prefix + 'myCheckbox'
  // container.appendChild(checkbox)
  inputGroupDiv.appendChild(checkbox)

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
