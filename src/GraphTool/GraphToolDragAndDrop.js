function initDragAndDrop() {
    // drag & drop functionality
  
    var container = this.vis_container
    const handleDrop = (e) => {
  
      e.stopPropagation(); // Stops some browsers from redirecting
      e.preventDefault();
  
      var files = e.dataTransfer.files;
  
      for (let file of files) {
  
        // images 
        if (file.type === 'image/png' || file.type === 'image/jpeg') {
  
          this.imageToNode(file,this, e);
  
        }
  
        // csv files
        else if (file.type === 'application/vnd.ms-excel' && file.name.endsWith('.csv')) {
  
          this.csvToNode(file,this, e);
  
        }
  
        // mp4 files  (not working so far)
        else if (file.type === 'video/mp4') {
  
          this.videoToNode(file,this, e);
  
        } else {
          window.alert('File type ' + file.type + ' not supported');
        }
  
      }
  
    }
  
  }

  function imageToNode(file, currentGraphObject, dropEvent) {
  
    // add image node to network

    let xy = this.network.DOMtoCanvas({
      x: dropEvent.clientX,
      y: dropEvent.clientY
    })

    // read file 

    let reader = new FileReader(currentGraphObject);

    reader.onload = (event) => {

      // let newNode = new NodeClasses.ImageNode(currentGraphObject, utils.uuidv4(), xy.x, xy.y, event.target.result)

      // this.nodes.update(newNode)

    };

    reader.readAsDataURL(file)

}

function csvToNode(file, currentGraphObject, dropEvent) {
  
    // add csv node
    let xy = this.network.DOMtoCanvas({
      x: dropEvent.clientX,
      y: dropEvent.clientY
    })

    // read file 

    let reader = new FileReader(currentGraphObject);
    reader.onload = (event) => {

      // let newNode = new NodeClasses.CsvNode(currentGraphObject, utils.uuidv4(), xy.x, xy.y, event.target.result)

      // this.nodes.update(newNode)
    };
    reader.readAsText(file)

}

function videoToNode(file, currentGraphObject, dropEvent) {
  
    // add cameraNode node
    let xy = this.network.DOMtoCanvas({
      x: dropEvent.clientX,
      y: dropEvent.clientY
    })

    // read file 
    let reader = new FileReader(currentGraphObject);

    reader.onload = (event) => {

      // let newNode = new NodeClasses.VideoNode(currentGraphObject, utils.uuidv4(), xy.x, xy.y, reader.readAsDataURL(event.target.result))

      // this.nodes.update(newNode)
    };

    reader.readAsText(file)

}

  export{
    initDragAndDrop,
    imageToNode,
    csvToNode,
    videoToNode,
  }