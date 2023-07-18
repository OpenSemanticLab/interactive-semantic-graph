    function copyNodesEdges() {
  
  
        this.copiedNodes = this.network.getSelectedNodes()
        this.copiedEdges = this.network.getSelectedEdges()

    }

    //creates an ID for a new node that is to be created by copying an existing one
    function createIDForNewNode(node, receivingNode, copiedEdges) {

        //id when pasted into empty space
        if(receivingNode === false){

        return "test";
        }

        let tempPath = node.id.split('/');

        //if nodes path length is 2, that means its an item and it puts out its id so that only an edge is created
        if(this.drawer.file[tempPath[0]][tempPath[1]] && node.path.length === 2){

        return node.id;

        }

        let id;
        let keyExists = false;
        let receivingNodePath; 

        let connectedEdges = this.network.getConnectedEdges(receivingNode.id)
        let coppiedEdgeObject = this.edges.get(copiedEdges[0])

        //checks if the edge/key already exists
        connectedEdges.forEach((edge) => {
        let edgeObj = this.edges.get(edge)

        if(edgeObj.from === receivingNode.id && coppiedEdgeObject.label === edgeObj.label ){

            keyExists = true;
            
        }

        });


        receivingNodePath = receivingNode.path

        var valueOfPath = this.drawer.file;

        //gets the value at the end of the receiving node path
        for(let i = 0; i < receivingNodePath.length; i++){

        let key = receivingNodePath[i];
        valueOfPath = valueOfPath[key];

        }

        //checks if the last element of the path is not a number    
        if(isNaN(Number(node.id.split('/')[node.id.split('/').length - 1]))){

        //checks if the key does not exist
        if(!keyExists){

            id = receivingNode.id + '/' + node.id.split('/')[node.id.split('/').length - 1] + '/0'

            return id;

        }

        ////////

        //if the value of the path is not an array, but the key exists it creates the id with the number 1 (because its the second element of the array)
        if(!(Array.isArray(valueOfPath[node.id.split('/')[node.id.split('/').length - 1]]))){

            id = receivingNode.id + '/' + node.id.split('/')[node.id.split('/').length - 1] + '/1';

            return id;

        }

        //if the value of the path is an array, it creates the id with the length of the array - 1
        id = receivingNode.id + '/' + node.id.split('/')[node.id.split('/').length - 1] + '/' + valueOfPath[node.id.split('/')[node.id.split('/').length - 1]].length;
        
        return id;

        }

        //c it checks if the key exists
        if(!keyExists){

        id = receivingNode.id + '/' + node.id.split('/')[node.id.split('/').length - 2] + '/0'

        return id;

        }

        ////////

        //if the last element of the path is a number, and the key exists, it creates the id with the length of the array - 2
        id = receivingNode.id + '/' + node.id.split('/')[node.id.split('/').length - 2] + '/' + valueOfPath[node.id.split('/')[node.id.split('/').length - 2]].length;

        return id;
    }

    function createNewNodesFromCopiedNodes(copiedNodes, copiedEdges, receivingNode) {
        
        let node = this.nodes.get(copiedNodes[0])

        let newNode = {};
        let keys = Object.getOwnPropertyNames(node)

        keys.forEach((key) => {
        if (!(key === "id") && !((typeof (node[key])) == "function")) {
            newNode[key] = node[key]
        }
        });
    
        newNode.id = this.createIDForNewNode(node, receivingNode, copiedEdges)
        
        return newNode;

    }

    function createNewEdgeForNewNode(newNode) {
        
        let newEdge = {
            id: ''+this.network.getSelectedNodes()[0] + '=' + this.edges.get(this.copiedEdges[0]).label + '=>' + newNode.id,
            from: this.network.getSelectedNodes()[0],
            to: newNode.id,
            label: this.edges.get(this.copiedEdges[0]).label,
            color: newNode.color,
            group: newNode.group,
            //objectKey: this.edges.get(this.copiedEdges[index]).objectKey
        }

        return newEdge;
    }

    function pasteNodeEdges(copiedNodes, copiedEdges) {
  
        let xy = this.network.DOMtoCanvas({
          x: this.mouseX,
          y: this.mouseY
        })
    
        //paste nodes and edges into existing nodes
        if (copiedNodes.length > 0 && this.network.getSelectedNodes().length > 0) {
    
          // TODO: encapsulate in: this.pasteNodeIntoExistingItem() 
          // TODO: paste node into empty space and create corresponding item this.pasteNodeIntoNewItem(node,xy) 
    
          let receivingNode = this.nodes.get(this.network.getSelectedNodes()[0])
    
          let json = this.drawer.file;
    
          for(let i = 0; i < receivingNode.path.length; i++){
    
            json = json[receivingNode.path[i]];
      
          }
    
          //if literal, then return
          if(typeof json === 'string' && this.drawer.file[receivingNode.path[receivingNode.path.length - 1]] === undefined){
    
            return;
    
          }
    
          if (this.nodes.get(this.network.getSelectedNodes()[0]).item) {
    
    
            let newNode = this.createNewNodesFromCopiedNodes(copiedNodes, copiedEdges, receivingNode);
            
            newNode.depth = this.nodes.get(this.network.getSelectedNodes()[0]).depth + 1;
    
            newNode.x = xy.x;
            newNode.y = xy.y;
    
            //config.graph.id += 1;
    
            let newEdge = this.createNewEdgeForNewNode(newNode);
    
            if (newNode.group != "root") {
              this.nodes.update(newNode);
              this.edges.update(newEdge);
    
              this.addToJSON(newNode, newEdge, receivingNode);
    
            }
          }
    
    
        }
    
        if(copiedNodes.length > 0 && this.network.getSelectedNodes().length === 0){
          //paste nodes and edges into empty space
    
          let newNode = this.createNewNodesFromCopiedNodes(copiedNodes, copiedEdges, false);
    
          if(this.drawer.file.jsondata[newNode.path[1]]){
            
            newNode.depth = 0;
    
            newNode.x = xy.x;
            newNode.y = xy.y;
            
            newNode.group = "root"
    
            newNode.key = newNode.path[1];
    
            newNode.incomingLabels = [];
    
            newNode.color = "#6dbfa9";
    
            newNode.fixed = true;
    
            this.nodes.update(newNode);
    
            //TODO: add to json, id is not correct
          }
    
        }
      }

    //adds copied nodes to the json file
    function addToJSON(newNode, newEdge, receivingNode) {
  
        //finalPlace is the place where the new node will be added
        let finalPlace = this.drawer.file;
    
        //goes through the path of the receiving node to find the place where the new node will be added
        for(let i = 0; i < receivingNode.path.length; i++){
    
          finalPlace = finalPlace[receivingNode.path[i]];
    
        }
    
        //contains the value of the node that will be added
        let valueToBeAdded = this.drawer.file;
    
        //path of the copied node gets split into an array
        let valuePath = this.copiedNodes[0].split("/");
    
        //goes through the path of the copied node to find the value of the node that will be added
        for(let i = 0; i < valuePath.length; i++){
    
          valueToBeAdded = valueToBeAdded[valuePath[i]];
    
        }
    
        //if the path of the copied node is only two elements long, take the second element of the path as the value that will be added (only relevant for items)
        if(valuePath.length == 2){
            
            valueToBeAdded = valuePath[1];
        }
    
        //if key of the final place is not defined, create the key and add the value inside an array
        if(!(finalPlace[newNode.key])){
    
          finalPlace[newNode.key] = [valueToBeAdded];
    
          return;
    
        }
    
        //if key of the final place key is defined but the value is not an array, create an array and add the old value of the key and then the new value
        if(!(Array.isArray(finalPlace[newNode.key]))){
    
          finalPlace[newNode.key] = [finalPlace[newNode.key]]
    
          finalPlace[newNode.key].push(valueToBeAdded);
          
          return;
        }
    
        //if final place key is defined and the value is an array, add the new value to the array
        finalPlace[newNode.key].push(valueToBeAdded);
    
        return;
    
      }

    //creates a copy of a given node
    function duplicateNode(node) {
  
        let newNode = {}
        if (Object.getOwnPropertyNames(node).includes("typeString")) {
          let cls = this.classRegistry.get(node.typeString)
          newNode = new cls(utils.uuidv4())
        } else {
          newNode.id = utils.uuidv4()
        }
        let keys = Object.getOwnPropertyNames(node)
        keys.forEach((key) => {
          if (!(key === "id") && !((typeof (node[key])) == "function")) {
            newNode[key] = node[key]
          }
        })
        return (newNode)
      }


export{

    copyNodesEdges,
    createIDForNewNode,
    createNewNodesFromCopiedNodes,
    createNewEdgeForNewNode,
    pasteNodeEdges,
    addToJSON,
    duplicateNode

}