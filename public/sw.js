// "self" keyword-> is used to get access to background process so that app can be used in background

//to import the idb file to be used for "INDEXED-DB"
//idb file constains short method to read and write data in the database of browser without complex codes
importScripts("/src/js/idb.js");

//this file has the function which we have created inorder to work with above file and store and view the data form database of browser
importScripts("/src/js/utility.js");


//name of static cache used below
var CACHE_STATIC_NAME = "static-v33";
//name of dynamic cache used below
var CACHE_DYNAMIC_NAME = "dynamic-v6";
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  "/src/js/idb.js",
  "/src/js/utility.js",
  '/src/js/feed.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];



//_______________________________________________________________________INSTALLING SERVICE WORKER__________________________________________________________________________
//"install"-> is used to install the service worker
self.addEventListener("install",function(event){
    console.log(" [Service Worker] Installing Service Worker...",event);
    // ______________________________________________________________PRECACHING OF THE INITIAL PAGE("/")_____________________________________________________________________
    
    //the below code would create a CACHE MEMORY to store OFFLINE CODE
    //"caches"-> is an overall cache storage
    //"caches.open()"-> is used to open a new cache block inside browser memory cache
    //"event.waitUntil(caches.open())"->is used to wait until the cache is being created so that until that time no other operation in performed
    event.waitUntil(
        //static is the name given to the new created cache
        caches.open(CACHE_STATIC_NAME)
        .then((cache) => 
        {
            console.log("[Service Worker] Precaching App Shell");
            //".add" is like a database method to store the file of the pathname
            //remember-> we are storing this file so that when the internet goes down browser can use this local file to show data
            //IMP. remember-> This is a precaching that is caching on load of a page later we would also do dynamic caching
            cache.addAll(STATIC_FILES)
            // ___________________________________________OR-ADD-INDIVIDUAL-FILE________________________________________________
            // cache.add("/");
            // cache.add("/index.html");
            // cache.add("/src/js/app.js");
            //__________________________________________________________________________________________________________________
        })
        )
    // _____________________________________________________________END-OF-(PRECACHING OF THE INITIAL PAGE)________________________________________________________________________________________________________
})
//_________________________________________________________________________________________________________________________________________________________________________

// //this is the function to check for files in the dyanamic caching only upto a point
// function trimCache(cacheName,maxItems){
//     caches.open(cachesName)
//     .then(function(cache){
//         //to get all the files in that cache
//         return cache.keys()
//         .then(function(keys){
//             caches.delete(keys[0])
//             //to recursively delete the files from the starting till the limit is matched
//             .then(trimCache(cacheName,maxItems));
//         })
//     })
    
// }



// ________________________________________________________________________ACTIVATING SERVICE WORKER__________________________________________________________________________
//"activate"->is used to activate the service worker and executed only when a new page is opened
self.addEventListener("activate",function(event){
    console.log(" [Service Worker] Activating Service Worker...",event);
    
    //______________________________________________________CLEARING OLD CACHES ONCE ANY FILE IS UPDATED_______________________________________________________________
    //here we are actually clearing the all caches once a new cache of the same updated file is created so that browser dont execute the old file
    //"waitUntil()"-> is used to tell app to wait till the time the old cache is deleted so that it does not load file from old caches
    event.waitUntil(
        //"caches.keys()"-> gives the list of all the caches we have in the folder
        caches.keys()
            .then(function(keylist){
                //"keylist"-> here have array of the names of caches we have
                //Promise.all()-> here takes an array of promises and return only when all the arrays are executed
                return Promise.all(keylist.map(function(key){
                    if(key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME){
                        console.log("[service worker] Removing old cache.",key);
                        return caches.delete(key);
                    }
                }))
            })
    )
    // _____________________________________________________END-OF-(CLEARING OLD CACHES ONCE ANY FILE IS UPDATED)_______________________________________________________________
    
    //ensures that the service worker is activated correctly with no errors(MIGHT NOT BE REQUIRED ALSO)
    return self.clients.claim();
})

// ________________________________________________________________________________________________________________________________________________________________________

//_________________________________________________________________________FETCHING AND SERVICE WORKER STRATEGIES_____________________________________________________________

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    // console.log('matched ', string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

self.addEventListener('fetch', function (event) {

    var url = 'https://pwagram-47bee.firebaseio.com/posts';
    if (event.request.url.indexOf(url) > -1) {
      event.respondWith(
        fetch(event.request)
          .then(function (res) {
            var cloneRes = res.clone();
            clearAllData('posts')
            //THE ABOVE FUNCTION WOULD RETURN TRUE WHEN DATA IS CLEARED
              .then(function(){
                return cloneRes.json()
              })
              //this then block would get the returned clone data of "res" where ir would contain all key-value pairs from server from above block when the data is cleared
              .then(function(data){
                for (var key in data){
                  //we are calling the utility file function to store data in "posts" store under the filename with key "id"
                  writeData("posts",data[key]);
                  //function located in utility package to delete single post
                  // deleteSingleItem("post",key);
                }
              })
            return res;
          })
      )
    } else if (isInArray(event.request.url, STATIC_FILES)) {
      event.respondWith(
        caches.match(event.request)
      );
    } else {
      event.respondWith(
        caches.match(event.request)
          .then(function (response) {
            if (response) {
              return response;
            } else {
              return fetch(event.request)
                .then(function (res) {
                  return caches.open(CACHE_DYNAMIC_NAME)
                    .then(function (cache) {
                      // trimCache(CACHE_DYNAMIC_NAME, 3);
                      cache.put(event.request.url, res.clone());
                      return res;
                    })
                })
                .catch(function (err) {
                  return caches.open(CACHE_STATIC_NAME)
                    .then(function (cache) {
                      if (event.request.headers.get('accept').includes('text/html')) {
                        return cache.match('/offline.html');
                      }
                    });
                });
            }
          })
      );
    }
  });
  
 
//_________________________________________________________________________SYNC EVENT OF SERVICE WORKER(Step 2)____________________________________________________________________________________________________

//step1-> in feed.js
//would be fired once the connectivity would be established
self.addEventListener("sync",function(event){
  console.log("[Service worker] Background Syncing",event);
  if(event.tag === "sync-new-post"){
    console.log("[Service Worker] Syncing new post");
    event.waitUntil(
      readAllData("sync-posts")
        .then(function(data){
          
          //this is a for-of loop where each value is in dt & we are looping because there may be more than one post to be stored online
          for(var dt of data){
            //____________________________(STEP 3)OF ENABLING CAMERA SETUP_________________________
            var postData = new FormData();
            postData.append("id",dt.id);
            postData.append("title",dt.title);
            postData.append("location",dt.location);
            postData.append("rawLocationLat", dt.rawLocation.lat);
            postData.append("rawLocationLng", dt.rawLocation.lng);
            //here we are sending the picture file with custom name and .png extension
            postData.append("file",dt.picture, dt.id + ".png");
            console.log("called")
            fetch("https://us-central1-pwagram-47bee.cloudfunctions.net/storePostData",{
                    method: "POST",
                    body: postData
                    })//_____________________________TILL HERE______________________________________
              .then(function(res){
                console.log("sent data",res);
                //this line checks for 200 case of network
                if(res.ok){
                  //__________________________________BACKEND CHANGES______________________________________
                  res.json()
                    .then(function(resData) {
                      deleteSingleItem('sync-posts', resData.id);
                    });
                  // deleteSingleItem("sync-posts",dt.id)
                }
              })
            
          }
          
        })
    );
  }
})

//____________________________________________________________________(STEP 2)NOTIFICATION ACTION BUTTON LISTNER____________________________________________________________________

//here we are listening if the notification was interacted by user
  self.addEventListener("notificationclick",function(event){
    //sees which notificationwas clicked
    var notification = event.notification;
    //sees which action was clicked
    var action = event.action;

    console.log(notification);

    if(action === "confirm"){
      console.log("Confirm action in notification was chosen");
      notification.close();
    }else {
      console.log(action);
      // _________________________________________________________________TO OPEN THE BROWSER OR POST ON CLICK ON NOTIFICATION____________________________________________________________
      event.waitUntil(
        //clients refers to all the users of the app actually here we are seeing if any tab is opened by the app then click the notifaction to open that tab
        //otherwise open new tab
        clients.matchAll()
        //the above line finds all the open tabs
          .then(function(clis){
            //the below line check for each client that weather they have an open tab 
             var client = clis.find(function(c){
               return c.visibilityState === "visible";
             });
              //this line would open the already opened tab of the particular client 
              //otherwise if no tabs were opened they would open new tab
             if(client !== undefined){
               client.navigate(notification.data.url);
               client.focus();
             }else{
               clients.openWindow(notification.data.url);
             }
             notification.close();
          })
      )
      
    }

  })

//here we are checking if the notification was directly closed
  self.addEventListener("notificationclose",function(event){
    console.log("notification was closed",event);
  })

//____________________________________________________________________________(STEP 5)PUSH NOTIFICATION__________________________________________________________________________________
  
//this event would be called by backend through webpush.sendNotification()
self.addEventListener("push",function(event){
    //here event would have the values passed by webpush.sendNotification();
    console.log("push notifiaction received",event);
    var data={title:"New!", content: "Something new happened!", url: "/"}
    if(event.data){
      data = JSON.parse(event.data.text());
    }
    //options of the content in notification
    var options={
      //remember title is never written here,it is always passed in showNotification() function.
      body: data.content,
      icon: "/src/images/icons/app-icon-96x96.png",
      badge:"/src/images/icons/app-icon-96x96.png",
      data:{
        url: data.openUrl
      }
      //remember here the payload is set to 4kb so we cannot send a image here
    }

    event.waitUntil(
      //this is line is used to get the link to the active service worker on frontend because backend service worker cannot send the notification itself
      self.registration.showNotification(data.title,options)
    )
  })

  // self.addEventListener('fetch', function(event) {
  //   event.respondWith(
  //     caches.match(event.request)
  //       .then(function(response) {
  //         if (response) {
  //           return response;
  //         } else {
  //           return fetch(event.request)
  //             .then(function(res) {
  //               return caches.open(CACHE_DYNAMIC_NAME)
  //                 .then(function(cache) {
  //                   cache.put(event.request.url, res.clone());
  //                   return res;
  //                 })
  //             })
  //             .catch(function(err) {
  //               return caches.open(CACHE_STATIC_NAME)
  //                 .then(function(cache) {
  //                   return cache.match('/offline.html');
  //                 });
  //             });
  //         }
  //       })
  //   );
  // });
  
  // self.addEventListener('fetch', function(event) {
  //   event.respondWith(
  //     fetch(event.request)
  //       .then(function(res) {
  //         return caches.open(CACHE_DYNAMIC_NAME)
  //                 .then(function(cache) {
  //                   cache.put(event.request.url, res.clone());
  //                   return res;
  //                 })
  //       })
  //       .catch(function(err) {
  //         return caches.match(event.request);
  //       })
  //   );
  // });
  
  // Cache-only
  // self.addEventListener('fetch', function (event) {
  //   event.respondWith(
  //     caches.match(event.request)
  //   );
  // });
  
  // Network-only
  // self.addEventListener('fetch', function (event) {
  //   event.respondWith(
  //     fetch(event.request)
  //   );
  // });


//_____________________________________________________________________________________________________________________________________________________________


// __________________________________________________________________SERVICE WOKER STRATEGIES___________________________________________________________________

//remember fetch(event.request)-> is allways used to FETCH FILE FROM NETWORK
// //this "fetch" is used to fetch data and files like css file or image file 
// self.addEventListener("fetch",function(event){
//     // console.log(" [Service Worker] Fetching Something...",event);
//     //here in event we are getting the report of all the fetch request performed to get the website rendered
//     //using event.respondWith(any property ex:-"null")-> can be used here to modify the response
//     event.respondWith(
//         //here What we are doing
//         //"event.request"-> would be giving us the request that is made by browser like that of an css file
//         //"caches.match"->will see if that file is stored in the cache storage
//         //"response"-> would get wether yes or no that the file is present
//         caches.match(event.request)
//             .then((response) => {
//                 if(response){
//                     //if file is present it will return the file from cache
//                     return response;
//                 }else{
//                     // __________________________________________________DYNAMICALLY STORING CACHES(Caching of files not in precaching)___________________________________________________________________________
//                     //generally done to add the pages inside the webpage that the user visits
//                     //but if file is not present in cache memory then it will response the file from the position of original storing of file i.e where the actual web files are stored
//                     return fetch(event.request)
//                     //here we are chaching(storing files) dynamicallly i.e the file that the user have visited 
//                     //we are doing it here because this else block would only be triggered if the file is not found in the cache
//                     .then((res) => {    
//                         //here "res"-> would have the file that is neede by the browser
//                         //making a new cache named dynamic
//                         return caches.open(CACHE_DYNAMIC_NAME)
//                             .then( (cache) => {
//                                 //"event.request.url"-> is the url making that request
//                                 //here "put" is used instead of "add" or "addAll" because these two set a the url to default ("/") but put actually give us the option to add url also
//                                 //"res.clone()"-> is used because when the res(response page) is stored in the cache then the res becomes empty(null) to avoid this we stor it's clone here
//                                  trimCache(CACHE_DYNAMIC_NAME,3);
//                                  cache.put(event.request.url,res.clone());
//                                 return res;
//                             })
//                     })
//                     //________________________________________________________________SHOWS OFFLINE PAGE IN OFFLINE MODE______________________________________________________________

//                     .catch(function(err){
//                         return caches.open(CACHE_STATIC_NAME)
//                         .then(function(cache){
//                            return cache.match("/offline.html");
//                         })
//                     })
//                     // _________________________________________________END-OF-(DYNAMICALLY STORING CACHES)________________________________________________________________________________________________________
//                 }
//             })
//     );
// })


// //cache-then-network strategy
// self.addEventListener("fetch",function(event){
//     const url="https://httpbin.org/get";
//     if(event.request.url.indexOf(url) > -1){
//         event.respondWith(
//             caches.open(CACHE_DYNAMIC_NAME)
//             .then(function(cache){
//                 return fetch(event.request)
//                 .then(function(res){
//                     trimCache(CACHE_DYNAMIC_NAME,3);
//                     cache.put(event.request,res.clone());
//                     return res;
//                 })
//             })
//          );    
//     }else{
//         event.respondWith(
//             caches.match(event.request)
//                         .then((response) => {
//                             if(response){
//                                 //if file is present it will return the file from cache
//                                 return response;
//                             }else{
//                                 // __________________________________________________DYNAMICALLY STORING CACHES(Caching of files not in precaching)___________________________________________________________________________
//                                 //generally done to add the pages inside the webpage that the user visits
//                                 //but if file is not present in cache memory then it will response the file from the position of original storing of file i.e where the actual web files are stored
//                                 return fetch(event.request)
//                                 //here we are chaching(storing files) dynamicallly i.e the file that the user have visited 
//                                 //we are doing it here because this else block would only be triggered if the file is not found in the cache
//                                 .then((res) => {    
//                                     //here "res"-> would have the file that is neede by the browser
//                                     //making a new cache named dynamic
//                                     return caches.open(CACHE_DYNAMIC_NAME)
//                                         .then( (cache) => {
//                                             //"event.request.url"-> is the url making that request
//                                             //here "put" is used instead of "add" or "addAll" because these two set a the url to default ("/") but put actually give us the option to add url also
//                                             //"res.clone()"-> is used because when the res(response page) is stored in the cache then the res becomes empty(null) to avoid this we stor it's clone here
//                                             trimCache(CACHE_DYNAMIC_NAME,3);
//                                             cache.put(event.request.url,res.clone());
//                                             return res;
//                                         })
//                                 })
//                                 //________________________________________________________________SHOWS OFFLINE PAGE IN OFFLINE MODE______________________________________________________________
            
//                                 .catch(function(err){
//                                     return caches.open(CACHE_STATIC_NAME)
//                                     .then(function(cache){
//                                        return cache.match("/offline.html");
//                                     })
//                                 })
//                                 // _________________________________________________END-OF-(DYNAMICALLY STORING CACHES)________________________________________________________________________________________________________
//                             }
//                         })
//         )
//     }
    
// })


//cacheonly strategy
// self.addEventListener("fetch",function(event){
//     event.respondWith(
//         caches.match(event.request)
//     )
// })

//network-only-strategy
// self.addEventListener("fetch",function(event){
//     event.respondWith(
//         fetch(event.request)
//     )
// })

//network-cache-fallback even this strategy is not good because in direct cache acess the speed is fast but here we first wait for response from server then load the file from cache
// self.addEventListener("fetch",function(event){
//     // console.log(" [Service Worker] Fetching Something...",event);
//     //here in event we are getting the report of all the fetch request performed to get the website rendered
//     //using event.respondWith(any property ex:-"null")-> can be used here to modify the response
//     event.respondWith(
//         //here What we are doing
//         //"event.request"-> would be giving us the request that is made by browser like that of an css file
//         //"caches.match"->will see if that file is stored in the cache storage
//         //"response"-> would get wether yes or no that the file is present
//         fetch(event.request)
//             .then(function(res){
//                 return caches.open(CACHE_DYNAMIC_NAME)
//                      .then( (cache) => {
//                          //"event.request.url"-> is the url making that request
//                         //here "put" is used instead of "add" or "addAll" because these two set a the url to default ("/") but put actually give us the option to add url also
//                         //"res.clone()"-> is used because when the res(response page) is stored in the cache then the res becomes empty(null) to avoid this we stor it's clone here
//                         cache.put(event.request.url,res.clone());
//                         return res;
//                     })
//             })
//             .catch(function(err){
//                 return caches.match(event.request)
//             })

        
//     );
// })
//___________________________________________________________________________________________________________________________________________________________________________________________________________________

