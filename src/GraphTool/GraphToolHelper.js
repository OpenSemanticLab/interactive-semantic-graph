const jsonpath = require('jsonpath')
/**
 *
 * @param {JSON} data main JSON file
 * @param {string} searchValue value to search for
 * @returns {Array} array of paths to the search value
 */
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
/**
 *
 * @param {Array} edges array with visjs edge objects
 * @param {string} label label to search for
 * @returns {Array} array with visjs edge objects
 */
function getAllEdgesWithLabel (edges, label) {
  const tempArray = []

  for (let index = 0; index < edges.length; index++) {
    if (edges[index].label === label) {
      tempArray.push(edges[index])
    }
  }

  return tempArray
}

// Removes object with a given ID from the given array
/**
 *
 * @param {Array} arr array with visjs edge objects
 * @param {string} id id to search for
 * @param {JSON} edge visjs edge object
 * @returns {Array} array with visjs edge objects
 */
function removeObjectWithId (arr, id, edge) {
  if (edge) {
    const objWithIdIndex = arr.findIndex((obj) => obj.from === edge.from && obj.to === edge.to)

    if (objWithIdIndex > -1) {
      arr.splice(objWithIdIndex, 1)
    }
  }

  const objWithIdIndex = arr.findIndex((obj) => obj.id === id)

  if (objWithIdIndex > -1) {
    arr.splice(objWithIdIndex, 1)
  }

  return arr
}

// gets all groups that are set to hidden = true
/**
 *
 * @param {JSON} options visjs options
 * @returns {Array} array with group names
 */
function legendInvisibleGroups (options) {
  const invisibleGroups = []

  for (const [key, value] of Object.entries(options.groups)) {
    for (const [subKey, subValue] of Object.entries(value)) { // eslint-disable-line no-unused-vars
      if (subValue === true) {
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

/**
 *
 * @param {string} id id of the dropdown
 * @param {string} valueToSelect value to select
 */
function changeColorDropdown (id, valueToSelect) {
  const element = document.querySelector('#' + id + ' select')
  element.value = valueToSelect
}
/**
 *
 * @param {string} id id of the dropdown
 * @param {string} valueToSelect value to select
 */
function changeStartEndColorDropdown (id, valueToSelect) {
  const element = document.querySelector('#' + id)
  element.value = valueToSelect
}

// generates the values array for the color gradient
/**
 *
 * @param {Array} paths array with paths
 * @returns {Array} array with values
 */
function createValuesArray (paths) {
  const valueArray = []

  for (let i = 0; i < paths.length; i++) {
    valueArray.push(paths[i][paths[i].length - 1].label)
  }
  return valueArray
}

// creates an array with all start nodes that are in multiple paths
/**
 *
 * @param {Array} paths array with paths
 * @returns {Array} array with node ids that overlap on paths
 */
function createOverlapArray (paths) {
  const overlap = []

  for (let i = 0; i < paths.length; i++) {
    for (let j = 0; j < paths.length; j++) {
      if (i == j) { // eslint-disable-line eqeqeq
        continue
      }

      if (paths[i][0].id === paths[j][0].id) {
        overlap.push(paths[i][0].id)
      }
    }
  }

  return overlap
}
/**
 *
 * @param {Array} array array with values
 * @returns {boolean} true if array contains only numbers
 */
function containsOnlyNumbers (array) {
  for (let i = 0; i < array.length; i++) {
    if (isNaN(array[i])) {
      return false
    }
  }
  return true
}
/**
 * @function updatePositions updates the positions of the nodes in the graph (redraw)
 */
function updatePositions () {
  this.nodes.forEach((node) => {
    // setting the current position is necessary to prevent snap-back to initial position

    const position = this.network.getPosition(node.id)

    node.x = position.x
    node.y = position.y
    this.nodes.update(node)
  })
}
/**
 *
 * @param {string} node visjs node id
 * @returns {boolean} true if node is last in path
 */
function isNodeLastInPath (node) {
  const edges = this.edges.get()

  for (let i = 0; i < edges.length; i++) {
    if (edges[i].from === node) {
      return false
    }
  }

  return true
}

// checks if the given node id exists in the current graph
/**
 *
 * @param {string} nodeId visjs node id
 * @returns {boolean} true if node exists
 */
function itemExists (nodeId) {
  if (this.nodes.get(nodeId)) {
    return true
  }

  return false
}
// checks if the given node is open/expanded
/**
 *
 * @param {string} nodeId visjs node id
 * @returns {boolean} true if node is open
 */
function isNodeOpen (nodeId) {
  const edges = this.edges.get()

  for (const edge of edges) {
    if (edge.from === nodeId.trim()) {
      return true
    }
  }

  return false
}

// Removes the given value from the given array
/**
 *
 * @param {Array} arr array with values
 * @param {string} value value to remove
 * @returns {Array} array with values removed
 */
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
