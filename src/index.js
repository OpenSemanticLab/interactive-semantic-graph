const vis = require("vis-network/standalone/esm/index.js")
const utils = require("./utils.js")
const NodeClasses = require("./NodeClasses.js")
const $ = require("jquery")
const chroma = require("chroma-js")
//const RegExp = require('RegExp');
const jsonpath = require('jsonpath');


class GraphDrawer {

  constructor(config, args) {

    const defaultConfig = {
      callbacks: {
        setColor: (data) => this.setColorDefault(data), //default: use class methode
        getStartItem: (data) => this.getStartItemDefault(data),
        createContext: (data) => this.createContextDefault(data),
        onBeforeSetColor: [(graph, property) => true],
        onBeforeGetStartItem: [(graph, item) => true],
        onBeforeCreateContext: [(graph, context) => true],
      }
    };

    this.config = utils.mergeDeep(defaultConfig, config);

    this.file = args.file;
    this.depth = args.depth;
    this.mode = args.mode;
    this.id = 0;
    this.nodes = args.nodes;
    this.edges = args.edges;
    this.lang = "en";
    this.first = true;
    this.oldStartItem;
    this.baseRootId;
    this.colorObj = {};
    this.h = Math.random();
    this.golden = 0.618033988749895;
    this.createArgs = {
      file: this.file,
      lastId: false,
      item: false,
      oldContext: false,
      lastDepth: false,
      givenDepth: this.depth,
      mode: this.mode
    }
    this.createGraphNE(this.createArgs);


    Object.filter = (obj, predicate) =>
      Object.keys(obj)
      .filter(key => predicate(obj[key]))
      .reduce((res, key) => (res[key] = obj[key], res), {});
  }


  //Adds a callback function to config 
  registerCallback(params) {
    this.config.callbacks[params.name].push(params.func)
  }

  handleCallbacks(params) {
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
  //Generates a random color
  randomHSL = () => {

    this.h += this.golden;
    this.h %= 1;
    return "hsla(" + (360 * this.h) + "," +
      "70%," +
      "80%,1)";
  }


  //Gets the starting Item inside the JSON file
  getStartItem(file) {

    console.log(file);
    let items = Object.keys(file.jsondata);

    let output = []

    for (let i = 0; i < items.length; i++) {

      if ("start" in file.jsondata[items[i]]) {

        output.push(items[i]);

      }

    }
    if (output.length == 1) {
      if (this.handleCallbacks({
          id: 'onBeforeGetStartItem',
          params: {
            graph: this,
            item: output[0]
          }
        })) {
        return output[0];
      }
    } else {
      return false;
    }
  }

  //Creates Array of arrays Array of all contexts
  contextRecursion(file, schema, fullContext = []) {
    fullContext = fullContext;

    let startContext = file.jsonschema[schema]["@context"];

    if (Array.isArray(startContext)) {
      for (let i = 0; i < startContext.length; i++) {


        if (!(typeof startContext[i] === 'object' && startContext[i] !== null)) {
          this.contextRecursion(file, startContext[i], fullContext);
        } else {
          fullContext.push(startContext[i]);
        }
      }
    } else {
      fullContext.push(startContext);
    }

    return fullContext;
  }

  
  //Creates a context object out of the multidimensional array created by the recursive context function
  createContext(file, item) {

    let itemSchema = file.jsondata[item].type[0];
    let contextArrayOfObjects = this.contextRecursion(file, itemSchema);
    let context = {};

    for (let i = 0; i < contextArrayOfObjects.length; i++) {

      let partContextKeys = Object.keys(contextArrayOfObjects[i]);

      for (let j = 0; j < partContextKeys.length; j++) {

        context[partContextKeys[j]] = contextArrayOfObjects[i][partContextKeys[j]];
      }
    }
    if (this.handleCallbacks({
        id: 'onBeforeCreateContext',
        params: {
          graph: this,
          context: context
        }
      })) {

      return context;
    }
  }

  // createContext(file, item){

  //   let data = {graph: this, file: file, item: item};
  //   return this.config.callbacks.createContext(data);
  // }

  //Checks if node already exists inside of a nodes array
  nodeExists(nodes, item) {
    let exists = false;
    for (let index = 0; index < nodes.length; index++) {
      if (nodes[index].object && nodes[index].object == item) {
        exists = index;
      }

    }
    return exists;
  }

  // default method if not overwritten by the user

  // generates colors per property (per property, not per node! Todo: consider renaming: getColorByProperty)
  setColor(property) {
    // maps a property to a color, generates the color by randomness if not existing

    if (this.handleCallbacks({
        id: 'onBeforeSetColor',
        params: {
          graph: this,
          property: property
        }
      })) {

      for (let x in this.colorObj) {
        if (property == x) {
          return this.colorObj[x]; // this is the color-object in GraphDrawer that contains colors per property.
        }
      }
      this.colorObj[property] = this.randomHSL();
      return this.colorObj[property];
    }
  }

  // set the color via callback. Defaults to setColorDefault
  // setColor(property) {
  //   let data = {graph: this, property: property};
  //   return this.config.callbacks.setColor(data);
  // }

  //creates nodes and edges out of a JSON file
  createGraphNE(args) {

    //keys of args: file, lastId, item, oldContext, lastDepth, givenDepth, mode

    let startItem;
    let label;
    let rootId;
    let startContext;
    let objKeys;
    let depth;
    let color;

    //first run of the function
    if (!args.item && !args.lastId) {
      //gets the item in the jsondata that is labelled with "start":true
      startItem = this.getStartItem(args.file);

      let labelArray = args.file.jsondata[startItem].label;

      // check language for root node and set label according to this.lang
      for (let i = 0; i < labelArray.length; i++) {
        if (labelArray[i].lang == this.lang) {
          label = labelArray[i].text;
        }
      }

      //creates the root node
      this.nodes.push({
        id: this.id,
        label: label,
        color: '#6dbfa9',
        depth: 0,
        object: startItem,
        group: "root"
      });
      rootId = this.id;
      this.baseRootId = rootId;
      this.id++;
      depth = 1;

      //creates  the context of the root node
      startContext = this.createContext(args.file, startItem); // a map from JSON-keys on SemanticProperty (labels)
      objKeys = Object.keys(args.file.jsondata[startItem]);

    }
    // not the first run; context already exists i.e. for objects inside objects
    else if (args.oldContext) { //if context is given inside a node
      startItem = args.item;
      startContext = args.oldContext;
      objKeys = Object.keys(args.file.jsondata[startItem]);
      rootId = args.lastId;
      depth = args.lastDepth;


    }
    // no oldContext present and not first run.
    else {

      startItem = args.item;

      let labelArray = args.file.jsondata[startItem].label;

      for (let i = 0; i < labelArray.length; i++) {

        if (labelArray[i].lang == this.lang) {
          label = labelArray[i].text;
        }
      }
      rootId = args.lastId;
      this.id++;
      depth = args.lastDepth;

      startContext = this.createContext(args.file, startItem);
      objKeys = Object.keys(args.file.jsondata[startItem]);
    }

    // loops through an item
    for (let i = 0; i < objKeys.length; i++) {

      //ignore type and lable (in order not to generate nodes for them)
      if (objKeys[i] != "type" && objKeys[i] != "label" && objKeys[i] != "start" && (depth <= args.givenDepth || !args.givenDepth)) {

        //check if key is in startContext
        if (objKeys[i] in startContext && args.file.jsondata[startContext[objKeys[i]]["@id"]]) {

          for (let k = 0; k < args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"].length; k++) {

            if (args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][k].lang == this.lang) {
              // color by property.
              color = this.setColor(args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][k].text)

            }
          }
          // if the key is in start context and Property is not present in jsondata
        } else if (objKeys[i] in startContext && !(startContext[objKeys[i]]["@type"] == "@id")) {

          let edgeLabel = startContext[objKeys[i]].replace("Property:", "");
          color = this.setColor(edgeLabel)
          // if the key is in start context and Property is present in jsondata and literal property
        } else if (objKeys[i] in startContext && !(args.file.jsondata[startContext[objKeys[i]]["@id"]]) && startContext[objKeys[i]]["@type"] == "@id") {

          let edgeLabel = startContext[objKeys[i]]["@id"].replace("Property:", "");

          color = this.setColor(edgeLabel)
          // if no mapping/context is present for the key.
        } else {
          color = this.setColor(objKeys[i])
        }
        // end of setting color



        // check if given key's value is an array and if the first element is an object
        if (Array.isArray(args.file.jsondata[startItem][objKeys[i]]) && typeof args.file.jsondata[startItem][objKeys[i]][0] === 'object' && args.file.jsondata[startItem][objKeys[i]][0] !== null) {
          //Object inside an Object (recursively)
          // recursively create objects for subobjects that shall be visible in the graph


          // loop through array
          for (let j = 0; j < args.file.jsondata[startItem][objKeys[i]].length; j++) {

            const randomNumber = Math.floor(Math.random() * 100000000);
            const eightDigitRandomNumber = randomNumber.toString().padStart(8, '0');

            args.file.jsondata[objKeys[i] + "" + eightDigitRandomNumber] = args.file.jsondata[startItem][objKeys[i]][j];

            // args.file.jsondata[objKeys[i]+""+j] = args.file.jsondata[startItem][objKeys[i]][j];
            // console.log(args.file.jsondata[objKeys[i]+""+j])

            if (this.nodeExists(this.nodes, objKeys[i] + "" + eightDigitRandomNumber)) {
              // only create edges

              // create edge with correct language
              if (args.file.jsondata[startContext[objKeys[i]]["@id"]]) {

                for (let k = 0; k < args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"].length; k++) {
                  if (args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][k].lang == this.lang) {
                    this.edges.push({
                      from: rootId,
                      to: this.nodes[this.nodeExists(this.nodes, objKeys[i] + "" + eightDigitRandomNumber)].id,
                      label: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][k].text,
                      color: color,
                      group: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][k].text,
                      objectKey: objKeys[i]
                    });
                    //console.log(args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text)
                  }
                }

              } else {
                // if property is not mapped (no property in jsondata)
               
                let edgeLabel = startContext[objKeys[i]]["@id"].replace("Property:", "");

                this.edges.push({
                  from: rootId,
                  to: this.nodes[this.nodeExists(this.nodes, objKeys[i] + "" + eightDigitRandomNumber)].id,
                  label: edgeLabel,
                  color: color,
                  group: edgeLabel,
                  objectKey: objKeys[i]
                });
              }


            // if node does not exist, create node and edge
            } else {

              if (startContext.hasOwnProperty(objKeys[i])) {

                if (args.file.jsondata[startContext[objKeys[i]]["@id"]]) {
                  for (let j = 0; j < args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"].length; j++) {
                    if (args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].lang == this.lang) {
                      // insert node
                      this.nodes.push({
                        id: this.id,
                        label: objKeys[i],
                        object: objKeys[i] + "" + eightDigitRandomNumber,
                        context: startContext,
                        depth: depth,
                        color: color,
                        group: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text,
                        mainObjectId: rootId
                      });
                      
                      this.edges.push({
                        from: rootId,
                        to: this.id,
                        label: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text,
                        color: color,
                        group: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text,
                        objectKey: objKeys[i]
                      });
                      //console.log(args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text)
                    }

                  }


                } else {

                  let edgeLabel = startContext[objKeys[i]]["@id"].replace("Property:", "");

                  this.nodes.push({
                    id: this.id,
                    label: objKeys[i],
                    object: objKeys[i] + "" + eightDigitRandomNumber,
                    context: startContext,
                    depth: depth,
                    color: color,
                    group: edgeLabel,
                    mainObjectId: rootId
                  });

                  this.edges.push({
                    from: rootId,
                    to: this.id,
                    label: edgeLabel,
                    color: color,
                    group: edgeLabel,
                    objectKey: objKeys[i]
                  });

                }
              } else {


                this.nodes.push({
                  id: this.id,
                  label: objKeys[i],
                  object: objKeys[i] + "" + eightDigitRandomNumber,
                  context: startContext,
                  depth: depth,
                  color: color,
                  group: objKeys[i],
                  mainObjectId: rootId
                });

                this.edges.push({
                  from: rootId,
                  to: this.id,
                  label: objKeys[i],
                  color: color,
                  group: objKeys[i],
                  objectKey: objKeys[i]
                });
              }
            }

            // prepare arguments for recursive call

            let oldId = this.id;
            this.id++;

            let argObj = {
              file: args.file,
              lastId: oldId,
              item: objKeys[i] + "" + eightDigitRandomNumber,
              oldContext: startContext,
              lastDepth: depth + 1,
              givenDepth: args.givenDepth,
              mode: args.mode
            };

            this.createGraphNE(argObj);
          }

        // if value of current key is an array of items 

        } else if (objKeys[i] in startContext && startContext[objKeys[i]]["@type"] == "@id" && Array.isArray(args.file.jsondata[startItem][objKeys[i]]) && !(typeof args.file.jsondata[startItem][objKeys[i]][0] === 'object' && args.file.jsondata[startItem][objKeys[i]][0] !== null)) {

          //Array of Items (recursively)

          //console.log(args.file.jsondata[startItem][objKeys[i]]);

          let rememberArray = args.file.jsondata[startItem][objKeys[i]];

          args.file.jsondata[startItem][objKeys[i]] = "";


          for (let j = 0; j < rememberArray.length; j++) {

            let labelArray = args.file.jsondata[rememberArray[j]].label;

            for (let i = 0; i < labelArray.length; i++) {

              if (labelArray[i].lang == this.lang) {
                label = labelArray[i].text;
              }

            }
            if (this.nodeExists(this.nodes, rememberArray[j])) {



              if (args.file.jsondata[startContext[objKeys[i]]["@id"]]) {
                for (let k = 0; k < args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"].length; k++) {

                  if (args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][k].lang == this.lang) {

                    this.edges.push({
                      from: rootId,
                      to: this.nodes[this.nodeExists(this.nodes, rememberArray[j])].id,
                      label: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][k].text,
                      color: color,
                      group: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][k].text,
                      objectKey: objKeys[i]
                    });
                    //console.log(args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text)
                  }

                }


              } else {
                let edgeLabel = startContext[objKeys[i]]["@id"].replace("Property:", "");


                this.edges.push({
                  from: rootId,
                  to: this.nodes[this.nodeExists(this.nodes, rememberArray[j])].id,
                  label: edgeLabel,
                  color: color,
                  group: edgeLabel,
                  objectKey: objKeys[i]
                });

              }

            } else {


              if (args.file.jsondata[startContext[objKeys[i]]["@id"]]) {
                for (let j = 0; j < args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"].length; j++) {
                  if (args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].lang == this.lang) {
                    this.nodes.push({
                      id: this.id,
                      label: label,
                      object: rememberArray[j],
                      depth: depth,
                      color: color,
                      group: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text
                    });

                    this.edges.push({
                      from: rootId,
                      to: this.id,
                      label: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text,
                      color: color,
                      group: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text,
                      objectKey: objKeys[i]
                    });
                    //console.log(args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text)
                  }

                }


              } else {
                let edgeLabel = startContext[objKeys[i]]["@id"].replace("Property:", "");

                this.nodes.push({
                  id: this.id,
                  label: label,
                  object: rememberArray[j],
                  depth: depth,
                  color: color,
                  group: edgeLabel
                });

                this.edges.push({
                  from: rootId,
                  to: this.id,
                  label: edgeLabel,
                  color: color,
                  group: edgeLabel,
                  objectKey: objKeys[i]
                });

              }

              let argObj2 = {
                file: args.file,
                lastId: this.id,
                item: rememberArray[j],
                oldContext: false,
                lastDepth: depth + 1,
                givenDepth: args.givenDepth,
                mode: args.mode
              }

              this.createGraphNE(argObj2);
            }
            this.id++; //new maybe wrong


            /////////////////////////////////createGraphNE(args.file, id, rememberArray[j]);

          }

          args.file.jsondata[startItem][objKeys[i]] = rememberArray;
          //console.log(args.file.jsondata[startItem][objKeys[i]])


        // if value of current key is an item string
        } else if (objKeys[i] in startContext && startContext[objKeys[i]]["@type"] == "@id" && !(Array.isArray(args.file.jsondata[startItem][objKeys[i]])) && !(typeof args.file.jsondata[startItem][objKeys[i]][0] === 'object' && args.file.jsondata[startItem][objKeys[i]][0] !== null)) {

          //Item is a literal 

          let labelArray = args.file.jsondata[args.file.jsondata[startItem][objKeys[i]]].label;

          for (let i = 0; i < labelArray.length; i++) {

            if (labelArray[i].lang == this.lang) {
              label = labelArray[i].text;
            }

          }

          if (this.nodeExists(this.nodes, args.file.jsondata[startItem][objKeys[i]])) {
            if (args.file.jsondata[startContext[objKeys[i]]["@id"]]) {
              for (let k = 0; k < args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"].length; k++) {
                if (args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][k].lang == this.lang) {
                  this.edges.push({
                    from: rootId,
                    to: this.nodes[this.nodeExists(this.nodes, args.file.jsondata[startItem][objKeys[i]])].id,
                    label: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][k].text,
                    color: color,
                    group: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][k].text,
                    objectKey: objKeys[i]
                  });
                  //console.log(args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text)
                }

              }


            } else {

              let edgeLabel = startContext[objKeys[i]]["@id"].replace("Property:", "");


              this.edges.push({
                from: rootId,
                to: this.nodes[this.nodeExists(this.nodes, args.file.jsondata[startItem][objKeys[i]])].id,
                label: edgeLabel,
                color: color,
                group: edgeLabel,
                objectKey: objKeys[i]
              });

            }



          } else {



            if (args.file.jsondata[startContext[objKeys[i]]["@id"]]) {
              for (let j = 0; j < args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"].length; j++) {
                if (args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].lang == this.lang) {
                  this.nodes.push({
                    id: this.id,
                    label: label,
                    object: args.file.jsondata[startItem][objKeys[i]],
                    depth: depth,
                    color: color,
                    group: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text
                  });

                  this.edges.push({
                    from: rootId,
                    to: this.id,
                    label: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text,
                    color: color,
                    group: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text,
                    objectKey: objKeys[i]
                  });
                  //console.log(args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text)
                }

              }


            } else {
              let edgeLabel = startContext[objKeys[i]]["@id"].replace("Property:", "");
              this.nodes.push({
                id: this.id,
                label: label,
                object: args.file.jsondata[startItem][objKeys[i]],
                depth: depth,
                color: color,
                group: edgeLabel
              });

              this.edges.push({
                from: rootId,
                to: this.id,
                label: edgeLabel,
                color: color,
                group: edgeLabel,
                objectKey: objKeys[i]
              });

            }

            let argObj3 = {
              file: args.file,
              lastId: this.id,
              item: args.file.jsondata[startItem][objKeys[i]],
              oldContext: false,
              lastDepth: depth + 1,
              givenDepth: args.givenDepth,
              mode: args.mode
            }

            this.createGraphNE(argObj3);
          }
          //edges.push({from: rootId, to: id, label: startContext[objKeys[i]]["@id"]});

          ///////////////////////////////createGraphNE(args.file, id, args.file.jsondata[startItem][objKeys[i]]);

         
        // if value of current key is in start context but property is not in jsondata; args.mode => literals shall be displayed
        } else if (objKeys[i] in startContext && args.mode) {

          //Is a literal 

          let nodeLabel;
          let loopLength;
          if (Array.isArray(args.file.jsondata[startItem][objKeys[i]])) {
            loopLength = args.file.jsondata[startItem][objKeys[i]].length;
          } else {
            loopLength = 1;
          }

          for (let k = 0; k < loopLength; k++) {

            if (Array.isArray(args.file.jsondata[startItem][objKeys[i]])) {
              nodeLabel = args.file.jsondata[startItem][objKeys[i]][k]
            } else {
              nodeLabel = args.file.jsondata[startItem][objKeys[i]];
            }

            if (args.file.jsondata[startContext[objKeys[i]]]) {

              for (let j = 0; j < args.file.jsondata[startContext[objKeys[i]]]["label"].length; j++) {
                if (args.file.jsondata[startContext[objKeys[i]]]["label"][j].lang == this.lang) {
                  this.nodes.push({
                    id: this.id,
                    label: nodeLabel,
                    depth: depth,
                    color: color,
                    group: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text
                  });

                  this.edges.push({
                    from: rootId,
                    to: this.id,
                    label: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text,
                    color: color,
                    group: args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text,
                    objectKey: objKeys[i]
                  });
                  //console.log(args.file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text)
                }

              }


            } else {
              let edgeLabel = startContext[objKeys[i]].replace("Property:", "");
              this.nodes.push({
                id: this.id,
                label: nodeLabel,
                depth: depth,
                color: color,
                group: edgeLabel
              });


              this.edges.push({
                from: rootId,
                to: this.id,
                label: edgeLabel,
                color: color,
                group: edgeLabel,
                objectKey: objKeys[i]
              });

            }

            //edges.push({from: rootId, to: id, label: startContext[objKeys[i]]});
            this.id++;
            //console.log(args.file.jsondata[startItem][objKeys[i]])

          }

        // if not in context and property is not in jsondata. 
        } else {

          //Is a literal (not in context)
          if (args.mode) {

            //console.log(args.file.jsondata[startItem][objKeys[i]])
            this.nodes.push({
              id: this.id,
              label: args.file.jsondata[startItem][objKeys[i]],
              depth: depth,
              color: color,
              group: objKeys[i]
            });

            this.edges.push({
              from: rootId,
              to: this.id,
              label: objKeys[i],
              color: color,
              group: objKeys[i],
              objectKey: objKeys[i]
            });
            this.id++;
           

          }
        }

      }
    }
    return startContext; // TODO return something meaningful, like nodes and edges.
  }

}


class GraphTool {
  constructor(div_id, config, _config) {

    
    // create all necessary elements/divs and set them up
    this.container = document.getElementById(div_id);
    this.vis_container = document.createElement("div");
    this.vis_container.setAttribute("id", "vis_container");
    //this.vis_container.width = "70%"
    this.vis_container.style = "width: 65%; height: 800px; border: 1px solid lightgray;  float:left;";
    this.options_container = document.createElement("div");
    this.options_container.setAttribute("id", "options_container");
    this.options_container.setAttribute("style", "overflow-y:scroll");
    //this.options_container.width = "30%"
    this.options_container.style = "margin-left: 68%; width: 30%; height: 800px; border: 1px solid lightgray;";
    this.container.append(this.vis_container);
    this.container.append(this.options_container);

    this.clicked = {} // object to store expanded nodes TODO: rename to expandedNodes

    const default_config = { // TODO: add standard callback configurations: ColorByValue, Search, etc. ?? 
      callbacks: {
        onBeforeSearchNodes: [(graph, searchString) => true],
      }
    };

    this._config = utils.mergeDeep(default_config, _config); // overwrite default config with user _config

    this.keyObject = {   // to be removed, was inteded for callback implementation
      doubleclick: (params) => {
        this.expandNodes(params)
      },
    }
    // create a visjs network and attatch it to div
    //console.log(config)
    this.nodes = new vis.DataSet(config.nodes)
    this.edges = new vis.DataSet(config.edges)
    this.data = {
      nodes: this.nodes,
      edges: this.edges,
    };
    this.options = config.options;
    this.network = new vis.Network(this.vis_container, this.data, this.options);

    // variables containing keyboard and mouse state
    this.pressed_keys = []
    this.mouseX = 0
    this.mouseY = 0

    // for copying function
    this.copiedNodes = []
    this.copiedEdges = []

    // for having different node classes. 
    this.classRegistry = new Map // maps from typeString to class
    this.classRegistry.register = (cls) => {
      this.classRegistry.set((new cls).typeString, cls)
    }
    for (let cls of [NodeClasses.RocketBase, NodeClasses.RocketBase, NodeClasses.Fountain, NodeClasses.DelayNode, NodeClasses.TextSpeechNode, NodeClasses.VideoNode,
        NodeClasses.DrawNode,
        NodeClasses.CameraNode, NodeClasses.ImageNode, NodeClasses.CsvNode,
        NodeClasses.JSONNode, NodeClasses.JSONNode1, NodeClasses.JSONSchemaNode
      ]) {
      console.log(cls)
      this.classRegistry.register(cls)
    }

    // Initialize GUI for various functions acting on the graph.
    this.colorPicker(this);
    this.loadSaveFunctionality();
    this.createLegend();
    this.createSearchUI()
    this.oldNodeColors = {};
    this.oldEdgeColors = {};


    // set visjs network callbacks

    this.network.on("click", (params) => {
      console.log(
        "Click event, ",
      );
      this.showSelectionOptions()
      // TODO: move definition of keyboard shortcuts to this.registerKeyboardShortcuts
      if (this.pressed_keys.includes('a')) {
        //add a node to position of mouse if a is pressed during click
        let addNode = new NodeClasses.BaseNode(this)
        addNode.x = params.pointer.canvas.x
        addNode.y = params.pointer.canvas.y
        this.nodes.update(addNode)
      }

      if (this.pressed_keys.includes('q')) {
        // show global JSON vis JSONeditor in options div

        let optionsDivId = this.options_container.id
        console.log('show global JSON')
        document.getElementById(optionsDivId).innerHTML = "<button id='setButton'>set!</button><br><div id='editor_div'></div>"
        let setButton = document.getElementById("setButton") // todo: implement changes


        let options = {
          mode: 'tree',
          modes: ['code', 'tree'] // ['code', 'form', 'text', 'tree', 'view', 'preview']}
        }

        let editor_div = document.getElementById("editor_div",options)
        // create a JSONEdior in options div
        let editor = new JSONEditor(editor_div)  // TODO: Editor is currently not rendered. find error.
        
        editor.set({
          edges: this.edges.get(),
          nodes: this.nodes.get()
        })
      }
    });

    this.network.on("doubleClick", (params) => {

      this.keyObject.doubleclick(params); // TODO: implement central callback object
    });


    this.network.on("oncontext", (params) => {
      console.log('in this.network.on(oncontext)') // TODO: implement right click, probably Property-List, but as callback function.
    });

    this.network.on('dragStart', (params) => {
      console.log("dragStart");
      
      if (params.nodes.length > 0) {
        let newNodeIds = []
        params.nodes.forEach((node_id, index) => {
          let node = this.nodes.get(node_id)
          let position = this.network.getPosition(node_id) //setting the current position is necessary to prevent snap-back to initial position
          
          node.x = position.x
          node.y = position.y

          // duplicate Node if ctrl is pressed
          if (params.event.srcEvent.ctrlKey) {

            //now: duplicate node and connect to original one. TODO: check if this should create a new node as property of the original.
            let newNode = this.duplicateNode(node)

            // added node shall move with cursor until button is released
            newNode.fixed = false;
            newNode.id = config.graph.id;
            newNode.depth = this.nodes.get(this.network.getSelectedNodes()[index]).depth + 1;
            config.graph.id += 1;
            
            this.copiedEdges = this.network.getSelectedEdges()

            let newEdge = {
              from: node.id,
              to: newNode.id,
              label: "InitializedByCopyFrom", //this.edges.get(this.copiedEdges[index]).label,
              color: newNode.color,
              group: newNode.group
            }

            this.nodes.update(newNode)
            this.edges.update(newEdge) //{from: node.id, to: newNode.id}
            newNodeIds.push(newNode.id)
          } else {
            node.fixed = false
            this.nodes.update(node)
          }
        })
        if (params.event.srcEvent.ctrlKey) {
          this.network.setSelection({
            nodes: newNodeIds
          })
        }
      }
    });

    this.network.on('dragEnd', (params) => {
    
      params.nodes.forEach((node_id) => {
        let node = this.nodes.get(node_id)
        let position = this.network.getPosition(node_id)
        //setting the current position is necessary to prevent snap-back to initial position
        node.x = position.x
        node.y = position.y
        node.fixed = true
        this.nodes.update(node)
      })

    });
    

    // keyboard callback functions
    document.addEventListener('keydown', (event) => {
      if (!this.pressed_keys.includes(event.key)) {
        this.pressed_keys.push(event.key)
      }
      // delete function
      if (event.key == "Delete") {
        this.network.deleteSelected()
      }
      // copy
      if (event.key == "c" && this.pressed_keys.includes("Control")) {
        //copy nodes
        this.copiedNodes = this.network.getSelectedNodes()
        this.copiedEdges = this.network.getSelectedEdges()
      }
      // paste
      if (event.key == "v" && this.pressed_keys.includes("Control")) {
        //paste copied nodes
        
        if (this.copiedNodes.length > 0 && this.network.getSelectedNodes().length > 0) {
          //console.log('paste')

          // TODO: encapsulate in: this.pasteNodeIntoExistingItem() 
          // TODO: paste node into empty space and create corresponding item this.pasteNodeIntoNewItem(node,xy) 
          let xy = this.network.DOMtoCanvas({
            x: this.mouseX,
            y: this.mouseY
          })

          this.copiedNodes.forEach((node_id, index) => {
            if (this.nodes.get(this.network.getSelectedNodes()[index]).object) {
              let oldNode = this.nodes.get(node_id)

              let newNode = this.duplicateNode(oldNode)
              let keys = Object.getOwnPropertyNames(oldNode)

              keys.forEach((key) => {
                if (!(key === "id") && !((typeof (oldNode[key])) == "function")) {
                  newNode[key] = oldNode[key]
                  // console.log("copy:",key,oldNode[key])
                } else {
                  //console.log("don't copy:",key,oldNode[key])
                }
                newNode.x = xy.x
                newNode.y = xy.y
              })
              newNode.id = this.config.graph.id;
              newNode.depth = this.nodes.get(this.network.getSelectedNodes()[index]).depth + 1;

              this.config.graph.id += 1;

              let newEdge = {
                from: this.network.getSelectedNodes()[0],
                to: newNode.id,
                label: this.edges.get(this.copiedEdges[index]).label,
                color: newNode.color,
                group: newNode.group,
                objectKey: this.edges.get(this.copiedEdges[index]).objectKey
              }

              if (newNode.group != "root") {
                this.nodes.update(newNode);
                this.edges.update(newEdge);
                console.log(this.config,this.config.file)
                if (newNode.object) {

                  if (newNode.context) {


                    this.config.graph.createGraphNE(this.config.file, newNode.id, newNode.object, newNode.context, newNode.depth, "", true);   

                  } else {
                    this.config.graph.createGraphNE(this.config.file, newNode.id, newNode.object, "", newNode.depth, "", true);

                  }

                  this.nodes.update(nodes);
                  this.edges.update(edges);
                }

                this.addToJSON(newNode, newEdge);

              }
            }
          });
        }
      }
    }, false);
    document.addEventListener('keyup', (event) => {
      const index = this.pressed_keys.indexOf(event.key);
      if (index > -1) { // only splice array when item is found
        this.pressed_keys.splice(index, 1); // 2nd parameter means remove one item only
      }
    }, false);

    // Rectangular selection:
    this.vis_container.onmousemove = (event) => {
      this.mouseX = event.clientX
      this.mouseY = event.clientY - 30
    }

    this.initRectangleSelection()
    this.initDragAndDrop()
  }

  handleCallbacks(params) {
    let result = true;
    if (!this._config.callbacks[params.id]) return true;
    for (const callback of this._config.callbacks[params.id]) {
      if (!callback(params.params)) {
        result = false
        break;
      }
    }
    return result;
  }

  initRectangleSelection() {
    // Multiselect functionality 
    this.network.setOptions({
      interaction: {
        dragView: false,
        multiselect: true
      }
    })

    var canvas;
    var ctx;
    var container = this.vis_container


    canvas = this.network.canvas.frame.canvas;
    ctx = canvas.getContext('2d');

    var rect = {},
      drag = false;
    var drawingSurfaceImageData;

    const saveDrawingSurface = () => {
      drawingSurfaceImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    const restoreDrawingSurface = () => {
      ctx.putImageData(drawingSurfaceImageData, 0, 0);
    }

    const selectNodesFromHighlight = () => {
      var fromX, toX, fromY, toY;
      var nodesIdInDrawing = [];
      var xRange = getStartToEnd(rect.startX, rect.w);
      var yRange = getStartToEnd(rect.startY, rect.h);


      var allNodes = this.nodes.get();
      for (var i = 0; i < allNodes.length; i++) {
        var curNode = allNodes[i];
        var nodePosition = this.network.getPositions([curNode.id]);
        var nodeXY = this.network.canvasToDOM({
          x: nodePosition[curNode.id].x,
          y: nodePosition[curNode.id].y
        });
        if (xRange.start <= nodeXY.x && nodeXY.x <= xRange.end && yRange.start <= nodeXY.y && nodeXY.y <= yRange
          .end) {
          nodesIdInDrawing.push(curNode.id);
        }
      }
      console.log(nodesIdInDrawing)

      console.log("network.selectNodes")
      this.network.selectNodes(nodesIdInDrawing);


    }

    const getStartToEnd = (start, theLen) => {
      return theLen > 0 ? {
        start: start,
        end: start + theLen
      } : {
        start: start + theLen,
        end: start
      };
    }

    container.addEventListener("mousemove", function (e) {
      if (drag) {

        drag = "mousemove"
        restoreDrawingSurface();
        rect.w = (e.pageX - this.offsetLeft) - rect.startX;
        rect.h = (e.pageY - this.offsetTop) - rect.startY;

        ctx.setLineDash([5]);
        ctx.strokeStyle = "rgb(0, 102, 0)";
        ctx.strokeRect(rect.startX, rect.startY, rect.w, rect.h);
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
        ctx.fillRect(rect.startX, rect.startY, rect.w, rect.h);
      }
    });

    container.addEventListener("mousedown", function (e) {
      console.log(e)
      if (e.button == 0) {
        //var selectedNodes = e.ctrlKey ? this.network.getSelectedNodes() : null;

        saveDrawingSurface();
        var that = this;
        rect.startX = e.pageX - this.offsetLeft;
        rect.startY = e.pageY - this.offsetTop;
        drag = "mousedown";
        container.style.cursor = "crosshair";
      }
    });

    container.addEventListener("mouseup", (e) => {
      if (e.button == 0) {



        let prev_selectedNodes = this.network.getSelectedNodes()
        console.log('drag', drag, prev_selectedNodes)

        if (prev_selectedNodes.length == 0) {

          selectNodesFromHighlight();
          this.showSelectionOptions();
        }
        restoreDrawingSurface();
        drag = false;

        container.style.cursor = "default";

      }
      console.log("end of mouse up", )
    });

    document.body.oncontextmenu = function () {
      console.log('oncontextmenu');
      return false;
    };
  }


  initDragAndDrop() {
    // drag & drop functionality

    var container = this.vis_container
    const handleDrop = (e) => {
      console.log(e)
      e.stopPropagation(); // Stops some browsers from redirecting
      e.preventDefault();

      var files = e.dataTransfer.files;
      console.log(files)
      for (let file of files) {

        // images 
        if (file.type === 'image/png' ||
          file.type === 'image/jpeg') {
          // add image node to network

          let xy = this.network.DOMtoCanvas({
            x: e.clientX,
            y: e.clientY
          })
          console.log("xy", xy)

          // read file 
          console.log(file);

          let reader = new FileReader(this);
          reader.onload = (event) => {
            //console.log(event.target.result);
            let newNode = new NodeClasses.ImageNode(this, utils.uuidv4(), xy.x, xy.y, event.target.result)
            console.log("create Image node", newNode)
            this.nodes.update(newNode)
          };
          console.log(file);
          console.log(reader.readAsDataURL(file));
        }

        // csv files
        else if (file.type === 'application/vnd.ms-excel' && file.name.endsWith('.csv')) {
          // add csv node
          let xy = this.network.DOMtoCanvas({
            x: e.clientX,
            y: e.clientY
          })
          console.log("xy", xy)

          // read file 
          console.log(file);

          let reader = new FileReader(this);
          reader.onload = (event) => {
            //console.log(event.target.result);
            let newNode = new NodeClasses.CsvNode(this, utils.uuidv4(), xy.x, xy.y, event.target.result)
            console.log("create CSV Node", newNode)
            this.nodes.update(newNode)
          };
          console.log(file);
          console.log(reader.readAsText(file));
        }

        // mp4 files  (not working so far)
        else if (file.type === 'video/mp4') {
          // add cameraNode node
          let xy = this.network.DOMtoCanvas({
            x: e.clientX,
            y: e.clientY
          })
          console.log("xy", xy)

          // read file 
          console.log(file);

          let reader = new FileReader(this);
          reader.onload = (event) => {
            console.log(event.target.result);
            console.log(event.target)
            console.log(reader.readAsDataURL(event.target.result))
            let newNode = new NodeClasses.VideoNode(this, utils.uuidv4(), xy.x, xy.y, reader.readAsDataURL(event.target.result))

            console.log("create CSV Node", newNode)
            this.nodes.update(newNode)
          };
          console.log(file);
          console.log(reader.readAsText(file));
        } else {
          window.alert('File type ' + file.type + ' not supported');
        }



      }
    }

    container.addEventListener('dragenter', function (e) {
      console.log("dragenter", e)
      e.preventDefault()
      console.log("container.style", container, container.style.border)
      container.style.border = "1px solid black"
      // container.style.cssText = "border: 5px solid lightgray"

    }, false)
    container.addEventListener('dragleave', function (e) {
      console.log("dragleave", e)
      container.style.border = "1px solid lightgray"
    }, false)
    container.addEventListener('drop', function (e) {
      console.log("dragdrop", e);
      e.preventDefault
      handleDrop(e)
    }, false)
    container.addEventListener('dragover', function (e) {
      e.preventDefault()
    }, false)
  }

  showOptions_default(node, optionsDivId = 'optionsDiv') {
    document.getElementById(optionsDivId).innerHTML = "<button id='setButton'>set!</button><br><div id='editor_div'></div>"
    let setButton = document.getElementById("setButton")
    let schema = {
      "title": "Node Options",
      "description": "Node Options",
      "type": "object",
      "properties": {
        "id": {
          "title": "ID",
          "description": "The Id of the node",
          "examples": [
            "18a96389-de88-492f-95d5-af74f467f424"
          ],
          "anyOf": [{
              "type": "string"
            },
            {
              "type": "integer"
            }
          ]
        },
        "x": {
          "title": "x",
          "examples": [0],
          "type": "number"
        },
        "y": {
          "title": "y",
          "examples": [0],
          "type": "number"
        },
        "label": {
          "title": "Label",
          "examples": ["Label"],
          "type": "string"
        },
        "color": {
          "title": "color",
          "examples": ["blue", "#ffffff"],
          "type": "string"
        },
        "shape": {
          "title": "shape",
          "type": "string",
          "enum": ["ellipse", "circle", "database", "box", "text", "image", "circularImage", "diamond", "dot", "star", "triangle", "triangleDown", "hexagon", "square", "icon"]
        }
      },
    }
    let options = {
      schema: schema,
      // schemaRefs: {"job": job},
      mode: 'tree',
      modes: ['code', 'tree'] // ['code', 'form', 'text', 'tree', 'view', 'preview']}
    }
    let editor = new JSONEditor(editor_div, options)
    // make object of own properties

    editor.set(node)
    console.log(editor)
    editor.onChange = (param) => {
      console.log(param)
    }
    setButton.addEventListener('click', () => {
      console.log("editor:", editor, editor.navBar.textContent.split('►'), editor.navBar.textContent.split('j'))

      console.log(node, editor.get())
      node = editor.get()
      this.nodes.update(node)
    })
  }



  createSearchUI() {

    // create the input element
    let inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.id = 'search_input';

    // add the event listener to the input element
    inputField.addEventListener('input', () => {

      this.searchNodes(inputField.value)


    });

    // add the input field to the DOM
    document.getElementById("title").appendChild(inputField);

    // create the select element
    const selectElement = document.createElement('select');
    selectElement.id = 'search_select';
    selectElement.addEventListener('change', (event) => {
      // get the selected value
      document.getElementById('search_input').value = "";
      this.searchNodes("");
    });

    // create the first option element
    const optionElement1 = document.createElement('option');
    optionElement1.value = 'search_node';
    optionElement1.text = 'Search nodes';

    // create the second option element
    const optionElement2 = document.createElement('option');
    optionElement2.value = 'search_edge';
    optionElement2.text = 'Search edges';

    // add the option elements to the select element
    selectElement.add(optionElement1);
    selectElement.add(optionElement2);

    // add the select element to the DOM
    document.getElementById("title").appendChild(selectElement);

  }


  searchNodes = (searchString) => {

    if (this.handleCallbacks({
        id: 'onBeforeSearchNodes',
        params: {
          graph: this,
          searchString: searchString
        }
      })) {
      // let nodes = this.nodes.get();
      // let edges = this.edges.get();

      this.nodes.forEach((node) => {
        if (!this.oldNodeColors[node.id]) {
          this.oldNodeColors[node.id] = node.color;
        }
      });

      this.edges.forEach((edge) => {
        if (!this.oldEdgeColors[edge.id]) {
          this.oldEdgeColors[edge.id] = edge.color;
        }
      });

      this.nodes.forEach((node) => {

        node.color = this.oldNodeColors[node.id];
        this.nodes.update(node);
      });

      this.edges.forEach((edge) => {

        edge.color = this.oldEdgeColors[edge.id]
        this.edges.update(edge);
      });
      if (document.getElementById('search_select').value === 'search_edge') {
        this.edges.forEach((edge) => {

          if (!(edge.label.toLowerCase().includes(searchString.toLowerCase()))) {

            edge.color = "#000000";
            this.edges.update(edge);

            this.nodes.forEach((node) => {

              if (edge.to == node.id) {
                node.color = "#ffffff";
                this.nodes.update(node);
              }

            });

          }

        });
      }

      if (document.getElementById('search_select').value === 'search_node') {
        this.nodes.forEach((node) => {

          if (!(node.label.toLowerCase().includes(searchString.toLowerCase()))) {

            if (node.group != "root") {

              node.color = "#ffffff";
              this.nodes.update(node);
            }

          }

        });
        if (searchString != "") {
          this.edges.forEach((edge) => {


            edge.color = "#000000";
            this.edges.update(edge);


          });
        }
      }

      // this.nodes.update(nodes);
      // this.edges.update(edges);

    }
  }



  //Adds copied nodes to the given JSON
  addToJSON(node, edge) {

    let receivingItem = this.nodes.get(this.network.getSelectedNodes()[0]).object;
    let receivingNode = this.nodes.get(this.network.getSelectedNodes()[0])

    if (!node.object) {

      if (this.config.file["jsondata"][receivingItem][edge.objectKey]) {
        if (Array.isArray(this.config.file["jsondata"][receivingItem][edge.objectKey])) {
          this.config.file["jsondata"][receivingItem][edge.objectKey].push(node.label);
        } else {
          let tempArray = [];
          tempArray.push(this.config.file["jsondata"][receivingItem][edge.objectKey]);
          tempArray.push(node.label);

          this.config.file["jsondata"][receivingItem][edge.objectKey] = tempArray;
        }
      } else {

        this.config.file["jsondata"][receivingItem][edge.objectKey] = node.label;

      }
      //add literal to object
    } else {

      if (!receivingNode.hasOwnProperty('mainObjectId') && !node.hasOwnProperty('mainObjectId')) {
        if (this.config.file["jsondata"][receivingItem][edge.objectKey]) {
          if (Array.isArray(this.config.file["jsondata"][receivingItem][edge.objectKey])) {
            this.config.file["jsondata"][receivingItem][edge.objectKey].push(node.object);
          } else {
            let tempArray = [];
            tempArray.push(this.config.file["jsondata"][receivingItem][edge.objectKey]);
            tempArray.push(node.object);

            this.config.file["jsondata"][receivingItem][edge.objectKey] = tempArray;
          }
        } else {

          this.config.file["jsondata"][receivingItem][edge.objectKey] = node.object;

        }
      } else if (!receivingNode.hasOwnProperty('mainObjectId') && node.hasOwnProperty('mainObjectId')) {

        if (this.config.file["jsondata"][receivingItem][edge.objectKey]) {
          if (Array.isArray(this.config.file["jsondata"][receivingItem][edge.objectKey])) {
            this.config.file["jsondata"][receivingItem][edge.objectKey].push(this.config.file["jsondata"][node.object]);
          } else {
            let tempArray = [];
            tempArray.push(this.config.file["jsondata"][receivingItem][edge.objectKey]);
            tempArray.push(this.config.file["jsondata"][node.object]);

            this.config.file["jsondata"][receivingItem][edge.objectKey] = tempArray;
          }
        } else {

          this.config.file["jsondata"][receivingItem][edge.objectKey] = this.config.file["jsondata"][node.object];

        }

      } else if (receivingNode.hasOwnProperty('mainObjectId') && !node.hasOwnProperty('mainObjectId')) {

        let mainObject = this.nodes.get(receivingNode.mainObjectId)

        let objKey = this.edges.get({
          filter: function (edge) {
            return edge.to === receivingNode.id;
          }
        })[0].objectKey


        this.config.file["jsondata"][mainObject.object][objKey].forEach((object, index) => {

          if (Object.is(this.config.file["jsondata"][receivingNode.object], object)) {

            if (Array.isArray(object[edge.objectKey])) {

              object[edge.objectKey].push(node.object);

            } else {
              let tempArray = [];

              if (object[edge.objectKey]) {
                tempArray.push(object[edge.objectKey]);
              }

              tempArray.push(node.object);
              object[edge.objectKey] = tempArray;

            }

          }

        })

      } else {

        let mainObject = this.nodes.get(receivingNode.mainObjectId)

        this.config.file["jsondata"][mainObject.object][edge.objectKey].forEach((object, index) => {

          if (Object.is(this.config.file["jsondata"][receivingNode.object], object)) {

            if (Array.isArray(object[edge.objectKey])) {

              object[edge.objectKey].push(this.config.file["jsondata"][node.object]);

            } else {
              let tempArray = [];

              if (object[edge.objectKey]) {
                tempArray.push(object[edge.objectKey]);
              }

              tempArray.push(this.config.file["jsondata"][node.object]);
              object[edge.objectKey] = tempArray;

            }

            //object[edge.objectKey] = new_json["jsondata"][node.object];

          }
        })

        //console.log(new_json["jsondata"][mainObject.object])
      }
      //console.log(new_json["jsondata"])
    }


    console.log(this.config.file["jsondata"])

  }

  duplicateNode(node) {
    console.log('duplicateNode')
    let newNode = {}
    if (Object.getOwnPropertyNames(node).includes("typeString")) {
      let cls = this.classRegistry.get(node.typeString)
      newNode = new cls(utils.uuidv4())
    } else {
      newNode.id = utils.uuidv4()
    }
    let keys = Object.getOwnPropertyNames(node)
    keys.forEach((key) => {
      if (!(key === "id") && !((typeof (node[key])) == "function")) {
        newNode[key] = node[key]
      }
    })
    return (newNode)
  }

  run_recursive(node_id) {
    let node = this.nodes.get(node_id)
    if ("run" in node) {
      node.run()
    } else {
      let conn_edges = this.network.getConnectedEdges(node.id)
      console.log(conn_edges)
      conn_edges.forEach(function (edge_id) {
        let edge = this.edges.get(edge_id)
        if (edge.from == node_id) {
          let neighbor_node = this.nodes.get(edge.to)
          console.log(neighbor_node)
          if (neighbor_node.run) {
            neighbor_node.run()
          } else {
            window.setTimeout(function () {
              console.log("no run, recurse in " + neighbor_node)
              run_recursive(edge.to)
            }, 200)
          }
        }
      })
      console.log(this.network.getConnectedNodes(node.id))
    }
  }

  //Outputs all edges with given label
  getAllEdgesWithLabel(edges, label) {

    let tempArray = []

    for (let index = 0; index < edges.length; index++) {

      if (edges[index].label == label) {
        tempArray.push(edges[index]);
      }

    }

    return tempArray;

  }


  // Object.filter = (obj, predicate) => 
  //   Object.keys(obj)
  //         .filter( key => predicate(obj[key]) )
  //         .reduce( (res, key) => (res[key] = obj[key], res), {} );

  //Sets the color of the nodes and edges that are saved inside the colorObj object
  recolorByProperty() {
    nodes[0].color = "#6dbfa9";
    for (let i = 0; i < edges.length; i++) {
      edges[i].color = this.config.graph.colorObj[edges[i].label];
      for (let j = 0; j < nodes.length; j++) {
        if (edges[i].to == nodes[j].id) {
          nodes[j].color = edges[i].color;
        }
      }
    }
  }

  //Colors all nodes and edges connected by the given path. The colors are a gradient between the given colors. 
  colorByValue(path, nodes, edges, startColor, endColor) {

    let tempArray = [];

    for (let i = 0; i < path.length; i++) {

      tempArray.push(this.getAllEdgesWithLabel(edges, path[i]));

    }


    let thingsToColor = [];

    if (path.length == 1) {

      for (let index = 0; index < tempArray[0].length; index++) {

        for (let j = 0; j < nodes.length; j++) {

          if (tempArray[0][index].from == nodes[j].id || tempArray[0][index].to == nodes[j].id) {

            thingsToColor.push(nodes[j]);

          }

        }

        thingsToColor.push(tempArray[0][index]);

      }

    }

    for (let i = 0; i < tempArray.length; i++) {

      for (let j = 0; j < tempArray[i].length; j++) {

        if (tempArray.length == i + 1) {

          for (let p = 0; p < nodes.length; p++) {
            nodes[p].color = "#ffffff"
          }

          for (let p = 0; p < edges.length; p++) {
            edges[p].color = "#000000"
          }

          for (let l = 0; l < thingsToColor.length; l++) {
            delete thingsToColor[l].path;
          }

          let colorPath = 0;
          let valueArray = [];

          for (let k = 0; k < thingsToColor.length; k++) {

            if (thingsToColor[k].from) {

              let valueEdge = Object.filter(thingsToColor, thing => thing.label == path[path.length - 1]);
              let valueEdgeKey = Object.keys(valueEdge);


              for (let m = 0; m < valueEdgeKey.length; m++) {

                let valueNode = Object.filter(thingsToColor, thing => thing.id == valueEdge[valueEdgeKey[m]].to)

                let valueNodeKey = Object.keys(valueNode)[0];

                valueArray.push(valueNode[valueNodeKey].label);

              }

              let fromNode = Object.filter(thingsToColor, thing => thing.id == thingsToColor[k].from)

              let fromNodeKey = Object.keys(fromNode)[0];

              let toNode = Object.filter(thingsToColor, thing => thing.id == thingsToColor[k].to)

              let toNodeKey = Object.keys(toNode)[0];

              if (fromNode[fromNodeKey].path) {

                thingsToColor[k].path = fromNode[fromNodeKey].path
                toNode[toNodeKey].path = fromNode[fromNodeKey].path

              } else if (toNode[toNodeKey].path) {

                thingsToColor[k].path = toNode[toNodeKey].path
                fromNode[fromNodeKey].path = toNode[toNodeKey].path

              } else {

                thingsToColor[k].path = colorPath;
                toNode[toNodeKey].path = colorPath;
                fromNode[fromNodeKey].path = colorPath;

                colorPath++;

              }

            }

          }


          valueArray = [...new Set(valueArray)];

          valueArray.sort(function (a, b) {
            return a - b;
          });

          if (valueArray.length == 0) {
            var colorArray = chroma.scale([startColor, endColor]).mode('hsl').colors(colorPath)
          } else {
            var colorArray = chroma.scale([startColor, endColor]).mode('hsl').colors(valueArray.length)
          }


          for (let n = 0; n < valueArray.length; n++) {

            let nodeWithValue = Object.filter(thingsToColor, thing => thing.label == valueArray[n])

            let nodeWithValueKey = Object.keys(nodeWithValue)[0];

            for (let o = 0; o < thingsToColor.length; o++) {

              if (thingsToColor[o].path == nodeWithValue[nodeWithValueKey].path) {

                thingsToColor[o].color = colorArray[n];

              }

            }

          }

          return;

        }

        for (let k = 0; k < tempArray[i + 1].length; k++) {

          if (tempArray[i][j].to == tempArray[i + 1][k].from && tempArray[i + 1][k].label == path[i + 1] && tempArray[i][j].label == path[i]) {

            for (let index = 0; index < nodes.length; index++) {

              if (nodes[index].id == tempArray[i][j].to) {

                thingsToColor.push(nodes[index])

              }

              if (nodes[index].id == tempArray[i + 1][k].to) {

                thingsToColor.push(nodes[index])

              }
            }

            thingsToColor.push(tempArray[i][j]);

            thingsToColor.push(tempArray[i + 1][k]);

          }

        }

      }

    }

  }

  //Removes object with a given ID from the given array
  removeObjectWithId(arr, id, edge) {
    if (edge) {
      const objWithIdIndex = arr.findIndex((obj) => obj.from === edge.from && obj.to === edge.to);

      if (objWithIdIndex > -1) {
        arr.splice(objWithIdIndex, 1);
      }

    }


    const objWithIdIndex = arr.findIndex((obj) => obj.id === id);

    if (objWithIdIndex > -1) {
      arr.splice(objWithIdIndex, 1);
    }

    return arr;
  }

  //gets all nodes that are reachable from the given node ID
  getAllReachableNodesTo(nodeId, excludeIds, reachableNodes) {
    if (reachableNodes.includes(nodeId) || excludeIds.includes(nodeId)) {
      return;
    }
    var children = this.network.getConnectedNodes(nodeId);
    reachableNodes.push(nodeId);
    for (var i = 0; i < children.length; i++) {
      this.getAllReachableNodesTo(children[i], excludeIds, reachableNodes);
      //if(excludeIds.includes(children[i]))continue;
      //reachableNodes.push(children[i]);
    }
  }

  //deletes the reachable nodes from the given node ID
  deleteNodesChildren(nodeId, deleteEdge, clickedNode) {
    var excludedIds = [];
    if (deleteEdge === true) {
      console.log("deleteEdge true")
    } else {
      excludedIds.push(nodeId);
    }
    var reachableNodesTo = [];
    this.getAllReachableNodesTo(0, excludedIds, reachableNodesTo);
    var nodesToDelete = [];
    var allIds = this.nodes.getIds();
    for (var i = 0; i < allIds.length; i++) {
      if (reachableNodesTo.includes(allIds[i])) continue;
      if (allIds[i] == nodeId) {
        this.deleteEdges(nodeId);
        continue;
      }
      nodesToDelete.push(allIds[i]);
      this.deleteEdges(allIds[i]);

      nodes = this.removeObjectWithId(nodes, allIds[i])

      this.nodes.remove(allIds[i]);

    }

    return nodesToDelete;
  }
  //deletes edges that are connected to the given node ID
  deleteEdges(nodeID) {
    var fromEdges = this.edges.get({
      filter: function (item) {
        return item.from == nodeID;
      }
    });

    for (var j = 0; j < fromEdges.length; j++) {
      this.edges.remove(fromEdges[j]);

      edges = this.removeObjectWithId(edges, false, fromEdges[j])
    }
  }

  //repeats the invisibility of properties that are set invisible in the legend
  repeatInvisibility(options) {


    for (const [key, value] of Object.entries(options.groups)) {

      for (const [subKey, subValue] of Object.entries(value)) {
        if (subValue == true) {
          //console.log(key,subValue);
          let objectToRepeat = {
            repeat: key
          }

          this.legendFunctionality(objectToRepeat);

        }
      }
    }


    // Array.from(options.groups).forEach((group)=> {

    //   console.log(group)

    // });

    // let legend = document.getElementById("legendContainer");
    // let children = Array.from(legend.children);

    // children.forEach(child => {

    //   if(window.getComputedStyle(child.children[1]).backgroundColor == "rgb(255, 255, 255)"){

    //     let objectToRepeat = {repeat:child.children[1].innerHTML}

    //     this.legendFunctionality(objectToRepeat);

    //   }

    // });

  }
  //gets all groups that are set to hidden = true
  legendInvisibleGroups(options) {

    let invisibleGroups = [];

    for (const [key, value] of Object.entries(options.groups)) {

      for (const [subKey, subValue] of Object.entries(value)) {
        if (subValue == true) {
          //console.log(key,subValue);
          invisibleGroups.push(key);
        }
      }
    }

    // let legend = document.getElementById("legendContainer");
    // let children = Array.from(legend.children);

    // let invisibleGroups = [];

    // children.forEach(child => {

    //   if(window.getComputedStyle(child.children[1]).backgroundColor == "rgb(255, 255, 255)"){

    //     invisibleGroups.push(child.children[1].innerHTML);

    //   }

    // });

    return invisibleGroups;

  }
  //sets the color of the legend white if the group is set to hidden = true
  setInvisibleLegendGroupsWhite(invisibleGroups) {

    let legend = document.getElementById("legendContainer");
    let children = Array.from(legend.children);


    children.forEach((child) => {

      if (invisibleGroups.includes(child.children[1].innerHTML)) {

        child.children[1].style.background = "rgb(255, 255, 255)"

      }

    });

  }

  // resets nodes and edges visibility
  resetNodesAndEdgesVisibility() {

    this.nodes.forEach((node) => {
      node.hidden = false;
      node.physics = !node.hidden;
      node.visited = false;
      this.nodes.update(node);
    });

    this.edges.forEach((edge) => {
      edge.hidden = false;
      edge.physics = !edge.hidden;
      this.edges.update(edge);
    });

  }
  // on doubleclick expands the object that is saved inside a node and on second doubleclick deletes nodes and edges that go out of the clicked node
  expandNodes(params) {

    this.searchNodes("");
    document.getElementById("search_input").value = "";

    if (params.nodes.length > 0) {

      let node = this.nodes.get(params.nodes[0]);

      if ("object" in node && (this.clicked[params.nodes[0]] == false || !("" + params.nodes[0] in this.clicked)) && (this.network.getConnectedNodes(params.nodes[0], "to").length === 0)) {

        if (node.context) {
          //file, lastId, item, oldContext, lastDepth, givenDepth, mode
          let args = {
            file: this.config.file,
            lastId: node.id,
            item: node.object,
            oldContext: node.context,
            lastDepth: node.depth,
            givenDepth: 1,
            mode: true
          }

          this.config.graph.createGraphNE(args);

        } else {

          let args = {
            file: this.config.file,
            lastId: node.id,
            item: node.object,
            oldContext: "",
            lastDepth: node.depth,
            givenDepth: 1,
            mode: true
          };

          this.config.graph.createGraphNE(args);

        }

        this.createLegend()

        if (document.querySelector('#myDropdown select').value == "setColorByValue") {

          this.colorByValue([document.querySelector('#setColorByValueInput').value], nodes, edges, document.querySelector('#startColor').value, document.querySelector('#endColor').value)
        }
        //this.colorByValue(["value"], nodes, edges)
        this.clicked[params.nodes[0]] = true;

        // this.network.body.data.nodes.update(nodes);
        // this.network.body.data.edges.update(edges);


        this.nodes.update(nodes);
        this.edges.update(edges);

      } else {


        this.clicked[params.nodes[0]] = false;
        //let conEdges = this.network.getConnectedEdges(params.nodes[0], "from")


        this.deleteNodesChildren(params.nodes[0]);
        this.createLegend()

        if (this.legendInvisibleGroups(this.options).length == 0) {
          this.nodes.update(nodes);
          this.edges.update(edges);
        }
        //console.log(this.nodes.get())

      }

    }

    this.repeatInvisibility(this.options);

    if (this.legendInvisibleGroups(this.options).length == 0) {
      this.resetNodesAndEdgesVisibility()
    }

    //this.createLegend()

  }
  //creates the color by value ui
  colorPicker(graph) {
    // Create the dropdown menu

    var graph = graph;
    var dropdownDiv = document.createElement("div");
    dropdownDiv.id = "dropdown";
    dropdownDiv.setAttribute("id", "myDropdown");

    var dropdown = document.createElement("select");

    var option1 = document.createElement("option");
    option1.setAttribute("value", "setColorByProperty");
    option1.innerHTML = "Color by Property";

    var option2 = document.createElement("option");
    option2.setAttribute("value", "setColorByValue");
    option2.innerHTML = "Color by Value";

    // var option3 = document.createElement("option");
    // option3.setAttribute("value", "option3");
    // option3.innerHTML = "Option 3";

    dropdown.appendChild(option1);
    dropdown.appendChild(option2);
    //dropdown.appendChild(option3);

    dropdownDiv.appendChild(dropdown);

    // Add the dropdown menu to the page
    var body = document.getElementById("title")
    body.appendChild(dropdownDiv);

    // Get the selected value
    function getPath() {
      let path = "" + document.querySelector('#setColorByValueInput').value;

      let tempArray = path.split(",")

      let startColor = document.querySelector('#startColor').value;
      let endColor = document.querySelector('#endColor').value;

      graph.colorByValue(tempArray, graph.nodes.get(), graph.edges.get(), startColor, endColor);

      graph.nodes.update(graph.nodes.get())
      graph.edges.update(graph.edges.get())

      // graph.network.body.emitter.emit('_dataChanged');

      // graph.network.redraw();
    }


    // Add an event listener to get the selected value
    document.querySelector('#myDropdown select').addEventListener('change', function () {
      var selectedValue = this.value;

      if (selectedValue == "setColorByValue") {

        var input = document.createElement("input");
        input.type = "text";
        input.id = "setColorByValueInput";



        const usefulColors = ["orangered", "red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "gray"];
        const usefulColors2 = ["limegreen", "green", "orange", "yellow", "red", "blue", "purple", "pink", "brown", "gray"];

        // Create the select element
        const select = document.createElement("select");

        // Add options to the select element
        for (let i = 0; i < usefulColors.length; i++) {
          const option = document.createElement("option");
          option.value = usefulColors[i];
          option.text = usefulColors[i];
          select.appendChild(option);
        }
        select.id = "startColor";


        const select2 = document.createElement("select");

        // Add options to the select element
        for (let i = 0; i < usefulColors2.length; i++) {
          const option = document.createElement("option");
          option.value = usefulColors2[i];
          option.text = usefulColors2[i];
          select2.appendChild(option);
        }
        select2.id = "endColor";

        // Add a button to get the selected value
        var button = document.createElement("button");
        button.id = "setPath";
        button.innerHTML = "Set path";
        button.addEventListener("click", getPath);

        if (!document.getElementById("setColorByValueInput")) {
          document.getElementById("myDropdown").appendChild(input);
          document.getElementById("myDropdown").appendChild(select);
          document.getElementById("myDropdown").appendChild(select2);
          document.getElementById("myDropdown").appendChild(button);
        }
      }

      if (selectedValue == "setColorByProperty") {
        if (document.getElementById("setColorByValueInput")) {
          document.getElementById("setColorByValueInput").remove();
          document.getElementById("startColor").remove();
          document.getElementById("endColor").remove();
          document.getElementById("setPath").remove();
        }
        graph.recolorByProperty();
        graph.nodes.update(nodes)
        graph.edges.update(edges)
      }
      //alert("Selected value: " + selectedValue);
    });

  }
  // loads or saves the graph to a .txt file
  loadSaveFunctionality() {

    function saveState() {

      if (document.getElementById("setColorByValueInput")) {
        this.config.file.state = {
          nodes: nodes,
          edges: edges,
          colorFunction: document.querySelector('#myDropdown select').value,
          colorByValue: {
            startColor: document.querySelector('#startColor').value,
            endColor: document.querySelector('#endColor').value,
            path: document.querySelector('#setColorByValueInput').value
          }
        };


      } else {
        this.config.file.state = {
          nodes: nodes,
          edges: edges,
          colorFunction: document.querySelector('#myDropdown select').value,
          colorByValue: {}
        };
      }


      const json = this.config.file
      const filename = "data.txt";
      const text = JSON.stringify(json);

      const element = document.createElement("a");
      element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
      element.setAttribute("download", filename);
      element.style.display = "none";
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);

    }



    let element = document.createElement("BUTTON");
    element.innerHTML = "Save state";
    element.id = "save";
    element.addEventListener("click", saveState);

    document.getElementById("title").append(element)

    let element2 = document.createElement("BUTTON");
    element2.id = "load"
    element2.innerHTML = "Load state";
    element2.addEventListener("click", loadState);

    document.getElementById("title").append(element2)


    function loadState() {
      const input = document.createElement("input");
      input.type = "file";

      input.addEventListener("change", function () {
        const reader = new FileReader();
        reader.onload = function () {
          const jsonData = JSON.parse(reader.result);
          if (jsonData.state) {
            this.config.nodes = jsonData.state.nodes;
            this.config.edges = jsonData.state.edges;

            nodes = jsonData.state.nodes;
            edges = jsonData.state.edges;

            draw.edges = jsonData.state.edges;
            draw.nodes = jsonData.state.nodes;

            config = {
              nodes: jsonData.state.nodes,
              edges: jsonData.state.edges,
              options: options,
              graph: draw,
              file: this.config.file
            };

            document.getElementById("mynetwork").innerHTML = "";

            document.getElementById('myDropdown').remove();
            document.getElementById('save').remove();
            document.getElementById('load').remove();
            document.getElementById('search_input').remove();
            document.getElementById('search_select').remove();

            if (document.getElementById('setPath')) {
              document.getElementById('setPath').remove();
            }
            var graphtool = new GraphTool("mynetwork", config);
          } else {
            let nodes = [];
            let edges = [];
            let draw = new GraphDrawer(_config, jsonData, 5, true, nodes, edges); //createGraph.GraphDrawer(_config, jsonData, 5, true, nodes, edges);

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
            let config = {
              nodes: nodes,
              edges: edges,
              options: options,
              graph: draw,
              file: this.config.file
            };
            var graphtool = new GraphTool("mynetwork", config, _config, );
          }

          if (jsonData.state.colorFunction == "setColorByValue") {
            graphtool.changeColorDropdown("myDropdown", "setColorByValue")
            document.querySelector('#myDropdown select').dispatchEvent(new Event("change"));
            graphtool.changeStartEndColorDropdown("startColor", jsonData.state.colorByValue.startColor);
            graphtool.changeStartEndColorDropdown("endColor", jsonData.state.colorByValue.endColor);
            document.getElementById("setColorByValueInput").value = jsonData.state.colorByValue.path;
            graphtool.colorByValue([jsonData.state.colorByValue.path], nodes, edges, jsonData.state.colorByValue.startColor, jsonData.state.colorByValue.endColor)
            graphtool.nodes.update(nodes);
            graphtool.edges.update(edges);
          }

          delete jsonData.state;
          this.config.file = jsonData;


        };
        reader.readAsText(this.files[0]);
      });

      input.click();
    }
  }
  //generates the legend for the graph
  createLegend() {
    var invisibleGroups = [];

    if (!document.getElementById("legendContainer")) {

      Object.keys(draw.colorObj).forEach((key) => {

        options.groups[key] = {
          hidden: false
        };
      });

    }

    if (document.getElementById("legendContainer")) {

      invisibleGroups = this.legendInvisibleGroups(this.options);

      document.getElementById("legendContainer").remove();
    }
    var legendDiv = document.createElement("div");
    let vis_cont = document.getElementById("vis_container")
    vis_cont.append(legendDiv);
    legendDiv.style.width = '100%';
    legendDiv.style.position = 'relative';
    legendDiv.style.display = 'inline-block';
    legendDiv.id = "legendContainer";
    var legendColors = draw.colorObj
    var legendSet = {}
    for (var i = 0; i < edges.length; i++) {
      if (!legendSet[edges[i].group]) {
        //legendColors[input.properties[i]] = colors[i];
        var propertyContainer = document.createElement("div");
        var propertyColor = document.createElement("div");
        var propertyName = document.createElement("div");
        propertyContainer.className = "legend-element-container";
        propertyContainer.id = edges[i].label;
        propertyColor.className = "color-container";
        propertyName.className = "name-container";
        propertyColor.style.float = "left";
        propertyName.style.float = "left";
        propertyColor.style.border = "1px solid black";
        propertyName.style.border = "1px solid black";
        propertyColor.style.background = legendColors[edges[i].group]
        propertyColor.innerHTML = "";
        propertyName.innerHTML = edges[i].label;
        propertyColor.style.width = "30px";
        propertyColor.style.height = "30px";
        propertyName.style.height = "30px";
        propertyName.style.background = '#DEF';
        //propertyName.text-align = 'center';
        propertyContainer.paddinng = '5px 5px 5px 5px';
        propertyName.addEventListener("click", (e) => this.legendFunctionality(e));
        propertyColor.addEventListener("click", (e) => this.legendFunctionality(e));
        legendDiv.append(propertyContainer);
        propertyContainer.append(propertyColor);
        propertyContainer.append(propertyName);
        legendSet[edges[i].group] = legendColors[edges[i].group];
      }
    }


    this.setInvisibleLegendGroupsWhite(invisibleGroups);
  }

  changeColorDropdown(id, valueToSelect) {
    let element = document.querySelector('#' + id + ' select');
    element.value = valueToSelect;
  }

  changeStartEndColorDropdown(id, valueToSelect) {
    let element = document.querySelector('#' + id);
    element.value = valueToSelect;
  }

  //function to set nodes and edges hidden when legend is clicked
  setNodeVisibilityByVisiblePath = (nodeId, rootNodeId) => {
    if (nodeId == rootNodeId) return true; //root is always visible
    var node = this.nodes.get(nodeId);
    if (node.visited) return !node.hidden //prevent circles. ToDo: Reuse results between runs
    node.visited = true;
    node.hidden = true;
    var connectedEdgesIds = this.network.getConnectedEdges(nodeId);
    var connectedEdges = this.edges.get(connectedEdgesIds);
    connectedEdges.forEach((edge) => {
      if (edge.hidden) return; //don't follow hidden edges
      var connectedNodesIds = this.network.getConnectedNodes(edge.id);
      var connectedNodes = this.nodes.get(connectedNodesIds);
      connectedNodes.forEach((connectedNode) => {
        if (connectedNode.id == nodeId) return; //prevent self evaluation
        if (this.setNodeVisibilityByVisiblePath(connectedNode.id, rootNodeId)) {
          node.hidden = false; //set node visible, if at least one connected node is visible
        }
      });
    });
    node.physics = !node.hidden; //disable physics for hidden nodes
    return !node.hidden;
  }

  //turns clicked properties of the legend invisible or back to visible
  legendFunctionality = (e) => {
    console.log(this.options.groups);
    var legendGroup;
    var group;
    var nodeChildren;
    var strategy = "strategy2"
    if (strategy == "strategy2") {

      if (!e.repeat) {
        legendGroup = e.target.parentNode.childNodes[1].innerHTML;
        //A node is visible if at least one path over visible edges to the root node exists.
        this.options.groups[legendGroup].hidden = !this.options.groups[legendGroup].hidden; //toggle state
        if (this.options.groups[legendGroup].hidden) e.target.parentNode.childNodes[1].style.background = '#FFFFFF';
        else e.target.parentNode.childNodes[1].style.background = '#DEF';
      }
      //update all edges. ToDo: Consider: https://visjs.github.io/vis-network/examples/network/data/dynamicFiltering.html
      this.edges.forEach((edge) => {
        edge.hidden = this.options.groups[edge.group].hidden;
        edge.physics = !edge.hidden;
        this.edges.update(edge); //see also: https://visjs.github.io/vis-network/examples/network/data/datasets.html
      });

      //reset nodes
      this.nodes.forEach((node) => {
        node.hidden = false;
        node.physics = !node.hidden;
        node.visited = false;
      });

      //check each node
      this.nodes.forEach((node) => {
        this.setNodeVisibilityByVisiblePath(node.id, 0)
        //reset visited state. Todo: Reuse visited nodes between runs
        this.nodes.forEach((node) => {
          node.visited = false;
        });

        this.nodes.update(node); //see also: https://visjs.github.io/vis-network/examples/network/data/datasets.html
      });
    }

    var allFalse = Object.keys(options.groups).every(function (k) {
      if (k === 'useDefaultGroups') {
        return true
      }
      return options.groups[k].hidden === false
    });

    if (allFalse === true) {
      /*oldGroups = {};*/
    }


  };

  showSelectionOptions() {
    let sel_nodes = this.network.getSelectedNodes()
    if (sel_nodes.length == 0) {
      // remove options
      if (!this.pressed_keys.includes('q')){
        this.options_container.innerHTML = ""
      }


    } else if (sel_nodes.length == 1) {
      // show options of single node
      console.log("show options")
      let node = this.nodes.get(sel_nodes[0])
      if (typeof node.showOptions === 'function') {
        console.log(node, node.showOptions, this.options_container.id)
        let optionsId = this.options_container.id
        node.showOptions(optionsId)
      } else {
        this.showOptions_default(node, this.options_container.id)
      }
    } else {
      // show common properties
      /**/
      if (true) {

        // make options gui

        this.options_container.innerHTML = "<h3>comparison between nodes</h3>"
        let comparison_container = document.createElement("div")
        comparison_container.setAttribute("id", "comparison_container")
        this.options_container.append(comparison_container)
        this.options_container.append(document.createElement("H2").appendChild(document.createTextNode("common types")))

        let setForAllContainer = document.createElement("div")
        setForAllContainer.setAttribute("id", "setForAllContainer")
        this.options_container.append(setForAllContainer)


        // create table_data for comparison

        let table_data = []
        for (let node_id of sel_nodes) {
          let node = this.nodes.get(node_id)
          table_data.push({
            'id': node_id,
            color: JSON.stringify(node.color),
            x: node.x,
            y: node.y,
            typeString: node.typeString,
            fixed: node.fixed,
          })
        }

        const fixedEdit = (cell) => {
          console.log(cell)
          let node = this.nodes.get(cell._cell.row.data.id)
          let id = cell._cell.row.data.id
          node.fixed = Boolean(cell._cell.value)
          console.log(node)
          this.nodes.update(node)
        }

        const xEdit = (cell) => {
          console.log(cell)
          console.log(cell._cell.row.data.id)
          let node = this.nodes.get(cell._cell.row.data.id)

          let id = cell._cell.row.data.id
          let x = cell._cell.value
          let y = node.y
          console.log(id, x, y)
          this.network.moveNode(id, x, y)
          this.nodes.update({
            id: id,
            x: x
          })
        }

        const yEdit = (cell) => {
          console.log(cell)
          console.log(cell._cell.row.data.id)
          let node = this.nodes.get(cell._cell.row.data.id)

          let id = cell._cell.row.data.id
          let x = node.x
          let y = cell._cell.value
          console.log(id, x, y)
          this.network.moveNode(id, x, y)
          this.nodes.update({
            id: id,
            y: y
          })
        }

        const colorEdit = (cell) => {
          console.log(cell)
          console.log(cell._cell.row.data.id)
          let node = this.nodes.get(cell._cell.row.data.id)

          let id = cell._cell.row.data.id

          node.color = JSON.parse(cell._cell.value)
          console.log('new node color: ', node.color)
          this.nodes.update(node)
        }

        let tabul = new Tabulator("#" + comparison_container.id, {
          data: table_data,
          columns: [{
              title: "id",
              field: "id",
              editor: "input"
            },
            {
              title: "typeString",
              field: "typeString"
            },
            {
              title: "x",
              field: "x",
              editor: "input",
              cellEdited: xEdit
            },
            {
              title: "y",
              field: "y",
              editor: "input",
              cellEdited: yEdit
            },
            {
              title: "fixed",
              field: "fixed",
              editor: true,
              formatter: "tickCross",
              cellEdited: fixedEdit
            },
            {
              title: "color",
              field: "color",
              editor: "input",
              cellEdited: colorEdit
            },
          ]
        })

        const allXEdit = (cell) => {
          console.log(cell)
          for (let node_id of this.network.getSelectedNodes()) {
            let node = this.nodes.get(node_id)
            let id = node_id
            let x = cell._cell.value
            let y = node.x
            this.network.moveNode(id, x, y)
            this.nodes.update({
              id: id,
              y: y
            })
          }
        }
        const allYEdit = (cell) => {
          console.log(cell)
          for (let node_id of this.network.getSelectedNodes()) {
            let node = this.nodes.get(node_id)
            let id = node_id
            let x = node.x
            let y = cell._cell.value
            console.log(id, x, y)
            this.network.moveNode(id, x, y)
            this.nodes.update({
              id: id,
              y: y
            })
          }
        }
        const allColorEdit = (cell) => {
          console.log(cell)
          for (let node_id of this.network.getSelectedNodes()) {
            let node = this.nodes.get(node_id)
            node.color = JSON.parse(cell._cell.value)
            this.nodes.update(node)
          }
        }

        const allFixedEdit = (cell) => {
          console.log(cell)
          for (let node_id of this.network.getSelectedNodes()) {
            let node = this.nodes.get(node_id)
            node.fixed = Boolean(cell._cell.value)
            console.log(node)
            this.nodes.update(node)
          }
        }

        let setForAllTable = new Tabulator("#" + setForAllContainer.id, {
          data: [table_data[0]],
          columns: [{
              title: "id",
              field: "id",
              editor: "input"
            },
            {
              title: "typeString",
              field: "typeString"
            },
            {
              title: "x",
              field: "x",
              editor: "input",
              cellEdited: allXEdit
            },
            {
              title: "y",
              field: "y",
              editor: "input",
              cellEdited: allYEdit
            },
            {
              title: "fixed",
              field: "fixed",
              editor: true,
              formatter: "tickCross",
              cellEdited: allFixedEdit
            },
            {
              title: "color",
              field: "color",
              editor: "input",
              cellEdited: allColorEdit
            },
          ]
        })
      } else {
        let content = "<h3>Node IDs</h3><br>"
        for (let node_id of sel_nodes) {

          content += "<br>" + node_id

        }
        this.options_container.innerHTML = content
      }

    }
  }
}


//let clicked = {};

$(document).ready(function () {

  //let result = jsonpath.query(draw.file, '$..[?(@=="2000")]');

  let data = clone.jsondata;


  console.log(data)

  function findKeyPath(obj, key, path = '', results = []) {
    for (let prop in obj) {
      if (prop === key && Array.isArray(obj[prop]) && obj[prop].every(item => typeof item === 'object' && item !== null)) {
        results.push(path + prop);
      }
      if (typeof obj[prop] === 'object' && obj[prop] !== null) {
        findKeyPath(obj[prop], key, path + prop + '.', results);
      }
    }
    return results;
  }


  function searchJSON(data, searchValue) {

    // const searchValue = '2022';
    // const jsonPathExpression = `$..[?(@=="${searchValue}")]`;
    const matches = jsonpath.query(data, `$..[?(@=="${searchValue}")]`);

    const result = [...new Set(matches.flatMap(match =>
      jsonpath.paths(data, `$..[?(@=="${match}")]`).map(key =>
        `${key.join('.')}` //: ${match}
      )
    ))];

    return result;

  }
  var idsToColor = [];

  var coloredNodesConnectedToRoot = [];

  function IsStartObjectInGraph(foundPaths, searchValue, initialSearchValue) {

    //console.log(foundPaths)

    let nodesWithObject = [];

    let objectInOnject = [] //findKeyPath(data, searchValue);

    if (objectInOnject.length == 0) {

      for (let i = 0; i < foundPaths.length; i++) {

        let path = foundPaths[i].split(".")[1];

        let path2 = foundPaths[i].split(".");


        if (Array.isArray(data[path2[1]][path2[2]]) && typeof data[path2[1]][path2[2]][0] === 'object' && data[path2[1]][path2[2]][0] !== null) {

          let startId = 0;
          let nodes = graphtool.nodes.get();
          //let idsToColor = [];

          const nodesWithLabel = graphtool.nodes.get({
            filter: function (node) {
              return (node.object === path2[1]);
            }
          });

          if (nodesWithLabel.length > 0) {

            startId = nodesWithLabel[0].id;

          }

          if (!(path2[1] == nodes[0].object) && nodesWithLabel.length == 0) {

            let searchExistingNodes = searchJSON(data, path2[1]);
            //console.log(searchExistingNodes)
            let found = IsStartObjectInGraph(searchExistingNodes, false, initialSearchValue);
            //console.log(found)
            idsToColor.push(found[0].id);

            let params = {
              nodes: [found[0].id]
            }

            graphtool.expandNodes(params);

            let objectInOnject = findKeyPath(data, initialSearchValue);

            if (objectInOnject.length == 0) {

              console.log("here")
              searchExistingNodes = searchJSON(data, searchValue);

              found = IsStartObjectInGraph(searchExistingNodes, false, initialSearchValue);
            } else {

              const nodesWithLabel = graphtool.nodes.get({
                filter: function (node) {
                  return (node.object === path2[1]);
                }
              });

              for (let i = 0; i < nodesWithLabel.length; i++) {

                idsToColor.push(nodesWithLabel[i].id);

                let params = {
                  nodes: [nodesWithLabel[i].id]
                }

                graphtool.expandNodes(params);
              }

              console.log(idsToColor)

              let nodes = graphtool.nodes.get();

              nodes.forEach((node) => {

                if (node.label == initialSearchValue || idsToColor.includes(node.id)) {
                  node.color = draw.colorObj[node.group];
                  graphtool.nodes.update(node);
                  idsToColor.push(node.id)
                }

                if (!(idsToColor.includes(node.id)) && node.id != 0 && node.label != initialSearchValue) {
                  node.color = "#ffffff"
                  graphtool.nodes.update(node);
                }

              });

              let edges = graphtool.edges.get();

              edges.forEach((edge) => {

                if (idsToColor.includes(edge.to)) {
                  edge.color = draw.colorObj[edge.group];
                  graphtool.edges.update(edge);
                }

                if (!(idsToColor.includes(edge.to))) {
                  edge.color = "#000000"
                  graphtool.edges.update(edge);
                }




              });

            }

            //let done = expandNodesTillFoundValue(found, searchValue);

            // const nodesWithLabel = graphtool.nodes.get({
            //   filter: function(node) {
            //       return (node.object === path2[1]);
            //   }
            // });

            // let params = {nodes:[nodesWithLabel[0].id]}

            // graphtool.expandNodes(params);

            //found = IsStartObjectInGraph(searchExistingNodes);
            //console.log(nodesWithLabel)
          }
          if (nodesWithLabel.length > 0 || path2[1] == nodes[0].object) {


            for (let i = 2; i < path2.length; i += 2) {
              // console.log(startId)
              // console.log(path2)

              if (!(path2[i + 1] == undefined)) {


                let connectedNodeIds = graphtool.network.getConnectedNodes(startId, "to");

                if (connectedNodeIds.length == 0) {

                  idsToColor.push(startId);

                  let params = {
                    nodes: [startId]
                  }

                  graphtool.expandNodes(params);

                }

                connectedNodeIds = graphtool.network.getConnectedNodes(startId, "to");

                const connectedNodes = graphtool.nodes.get(connectedNodeIds);

                const filteredNodes = connectedNodes.filter(node => node.label === path2[i]);

                const filteredNodeIds = filteredNodes.map(node => node.id);

                idsToColor.push(filteredNodeIds[path2[i + 1]]);

                let params = {
                  nodes: [filteredNodeIds[path2[i + 1]]]
                }

                let connectedNodesSet = graphtool.network.getConnectedNodes(filteredNodeIds[path2[i + 1]], "to");

                if (connectedNodesSet.length == 0) {

                  graphtool.expandNodes(params);

                }

                startId = filteredNodeIds[path2[i + 1]];

              }

            }


            let nodes = graphtool.nodes.get();

            nodes.forEach((node) => {



              if (node.label == initialSearchValue || idsToColor.includes(node.id)) {
                node.color = draw.colorObj[node.group];
                graphtool.nodes.update(node);
                idsToColor.push(node.id)
              }

              if (!(idsToColor.includes(node.id)) && node.id != 0 && node.label != initialSearchValue) {
                node.color = "#ffffff"
                graphtool.nodes.update(node);
              }



            });

            let edges = graphtool.edges.get();

            edges.forEach((edge) => {

              if (idsToColor.includes(edge.to)) {
                edge.color = draw.colorObj[edge.group];
                graphtool.edges.update(edge);
              }



              if (!(idsToColor.includes(edge.to))) {
                edge.color = "#000000"
                graphtool.edges.update(edge);
              }

            });
          }

        } else {

          let nodes = graphtool.nodes.get();
          let edges = graphtool.edges.get();

          if (path == nodes[0].object) {

            if (idsToColor.length == 0) {

              let connectedNodesToRoot = graphtool.network.getConnectedNodes(0, "to");

              for (let i = 0; i < connectedNodesToRoot.length; i++) {

                graphtool.nodes.get(connectedNodesToRoot[i]).color = "#ffffff";
                graphtool.nodes.update(graphtool.nodes.get(connectedNodesToRoot[i]));

              }

              let connectedEdgesToRoot = graphtool.network.getConnectedEdges(0);

              for (let i = 0; i < connectedEdgesToRoot.length; i++) {

                graphtool.edges.get(connectedEdgesToRoot[i]).color = "#000000";
                graphtool.edges.update(graphtool.edges.get(connectedEdgesToRoot[i]));

              }

            }

            nodes.forEach((node) => {
              if (node.label == initialSearchValue || idsToColor.includes(node.id)) {

                node.color = draw.colorObj[node.group];

                graphtool.nodes.update(node);
                if (!(idsToColor.includes(node.id))) {
                  idsToColor.push(node.id);
                }

              }

            });

            edges.forEach((edge) => {
              if (idsToColor.includes(edge.to) || idsToColor.includes(edge.to)) {
                edge.color = draw.colorObj[edge.group];
                graphtool.edges.update(edge);
              }
            });




            //console.log("here")
            continue;
          }

          nodes = graphtool.nodes.get();

          nodes.forEach((node) => {

            if (node.object === path) {

              nodesWithObject.push(node);

            }

          });
          if (nodesWithObject.length == 0) {

            let searchExistingNodes = searchJSON(data, path);
            let found = IsStartObjectInGraph(searchExistingNodes);
            nodesWithObject.push(found);
          }

        }

      }
    } else {
      for (let i = 0; i < objectInOnject.length; i++) {
        objectInOnjectNodes(objectInOnject[i], searchValue, initialSearchValue)
      }
    }
    nodesWithObject = [...new Set(nodesWithObject.map(obj => JSON.stringify(obj)))].map(str => JSON.parse(str));

    nodesWithObject = nodesWithObject.flat(Infinity);

    return nodesWithObject;

  }

  function objectInOnjectNodes(path, searchValue, initialSearchValue) {



  }

  function expandNodesTillFoundValue(startingNode, searchValue) {


    if (startingNode.length == 0) {
      return;
    }

    for (let i = 0; i < startingNode.length; i++) {
      idsToColor.push(startingNode[i].id);
      let params = {
        nodes: [startingNode[i].id]
      }

      let connectedNodesTo = graphtool.network.getConnectedNodes(startingNode[i].id, "to");
      if (connectedNodesTo.length == 0) {
        graphtool.expandNodes(params);
      }

    }



    let nodes = graphtool.nodes.get();
    //console.log(nodes)
    let nodeExists = false;


    nodes.forEach((node) => {



      if (node.label == searchValue || idsToColor.includes(node.id)) {
        node.color = draw.colorObj[node.group];
        graphtool.nodes.update(node);
        idsToColor.push(node.id);
      }

      if (!(idsToColor.includes(node.id)) && node.id != 0 && node.label != searchValue) {
        node.color = "#ffffff"
        graphtool.nodes.update(node);
      }



    });
    let edges = graphtool.edges.get();

    edges.forEach((edge) => {

      if (idsToColor.includes(edge.to)) {
        edge.color = draw.colorObj[edge.group];
        graphtool.edges.update(edge);
      }

      if (!(idsToColor.includes(edge.to))) {
        edge.color = "#000000"
        graphtool.edges.update(edge);
      }

    });

    nodes.forEach((node) => {

      if (node.label === searchValue) {

        var edgesToNode = graphtool.network.getConnectedEdges(node.id, {
          to: true
        }).filter(function (edgeId) {
          return graphtool.edges.get(edgeId).to == node.id;
        });

        if (graphtool.edges.get(edgesToNode)[0].from != 0) {

          nodeExists = true;
          return;

        }
      }
    });

    if (nodeExists === false) {
      console.log("here")
      let found = searchJSON(data, searchValue);
      let nodesToStart = IsStartObjectInGraph(found);
      //console.log(nodesToStart)
      let done = expandNodesTillFoundValue(nodesToStart, searchValue);
      return;
    }

  }

  function pathIsObjectInObject(paths) {

    for (let i = 0; i < paths.length; i++) {

      let path = paths[i].split(".");

      if (Array.isArray(data[path[1]][path[2]]) && typeof data[path[1]][path[2]][0] === 'object' && data[path[1]][path[2]][0] !== null) {

        let startId = 0;

        for (let i = 2; i < path.length; i += 2) {

          if (!(path[i + 1] == undefined)) {
            const connectedNodeIds = graphtool.network.getConnectedNodes(startId, "to");

            const connectedNodes = graphtool.nodes.get(connectedNodeIds);

            const filteredNodes = connectedNodes.filter(node => node.label === path[i]);

            const filteredNodeIds = filteredNodes.map(node => node.id);

            let params = {
              nodes: [filteredNodeIds[path[i + 1]]]
            }

            graphtool.expandNodes(params);

            startId = filteredNodeIds[path[i + 1]];

          }

        }


      } else {

      }
    }
  }

  function searchFunctionality(data, searchValue) {

    let found;

    if (findKeyPath(data, searchValue).length > 0) {
      found = findKeyPath(data, searchValue);

      for (let i = 0; i < found.length; i++) {
        found[i] = '$.' + found[i];
      }
    } else {
      found = searchJSON(data, searchValue)
    }

    let nodesToStart = IsStartObjectInGraph(found, searchValue, searchValue);


    let done = expandNodesTillFoundValue(nodesToStart, searchValue);

  }

  const container = document.getElementById('title');

  const inputField = document.createElement('input');
  inputField.type = 'text';
  inputField.id = 'input-field';

  const submitButton = document.createElement('button');
  submitButton.id = 'submit-button';
  submitButton.textContent = 'Submit';

  container.appendChild(inputField);
  container.appendChild(submitButton);

  submitButton.addEventListener('click', function () {
    const inputValue = inputField.value;

    let inputString = inputValue;

    searchFunctionality(data, inputString)

  });







  //console.log(graphtool.nodes.get())
  //console.log(searchJSON(data, '2022'))
  //console.log(result[0].split(".")[1]);

  // function removeItem(arr, value) {
  //   var index = arr.indexOf(value);
  //   if (index > -1) {
  //       arr.splice(index, 1);
  //   }
  //   return arr;
  // }

  // function findAllPaths(startNode, endNode) {
  //   var visitedNodes = [];
  //   var currentPath = [];
  //   var allPaths = [];
  //   dfs(startNode, endNode, currentPath, allPaths, visitedNodes);
  //   return allPaths;
  // }
  // //Algorithm to search for all paths between two nodes
  // function dfs(start, end, currentPath, allPaths, visitedNodes) {
  //   if (visitedNodes.includes(start)) return;
  //   visitedNodes.push(start);
  //   currentPath.push(start);
  //   if (start == end) {
  //       var localCurrentPath = currentPath.slice();
  //       allPaths.push(localCurrentPath);
  //       removeItem(visitedNodes, start);
  //       currentPath.pop();
  //       return;
  //   }
  //   var neighbours = graphtool.network.getConnectedNodes(start);
  //   for (var i = 0; i < neighbours.length; i++) {
  //       var current = neighbours[i];
  //       dfs(current, end, currentPath, allPaths, visitedNodes);
  //   }
  //   currentPath.pop();
  //   removeItem(visitedNodes, start);
  // }

  // console.log(findAllPaths(2,28))

  // const searchValue = '2022';
  // const jsonPathExpression = `$..[?(@=="${searchValue}")]`;
  // const matches = jsonpath.query(data, jsonPathExpression);

  // const result = matches.reduce((acc, match) => {
  //   const keys = jsonpath.paths(data, `$..[?(@=="${match}")]`);
  //   return acc.concat(keys.map(key => `${key.join('.')}: ${match}`));
  // }, []);

  // console.log(result)

  // const searchObject = (obj, searchValue) => {
  //   let result = [];
  //   for (let key in obj) {
  //     if (obj[key] === searchValue) {
  //       result.push(key);
  //     } else if (typeof obj[key] === 'object') {
  //       const nestedResult = searchObject(obj[key], searchValue);
  //       if (nestedResult.length > 0) {
  //         result = result.concat(nestedResult.map(nestedKey => `${key}.${nestedKey}`));
  //       }
  //     }
  //   }
  //   return result;
  // };

  // const searchValue = '2022';
  // const jsonPathExpression = `$..[?(@=="${searchValue}")]`;
  // const matches = jsonpath.query(data, jsonPathExpression, 1);


  // const result = matches.reduce((acc, match) => {
  //   console.log(match)
  //   const keys = searchObject(data, match);
  //   return acc.concat(keys.map(key => `${key}: ${match}`));
  // }, []);

  // console.log(result); 

  //console.log(data["Item:MyProject"]["budget"][0]["budget"][0]["value"])
  //console.log(data["Item:MyProject"]["budget"][0]["budget"][1]["value"])


  // "Item:MyProject.budget.0.budget.0.year: 2022"
  // "Item:MyProject.budget.0.budget.1.year: 2022"

  //const result = jsonpath.query(data, '$..[?(@=="Fiesta")]');


  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // function searchJSON(json, search, keys=[]) {
  //   for (var key in json) {
  //     if (json.hasOwnProperty(key)) {
  //       var val = json[key];
  //       if (typeof val === 'object') {
  //         searchJSON(val, search, keys);
  //       } else if (val === search) {
  //         keys.push(key);
  //       }
  //     }
  //   }
  //   return keys;
  // }




  // const key = searchJSON(new_json["jsondata"], "2000");
  // console.log(key); // prints "person2"


  // function findParentKeys(jsonObj, keyToFind, parentKey = null) {
  //   let parentKeys = [];
  //   if (typeof jsonObj !== "object") {
  //     return parentKeys;
  //   }

  //   if (Array.isArray(jsonObj)) {
  //     for (let i = 0; i < jsonObj.length; i++) {
  //       if (jsonObj[i][keyToFind] !== undefined) {
  //         if (parentKey !== null) {
  //           parentKeys.push(parentKey);
  //         }
  //         //parentKeys.push(i);
  //       } else {
  //         let nestedParentKeys = findParentKeys(
  //           jsonObj[i],
  //           keyToFind,
  //           parentKey
  //         );
  //         if (nestedParentKeys.length > 0) {
  //           parentKeys = parentKeys.concat(nestedParentKeys);
  //         }
  //       }
  //     }
  //   } else {
  //     for (let key in jsonObj) {
  //       if (key === keyToFind) {
  //         if (parentKey !== null) {
  //           parentKeys.push(parentKey);
  //         }
  //       } else if (typeof jsonObj[key] === "object") {
  //         let nestedParentKeys = findParentKeys(
  //           jsonObj[key],
  //           keyToFind,
  //           key
  //         );
  //         if (nestedParentKeys.length > 0) {
  //           parentKeys = parentKeys.concat(nestedParentKeys);
  //         }
  //       }
  //     }
  //   }
  //   return parentKeys;
  // }




  // const out = findParentKeys(new_json["jsondata"], "not_in_context")
  // console.log(out)

});


export {
  GraphTool,
  GraphDrawer,
  vis
}
