const $ = require('jquery')
// const GD = require("./GraphDrawer.js");
// const GT = require("./GraphTool.js");
const Graph = require('./Graph/Graph.js')

// let clicked = {};
$(document).ready(function () {

  // console.log(graphtool.getAllStringsForAllPaths(graphtool.findAllPaths("jsondata/Item:MyProject/budget/1/value","jsondata/Item:MyProject")))

  // let result = jsonpath.query(draw.file, '$..[?(@=="2000")]');

  // function pathIsObjectInObject(paths) {

  //   for (let i = 0; i < paths.length; i++) {

  //     let path = paths[i].split(".");

  //     if (Array.isArray(data[path[1]][path[2]]) && typeof data[path[1]][path[2]][0] == 'object' && data[path[1]][path[2]][0] != null) {

  //       let startId = 0;

  //       for (let i = 2; i < path.length; i += 2) {

  //         if (!(path[i + 1] == undefined)) {
  //           const connectedNodeIds = graphtool.network.getConnectedNodes(startId, "to");

  //           const connectedNodes = graphtool.nodes.get(connectedNodeIds);

  //           const filteredNodes = connectedNodes.filter(node => node.label == path[i]);

  //           const filteredNodeIds = filteredNodes.map(node => node.id);

  //           let params = {
  //             nodes: [filteredNodeIds[path[i + 1]]]
  //           }

  //           graphtool.expandNodes(params);

  //           startId = filteredNodeIds[path[i + 1]];

  //         }

  //       }

  //     } else {

  //     }
  //   }
  // }

})

export {

  Graph
  // GT,
  // GD

}
