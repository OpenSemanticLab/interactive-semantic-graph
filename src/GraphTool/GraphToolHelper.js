const jsonpath = require('jsonpath')

function searchJSON (data, searchValue) {
  // const searchValue = '2022';
  // const jsonPathExpression = `$..[?(@=="${searchValue}")]`;
  const matches = jsonpath.query(data, `$..[?(@=="${searchValue}")]`)

  const result = [...new Set(matches.flatMap(match =>
    jsonpath.paths(data, `$..[?(@=="${match}")]`).map(key =>
        `${key.join('.')}` // : ${match}
    )
  ))]

  return result
}

// Outputs all edges with given label
function getAllEdgesWithLabel (edges, label) {
  const tempArray = []

  for (let index = 0; index < edges.length; index++) {
    if (edges[index].label == label) {
      tempArray.push(edges[index])
    }
  }

  return tempArray
}

// Removes object with a given ID from the given array
function removeObjectWithId (arr, id, edge) {
  if (edge) {
    const objWithIdIndex = arr.findIndex((obj) => obj.from == edge.from && obj.to == edge.to)

    if (objWithIdIndex > -1) {
      arr.splice(objWithIdIndex, 1)
    }
  }

  const objWithIdIndex = arr.findIndex((obj) => obj.id == id)

  if (objWithIdIndex > -1) {
    arr.splice(objWithIdIndex, 1)
  }

  return arr
}

// gets all groups that are set to hidden = true
function legendInvisibleGroups (options) {
  const invisibleGroups = []

  for (const [key, value] of Object.entries(options.groups)) {
    for (const [subKey, subValue] of Object.entries(value)) {
      if (subValue == true) {
        invisibleGroups.push(key)
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

  return invisibleGroups
}

function changeColorDropdown (id, valueToSelect) {
  const element = document.querySelector('#' + id + ' select')
  element.value = valueToSelect
}

function changeStartEndColorDropdown (id, valueToSelect) {
  const element = document.querySelector('#' + id)
  element.value = valueToSelect
}

// generates the values array for the color gradient
function createValuesArray (paths) {
  const valueArray = []

  for (let i = 0; i < paths.length; i++) {
    valueArray.push(paths[i][paths[i].length - 1].label)
  }
  return valueArray
}

// creates an array with all start nodes that are in multiple paths
function createOverlapArray (paths) {
  const overlap = []

  for (let i = 0; i < paths.length; i++) {
    for (let j = 0; j < paths.length; j++) {
      if (i == j) {
        continue
      }

      if (paths[i][0].id == paths[j][0].id) {
        overlap.push(paths[i][0].id)
      }
    }
  }

  return overlap
}

function containsOnlyNumbers (array) {
  for (let i = 0; i < array.length; i++) {
    if (isNaN(array[i])) {
      return false
    }
  }
  return true
}

function updatePositions () {
  this.nodes.forEach((node) => {
    // setting the current position is necessary to prevent snap-back to initial position

    const position = this.network.getPosition(node.id)

    node.x = position.x
    node.y = position.y
    this.nodes.update(node)
  })
}

function isNodeLastInPath (node) {
  const edges = this.edges.get()

  for (let i = 0; i < edges.length; i++) {
    if (edges[i].from == node) {
      return false
    }
  }

  return true
}

// checks if the given node id exists in the current graph
function itemExists (nodeId) {
  if (this.nodes.get(nodeId)) {
    return true
  }

  return false
}
// checks if the given node is open/expanded
function isNodeOpen (nodeId) {
  const edges = this.edges.get()

  for (const edge of edges) {
    if (edge.from == nodeId.trim()) {
      return true
    }
  }

  return false
}

// Removes the given value from the given array
function removeItem (arr, value) {
  const index = arr.indexOf(value)
  if (index > -1) {
    arr.splice(index, 1)
  }
  return arr
}

export {
  getAllEdgesWithLabel,
  removeObjectWithId,
  legendInvisibleGroups,
  changeColorDropdown,
  changeStartEndColorDropdown,
  searchJSON,
  containsOnlyNumbers,
  createValuesArray,
  createOverlapArray,
  updatePositions,
  isNodeLastInPath,
  itemExists,
  isNodeOpen,
  removeItem

}
