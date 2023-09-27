import { event } from "jquery";


function initGraphContainers(div_id) {
if (this.handleCallbacks({ id: 'onBeforeInitGraphContainers', params: { graph: this, div_id } })) {
    // create all necessary elements/divs and set them up
    this.container = document.getElementById(div_id);
    this.vis_container = document.createElement("div");
    this.vis_container.setAttribute("id", this.prefix + "vis_container");
    //this.vis_container.width = "70%"
    this.vis_container.style = "width: 65%; height: 800px; border: 1px solid lightgray;  float:left;";
    this.options_container = document.createElement("div");
    this.options_container.setAttribute("id", this.prefix + "options_container");
    this.options_container.setAttribute("style", "overflow-y:scroll");
    //this.options_container.width = "30%"
    this.options_container.style = "margin-left: 68%; width: 30%; height: 800px; border: 1px solid lightgray;";


    this.tool_container = document.createElement("div");
    this.tool_container.style = "display: flex; justify-content: start; padding: 16px 16px 8px 16px; margin: 24px 0; border-radius: 8px; background: rgb(0, 91, 127);";
    this.tool_container.setAttribute("class", "navbar");
    this.container.append(this.tool_container);

    // Todo: the following should go to vue.js templates
    // Bootstrap class for open button
    let open_container = document.createElement("fieldset");
    let open_button = document.createElement("button");
    open_button.setAttribute("type", "button");
    open_button.setAttribute("class", "btn btn-outline-light");
    open_button.style = "margin: 0 8px 8px 0;";
    open_button.innerHTML = "<i class='fa-regular fa-xl fa-folder-open me-1'></i> Open";
    open_container.append( open_button );
    this.tool_container.append( open_container );
    this.loadFunctionality( open_button );

      // Bootstrap class for save button
    let save_container = document.createElement("fieldset");
    let save_button = document.createElement("button");
    save_button.setAttribute("type", "button");
    save_button.setAttribute("class", "btn btn-outline-light");
    save_button.style = "margin: 0 8px 8px 8px;";
    save_button.innerHTML = "<i class='fa-regular fa-xl fa-floppy-disk me-1'></i> Save";
    save_container.append( save_button );
    this.tool_container.append( save_container );
    this.saveFunctionality( save_button );

      // Bootstrap class for edit button
    let edit_container = document.createElement("fieldset");
    let edit_button = document.createElement("button");
    edit_button.setAttribute("type", "button");
    edit_button.setAttribute("class", "btn btn-light");
    edit_button.style = "margin: 0 0 8px 8px; width: 90px;";
    edit_button.innerHTML = "<i class='fa-regular fa-xl fa-pen-to-square me-1'></i> Edit";
    edit_button.addEventListener("click", () => {
      this.options.manipulation.enabled = !this.options.manipulation.enabled;
      this.options.manipulation.initiallyActive = !this.options.manipulation.initiallyActive;
      this.network.setOptions(this.options);

      if(this.options.manipulation.enabled){
        document.getElementById(this.prefix + "vis_container").querySelector(".vis-close").style = "display: none;"
      }
    });

    let isEditMode = true;
    edit_button.addEventListener("click", () => {
    edit_button.innerHTML = isEditMode? "<i class='fa-regular fa-xl fa-circle-xmark'></i> Exit" : "<i class='fa-regular fa-xl fa-pen-to-square me-1'></i> Edit"
    isEditMode = !isEditMode;
    });

    edit_container.append( edit_button );
    this.tool_container.append( edit_button );

    // visual filter
    let search_container = document.createElement("fieldset");
    search_container.style = "padding: 0 8px; margin: 0 8px 8px 8px; border-left: 2px dotted lightgrey; border-right: 2px dotted lightgrey;";
    this.tool_container.append( search_container );
    this.createSearchUI(search_container);

    let deepsearch_container = document.createElement("fieldset");
    deepsearch_container.style = "padding: 0 8px 0 0; margin: 0 8px 8px 0; border-right: 2px dotted lightgrey; ";
    this.tool_container.append( deepsearch_container );
    this.initDeepSearch(deepsearch_container);

    let coloring_container = document.createElement("fieldset");
    coloring_container.style = "margin-bottom: 8px;";
    this.tool_container.append( coloring_container );
    this.colorPicker(this, coloring_container);

    this.container.append(this.vis_container);
    this.container.append(this.options_container);
  }
}

      //creates the color by value ui
      function colorPicker(graph, container){
        const colorPickerArgs = { graph, container }
        if (this.handleCallbacks({ id: 'onBeforeColorPicker', params: { graph: this, colorPickerArgs } })) {
        // Create the dropdown menu
        // Todo: replace global ids with prefixed ids or class members to allow multiple instances on one page

        // create container if not specified
        if (!container) container = document.createElement("div");

        var graph = graph;
        var prefix = this.prefix;
        var dropdownDiv = document.createElement("div");
        dropdownDiv.id = this.prefix + "dropdown";
        dropdownDiv.setAttribute("id", this.prefix + "myDropdown");

        var dropdown = document.createElement("select");

        var option1 = document.createElement("option");
        option1.setAttribute("value", "setColorByProperty");
        option1.innerHTML = "Color by Property";

        var option2 = document.createElement("option");
        option2.setAttribute("value", "setColorByValue");
        option2.innerHTML = "Color by Value";

        // var option3 = document.createElement("option");
        // option3.setAttribute("value", "option3");
        // option3.innerHTML = "Option 3";

        dropdown.appendChild(option1);
        dropdown.appendChild(option2);
        //dropdown.appendChild(option3);

        dropdownDiv.appendChild(dropdown);

        // Add the dropdown menu to the container
        container.appendChild(dropdownDiv);

        // Get the selected value
        function getPath() {
          let path = "" + document.querySelector('#' + prefix + 'setColorByValueInput').value;

          let tempArray = path.split(".")

          let startColor = document.querySelector('#' + prefix + 'startColor').value;
          let endColor = document.querySelector('#'+ prefix +'endColor').value;

          graph.colorByValue(tempArray, graph.nodes.get(), graph.edges.get(), startColor, endColor);

          graph.nodes.update(graph.nodes.get())
          graph.edges.update(graph.edges.get())

          // graph.network.body.emitter.emit('_dataChanged');

          // graph.network.redraw();
        }


        // Add an event listener to get the selected value
        document.querySelector('#' + this.prefix + 'myDropdown select').addEventListener('change', function () {
          var selectedValue = this.value;

          if (selectedValue == "setColorByValue") {

            var input = document.createElement("input");
            input.type = "text";
            input.placeholder = "Set path";
            input.style = "padding-left: 8px; margin: 0 4px 0 4px; border-radius: 4px;";
            input.id = prefix + "setColorByValueInput";



            const usefulColors = ["orangered", "red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "gray"];
            const usefulColors2 = ["limegreen", "green", "orange", "yellow", "red", "blue", "purple", "pink", "brown", "gray"];

            // Create the select element
            const select = document.createElement("select");

            // Add options to the select element
            for (let i = 0; i < usefulColors.length; i++) {
              const option = document.createElement("option");
              option.value = usefulColors[i];
              option.text = usefulColors[i];
              select.appendChild(option);
            }
            select.id = prefix + "startColor";


            const select2 = document.createElement("select");
            select2.style = "margin: 0 4px;";

            // Add options to the select element
            for (let i = 0; i < usefulColors2.length; i++) {
              const option = document.createElement("option");
              option.value = usefulColors2[i];
              option.text = usefulColors2[i];
              select2.appendChild(option);
            }
            select2.id = prefix + "endColor";

            // Add a button to get the selected value
            var button = document.createElement("button");
            button.id = prefix + "setPath";
            button.innerHTML = "Apply";
            button.style = "border-radius: 4px;";
            button.addEventListener("click", getPath);

            if (!document.getElementById(this.prefix + "setColorByValueInput")) {

              document.getElementById(prefix + "myDropdown").appendChild(input);
              document.getElementById(prefix + "myDropdown").appendChild(select);
              document.getElementById(prefix + "myDropdown").appendChild(select2);
              document.getElementById(prefix + "myDropdown").appendChild(button);
            }
          }

          if (selectedValue == "setColorByProperty") {
            if (document.getElementById(prefix + "setColorByValueInput")) {
              document.getElementById(prefix + "setColorByValueInput").remove();
              document.getElementById(prefix + "startColor").remove();
              document.getElementById(prefix + "endColor").remove();
              document.getElementById(prefix + "setPath").remove();
            }
            graph.recolorByProperty();
            graph.nodes.update(graph.nodes.get())
            graph.edges.update(graph.edges.get())
          }
          //alert("Selected value: " + selectedValue);
        });
        }
      }

      function initDeepSearch(container){

        // create container if not defined
        if (!container) container = document.createElement('div');

        const inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.placeholder = "Deep Search"
        inputField.id = this.prefix + 'input-field';
        inputField.style = "padding-left: 8px; border-radius: 4px; margin-right: 4px;"

        const submitButton = document.createElement('button');
        submitButton.id = this.prefix + 'submit-button';
        submitButton.textContent = 'Submit';
        submitButton.style = "border-radius: 4px; margin-right: 4px;"

        container.appendChild(inputField);
        container.appendChild(submitButton);

        //this.deepSearch("");

        // Create the checkbox element
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';

        // Optionally set additional properties for the checkbox
        checkbox.id = this.prefix + 'myCheckbox';
        container.appendChild(checkbox);

        submitButton.addEventListener('click', () => {
          this.searchExpands = [];

          const inputValue = inputField.value;

          let inputString = inputValue;

          this.searchFunctionality(this.dataFile, inputString)

        });

        return container;
  }
}

export {
  initGraphContainers,
  colorPicker,
  initDeepSearch
}

