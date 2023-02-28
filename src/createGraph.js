const utils = require("./utils.js")

class drawGraph{

    constructor(config, file, depth, mode, nodes, edges){

      const defaultConfig = {
        callbacks: {
          setColor: (data) => this.setColorDefault(data) //default: use class methode
        }
      };

      this.config = utils.mergeDeep(defaultConfig, config);

      this.file = file;
      this.depth = depth;
      this.mode = mode;
      this.id = 0;
      this.nodes = nodes;
      this.edges = edges;
      this.lang = "en";
      this.first = true;
      this.oldStartItem;
      this.baseRootId;
      this.colorObj = {};
      this.h = Math.random();
      this.golden = 0.618033988749895;
      this.createGraphNE(file,false,false,false,false, depth, mode);
    }


    

    randomHSL = () => {
        
        this.h += this.golden;
        this.h %= 1;
        return "hsla(" + (360 * this.h) + "," +
            "70%," +
            "80%,1)";
    }

    
    
    getStartItem(file){
        console.log(this.h)
      let items = Object.keys(file.jsondata);
      let startCounter = 0
      let output = []
    
      for (let i =  0 ;i < items.length;i++) {
    
        if("start" in file.jsondata[items[i]]){
    
          output.push(items[i]);
          startCounter++;
        }
        
      }
      if(output.length == 1){
        return output[0];
      }else{
        return false;
      }
    }
  
    contextRecursion(file, schema, fullContext = []){
      fullContext = fullContext;
    
      let startContext = file.jsonschema[schema]["@context"];
    
      if(Array.isArray(startContext)){
        for(let i = 0; i < startContext.length; i++){
    
          
          if(!(typeof startContext[i] === 'object' && startContext[i] !== null)){
            this.contextRecursion(file, startContext[i], fullContext);
          }
          else{
            fullContext.push(startContext[i]);
          }
        }
      }else{
        fullContext.push(startContext);
      }
    return fullContext;
    }
  
    nodeExists(nodes, item){
      let exists = false;
      for (let index = 0; index < nodes.length; index++) {
        if(nodes[index].object && nodes[index].object == item){
          exists = index;
        }
        
      }
      return exists;
    }
    
    // default methode if not overwritten by the user
    setColorDefault(data){

        let property = data.property;

        for(let x in  this.colorObj){
            if(property == x){
                
                return this.colorObj[x];
            }
        }
        this.colorObj[property] = this.randomHSL();

        return this.colorObj[property];
    }

    // set the color via callback. Defaults to setColorDefault
    setColor(property) {
      let data = {graph: this, property: property};
      return this.config.callbacks.setColor(data);
    }
  
  
    createGraphNE(file, lastId, item, oldContext, lastDepth, givenDepth, mode){
   
      let startItem;
      let label;
      let rootId;
      let startContext;
      let objKeys;
      let depth;
      let color;

      
      if(!item && !lastId){
    
        startItem = this.getStartItem(file);
    
        let labelArray = file.jsondata[startItem].label;
    
        for(let i = 0; i < labelArray.length; i++){
    
          if(labelArray[i].lang == this.lang){
            label = labelArray[i].text;
          }
    
        }

        
        this.nodes.push({id: this.id, label: label, color: '#6dbfa9', depth: 0});
        rootId = this.id;
        this.baseRootId = rootId;
        this.id++;
        depth = 1;
    
        startContext = this.createContext(file, startItem);
        objKeys = Object.keys(file.jsondata[startItem]);
    
      }else if(oldContext){
        startItem = item;
        startContext = oldContext;
        objKeys = Object.keys(file.jsondata[startItem]);
        rootId = lastId;
        depth = lastDepth;
    
    
      }else{
        
        startItem = item;
        
    
        let labelArray = file.jsondata[startItem].label;
    
        for(let i = 0; i < labelArray.length; i++){
    
          if(labelArray[i].lang == this.lang){
            label = labelArray[i].text;
          }
    
        }
        rootId = lastId;
        this.id++;
        depth = lastDepth;
    
    
        startContext = this.createContext(file, startItem);
        objKeys = Object.keys(file.jsondata[startItem]);
      }
    
    
    
      
      
    
      for(let i = 0; i < objKeys.length; i++){

    
        if(objKeys[i] != "type" && objKeys[i] != "label" && objKeys[i] != "start" && (depth <= givenDepth || !givenDepth)){
          
          if(objKeys[i] in startContext && startContext[objKeys[i]]["@type"] == "@id"){
            color = this.setColor(startContext[objKeys[i]]["@id"])
          }else if(startContext[objKeys[i]]){
            color = this.setColor(startContext[objKeys[i]])
          }else{
            color = this.setColor(objKeys[i])
          }
    
    
          if(objKeys[i] in startContext && startContext[objKeys[i]]["@type"] == "@id" && Array.isArray(file.jsondata[startItem][objKeys[i]]) && typeof file.jsondata[startItem][objKeys[i]][0] === 'object' && file.jsondata[startItem][objKeys[i]][0] !== null){
    
            // nodes.push({id:id, label: objKeys[i]});
            // edges.push({from: rootId, to: id, label: startContext[objKeys[i]]["@id"]});
            // id++;
    
            //file.jsondata[objKeys[i]] = file.jsondata[startItem][objKeys[i]][0];
            
            
            for(let j =  0; j < file.jsondata[startItem][objKeys[i]].length; j++){
    
              file.jsondata[objKeys[i]+""+j] = file.jsondata[startItem][objKeys[i]][j];
    
              if(this.nodeExists(this.nodes, objKeys[i]+""+j)){
    
                if(file.jsondata[startContext[objKeys[i]]["@id"]]){
                    //color = this.setColor(startContext[objKeys[i]]["@id"])
                  for(let k = 0; k < file.jsondata[startContext[objKeys[i]]["@id"]]["label"].length; k++){
                    if(file.jsondata[startContext[objKeys[i]]["@id"]]["label"][k].lang == this.lang){
                      this.edges.push({from: rootId, to: this.nodes[this.nodeExists(this.nodes, objKeys[i]+""+j)].id, label: file.jsondata[startContext[objKeys[i]]["@id"]]["label"][k].text, color:color});
                      //console.log(file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text)
                    }
                    
                  }
    
                  
                }else{
                    //color = this.setColor(startContext[objKeys[i]]["@id"])
                  let edgeLabel = startContext[objKeys[i]]["@id"].replace("Property:", "");
    
    
                  this.edges.push({from: rootId, to: this.nodes[this.nodeExists(this.nodes, objKeys[i]+""+j)].id, label: edgeLabel, color:color});
    
                }
    
                
    
              }else{

                //color = this.setColor(startContext[objKeys[i]]["@id"])
    
                this.nodes.push({id:this.id, label: objKeys[i], object: objKeys[i]+""+j, context: startContext, depth: depth, color: color});

                
    
                if(file.jsondata[startContext[objKeys[i]]["@id"]]){
                  for(let j = 0; j < file.jsondata[startContext[objKeys[i]]["@id"]]["label"].length; j++){
                    if(file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].lang == this.lang){
                      this.edges.push({from: rootId, to: this.id, label: file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text, color: color});
                      //console.log(file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text)
                    }
                    
                  }
    
                  
                }else{
                  let edgeLabel = startContext[objKeys[i]]["@id"].replace("Property:", "");
    
    
                  this.edges.push({from: rootId, to: this.id, label: edgeLabel, color:color});
    
                }
                  //edges.push({from: rootId, to: id, label: startContext[objKeys[i]]["@id"]});
              }
    
              
              //let obj = nodes.find(o => o.label === ''+objKeys[i]+""+j);
              //rootId = obj.id;
              //let oldId = obj.id;
              let oldId = this.id;
              this.id++;
    
              
              
              
              this.createGraphNE(file, oldId, objKeys[i]+""+j, startContext, depth+1, givenDepth);
    
    
            }
    
    
    
            
            //recursions
            //objekt im objekt
            //console.log(file.jsondata[startItem][objKeys[i]], objKeys[i])
          }else if(objKeys[i] in startContext && startContext[objKeys[i]]["@type"] == "@id" && Array.isArray(file.jsondata[startItem][objKeys[i]]) && !(typeof file.jsondata[startItem][objKeys[i]][0] === 'object' && file.jsondata[startItem][objKeys[i]][0] !== null)){
            //console.log(file.jsondata[startItem][objKeys[i]]);
            
            let rememberArray = file.jsondata[startItem][objKeys[i]];
    
            file.jsondata[startItem][objKeys[i]] = "";
    
    
            for(let j = 0; j < rememberArray.length; j++){
    
              let labelArray = file.jsondata[rememberArray[j]].label;
    
              for(let i = 0; i < labelArray.length; i++){
    
                if(labelArray[i].lang == this.lang){
                  label = labelArray[i].text;
                }
    
              }
              if(this.nodeExists(this.nodes, rememberArray[j])){
    
                      
    
                if(file.jsondata[startContext[objKeys[i]]["@id"]]){
                    //color = this.setColor(startContext[objKeys[i]]["@id"], this.colorObj)
                  for(let k = 0; k < file.jsondata[startContext[objKeys[i]]["@id"]]["label"].length; k++){
    
                    if(file.jsondata[startContext[objKeys[i]]["@id"]]["label"][k].lang == this.lang){
                      
                     this.edges.push({from: rootId, to: this.nodes[this.nodeExists(this.nodes, rememberArray[j])].id, label: file.jsondata[startContext[objKeys[i]]["@id"]]["label"][k].text, color:color});
                      //console.log(file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text)
                    }
                    
                  }
    
                  
                }else{
                    //color = this.setColor(startContext[objKeys[i]]["@id"], this.colorObj)
                  let edgeLabel = startContext[objKeys[i]]["@id"].replace("Property:", "");
     
                  
                  this.edges.push({from: rootId, to: this.nodes[this.nodeExists(this.nodes, rememberArray[j])].id, label: edgeLabel, color:color});
    
                }
    
              }else{

                //color = this.setColor(startContext[objKeys[i]]["@id"], this.colorObj)

                this.nodes.push({id:this.id, label:label, object: rememberArray[j], depth: depth, color: color});
    
                if(file.jsondata[startContext[objKeys[i]]["@id"]]){
                  for(let j = 0; j < file.jsondata[startContext[objKeys[i]]["@id"]]["label"].length; j++){
                    if(file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].lang == this.lang){
                      this.edges.push({from: rootId, to: this.id, label: file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text, color: color});
                      //console.log(file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text)
                    }
                    
                  }
    
                  
                }else{
                  let edgeLabel = startContext[objKeys[i]]["@id"].replace("Property:", "");
                  
    
                  this.edges.push({from: rootId, to: this.id, label: edgeLabel, color: color});
    
                }
                this.createGraphNE(file, this.id, rememberArray[j], false, depth+1, givenDepth);
              }
              this.id++; //new maybe wrong
              
    
              /////////////////////////////////createGraphNE(file, id, rememberArray[j]);
    
            }
            file.jsondata[startItem][objKeys[i]] = rememberArray;
            //console.log(file.jsondata[startItem][objKeys[i]])
            //item array
            
          }else if(objKeys[i] in startContext && startContext[objKeys[i]]["@type"] == "@id" && !(Array.isArray(file.jsondata[startItem][objKeys[i]])) && !(typeof file.jsondata[startItem][objKeys[i]][0] === 'object' && file.jsondata[startItem][objKeys[i]][0] !== null)){
    
    
            let labelArray = file.jsondata[file.jsondata[startItem][objKeys[i]]].label;
    
            for(let i = 0; i < labelArray.length; i++){
    
              if(labelArray[i].lang == this.lang){
                label = labelArray[i].text;
              }
    
            }
    
            if(this.nodeExists(this.nodes, file.jsondata[startItem][objKeys[i]])){
                //color = this.setColor(startContext[objKeys[i]]["@id"], this.colorObj)
              if(file.jsondata[startContext[objKeys[i]]["@id"]]){
                for(let k = 0; k < file.jsondata[startContext[objKeys[i]]["@id"]]["label"].length; k++){
                  if(file.jsondata[startContext[objKeys[i]]["@id"]]["label"][k].lang == this.lang){
                    this.edges.push({from: rootId, to: this.nodes[this.nodeExists(this.nodes, file.jsondata[startItem][objKeys[i]])].id, label: file.jsondata[startContext[objKeys[i]]["@id"]]["label"][k].text, color:color});
                    //console.log(file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text)
                  }
                  
                }
    
                
              }else{

                //color = this.setColor(startContext[objKeys[i]]["@id"], this.colorObj)
                let edgeLabel = startContext[objKeys[i]]["@id"].replace("Property:", "");
    
    
                this.edges.push({from: rootId, to: this.nodes[this.nodeExists(this.nodes, file.jsondata[startItem][objKeys[i]])].id, label: edgeLabel, color:color});
    
              }
    
    
    
            }else{

                //color = this.setColor(startContext[objKeys[i]]["@id"], this.colorObj)
              this.nodes.push({id:this.id, label:label, object: file.jsondata[startItem][objKeys[i]], depth: depth, color:color});

                

              if(file.jsondata[startContext[objKeys[i]]["@id"]]){
                for(let j = 0; j < file.jsondata[startContext[objKeys[i]]["@id"]]["label"].length; j++){
                  if(file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].lang == this.lang){
                    this.edges.push({from: rootId, to: this.id, label: file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text, color:color});
                    //console.log(file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text)
                  }
                  
                }
    
                
              }else{
                let edgeLabel = startContext[objKeys[i]]["@id"].replace("Property:", "");
    
                this.edges.push({from: rootId, to: this.id, label: edgeLabel, color:color});
    
              }
              this.createGraphNE(file, this.id, file.jsondata[startItem][objKeys[i]], false, depth+1, givenDepth);
            }
            //edges.push({from: rootId, to: id, label: startContext[objKeys[i]]["@id"]});
    
            ///////////////////////////////createGraphNE(file, id, file.jsondata[startItem][objKeys[i]]);
            
            //console.log(file.jsondata[startItem][objKeys[i]])
            //item literal
    
          }else if(objKeys[i] in startContext && mode){

            //color = this.setColor(startContext[objKeys[i]]["@id"], this.colorObj)
    
            this.nodes.push({id:this.id, label: file.jsondata[startItem][objKeys[i]], depth: depth, color: color});
    
            if(file.jsondata[startContext[objKeys[i]]]){
              
              for(let j = 0; j < file.jsondata[startContext[objKeys[i]]]["label"].length; j++){
                if(file.jsondata[startContext[objKeys[i]]]["label"][j].lang == this.lang){
                  this.edges.push({from: rootId, to: this.id, label: file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text, color: color});
                  //console.log(file.jsondata[startContext[objKeys[i]]["@id"]]["label"][j].text)
                }
                
              }
    
              
            }else{
              let edgeLabel = startContext[objKeys[i]].replace("Property:", "");
    
    
              this.edges.push({from: rootId, to: this.id, label: edgeLabel, color: color});
    
            }
    
            //edges.push({from: rootId, to: id, label: startContext[objKeys[i]]});
            this.id++;
            //console.log(file.jsondata[startItem][objKeys[i]])
            //literal
    
          }else{
            if(mode){

                //color = this.setColor(startContext[objKeys[i]]["@id"], this.colorObj)
            this.nodes.push({id:this.id, label: file.jsondata[startItem][objKeys[i]], depth: depth, color: color});       
            
            this.edges.push({from: rootId, to: this.id, label: objKeys[i], color: color});
            this.id++;
            //console.log(file.jsondata[startItem][objKeys[i]])
            //not in context
            }
          }
    
          //console.log(file.jsondata[startItem][objKeys[i]])
        }
      }
    
      
      
      //startItem = oldStrtItm;
    
      //console.log(nodes);
      //console.log(edges);
      return startContext;
    }
  
    createContext(file, item){
  
      let itemSchema = file.jsondata[item].type[0];
    
      let contextArrayOfObjects = this.contextRecursion(file, itemSchema);
      
      
      let context = {};
    
      for(let i = 0; i<contextArrayOfObjects.length;i++){
    
        let partContextKeys = Object.keys(contextArrayOfObjects[i]);
    
        for(let j = 0;j<partContextKeys.length;j++){
          
          context[partContextKeys[j]] = contextArrayOfObjects[i][partContextKeys[j]];
        }
      }
    
      return context;
    }
  
  }

export {
    drawGraph
}