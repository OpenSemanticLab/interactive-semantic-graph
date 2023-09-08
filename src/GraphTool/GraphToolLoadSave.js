
    // loads or saves the graph to a .txt file
    function loadFunctionality(container) {


        // Todo: replace global ids with prefixed ids or class members to allow multiple instances on one page


        // create container element if not defined
        if (!container) container = document.createElement("div");

        let element = document.createElement("ICON");
        element.id = this.prefix + "load"
        element.style = "width: 100%; text-align: center; margin-top: 4px; margin-bottom: 4px;";
        element.innerHTML = '<i class="fa-solid text-info-emphasis fa-2xl fa-folder-open"></i>';
        element.addEventListener("click", () => {
          this.createLoadStateFunctionality()
        });

        container.append(element)
        return container;
      }

      function saveFunctionality(container) {


        // Todo: replace global ids with prefixed ids or class members to allow multiple instances on one page


        // create container element if not defined
        if (!container) container = document.createElement("div");

        let element = document.createElement("ICON");
        element.style = "width: 100%; text-align: center; margin-top: 4px; margin-bottom: 4px;";
        element.innerHTML = '<i class="fa-solid text-info-emphasis fa-2xl fa-floppy-disk"></i>';
        element.id = this.prefix + "save";
        element.addEventListener("click", () => {
          this.createSaveStateFunctionality()
        });
        container.append(element)

        return container;
      }


      function createSaveStateFunctionality() {

        let coloringDiv = document.getElementById(this.prefix + "myDropdown");

        let dropdown = coloringDiv.querySelector("select");

        if(dropdown.value == "setColorByValue"){

          this.configFile.coloring_function_object.function_name = "colorByValue";

          let inputField = document.getElementById(this.prefix + "setColorByValueInput");
          this.configFile.coloring_function_object.path = inputField.value;

          let startColor = document.getElementById(this.prefix + "startColor");
          this.configFile.coloring_function_object.start_color = startColor.value;

          let endColor = document.getElementById(this.prefix + "endColor");
          this.configFile.coloring_function_object.end_color = endColor.value;

        }else if(dropdown.value == "setColorByProperty"){

          this.configFile.coloring_function_object.function_name = "colorByProperty";

          this.configFile.coloring_function_object.path = "";

          this.configFile.coloring_function_object.start_color = "";

          this.configFile.coloring_function_object.end_color = "";

        }


        let deepSearchDropdown = document.getElementById(this.prefix + "search_select");

        if(deepSearchDropdown.value == "search_node"){

          this.configFile.dataset_search_function_object.search_on = "nodes";
          this.configFile.visual_search_function_object.search_on = "nodes";

        }else if(deepSearchDropdown.value == "search_edge"){

          this.configFile.dataset_search_function_object.search_on = "edges";
          this.configFile.visual_search_function_object.search_on = "edges";

        }

        let inputField = document.getElementById(this.prefix + "input-field");

        this.configFile.dataset_search_function_object.search_string = inputField.value;

        let inputFieldVisual = document.getElementById(this.prefix + "search_input");
        this.configFile.visual_search_function_object.search_string = inputFieldVisual.value;

        let checkBox = document.getElementById(this.prefix + "myCheckbox");

        this.configFile.dataset_search_function_object.keep_expanded = checkBox.checked;

        let openPaths = [];
        for(let i = 0; i < this.nodes.get().length; i++){

          if(this.isNodeLastInPath(this.nodes.get()[i].id)){

            let paths = this.findAllPaths('jsondata/' + this.configFile.root_node_objects[0].node_id, this.nodes.get()[i].id)

            for(let j = 0; j < paths.length; j++){

              openPaths.push(paths[j]);

            }

          }

        }

        this.configFile.expanded_paths = openPaths;

        this.configFile.visual_nodes_edges_object.nodes = this.nodes.get();
        this.configFile.visual_nodes_edges_object.edges = this.edges.get();

        this.configFile.initial_dataset = this.drawer.file;


        let files = {file: this.drawer.file, config: this.configFile};

        const json = files;
        const filename = "data.txt";
        const text = JSON.stringify(json);

        const element = document.createElement("a");
        element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
        element.setAttribute("download", filename);
        element.style.display = "none";
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
      }

      function createLoadStateFunctionality() {
        const input = document.createElement("input");
        input.type = "file";


        const loadState = this.config.callbacks.loadState
        input.addEventListener("change", (ev) => {
          loadState(ev)
        }) //,()=> this.config.callbacks.loadState(input) );
        input.click();
      }

      function loadStateDefault(input) {

        document.getElementById(this.graphContainerId).innerHTML = "";

        const reader = new FileReader();
        reader.onload = () => {
          const jsonData = JSON.parse(reader.result);


          let graph = new isg.Graph(jsonData.file, jsonData.config);


            // document.getElementById("mynetwork").innerHTML = "";

            // document.getElementById('myDropdown').remove();
            // document.getElementById('save').remove();
            // document.getElementById('load').remove();
            // document.getElementById('search_input').remove();
            // document.getElementById('search_select').remove();

            // if (document.getElementById('setPath')) {
            //   document.getElementById('setPath').remove();
            // }



        };
        reader.readAsText(input.target.files[0]);

      }


export{

    loadFunctionality,
    saveFunctionality,
    createSaveStateFunctionality,
    createLoadStateFunctionality,
    loadStateDefault


}
