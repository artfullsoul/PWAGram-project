var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector("form");
var titleInput = document.querySelector("#title");
var locationInput = document.querySelector("#location");

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  setTimeout(function(){
    createPostArea.style.transform= "translateY(0)"
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
  createPostArea.style.transform = "translateY(100vh)"
  // createPostArea.style.display = 'none';
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

//____________________________________________________________________ADDING SYNC TO SEND DATA EVEN IN OFFLINE_________________________________________________________________________________________________________

//this would send data in the case there is no sync property available in the browser
//it is called in th else block down
function sendData(){
  fetch("https://pwagram-47bee.firebaseio.com/posts.json",{
  method: "POST",
  headers: {   
      "Content-Type": "application/json",
      "Accept": "appliaction/json"
  },
  body: JSON.stringify({
    id: new Date().toISOString(),
    title: titleInput.value,
    location: locationInput.value,
    image:"https://firebasestorage.googleapis.com/v0/b/pwagram-47bee.appspot.com/o/sf-boat.jpg?alt=media&token=89a317ca-01a5-47bc-808d-33710a358ee6"
  })
})
    .then(function(res){
      console.log("sent data",res);
      updateUI();
    })
  
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
  if("serviceWorker" in navigator && "SyncManager" in window){
    //this line see if the service worker is installed and ready to be executed and returns a promise in form of true or false
    navigator.serviceWorker.ready
    //here by the above line we are also getting access to service worker and the sw below ha sthe link to service-worker
      .then(function(sw){
        var newPost = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value
        }
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