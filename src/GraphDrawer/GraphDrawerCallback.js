// Adds a callback function to config

/**
 *
 * @param {JSON} params params.name: name of the callback, params.func: callback function
 */
function registerCallback (params) {
  this.config.callbacks[params.name].push(params.func)
}

/**
 *
 * @param {JSON} params params.id: id of the callback, params.params: params for the callback function
 * @returns {boolean} true if all callbacks return true, false if not
 */

function handleCallbacks (params) {
  let result = true
  if (!this.config.callbacks[params.id]) return true
  for (const callback of this.config.callbacks[params.id]) {
    if (!callback(params.params)) {
      result = false
      break
    }
  }
  return result
}

/**
 *
 * @param {JSON} edge visjs edge object
 * @returns {JSON} visjs edge object
 */

function onBeforeCreateEdgeDefault (edge) {
  this.registerPropertyColor(edge.label)
  return edge
}

/**
 *
 * @param {JSON} node visjs node object
 * @returns {JSON} visjs node object
 */
function onBeforeCreateNodeDefault (node) {
  // set color
  if (node.incomingLabels.length > 0) {
    node.color = this.registerPropertyColor(node.incomingLabels[0])
  }

  // set group
  if (node.depth === 0) {
    node.group = 'root'
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
