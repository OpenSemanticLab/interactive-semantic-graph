function isObject (item) {
  return (item && typeof item == 'object' && !Array.isArray(item))
}

// from https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
function mergeDeep (target, source) {
  const output = Object.assign({}, target)
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) { Object.assign(output, { [key]: source[key] }) } else { output[key] = mergeDeep(target[key], source[key]) }
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    })
  }
  return output
}

function uuidv4 () {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}

function valueFromObjectPath (obj, path) {
  if (path = '') {
    return obj
  }
  for (var i = 0, path = path.split('.'), len = path.length; i < len; i++) {
    obj = obj[path[i]]
  };
  return obj
};

function callbackObjectRecursion (obj, callback, args) {
  if (args.recursionDepth == undefined) {
    args.recursionDepth = 0
  }
  if (args.baseObj == undefined) {
    args.baseObj = obj
  }
  if (!args.currentPath) {
    args.currentPath = []
  }
  callback(obj, args)

  if (typeof (obj) == 'object' && obj != null) {
    for (const key in obj) {
      const nextPath = JSON.parse(JSON.stringify(args.currentPath))
      nextPath.push(key)

      const nextArgs = JSON.parse(JSON.stringify(args))
      nextArgs.currentPath = nextPath
      nextArgs.previousPath = args.currentPath
      nextArgs.previousObj = obj
      nextArgs.key = key
      nextArgs.recursionDepth = args.recursionDepth + 1
      callbackObjectRecursion(obj[key], callback, nextArgs)
    }
  }
}

export {
  mergeDeep,
  uuidv4,
  valueFromObjectPath,
  callbackObjectRecursion
}
