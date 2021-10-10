const demosSection = document.getElementById('demos'),
		h6 = document.getElementById('h6'),
		imageContainers = document.getElementsByClassName('classifyOnClick'),
		flipButton = document.getElementById('flip-button'),
		imgHolder = document.getElementById("imgHolder"),
		imgUrl = document.getElementById("imgUrl"),
		imgAdder = document.getElementById("imgAdder"),
		stopButton = document.getElementById("stopButton"),
		downloadButton = document.getElementById("downloadButton");
		
var model = undefined ,
	pc=0,
	front = false;
// Set the backend to WASM and wait for the module to be ready.
tf.setBackend('webgl');
tf.ready().then(() => {

alert(tf.getBackend())

// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
cocoSsd.load().then(function (loadedModel) {
  model = loadedModel;
  // Show demo section now model is ready to use.
  demosSection.classList.remove('invisible');
});

});

flipButton.onclick = function() { front = !front; h6.innerHTML=front?"front":"back";};
	
	
imgAdder.onclick = function() {
imgHolder.innerHTML+=`<div class="classifyOnClick">
				    <img src="${imgUrl.value}" crossorigin="anonymous" />
					</div>`;
imgUrl.value="";
document.querySelector(".classifyOnClick:last-child img").addEventListener('click', handleClick);
};


// Now let's go through all of these and add a click event listener.
for (let i = 0; i < imageContainers.length; i++) {
  // Add event listener to the child element whichis the img element.
  imageContainers[i].children[0].addEventListener('click', handleClick);
}

// When an image is clicked, let's classify it and display results!
function handleClick(event) {
  if (!model) {
    console.log('Wait for model to load before clicking!');
    return;
  }
  
  // We can call model.classify as many times as we like with
  // different image data each time. This returns a promise
  // which we wait to complete and then call a function to
  // print out the results of the prediction.
  model.detect(event.target).then(function (predictions) {
    // Lets write the predictions to a new paragraph element and
    // add it to the DOM.
console.log(predictions)
    for (let n = 0; n < predictions.length; n++) {
const pre = document.createElement('pre');
pre.innerText = JSON.stringify( predictions[n] );
event.target.parentNode.appendChild(pre);
      // Description text
      const p = document.createElement('p');
      p.innerText = predictions[n].class  + ' - with ' 
          + Math.round(parseFloat(predictions[n].score) * 100) 
          + '% confidence.';
      // Positioned at the top left of the bounding box.
      // Height is whatever the text takes up.
      // Width subtracts text padding in CSS so fits perfectly.
      p.style = 'left: ' + predictions[n].bbox[0] + 'px;' + 
          'top: ' + predictions[n].bbox[1] + 'px; ' + 
          'width: ' + (predictions[n].bbox[2] - 10) + 'px;';

      const highlighter = document.createElement('div');
      highlighter.setAttribute('class', 'highlighter');
      highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px;' +
          'top: ' + predictions[n].bbox[1] + 'px;' +
          'width: ' + predictions[n].bbox[2] + 'px;' +
          'height: ' + predictions[n].bbox[3] + 'px;';

      event.target.parentNode.appendChild(highlighter);
      event.target.parentNode.appendChild(p);
    }
  });
}



/********************************************************************
// Demo 2: Continuously grab image from webcam stream and classify it.
********************************************************************/



const video = document.getElementById('webcam'),
		liveView = document.getElementById('liveView');

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia);
}

// Keep a reference of all the child elements we create
// so we can remove them easilly on each render.
var children = [];


// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  const enableWebcamButton = document.getElementById('webcamButton');
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}

var options;
if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
  options = {mimeType: 'video/webm; codecs=vp9'};
} else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
   options = {mimeType: 'video/webm; codecs=vp8'};
} 
// Enable the live webcam view and start classification.
function enableCam(event) {
  if (!model) {
    console.log('Wait! Model not loaded yet.')
    return;
  }
  
  // Hide the button.
  event.target.classList.add('removed');
  flipButton.classList.add('removed');  
  
  // getUsermedia parameters.
  var constraints = {
    video: {
		width: { 
			exact: 400,
		},
		height: {
			exact: 300,
		},
		frameRate: {
			ideal: 8,
			max: 12 
		},
		facingMode: (front? "user" : "environment")
	}
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    video.srcObject = stream;
    video.captureStream = video.captureStream || video.mozCaptureStream;
    video.addEventListener('loadeddata', predictWebcam);
    
    return new Promise(resolve => video.onplaying = resolve);
  }).then(()=>startRecording(video.captureStream(), stopButton)).then (recordedChunks => {
  let recordedBlob = new Blob(recordedChunks, {type: 'video/webm'} );
  
  stop(video.srcObject);
  video.srcObject=null;
  video.removeEventListener('loadeddata', predictWebcam);
  video.src = URL.createObjectURL(recordedBlob);
  video.setAttribute("controls","");
  
  downloadButton.href = video.src;
  downloadButton.download = Date.now().toString(36)+".webm";
  
  stopButton.classList.add('removed');
  downloadButton.classList.remove('removed');
  })
}
/*
stopButton.addEventListener("click", function() {
    stop(video.srcObject);
    }, false);
*/
// Prediction loop!
function predictWebcam() {
  // Now let's start classifying the stream.
  model.detect(video).then(function (predictions) {
    // Remove any highlighting we did previous frame.
    for (let i = 0; i < children.length; i++) {
      liveView.removeChild(children[i]);
    }
    children.splice(0);
    
    // Now lets loop through predictions and draw them to the live view if
    // they have a high confidence score.
	pc=0;
	h6.innerHTML=pc;

    for (let n = 0; n < predictions.length; n++) {
      // If we are over 66% sure we are sure we classified it right, draw it!
      if (predictions[n].score > 0.36 && predictions[n].class =="person" ) {
        const p = document.createElement('p');
		
		pc++;
		h6.innerHTML=pc;

        p.innerText = predictions[n].class  + ' - with ' 
            + Math.round(parseFloat(predictions[n].score) * 100) 
            + '% confidence.';
        // Draw in top left of bounding box outline.
        p.style = 'left: ' + predictions[n].bbox[0] + 'px;' +
            'top: ' + predictions[n].bbox[1] + 'px;' + 
            'width: ' + (predictions[n].bbox[2] - 10) + 'px;';

        // Draw the actual bounding box.
        const highlighter = document.createElement('div');
        highlighter.setAttribute('class', 'highlighter');
        highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: '
        + predictions[n].bbox[1] + 'px; width: ' 
        + predictions[n].bbox[2] + 'px; height: '
        + predictions[n].bbox[3] + 'px;';

        liveView.appendChild(highlighter);
        liveView.appendChild(p);
        
        // Store drawn objects in memory so we can delete them next time around.
        children.push(highlighter);
        children.push(p);
      }
    }

    // Call this function again to keep predicting when the browser is ready.
    window.requestAnimationFrame(predictWebcam);
  });
}

function startRecording(stream, btn) {
  let recorder = new MediaRecorder(stream , options );
  let data = [];

  recorder.ondataavailable = event => data.push(event.data);
  recorder.start();
  
  let stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = event => reject(event.name);
  });

  let recorded = stopRec(btn).then(
    () => recorder.state == "recording" && recorder.stop()
  );

  return Promise.all([
    stopped,
    recorded
  ])
  .then(() => data);
}

function stopRec(btn) {
  return new Promise(resolve => {
	  btn.addEventListener('click',
	  async function handler(event) {
		  btn.removeEventListener('click', handler);
		  resolve(true)
	  });
  });
}
function stop(stream) {
  stream.getTracks().forEach(track => track.stop());
}

window.onerror = function(msg, url, linenumber) {
    alert('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
    return true;
}
