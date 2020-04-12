var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector("form");
var titleInput = document.querySelector("#title");
var locationInput = document.querySelector("#location");
var fetchedLocation = {lat:0,lng:0}

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  setTimeout(function(){
    createPostArea.style.transform= "translateY(0)";
    initilizeMedia();
    // (4)location function called
    initializeLocation();
  },1)
  
  //_____________________________________________________________________AUTO INSTALL BANNER SHOW ON CLICK_______________________________________________________________
  //Remember in app.js we prevented the browser to show install banner using "beforeinstallprompt" here we are making the button capable of doing that
  //Remember deferedPrompt is a variable declared in app.js
  if(deferedPrompt){
    deferedPrompt.prompt();

    deferedPrompt.userChoice.then(function(choiceResult){
      console.log(choiceResult.outcome);
      
      if(choiceResult === "dismissed"){
        console.log("user cancelled installation");
      }else{
        console.log("user added to home screem")
      }

    });
    deferedPrompt = null;
  }
  //______________________________________________________________________________________________________________________________________________________________________

  //________________________________________________________________________TO UNREGISTER A SERVICE WORKER_________________________________________________________________
  if("serviceWorker" in navigator){
    //to get the already registered service workers
    navigator.serviceWorker.getRegistrations()
      .then,(function(registration){
        for(var i=0;i<registration.length; i++){
          registration[i].unregister();
        }
      })
  }
 //________________________________________________________________________________________________________________________________________________________________________
}

function closeCreatePostModal() {
  
  imagePickerArea.style.display = "none";
  videoPlayer.style.display= "none";
  canvasElement.style.display= "none";
  // createPostArea.style.display = 'none';
  locationBtn.style.display= "none";
  locationLoader.style.display = "none";
  captureButton.style.display = "inline";
  if(videoPlayer.srcObject){
    videoPlayer.srcObject.getVideoTracks().forEach(function(track){track.stop();})
  }
  setTimeout(function(){
    createPostArea.style.transform = "translateY(100vh)";
  },1)
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

//not in use allows saving of individual post online to reproduce it comment out the function and four line matching in createCard() function
// function onSaveButtonClick(event){
//   console.log("clicked");
//   //________________________________________________________________________ON DEMAND CACHING_________________________________________________________________________
//   //here we have a save button on each post that will save the post to a new cache block "user-requested" so that the user can see the post when offline

//   //checking if the browser support cache memory 
//   if("caches" in window){
//     //onpening a new cache
//     caches.open("user-requested")
//       .then(function(cache){
//           cache.add("https://httpbin.org/get");
//           cache.add("/src/images/sf-boat.jpg");
//       })
//   }  
//   //___________________________________________________________________________________________________________________________________________________________________
// }

function clearCards() {
  while(sharedMomentsArea.hasChildNodes()){
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + data.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement("button");
  // cardSaveButton.textContent = "save";
  // cardSaveButton.addEventListener("click",onSaveButtonClick);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data){
  clearCards();
  for(var i=0;i< data.length;i++){
    createCard(data[i]);
  }
}

const url="https://pwagram-47bee.firebaseio.com/posts.json";
var networkDataReceived = false;

//this is the implementation of "CACHE_THEN_STRATEGY" method here the card is first created by network and if not present on network it is created by cache 
//actually in this method we check for data in both cache memory and network and if the data is present in cache memory then the network data is overrided

//here we are checking data in the network i.e from where all the files are present
fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    networkDataReceived = true;
    console.log("From web",data);
    //clearCards()-> is used to remove any same previous card from showing up if present on screen i.e this gives ovveriding property
    
    // to covert and store json format data on firebase to array key-value pair
    var dataArray = [];
    for(var key in data){
      dataArray.push(data[key]);
    }
    updateUI(dataArray);
  });

//here we are checking data in cache
//if statement in the begning is used to check if the browser support caching or not

if ('indexedDB' in window) {
  readAllData('posts')
    .then(function(data) {
      if (!networkDataReceived) {
        console.log('From cache', data);
        updateUI(data);
      }
    });
}

// if("indexedDB" in window){
//   console.log("I Am Called")
//     readAllData("posts")
//       .then(function(data){
//         if(!networkDataReceived){
//           console.log("From cache",data);
//           updateUI(data);
//         }
//       })
//   // caches.match(url)
//   //   .then(function(response){
//   //     if(response){
//   //       return response.json();
//   //     }
//   //   })
//   //   .then(function(data){
//   //     console.log("From cache", data)
//   //     //this if block is present because if the file is found on web and is shown on the browser then/
//   //     //if the file is found in cache too a new file would not be created this if block would prevent it
//   //     if(!networkDataReceived){
//   //       //clearCards()-> is used to remove any same previous card from showing up if present on screen i.e this gives ovveriding property
//   //       // to covert and store json format data on firebase to array key-value pair
//   //       var dataArray = [];
//   //       for(var key in data){
//   //         dataArray.push(data[key]);
//   //       }
//   //       updateUI(dataArray);
//   //     }
//   //   })
// }

//_________________________________________________________________ADDING SYNC TO SEND DATA EVEN IN OFFLINE(STEP 1)_________________________________________________________________________________________________________

//step2-> in sw.js
//this would send data in the case there is no sync property available in the browser
//it is called in th else block down
function sendData(){
  //________________________(STEP 3)MADE CHANGE FOR CAMERA DATA SEND___________________________
  var id = new Date().toISOString();
  var postData = new FormData();
  postData.append("id",id);
  postData.append("title",titleInput.value);
  postData.append("location",locationInput.value);
  // (5)adding latitude and longitude 
  postData.append("rawLocationLat", fetchedLocation.lat);
  postData.append("rawLocationLng", fetchedLocation.lng);
  //here we are sending the picture file with custom name and .png extension
  postData.append("file",picture, id + ".png");
  fetch("https://us-central1-pwagram-47bee.cloudfunctions.net/storePostData",{
    method: "POST",
    body: postData
  })
  .then(function (res) {
    console.log('Sent data', res);
    updateUI();
  })
  //__________________________________________________________________________________________
}
form.addEventListener("submit", function(event){
  //to prevent self submition of the form
  event.preventDefault();

  if(titleInput.value.trim() === "" || locationInput.value.trim() === ""){
    alert("please enter valid data");
    return;
  }
  closeCreatePostModal();
  //checking if the browser has service-worker and sync-manager
  if('serviceWorker' in navigator && 'SyncManager' in window){
    console.log("I am called");
    //this line see if the service worker is installed and ready to be executed and returns a promise in form of true or false
    navigator.serviceWorker.ready
    //here by the above line we are also getting access to service worker and the sw below ha sthe link to service-worker
      .then(function(sw){
        var newPost = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value,
          picture: picture,
          // (6) adding rawLocation to be sent to serviceWorker 
          rawLocation: fetchedLocation
        };
        writeData("sync-posts", newPost)
          .then(function() {
            //once the data is stored the sync property is set up to upload the data online once we are back online
            // setting up the sw with the property of sync with name "sync-new-post"
            // _______________________REGISTRING SYNC SERVICE WORKER____________________________
            return sw.sync.register("sync-new-post");
          })
          .then(function(){
            var snackbarConatiner = document.querySelector("#confirmation-toast");
            var data = {message: "Your Post was saved for syncing!"};
            //this lines displays a banner of sussfull submition
            snackbarConatiner.MaterialSnackbar.showSnackbar(data);
          })
          .catch(function(err){
            console.log(err);
          })
      })
  } else {
    sendData();
  }
})

//____________________________________________________________________TO SET UP CAMERA FEATURE________________________________________________________________________
// Step 2-> added a function in utility.js
// Step 3-> changed the fetch part to send file data both in sync of sw.js & in feed.js under send data
// Step 4-> changed the backend part by installing two packages "busboy and @google-cloud/storage" by writing "npm i --save busboy @google-cloud/storage" & other necessary changes in there

var videoPlayer = document.querySelector("#player");
var  canvasElement= document.querySelector("#canvas");
var  captureButton= document.querySelector("#capture-btn");
var imagePicker = document.querySelector("#image-picker");
var imagePickerArea = document.querySelector("#pick-image");
var picture;

//this function is called in openCreatePostModel()
function initilizeMedia() {
  
  //________________________________TO ENABLE MEDIA SUPPORT ON SOME BROWSER THAT DOES NOT SUPPORT_______________________
  //in this part if the browser does not have media devices support like camera and mic we are going to create custom object
  if(!("mediaDevices" in navigator)){
    //.media device is now a propery which does not exist and we are making a custom property here
    navigator.mediaDevices = {};
  }
  //checking if "getUserMedia" is not there in the browser support and then we are making custom getUserMedia object
  if(!("getUserMedia" in navigator.mediaDevices)){
    //making a custom get media object to work on unsupported browser like safari and mozilla
    navigator.mediaDevices.getUserMedia = function(constraints){
      //----------------safari media support kit---------mozilla media support kit-----
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      //here we are checking if still there is a browser which is using our app that still can't have media property like internet explorer and old browsers
      if(!getUserMedia){
        //here we are returning a reject promise because a browser is found that does not have media properties init
        return Promise.reject(new Error("getUserMedia is not implemented!"));
          }

      //but if the browser is now able to support media then this part is called so that returns a positive promise
      return new Promise(function(resolve,reject){
        getUserMedia.call(navigator,constraints,resolve,reject);
          });
    }
  }
  //________________________________________________________________________________________________________________________
  //this is a kind of else statement because now either the browser will have inbuilt media property or else we have provided a custom one above
  
  //here we are accessing the camera by setting "video: true" we can also access the audio by setting a second property "audio: true"
  navigator.mediaDevices.getUserMedia({video: true})
  //here if we get the access of video granted by the user we will have a ".then" case otherwise if user decline access we would land up in ".catch" case
    .then(function(stream){

      //this line would show the camera video in the video part of the screen inside index.html
      //____CAMERA ACCESS GAINED FROM HERE___
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = "block";
    })
    .catch(function(err){
      //in case of user rejected camera access or we have anr err like camera not present we are showing up a picker of image from the device instead
      imagePickerArea.style.display = "block";
    })
}

captureButton.addEventListener("click",function(event){
  canvasElement.style.display ="block";
  videoPlayer.style.display = "none";
  captureButton.style.display ="none";
  //________________________________TO TAKE IMAGE AND CLOSE CAMERA_________________________________________________
  
  //REMEMBER ".srcObject" is the part which gives access to the camera stream;
  //this would tell the canvaselemnt to show a 2D image
  var Context = canvasElement.getContext("2d");
  //this part would take a screenshot of the stream going on in the video player where the paramteres are as follows
  //screenshot taken from------top-left---bottom-right---canvas(image) width------canvas(image) height
  Context.drawImage(videoPlayer, 0        ,0            ,canvas.width              ,videoPlayer.videoHeight /(videoPlayer.videoWidth / canvas.width));
  
  //_____TO CLOSE THE CAMERA STREAM______
  //this line loops through all the parts where camera are open and close them up
  videoPlayer.srcObject.getVideoTracks().forEach(function(track){ track.stop(); })

  //this line converts the image to a data file where "dataURItoBlob" is a function in utility.js where we pass the data file
  picture = dataURItoBlob(canvasElement.toDataURL())  
  //_______________________________________________________________________________________________________________
})

//________________________________________________IMAGE PICKER_____________________________________________________
//this is targeted when the user picks up an image 
//"change" is called here because when thne user picks up an image the file type is changed
imagePicker.addEventListener("change",function(event){
  picture = event.target.files[0];
})
//_________________________________________________________________________________________________________________

//_______________________________________________________________________END TO SET CAMERA FEATURE____________________________________________________________________________


//________________________________________________________________________(STEP 1)GET GEOLOCATION_________________________________________________________________________________

// (1)creating this part
// (2)adding style="none" property of button to feed.css
// (3)addig style="none" property in closeCreatePostModal()
// (4)adding "initializeLocation()" in openCreatePostModel()
// (5)adding the "rawLocation" variable to form submit
// (6)adding raw location to be sent to service worker under navigator.serviceWorker.ready
// (7)adding raw location option in backend
var locationBtn = document.querySelector("#location-btn");
var locationLoader = document.querySelector("#location-loader");

locationBtn.addEventListener("click",function(event){
  if(!("geolocation" in navigator)){
    locationBtn.style.display = "none";
    return;
  }
  var sawAlert = false;
  locationBtn.style.display="none";
  locationLoader.style.display="block";
  //this function have three callback one to return "position" second to return "any-error" like position permission denied and third some random properties
  //actually this function have some more options refer to document to use them all
  navigator.geolocation.getCurrentPosition(function(position){
    locationBtn.style.display="inline";
    locationLoader.style.display="none";
    //here we are only getting the Latitude but we can also get the LOGITUDE
    //here with both the co-ordinates google-api can be used to fetch exact address and location
    fetchedLocation = {lat:position.coords.latitude, lng:position.coords.longitude};
    locationInput.value="In dehradun";
    document.querySelector('#manual-location').classList.add('is-focused');

  } , function(err){
    console.log(err)
    locationBtn.style.display="inline";
    locationLoader.style.display="none";
    if(!sawAlert){
      sawAlert=true;
      alert("Could not fetch location, please enter manually");
    }
    fetchLocation = {latitude:0,longitude:0};    
    }, {timeout: 7000});
})

function initializeLocation() {
  if(!("geolocation" in navigator)){
    locationBtn.style.display = "none";
  }
}