const jsnx = require('jsnetworkx')
const utils = require('../utils.js')
const vis = require('vis-network/standalone/esm/index.js')

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

  const args = {}
  utils.callbackObjectRecursion(this.file, recursionCallback, args)

  // replace Array nodes
  for (const val of MDG.nodes(true)) {
    const nodeId = val[0]
    const nodeData = val[1]

    if (Array.isArray(nodeData.obj)) {
      let inEdge
      let baseNodeId
      let inEdgeData
      for (inEdge of MDG.inEdges(nodeId, true)) {
        baseNodeId = inEdge[0]
        inEdgeData = inEdge[2]
      }
      // create edges between base of in edge and targets of out edges
      for (const outEdge of MDG.outEdges(nodeId)) {
        MDG.addEdge(baseNodeId, outEdge[1], inEdgeData)
      }

      MDG.removeNode(nodeId)
    }
  }

  // resolve and replace references
  for (const val of MDG.nodes(true)) {
    const nodeId = val[0]
    const nodeData = val[1]
    if (typeof (nodeData.obj) === 'string') {
      const checkPaths = [
        ['jsondata', nodeData.obj],
        ['jsonschema', nodeData.obj]
      ]
      for (const checkPath of checkPaths) {
        if (MDG.hasNode(String(checkPath))) {
          for (const inEdge of MDG.inEdges(nodeId, true)) {
            MDG.addEdge(inEdge[0], String(checkPath), inEdge[2])
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
    const node = {
      id,
      label: String(id),
      data: MDG.nodes()[id]
    }
    visNodes.update(node)
  }

  for (const i in MDG.edges()) {
    const edgeArr = MDG.edges(true)[i]
    const edge = {
      from: edgeArr[0],
      to: edgeArr[1],
      data: edgeArr[2],
      label: edgeArr[2].label
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
  const network = new vis.Network(container, data, options) // eslint-disable-line no-unused-vars

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
