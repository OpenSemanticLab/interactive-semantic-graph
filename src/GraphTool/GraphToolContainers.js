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
    this.options_container.setAttribute('style', 'overflow-y:scroll; margin-left: 68%; width: 30%; height: 800px; border: 1px solid lightgray;')
    // this.options_container.width = "30%"
    // this.options_container.style = 'margin-left: 68%; width: 30%; height: 800px; border: 1px solid lightgray;'

    // ------------- TEST toggle button for displaying tool_container  ------------------------

    const self = this
    const toggleButton = document.createElement('button')
    toggleButton.setAttribute('type', 'button')
    toggleButton.setAttribute('class', 'btn btn-outline-secondary btn-sm')
    toggleButton.innerHTML = "<i class='fa-solid fa-lg fa-angle-down me-1'></i> Toolbar"
    toggleButton.addEventListener('click', function () {
      const isVisible = self.tool_container.style.visibility !== 'hidden'
      if (isVisible) {
        self.tool_container.style.visibility = 'hidden'
        self.tool_container.style.transform = 'translateY(-100%)'
        this.querySelector('i').classList.replace('fa-angle-up', 'fa-angle-down')
      } else {
        self.tool_container.style.visibility = 'visible'
        self.tool_container.style.display = 'flex'
        self.tool_container.style.justifyContent = 'start'
        self.tool_container.style.alignItems = 'center'
        self.tool_container.style.rowGap = '0.5rem'
        self.tool_container.style.padding = '1rem'
        self.tool_container.style.margin = '0.5rem 0 1.5rem 0'
        self.tool_container.style.background = 'rgb(220, 236, 251)'
        self.tool_container.style.transform = 'translateY(0)'
        this.querySelector('i').classList.replace('fa-angle-down', 'fa-angle-up')
      }
    })

    this.container.append(toggleButton)

    this.tool_container = document.createElement('div')
    this.tool_container.style = 'display: none; transition: transform 0.5s ease-in-out; transform: translateY(-100%);'
    this.tool_container.setAttribute('class', 'navbar')
    this.container.append(this.tool_container)

    // ------------------- End Test --------------

    // this.tool_container = document.createElement('div')
    // this.tool_container.style = 'display: flex; justify-content: start; align-items: center; row-gap: 0.5rem; padding: 1rem; margin: 1.5rem 0; background: rgb(220, 236, 251);'
    // this.tool_container.setAttribute('class', 'navbar')
    // this.container.append(this.tool_container)

    // Todo: the following should go to vue.js templates
    // Bootstrap class for open button
    const openContainer = document.createElement('fieldset')
    const openButton = document.createElement('button')
    openButton.setAttribute('type', 'button')
    openButton.setAttribute('class', 'btn btn-outline-secondary btn-sm')
    openButton.innerHTML = "<i class='fa-regular fa-lg fa-folder-open me-1'></i> Open"
    openContainer.append(openButton)
    this.tool_container.append(openContainer)
    this.loadFunctionality(openButton)

    // Bootstrap class for save button
    const saveContainer = document.createElement('fieldset')
    const saveButton = document.createElement('button')
    saveButton.setAttribute('type', 'button')
    saveButton.setAttribute('class', 'btn btn-outline-secondary btn-sm')
    saveButton.style = 'margin: 0 8px 0 8px;'
    saveButton.innerHTML = "<i class='fa-regular fa-lg fa-floppy-disk me-1'></i> Save"
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
    deleteButton.setAttribute('class', 'btn btn-outline-danger btn-sm')
    deleteButton.setAttribute('id', this.prefix + 'deleteButton')
    deleteButton.innerHTML = "<i class='fa-regular fa-trash-can me-1'></i> Delete"
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
    addNodeButton.setAttribute('class', 'btn btn-outline-dark btn-sm')
    addNodeButton.setAttribute('id', this.prefix + 'addNodeButton')
    addNodeButton.style = 'margin-left: 0.5rem'
    addNodeButton.innerHTML = "<i class='fa-regular fa-square-plus me-1'></i> Node"
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
    addEdgeButton.setAttribute('class', 'btn btn-outline-dark btn-sm')
    addEdgeButton.setAttribute('id', this.prefix + 'addEdgeButton')
    addEdgeButton.style = 'margin: 0 0.5rem 0 0.5rem;'
    addEdgeButton.innerHTML = "<i class='fa-regular fa-square-plus me-1'></i> Edge"
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
    editButton.setAttribute('class', 'btn btn-outline-primary btn-sm')
    editButton.setAttribute('id', this.prefix + 'editButton')
    editButton.innerHTML = "<i class='fa-regular fa-lg fa-pen-to-square me-1'></i> Edit"

    let isEditMode = true
    editButton.addEventListener('click', () => {
      // editButton.innerHTML = isEditMode ? 'btn btn-outline-primary' : 'btn btn-outline-secondary'
      // editButton.innerHTML = isEditMode ? "<i class='fa-regular fa-xl fa-circle-xmark'></i> Exit" : "<i class='fa-regular fa-xl fa-pen-to-square me-1'></i> Edit"
      this.network.enableEditMode()
      if (isEditMode) {
        editButton.classList.remove('btn-outline-primary')
        editButton.classList.add('btn-outline-secondary')
        editButton.innerHTML = "<i class='fa-regular fa-lg fa-circle-xmark me-1'></i> Exit"
        editButton.insertAdjacentElement('afterend', deleteButton)
        editButton.insertAdjacentElement('afterend', addEdgeButton)
        editButton.insertAdjacentElement('afterend', addNodeButton)

        // this.tool_container.append(addNodeButton)
        // this.tool_container.append(addEdgeButton)
        // this.tool_container.append(deleteButton)
      } else {
        editButton.classList.remove('btn-outline-secondary')
        editButton.classList.add('btn-outline-primary')
        editButton.innerHTML = "<i class='fa-regular fa-xl fa-pen-to-square me-1'></i> Edit"
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
    searchContainer.style = 'padding: 0 8px; margin-left: 8px; border-left: 1px solid grey; border-right: 1px solid grey;'
    this.tool_container.append(searchContainer)
    this.createSearchUI(searchContainer)

    const deepSearchContainer = document.createElement('fieldset')
    deepSearchContainer.style = 'padding: 0 8px; margin-right: 8px; border-right: 1px solid grey; '
    this.tool_container.append(deepSearchContainer)
    this.initDeepSearch(deepSearchContainer)

    const coloringContainer = document.createElement('fieldset')
    this.tool_container.append(coloringContainer)
    this.colorPicker(this, coloringContainer)

    this.container.append(this.vis_container)
    this.container.append(this.options_container)
  }
}

// creates the color by value ui
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
    dropdown.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'dropdown-toggle') // added Bootstrap 210 - 213
    dropdown.setAttribute('data-toggle', 'dropdown')
    dropdown.setAttribute('aria-haspopup', 'true')
    dropdown.setAttribute('aria-expanded', 'false')

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

    // -------------------- Test new Bootstap UI ----------

    const dropdownItems = [
      { text: 'Color by Property', value: 'setColorByProperty' },
      { text: 'Color by Value', value: 'setColorByValue' }
    ]

    dropdownItems.forEach(item => {
      const optionItem = document.createElement('option')
      optionItem.text = item.text
      optionItem.value = item.value
      dropdown.add(optionItem)
    })

    // --------------- End of Test ---------

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
        const inputGroupDiv = document.createElement('div')
        inputGroupDiv.classList.add('input-group', 'input-group-sm')

        const input = document.createElement('input')
        input.setAttribute('type', 'text')
        input.classList.add('form-control')
        input.setAttribute('placeholder', 'e.g. HasBudget.value')
        input.setAttribute('aria-label', 'Color by Value')
        input.setAttribute('aria-describedby', 'basic-addon2')
        // input.type = 'text'
        // input.placeholder = 'Set path'
        // input.style = 'padding-left: 8px; margin: 0 4px 0 4px; border-radius: 4px;'
        input.id = prefix + 'setColorByValueInput'

        const appendDiv = document.createElement('div')
        appendDiv.classList.add('input-group-append')

        const usefulColors = ['orangered', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'gray']
        const usefulColors2 = ['limegreen', 'green', 'orange', 'yellow', 'red', 'blue', 'purple', 'pink', 'brown', 'gray']

        // Create the select element
        const select = document.createElement('select')
        select.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'dropdown-toggle') // added bootstrap 297-300
        select.setAttribute('data-toggle', 'dropdown')
        select.setAttribute('aria-haspopup', 'true')
        select.setAttribute('aria-expanded', 'false')
        select.style = 'border-top-right-radius: 0; border-bottom-right-radius: 0;'

        // Add options to the select element
        for (let i = 0; i < usefulColors.length; i++) {
          const option = document.createElement('option')
          option.value = usefulColors[i]
          option.text = usefulColors[i]
          select.appendChild(option)
        }
        select.id = prefix + 'startColor'

        const select2 = document.createElement('select')
        select2.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'dropdown-toggle') // added bootstrap 312-315
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

        // Add a button to get the selected value
        const button = document.createElement('button')
        button.setAttribute('class', 'btn btn-outline-primary btn-sm') // bootstrap
        button.id = prefix + 'setPath'
        button.innerHTML = 'Apply'
        // button.style = 'border-radius: 4px;'
        button.addEventListener('click', getPath)

        if (!document.getElementById(this.prefix + 'setColorByValueInput')) {
          document.getElementById(prefix + 'myDropdown').appendChild(input)
          document.getElementById(prefix + 'myDropdown').appendChild(select)
          document.getElementById(prefix + 'myDropdown').appendChild(select2)
          document.getElementById(prefix + 'myDropdown').appendChild(button)
        }

        inputGroupDiv.appendChild(dropdownDiv)
        inputGroupDiv.appendChild(input)
        appendDiv.appendChild(select)
        appendDiv.appendChild(select2)
        appendDiv.appendChild(button)
        inputGroupDiv.appendChild(appendDiv)

        container.appendChild(inputGroupDiv)
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

function initDeepSearch (container) {
  // create container if not defined
  if (!container) container = document.createElement('div')

  // ------------------Bootstrap input group
  const inputGroupDiv = document.createElement('div')
  inputGroupDiv.classList.add('input-group', 'input-group-sm')

  const inputField = document.createElement('input')
  inputField.setAttribute('type', 'text')
  inputField.classList.add('form-control')
  inputField.setAttribute('placeholder', 'Deep Search')
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
  submitButton.title = 'tbd'

  inputGroupDiv.appendChild(inputField)
  appendDiv.appendChild(submitButton)
  inputGroupDiv.appendChild(appendDiv)

  container.appendChild(inputGroupDiv)

  inputField.id = this.prefix + 'input-field'

  // ----------------End of bootstrap input group

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

  // Create the checkbox element
  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.title = 'tbd - e.g. Show nodes that were expanded during Deep Search'

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
