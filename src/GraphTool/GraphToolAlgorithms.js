// gets all nodes that are reachable from the given node ID
function getAllReachableNodesTo (nodeId, excludeIds, reachableNodes) {
  if (reachableNodes.includes(nodeId) || excludeIds.includes(nodeId)) {
    return []
  }
  const children = this.network.getConnectedNodes(nodeId, 'to')
  reachableNodes.push(nodeId)
  for (let i = 0; i < children.length; i++) {
    this.getAllReachableNodesTo(children[i], excludeIds, reachableNodes)
    if (!reachableNodes.includes(children[i])) {
      reachableNodes.push(children[i])
    }
  }
  return (reachableNodes)
}

// deletes the reachable nodes from the given node ID
function deleteNodesChildren (nodeId, deleteEdge, clickedNode) {
  const excludedIds = []
  if (deleteEdge === true) { // eslint-disable-line no-empty
  } else {
    excludedIds.push(nodeId)
  }

  let reachableNodesTo = []

  for (let i = 0; i < this.configFile.root_node_objects.length; i++) {
    const tempReachableNodesTo = this.getAllReachableNodesTo('jsondata/' + this.configFile.root_node_objects[i].node_id, excludedIds, reachableNodesTo)

    reachableNodesTo = [...reachableNodesTo, ...tempReachableNodesTo]
  }

  const nodesToDelete = []
  const allIds = this.nodes.getIds()

  for (let i = 0; i < allIds.length; i++) {
    if (allIds[i] == nodeId) { // eslint-disable-line eqeqeq
      this.deleteEdges(nodeId)
      continue
    }

    if (reachableNodesTo.includes(allIds[i])) {
      continue
    }

    nodesToDelete.push(allIds[i])
    this.deleteEdges(allIds[i])

    this.nodes.remove(allIds[i])
  }
  return nodesToDelete
}

// deletes edges that are connected to the given node ID
function deleteEdges (nodeID) {
  const fromEdges = this.edges.get({
    filter: function (item) {
      return item.from == nodeID // eslint-disable-line eqeqeq
    }
  })
  for (let j = 0; j < fromEdges.length; j++) {
    this.edges.remove(fromEdges[j])

    // let edges = this.removeObjectWithId(this.edges.get(), false, fromEdges[j])
  }
}
// deleteEdges(nodeID) {

//   // this.network.getConnectedEdges(nodeID).forEach((edgeID) => {
//   //   this.edges.remove(edgeID)

//   // })

//   // delete from drawer edges list. // TODO: sync drawer edges with GraphTool edges

//   var fromEdges = this.edges.get({
//        filter: function (item) {
//          return item.from == nodeID;
//        }
//      });

//      for (var j = 0; j < fromEdges.length; j++) {
//        this.edges.remove(fromthis.edges.get(j));

//        edges = this.removeObjectWithId(edges, false, fromthis.edges.get(j))
//      }
// }

// Returns all paths between startNode and endNode (main function)
function findAllPaths (startNode, endNode) {
  const visitedNodes = []
  const currentPath = []
  const allPaths = []
  this.dfs(startNode, endNode, currentPath, allPaths, visitedNodes)
  return allPaths
}

// Algorithm to search for all paths between two nodes
function dfs (start, end, currentPath, allPaths, visitedNodes) {
  if (visitedNodes.includes(start)) return
  visitedNodes.push(start)
  currentPath.push(start)
  if (start == end) { // eslint-disable-line eqeqeq
    const localCurrentPath = currentPath.slice()
    allPaths.push(localCurrentPath)
    this.removeItem(visitedNodes, start)
    currentPath.pop()
    return
  }
  const neighbours = this.network.getConnectedNodes(start)
  for (let i = 0; i < neighbours.length; i++) {
    const current = neighbours[i]
    this.dfs(current, end, currentPath, allPaths, visitedNodes)
  }
  currentPath.pop()
  this.removeItem(visitedNodes, start)
}

// Gets Path array with nodes, returns all possible edge paths
function getEdgeLabelStringsForPath (path) {
  const allEdgePaths = this.getEdgePathsForPath(path)
  const allStrings = new Array(allEdgePaths.length)
  for (let i = 0; i < allEdgePaths.length; i++) {
    let s = ''
    for (let j = 0; j < allEdgePaths[i].length; j++) {
      const edge = allEdgePaths[i][j]
      let label = edge.label
      const nodeId1 = path[j]
      const nodeId2 = path[j + 1]
      if (edge.to == nodeId1 && edge.from == nodeId2) { // eslint-disable-line eqeqeq
        label = this.reverseLabel(label)
      }
      if (j == (allEdgePaths[i].length - 1)) { // eslint-disable-line eqeqeq
        s = s + label
      } else {
        s = s + label + '.'
      }
    }
    allStrings[i] = s
  }
  return allStrings
}

// Gets Path arrays with nodes, returns all possible edge paths (main function)
function getAllStringsForAllPaths (paths) {
  const arrayOfAllStrings = []
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]
    const allStrings = this.getEdgeLabelStringsForPath(path)
    arrayOfAllStrings.push(allStrings)
  }
  return arrayOfAllStrings
}

// Gets Path array with nodes, returns Cartesian Product  of edges
function getEdgePathsForPath (path) {
  const arraysOfEdgesForNodeInPath = []
  for (let i = 1; i < path.length; i++) {
    const edgesBetween = this.getAllEdgesBetween(path[i - 1], path[i])
    const localedgesBetween = edgesBetween.slice()

    arraysOfEdgesForNodeInPath.push(localedgesBetween)
  }
  const allEdgePaths = this.getAllCombs(arraysOfEdgesForNodeInPath)
  return allEdgePaths
}

// Given Label is reversed with "-" or "-" is removed
function reverseLabel (label) {
  if (label[0] == '-') { // eslint-disable-line eqeqeq
    return label.substring(1)
  } else {
    return '-' + label
  }
}

// The function getAllEdgesBetween() returns all edges between two nodes
function getAllEdgesBetween (node1, node2) {
  return this.edges.get().filter(function (edge) {
    return (edge.from == node1 && edge.to == node2) || (edge.from == node2 && edge.to == node1) // eslint-disable-line eqeqeq
  })
}

// Cartesian Product of arrays
function cartesianProduct (arr) {
  return arr.reduce(function (a, b) {
    return a.map(function (x) {
      return b.map(function (y) {
        return x.concat([y])
      })
    }).reduce(function (a, b) { return a.concat(b) }, [])
  }, [[]])
}

// Cartesian Product of given arrays
function getAllCombs (arrays) {
  const allCombs = this.cartesianProduct(arrays)
  return allCombs
}

// Gets all start nodes and end nodes for the given path

function getStartAndEndNodesForPath (path) {
  const startNodes = []
  const endNodes = []

  // Get all edges that match the first element of the path
  const allStartEdges = this.edges.get().filter((edge) => {
    return edge.label == path[0] // eslint-disable-line eqeqeq
  })

  // For each start edge, get the "from" node and add it to the start nodes array
  allStartEdges.forEach((startEdge) => {
    const fromNodeId = startEdge.from

    startNodes.push(this.nodes.get(fromNodeId))
  })

  // Get all edges that match the last element of the path
  const allEndEdges = this.edges.get().filter((edge) => {
    return edge.label == path[path.length - 1] // eslint-disable-line eqeqeq
  })

  // For each end edge, get the "to" node and add it to the end nodes array
  allEndEdges.forEach((endEdge) => {
    const toNodeId = endEdge.to

    endNodes.push(this.nodes.get(toNodeId))
  })

  return { startNodes, endNodes }
}
// Compares the given path with the current paths and outputs the path nodes if they are equal
function comparePaths (path, currentPaths, pathNodes) {
  for (let i = 0; i < currentPaths.length; i++) {
    if (path.join('.') == currentPaths[i]) { // eslint-disable-line eqeqeq
      return pathNodes[0]
    }
  }

  return false
}

export {

  getAllReachableNodesTo,
  deleteNodesChildren,
  deleteEdges,
  findAllPaths,
  dfs,
  getEdgeLabelStringsForPath,
  getAllStringsForAllPaths,
  getEdgePathsForPath,
  reverseLabel,
  getAllEdgesBetween,
  cartesianProduct,
  getAllCombs,
  getStartAndEndNodesForPath,
  comparePaths

}
