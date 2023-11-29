const $ = require('jquery')
const GDHelper = require('../GraphDrawer/GraphDrawerHelper.js')
const GDColoring = require('../GraphDrawer/GraphDrawerColoring.js')
const utils = require('../utils.js')

function multipleEdgesToSameNode(nodeID){
    let edges = this.edges.get()
    let count = 0

    edges.forEach((edge) => {
        if(edge.to === nodeID){
            count++
        }
    })

    if(count > 1){
        return true
    }else{
        return false
    }
}

//Add Node popup
function editNode(data, cancelAction, callback, mainObject){
    var newNodeActive = true
    document.getElementById("node_checkbox").addEventListener("click", function () {
        if (document.getElementById("node_checkbox").checked) {
            $('#node-type').removeAttr('disabled');
        } else {
            $('#node-type').prop('disabled', true);
        }
    })
    document.getElementById("node-label").value = data.label;
    document.getElementById("node-saveButton").onclick = saveNodeData.bind(
        mainObject,
        data,
        callback
    )
    document.getElementById("node-cancelButton").onclick = cancelAction.bind(
        mainObject,
        callback
    )
    //document.getElementById("node-popUp")
    $('canvas').on('click', function(e) {
        if (newNodeActive === true) {
            $("#manipulation_div").css({
                display: "block"
            })
            $("#node-popUp").css({
                top: e.pageY + "px",
                left: e.pageX + "px",
                display: "block",
                position: "absolute"
            })
        }
        newNodeActive = false;
    })
}

//addEdge popup
function editEdgeWithoutDrag(data, callback, newThis){
    var newEdgeActive = true;
    // filling in the popup DOM elements
    document.getElementById("edge-label").value = data.label;
    
    document.getElementById("edge-saveButton").onclick = saveEdgeData.bind(
        newThis,
        data,
        callback
    );
    document.getElementById("edge-cancelButton").onclick = cancelEdgeEdit.bind(
        newThis,
        callback
    );
    $('canvas').on('click', function(e) {
        if (newEdgeActive === true) {
            $("#manipulation_div").css({
                display: "block"
            })
            $("#edge-popUp").css({
                top: e.pageY + "px",
                left: e.pageX + "px",
                display: "block",
                position: "absolute"
            });
        }
        newEdgeActive = false;
    });
    //document.getElementById("edge-popUp").style.display = "block";
}

function saveEdgeData(data, callback) {
    data.label = document.getElementById("edge-label").value;
    document.getElementById("edge-label").value = "";
    clearEdgePopUp();
    data = addPropertyToJSON(data, this)
    console.log(this.dataFile.jsondata)
    //this.nodes.get(data.to).id = data.nodeID
    callback(data);
    if(data !== null){
        this.nodes.update(this.nodes.get(data.to))
    }
    this.createLegend()
    if(data !== null){
        if(this.nodes.get(data.to).manuallyAdded === true){
            let newId = data.nodeID
            let oldNode = JSON.parse(JSON.stringify(this.nodes.get(data.to)))
            oldNode.id = newId
            this.nodes.remove(data.to)
            this.nodes.update(oldNode)
            let oldEdge = JSON.parse(JSON.stringify(this.edges.get(data.id)))
            oldEdge.to = newId
            this.edges.remove(data.id)
            this.edges.update(oldEdge)
        }
        delete data.nodeID
    }

    // if((this.nodes.get(data.to).path.length === 2 && this.nodes.get(data.to).key === undefined) || this.nodes.get(data.to).manuallyAdded === true ){}

    this.options.manipulation.enabled = !this.options.manipulation.enabled
    this.options.manipulation.initiallyActive = !this.options.manipulation.initiallyActive
    this.network.setOptions(this.options)


}

function setEdgeColor(data, mainObject){

    if(mainObject.drawer.colorObj[data.label] !== undefined){
        data.group = data.label
        data.color = mainObject.drawer.colorObj[data.label]
    }

    if(mainObject.drawer.colorObj[data.label] === undefined){

        mainObject.drawer.colorObj[data.label] = GDColoring.randomHSL()
        data.group = data.label
        data.color = mainObject.drawer.colorObj[data.label]
    }

    return data
}

function createFullContextAndSetEdgeKey(data, mainObject, combine){

    for(let key in mainObject.dataFile.jsonschema){

        let context = GDHelper.getSchemaContextRecursive(mainObject.dataFile, key, [])

        for(let i = 0; i < context.length; i++){
            combine = {...combine, ...context[i]}
        }
    }
    
    for(let key in combine){

        if((combine[key]["@id"] !== undefined && combine[key]["@id"].split(":")[1] === data.label)){

            data.objectKey = key

        }

        if(combine[key]["@id"] === undefined && combine[key].split(":")[1] === data.label){

            data.objectKey = key

        }
    }
    data.context = combine
    return data
}

function addPropertyToJSON(data, mainObject){

    // set edge id
    data.id = data.from + "=" + data.label + "=>" + data.to

    // check if edge already exists
    if(mainObject.edges.get(data.id)){
        data = null
        return data
    }

    // set edge color and group
    data = setEdgeColor(data, mainObject)

    // set edge key
    let context= {}
    data = createFullContextAndSetEdgeKey(data, mainObject, context)
    context = data.context
    delete data.context

    let fromNode = mainObject.nodes.get(data.from)
    let finalPlace = mainObject.dataFile

    if(mainObject.nodes.get(data.from).manuallyAdded === true || mainObject.network.getConnectedEdges(data.to).length > 0){
        data = null
        return data
    }

    
    // go down the "from" nodes path to add the new node to the correct place in the JSON
    for (let i = 0; i < fromNode.path.length; i++) {
        finalPlace = finalPlace[fromNode.path[i]]
      }
    
    if (typeof finalPlace === 'string' && mainObject.dataFile[fromNode.path[fromNode.path.length - 1]] === undefined || mainObject.nodes.get(data.from).manuallyAdded === true) {
        data = null
        return data
    }

    if(mainObject.nodes.get(data.to).path === undefined){
        mainObject.nodes.get(data.to).path = ""
    }
// finalPlace is the object where the new node will be added to the JSON    
//key is in context
    if(data.objectKey){
        // key is in context and is not in finalPlace
        if(finalPlace[data.objectKey] === undefined){
            if(mainObject.nodes.get(data.to).path.length === 2){
                finalPlace[data.objectKey] = [mainObject.nodes.get(data.to).path[1]]
            }else if(mainObject.nodes.get(data.to).manuallyAdded === true){
                finalPlace[data.objectKey] = [mainObject.nodes.get(data.to).label]
                data.nodeID = mainObject.nodes.get(data.from).id + "/" + data.objectKey
            }else{
                data = null
                return data
            }
        }else{// key is in context and is in finalPlace
            // key is in context and is in finalPlace and is an array
            if(Array.isArray(finalPlace[data.objectKey])){
                if(mainObject.nodes.get(data.to).path.length === 2){
                    finalPlace[data.objectKey].push(mainObject.nodes.get(data.to).path[1])
                }else if(mainObject.nodes.get(data.to).manuallyAdded === true){
                    finalPlace[data.objectKey].push(mainObject.nodes.get(data.to).label)
                    data.nodeID = mainObject.nodes.get(data.from).id + "/" + data.objectKey + "/" + finalPlace[data.objectKey].length-1
                }else{
                    data = null
                    return data
                }
            }else{ // key is in context and is in finalPlace and is not an array 
                if(mainObject.nodes.get(data.to).path.length === 2){
                    finalPlace[data.objectKey] = [finalPlace[data.objectKey],mainObject.nodes.get(data.to).path[1]]
                }else if(mainObject.nodes.get(data.to).manuallyAdded === true){
                    finalPlace[data.objectKey] = [finalPlace[data.objectKey],mainObject.nodes.get(data.to).label]
                    data.nodeID = mainObject.nodes.get(data.from).id + "/" + data.objectKey + "/" + finalPlace[data.objectKey].length-1
                }else{
                    data = null
                    return data
                }
            }
        }
        
    }else{//key is not in context

        // key is not in context so it gets added as statements
        // statements exists
        if(finalPlace['statements']){
            if(mainObject.nodes.get(data.to).path.length === 2){
                finalPlace['statements'].push({
                    "uuid": utils.uuidv4(),
                    "predicate": data.label,
                    "object": mainObject.nodes.get(data.to).path[1]
                })
            }else if(mainObject.nodes.get(data.to).manuallyAdded === true){
                finalPlace['statements'].push({
                    "uuid": utils.uuidv4(),
                    "predicate": data.label,
                    "object": mainObject.nodes.get(data.to).label
                })

               data.nodeID = mainObject.nodes.get(data.from).id + "/" + data.label + "/" + finalPlace["statements"].length-1
            }else{
                data = null
                return data
            }
        }else{
            // statements does not exist
            finalPlace['statements'] = []
            if(mainObject.nodes.get(data.to).path.length === 2){
                finalPlace['statements'].push({
                    "uuid": utils.uuidv4(),
                    "predicate": data.label,
                    "object": mainObject.nodes.get(data.to).path[1]
                })
            }else if(mainObject.nodes.get(data.to).manuallyAdded === true){
                finalPlace['statements'].push({
                    "uuid": utils.uuidv4(),
                    "predicate": data.label,
                    "object": mainObject.nodes.get(data.to).label
                })
               data.nodeID = mainObject.nodes.get(data.from).id + "/" + data.label
            }else{
                data = null
                return data
            }

        }

    }

    if(mainObject.nodes.get(data.to).incomingLabels){
        let node = mainObject.nodes.get(data.to)

        node.incomingLabels.push(data.label)

    }


    // inherit keys from edge to node
    if(mainObject.nodes.get(data.to).key === undefined){


        let node = mainObject.nodes.get(data.to)

        node.key = data.objectKey
        node.item = mainObject.nodes.get(data.from).item
        let incomingLabels = [data.label]

        mainObject.edges.forEach((edge) => {
            if(edge.to === node.id){
                incomingLabels.push(edge.label)
            }
        })

        node.incomingLabels = incomingLabels

        node.context = context

        node.depth = mainObject.nodes.get(data.from).depth + 1

        let item = mainObject.nodes.get(data.from).item
        let depth = mainObject.nodes.get(data.from).depth + 1

        node.depthObject = {}
        node.depthObject[""+item] = depth

        node.color = data.color

        node.group = data.group

        if(mainObject.nodes.get(data.to).path === ""){
            node.path = mainObject.nodes.get(data.from).path
        }
    }

    return data

}

function clearEdgePopUp() {
    document.getElementById("edge-saveButton").onclick = null;
    document.getElementById("edge-cancelButton").onclick = null;
    document.getElementById("edge-popUp").style.display = "none";
}

function cancelEdgeEdit(callback) {
    clearEdgePopUp();
    callback(null);
    this.options.manipulation.enabled = !this.options.manipulation.enabled
    this.options.manipulation.initiallyActive = !this.options.manipulation.initiallyActive
    this.network.setOptions(this.options)
}

function initPopUpHTML() {
                    //HTML for the manipulation popups
                var editHtml = '' +
                    '<div id="node-popUp" style="display:none;">' +
                    '  <span id="node-operation" style="cursor: move;">node</span> <br />' +
                    '  <table style="margin: auto">' +
                    '    <tbody>' +
                    '      <tr>' +
                    '        <td>label</td>' +
                    '      </tr>' +
                    '      <tr>' +
                    '        <td><input id="node-label" value="" /></td>' +
                    '      </tr>' +
                    '      <tr>' +
                    '        <td><input type="checkbox" id="node_checkbox"><label>Object</label></td>'+
                    '      </tr>' +
                    '      <tr>' +
                    '        <td>type</td>' +
                    '      </tr>' +
                    '      <tr>' +
                    '        <td><input id="node-type" value="" /></td>' +
                    '      </tr>' +
                    '    </tbody>' +
                    '  </table>' +
                    '  <input type="button" value="save" id="node-saveButton" />' +
                    '  <input type="button" value="cancel" id="node-cancelButton" />' +
                    '</div>' +
                    '' +
                    '<div id="edge-popUp" style="display:none;">' +
                    '  <span id="edge-operation" style="cursor: move;">edge</span> <br />' +
                    '  <table style="margin: auto">' +
                    '    <tbody>' +
                    '      <tr>' +
                    '        <td>label</td>' +
                    '        <td><input id="edge-label" value="" /></td>' +
                    '      </tr>' +
                    '    </tbody>' +
                    '  </table>' +
                    '  <input type="button" value="save" id="edge-saveButton" />' +
                    '  <input type="button" value="cancel" id="edge-cancelButton" />' +
                    '</div>' +
                    '';
                var editHtmlDiv = document.createElement("div")
                editHtmlDiv.style.display = "none"
                editHtmlDiv.id = "manipulation_div"
                editHtmlDiv.innerHTML = editHtml
                document.body.appendChild(editHtmlDiv)
}

function clearNodePopUp() {
    document.getElementById("node-saveButton").onclick = null;
    document.getElementById("node-cancelButton").onclick = null;
    document.getElementById("node-popUp").style.display = "none";
    document.getElementById("node_checkbox").checked = false
    if(this){
        this.options.manipulation.enabled = !this.options.manipulation.enabled
        this.options.manipulation.initiallyActive = !this.options.manipulation.initiallyActive
        this.network.setOptions(this.options)
    }
}


function saveNodeData(data, callback){

    
    data = addItemToJSON(data, this)

    document.getElementById("node-label").value = ""
    document.getElementById("node-type").value = ""
    clearNodePopUp()
    callback(data)

    this.options.manipulation.enabled = !this.options.manipulation.enabled
    this.options.manipulation.initiallyActive = !this.options.manipulation.initiallyActive
    this.network.setOptions(this.options)

    //  this.network.addEdgeMode();
}

function addItemToJSON(data, mainObject){

    data.label = document.getElementById("node-label").value;
    data.hidden = false;
    data.physics = false;

    if(document.getElementById("node_checkbox").checked){

        let uuid = utils.uuidv4()

        data.id = "jsondata/Item:" + uuid // + document.getElementById("node-label").value.replace(" ", ""); // uuid?
        data.type = document.getElementById("node-type").value;
        data.path = ["jsondata", "Item:" + uuid] //+ document.getElementById("node-label").value.replace(" ", "")]

    mainObject.dataFile.jsondata["Item:" + uuid /*data.label.replace(' ', '')*/] = {
            "type": [data.type],
            "label": [{"text": data.label, "lang": "en"}]
        }

    }else{
        data.manuallyAdded = true
    }

    return data

}

//function to make the manipulation popups draggable
function dragElement(elmnt) {
    var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    if (document.getElementById(elmnt.id)) {
        // if present, the header is where you move the DIV from:
        document.getElementById("node-operation").onmousedown = dragMouseDown;
        document.getElementById("edge-operation").onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function setManipulationOptions(data){
    this.options.manipulation.deleteNode = function(data, callback) {

        data.edges.forEach((edge) => {
            this.edges.remove(edge)
        })

        let nodeGroup = this.nodes.get(data.nodes[0]).group

        this.deleteSelectedNode(data, callback)

        this.deleteOptionsGroup(nodeGroup)
        
        if(this.options.groups[nodeGroup] === undefined){
            delete this.drawer.colorObj[nodeGroup]
            this.createLegend()
        }

    }.bind(this)

    this.options.manipulation.deleteEdge = function(data, callback) {
        let edge = this.edges.get(data.edges[0])

        let node = this.nodes.get(edge.to)

        if(node.group !== "root" && !this.multipleEdgesToSameNode(node.id)){

            let nodeGroup = node.group

            this.deleteSelectedNode({nodes: [node.id]}, callback)

            this.deleteOptionsGroup(nodeGroup)
            
            if(this.options.groups[nodeGroup] === undefined){
                delete this.drawer.colorObj[nodeGroup]
                this.createLegend()
            }

        }

        this.edges.remove(data.edges[0])

        // deleteSelectedEdge(data, callback)
    }.bind(this)

    this.options.manipulation.addNode = function(data, callback) {
        // filling in the popup DOM elements
        document.getElementById("node-operation").innerText = "Add Node";
        dragElement(document.getElementById("node-popUp"));
        editNode(data, clearNodePopUp, callback, this);
    }.bind(this)

    this.options.manipulation.addEdge =  function(data, callback) {

        if (data.from == data.to) {
            var r = confirm("Do you want to connect the node to itself?");
            if (r != true) {
                callback(null);
                return;
            }
        }
        document.getElementById("edge-operation").innerText = "Add Edge";
        dragElement(document.getElementById("edge-popUp"));
        editEdgeWithoutDrag(data, callback, this);
        // this.createLegend()

    }.bind(this)


}

function deleteSelectedNode(data, callback) {
    this.deleteNodesChildren(data.nodes[0]);
    this.nodes.remove(data.nodes[0]);

    // for (var i = 0; i < contextCreatedProps.length; i++) {
    //     var noNodesInNetwork = true;
    //     for (var j = 0; j < nodes.getIds().length; j++) {
    //         if (contextCreatedProps[i] == nodes.get(nodes.getIds()[j]).group) {
    //             noNodesInNetwork = false;
    //         }
    //     }
    //     if (noNodesInNetwork === true) {
    //         givenDiv.querySelector('#' + contextCreatedProps[i]).remove();
    //         contextCreatedProps.splice(contextCreatedProps.indexOf(contextCreatedProps[i]), 1);
    //         i--;
    //     }
    // }

    // delete oldGroups["" + data.nodes[0]];
    // delete objClickedProps["" + data.nodes[0]];
    callback();
    this.createLegend();
    // document.querySelector('.vis-delete').remove();
    // editDeletedNodes["" + data.nodes[0]] = "";
    // delete newNodes["" + data.nodes[0]];
    // delete editNodes["" + data.nodes[0]];
    // // create_link();
}

function deleteInJson(data, obj){

    for(let i = 0; i < data.edges.length; i++){
        let finalPlace = this.dataFile
        let fromNode = this.nodes.get(this.edges.get(data.edges[i]).from)

        for (let i = 0; i < fromNode.path.length; i++) {
            finalPlace = finalPlace[fromNode.path[i]]
          }

        let key = this.edges.get(data.edges[i]).objectKey

        if(Array.isArray(finalPlace[key])){
            finalPlace[key].splice(finalPlace[key].indexOf(this.edges.get(data.edges[i]).label), 1)
            if(finalPlace[key].length === 0){
                delete finalPlace[key]
            }
        }
        if(!Array.isArray(finalPlace[key])){
            delete finalPlace[key]
        }

    }

}

export{
    setManipulationOptions,
    deleteSelectedNode,
    multipleEdgesToSameNode,
    editNode,
    initPopUpHTML,
    saveNodeData,
    addItemToJSON,
    deleteInJson
}