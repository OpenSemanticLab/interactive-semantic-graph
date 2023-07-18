


    //recolors all nodes and edges
  
    function recolorByProperty() {
  
        //this.updatePositions()
        let nodes = this.nodes.get();
        let edges = this.edges.get();
    
    
        for (let edge of edges) {
          edge.color = this.drawer.colorObj[edge.label];
          this.edges.update(edge)
          for (let node of nodes) {
            if (edge.to == node.id) {
              node.color = edge.color;
              this.nodes.update(node)
            }
          }
        }
        // root Nodes
    
        for(let i = 0; i < this.rootNodesArray.length; i++){
    
          let rootNode = this.nodes.get(this.rootNodesArray[i]); //this.drawer.rootId;
          rootNode.color = this.drawer.config.rootColor;
          this.nodes.update(rootNode)
    
        }
    
        
      }

  //colorbyvalue

  //gets the edge by the given node ids and label
  function getEdgeByIDsAndLabel(fromNodeID, toNodeID, label){
  
    const edges = this.edges.get();
  
    const edge = edges.find((edge) => {
      return edge.from === fromNodeID && edge.to === toNodeID && edge.label === label;
    });
  
   
    return edge;
  }
  
  //Builds the full path (nodes and edges) out of the given path of nodes
  function buildFullPath(path, currentNodePath){
  
    let fullPath = [];
  
    for(let i = 0; i < currentNodePath.length; i++) {
        
        fullPath.push(this.nodes.get(currentNodePath[i]));
    
        if(i < currentNodePath.length - 1) {
  
          const edge = this.getEdgeByIDsAndLabel(currentNodePath[i], currentNodePath[i + 1], path[i]);
          
          fullPath.push(edge);
    
        }
    
    }
  
    return fullPath;
  
  }
  
  //removes duplicates from multidimensional array
  function arrayExistsInMultidimensionalArray(arr, multidimensionalArr) {
    return multidimensionalArr.some((element) => {
      return JSON.stringify(element) === JSON.stringify(arr);
    });
  }
  
  //Gets all paths between start and end nodes, that match the given path
  function getRightPathsBetweenNodes(path, startNodes, endNodes) {
  
    let rightPaths = [];
  
    for(let i = 0; i < startNodes.length; i++) {
      for(let j = 0; j < endNodes.length; j++) {
  
        //gets paths between start and end nodes
        let currentNodePaths = this.findAllPaths(startNodes[i].id, endNodes[j].id);
  
        //gets edge paths between start and end nodes
        let currentEdgePaths = this.getAllStringsForAllPaths(currentNodePaths);
  
        if(currentEdgePaths.length == 0) {
          continue;
        }
  
        //compares the given path with the current paths and outputs the path nodes if they are equal
        let foundPath = this.comparePaths(path, currentEdgePaths[0], currentNodePaths);
  
        if(foundPath) {
          //builds the full path (nodes and edges)
          let fullPath = this.buildFullPath(path, foundPath);
          
          //removes duplicates
          if(!(this.arrayExistsInMultidimensionalArray(fullPath, rightPaths))){
            rightPaths.push(fullPath);
          }
        }
  
  
      }
    }
  
    return rightPaths;
  
  }
  
  function setGraphColorsBlackAndWhite(nodes, edges) {
    
      //sets all nodes to white
      for(let i = 0; i < nodes.length; i++) {
        nodes[i].color = "#ffffff";
        this.nodes.update(nodes[i]);
      }
    
      //sets all edges to black
      for(let i = 0; i < edges.length; i++) {
        edges[i].color = "#000000";
        this.edges.update(edges[i]);
      }
    
  }
    
  //colors the paths with the given color array
  function colorPaths(paths, colorArray, valueArray){
  
    //creates an array with all start nodes that are in multiple paths
    let overlap = this.createOverlapArray(paths);
  
    for(let i = 0 ; i < valueArray.length; i++) {
      for(let j = 0; j < paths.length; j++) {
  
        //only color the paths with the given value
        if(!(paths[j][paths[j].length - 1].label == valueArray[i])){
          continue;
        }
  
        for(let k = 0; k < paths[j].length; k++) {
  
          //dont color root node
          if(paths[j][k].group == "root") {
  
            paths[j][k].color = "#6dbfa9";
            this.nodes.update(paths[j][k]);
            continue;
          }
  
          //color nodes that are in multiple paths grey
          if(overlap.includes(paths[j][k].id)) {
            paths[j][k].color = "#D3D3D3";
            this.nodes.update(paths[j][k]);
            continue;
          }
  
          //color nodes with the given color array
          paths[j][k].color = colorArray[i];
  
          //update nodes and edges
          if(paths[j][k].from) {
  
            this.edges.update(paths[j][k]);
  
          }else{
  
            this.nodes.update(paths[j][k]);
  
          }
  
        }
        
      }
  
    }
  
  }
  
  //creates the color array for the color gradient
  function createColorArray(startColor, endColor, valueArray) {
    if(this.containsOnlyNumbers(valueArray)) {
      return chroma.scale([startColor, endColor]).mode('hsl').colors(valueArray.length);
    }else{
      let colorArray = chroma.scale([startColor, endColor]).mode('hsl').colors(1);
  
      for(let i = 0; i < valueArray.length-1; i++) {
        colorArray.push(colorArray[0]);
      }
      return colorArray;
    }
  }
  
  //Colors all nodes and edges connected by the given path. The colors are a gradient between the given colors. 
  function colorByValue(path, nodes, edges, startColor, endColor){
  
    //this.updatePositions()
  
    //All start and end nodes for the given path
    let startEndNodes = this.getStartAndEndNodesForPath(path);
  
    //All paths between start and end nodes, that match the given path
    let pathsToColor = this.getRightPathsBetweenNodes(path, startEndNodes.startNodes, startEndNodes.endNodes);
  
    //generates the values array for the color gradient
    let valueArray = this.createValuesArray(pathsToColor);  
  
    //removes duplicates
    valueArray = [...new Set(valueArray)];
  
    //sorts the array
    valueArray.sort(function (a, b) {
      return a - b;
    });
    
    //creates the color array for the color gradient
    let colorArray = this.createColorArray(startColor, endColor, valueArray);
    
    //sets all nodes to white and all edges to black
    this.setGraphColorsBlackAndWhite(nodes, edges);
  
    //colors the paths
    this.colorPaths(pathsToColor, colorArray, valueArray);
    
  }

export{

    recolorByProperty,
    getEdgeByIDsAndLabel,
    getRightPathsBetweenNodes,
    buildFullPath,
    arrayExistsInMultidimensionalArray,
    setGraphColorsBlackAndWhite,
    colorPaths,
    createColorArray,
    colorByValue

}