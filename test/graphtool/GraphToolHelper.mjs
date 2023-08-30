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
                }, {
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
      
      //searchJSON test
      const searchJSONfunc = ge.graphtool.searchJSON(newJson, 'Item:MySecondItem');
      const searchJSONfuncOutput = [
        "$.jsondata.Item:MyNewItem.other",
        "$.jsondata.Item:MyNewItem.other.0"
      ]
      const searchJSON = { searchJSONfunc, searchJSONfuncOutput }

      // getAllEdgesWithLabel test
      // not used at the moment

      // removeObjectWithId test
      // not used at the moment

      // legendInvisibleGroups test
      const legendOptionsInput = {
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
            }
        }
      }
      const legendInvisibleGroupsOptionsInput = ge.graphtool.legendInvisibleGroups(legendOptionsInput);
      const legendInvisibleGroupsOutput = ["HasBudget"]

      const legendInvisibleGroups = { legendInvisibleGroupsOptionsInput, legendInvisibleGroupsOutput }

      // changeColorDropdown test
      // not used at the moment

      // changeStartEndColorDropdown test
      // not used at the moment

      // createValuesArray test
      const createValuesArrayInput = [
        [
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
                "color": "#ff4500",
                "group": "HasBudget",
                "hidden": false,
                "physics": true,
                "visited": false
            },
            {
                "id": "jsondata/Item:MyOtherItem/budget/0==value=>jsondata/Item:MyOtherItem/budget/0/value",
                "from": "jsondata/Item:MyOtherItem/budget/0",
                "to": "jsondata/Item:MyOtherItem/budget/0/value",
                "label": "value",
                "group": "value",
                "objectKey": "value",
                "color": "#ff4500",
                "hidden": false,
                "physics": true
            },
            {
                "id": "jsondata/Item:MyOtherItem/budget/0/value",
                "label": "10",
                "path": [
                    "jsondata",
                    "Item:MyOtherItem",
                    "budget",
                    "0",
                    "value"
                ],
                "key": "value",
                "item": "Item:MyOtherItem",
                "value": 10,
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
                    "jsondata/Item:MyOtherItem/budget/0": 1
                },
                "color": "#ff4500",
                "group": "value",
                "hidden": false,
                "physics": true,
                "visited": false
            }
        ],
        [
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
                "color": "#32cd32",
                "group": "HasBudget",
                "hidden": false,
                "physics": true,
                "visited": false
            },
            {
                "id": "jsondata/Item:MyProject/budget/0==value=>jsondata/Item:MyProject/budget/0/value",
                "from": "jsondata/Item:MyProject/budget/0",
                "to": "jsondata/Item:MyProject/budget/0/value",
                "label": "value",
                "group": "value",
                "objectKey": "value",
                "color": "#32cd32",
                "hidden": false,
                "physics": true
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
                "color": "#32cd32",
                "group": "value",
                "hidden": false,
                "physics": true,
                "visited": false
            }
        ],
        [
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
                "color": "#ff4500",
                "group": "HasBudget",
                "hidden": false,
                "physics": true,
                "visited": false
            },
            {
                "id": "jsondata/Item:MyProject/budget/0/budget/0==value=>jsondata/Item:MyProject/budget/0/budget/0/value",
                "from": "jsondata/Item:MyProject/budget/0/budget/0",
                "to": "jsondata/Item:MyProject/budget/0/budget/0/value",
                "label": "value",
                "group": "value",
                "objectKey": "value",
                "color": "#ff4500",
                "hidden": false,
                "physics": true
            },
            {
                "id": "jsondata/Item:MyProject/budget/0/budget/0/value",
                "label": "10",
                "path": [
                    "jsondata",
                    "Item:MyProject",
                    "budget",
                    "0",
                    "budget",
                    "0",
                    "value"
                ],
                "key": "value",
                "item": "Item:MyProject",
                "value": 10,
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
                "depth": 3,
                "depthObject": {
                    "jsondata/Item:MyProject/budget/0/budget/0": 1
                },
                "color": "#ff4500",
                "group": "value",
                "hidden": false,
                "physics": true,
                "visited": false
            }
        ]
      ]
      const createValuesArrayFunc = ge.graphtool.createValuesArray(createValuesArrayInput);
      const createValuesArrayOutput = ["10", "10000", "10"]

      const createValuesArray = { createValuesArrayFunc, createValuesArrayOutput }

      // createOverlapArray test
      const createOverlapArrayInput = [
        [
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
                "color": "#ff4500",
                "group": "HasBudget",
                "hidden": false,
                "physics": true,
                "visited": false
            },
            {
                "id": "jsondata/Item:MyOtherItem/budget/0==value=>jsondata/Item:MyOtherItem/budget/0/value",
                "from": "jsondata/Item:MyOtherItem/budget/0",
                "to": "jsondata/Item:MyOtherItem/budget/0/value",
                "label": "value",
                "group": "value",
                "objectKey": "value",
                "color": "#ff4500",
                "hidden": false,
                "physics": true
            },
            {
                "id": "jsondata/Item:MyOtherItem/budget/0/value",
                "label": "10",
                "path": [
                    "jsondata",
                    "Item:MyOtherItem",
                    "budget",
                    "0",
                    "value"
                ],
                "key": "value",
                "item": "Item:MyOtherItem",
                "value": 10,
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
                    "jsondata/Item:MyOtherItem/budget/0": 1
                },
                "color": "#ff4500",
                "group": "value",
                "hidden": false,
                "physics": true,
                "visited": false
            }
        ],
        [
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
                "color": "#f78e08",
                "group": "HasBudget",
                "hidden": false,
                "physics": true,
                "visited": false
            },
            {
                "id": "jsondata/Item:MyOtherItem/budget/1==value=>jsondata/Item:MyOtherItem/budget/1/value",
                "from": "jsondata/Item:MyOtherItem/budget/1",
                "to": "jsondata/Item:MyOtherItem/budget/1/value",
                "label": "value",
                "group": "value",
                "objectKey": "value",
                "color": "#f78e08",
                "hidden": false,
                "physics": true
            },
            {
                "id": "jsondata/Item:MyOtherItem/budget/1/value",
                "label": "20",
                "path": [
                    "jsondata",
                    "Item:MyOtherItem",
                    "budget",
                    "1",
                    "value"
                ],
                "key": "value",
                "item": "Item:MyOtherItem",
                "value": 20,
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
                    "jsondata/Item:MyOtherItem/budget/1": 1
                },
                "color": "#f78e08",
                "group": "value",
                "hidden": false,
                "physics": true,
                "visited": false
            }
        ],
        [
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
                "color": "#eecc11",
                "group": "HasBudget",
                "hidden": false,
                "physics": true,
                "visited": false
            },
            {
                "id": "jsondata/Item:MyProject/budget/0==value=>jsondata/Item:MyProject/budget/0/value",
                "from": "jsondata/Item:MyProject/budget/0",
                "to": "jsondata/Item:MyProject/budget/0/value",
                "label": "value",
                "group": "value",
                "objectKey": "value",
                "color": "#eecc11",
                "hidden": false,
                "physics": true
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
                "color": "#eecc11",
                "group": "value",
                "hidden": false,
                "physics": true,
                "visited": false
            }
        ],
        [
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
                "color": "#ff4500",
                "group": "HasBudget",
                "hidden": false,
                "physics": true,
                "visited": false
            },
            {
                "id": "jsondata/Item:MyProject/budget/0/budget/0==value=>jsondata/Item:MyProject/budget/0/budget/0/value",
                "from": "jsondata/Item:MyProject/budget/0/budget/0",
                "to": "jsondata/Item:MyProject/budget/0/budget/0/value",
                "label": "value",
                "group": "value",
                "objectKey": "value",
                "color": "#ff4500",
                "hidden": false,
                "physics": true
            },
            {
                "id": "jsondata/Item:MyProject/budget/0/budget/0/value",
                "label": "10",
                "path": [
                    "jsondata",
                    "Item:MyProject",
                    "budget",
                    "0",
                    "budget",
                    "0",
                    "value"
                ],
                "key": "value",
                "item": "Item:MyProject",
                "value": 10,
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
                "depth": 3,
                "depthObject": {
                    "jsondata/Item:MyProject/budget/0/budget/0": 1
                },
                "color": "#ff4500",
                "group": "value",
                "hidden": false,
                "physics": true,
                "visited": false
            }
        ],
        [
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
                "color": "#f78e08",
                "group": "HasBudget",
                "hidden": false,
                "physics": true,
                "visited": false
            },
            {
                "id": "jsondata/Item:MyProject/budget/0/budget/1==value=>jsondata/Item:MyProject/budget/0/budget/1/value",
                "from": "jsondata/Item:MyProject/budget/0/budget/1",
                "to": "jsondata/Item:MyProject/budget/0/budget/1/value",
                "label": "value",
                "group": "value",
                "objectKey": "value",
                "color": "#f78e08",
                "hidden": false,
                "physics": true
            },
            {
                "id": "jsondata/Item:MyProject/budget/0/budget/1/value",
                "label": "20",
                "path": [
                    "jsondata",
                    "Item:MyProject",
                    "budget",
                    "0",
                    "budget",
                    "1",
                    "value"
                ],
                "key": "value",
                "item": "Item:MyProject",
                "value": 20,
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
                "depth": 3,
                "depthObject": {
                    "jsondata/Item:MyProject/budget/0/budget/1": 1
                },
                "color": "#f78e08",
                "group": "value",
                "hidden": false,
                "physics": true,
                "visited": false
            }
        ],
        [
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
                "color": "#cae619",
                "group": "HasBudget",
                "hidden": false,
                "physics": true,
                "visited": false
            },
            {
                "id": "jsondata/Item:MyProject/budget/1==value=>jsondata/Item:MyProject/budget/1/value",
                "from": "jsondata/Item:MyProject/budget/1",
                "to": "jsondata/Item:MyProject/budget/1/value",
                "label": "value",
                "group": "value",
                "objectKey": "value",
                "color": "#cae619",
                "hidden": false,
                "physics": true
            },
            {
                "id": "jsondata/Item:MyProject/budget/1/value",
                "label": "20000",
                "path": [
                    "jsondata",
                    "Item:MyProject",
                    "budget",
                    "1",
                    "value"
                ],
                "key": "value",
                "item": "Item:MyProject",
                "value": 20000,
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
                    "jsondata/Item:MyProject/budget/1": 1
                },
                "color": "#cae619",
                "group": "value",
                "hidden": false,
                "physics": true,
                "visited": false
            }
        ],
        [
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
                "color": "#8ede21",
                "group": "HasBudget",
                "hidden": false,
                "physics": true,
                "visited": false
            },
            {
                "id": "jsondata/Item:MyProject/budget/2==value=>jsondata/Item:MyProject/budget/2/value",
                "from": "jsondata/Item:MyProject/budget/2",
                "to": "jsondata/Item:MyProject/budget/2/value",
                "label": "value",
                "group": "value",
                "objectKey": "value",
                "color": "#8ede21",
                "hidden": false,
                "physics": true
            },
            {
                "id": "jsondata/Item:MyProject/budget/2/value",
                "label": "30000",
                "path": [
                    "jsondata",
                    "Item:MyProject",
                    "budget",
                    "2",
                    "value"
                ],
                "key": "value",
                "item": "Item:MyProject",
                "value": 30000,
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
                    "jsondata/Item:MyProject/budget/2": 1
                },
                "color": "#8ede21",
                "group": "value",
                "hidden": false,
                "physics": true,
                "visited": false
            }
        ],
        [
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
                "color": "#D3D3D3",
                "group": "HasBudget",
                "hidden": false,
                "physics": true,
                "visited": false
            },
            {
                "id": "jsondata/Item:MyProject/budget/3==value=>jsondata/Item:MyProject/budget/3/value/0",
                "from": "jsondata/Item:MyProject/budget/3",
                "to": "jsondata/Item:MyProject/budget/3/value/0",
                "label": "value",
                "group": "value",
                "objectKey": "value",
                "color": "#5bd52a",
                "hidden": false,
                "physics": true
            },
            {
                "id": "jsondata/Item:MyProject/budget/3/value/0",
                "label": "40000",
                "path": [
                    "jsondata",
                    "Item:MyProject",
                    "budget",
                    "3",
                    "value",
                    "0"
                ],
                "key": "value",
                "item": "Item:MyProject",
                "value": 40000,
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
                    "jsondata/Item:MyProject/budget/3": 1
                },
                "color": "#5bd52a",
                "group": "value",
                "hidden": false,
                "physics": true,
                "visited": false
            }
        ],
        [
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
                "color": "#D3D3D3",
                "group": "HasBudget",
                "hidden": false,
                "physics": true,
                "visited": false
            },
            {
                "id": "jsondata/Item:MyProject/budget/3==value=>jsondata/Item:MyProject/budget/3/value/1",
                "from": "jsondata/Item:MyProject/budget/3",
                "to": "jsondata/Item:MyProject/budget/3/value/1",
                "label": "value",
                "group": "value",
                "objectKey": "value",
                "color": "#32cd32",
                "hidden": false,
                "physics": true
            },
            {
                "id": "jsondata/Item:MyProject/budget/3/value/1",
                "label": "50000",
                "path": [
                    "jsondata",
                    "Item:MyProject",
                    "budget",
                    "3",
                    "value",
                    "1"
                ],
                "key": "value",
                "item": "Item:MyProject",
                "value": 50000,
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
                    "jsondata/Item:MyProject/budget/3": 1
                },
                "color": "#32cd32",
                "group": "value",
                "hidden": false,
                "physics": true,
                "visited": false
            }
        ]
      ]
      const createOverlapArrayFunc = ge.graphtool.createOverlapArray(createOverlapArrayInput)
      const createOverlapArrayOutput = ["jsondata/Item:MyProject/budget/3", "jsondata/Item:MyProject/budget/3"]

      const createOverlapArray = { createOverlapArrayFunc, createOverlapArrayOutput }

      // containsOnlyNumbers test
      const containsOnlyNumbersInputNumbers = [1, 2, 3, 4, 5]
      const containsOnlyNumbersInputMixed = [1, 2, 3, 4, 'string']

      const containsOnlyNumbersFuncNumbers = ge.graphtool.containsOnlyNumbers(containsOnlyNumbersInputNumbers)
      const containsOnlyNumbersOutputNumbers = true

      const containsOnlyNumbersFuncMixed = ge.graphtool.containsOnlyNumbers(containsOnlyNumbersInputMixed)
      const containsOnlyNumbersOutputMixed = false

      const containsOnlyNumbers = { containsOnlyNumbersFuncNumbers, containsOnlyNumbersOutputNumbers, containsOnlyNumbersFuncMixed, containsOnlyNumbersOutputMixed }

      // updatePositions test
      // not used at the moment

      // isNodeLastInPath test
      const isNodeLastInPathInputTrue = 'jsondata/Item:MyProject/budget/0/value'
      const isNodeLastInPathInputFalse = 'jsondata/Item:MyProject'
      const isNodeLastInPathFuncTrue = ge.graphtool.isNodeLastInPath(isNodeLastInPathInputTrue)
      const isNodeLastInPathFuncFalse = ge.graphtool.isNodeLastInPath(isNodeLastInPathInputFalse)
      const isNodeLastInPathOutputTrue = true
      const isNodeLastInPathOutputFalse = false

      const isNodeLastInPath = { isNodeLastInPathFuncTrue, isNodeLastInPathOutputTrue, isNodeLastInPathFuncFalse, isNodeLastInPathOutputFalse }
    
      // itemExists test
        const itemExistsInputTrue = 'jsondata/Item:MyProject'
        const itemExistsInputFalse = 'jsondata/Item:MyProject1'
        const itemExistsFuncTrue = ge.graphtool.itemExists(itemExistsInputTrue)
        const itemExistsFuncFalse = ge.graphtool.itemExists(itemExistsInputFalse)
        const itemExistsOutputTrue = true
        const itemExistsOutputFalse = false

        const itemExists = { itemExistsFuncTrue, itemExistsOutputTrue, itemExistsFuncFalse, itemExistsOutputFalse }

        // isNodeOpen test
        const isNodeOpenInputTrue = 'jsondata/Item:MyProject'
        const isNodeOpenInputFalse = 'jsondata/Item:MyProject/budget/0/value'
        const isNodeOpenFuncTrue = ge.graphtool.isNodeOpen(isNodeOpenInputTrue)
        const isNodeOpenFuncFalse = ge.graphtool.isNodeOpen(isNodeOpenInputFalse)
        const isNodeOpenOutputTrue = true
        const isNodeOpenOutputFalse = false

        const isNodeOpen = { isNodeOpenFuncTrue, isNodeOpenFuncFalse, isNodeOpenOutputTrue, isNodeOpenOutputFalse }

        // removeItem test
        const removeItemInput = [1, 2, 3, 4, 5]
        const removeItemFunc = ge.graphtool.removeItem(removeItemInput, 3)
        const removeItemOutput = [1, 2, 4, 5]

        const removeItem = { removeItemFunc, removeItemOutput }
        

      return { searchJSON, legendInvisibleGroups, createValuesArray, createOverlapArray, containsOnlyNumbers, isNodeLastInPath, itemExists, isNodeOpen, removeItem } 
  }, { newJson, configFile })
  .catch(error => {
      console.error('Error during evaluation:', error)
      return null; // Handle the error as needed
  });

  if (evaluationResult !== null) {
      test('Does searchJSON find right paths', async assert => {
          assert.plan(1)
          assert.strictSame(evaluationResult.searchJSON.searchJSONfuncOutput, evaluationResult.searchJSON.searchJSONfunc)
      });

      test('Does legendInvisibleGroups find right groups', async assert => {
        assert.plan(1)
        assert.strictSame(evaluationResult.legendInvisibleGroups.legendInvisibleGroupsOutput, evaluationResult.legendInvisibleGroups.legendInvisibleGroupsOptionsInput)
      })

      test('Does createValuesArray create right array', async assert => {
        assert.plan(1)
        assert.strictSame(evaluationResult.createValuesArray.createValuesArrayOutput, evaluationResult.createValuesArray.createValuesArrayFunc)
      })

      test('Does createOverlapArray create right array', async assert => {
        assert.plan(1)
        assert.strictSame(evaluationResult.createOverlapArray.createOverlapArrayOutput, evaluationResult.createOverlapArray.createOverlapArrayFunc)
      })

        test('Does containsOnlyNumbers return right boolean', async assert => {
            assert.plan(2)
            assert.strictSame(evaluationResult.containsOnlyNumbers.containsOnlyNumbersFuncNumbers, evaluationResult.containsOnlyNumbers.containsOnlyNumbersOutputNumbers)
            assert.strictSame(evaluationResult.containsOnlyNumbers.containsOnlyNumbersFuncMixed, evaluationResult.containsOnlyNumbers.containsOnlyNumbersOutputMixed)
        })

        test('Does isNodeLastInPath return right boolean', async assert => {

            assert.plan(2)
            assert.strictSame(evaluationResult.isNodeLastInPath.isNodeLastInPathFuncTrue, evaluationResult.isNodeLastInPath.isNodeLastInPathOutputTrue)
            assert.strictSame(evaluationResult.isNodeLastInPath.isNodeLastInPathFuncFalse, evaluationResult.isNodeLastInPath.isNodeLastInPathOutputFalse)
        })

        test('Does itemExists return right boolean', async assert => {
                
                assert.plan(2)
                assert.strictSame(evaluationResult.itemExists.itemExistsFuncTrue, evaluationResult.itemExists.itemExistsOutputTrue)
                assert.strictSame(evaluationResult.itemExists.itemExistsFuncFalse, evaluationResult.itemExists.itemExistsOutputFalse)
        })

        test('Does isNodeOpen return right boolean', async assert => {
                    
                    assert.plan(2)
                    assert.strictSame(evaluationResult.isNodeOpen.isNodeOpenFuncTrue, evaluationResult.isNodeOpen.isNodeOpenOutputTrue)
                    assert.strictSame(evaluationResult.isNodeOpen.isNodeOpenFuncFalse, evaluationResult.isNodeOpen.isNodeOpenOutputFalse)
        })

        test('Does removeItem return right array', async assert => {
                            
                            assert.plan(1)
                            assert.strictSame(evaluationResult.removeItem.removeItemFunc, evaluationResult.removeItem.removeItemOutput)
        })

  }

  await browser.close();


//   page.evaluate(async ({ newJson, configFile }) => {
//     const ge = new isg.Graph.Graph(newJson, configFile);
    
//     const result = ge.isNodeLastInPath('test');
//     const result2 = ge.isNodeLastInPath('jsondata/Item:MyProject1');

//     return { result, result2 };
// }, { newJson, configFile })
// .then(({ result, result2 }) => {
//     test('new test', async assert => {
//         assert.plan(2);
//         assert.equal(result, true);
//         assert.equal(result2, false);
//     });
// })
// .catch(error => {
//     console.error('Error during evaluation:', error);
// })
// .finally(async () => {
//     await browser.close();
// });

})()





