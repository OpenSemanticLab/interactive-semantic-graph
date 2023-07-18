

//gets all nodes that are reachable from the given node ID
function getAllReachableNodesTo(nodeId, excludeIds, reachableNodes) {

    if (reachableNodes.includes(nodeId) || excludeIds.includes(nodeId)) {
        return [];
    }
    let children = this.network.getConnectedNodes(nodeId, "to");
    reachableNodes.push(nodeId);
    for (let i = 0; i < children.length; i++) {
        this.getAllReachableNodesTo(children[i], excludeIds, reachableNodes);
        if (!reachableNodes.includes(children[i])) {
            reachableNodes.push(children[i]);
        }

    }
    return (reachableNodes)
}

//deletes the reachable nodes from the given node ID
function deleteNodesChildren(nodeId, deleteEdge, clickedNode) {


    let excludedIds = [];
    if (deleteEdge === true) {
    } else {
        excludedIds.push(nodeId);
    }

    let reachableNodesTo = [];

    for (let i = 0; i < this.configFile.root_node_objects.length; i++) {

        let tempReachableNodesTo = this.getAllReachableNodesTo('jsondata/' + this.configFile.root_node_objects[i].node_id, excludedIds, reachableNodesTo);

        reachableNodesTo = [...reachableNodesTo, ...tempReachableNodesTo];

    }


    let nodesToDelete = [];
    let allIds = this.nodes.getIds();


    for (let i = 0; i < allIds.length; i++) {

        if (allIds[i] == nodeId) {
            this.deleteEdges(nodeId);
            continue;
        }

        if (reachableNodesTo.includes(allIds[i])) {

            continue;
        }

        nodesToDelete.push(allIds[i]);
        this.deleteEdges(allIds[i]);


        this.nodes.remove(allIds[i]);

    }
    return nodesToDelete;
}

//deletes edges that are connected to the given node ID
function deleteEdges(nodeID) {
    var fromEdges = this.edges.get({
        filter: function (item) {
            return item.from == nodeID;
        }
    });
    for (var j = 0; j < fromEdges.length; j++) {
        this.edges.remove(fromEdges[j]);

        //let edges = this.removeObjectWithId(this.edges.get(), false, fromEdges[j])
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


//Returns all paths between startNode and endNode (main function)
function findAllPaths(startNode, endNode) {
    var visitedNodes = [];
    var currentPath = [];
    var allPaths = [];
    this.dfs(startNode, endNode, currentPath, allPaths, visitedNodes);
    return allPaths;
}

//Algorithm to search for all paths between two nodes
function dfs(start, end, currentPath, allPaths, visitedNodes) {
    if (visitedNodes.includes(start)) return;
    visitedNodes.push(start);
    currentPath.push(start);
    if (start == end) {
        var localCurrentPath = currentPath.slice();
        allPaths.push(localCurrentPath);
        this.removeItem(visitedNodes, start);
        currentPath.pop();
        return;
    }
    var neighbours = this.network.getConnectedNodes(start);
    for (var i = 0; i < neighbours.length; i++) {
        var current = neighbours[i];
        this.dfs(current, end, currentPath, allPaths, visitedNodes);
    }
    currentPath.pop();
    this.removeItem(visitedNodes, start);


}

//Gets Path array with nodes, returns all possible edge paths
function getEdgeLabelStringsForPath(path) {
    var allEdgePaths = this.getEdgePathsForPath(path);
    var allStrings = new Array(allEdgePaths.length);
    for (var i = 0; i < allEdgePaths.length; i++) {
        var s = "";
        for (var j = 0; j < allEdgePaths[i].length; j++) {
            var edge = allEdgePaths[i][j];
            var label = edge.label;
            var nodeId1 = path[j];
            var nodeId2 = path[j + 1];
            if (edge.to == nodeId1 && edge.from == nodeId2) {
                label = this.reverseLabel(label);
            }
            if (j == (allEdgePaths[i].length - 1)) {
                s = s + label;
            } else {
                s = s + label + ".";
            }
        }
        allStrings[i] = s;
    }
    return allStrings;
}

//Gets Path arrays with nodes, returns all possible edge paths (main function)
function getAllStringsForAllPaths(paths) {
    var arrayOfAllStrings = [];
    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];
        var allStrings = this.getEdgeLabelStringsForPath(path);
        arrayOfAllStrings.push(allStrings);
    }
    return arrayOfAllStrings;
}

//Gets Path array with nodes, returns Cartesian Product  of edges
function getEdgePathsForPath(path) {
    var arraysOfEdgesForNodeInPath = [];
    for (var i = 1; i < path.length; i++) {
        var edgesBetween = this.getAllEdgesBetween(path[i - 1], path[i]);
        var localedgesBetween = edgesBetween.slice();

        arraysOfEdgesForNodeInPath.push(localedgesBetween);
    }
    var allEdgePaths = this.getAllCombs(arraysOfEdgesForNodeInPath);
    return allEdgePaths;
}

//Given Label is reversed with "-" or "-" is removed
function reverseLabel(label) {
    if (label[0] == "-") {
        return label.substring(1);
    } else {
        return "-" + label;
    }
}

//The function getAllEdgesBetween() returns all edges between two nodes
function getAllEdgesBetween(node1, node2) {
    return this.edges.get().filter(function (edge) {
        return (edge.from === node1 && edge.to === node2) || (edge.from === node2 && edge.to === node1);
    });
}

//Cartesian Product of arrays
function cartesianProduct(arr) {
    return arr.reduce(function (a, b) {
        return a.map(function (x) {
            return b.map(function (y) {
                return x.concat([y]);
            })
        }).reduce(function (a, b) { return a.concat(b) }, [])
    }, [[]])
}

//Cartesian Product of given arrays
function getAllCombs(arrays) {
    var allCombs = this.cartesianProduct(arrays);
    return allCombs;
}

//Gets all start nodes and end nodes for the given path

function getStartAndEndNodesForPath(path) {
    let startNodes = [];
    let endNodes = [];

    // Get all edges that match the first element of the path
    let allStartEdges = this.edges.get().filter((edge) => {

        return edge.label == path[0];

    });

    // For each start edge, get the "from" node and add it to the start nodes array
    allStartEdges.forEach((startEdge) => {

        let fromNodeId = startEdge.from;

        startNodes.push(this.nodes.get(fromNodeId));

    });

    // Get all edges that match the last element of the path
    let allEndEdges = this.edges.get().filter((edge) => {

        return edge.label == path[path.length - 1];

    });

    // For each end edge, get the "to" node and add it to the end nodes array
    allEndEdges.forEach((endEdge) => {

        let toNodeId = endEdge.to;

        endNodes.push(this.nodes.get(toNodeId));

    });

    return { startNodes, endNodes };

}
//Compares the given path with the current paths and outputs the path nodes if they are equal
function comparePaths(path, currentPaths, pathNodes) {

    for (let i = 0; i < currentPaths.length; i++) {

        if (path.join(".") === currentPaths[i]) {

            return pathNodes[0];

        }
    }

    return false;

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