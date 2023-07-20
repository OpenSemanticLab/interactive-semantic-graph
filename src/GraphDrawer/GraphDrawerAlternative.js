function createNxGraph () {
  const MDG = new jsnx.MultiDiGraph() // a jsNetworkX MultiDiGraph

  const recursionCallback = (obj, args) => {
    MDG.addNode(String(args.currentPath), {
      obj
    })
    MDG.addEdge(String(args.previousPath), String(args.currentPath), {
      label: args.key
    }) //, {"id":(String(args.currentPath)+args.key),"key":args.key})
  }

  args = {}
  utils.callbackObjectRecursion(this.file, recursionCallback, args)

  // replace Array nodes
  for (const val of MDG.nodes(true)) {
    const node_id = val[0]
    const node_data = val[1]

    if (Array.isArray(node_data.obj)) {
      let inEdge
      let baseNodeId
      let inEdgeData
      for (inEdge of MDG.inEdges(node_id, true)) {
        baseNodeId = inEdge[0]
        inEdgeData = inEdge[2]
      }
      // create edges between base of in edge and targets of out edges
      for (const outEdge of MDG.outEdges(node_id)) {
        MDG.addEdge(baseNodeId, outEdge[1], inEdgeData)
      }

      MDG.removeNode(node_id)
    }
  }

  // resolve and replace references
  for (const val of MDG.nodes(true)) {
    const node_id = val[0]
    const node_data = val[1]
    if (typeof (node_data.obj) === 'string') {
      const check_paths = [
        ['jsondata', node_data.obj],
        ['jsonschema', node_data.obj]
      ]
      for (const check_path of check_paths) {
        if (MDG.hasNode(String(check_path))) {
          for (const inEdge of MDG.inEdges(node_id, true)) {
            MDG.addEdge(inEdge[0], String(check_path), inEdge[2])
            MDG.removeNode(inEdge[1])
          }
        }
      }
    }
  }

  // create Vis data set from nx MultiDiGraph
  const visNodes = new vis.DataSet()
  const visEdges = new vis.DataSet()

  for (const id of MDG.nodes()) {
    let node

    node = {
      id,
      label: String(id),
      data: MDG.nodes()[id]
    }
    visNodes.update(node)
  }

  for (const i in MDG.edges()) {
    let edge_arr
    let edge
    edge_arr = MDG.edges(true)[i]

    edge = {
      from: edge_arr[0],
      to: edge_arr[1],
      data: edge_arr[2],
      label: edge_arr[2].label
    }
    visEdges.update(edge)
  }

  const container = document.getElementById('mynetwork')
  const data = {
    nodes: visNodes,
    edges: visEdges
  }

  const options = {
    interaction: {
      hover: true,
      multiselect: true
    },
    manipulation: {
      enabled: true
    },
    edges: {
      arrows: 'to'
    },
    groups: {
      useDefaultGroups: false
    }
  }
  const network = new vis.Network(container, data, options)

  // color nodes in path
  const path = jsnx.bidirectionalShortestPath(new jsnx.Graph(MDG), 'jsonschema,Category:Item,properties,label,0,items,properties,text', 'jsondata,Item:MyProject,budget,1,budget,1,year', 19)

  function colorByPath (visNodes, path) {
    for (const node of visNodes.get()) {
      if (path.includes(node.id)) {
        node.color = 'red'
      } else {
        node.color = 'blue'
      }
      visNodes.update(node)
    }
  }
  colorByPath(visNodes, path)
}

export {
  createNxGraph
}
