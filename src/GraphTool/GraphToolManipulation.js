const $ = require('jquery')

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
        this,
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
function editEdgeWithoutDrag(data, callback){
    var newEdgeActive = true;
    // filling in the popup DOM elements
    document.getElementById("edge-label").value = data.label;
    
    document.getElementById("edge-saveButton").onclick = saveEdgeData.bind(
        this,
        data,
        callback
    );
    document.getElementById("edge-cancelButton").onclick = cancelEdgeEdit.bind(
        this,
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
    callback(data);

}

function clearEdgePopUp() {
    document.getElementById("edge-saveButton").onclick = null;
    document.getElementById("edge-cancelButton").onclick = null;
    document.getElementById("edge-popUp").style.display = "none";
}

function cancelEdgeEdit(callback) {
    clearEdgePopUp();
    callback(null);
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
}

function saveNodeData(data, callback){

    if(document.getElementById("node_checkbox").checked){
        data = addItemToJSON(data, this)
    }

    document.getElementById("node-label").value = ""
    document.getElementById("node-type").value = ""
    clearNodePopUp()
    callback(data)

    //  this.network.addEdgeMode();
}

function addItemToJSON(data, mainObject){

    data.label = document.getElementById("node-label").value;
    data.id = document.getElementById("node-label").value; // uuid?
    data.type = document.getElementById("node-type").value;
    data.hidden = false;
    data.physics = false;

    mainObject.dataFile.jsondata["Item:" + data.label.replace(' ', '')] = {
        "type": [data.type],
        "label": [{"text": data.label, "lang": "en"}]
    }


    console.log(mainObject.dataFile.jsondata)
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
        console.log(data)
        if (data.from == data.to) {
            var r = confirm("Do you want to connect the node to itself?");
            if (r != true) {
                callback(null);
                return;
            }
        }
        document.getElementById("edge-operation").innerText = "Add Edge";
        dragElement(document.getElementById("edge-popUp"));
        editEdgeWithoutDrag(data, callback);
    }


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

export{
    setManipulationOptions,
    deleteSelectedNode,
    multipleEdgesToSameNode,
    editNode,
    initPopUpHTML,
    saveNodeData,
    addItemToJSON
}