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

    let newJson = {"jsonschema": {
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
      
      let configFile = 
      {
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

      // colorByValue test

      ge.graphtool.deepSearch("10")

      ge.graphtool.colorByValue(['value'], ge.graphtool.nodes.get(), ge.graphtool.edges.get(), "orangered", "limegreen")
      
      let coloredByValueNodesExpected = [
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
            "color": "#ffffff",
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
            "color": "#ffffff",
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
            "color": "#ffffff",
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
            "color": "#ffffff",
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
            "color": "#ffffff",
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
            "color": "#ffffff",
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
            "color": "#32cd32",
            "group": "HasBudget",
            "hidden": false,
            "physics": true,
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
            "color": "#ffffff",
            "group": "HasBudget",
            "hidden": false,
            "physics": true,
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
            "color": "#ffffff",
            "group": "HasBudget",
            "hidden": false,
            "physics": true,
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
            "color": "#ffffff",
            "group": "HasBudget",
            "hidden": false,
            "physics": true,
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
            "color": "#ffffff",
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
            "color": "#ffffff",
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
            "color": "#ffffff",
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
            "color": "#ffffff",
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
            "color": "#ff4500",
            "group": "HasBudget",
            "hidden": false,
            "physics": true,
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
            "color": "#ffffff",
            "group": "HasBudget",
            "hidden": false,
            "physics": true,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyOtherItem/budget/0/year",
            "label": "2022",
            "path": [
                "jsondata",
                "Item:MyOtherItem",
                "budget",
                "0",
                "year"
            ],
            "key": "year",
            "item": "Item:MyOtherItem",
            "value": 2022,
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
                "jsondata/Item:MyOtherItem/budget/0": 1
            },
            "color": "#ffffff",
            "group": "year",
            "hidden": false,
            "physics": true,
            "visited": false
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
            "color": "#ffffff",
            "group": "year",
            "hidden": false,
            "physics": true,
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
            "color": "#32cd32",
            "group": "value",
            "hidden": false,
            "physics": true,
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
            "color": "#ff4500",
            "group": "HasBudget",
            "hidden": false,
            "physics": true,
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
            "color": "#ffffff",
            "group": "HasBudget",
            "hidden": false,
            "physics": true,
            "visited": false
        },
        {
            "id": "jsondata/Item:MyProject/budget/0/budget/0/year",
            "label": "2023",
            "path": [
                "jsondata",
                "Item:MyProject",
                "budget",
                "0",
                "budget",
                "0",
                "year"
            ],
            "key": "year",
            "item": "Item:MyProject",
            "value": 2023,
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
            "depth": 3,
            "depthObject": {
                "jsondata/Item:MyProject/budget/0/budget/0": 1
            },
            "color": "#ffffff",
            "group": "year",
            "hidden": false,
            "physics": true,
            "visited": false
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
      let coloredByValueEdgesExpected = [
        {
            "id": "jsondata/Item:MyProject==Has Member=>jsondata/Item:SomePerson",
            "from": "jsondata/Item:MyProject",
            "to": "jsondata/Item:SomePerson",
            "label": "Has Member",
            "group": "Has Member",
            "objectKey": "member",
            "color": "#000000",
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
            "color": "#000000",
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
            "color": "#000000",
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
            "color": "#000000",
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
            "color": "#000000",
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
            "color": "#000000",
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
            "color": "#000000",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyProject==HasBudget=>jsondata/Item:MyProject/budget/1",
            "from": "jsondata/Item:MyProject",
            "to": "jsondata/Item:MyProject/budget/1",
            "label": "HasBudget",
            "group": "HasBudget",
            "objectKey": "budget",
            "color": "#000000",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyProject==HasBudget=>jsondata/Item:MyProject/budget/2",
            "from": "jsondata/Item:MyProject",
            "to": "jsondata/Item:MyProject/budget/2",
            "label": "HasBudget",
            "group": "HasBudget",
            "objectKey": "budget",
            "color": "#000000",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyProject==HasBudget=>jsondata/Item:MyProject/budget/3",
            "from": "jsondata/Item:MyProject",
            "to": "jsondata/Item:MyProject/budget/3",
            "label": "HasBudget",
            "group": "HasBudget",
            "objectKey": "budget",
            "color": "#000000",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyOtherItem==Has Member=>jsondata/Item:MyNewItem",
            "from": "jsondata/Item:MyOtherItem",
            "to": "jsondata/Item:MyNewItem",
            "label": "Has Member",
            "group": "Has Member",
            "objectKey": "member",
            "color": "#000000",
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
            "color": "#000000",
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
            "color": "#000000",
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
            "color": "#000000",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyOtherItem==HasBudget=>jsondata/Item:MyOtherItem/budget/1",
            "from": "jsondata/Item:MyOtherItem",
            "to": "jsondata/Item:MyOtherItem/budget/1",
            "label": "HasBudget",
            "group": "HasBudget",
            "objectKey": "budget",
            "color": "#000000",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyOtherItem/budget/0==year=>jsondata/Item:MyOtherItem/budget/0/year",
            "from": "jsondata/Item:MyOtherItem/budget/0",
            "to": "jsondata/Item:MyOtherItem/budget/0/year",
            "label": "year",
            "group": "year",
            "objectKey": "year",
            "color": "#000000",
            "hidden": false,
            "physics": true
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
            "id": "jsondata/Item:MyProject/budget/0==year=>jsondata/Item:MyProject/budget/0/year",
            "from": "jsondata/Item:MyProject/budget/0",
            "to": "jsondata/Item:MyProject/budget/0/year",
            "label": "year",
            "group": "year",
            "objectKey": "year",
            "color": "#000000",
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
            "color": "#32cd32",
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
            "color": "#000000",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyProject/budget/0==HasBudget=>jsondata/Item:MyProject/budget/0/budget/1",
            "from": "jsondata/Item:MyProject/budget/0",
            "to": "jsondata/Item:MyProject/budget/0/budget/1",
            "label": "HasBudget",
            "group": "HasBudget",
            "objectKey": "budget",
            "color": "#000000",
            "hidden": false,
            "physics": true
        },
        {
            "id": "jsondata/Item:MyProject/budget/0/budget/0==year=>jsondata/Item:MyProject/budget/0/budget/0/year",
            "from": "jsondata/Item:MyProject/budget/0/budget/0",
            "to": "jsondata/Item:MyProject/budget/0/budget/0/year",
            "label": "year",
            "group": "year",
            "objectKey": "year",
            "color": "#000000",
            "hidden": false,
            "physics": true
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
        }
      ]

      let coloredByValueNodes = [...ge.graphtool.nodes.get()]
      let coloredByValueEdges = [...ge.graphtool.edges.get()]

      let tempArray = []
      let tempArray2 = []

      let nodeColorsAfterFunc = []
      let nodeColorsExpected = []

      for(let i = 0; i < coloredByValueNodes.length; i++){
        if(coloredByValueNodes[i].color !== "#ffffff"){
          tempArray.push(coloredByValueNodes[i].id)
          tempArray2.push(coloredByValueNodesExpected[i].id)
          nodeColorsAfterFunc.push(coloredByValueNodes[i].color)
          nodeColorsExpected.push(coloredByValueNodesExpected[i].color)
        }
      }

      coloredByValueNodes = tempArray
      coloredByValueNodesExpected = tempArray2

        tempArray = []
        tempArray2 = []

        let edgeColorsAfterFunc = []
        let edgeColorsExpected = []

        for(let i = 0; i < coloredByValueEdges.length; i++){
            if(coloredByValueEdges[i].color !== "#000000"){
                tempArray.push(coloredByValueEdges[i].id)
                tempArray2.push(coloredByValueEdgesExpected[i].id)

                edgeColorsAfterFunc.push(coloredByValueEdges[i].color)
                edgeColorsExpected.push(coloredByValueEdgesExpected[i].color)

            }
        }

        coloredByValueEdges = tempArray
        coloredByValueEdgesExpected = tempArray2

        const colorByValue = {coloredByValueNodes, coloredByValueNodesExpected, coloredByValueEdges, coloredByValueEdgesExpected, nodeColorsAfterFunc, nodeColorsExpected, edgeColorsAfterFunc, edgeColorsExpected}

        // recolorByProperty
        document.getElementById('Graph0_myCheckbox').checked = true;
        ge.graphtool.deepSearch("")

        let recolorByPropertyNodes = [...ge.graphtool.nodes.get()]
        let recolorByPropertyEdges = [...ge.graphtool.edges.get()]

        let allNodesColored = false
        let allEdgesColored = false

        for(let i = 0; i < recolorByPropertyNodes.length; i++){
            if(recolorByPropertyNodes[i].color !== "#ffffff"){
                allNodesColored = true
            }else{
                allNodesColored = false
                break
            }
        }

        for(let i = 0; i < recolorByPropertyEdges.length; i++){
            if(recolorByPropertyEdges[i].color !== "#000000"){
                allEdgesColored = true
            }else{
                allEdgesColored = false
                break
            }
        }

        const recolorByProperty = {allNodesColored, allEdgesColored}

      return { colorByValue, recolorByProperty };
  }, { newJson, configFile })
  .catch(error => {
      console.error('Error during evaluation:', error);
      return null; // Handle the error as needed
  });

  if (evaluationResult !== null) {
      test('Are the right nodes and edges colored by the right color', async assert => {
            assert.plan(4)
            assert.strictSame(evaluationResult.colorByValue.coloredByValueNodes, evaluationResult.colorByValue.coloredByValueNodesExpected)
            assert.strictSame(evaluationResult.colorByValue.coloredByValueEdges, evaluationResult.colorByValue.coloredByValueEdgesExpected)

            assert.strictSame(evaluationResult.colorByValue.nodeColorsAfterFunc, evaluationResult.colorByValue.nodeColorsExpected)
            assert.strictSame(evaluationResult.colorByValue.edgeColorsAfterFunc, evaluationResult.colorByValue.edgeColorsExpected)
      });

        test('Are all nodes and edges recolored', async assert => {
            assert.plan(2)
            assert.ok(evaluationResult.recolorByProperty.allNodesColored)
            assert.ok(evaluationResult.recolorByProperty.allEdgesColored)
        });
  }

  await browser.close();

})()





