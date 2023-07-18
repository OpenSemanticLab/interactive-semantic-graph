function createNxGraph() {

  let MDG = new jsnx.MultiDiGraph() // a jsNetworkX MultiDiGraph

  let recursionCallback = (obj, args) => {
    MDG.addNode(String(args.currentPath), {
      obj
    })
    MDG.addEdge(String(args.previousPath), String(args.currentPath), {
      "label": args.key
    }) //,{"id":(String(args.currentPath)+args.key),"key":args.key})
  }


  args = {}
  utils.callbackObjectRecursion(this.file, recursionCallback, args)

  // replace Array nodes 
  for (let val of MDG.nodes(true)) {
    let node_id = val[0]
    let node_data = val[1]

    if (Array.isArray(node_data.obj)) {
      let inEdge
      let baseNodeId
      let inEdgeData
      for (inEdge of MDG.inEdges(node_id, true)) {
        baseNodeId = inEdge[0]
        inEdgeData = inEdge[2]
      }
      // create edges between base of in edge and targets of out edges 
      for (let outEdge of MDG.outEdges(node_id)) {

        MDG.addEdge(baseNodeId, outEdge[1], inEdgeData)
      }

      MDG.removeNode(node_id)
    }
  }

  // resolve and replace references
  for (let val of MDG.nodes(true)) {
    let node_id = val[0]
    let node_data = val[1]
    if (typeof (node_data.obj) === "string") {
      let check_paths = [
        ["jsondata", node_data.obj],
        ["jsonschema", node_data.obj]
      ]
      for (let check_path of check_paths) {
        if (MDG.hasNode(String(check_path))) {


          for (let inEdge of MDG.inEdges(node_id, true)) {
            MDG.addEdge(inEdge[0], String(check_path), inEdge[2])
            MDG.removeNode(inEdge[1])
          }
        }
      }
    }
  }



  // create Vis data set from nx MultiDiGraph
  let visNodes = new vis.DataSet()
  let visEdges = new vis.DataSet()

  for (let id of MDG.nodes()) {
    let node

    node = {
      id: id,
      label: String(id),
      data: MDG.nodes()[id]
    }
    visNodes.update(node)
  }

  for (let i in MDG.edges()) {
    let edge_arr
    let edge
    edge_arr = MDG.edges(true)[i]

    edge = {
      "from": edge_arr[0],
      "to": edge_arr[1],
      "data": edge_arr[2],
      "label": edge_arr[2].label
    }
    visEdges.update(edge)
  }

  let container = document.getElementById('mynetwork');
  let data = {
    nodes: visNodes,
    edges: visEdges
  };

  let options = {
    interaction: {
      hover: true,
      multiselect: true,
    },
    manipulation: {
      enabled: true,
    },
    edges: {
      arrows: "to"
    },
    groups: {
      useDefaultGroups: false
    }
  }
  let network = new vis.Network(container, data, options);


  // color nodes in path
  let path = jsnx.bidirectionalShortestPath(new jsnx.Graph(MDG), "jsonschema,Category:Item,properties,label,0,items,properties,text", "jsondata,Item:MyProject,budget,1,budget,1,year", 19)

  function colorByPath(visNodes, path) {
    for (let node of visNodes.get()) {
      if (path.includes(node.id)) {
        node.color = "red"
      } else {
        node.color = "blue"
      }
      visNodes.update(node)
    }
  }
  colorByPath(visNodes, path)
}

export {
  createNxGraph
}