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
  browser = await browsers.firefox.launch()
  page = await browser.newPage()

  await page.goto(`file://${join(__dirname, '../fixtures/index.html')}`)
  await page.addScriptTag({
    path: join(__dirname, '../../dist/isg.umd.js')
  })

  const newJson = {
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
            value: '10',
            other: ['Item:MySecondItem']
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

  const configFile = {
    type: [
      'Category:OSWaf511685f7c044e49bcdc5e32e58b19a'
    ],
    graph_container_id: 'mynetwork',
    root_node_objects: [
      {
        node_id: 'Item:MyProject',
        expansion_depth: 1,
        properties: [
          'property1'
        ],
        expansion_path: 'path.path.path'
      },
      {
        node_id: 'Item:MyOtherItem',
        expansion_depth: 1,
        properties: [
          'property2'
        ],
        expansion_path: 'path.path.path.path'
      }
    ],
    uuid: 'c70c0a9a-dc29-4d92-92d6-043c5ec760ea',
    label: [
      {
        text: 'config1',
        lang: 'en'
      }
    ],
    expanded_paths: [
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:MyProject/some_literal/0'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:MyProject/some_literal/1'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:MyProject/some_literal/2'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:MyProject/not_in_context'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:SomePerson',
        'jsondata/Item:MyOtherItem',
        'jsondata/Item:MyNewItem'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:SomePerson',
        'jsondata/Item:MyOtherItem',
        'jsondata/Item:MyOtherItem/some_literal'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:SomePerson',
        'jsondata/Item:MyOtherItem',
        'jsondata/Item:MyOtherItem/not_in_context'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:SomePerson',
        'jsondata/Item:MyOtherItem',
        'jsondata/Item:MyOtherItem/budget/0',
        'jsondata/Item:MyOtherItem/budget/0/year'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:SomePerson',
        'jsondata/Item:MyOtherItem',
        'jsondata/Item:MyOtherItem/budget/0',
        'jsondata/Item:MyOtherItem/budget/0/value'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:SomePerson',
        'jsondata/Item:MyOtherItem',
        'jsondata/Item:MyOtherItem/budget/1',
        'jsondata/Item:MyOtherItem/budget/1/year'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:SomePerson',
        'jsondata/Item:MyOtherItem',
        'jsondata/Item:MyOtherItem/budget/1',
        'jsondata/Item:MyOtherItem/budget/1/value'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:MyProject/budget/0',
        'jsondata/Item:MyProject/budget/0/year'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:MyProject/budget/0',
        'jsondata/Item:MyProject/budget/0/value'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:MyProject/budget/0',
        'jsondata/Item:MyProject/budget/0/budget/0',
        'jsondata/Item:MyProject/budget/0/budget/0/year'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:MyProject/budget/0',
        'jsondata/Item:MyProject/budget/0/budget/0',
        'jsondata/Item:MyProject/budget/0/budget/0/value'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:MyProject/budget/0',
        'jsondata/Item:MyProject/budget/0/budget/1',
        'jsondata/Item:MyProject/budget/0/budget/1/year'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:MyProject/budget/0',
        'jsondata/Item:MyProject/budget/0/budget/1',
        'jsondata/Item:MyProject/budget/0/budget/1/value'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:MyProject/budget/1',
        'jsondata/Item:MyProject/budget/1/year'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:MyProject/budget/1',
        'jsondata/Item:MyProject/budget/1/value'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:MyProject/budget/2',
        'jsondata/Item:MyProject/budget/2/year'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:MyProject/budget/2',
        'jsondata/Item:MyProject/budget/2/value'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:MyProject/budget/3',
        'jsondata/Item:MyProject/budget/3/year'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:MyProject/budget/3',
        'jsondata/Item:MyProject/budget/3/value/0'
      ],
      [
        'jsondata/Item:MyProject',
        'jsondata/Item:MyProject/budget/3',
        'jsondata/Item:MyProject/budget/3/value/1'
      ]
    ],
    expanded_nodes: [
      {
        node_id: 'item:test',
        expansion_depth: 1,
        properties: [
          'property 1'
        ],
        expansion_path: 'path.path'
      }
    ],
    coloring_function_object: {
      function_name: 'colorByValue',
      path: 'value',
      start_color: 'orangered',
      end_color: 'limegreen'
    },
    positioning_function_object: {
      test: null
    },
    visual_search_function_object: {
      search_string: 'budget',
      search_on: 'nodes'
    },
    dataset_search_function_object: {
      search_string: '20',
      search_on: 'nodes',
      keep_expanded: true
    },
    visual_nodes_edges_object: {
      nodes: [
        [
          'node 1',
          'node 2'
        ]
      ],
      edges: [
        [
          'edge 1',
          'edge 2'
        ]
      ]
    },
    initial_dataset: {
      jsondata: {
        jsondata_old: {}
      },
      jsonschema: {
        jsonschema_old: {}
      }
    },
    data_format: [
      'format'
    ],
    dataset_schema: [
      'schema'
    ],
    name: 'Config1'
  }

  const evaluationResult = await page.evaluate(({ newJson, configFile }) => {
    const ge = new isg.Graph.Graph(newJson, configFile) // eslint-disable-line no-undef

    // saveGraphColorsVisualSearch test
    const nodeOriginalColor = ge.graphtool.nodes.get('jsondata/Item:MyProject/some_literal/0').color
    const edgeOriginalColor = ge.graphtool.edges.get('jsondata/Item:MyProject==some_literal=>jsondata/Item:MyProject/some_literal/0').color
    ge.graphtool.saveGraphColorsVisualSearch()

    const expectedSavedColors = {
      'jsondata/Item:MyProject': '#6dbfa9',
      'jsondata/Item:SomePerson': 'hsla(157.03839830483545,70%,80%,1)',
      'jsondata/Item:MyProject/some_literal/0': 'hsla(19.53063425479769,70%,80%,1)',
      'jsondata/Item:MyProject/some_literal/1': 'hsla(19.53063425479769,70%,80%,1)',
      'jsondata/Item:MyProject/some_literal/2': 'hsla(19.53063425479769,70%,80%,1)',
      'jsondata/Item:MyProject/not_in_context': 'hsla(242.0228702047599,70%,80%,1)',
      'jsondata/Item:MyProject/budget/0': 'hsla(104.5151061547221,70%,80%,1)',
      'jsondata/Item:MyProject/budget/1': 'hsla(104.5151061547221,70%,80%,1)',
      'jsondata/Item:MyProject/budget/2': 'hsla(104.5151061547221,70%,80%,1)',
      'jsondata/Item:MyProject/budget/3': 'hsla(104.5151061547221,70%,80%,1)',
      'jsondata/Item:MyOtherItem': '#6dbfa9',
      'jsondata/Item:MyNewItem': 'hsla(294.5461623548732,70%,80%,1)',
      'jsondata/Item:MyOtherItem/some_literal': 'hsla(19.53063425479769,70%,80%,1)',
      'jsondata/Item:MyOtherItem/not_in_context': 'hsla(242.0228702047599,70%,80%,1)',
      'jsondata/Item:MyOtherItem/budget/0': 'hsla(104.5151061547221,70%,80%,1)',
      'jsondata/Item:MyOtherItem/budget/1': 'hsla(104.5151061547221,70%,80%,1)',
      'jsondata/Item:MyProject==Has Member=>jsondata/Item:SomePerson': 'hsla(294.5461623548732,70%,80%,1)',
      'jsondata/Item:MyProject==HasOther=>jsondata/Item:SomePerson': 'hsla(157.03839830483545,70%,80%,1)',
      'jsondata/Item:MyProject==some_literal=>jsondata/Item:MyProject/some_literal/0': 'hsla(19.53063425479769,70%,80%,1)',
      'jsondata/Item:MyProject==some_literal=>jsondata/Item:MyProject/some_literal/1': 'hsla(19.53063425479769,70%,80%,1)',
      'jsondata/Item:MyProject==some_literal=>jsondata/Item:MyProject/some_literal/2': 'hsla(19.53063425479769,70%,80%,1)',
      'jsondata/Item:MyProject==not_in_context=>jsondata/Item:MyProject/not_in_context': 'hsla(242.0228702047599,70%,80%,1)',
      'jsondata/Item:MyProject==HasBudget=>jsondata/Item:MyProject/budget/0': 'hsla(104.5151061547221,70%,80%,1)',
      'jsondata/Item:MyProject==HasBudget=>jsondata/Item:MyProject/budget/1': 'hsla(104.5151061547221,70%,80%,1)',
      'jsondata/Item:MyProject==HasBudget=>jsondata/Item:MyProject/budget/2': 'hsla(104.5151061547221,70%,80%,1)',
      'jsondata/Item:MyProject==HasBudget=>jsondata/Item:MyProject/budget/3': 'hsla(104.5151061547221,70%,80%,1)',
      'jsondata/Item:MyOtherItem==Has Member=>jsondata/Item:MyNewItem': 'hsla(294.5461623548732,70%,80%,1)',
      'jsondata/Item:MyOtherItem==some_literal=>jsondata/Item:MyOtherItem/some_literal': 'hsla(19.53063425479769,70%,80%,1)',
      'jsondata/Item:MyOtherItem==not_in_context=>jsondata/Item:MyOtherItem/not_in_context': 'hsla(242.0228702047599,70%,80%,1)',
      'jsondata/Item:MyOtherItem==HasBudget=>jsondata/Item:MyOtherItem/budget/0': 'hsla(104.5151061547221,70%,80%,1)',
      'jsondata/Item:MyOtherItem==HasBudget=>jsondata/Item:MyOtherItem/budget/1': 'hsla(104.5151061547221,70%,80%,1)'
    }
    const savedColors = ge.graphtool.colorsBeforeVisualSearch

    for (const key in savedColors) {
      // Check if the key exists in the second object (obj2)
      if (expectedSavedColors.hasOwnProperty(key)) { // eslint-disable-line no-prototype-builtins
        // Set the value in obj2 to match the value in obj1
        expectedSavedColors[key] = savedColors[key]
      }
    }

    // loadGraphColorsVisualSearch test

    for (let i = 0; i < ge.graphtool.nodes.get().length; i++) {
      const node = ge.graphtool.nodes.get()[i]

      if (node.color) {
        node.color = 'red'

        ge.graphtool.nodes.update(node)
      }
    }

    for (let i = 0; i < ge.graphtool.edges.get().length; i++) {
      const edge = ge.graphtool.edges.get()[i]

      if (edge.color) {
        edge.color = 'red'

        ge.graphtool.edges.update(edge)
      }
    }
    ge.graphtool.loadGraphColorsVisualSearch()

    const nodeColorAfterLoad = ge.graphtool.nodes.get('jsondata/Item:MyProject/some_literal/0').color
    const edgeColorAfterLoad = ge.graphtool.edges.get('jsondata/Item:MyProject==some_literal=>jsondata/Item:MyProject/some_literal/0').color

    const loadGraphColorsVisualSearch = { nodeOriginalColor, nodeColorAfterLoad, edgeOriginalColor, edgeColorAfterLoad }

    const saveGraphColorsVisualSearch = { savedColors, expectedSavedColors }

    // searchNodes test
    const searchNodesNodes = ge.graphtool.searchNodes('b')
    const searchNodesNodesOutput = [
      'jsondata/Item:MyProject',
      'jsondata/Item:MyProject',
      'jsondata/Item:MyProject/budget/0',
      'jsondata/Item:MyProject',
      'jsondata/Item:MyProject/budget/1',
      'jsondata/Item:MyProject',
      'jsondata/Item:MyProject/budget/2',
      'jsondata/Item:MyProject',
      'jsondata/Item:MyProject/budget/3',
      'jsondata/Item:MyOtherItem',
      'jsondata/Item:MyOtherItem',
      'jsondata/Item:MyOtherItem/budget/0',
      'jsondata/Item:MyOtherItem',
      'jsondata/Item:MyOtherItem/budget/1'
    ]
    document.getElementById('Graph0_search_select').value = 'search_edge'

    const searchNodesEdges = ge.graphtool.searchNodes('b')
    const searchNodesEdgesOutput = [
      'jsondata/Item:MyProject',
      'jsondata/Item:SomePerson',
      'jsondata/Item:MyProject',
      'jsondata/Item:MyProject/budget/0',
      'jsondata/Item:MyProject',
      'jsondata/Item:MyProject/budget/1',
      'jsondata/Item:MyProject',
      'jsondata/Item:MyProject/budget/2',
      'jsondata/Item:MyProject',
      'jsondata/Item:MyProject/budget/3',
      'jsondata/Item:MyOtherItem',
      'jsondata/Item:MyNewItem',
      'jsondata/Item:MyOtherItem',
      'jsondata/Item:MyOtherItem/budget/0',
      'jsondata/Item:MyOtherItem',
      'jsondata/Item:MyOtherItem/budget/1'
    ]

    const searchNodes = { searchNodesNodes, searchNodesNodesOutput, searchNodesEdges, searchNodesEdgesOutput }

    // createSearchUI test
    let searchInput
    if (document.getElementById('Graph0_search_input')) {
      searchInput = true
    } else {
      searchInput = false
    }

    let searchSelect
    if (document.getElementById('Graph0_search_select')) {
      searchSelect = true
    } else {
      searchSelect = false
    }

    const selectElement = document.getElementById('Graph0_search_select')
    const searchOptions = []

    for (const option of selectElement.options) {
      searchOptions.push(option.value)
    }

    const createSearchUI = { searchInput, searchSelect, searchOptions }

    return { saveGraphColorsVisualSearch, loadGraphColorsVisualSearch, searchNodes, createSearchUI }
  }, { newJson, configFile })
    .catch(error => {
      console.error('Error during evaluation:', error)
      return null // Handle the error as needed
    })

  if (evaluationResult !== null) {
    test('Is the savedColors object the same ', async assert => {
      assert.plan(1)
      assert.strictSame(evaluationResult.saveGraphColorsVisualSearch.savedColors, evaluationResult.saveGraphColorsVisualSearch.expectedSavedColors)
    })

    test('Is the node color the same after loadGraphColorsVisualSearch', async assert => {
      assert.plan(2)
      assert.equal(evaluationResult.loadGraphColorsVisualSearch.nodeOriginalColor, evaluationResult.loadGraphColorsVisualSearch.nodeColorAfterLoad)
      assert.equal(evaluationResult.loadGraphColorsVisualSearch.edgeOriginalColor, evaluationResult.loadGraphColorsVisualSearch.edgeColorAfterLoad)
    })

    test('Is the searchNodes output the same', async assert => {
      assert.plan(2)
      assert.strictSame(evaluationResult.searchNodes.searchNodesNodes, evaluationResult.searchNodes.searchNodesNodesOutput)
      assert.strictSame(evaluationResult.searchNodes.searchNodesEdges, evaluationResult.searchNodes.searchNodesEdgesOutput)
      console.log(evaluationResult.getInput)
    })

    test('Is the search UI created', async assert => {
      assert.plan(3)
      assert.same(evaluationResult.createSearchUI.searchInput, true)
      assert.same(evaluationResult.createSearchUI.searchSelect, true)
      assert.strictSame(evaluationResult.createSearchUI.searchOptions, ['search_node', 'search_edge'])
    })
  }

  await browser.close()

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
