import { test } from 'tap'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import * as browsers from 'playwright'


// esm workarounds
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let browser, page

// const engines = [
//   'chromium',
//   'firefox',
//   'webkit'
// ]

(async () => {

    browser = await browsers['firefox'].launch()
    page = await browser.newPage()

    await page.goto(`file://${join(__dirname, '../fixtures/index.html')}`)
    await page.addScriptTag({
        path: join(__dirname, '../../dist/isg.umd.js')
    })

    const newJson = {"jsonschema": {
      "Category:Entity": {
          "@context": {
              "label": "Property:HasLabel"
          }
      },
      "Category:Item": {
          "@context": [
              "Category:Entity",
              {
                  "member": {"@id": "Property:HasMember", "@type": "@id"},
                  "other": {"@id": "Property:HasOther", "@type": "@id"},
                  "budget": {"@id": "Property:HasBudget", "@type": "@id"},
                  "some_property": {"@id": "Property:HasSomeItem", "@type": "@id"},
                  "some_literal": "Property:HasSomeLiteral"
              }
              ],
          "properties": {
              "label": [{
                  "type": "array",
                  "title": "Labels",
                  "items": {
                      "type": "object",
                      "title": "Label",
                      "properties": {
                          "text": {},
                          "lang": {}
                      }
                  }
              }],
              "member": {
                  "type": "string",
                  "title": "Member"
              },
              "budget": {
                  "type": "array",
                  "title": "Budgets",
                  "items": {
                      "type": "object",
                      "title": "Budget",
                      "properties": {
                          "year": {"title": "Year"},
                          "value": {"title": "BudgetValue"}
                      }
                  }
              }
          }
      }
      
      }, 
    "jsondata": {
      "Item:MyProject": {
          "type": ["Category:Item"],
          "label": [{"text": "My Project", "lang": "en"}, {"text": "Projekt", "lang": "de"}],
          "member": ["Item:SomePerson", "Item:SomePerson"], //"Item:MyOtherItem"
          "other": ["Item:SomePerson"],
          "some_literal": ["Some string","Some","string",],
          "not_in_context": "Not in Context",
          "budget": [{
              "year": "2000",
              "value": "10000",
              "budget":[{
                "year": "2023",
                "value": "10",
                "other":["Item:MySecondItem"]}, {
                  "year": "2022",
                  "value": "20"}]
          },{
            "year": "2001",
            "value": "20000"
        },{
          "year": "2002",
          "value": "30000"
      },{
        "year": "2003",
        "value": ["40000","50000"]
    }]
      },
      "Item:SomePerson": {
          "type": ["Category:Item"],
          "label": [{"text": "Max Mustermann", "lang": "en"}],
          "some_property": "Item:MyOtherItem"
      },
      "Property:HasMember": {
          "type": ["Category:Property"],
          "label": [{"text": "Has Member", "lang": "en"}]
      },
      "Item:MyOtherItem": {
        "type": ["Category:Item"],
        "label": [{"text": "My Other", "lang": "en"}],
        "member": ["Item:MyNewItem"],
        "some_literal": "Some string",
        "not_in_context": "Not in Context",
        "budget":[{
                "year": "2022",
                "value": "10"}, {
                  "year": "2022",
                  "value": "20"}]
        
      },
      "Item:MyNewItem": {
        "type": ["Category:Item"],
        "label": [{"text": "My New Other", "lang": "en"}],
        "other":["Item:MySecondItem"]
        
      },
      "Item:MySecondItem": {
        "type": ["Category:Item"],
        "label": [{"text": "My Second Other", "lang": "en"}]
        
      },
    
    }};

    const configFile = {
      "type": [
        "Category:OSWaf511685f7c044e49bcdc5e32e58b19a"
      ],
      "graph_container_id": "mynetwork",
      "root_node_objects": [
        {
          "node_id": "Item:MyProject",
          "expansion_depth": 1,
          "properties": [
            "property1"
          ],
          "expansion_path": "path.path.path"
        },
        {
          "node_id": "Item:MyOtherItem",
          "expansion_depth": 1,
          "properties": [
            "property2"
          ],
          "expansion_path": "path.path.path.path"
        }
      ],
      "uuid": "c70c0a9a-dc29-4d92-92d6-043c5ec760ea",
      "label": [
        {
          "text": "config1",
          "lang": "en"
        }
      ],
      "expanded_paths": [
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:MyProject/some_literal/0"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:MyProject/some_literal/1"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:MyProject/some_literal/2"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:MyProject/not_in_context"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:SomePerson",
          "jsondata/Item:MyOtherItem",
          "jsondata/Item:MyNewItem"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:SomePerson",
          "jsondata/Item:MyOtherItem",
          "jsondata/Item:MyOtherItem/some_literal"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:SomePerson",
          "jsondata/Item:MyOtherItem",
          "jsondata/Item:MyOtherItem/not_in_context"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:SomePerson",
          "jsondata/Item:MyOtherItem",
          "jsondata/Item:MyOtherItem/budget/0",
          "jsondata/Item:MyOtherItem/budget/0/year"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:SomePerson",
          "jsondata/Item:MyOtherItem",
          "jsondata/Item:MyOtherItem/budget/0",
          "jsondata/Item:MyOtherItem/budget/0/value"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:SomePerson",
          "jsondata/Item:MyOtherItem",
          "jsondata/Item:MyOtherItem/budget/1",
          "jsondata/Item:MyOtherItem/budget/1/year"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:SomePerson",
          "jsondata/Item:MyOtherItem",
          "jsondata/Item:MyOtherItem/budget/1",
          "jsondata/Item:MyOtherItem/budget/1/value"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:MyProject/budget/0",
          "jsondata/Item:MyProject/budget/0/year"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:MyProject/budget/0",
          "jsondata/Item:MyProject/budget/0/value"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:MyProject/budget/0",
          "jsondata/Item:MyProject/budget/0/budget/0",
          "jsondata/Item:MyProject/budget/0/budget/0/year"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:MyProject/budget/0",
          "jsondata/Item:MyProject/budget/0/budget/0",
          "jsondata/Item:MyProject/budget/0/budget/0/value"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:MyProject/budget/0",
          "jsondata/Item:MyProject/budget/0/budget/1",
          "jsondata/Item:MyProject/budget/0/budget/1/year"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:MyProject/budget/0",
          "jsondata/Item:MyProject/budget/0/budget/1",
          "jsondata/Item:MyProject/budget/0/budget/1/value"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:MyProject/budget/1",
          "jsondata/Item:MyProject/budget/1/year"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:MyProject/budget/1",
          "jsondata/Item:MyProject/budget/1/value"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:MyProject/budget/2",
          "jsondata/Item:MyProject/budget/2/year"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:MyProject/budget/2",
          "jsondata/Item:MyProject/budget/2/value"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:MyProject/budget/3",
          "jsondata/Item:MyProject/budget/3/year"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:MyProject/budget/3",
          "jsondata/Item:MyProject/budget/3/value/0"
      ],
      [
          "jsondata/Item:MyProject",
          "jsondata/Item:MyProject/budget/3",
          "jsondata/Item:MyProject/budget/3/value/1"
      ]
  ],
      "expanded_nodes": [
        {
          "node_id": "item:test",
          "expansion_depth": 1,
          "properties": [
            "property 1"
          ],
          "expansion_path": "path.path"
        }
      ],
      "coloring_function_object": {
        "function_name": "colorByValue",
        "path": "value",
        "start_color": "orangered",
        "end_color": "limegreen"
      },
      "positioning_function_object": {
        "test": null
      },
      "visual_search_function_object": {
        "search_string": "budget",
        "search_on": "nodes"
      },
      "dataset_search_function_object": {
        "search_string": "20",
        "search_on": "nodes",
        "keep_expanded": true
      },
      "visual_nodes_edges_object": {
        "nodes": [
          [
            "node 1",
            "node 2"
          ]
        ],
        "edges": [
          [
            "edge 1",
            "edge 2"
          ]
        ]
      },
      "initial_dataset": {
        "jsondata": {
          "jsondata_old": {}
        },
        "jsonschema": {
          "jsonschema_old": {}
        }
      },
      "data_format": [
        "format"
      ],
      "dataset_schema": [
        "schema"
      ],
      "name": "Config1"
    }

    const evaluationResult = await page.evaluate(({ newJson, configFile }) => {
      const ge = new isg.Graph.Graph(newJson, configFile);
      
      // repeatInvisibility test
      const repeatInvisibilityInput = {
        "interaction": {
            "hover": true,
            "multiselect": true
        },
        "manipulation": {
            "enabled": true
        },
        "physics": {
            "stabilization": {
                "enabled": true
            },
            "barnesHut": {
                "gravitationalConstant": -40000,
                "centralGravity": 0,
                "springLength": 0,
                "springConstant": 0.5,
                "damping": 1,
                "avoidOverlap": 0
            },
            "maxVelocity": 5
        },
        "edges": {
            "arrows": "to"
        },
        "groups": {
            "useDefaultGroups": false,
            "undefined": {
                "hidden": false
            },
            "Has Member": {
                "hidden": false
            },
            "HasOther": {
                "hidden": false
            },
            "some_literal": {
                "hidden": false
            },
            "not_in_context": {
                "hidden": false
            },
            "HasBudget": {
                "hidden": true
            },
            "HasSomeItem": {
                "hidden": false
            }
        }
      } 
      const repeatInvisibilityFunc = ge.graphtool.repeatInvisibility(repeatInvisibilityInput);
      const repeatInvisibilityResult = {repeat: 'HasBudget'}

      const repeatInvisibility = {repeatInvisibilityFunc, repeatInvisibilityResult}

      // setInvisibleLegendGroupsWhite test
        const setInvisibleLegendGroupsWhiteInput = ['HasBudget']
        const setInvisibleLegendGroupsWhiteFunc = ge.graphtool.setInvisibleLegendGroupsWhite(setInvisibleLegendGroupsWhiteInput);
        const legendElement = document.getElementById('Graph0_HasBudget')
        const legendElementChild = legendElement.querySelector(':nth-child(2)')
        const childColor =legendElementChild.style.backgroundColor

        const setInvisibleLegendGroupsWhite = {childColor}

      // resetNodesAndEdgesVisibility test
      const invisibleEdge = ge.graphtool.edges.get()[0]
        invisibleEdge.hidden = true
        invisibleEdge.physics = false
        ge.graphtool.edges.update(invisibleEdge)
      const invisibleNode = ge.graphtool.nodes.get()[0]
        invisibleNode.hidden = true
        invisibleNode.physics = false
        invisibleNode.visited = true
        ge.graphtool.nodes.update(invisibleNode)

      ge.graphtool.resetNodesAndEdgesVisibility()

      const edgeResult= {}
      const visibleEdge = ge.graphtool.edges.get()[0]
        edgeResult.hidden = visibleEdge.hidden
        edgeResult.physics = visibleEdge.physics
      const nodeResult = {}
      const visibleNode = ge.graphtool.nodes.get()[0]
        nodeResult.hidden = visibleNode.hidden
        nodeResult.physics = visibleNode.physics
        nodeResult.visited = visibleNode.visited

        const resetNodesAndEdgesVisibility = {edgeResult, nodeResult}

      // createLegend test
      delete ge.graphtool.options.groups
      ge.graphtool.options.groups = {}
      ge.graphtool.createLegend()
      const legendGroups = Object.assign({}, ge.graphtool.options.groups)
      const legendGroupsExpected = {
        "undefined": {
            "hidden": false
        },
        "Has Member": {
            "hidden": false
        },
        "HasOther": {
            "hidden": false
        },
        "some_literal": {
            "hidden": false
        },
        "not_in_context": {
            "hidden": false
        },
        "HasBudget": {
            "hidden": true
        }
      }
      delete ge.graphtool.options.groups['useDefaultGroups']
      let legendContainer;
      if (document.getElementById('Graph0_legendContainer')) {
        legendContainer = true;
      }else{
        legendContainer = false;
      }

      const keysArray = [];

      for (const key in legendGroupsExpected) {
        if (key !== "undefined" && legendGroupsExpected.hasOwnProperty(key)) {
          keysArray.push(key);
        }
      }
      let legendProperties = {}
      let legendPropertiesExpected = {}
      for(let i=0; i<keysArray.length; i++){

        legendPropertiesExpected[keysArray[i]] = true;

        if(document.getElementById('Graph0_'+keysArray[i])){
          legendProperties[keysArray[i]] = true;
        }
      }

      const createLegend = {legendGroups, legendGroupsExpected, legendContainer, legendProperties, legendPropertiesExpected}

      // setNodeVisibilityByVisiblePath test

      document.getElementById('Graph0_HasBudget').children[1].click()

      const NodeVisibilityByVisiblePathOutput = ge.graphtool.visibilityByVisiblePath

      const NodeVisibilityByVisiblePathExpectedOutput = {
        "jsondata/Item:MyProject": true,
        "jsondata/Item:SomePerson": true,
        "jsondata/Item:MyProject/some_literal/0": true,
        "jsondata/Item:MyProject/some_literal/1": true,
        "jsondata/Item:MyProject/some_literal/2": true,
        "jsondata/Item:MyProject/not_in_context": true,
        "jsondata/Item:MyProject/budget/0": false,
        "jsondata/Item:MyProject/budget/1": false,
        "jsondata/Item:MyProject/budget/2": false,
        "jsondata/Item:MyProject/budget/3": false,
        "jsondata/Item:MyOtherItem": true,
        "jsondata/Item:MyNewItem": true,
        "jsondata/Item:MyOtherItem/some_literal": true,
        "jsondata/Item:MyOtherItem/not_in_context": true,
        "jsondata/Item:MyOtherItem/budget/0": false,
        "jsondata/Item:MyOtherItem/budget/1": false
      }

      const setNodeVisibilityByVisiblePath = {NodeVisibilityByVisiblePathOutput, NodeVisibilityByVisiblePathExpectedOutput}

      document.getElementById('Graph0_HasBudget').children[1].click()

      // legendFunctionality test

      ge.graphtool.expandNodes({nodes: ['jsondata/Item:MyProject/budget/0']})
      document.getElementById('Graph0_HasBudget').children[1].click()

      const optionsGroupsOutput = Object.assign({}, ge.graphtool.options.groups)
      const nodesOutput = ge.graphtool.nodes.get()
      const edgesOutput = ge.graphtool.edges.get()

      const optionsGroupsExpected = {
        "undefined": {
            "hidden": false
        },
        "Has Member": {
            "hidden": false
        },
        "HasOther": {
            "hidden": false
        },
        "some_literal": {
            "hidden": false
        },
        "not_in_context": {
            "hidden": false
        },
        "HasBudget": {
            "hidden": true
        },
        "year": {
            "hidden": false
        },
        "value": {
            "hidden": false
        }
      }
      const nodesExpected = [
        {
            "id": "jsondata/Item:MyProject",
            "label": "My Project",
            "path": [
                "jsondata",
                "Item:MyProject"
            ],
            "key": "Item:MyProject",
            "item": "Item:MyProject",
            "value": null,
            "incomingLabels": [
                null
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 0,
            "depthObject": {
                "jsondata/Item:MyProject": 0
            },
            "color": "#6dbfa9",
            "group": "root",
            "hidden": false,
            "physics": true,
            "visited": false
        },
        {
            "id": "jsondata/Item:SomePerson",
            "label": "Max Mustermann",
            "path": [
                "jsondata",
                "Item:SomePerson"
            ],
            "key": "member",
            "item": "Item:MyProject",
            "value": null,
            "incomingLabels": [
                "Has Member"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 1,
            "depthObject": {
                "jsondata/Item:MyProject": 1
            },
            "color": "hsla(193.36128336689916,70%,80%,1)",
            "group": "Has Member",
            "hidden": false,
            "physics": true,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyProject/some_literal/0",
            "label": "Some string",
            "path": [
                "jsondata",
                "Item:MyProject",
                "some_literal",
                "0"
            ],
            "key": "some_literal",
            "item": "Item:MyProject",
            "value": null,
            "incomingLabels": [
                "some_literal"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 1,
            "depthObject": {
                "jsondata/Item:MyProject": 1
            },
            "color": "hsla(55.853519316861394,70%,80%,1)",
            "group": "some_literal",
            "hidden": false,
            "physics": true,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyProject/some_literal/1",
            "label": "Some",
            "path": [
                "jsondata",
                "Item:MyProject",
                "some_literal",
                "1"
            ],
            "key": "some_literal",
            "item": "Item:MyProject",
            "value": null,
            "incomingLabels": [
                "some_literal"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 1,
            "depthObject": {
                "jsondata/Item:MyProject": 1
            },
            "color": "hsla(55.853519316861394,70%,80%,1)",
            "group": "some_literal",
            "hidden": false,
            "physics": true,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyProject/some_literal/2",
            "label": "string",
            "path": [
                "jsondata",
                "Item:MyProject",
                "some_literal",
                "2"
            ],
            "key": "some_literal",
            "item": "Item:MyProject",
            "value": null,
            "incomingLabels": [
                "some_literal"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 1,
            "depthObject": {
                "jsondata/Item:MyProject": 1
            },
            "color": "hsla(55.853519316861394,70%,80%,1)",
            "group": "some_literal",
            "hidden": false,
            "physics": true,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyProject/not_in_context",
            "label": "Not in Context",
            "path": [
                "jsondata",
                "Item:MyProject",
                "not_in_context"
            ],
            "key": "not_in_context",
            "item": "Item:MyProject",
            "value": null,
            "incomingLabels": [
                "not_in_context"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 1,
            "depthObject": {
                "jsondata/Item:MyProject": 1
            },
            "color": "hsla(278.3457552668236,70%,80%,1)",
            "group": "not_in_context",
            "hidden": false,
            "physics": true,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyProject/budget/0",
            "label": "budget",
            "path": [
                "jsondata",
                "Item:MyProject",
                "budget",
                "0"
            ],
            "key": "budget",
            "item": "Item:MyProject",
            "value": null,
            "incomingLabels": [
                "HasBudget"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 1,
            "depthObject": {
                "jsondata/Item:MyProject": 1
            },
            "color": "hsla(140.8379912167858,70%,80%,1)",
            "group": "HasBudget",
            "hidden": true,
            "physics": false,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyProject/budget/1",
            "label": "budget",
            "path": [
                "jsondata",
                "Item:MyProject",
                "budget",
                "1"
            ],
            "key": "budget",
            "item": "Item:MyProject",
            "value": null,
            "incomingLabels": [
                "HasBudget"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 1,
            "depthObject": {
                "jsondata/Item:MyProject": 1
            },
            "color": "hsla(140.8379912167858,70%,80%,1)",
            "group": "HasBudget",
            "hidden": true,
            "physics": false,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyProject/budget/2",
            "label": "budget",
            "path": [
                "jsondata",
                "Item:MyProject",
                "budget",
                "2"
            ],
            "key": "budget",
            "item": "Item:MyProject",
            "value": null,
            "incomingLabels": [
                "HasBudget"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 1,
            "depthObject": {
                "jsondata/Item:MyProject": 1
            },
            "color": "hsla(140.8379912167858,70%,80%,1)",
            "group": "HasBudget",
            "hidden": true,
            "physics": false,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyProject/budget/3",
            "label": "budget",
            "path": [
                "jsondata",
                "Item:MyProject",
                "budget",
                "3"
            ],
            "key": "budget",
            "item": "Item:MyProject",
            "value": null,
            "incomingLabels": [
                "HasBudget"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 1,
            "depthObject": {
                "jsondata/Item:MyProject": 1
            },
            "color": "hsla(140.8379912167858,70%,80%,1)",
            "group": "HasBudget",
            "hidden": true,
            "physics": false,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyOtherItem",
            "label": "My Other",
            "path": [
                "jsondata",
                "Item:MyOtherItem"
            ],
            "key": "Item:MyOtherItem",
            "item": "Item:MyOtherItem",
            "value": null,
            "incomingLabels": [
                null
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 0,
            "depthObject": {
                "jsondata/Item:MyOtherItem": 0
            },
            "color": "#6dbfa9",
            "group": "root",
            "hidden": false,
            "physics": true,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyNewItem",
            "label": "My New Other",
            "path": [
                "jsondata",
                "Item:MyNewItem"
            ],
            "key": "member",
            "item": "Item:MyOtherItem",
            "value": null,
            "incomingLabels": [
                "Has Member"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 1,
            "depthObject": {
                "jsondata/Item:MyOtherItem": 1
            },
            "color": "hsla(330.86904741693695,70%,80%,1)",
            "group": "Has Member",
            "hidden": false,
            "physics": true,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyOtherItem/some_literal",
            "label": "Some string",
            "path": [
                "jsondata",
                "Item:MyOtherItem",
                "some_literal"
            ],
            "key": "some_literal",
            "item": "Item:MyOtherItem",
            "value": null,
            "incomingLabels": [
                "some_literal"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 1,
            "depthObject": {
                "jsondata/Item:MyOtherItem": 1
            },
            "color": "hsla(55.853519316861394,70%,80%,1)",
            "group": "some_literal",
            "hidden": false,
            "physics": true,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyOtherItem/not_in_context",
            "label": "Not in Context",
            "path": [
                "jsondata",
                "Item:MyOtherItem",
                "not_in_context"
            ],
            "key": "not_in_context",
            "item": "Item:MyOtherItem",
            "value": null,
            "incomingLabels": [
                "not_in_context"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 1,
            "depthObject": {
                "jsondata/Item:MyOtherItem": 1
            },
            "color": "hsla(278.3457552668236,70%,80%,1)",
            "group": "not_in_context",
            "hidden": false,
            "physics": true,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyOtherItem/budget/0",
            "label": "budget",
            "path": [
                "jsondata",
                "Item:MyOtherItem",
                "budget",
                "0"
            ],
            "key": "budget",
            "item": "Item:MyOtherItem",
            "value": null,
            "incomingLabels": [
                "HasBudget"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 1,
            "depthObject": {
                "jsondata/Item:MyOtherItem": 1
            },
            "color": "hsla(140.8379912167858,70%,80%,1)",
            "group": "HasBudget",
            "hidden": true,
            "physics": false,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyOtherItem/budget/1",
            "label": "budget",
            "path": [
                "jsondata",
                "Item:MyOtherItem",
                "budget",
                "1"
            ],
            "key": "budget",
            "item": "Item:MyOtherItem",
            "value": null,
            "incomingLabels": [
                "HasBudget"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 1,
            "depthObject": {
                "jsondata/Item:MyOtherItem": 1
            },
            "color": "hsla(140.8379912167858,70%,80%,1)",
            "group": "HasBudget",
            "hidden": true,
            "physics": false,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyProject/budget/0/year",
            "label": "2000",
            "path": [
                "jsondata",
                "Item:MyProject",
                "budget",
                "0",
                "year"
            ],
            "key": "year",
            "item": "Item:MyProject",
            "value": 2000,
            "incomingLabels": [
                "year"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 2,
            "depthObject": {
                "jsondata/Item:MyProject/budget/0": 1
            },
            "color": "hsla(265.9889349777224,70%,80%,1)",
            "group": "year",
            "hidden": true,
            "physics": false,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyProject/budget/0/value",
            "label": "10000",
            "path": [
                "jsondata",
                "Item:MyProject",
                "budget",
                "0",
                "value"
            ],
            "key": "value",
            "item": "Item:MyProject",
            "value": 10000,
            "incomingLabels": [
                "value"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 2,
            "depthObject": {
                "jsondata/Item:MyProject/budget/0": 1
            },
            "color": "hsla(128.48117092768462,70%,80%,1)",
            "group": "value",
            "hidden": true,
            "physics": false,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyProject/budget/0/budget/0",
            "label": "budget",
            "path": [
                "jsondata",
                "Item:MyProject",
                "budget",
                "0",
                "budget",
                "0"
            ],
            "key": "budget",
            "item": "Item:MyProject",
            "value": null,
            "incomingLabels": [
                "HasBudget"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 2,
            "depthObject": {
                "jsondata/Item:MyProject/budget/0": 1
            },
            "color": "hsla(140.8379912167858,70%,80%,1)",
            "group": "HasBudget",
            "hidden": true,
            "physics": false,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyProject/budget/0/budget/1",
            "label": "budget",
            "path": [
                "jsondata",
                "Item:MyProject",
                "budget",
                "0",
                "budget",
                "1"
            ],
            "key": "budget",
            "item": "Item:MyProject",
            "value": null,
            "incomingLabels": [
                "HasBudget"
            ],
            "context": {
                "label": "Property:HasLabel",
                "member": {
                    "@id": "Property:HasMember",
                    "@type": "@id"
                },
                "other": {
                    "@id": "Property:HasOther",
                    "@type": "@id"
                },
                "budget": {
                    "@id": "Property:HasBudget",
                    "@type": "@id"
                },
                "some_property": {
                    "@id": "Property:HasSomeItem",
                    "@type": "@id"
                },
                "some_literal": "Property:HasSomeLiteral"
            },
            "depth": 2,
            "depthObject": {
                "jsondata/Item:MyProject/budget/0": 1
            },
            "color": "hsla(140.8379912167858,70%,80%,1)",
            "group": "HasBudget",
            "hidden": true,
            "physics": false,
            "visited": false
        }
      ]
      const edgesExpected = [
        {
            "id": "jsondata/Item:MyProject==Has Member=>jsondata/Item:SomePerson",
            "from": "jsondata/Item:MyProject",
            "to": "jsondata/Item:SomePerson",
            "label": "Has Member",
            "group": "Has Member",
            "objectKey": "member",
            "color": "hsla(330.86904741693695,70%,80%,1)",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyProject==HasOther=>jsondata/Item:SomePerson",
            "from": "jsondata/Item:MyProject",
            "to": "jsondata/Item:SomePerson",
            "label": "HasOther",
            "group": "HasOther",
            "objectKey": "other",
            "color": "hsla(193.36128336689916,70%,80%,1)",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyProject==some_literal=>jsondata/Item:MyProject/some_literal/0",
            "from": "jsondata/Item:MyProject",
            "to": "jsondata/Item:MyProject/some_literal/0",
            "label": "some_literal",
            "group": "some_literal",
            "objectKey": "some_literal",
            "color": "hsla(55.853519316861394,70%,80%,1)",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyProject==some_literal=>jsondata/Item:MyProject/some_literal/1",
            "from": "jsondata/Item:MyProject",
            "to": "jsondata/Item:MyProject/some_literal/1",
            "label": "some_literal",
            "group": "some_literal",
            "objectKey": "some_literal",
            "color": "hsla(55.853519316861394,70%,80%,1)",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyProject==some_literal=>jsondata/Item:MyProject/some_literal/2",
            "from": "jsondata/Item:MyProject",
            "to": "jsondata/Item:MyProject/some_literal/2",
            "label": "some_literal",
            "group": "some_literal",
            "objectKey": "some_literal",
            "color": "hsla(55.853519316861394,70%,80%,1)",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyProject==not_in_context=>jsondata/Item:MyProject/not_in_context",
            "from": "jsondata/Item:MyProject",
            "to": "jsondata/Item:MyProject/not_in_context",
            "label": "not_in_context",
            "group": "not_in_context",
            "objectKey": "not_in_context",
            "color": "hsla(278.3457552668236,70%,80%,1)",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyProject==HasBudget=>jsondata/Item:MyProject/budget/0",
            "from": "jsondata/Item:MyProject",
            "to": "jsondata/Item:MyProject/budget/0",
            "label": "HasBudget",
            "group": "HasBudget",
            "objectKey": "budget",
            "color": "hsla(140.8379912167858,70%,80%,1)",
            "hidden": true,
            "physics": false
        },
        {
            "id": "jsondata/Item:MyProject==HasBudget=>jsondata/Item:MyProject/budget/1",
            "from": "jsondata/Item:MyProject",
            "to": "jsondata/Item:MyProject/budget/1",
            "label": "HasBudget",
            "group": "HasBudget",
            "objectKey": "budget",
            "color": "hsla(140.8379912167858,70%,80%,1)",
            "hidden": true,
            "physics": false
        },
        {
            "id": "jsondata/Item:MyProject==HasBudget=>jsondata/Item:MyProject/budget/2",
            "from": "jsondata/Item:MyProject",
            "to": "jsondata/Item:MyProject/budget/2",
            "label": "HasBudget",
            "group": "HasBudget",
            "objectKey": "budget",
            "color": "hsla(140.8379912167858,70%,80%,1)",
            "hidden": true,
            "physics": false
        },
        {
            "id": "jsondata/Item:MyProject==HasBudget=>jsondata/Item:MyProject/budget/3",
            "from": "jsondata/Item:MyProject",
            "to": "jsondata/Item:MyProject/budget/3",
            "label": "HasBudget",
            "group": "HasBudget",
            "objectKey": "budget",
            "color": "hsla(140.8379912167858,70%,80%,1)",
            "hidden": true,
            "physics": false
        },
        {
            "id": "jsondata/Item:MyOtherItem==Has Member=>jsondata/Item:MyNewItem",
            "from": "jsondata/Item:MyOtherItem",
            "to": "jsondata/Item:MyNewItem",
            "label": "Has Member",
            "group": "Has Member",
            "objectKey": "member",
            "color": "hsla(330.86904741693695,70%,80%,1)",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyOtherItem==some_literal=>jsondata/Item:MyOtherItem/some_literal",
            "from": "jsondata/Item:MyOtherItem",
            "to": "jsondata/Item:MyOtherItem/some_literal",
            "label": "some_literal",
            "group": "some_literal",
            "objectKey": "some_literal",
            "color": "hsla(55.853519316861394,70%,80%,1)",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyOtherItem==not_in_context=>jsondata/Item:MyOtherItem/not_in_context",
            "from": "jsondata/Item:MyOtherItem",
            "to": "jsondata/Item:MyOtherItem/not_in_context",
            "label": "not_in_context",
            "group": "not_in_context",
            "objectKey": "not_in_context",
            "color": "hsla(278.3457552668236,70%,80%,1)",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyOtherItem==HasBudget=>jsondata/Item:MyOtherItem/budget/0",
            "from": "jsondata/Item:MyOtherItem",
            "to": "jsondata/Item:MyOtherItem/budget/0",
            "label": "HasBudget",
            "group": "HasBudget",
            "objectKey": "budget",
            "color": "hsla(140.8379912167858,70%,80%,1)",
            "hidden": true,
            "physics": false
        },
        {
            "id": "jsondata/Item:MyOtherItem==HasBudget=>jsondata/Item:MyOtherItem/budget/1",
            "from": "jsondata/Item:MyOtherItem",
            "to": "jsondata/Item:MyOtherItem/budget/1",
            "label": "HasBudget",
            "group": "HasBudget",
            "objectKey": "budget",
            "color": "hsla(140.8379912167858,70%,80%,1)",
            "hidden": true,
            "physics": false
        },
        {
            "id": "jsondata/Item:MyProject/budget/0==year=>jsondata/Item:MyProject/budget/0/year",
            "from": "jsondata/Item:MyProject/budget/0",
            "to": "jsondata/Item:MyProject/budget/0/year",
            "label": "year",
            "group": "year",
            "objectKey": "year",
            "color": "hsla(265.9889349777224,70%,80%,1)",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyProject/budget/0==value=>jsondata/Item:MyProject/budget/0/value",
            "from": "jsondata/Item:MyProject/budget/0",
            "to": "jsondata/Item:MyProject/budget/0/value",
            "label": "value",
            "group": "value",
            "objectKey": "value",
            "color": "hsla(128.48117092768462,70%,80%,1)",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyProject/budget/0==HasBudget=>jsondata/Item:MyProject/budget/0/budget/0",
            "from": "jsondata/Item:MyProject/budget/0",
            "to": "jsondata/Item:MyProject/budget/0/budget/0",
            "label": "HasBudget",
            "group": "HasBudget",
            "objectKey": "budget",
            "color": "hsla(140.8379912167858,70%,80%,1)",
            "hidden": true,
            "physics": false
        },
        {
            "id": "jsondata/Item:MyProject/budget/0==HasBudget=>jsondata/Item:MyProject/budget/0/budget/1",
            "from": "jsondata/Item:MyProject/budget/0",
            "to": "jsondata/Item:MyProject/budget/0/budget/1",
            "label": "HasBudget",
            "group": "HasBudget",
            "objectKey": "budget",
            "color": "hsla(140.8379912167858,70%,80%,1)",
            "hidden": true,
            "physics": false
        }
      ]

      let nodesExpectedArray = []
      let nodesOutputArray = []
      let edgesExpectedArray = []
      let edgesOutputArray = []

      for(let i = 0; i < nodesExpected.length; i++) {
        if(nodesExpected[i].hidden === true) {
          nodesExpectedArray.push(nodesExpected[i].id)
          nodesOutputArray.push(nodesOutput[i].id)
        }
      }

      for(let i = 0; i < edgesExpected.length; i++) {
        if(edgesExpected[i].hidden === true) {
          edgesExpectedArray.push(edgesExpected[i].id)
          edgesOutputArray.push(edgesOutput[i].id)
        }
      }

      const legendFunctionality = { optionsGroupsOutput, optionsGroupsExpected, nodesOutputArray, edgesOutputArray, nodesExpectedArray, edgesExpectedArray };


      // document.getElementById('Graph0_HasBudget').children[1].click()
      // delete ge.graphtool.options.groups['useDefaultGroups']
      // delete ge.graphtool.options.groups['year']
      // delete ge.graphtool.options.groups['value']

      return { repeatInvisibility, setInvisibleLegendGroupsWhite, resetNodesAndEdgesVisibility, createLegend, setNodeVisibilityByVisiblePath, legendFunctionality };
  }, { newJson, configFile })
  .catch(error => {
      console.error('Error during evaluation:', error);
      return null; // Handle the error as needed
  });

  if (evaluationResult !== null) {
      test('Does it output the right property to be repeated', async assert => {
          assert.plan(1);

          assert.strictSame(evaluationResult.repeatInvisibility.repeatInvisibilityResult, evaluationResult.repeatInvisibility.repeatInvisibilityFunc);
      });

        test('Does it set the right color to the legend element', async assert => {
            assert.plan(1);
    
            assert.strictSame(evaluationResult.setInvisibleLegendGroupsWhite.childColor, 'rgb(255, 255, 255)');
        })

        test('Does it reset the visibility of nodes and edges', async assert => {
            assert.plan(2);
    
            assert.strictSame(evaluationResult.resetNodesAndEdgesVisibility.edgeResult, {hidden: false, physics: true});
            assert.strictSame(evaluationResult.resetNodesAndEdgesVisibility.nodeResult, {hidden: false, physics: true, visited: false});
        })

        test('Does it create the legend', async assert => {
            assert.plan(3);
    
            assert.strictSame(evaluationResult.createLegend.legendGroups, evaluationResult.createLegend.legendGroupsExpected);
            assert.ok(evaluationResult.createLegend.legendContainer);
            assert.strictSame(evaluationResult.createLegend.legendProperties, evaluationResult.createLegend.legendPropertiesExpected);

        })

        test('Does it set the right visibility to the nodes', async assert => {
            assert.plan(1);
    
            assert.strictSame(evaluationResult.setNodeVisibilityByVisiblePath.NodeVisibilityByVisiblePathOutput, evaluationResult.setNodeVisibilityByVisiblePath.NodeVisibilityByVisiblePathExpectedOutput);
        })

        test('Does it set the right visibility to the nodes and edges (legendFunctionality)', async assert => {
            assert.plan(3);

            assert.strictSame(evaluationResult.legendFunctionality.optionsGroupsOutput, evaluationResult.legendFunctionality.optionsGroupsExpected);
            assert.strictSame(evaluationResult.legendFunctionality.nodesOutputArray, evaluationResult.legendFunctionality.nodesExpectedArray);
            assert.strictSame(evaluationResult.legendFunctionality.edgesOutputArray, evaluationResult.legendFunctionality.edgesExpectedArray);
        })
  }

  await browser.close();
})()





