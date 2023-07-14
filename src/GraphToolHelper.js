const jsonpath = require('jsonpath');

function searchJSON(data, searchValue) {

    // const searchValue = '2022';
    // const jsonPathExpression = `$..[?(@=="${searchValue}")]`;
    const matches = jsonpath.query(data, `$..[?(@=="${searchValue}")]`);

    const result = [...new Set(matches.flatMap(match =>
        jsonpath.paths(data, `$..[?(@=="${match}")]`).map(key =>
        `${key.join('.')}` //: ${match}
        )
    ))];

    return result;

}

function imageToNode(file, currentGraphObject, dropEvent) {
  
    // add image node to network

    let xy = this.network.DOMtoCanvas({
      x: dropEvent.clientX,
      y: dropEvent.clientY
    })

    // read file 

    let reader = new FileReader(currentGraphObject);

    reader.onload = (event) => {

      // let newNode = new NodeClasses.ImageNode(currentGraphObject, utils.uuidv4(), xy.x, xy.y, event.target.result)

      // this.nodes.update(newNode)

    };

    reader.readAsDataURL(file)

}

function csvToNode(file, currentGraphObject, dropEvent) {
  
    // add csv node
    let xy = this.network.DOMtoCanvas({
      x: dropEvent.clientX,
      y: dropEvent.clientY
    })

    // read file 

    let reader = new FileReader(currentGraphObject);
    reader.onload = (event) => {

      // let newNode = new NodeClasses.CsvNode(currentGraphObject, utils.uuidv4(), xy.x, xy.y, event.target.result)

      // this.nodes.update(newNode)
    };
    reader.readAsText(file)

}

function videoToNode(file, currentGraphObject, dropEvent) {
  
    // add cameraNode node
    let xy = this.network.DOMtoCanvas({
      x: dropEvent.clientX,
      y: dropEvent.clientY
    })

    // read file 
    let reader = new FileReader(currentGraphObject);

    reader.onload = (event) => {

      // let newNode = new NodeClasses.VideoNode(currentGraphObject, utils.uuidv4(), xy.x, xy.y, reader.readAsDataURL(event.target.result))

      // this.nodes.update(newNode)
    };

    reader.readAsText(file)

}

//Outputs all edges with given label
function getAllEdgesWithLabel(edges, label) {

    let tempArray = []

    for (let index = 0; index < edges.length; index++) {

        if (edges[index].label == label) {
        tempArray.push(edges[index]);
        }

    }

    return tempArray;

    }

//Removes object with a given ID from the given array
function removeObjectWithId(arr, id, edge) {
    if (edge) {
        const objWithIdIndex = arr.findIndex((obj) => obj.from === edge.from && obj.to === edge.to);

        if (objWithIdIndex > -1) {
        arr.splice(objWithIdIndex, 1);
        }

    }


    const objWithIdIndex = arr.findIndex((obj) => obj.id === id);

    if (objWithIdIndex > -1) {
        arr.splice(objWithIdIndex, 1);
    }

    return arr;
    }


//gets all groups that are set to hidden = true
function legendInvisibleGroups(options) {

    let invisibleGroups = [];

    for (const [key, value] of Object.entries(options.groups)) {

        for (const [subKey, subValue] of Object.entries(value)) {
        if (subValue == true) {

            invisibleGroups.push(key);
        }
        }
    }

    // let legend = document.getElementById("legendContainer");
    // let children = Array.from(legend.children);

    // let invisibleGroups = [];

    // children.forEach(child => {

    //   if(window.getComputedStyle(child.children[1]).backgroundColor == "rgb(255, 255, 255)"){

    //     invisibleGroups.push(child.children[1].innerHTML);

    //   }

    // });

    return invisibleGroups;

    }

function changeColorDropdown(id, valueToSelect) {
    let element = document.querySelector('#' + id + ' select');
    element.value = valueToSelect;
}

function changeStartEndColorDropdown(id, valueToSelect) {
    let element = document.querySelector('#' + id);
    element.value = valueToSelect;
}

  //generates the values array for the color gradient
function createValuesArray(paths) {
  
    let valueArray = [];
  
    for(let i = 0; i < paths.length; i++) {
  
        valueArray.push(paths[i][paths[i].length - 1].label);
        
    }
    return valueArray;
  
  }

    //creates an array with all start nodes that are in multiple paths
    function createOverlapArray(paths) {
    
        let overlap = [];
      
        for(let i = 0 ; i < paths.length; i++) {
          for(let j = 0; j < paths.length; j++) {
    
            if(i == j) {
              continue;
            }
    
            if(paths[i][0].id == paths[j][0].id){
              overlap.push(paths[i][0].id);
            }
        
          }
        }
      
        return overlap;
      
    }

    function containsOnlyNumbers(array) {
        for(let i = 0; i < array.length; i++) {
          if(isNaN(array[i])) {
            return false;
          }
        }
        return true;
      }


      
export {
    imageToNode,
    csvToNode,
    videoToNode,
    getAllEdgesWithLabel,
    removeObjectWithId,
    legendInvisibleGroups,
    changeColorDropdown,
    changeStartEndColorDropdown,
    searchJSON,
    containsOnlyNumbers,
    createValuesArray,
    createOverlapArray,

}