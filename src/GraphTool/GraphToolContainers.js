

function initGraphContainers(div_id) {

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
    this.tool_container.style = "display: flex; padding: 4px 0; margin-bottom: 24px;";
    this.tool_container.setAttribute("class", "navbar");
    this.container.append(this.tool_container);

    // Todo: the following should go to vue.js templates
    let open_container = document.createElement("fieldset");
    open_container.style = "display: flex; flex-wrap: wrap-reverse; border-right: 1px solid silver;";
    let open_legend = document.createElement("legend");
    open_legend.textContent = "Open";
    open_legend.style = "width: max-content; font-size: 0.85rem; margin: 0 auto;";
    open_container.append( open_legend );
    this.tool_container.append( open_container );
    this.loadFunctionality(open_container);

    let io_container = document.createElement("fieldset");
    io_container.style = "display: flex; flex-wrap: wrap-reverse; border-right: 1px solid silver;";
    let io_legend = document.createElement("legend");
    io_legend.textContent = "Save";
    io_legend.style = "width: max-content; font-size: 0.85rem; margin: 0 auto;";
    io_container.append( io_legend );
    this.tool_container.append( io_container );
    this.saveFunctionality(io_container);

    let undo_container = document.createElement("fieldset");
    undo_container.style = "display: flex; flex-wrap: wrap; border-right: 1px solid silver;";
    let undo_legend = document.createElement("legend");
    let undo_element = document.createElement("ICON");
    undo_element.style = "width: 100%; text-align: center; margin-top: 4px; margin-bottom: 4px;";
    undo_element.innerHTML = '<i class="fa-solid text-info-emphasis fa-2xl fa-rotate-left"></i>';
    undo_legend.textContent ="Undo";
    undo_legend.style = "width: max-content; font-size: 0.85rem; margin: 0 auto;";
    undo_container.append( undo_element );
    undo_container.append( undo_legend );
    this. tool_container.append( undo_container );

    let redo_container = document.createElement("fieldset");
    redo_container.style = "display: flex; flex-wrap: wrap; border-right: 1px solid silver;";
    let redo_legend = document.createElement("legend");
    let redo_element = document.createElement("ICON");
    redo_element.style = "width: 100%; text-align: center; margin-top: 4px; margin-bottom: 4px;";
    redo_element.innerHTML = '<i class="fa-solid text-info-emphasis fa-2xl fa-rotate-right"></i>';
    redo_legend.textContent ="Redo";
    redo_legend.style = "width: max-content; font-size: 0.85rem; margin: 0 auto;";
    redo_container.append( redo_element );
    redo_container.append( redo_legend );
    this. tool_container.append( redo_container );

    let edit_container = document.createElement("fieldset");
    edit_container.style = "display: flex; flex-wrap: wrap; border-right: 1px solid silver;";
    let edit_legend = document.createElement("legend");
    let edit_element = document.createElement("ICON");
    edit_element.style = "width: 100%; text-align: center; margin-top: 4px; margin-bottom: 4px;";
    edit_element.innerHTML = '<i class="fa-solid text-info-emphasis fa-2xl fa-pen-to-square"></i>';
    edit_legend.textContent ="Edit";
    edit_legend.style = "width: max-content; font-size: 0.85rem; margin: 0 auto;";
    edit_container.append( edit_element );
    edit_container.append( edit_legend );
    this. tool_container.append( edit_container );

    let help_container = document.createElement("fieldset");
    help_container.style = "display: flex; flex-wrap: wrap; border-right: 1px solid silver;";
    let help_legend = document.createElement("legend");
    let help_element = document.createElement("ICON");
    help_element.style = "width: 100%; text-align: center; margin-top: 4px; margin-bottom: 4px;";
    help_element.innerHTML = '<i class="fa-solid text-info-emphasis fa-2xl fa-question"></i>';
    help_legend.textContent ="Help";
    help_legend.style = "width: max-content; font-size: 0.85rem; margin: 0 auto;";
    help_container.append( help_element );
    help_container.append( help_legend );
    this. tool_container.append( help_container );

    // let settings_container = document.createElement("fieldset");
    // settings_container.style = "border-right: 1px solid silver;";
    // let settings_legend = document.createElement("legend");
    // settings_legend.textContent ="Settings";
    // settings_legend.style = "width: max-content; font-size: 1.0rem; margin-left: 8px; margin-right: 8px;";
    // settings_container.append( settings_legend );
    // this. tool_container.append( settings_container );

    let search_container = document.createElement("fieldset");
    search_container.style = "padding-left: 8px;";
    this.tool_container.append( search_container );
    this.createSearchUI(search_container);

    let deepsearch_container = document.createElement("fieldset");
    deepsearch_container.style = "border-right: 1px solid silver; padding-left: 8px; padding-right: 8px;";
    this.tool_container.append( deepsearch_container );
    this.initDeepSearch(deepsearch_container);

    let coloring_container = document.createElement("fieldset");
    coloring_container.style = "padding-left: 8px; padding-right: 16px;";
    this.tool_container.append( coloring_container );
    this.colorPicker(this, coloring_container);

     // var settingsElement = document.createElement('select');
    // settingsElement.style = "margin-left: 8px;";

    // var settingOption1 = document.createElement('option');
    // settingOption1.text = 'Settings';

    // var settingOption2 = document.createElement('option');
    // settingOption2.text = 'Edge labeling';

    // var settingOption3 = document.createElement('option');
    // settingOption3.text = 'Physics';

    // var settingOption4 = document.createElement('option');
    // settingOption4.text = 'Developer Info';

    // settingsElement.add(settingOption1);
    // settingsElement.add(settingOption2);
    // settingsElement.add(settingOption3);
    // settingsElement.add(settingOption4);

    // this.tool_container.append(settingsElement);

    this.container.append(this.vis_container);
    this.container.append(this.options_container);

  }


      //creates the color by value ui
      function colorPicker(graph, container){
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
            button.innerHTML = "Set path";
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

  export{
    initGraphContainers,
    colorPicker,
    initDeepSearch
  }
