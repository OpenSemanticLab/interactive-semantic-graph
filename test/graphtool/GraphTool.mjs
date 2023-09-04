// // import { test } from 'tap'
// // import { fileURLToPath } from 'node:url'
// // import { join, dirname } from 'node:path'
// // import * as browsers from 'playwright'

// // // esm workarounds
// // const __filename = fileURLToPath(import.meta.url)
// // const __dirname = dirname(__filename)

// // let browser, page

// // // const engines = [
// // //   'chromium',
// // //   'firefox',
// // //   'webkit'
// // // ]

// // (async () => {

// //     browser = await browsers['firefox'].launch()
// //     page = await browser.newPage()

// //     await page.goto(`file://${join(__dirname, '../fixtures/index.html')}`)
// //     await page.addScriptTag({
// //         path: join(__dirname, '../../dist/isg.umd.js')
// //     })

// //     await test(`new test`, /*{ skip: process.env.WITH_BROWSERS != 'true' },*/ async assert => {

// //         assert.plan(1)

// //         // run in the browser
// //         const result = await page.evaluate(() => {
// //             const ge = new isg.GT.GraphTool()// new isg.GraphEditor()
// //             return ge.unit()// ge.test()
// //         })

// //         assert.equal(result, 'GraphTool')//'test')

// //     })

// //     await browser.close()

// // })()

// import { test } from 'tap'
// import { fileURLToPath } from 'node:url'
// import { join, dirname } from 'node:path'
// import * as browsers from 'playwright'

// // esm workarounds
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)

// let browser, page

// // const engines = [
// //   'chromium',
// //   'firefox',
// //   'webkit'
// // ]

// (async () => {

//     browser = await browsers['firefox'].launch()
//     page = await browser.newPage()

//     await page.goto(`file://${join(__dirname, '../fixtures/index.html')}`)
//     await page.addScriptTag({
//         path: join(__dirname, '../../dist/isg.umd.js')
//     })

//     let newJson = {"jsonschema": {
//         "Category:Entity": {
//             "@context": {
//                 "label": "Property:HasLabel"
//             }
//         },
//         "Category:Item": {
//             "@context": [
//                 "Category:Entity",
//                 {
//                     "member": {"@id": "Property:HasMember", "@type": "@id"},
//                     "other": {"@id": "Property:HasOther", "@type": "@id"},
//                     "budget": {"@id": "Property:HasBudget", "@type": "@id"},
//                     "some_property": {"@id": "Property:HasSomeItem", "@type": "@id"},
//                     "some_literal": "Property:HasSomeLiteral"
//                 }
//                 ],
//             "properties": {
//                 "label": [{
//                     "type": "array",
//                     "title": "Labels",
//                     "items": {
//                         "type": "object",
//                         "title": "Label",
//                         "properties": {
//                             "text": {},
//                             "lang": {}
//                         }
//                     }
//                 }],
//                 "member": {
//                     "type": "string",
//                     "title": "Member"
//                 },
//                 "budget": {
//                     "type": "array",
//                     "title": "Budgets",
//                     "items": {
//                         "type": "object",
//                         "title": "Budget",
//                         "properties": {
//                             "year": {"title": "Year"},
//                             "value": {"title": "BudgetValue"}
//                         }
//                     }
//                 }
//             }
//         }

//         },
//       "jsondata": {
//         "Item:MyProject": {
//             "type": ["Category:Item"],
//             "label": [{"text": "My Project", "lang": "en"}, {"text": "Projekt", "lang": "de"}],
//             "member": ["Item:SomePerson", "Item:SomePerson"], //"Item:MyOtherItem"
//             "other": ["Item:SomePerson"],
//             "some_literal": ["Some string","Some","string",],
//             "not_in_context": "Not in Context",
//             "budget": [{
//                 "year": "2000",
//                 "value": "10000",
//                 "budget":[{
//                   "year": "2023",
//                   "value": "10",
//                   }, {
//                     "year": "2022",
//                     "value": "20"}]
//             },{
//               "year": "2001",
//               "value": "20000"
//           },{
//             "year": "2002",
//             "value": "30000"
//         },{
//           "year": "2003",
//           "value": ["40000","50000"]
//       }]
//         },
//         "Item:SomePerson": {
//             "type": ["Category:Item"],
//             "label": [{"text": "Max Mustermann", "lang": "en"}],
//             "some_property": "Item:MyOtherItem"
//         },
//         "Property:HasMember": {
//             "type": ["Category:Property"],
//             "label": [{"text": "Has Member", "lang": "en"}]
//         },
//         "Item:MyOtherItem": {
//           "type": ["Category:Item"],
//           "label": [{"text": "My Other", "lang": "en"}],
//           "member": ["Item:MyNewItem"],
//           "some_literal": "Some string",
//           "not_in_context": "Not in Context",
//           "budget":[{
//                   "year": "2022",
//                   "value": "10"}, {
//                     "year": "2022",
//                     "value": "20"}]

//         },
//         "Item:MyNewItem": {
//           "type": ["Category:Item"],
//           "label": [{"text": "My New Other", "lang": "en"}],
//           "other":["Item:MySecondItem"]

//         },
//         "Item:MySecondItem": {
//           "type": ["Category:Item"],
//           "label": [{"text": "My Second Other", "lang": "en"}]

//         },

//       }};

//       let configFile =
//       {
//           "type": [
//             "Category:OSWaf511685f7c044e49bcdc5e32e58b19a"
//           ],
//           "graph_container_id": "mynetwork",
//           "root_node_objects": [
//             {
//               "node_id": "Item:MyProject",
//               "expansion_depth": 1,
//               "properties": [
//                 "property1"
//               ],
//               "expansion_path": "path.path.path"
//             },
//             {
//               "node_id": "Item:MyOtherItem",
//               "expansion_depth": 1,
//               "properties": [
//                 "property2"
//               ],
//               "expansion_path": "path.path.path.path"
//             }
//           ],
//           "uuid": "c70c0a9a-dc29-4d92-92d6-043c5ec760ea",
//           "label": [
//             {
//               "text": "config1",
//               "lang": "en"
//             }
//           ],
//           "expanded_paths": [
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:MyProject/some_literal/0"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:MyProject/some_literal/1"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:MyProject/some_literal/2"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:MyProject/not_in_context"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:SomePerson",
//               "jsondata/Item:MyOtherItem",
//               "jsondata/Item:MyNewItem"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:SomePerson",
//               "jsondata/Item:MyOtherItem",
//               "jsondata/Item:MyOtherItem/some_literal"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:SomePerson",
//               "jsondata/Item:MyOtherItem",
//               "jsondata/Item:MyOtherItem/not_in_context"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:SomePerson",
//               "jsondata/Item:MyOtherItem",
//               "jsondata/Item:MyOtherItem/budget/0",
//               "jsondata/Item:MyOtherItem/budget/0/year"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:SomePerson",
//               "jsondata/Item:MyOtherItem",
//               "jsondata/Item:MyOtherItem/budget/0",
//               "jsondata/Item:MyOtherItem/budget/0/value"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:SomePerson",
//               "jsondata/Item:MyOtherItem",
//               "jsondata/Item:MyOtherItem/budget/1",
//               "jsondata/Item:MyOtherItem/budget/1/year"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:SomePerson",
//               "jsondata/Item:MyOtherItem",
//               "jsondata/Item:MyOtherItem/budget/1",
//               "jsondata/Item:MyOtherItem/budget/1/value"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:MyProject/budget/0",
//               "jsondata/Item:MyProject/budget/0/year"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:MyProject/budget/0",
//               "jsondata/Item:MyProject/budget/0/value"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:MyProject/budget/0",
//               "jsondata/Item:MyProject/budget/0/budget/0",
//               "jsondata/Item:MyProject/budget/0/budget/0/year"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:MyProject/budget/0",
//               "jsondata/Item:MyProject/budget/0/budget/0",
//               "jsondata/Item:MyProject/budget/0/budget/0/value"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:MyProject/budget/0",
//               "jsondata/Item:MyProject/budget/0/budget/1",
//               "jsondata/Item:MyProject/budget/0/budget/1/year"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:MyProject/budget/0",
//               "jsondata/Item:MyProject/budget/0/budget/1",
//               "jsondata/Item:MyProject/budget/0/budget/1/value"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:MyProject/budget/1",
//               "jsondata/Item:MyProject/budget/1/year"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:MyProject/budget/1",
//               "jsondata/Item:MyProject/budget/1/value"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:MyProject/budget/2",
//               "jsondata/Item:MyProject/budget/2/year"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:MyProject/budget/2",
//               "jsondata/Item:MyProject/budget/2/value"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:MyProject/budget/3",
//               "jsondata/Item:MyProject/budget/3/year"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:MyProject/budget/3",
//               "jsondata/Item:MyProject/budget/3/value/0"
//           ],
//           [
//               "jsondata/Item:MyProject",
//               "jsondata/Item:MyProject/budget/3",
//               "jsondata/Item:MyProject/budget/3/value/1"
//           ]
//       ],
//           "expanded_nodes": [
//             {
//               "node_id": "item:test",
//               "expansion_depth": 1,
//               "properties": [
//                 "property 1"
//               ],
//               "expansion_path": "path.path"
//             }
//           ],
//           "coloring_function_object": {
//             "function_name": "colorByValue",
//             "path": "value",
//             "start_color": "orangered",
//             "end_color": "limegreen"
//           },
//           "positioning_function_object": {
//             "test": null
//           },
//           "visual_search_function_object": {
//             "search_string": "budget",
//             "search_on": "nodes"
//           },
//           "dataset_search_function_object": {
//             "search_string": "20",
//             "search_on": "nodes",
//             "keep_expanded": true
//           },
//           "visual_nodes_edges_object": {
//             "nodes": [
//               [
//                 "node 1",
//                 "node 2"
//               ]
//             ],
//             "edges": [
//               [
//                 "edge 1",
//                 "edge 2"
//               ]
//             ]
//           },
//           "initial_dataset": {
//             "jsondata": {
//               "jsondata_old": {}
//             },
//             "jsonschema": {
//               "jsonschema_old": {}
//             }
//           },
//           "data_format": [
//             "format"
//           ],
//           "dataset_schema": [
//             "schema"
//           ],
//           "name": "Config1"
//         }

//     const evaluationResult = await page.evaluate(({ newJson, configFile }) => {
//       const ge = new isg.Graph.Graph(newJson, configFile);

//       const result = ge.graphtool.unit()
//       const result2 = ge.graphtool.unit()

//       return { result, result2 };
//   }, { newJson, configFile })
//   .catch(error => {
//       console.error('Error during evaluation:', error);
//       return null; // Handle the error as needed
//   });

//   if (evaluationResult !== null) {
//       test('unit test test', async assert => {
//           assert.plan(2);
//           assert.equal(evaluationResult.result, "GraphDrawer");
//           assert.equal(evaluationResult.result2, "GraphTool");
//       });
//   }

//   await browser.close();

// //   page.evaluate(async ({ newJson, configFile }) => {
// //     const ge = new isg.Graph.Graph(newJson, configFile);

// //     const result = ge.isNodeLastInPath('test');
// //     const result2 = ge.isNodeLastInPath('jsondata/Item:MyProject1');

// //     return { result, result2 };
// // }, { newJson, configFile })
// // .then(({ result, result2 }) => {
// //     test('new test', async assert => {
// //         assert.plan(2);
// //         assert.equal(result, true);
// //         assert.equal(result2, false);
// //     });
// // })
// // .catch(error => {
// //     console.error('Error during evaluation:', error);
// // })
// // .finally(async () => {
// //     await browser.close();
// // });

// })()
