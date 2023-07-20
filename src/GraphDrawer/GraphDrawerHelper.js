function getLabelFromLabelArray (labelArray) {
  let label
  for (const key in labelArray) {
    label = labelArray[key].text
    if (labelArray[key].lang == this.lang) {
      return (label)
    }
  }
}

function getIdFromPathArray (pathArray) {
  let idString
  for (const i in pathArray) {
    if (i == 0) {
      idString = pathArray[0]
    } else {
      idString += '/' + pathArray[i]
    }
  }
  return idString
}

// Creates Array of arrays Array of all contexts
function getSchemaContextRecursive (file, schema, fullContext = []) {
  fullContext = fullContext

  // extract schema name from schema url, e. g. /wiki/Category:Entity?action=raw&slot=jsonschema
  // Todo: replace with callback
  schema = schema.split('/')[schema.split('/').length - 1].split('?')[0]

  const startContext = file.jsonschema[schema]['@context']

  if (Array.isArray(startContext)) {
    for (let i = 0; i < startContext.length; i++) {
      if (!(typeof startContext[i] === 'object' && startContext[i] !== null)) {
        this.getSchemaContextRecursive(file, startContext[i], fullContext)
      } else {
        fullContext.push(startContext[i])
      }
    }
  } else {
    fullContext.push(startContext)
  }
  return fullContext
}

function getCurrentJSONKey (pathArray) {
  let jsonKey

  if (isNaN(pathArray[pathArray.length - 1])) {
    jsonKey = pathArray[pathArray.length - 1]
  } else {
    jsonKey = pathArray[pathArray.length - 2]
  }

  return jsonKey
}

function getLabelFromContext (context, key) {
  // get property string of shape: Property:PropertyLabel
  let propertyFullName = key
  if (typeof (context[key]) === 'object') {
    propertyFullName = context[key]['@id']
  }
  // replace by name with correct language if available

  if (this.file.jsondata[propertyFullName]) {
    propertyFullName = this.getLabelFromLabelArray(this.file.jsondata[propertyFullName].label)
    // propertyFullName = this.file.jsondata[propertyFullName]["label"][this.lang]
  }

  if (propertyFullName.startsWith('Property:')) {
    return (propertyFullName.replace('Property:', ''))
  }
  return (propertyFullName)
}

function getStartItem (file) {
  return (this.rootItem)
}

function getItemPathArray (item) {
  for (const key in this.file.jsondata) {
    if (key == item) {
      return ['jsondata', key]
    }
  }
}

// Creates a context object out of the multidimensional array created by the recursive context function
function getItemContextDefault (file, item) {
  const itemSchema = this.file.jsondata[item].type[0]
  const contextArrayOfObjects = this.getSchemaContextRecursive(file, itemSchema)
  const context = {}

  for (let i = 0; i < contextArrayOfObjects.length; i++) {
    const partContextKeys = Object.keys(contextArrayOfObjects[i])

    for (let j = 0; j < partContextKeys.length; j++) {
      context[partContextKeys[j]] = contextArrayOfObjects[i][partContextKeys[j]]
    }
  }

  if (this.handleCallbacks({
    id: 'onBeforeCreateContext',
    params: {
      graph: this,
      context
    }
  })) {
    return context
  }
}

function getAngleFromProperty (property) {
  const hsla = this.colorObj[property]
  let angle = hsla.split(',')[0].split('(')[1]
  angle = angle / 180 * Math.PI
  return angle
}

function getLabelFromItem (item, relativePath = '') {
  // check language for root node and set label according to this.lang

  const labelArray = this.file.jsondata[item].label
  const label = 'item'
  if (labelArray) {
    this.getLabelFromLabelArray(labelArray)
  }
  return ('Itemlabel, ' + label)
}

function getValueFromPathArray (pathArr) {
  let object = this.file

  for (const key in pathArr) {
    object = object[pathArr[key]]
  }

  return (object)
}

function getNodeLabelFromPathArray (pathArr) {
  const value = this.getValueFromPathArray(pathArr)

  if (!(typeof (value) === 'object') && !(this.file.jsondata[value])) {
    // literals
    return (value)
  }

  if (!(typeof (value) === 'object') && this.file.jsondata[value]) {
    return (this.getLabelFromLabelArray(this.file.jsondata[value].label))
  }

  // objects, arrays
  if (value.label) {
    if (!Array.isArray(value.label)) {
      // single label
      return (value.label)
    } else {
      // array of labels (for language)
      return (this.getLabelFromLabelArray(value.label))
    }
  }
  return (pathArr[pathArr.length - 2])// + "[" + pathArr[pathArr.length - 1] + "]")
}

export {
  getLabelFromLabelArray,
  getIdFromPathArray,
  getSchemaContextRecursive,
  getCurrentJSONKey,
  getLabelFromContext,
  getStartItem,
  getItemPathArray,
  getItemContextDefault,
  getAngleFromProperty,
  getLabelFromItem,
  getValueFromPathArray,
  getNodeLabelFromPathArray
}
