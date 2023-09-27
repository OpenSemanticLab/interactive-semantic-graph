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

  const nodes = [
    {
      id: 'jsondata/Item:MyProject',
      label: 'My Project',
      path: [
        'jsondata',
        'Item:MyProject'
      ],
      key: 'Item:MyProject',
      item: 'Item:MyProject',
      value: NaN,
      incomingLabels: [
        'root'
      ],
      context: {
        label: 'Property:HasLabel',
        member: {
          '@id': 'Property:HasMember',
          '@type': '@id'
        },
        other: {
          '@id': 'Property:HasOther',
          '@type': '@id'
        },
        budget: {
          '@id': 'Property:HasBudget',
          '@type': '@id'
        },
        some_property: {
          '@id': 'Property:HasSomeItem',
          '@type': '@id'
        },
        some_literal: 'Property:HasSomeLiteral'
      },
      depth: 0,
      depthObject: {
        'jsondata/Item:MyProject': 0
      },
      color: '#6dbfa9',
      group: 'root'
    },
    {
      id: 'jsondata/Item:SomePerson',
      label: 'Max Mustermann',
      path: [
        'jsondata',
        'Item:SomePerson'
      ],
      key: 'member',
      item: 'Item:MyProject',
      value: NaN,
      incomingLabels: [
        'Has Member'
      ],
      context: {
        label: 'Property:HasLabel',
        member: {
          '@id': 'Property:HasMember',
          '@type': '@id'
        },
        other: {
          '@id': 'Property:HasOther',
          '@type': '@id'
        },
        budget: {
          '@id': 'Property:HasBudget',
          '@type': '@id'
        },
        some_property: {
          '@id': 'Property:HasSomeItem',
          '@type': '@id'
        },
        some_literal: 'Property:HasSomeLiteral'
      },
      depth: 1,
      depthObject: {
        'jsondata/Item:MyProject': 1
      },
      color: 'hsla(206.86734919314097,70%,80%,1)',
      group: 'Has Member'
    },
    {
      id: 'jsondata/Item:MyProject/some_literal/0',
      label: 'Some string',
      path: [
        'jsondata',
        'Item:MyProject',
        'some_literal',
        '0'
      ],
      key: 'some_literal',
      item: 'Item:MyProject',
      value: NaN,
      incomingLabels: [
        'some_literal'
      ],
      context: {
        label: 'Property:HasLabel',
        member: {
          '@id': 'Property:HasMember',
          '@type': '@id'
        },
        other: {
          '@id': 'Property:HasOther',
          '@type': '@id'
        },
        budget: {
          '@id': 'Property:HasBudget',
          '@type': '@id'
        },
        some_property: {
          '@id': 'Property:HasSomeItem',
          '@type': '@id'
        },
        some_literal: 'Property:HasSomeLiteral'
      },
      depth: 1,
      depthObject: {
        'jsondata/Item:MyProject': 1
      },
      color: 'hsla(69.3595851431032,70%,80%,1)',
      group: 'some_literal'
    },
    {
      id: 'jsondata/Item:MyProject/some_literal/1',
      label: 'Some',
      path: [
        'jsondata',
        'Item:MyProject',
        'some_literal',
        '1'
      ],
      key: 'some_literal',
      item: 'Item:MyProject',
      value: NaN,
      incomingLabels: [
        'some_literal'
      ],
      context: {
        label: 'Property:HasLabel',
        member: {
          '@id': 'Property:HasMember',
          '@type': '@id'
        },
        other: {
          '@id': 'Property:HasOther',
          '@type': '@id'
        },
        budget: {
          '@id': 'Property:HasBudget',
          '@type': '@id'
        },
        some_property: {
          '@id': 'Property:HasSomeItem',
          '@type': '@id'
        },
        some_literal: 'Property:HasSomeLiteral'
      },
      depth: 1,
      depthObject: {
        'jsondata/Item:MyProject': 1
      },
      color: 'hsla(69.3595851431032,70%,80%,1)',
      group: 'some_literal'
    },
    {
      id: 'jsondata/Item:MyProject/some_literal/2',
      label: 'string',
      path: [
        'jsondata',
        'Item:MyProject',
        'some_literal',
        '2'
      ],
      key: 'some_literal',
      item: 'Item:MyProject',
      value: NaN,
      incomingLabels: [
        'some_literal'
      ],
      context: {
        label: 'Property:HasLabel',
        member: {
          '@id': 'Property:HasMember',
          '@type': '@id'
        },
        other: {
          '@id': 'Property:HasOther',
          '@type': '@id'
        },
        budget: {
          '@id': 'Property:HasBudget',
          '@type': '@id'
        },
        some_property: {
          '@id': 'Property:HasSomeItem',
          '@type': '@id'
        },
        some_literal: 'Property:HasSomeLiteral'
      },
      depth: 1,
      depthObject: {
        'jsondata/Item:MyProject': 1
      },
      color: 'hsla(69.3595851431032,70%,80%,1)',
      group: 'some_literal'
    },
    {
      id: 'jsondata/Item:MyProject/not_in_context',
      label: 'Not in Context',
      path: [
        'jsondata',
        'Item:MyProject',
        'not_in_context'
      ],
      key: 'not_in_context',
      item: 'Item:MyProject',
      value: NaN,
      incomingLabels: [
        'not_in_context'
      ],
      context: {
        label: 'Property:HasLabel',
        member: {
          '@id': 'Property:HasMember',
          '@type': '@id'
        },
        other: {
          '@id': 'Property:HasOther',
          '@type': '@id'
        },
        budget: {
          '@id': 'Property:HasBudget',
          '@type': '@id'
        },
        some_property: {
          '@id': 'Property:HasSomeItem',
          '@type': '@id'
        },
        some_literal: 'Property:HasSomeLiteral'
      },
      depth: 1,
      depthObject: {
        'jsondata/Item:MyProject': 1
      },
      color: 'hsla(291.8518210930654,70%,80%,1)',
      group: 'not_in_context'
    },
    {
      id: 'jsondata/Item:MyProject/budget/0',
      label: 'budget',
      path: [
        'jsondata',
        'Item:MyProject',
        'budget',
        '0'
      ],
      key: 'budget',
      item: 'Item:MyProject',
      value: NaN,
      incomingLabels: [
        'HasBudget'
      ],
      context: {
        label: 'Property:HasLabel',
        member: {
          '@id': 'Property:HasMember',
          '@type': '@id'
        },
        other: {
          '@id': 'Property:HasOther',
          '@type': '@id'
        },
        budget: {
          '@id': 'Property:HasBudget',
          '@type': '@id'
        },
        some_property: {
          '@id': 'Property:HasSomeItem',
          '@type': '@id'
        },
        some_literal: 'Property:HasSomeLiteral'
      },
      depth: 1,
      depthObject: {
        'jsondata/Item:MyProject': 1
      },
      color: 'hsla(154.34405704302762,70%,80%,1)',
      group: 'HasBudget'
    },
    {
      id: 'jsondata/Item:MyProject/budget/1',
      label: 'budget',
      path: [
        'jsondata',
        'Item:MyProject',
        'budget',
        '1'
      ],
      key: 'budget',
      item: 'Item:MyProject',
      value: NaN,
      incomingLabels: [
        'HasBudget'
      ],
      context: {
        label: 'Property:HasLabel',
        member: {
          '@id': 'Property:HasMember',
          '@type': '@id'
        },
        other: {
          '@id': 'Property:HasOther',
          '@type': '@id'
        },
        budget: {
          '@id': 'Property:HasBudget',
          '@type': '@id'
        },
        some_property: {
          '@id': 'Property:HasSomeItem',
          '@type': '@id'
        },
        some_literal: 'Property:HasSomeLiteral'
      },
      depth: 1,
      depthObject: {
        'jsondata/Item:MyProject': 1
      },
      color: 'hsla(154.34405704302762,70%,80%,1)',
      group: 'HasBudget'
    },
    {
      id: 'jsondata/Item:MyProject/budget/2',
      label: 'budget',
      path: [
        'jsondata',
        'Item:MyProject',
        'budget',
        '2'
      ],
      key: 'budget',
      item: 'Item:MyProject',
      value: NaN,
      incomingLabels: [
        'HasBudget'
      ],
      context: {
        label: 'Property:HasLabel',
        member: {
          '@id': 'Property:HasMember',
          '@type': '@id'
        },
        other: {
          '@id': 'Property:HasOther',
          '@type': '@id'
        },
        budget: {
          '@id': 'Property:HasBudget',
          '@type': '@id'
        },
        some_property: {
          '@id': 'Property:HasSomeItem',
          '@type': '@id'
        },
        some_literal: 'Property:HasSomeLiteral'
      },
      depth: 1,
      depthObject: {
        'jsondata/Item:MyProject': 1
      },
      color: 'hsla(154.34405704302762,70%,80%,1)',
      group: 'HasBudget'
    },
    {
      id: 'jsondata/Item:MyProject/budget/3',
      label: 'budget',
      path: [
        'jsondata',
        'Item:MyProject',
        'budget',
        '3'
      ],
      key: 'budget',
      item: 'Item:MyProject',
      value: NaN,
      incomingLabels: [
        'HasBudget'
      ],
      context: {
        label: 'Property:HasLabel',
        member: {
          '@id': 'Property:HasMember',
          '@type': '@id'
        },
        other: {
          '@id': 'Property:HasOther',
          '@type': '@id'
        },
        budget: {
          '@id': 'Property:HasBudget',
          '@type': '@id'
        },
        some_property: {
          '@id': 'Property:HasSomeItem',
          '@type': '@id'
        },
        some_literal: 'Property:HasSomeLiteral'
      },
      depth: 1,
      depthObject: {
        'jsondata/Item:MyProject': 1
      },
      color: 'hsla(154.34405704302762,70%,80%,1)',
      group: 'HasBudget'
    },
    {
      id: 'jsondata/Item:MyOtherItem',
      label: 'My Other',
      path: [
        'jsondata',
        'Item:MyOtherItem'
      ],
      key: 'Item:MyOtherItem',
      item: 'Item:MyOtherItem',
      value: NaN,
      incomingLabels: [
        'root'
      ],
      context: {
        label: 'Property:HasLabel',
        member: {
          '@id': 'Property:HasMember',
          '@type': '@id'
        },
        other: {
          '@id': 'Property:HasOther',
          '@type': '@id'
        },
        budget: {
          '@id': 'Property:HasBudget',
          '@type': '@id'
        },
        some_property: {
          '@id': 'Property:HasSomeItem',
          '@type': '@id'
        },
        some_literal: 'Property:HasSomeLiteral'
      },
      depth: 0,
      depthObject: {
        'jsondata/Item:MyOtherItem': 0
      },
      color: '#6dbfa9',
      group: 'root'
    },
    {
      id: 'jsondata/Item:MyNewItem',
      label: 'My New Other',
      path: [
        'jsondata',
        'Item:MyNewItem'
      ],
      key: 'member',
      item: 'Item:MyOtherItem',
      value: NaN,
      incomingLabels: [
        'Has Member'
      ],
      context: {
        label: 'Property:HasLabel',
        member: {
          '@id': 'Property:HasMember',
          '@type': '@id'
        },
        other: {
          '@id': 'Property:HasOther',
          '@type': '@id'
        },
        budget: {
          '@id': 'Property:HasBudget',
          '@type': '@id'
        },
        some_property: {
          '@id': 'Property:HasSomeItem',
          '@type': '@id'
        },
        some_literal: 'Property:HasSomeLiteral'
      },
      depth: 1,
      depthObject: {
        'jsondata/Item:MyOtherItem': 1
      },
      color: 'hsla(344.37511324317876,70%,80%,1)',
      group: 'Has Member'
    },
    {
      id: 'jsondata/Item:MyOtherItem/some_literal',
      label: 'Some string',
      path: [
        'jsondata',
        'Item:MyOtherItem',
        'some_literal'
      ],
      key: 'some_literal',
      item: 'Item:MyOtherItem',
      value: NaN,
      incomingLabels: [
        'some_literal'
      ],
      context: {
        label: 'Property:HasLabel',
        member: {
          '@id': 'Property:HasMember',
          '@type': '@id'
        },
        other: {
          '@id': 'Property:HasOther',
          '@type': '@id'
        },
        budget: {
          '@id': 'Property:HasBudget',
          '@type': '@id'
        },
        some_property: {
          '@id': 'Property:HasSomeItem',
          '@type': '@id'
        },
        some_literal: 'Property:HasSomeLiteral'
      },
      depth: 1,
      depthObject: {
        'jsondata/Item:MyOtherItem': 1
      },
      color: 'hsla(69.3595851431032,70%,80%,1)',
      group: 'some_literal'
    },
    {
      id: 'jsondata/Item:MyOtherItem/not_in_context',
      label: 'Not in Context',
      path: [
        'jsondata',
        'Item:MyOtherItem',
        'not_in_context'
      ],
      key: 'not_in_context',
      item: 'Item:MyOtherItem',
      value: NaN,
      incomingLabels: [
        'not_in_context'
      ],
      context: {
        label: 'Property:HasLabel',
        member: {
          '@id': 'Property:HasMember',
          '@type': '@id'
        },
        other: {
          '@id': 'Property:HasOther',
          '@type': '@id'
        },
        budget: {
          '@id': 'Property:HasBudget',
          '@type': '@id'
        },
        some_property: {
          '@id': 'Property:HasSomeItem',
          '@type': '@id'
        },
        some_literal: 'Property:HasSomeLiteral'
      },
      depth: 1,
      depthObject: {
        'jsondata/Item:MyOtherItem': 1
      },
      color: 'hsla(291.8518210930654,70%,80%,1)',
      group: 'not_in_context'
    },
    {
      id: 'jsondata/Item:MyOtherItem/budget/0',
      label: 'budget',
      path: [
        'jsondata',
        'Item:MyOtherItem',
        'budget',
        '0'
      ],
      key: 'budget',
      item: 'Item:MyOtherItem',
      value: NaN,
      incomingLabels: [
        'HasBudget'
      ],
      context: {
        label: 'Property:HasLabel',
        member: {
          '@id': 'Property:HasMember',
          '@type': '@id'
        },
        other: {
          '@id': 'Property:HasOther',
          '@type': '@id'
        },
        budget: {
          '@id': 'Property:HasBudget',
          '@type': '@id'
        },
        some_property: {
          '@id': 'Property:HasSomeItem',
          '@type': '@id'
        },
        some_literal: 'Property:HasSomeLiteral'
      },
      depth: 1,
      depthObject: {
        'jsondata/Item:MyOtherItem': 1
      },
      color: 'hsla(154.34405704302762,70%,80%,1)',
      group: 'HasBudget'
    },
    {
      id: 'jsondata/Item:MyOtherItem/budget/1',
      label: 'budget',
      path: [
        'jsondata',
        'Item:MyOtherItem',
        'budget',
        '1'
      ],
      key: 'budget',
      item: 'Item:MyOtherItem',
      value: NaN,
      incomingLabels: [
        'HasBudget'
      ],
      context: {
        label: 'Property:HasLabel',
        member: {
          '@id': 'Property:HasMember',
          '@type': '@id'
        },
        other: {
          '@id': 'Property:HasOther',
          '@type': '@id'
        },
        budget: {
          '@id': 'Property:HasBudget',
          '@type': '@id'
        },
        some_property: {
          '@id': 'Property:HasSomeItem',
          '@type': '@id'
        },
        some_literal: 'Property:HasSomeLiteral'
      },
      depth: 1,
      depthObject: {
        'jsondata/Item:MyOtherItem': 1
      },
      color: 'hsla(154.34405704302762,70%,80%,1)',
      group: 'HasBudget'
    }
  ]

  const edges = [
    {
      id: 'jsondata/Item:MyProject==Has Member=>jsondata/Item:SomePerson',
      from: 'jsondata/Item:MyProject',
      to: 'jsondata/Item:SomePerson',
      label: 'Has Member',
      group: 'Has Member',
      objectKey: 'member',
      color: 'hsla(81.59208766441915,70%,80%,1)'
    },
    {
      id: 'jsondata/Item:MyProject==HasOther=>jsondata/Item:SomePerson',
      from: 'jsondata/Item:MyProject',
      to: 'jsondata/Item:SomePerson',
      label: 'HasOther',
      group: 'HasOther',
      objectKey: 'other',
      color: 'hsla(304.0843236143814,70%,80%,1)'
    },
    {
      id: 'jsondata/Item:MyProject==some_literal=>jsondata/Item:MyProject/some_literal/0',
      from: 'jsondata/Item:MyProject',
      to: 'jsondata/Item:MyProject/some_literal/0',
      label: 'some_literal',
      group: 'some_literal',
      objectKey: 'some_literal',
      color: 'hsla(166.57655956434357,70%,80%,1)'
    },
    {
      id: 'jsondata/Item:MyProject==some_literal=>jsondata/Item:MyProject/some_literal/1',
      from: 'jsondata/Item:MyProject',
      to: 'jsondata/Item:MyProject/some_literal/1',
      label: 'some_literal',
      group: 'some_literal',
      objectKey: 'some_literal',
      color: 'hsla(166.57655956434357,70%,80%,1)'
    },
    {
      id: 'jsondata/Item:MyProject==some_literal=>jsondata/Item:MyProject/some_literal/2',
      from: 'jsondata/Item:MyProject',
      to: 'jsondata/Item:MyProject/some_literal/2',
      label: 'some_literal',
      group: 'some_literal',
      objectKey: 'some_literal',
      color: 'hsla(166.57655956434357,70%,80%,1)'
    },
    {
      id: 'jsondata/Item:MyProject==not_in_context=>jsondata/Item:MyProject/not_in_context',
      from: 'jsondata/Item:MyProject',
      to: 'jsondata/Item:MyProject/not_in_context',
      label: 'not_in_context',
      group: 'not_in_context',
      objectKey: 'not_in_context',
      color: 'hsla(29.068795514305812,70%,80%,1)'
    },
    {
      id: 'jsondata/Item:MyProject==HasBudget=>jsondata/Item:MyProject/budget/0',
      from: 'jsondata/Item:MyProject',
      to: 'jsondata/Item:MyProject/budget/0',
      label: 'HasBudget',
      group: 'HasBudget',
      objectKey: 'budget',
      color: 'hsla(251.561031464268,70%,80%,1)'
    },
    {
      id: 'jsondata/Item:MyProject==HasBudget=>jsondata/Item:MyProject/budget/1',
      from: 'jsondata/Item:MyProject',
      to: 'jsondata/Item:MyProject/budget/1',
      label: 'HasBudget',
      group: 'HasBudget',
      objectKey: 'budget',
      color: 'hsla(251.561031464268,70%,80%,1)'
    },
    {
      id: 'jsondata/Item:MyProject==HasBudget=>jsondata/Item:MyProject/budget/2',
      from: 'jsondata/Item:MyProject',
      to: 'jsondata/Item:MyProject/budget/2',
      label: 'HasBudget',
      group: 'HasBudget',
      objectKey: 'budget',
      color: 'hsla(251.561031464268,70%,80%,1)'
    },
    {
      id: 'jsondata/Item:MyProject==HasBudget=>jsondata/Item:MyProject/budget/3',
      from: 'jsondata/Item:MyProject',
      to: 'jsondata/Item:MyProject/budget/3',
      label: 'HasBudget',
      group: 'HasBudget',
      objectKey: 'budget',
      color: 'hsla(251.561031464268,70%,80%,1)'
    },
    {
      id: 'jsondata/Item:MyOtherItem==Has Member=>jsondata/Item:MyNewItem',
      from: 'jsondata/Item:MyOtherItem',
      to: 'jsondata/Item:MyNewItem',
      label: 'Has Member',
      group: 'Has Member',
      objectKey: 'member',
      color: 'hsla(81.59208766441915,70%,80%,1)'
    },
    {
      id: 'jsondata/Item:MyOtherItem==some_literal=>jsondata/Item:MyOtherItem/some_literal',
      from: 'jsondata/Item:MyOtherItem',
      to: 'jsondata/Item:MyOtherItem/some_literal',
      label: 'some_literal',
      group: 'some_literal',
      objectKey: 'some_literal',
      color: 'hsla(166.57655956434357,70%,80%,1)'
    },
    {
      id: 'jsondata/Item:MyOtherItem==not_in_context=>jsondata/Item:MyOtherItem/not_in_context',
      from: 'jsondata/Item:MyOtherItem',
      to: 'jsondata/Item:MyOtherItem/not_in_context',
      label: 'not_in_context',
      group: 'not_in_context',
      objectKey: 'not_in_context',
      color: 'hsla(29.068795514305812,70%,80%,1)'
    },
    {
      id: 'jsondata/Item:MyOtherItem==HasBudget=>jsondata/Item:MyOtherItem/budget/0',
      from: 'jsondata/Item:MyOtherItem',
      to: 'jsondata/Item:MyOtherItem/budget/0',
      label: 'HasBudget',
      group: 'HasBudget',
      objectKey: 'budget',
      color: 'hsla(251.561031464268,70%,80%,1)'
    },
    {
      id: 'jsondata/Item:MyOtherItem==HasBudget=>jsondata/Item:MyOtherItem/budget/1',
      from: 'jsondata/Item:MyOtherItem',
      to: 'jsondata/Item:MyOtherItem/budget/1',
      label: 'HasBudget',
      group: 'HasBudget',
      objectKey: 'budget',
      color: 'hsla(251.561031464268,70%,80%,1)'
    }
  ]

  const evaluationResult = await page.evaluate(({ newJson, configFile, nodes, edges }) => {
    const ge = new isg.Graph.Graph(newJson, configFile) // eslint-disable-line no-undef

    const result = ge.drawer.nodes.get()
    const result2 = ge.drawer.edges.get()

    for (let i = 0; i < result.length; i++) {
      result[i].color = nodes[i].color
      if (result[i].group === 'root') {
        result[i].incomingLabels = ['root']
        nodes[i].incomingLabels = ['root']
      }
    }

    for (let i = 0; i < result2.length; i++) {
      result2[i].color = edges[i].color
    }

    return { result, result2 }
  }, { newJson, configFile, nodes, edges })
    .catch(error => {
      console.error('Error during evaluation:', error)
      return null // Handle the error as needed
    })

  if (evaluationResult !== null) {
    test('Are the generated Nodes and Edges the same as the prepared ones', async assert => {
      assert.plan(2)
      // assert.same(evaluationResult.result, nodes)
      assert.strictSame(evaluationResult.result, nodes)
      assert.strictSame(evaluationResult.result2, edges)
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
