/**
 *
 * @param {Array} labelArray
 * @returns {string} label in correct language
 */
function getLabelFromLabelArray (labelArray) {
  let label
  for (const key in labelArray) {
    label = labelArray[key].text
    if (labelArray[key].lang === this.lang) {
      return (label)
    }
  }
}

/**
 *
 * @param {Array} pathArray Array of path elements
 * @returns {string} id of the item
 */

function getIdFromPathArray (pathArray) {
  let idString
  for (const i in pathArray) {
    if (i == 0) { // eslint-disable-line eqeqeq
      idString = pathArray[0]
    } else {
      idString += '/' + pathArray[i]
    }
  }
  return idString
}

// Creates Array of arrays Array of all contexts
/**
 *
 * @param {JSON} file Main file with JSON data
 * @param {JSON} schema Schema of the item
 * @param {Array} fullContext empty array
 * @returns {Array} Array of item context
 */
function getSchemaContextRecursive (file, schema, fullContext = []) {
  // fullContext = fullContext

  // extract schema name from schema url, e. g. /wiki/Category:Entity?action=raw&slot=jsonschema
  // Todo: replace with callback
  schema = schema.split('/')[schema.split('/').length - 1].split('?')[0]

  const startContext = file.jsonschema[schema]['@context']

  if (Array.isArray(startContext)) {
    for (let i = 0; i < startContext.length; i++) {
      if (!(typeof startContext[i] === 'object' && startContext[i] != null)) {
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

/**
 *
 * @param {Array} pathArray Array of path elements
 * @returns {string} current json key
 */
function getCurrentJSONKey (pathArray) {
  let jsonKey

  if (isNaN(pathArray[pathArray.length - 1])) {
    jsonKey = pathArray[pathArray.length - 1]
  } else {
    jsonKey = pathArray[pathArray.length - 2]
  }

  return jsonKey
}

/**
 *
 * @param {JSON} context Context of the item
 * @param {string} key Key of the item
 * @returns {string} label of the item
 */
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

/**
 *
 * @param {JSON} file Main file with JSON data
 * @returns {JSON} start item
 */
function getStartItem (file) {
  return (this.rootItem)
}

/**
 *
 * @param {string} item Item name
 * @returns {Array} path array of the item
 */
function getItemPathArray (item) {
  for (const key in this.file.jsondata) {
    if (key === item) {
      return ['jsondata', key]
    }
  }
}

// Creates a context object out of the multidimensional array created by the recursive context function
/**
 *
 * @param {JSON} file Main file with JSON data
 * @param {string} item Item name
 * @returns {JSON} context of the item
 */
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

/**
 *
 * @param {string} property Property name
 * @returns {number} angle of the property
 */
function getAngleFromProperty (property) {
  const hsla = this.colorObj[property]
  let angle = hsla.split(',')[0].split('(')[1]
  angle = angle / 180 * Math.PI
  return angle
}

/**
 *
 * @param {string} item Item name
 * @param {string} relativePath  empty string
 * @returns {string} label of the item
 */
function getLabelFromItem (item, relativePath = '') {
  // check language for root node and set label according to this.lang

  const labelArray = this.file.jsondata[item].label
  const label = 'item'
  if (labelArray) {
    this.getLabelFromLabelArray(labelArray)
  }
  return ('Itemlabel, ' + label)
}

/**
 *
 * @param {Array} pathArr Array of path elements
 * @returns {Array} value of the item in the file
 */
function getValueFromPathArray (pathArr) {
  let object = this.file

  for (const key in pathArr) {
    object = object[pathArr[key]]
  }

  return (object)
}

/**
 *
 * @param {Array} pathArr Array of path elements
 * @returns {string} label of the node
 */
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

/**
 *
 * @param {JSON} file Main file with JSON data
 * @param {string} objectName Name of the object
 * @param {string} separator Separator
 */
function loadItemToFile (file, objectName, separator) {
  // if (this.handleCallbacks({ id: 'onBeforeLoadItemToFile', params: { graph: this, file, objectName } })) {
  let item

  if (!Object.keys(file.jsondata).includes(objectName) && objectName.includes(separator)) {
    item = getItem(objectName)
  }

  if (item) {
    file.jsondata[objectName] = item.jsondata
    file.jsonschema[item.jsondata.type[0]] = item.jsonschema
  }
  // }
}

/**
 *
 * @param {string} itemName Name of the item
 * @returns {JSON} extended main file with JSON data
 */
function getItem (itemName) {
  // if (this.handleCallbacks({ id: 'onBeforeGetItem', params: { graph: this, itemName } })) {
  const fullFile = {
    jsonschema: {
      'Category:Entity': {
        '@context': {
          label: 'Property:HasLabel'
        }
      },
      'Category:Item': {
        '@context': [
          'Category:Entity',
          {
            member: { '@id': 'Property:HasMember', '@type': '@id' },
            other: { '@id': 'Property:HasOther', '@type': '@id' },
            budget: { '@id': 'Property:HasBudget', '@type': '@id' },
            some_property: { '@id': 'Property:HasSomeItem', '@type': '@id' },
            some_literal: 'Property:HasSomeLiteral'
          }
        ],
        properties: {
          label: [{
            type: 'array',
            title: 'Labels',
            items: {
              type: 'object',
              title: 'Label',
              properties: {
                text: {},
                lang: {}
              }
            }
          }],
          member: {
            type: 'string',
            title: 'Member'
          },
          budget: {
            type: 'array',
            title: 'Budgets',
            items: {
              type: 'object',
              title: 'Budget',
              properties: {
                year: { title: 'Year' },
                value: { title: 'BudgetValue' }
              }
            }
          }
        }
      }

    },
    jsondata: {
      'Item:MyProject': {
        type: ['Category:Item'],
        label: [{ text: 'My Project', lang: 'en' }, { text: 'Projekt', lang: 'de' }],
        member: ['Item:SomePerson', 'Item:SomePerson'], // "Item:MyOtherItem"
        other: ['Item:SomePerson'],
        some_literal: ['Some string', 'Some', 'string'],
        not_in_context: 'Not in Context',
        budget: [{
          year: '2000',
          value: '10000',
          budget: [{
            year: '2023',
            value: '10'
          }, {
            year: '2022',
            value: '20'
          }]
        }, {
          year: '2001',
          value: '20000'
        }, {
          year: '2002',
          value: '30000'
        }, {
          year: '2003',
          value: ['40000', '50000']
        }]
      },
      'Item:SomePerson': {
        type: ['Category:Item'],
        label: [{ text: 'Max Mustermann', lang: 'en' }],
        some_property: 'Item:MyOtherItem'
      },
      'Property:HasMember': {
        type: ['Category:Property'],
        label: [{ text: 'Has Member', lang: 'en' }]
      },
      'Item:MyOtherItem': {
        type: ['Category:Item'],
        label: [{ text: 'My Other', lang: 'en' }],
        member: ['Item:MyNewItem'],
        some_literal: 'Some string',
        not_in_context: 'Not in Context',
        budget: [{
          year: '2022',
          value: '10'
        }, {
          year: '2022',
          value: '20'
        }]

      },
      'Item:MyNewItem': {
        type: ['Category:Item'],
        label: [{ text: 'My New Other', lang: 'en' }],
        other: ['Item:MySecondItem']

      },
      'Item:MySecondItem': {
        type: ['Category:Item'],
        label: [{ text: 'My Second Other', lang: 'en' }]

      }

    }
  }

  let apiGET = false
  if (fullFile.jsondata[itemName] !== undefined) {
    apiGET = {}
    apiGET.jsondata = fullFile.jsondata[itemName]
    apiGET.jsonschema = fullFile.jsonschema[fullFile.jsondata[itemName].type[0]]
  }

  if (apiGET) {
    return apiGET
  } else {
    return false
  }
  // }
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
  getNodeLabelFromPathArray,
  loadItemToFile,
  getItem
}
