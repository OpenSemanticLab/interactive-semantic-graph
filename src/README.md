# SOURCE FOLDER DOCS

## Graph folder

### 1.  Graph.js

1. `Graph` class is used to create a graph.
2.  It has two properties:
    - `file` - should contain the JSON-file
    - `configFile` - should contain the configuration for the graph (see example folder script.js)

## GraphDrawer folder

### 1. GraphDrawer.js

1. `GraphDrawer` class is used to recursive generate nodes and edges for the graph.
2. It has two properties:
   - `config` - configuration for the generation of the nodes and edges
   - `args` - contains the `file` and other arguments for recursion

### 2. GraphDrawerAlternative.js

1. `GraphDrawerAlternative.js` is the alternative version of `GraphDrawer` class, but it is not in use.

### 3. GraphDrawerCallbacks.js

1. Contains functions that are used to bind callbacks so it is possible to override the default behaviour.

### 4. GraphDrawerColoring.js

1. Contains two functions:
   - `randowHSL` - used to color the nodes and edges of the graph
   - `registerPropetyColor` - used to check if a property is already colored, if not it will generate a new color for the property

### 5. GraphDrawerHelper.js

1. Contains functions that are used to help with the generation of the nodes and edges in GraphDrawer.js

## GraphTool folder

### 1. GraphTool.js

1. `GraphTool` class is used to generate the graph from given nodes and edges.
2. It has three properties:
   - `divId` - is the id of the div that will contain the graph
   - `config` - JSON config for the graph
   - `callbackConfig` - contains the callbacks for the graph
3. It has a function `expandNodes` that is used to expand the nodes of the graph.

### 2. GraphToolAlgorithms.js

1. Contains functions that are used to get paths between nodes.
2. Contains a function to delete nodes from the graph.

### 3. GraphToolColoring.js

1. Contains ColorByValue functionality for the graph.
2. Contains functions that are used for coloring the nodes and edges of the graph while using the search functionality.

### 4. GraphToolContainers.js

1. Contains functions that are used to generate the containers for the graph.

### 5. GraphToolContextMenus.js

1. 

### 6. GraphToolCopyPaste.js

1. Contains functions that are used to copy and paste nodes of the graph.

### 7. GraphToolDeepSearch.js

1. Contains functions that are used for deep search functionality. 

### 8. GraphToolDragDrop.js

1. 

### 9. GraphToolEventListeners.js

1. Contains functions that are used to bind key event listeners and container event listeners.

### 10. GraphToolHelper.js

1. Contains helper functions of the GraphTool class.

### 11. GraphToolLegend.js

1. Contains functions that are used to generate the legend and its functionality.

### 12. GraphToolLoadSave.js

1. Contains functions that are used to load and save the graph.

### 13. GraphToolManipulation.js

1. Contains functions that are used for the manipulation functionality of the graph.

### 14. GraphToolVisjsEvents.js

1. Contains functions that are used to override the default visjs events.

### 15. GraphToolVisualSearch.js

1. Contains a function that generates the visual search ui.
2. Contains functions that are used to visually search the graph.
