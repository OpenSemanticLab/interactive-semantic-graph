
//Adds a callback function to config 
function registerCallback(params) {
  this.config.callbacks[params.name].push(params.func)
}

function handleCallbacks(params) {
  let result = true;
  if (!this.config.callbacks[params.id]) return true;
  for (const callback of this.config.callbacks[params.id]) {
    if (!callback(params.params)) {
      result = false
      break;
    }
  }
  return result;
}

function onBeforeCreateEdgeDefault(edge) {
  this.registerPropertyColor(edge.label)
  return edge
}

function onBeforeCreateNodeDefault(node) {

  // set color
  if (node.incomingLabels.length > 0) {
    node.color = this.registerPropertyColor(node.incomingLabels[0])
  }

  //set group
  if (node.depth == 0) {
    node.group = "root",
      node.color = this.config.rootColor
  } else {
    node.group = node.incomingLabels[0]
  }

  return node
}



export {

  registerCallback,
  handleCallbacks,
  onBeforeCreateEdgeDefault,
  onBeforeCreateNodeDefault


}