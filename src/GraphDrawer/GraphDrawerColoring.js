// Generates a random color
const golden = 0.618033988749895
let h = Math.random()

function randomHSL () {
  h += golden
  h %= 1
  return 'hsla(' + (360 * h) + ',' +
        '70%,' +
        '80%,1)'
}

// generates colors per property (per property, not per node! Todo: consider renaming: getColorByProperty)
function registerPropertyColor (property) {
  // maps a property to a color, generates the color by randomness if not existing

  if (this.handleCallbacks({
    id: 'onBeforeSetColor',
    params: {
      graph: this,
      property
    }
  })) {
    for (const x in this.colorObj) {
      if (property === x) {
        return this.colorObj[x] // this is the color-object in GraphDrawer that contains colors per property.
      }
    }
    this.colorObj[property] = this.randomHSL()
    return this.colorObj[property]
  }
}

export {
  randomHSL,
  registerPropertyColor

}
