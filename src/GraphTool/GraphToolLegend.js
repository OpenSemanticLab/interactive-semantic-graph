
    //repeats the invisibility of properties that are set invisible in the legend
    function repeatInvisibility(options) {


        for (const [key, value] of Object.entries(options.groups)) {

          for (const [subKey, subValue] of Object.entries(value)) {
            if (subValue == true) {

              let objectToRepeat = {
                repeat: key
              }

              this.legendFunctionality(objectToRepeat);

            }
          }
        }


        // Array.from(options.groups).forEach((group)=> {

        // });

        // let legend = document.getElementById("legendContainer");
        // let children = Array.from(legend.children);

        // children.forEach(child => {

        //   if(window.getComputedStyle(child.children[1]).backgroundColor == "rgb(255, 255, 255)"){

        //     let objectToRepeat = {repeat:child.children[1].innerHTML}

        //     this.legendFunctionality(objectToRepeat);

        //   }

        // });

      }

    //sets the color of the legend white if the group is set to hidden = true
    function setInvisibleLegendGroupsWhite(invisibleGroups) {

        let legend = document.getElementById(this.prefix + "legendContainer");
        let children = Array.from(legend.children);


        children.forEach((child) => {

          if (invisibleGroups.includes(child.children[1].innerHTML)) {

            child.children[1].style.background = "rgb(255, 255, 255)"

          }

        });

      }

    // resets nodes and edges visibility
    function resetNodesAndEdgesVisibility() {

        this.nodes.forEach((node) => {
          node.hidden = false;
          node.physics = !node.hidden;
          node.visited = false;
          this.nodes.update(node);
        });

        this.edges.forEach((edge) => {
          edge.hidden = false;
          edge.physics = !edge.hidden;
          this.edges.update(edge);
        });

      }

    //generates the legend for the graph
    function createLegend() {
        var invisibleGroups = [];


        //if (!document.getElementById("legendContainer")) {

          Object.keys(this.drawer.colorObj).forEach((key) => {


            if(!this.options.groups[key]){

              this.options.groups[key] = {
                hidden: false
              };

            }
            // options.groups[key] = {
            //   hidden: false
            // };

          });

        //}

        if (document.getElementById(this.prefix + "legendContainer")) {

          invisibleGroups = this.legendInvisibleGroups(this.options);

          document.getElementById(this.prefix + "legendContainer").remove();
        }
        var legendDiv = document.createElement("div");
        let vis_cont = document.getElementById(this.prefix + "vis_container")
        vis_cont.append(legendDiv);
        legendDiv.style.width = '100%';
        legendDiv.style.position = 'relative';
        legendDiv.style.display = 'inline-block';
        legendDiv.style = 'padding: 8px 0;';
        legendDiv.id = this.prefix + "legendContainer";
        var legendColors = this.drawer.colorObj
        var legendSet = {}

        for (let edge of this.edges.get()) {

          if (!legendSet[edge.group]) {

            //legendColors[input.properties[i]] = colors[i];
            var propertyContainer = document.createElement("div");
            var propertyColor = document.createElement("div");
            var propertyName = document.createElement("div");
            propertyContainer.className = "legend-element-container";
            propertyContainer.id = this.prefix + edge.label;
            propertyColor.className = "color-container";
            propertyName.className = "name-container";
            propertyColor.style = "float: left; border-radius: 50px; width: 20px; height: 20px; margin-right: 4px; margin-left: 16px;";
            propertyName.style.float = "left";
            propertyName.style.marginRight = "24px;";
            propertyName.style.fontSize = "0.8rem;";
            // propertyColor.style.border = "1px solid black";
            // propertyName.style.border = "1px solid black";
            propertyColor.style.background = legendColors[edge.group]
            propertyColor.innerHTML = "";
            propertyName.innerHTML = edge.label;
            // propertyName.style.background = '#DEF';
            // propertyName.text-align = 'center';
            // propertyContainer.padding = '5px 5px 5px 5px';
            propertyName.addEventListener("click", (e) => this.legendFunctionality(e));
            propertyColor.addEventListener("click", (e) => this.legendFunctionality(e));
            legendDiv.append(propertyContainer);
            propertyContainer.append(propertyColor);
            propertyContainer.append(propertyName);

            legendSet[edge.group] = legendColors[edge.group];
          }
        }


        this.setInvisibleLegendGroupsWhite(invisibleGroups);
      }

    //function to set nodes and edges hidden when legend is clicked
    function setNodeVisibilityByVisiblePath(nodeId, rootNodeId){

        for(let i = 0; i < this.configFile.root_node_objects.length; i++) {
          if(nodeId == 'jsondata/' + this.configFile.root_node_objects[i].node_id) {

            return true;

          }
        }
        //if (nodeId == this.drawer.rootId) return true; //root is always visible

        let node = this.nodes.get(nodeId);
        if (node.visited) return !node.hidden //prevent circles. ToDo: Reuse results between runs
        node.visited = true;
        node.hidden = true;
        let connectedEdgesIds = this.network.getConnectedEdges(nodeId);
        let connectedEdges = this.edges.get(connectedEdgesIds);
        connectedEdges.forEach((edge) => {
          if (edge.hidden) return; //don't follow hidden edges
          let connectedNodesIds = this.network.getConnectedNodes(edge.id);
          let connectedNodes = this.nodes.get(connectedNodesIds);
          connectedNodes.forEach((connectedNode) => {
            if (connectedNode.id == nodeId) return; //prevent self evaluation
            if (this.setNodeVisibilityByVisiblePath(connectedNode.id, rootNodeId)) {
              node.hidden = false; //set node visible, if at least one connected node is visible
            }
          });
        });
        node.physics = !node.hidden; //disable physics for hidden nodes
        return !node.hidden;
      }

      //turns clicked properties of the legend invisible or back to visible
    function legendFunctionality(e){


        let legendGroup;
        let group;
        let nodeChildren;
        let strategy = "strategy2"


        //this.updatePositions()
        if (strategy == "strategy2") {

          if (!e.repeat) {
            legendGroup = e.target.parentNode.childNodes[1].innerHTML;
            //A node is visible if at least one path over visible edges to the root node exists.
            this.options.groups[legendGroup].hidden = !this.options.groups[legendGroup].hidden; //toggle state
            if (this.options.groups[legendGroup].hidden) e.target.parentNode.childNodes[1].style.background = '#FFFFFF';
            else e.target.parentNode.childNodes[1].style.background = '#DEF';
          }
          //update all edges. ToDo: Consider: https://visjs.github.io/vis-network/examples/network/data/dynamicFiltering.html
          this.edges.forEach((edge) => {
            edge.hidden = this.options.groups[edge.group].hidden;
            edge.physics = !edge.hidden;
            this.edges.update(edge); //see also: https://visjs.github.io/vis-network/examples/network/data/datasets.html
          });

          //reset nodes
          this.nodes.forEach((node) => {
            node.hidden = false;
            node.physics = !node.hidden;
            node.visited = false;
          });

          //check each node
          this.nodes.forEach((node) => {
            this.setNodeVisibilityByVisiblePath(node.id, 0)
            //reset visited state. Todo: Reuse visited nodes between runs
            this.nodes.forEach((node) => {
              node.visited = false;
            });

            this.nodes.update(node); //see also: https://visjs.github.io/vis-network/examples/network/data/datasets.html
          });
        }

        var allFalse = Object.keys(this.options.groups).every((k) => {
          if (k === 'useDefaultGroups') {
            return true
          }
          return this.options.groups[k].hidden === false
        });

        if (allFalse === true) {
          /*oldGroups = {};*/
        }


      };


export{

    repeatInvisibility,
    setInvisibleLegendGroupsWhite,
    resetNodesAndEdgesVisibility,
    createLegend,
    setNodeVisibilityByVisiblePath,
    legendFunctionality

}
