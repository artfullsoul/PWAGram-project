// used in feed.js also to modify button properties
var deferedPrompt;

//if any older browser is using this file that dont supprot "fetch"
if(!window.Promise){
    window.Promise=Promise;
}

//___________________________________________________________CHECKING FOR SERVICE WORKER______________________________________________________
//looks in the browser weather it is using service worker or not
if ("serviceWorker" in navigator){
    // accessing the property of service worker
    navigator.serviceWorker
    //registering the property of service worker also here .register("/sw.js",{scope:"/help/index.html"}) can be used to register the very particular page
    .register("/sw.js")
    //registeration takes some time once done it would print the message
    .then(function() {
        console.log("Service worker registered");
    })
    //to handle any errors 
    .catch((err) => {console.log(err)});
}
//_____________________________________________________________________________________________________________________________________________

//________________________________________________________ASSIGNING THE INSTALL BANNER TO BUTTON_______________________________________________

//this prunction would prevent the browser to automatically show the "install app banner" so that we can give a custom button to install it up
window.addEventListener("beforeinstallprompt",function(event){
    console.log("beforeinstallprompt fired");
    //this line prevents the banner message
    event.preventDefault();
    deferedPrompt=event;
    return false;
})
//_____________________________________________________________________________________________________________________________________________


// //_______________________________PROMISES________________________________

// //here we are actually creating a new promise where it is in turn having a callback
// //"resove"-> this is used to send a positive response which is catched by ".then"
// //"reject"-> this is used to send an error which is handeled by ".catch"
// var promise = new Promise(function(resolve,reject){
//     setTimeout(function(){
//         //resolve("this is executed once the timer is done");
//         reject({code:500 ,message:"An error occoured"});
//     },3000);
// });

// //each ".then" is a child of predecessor returning some data which is caught by next then
// promise.then(function(text){ return text;})
// .then(function(newtext){console.log(newtext)})
// .catch(function(err){console.log(err.code,err.message)})
// //_________________________________FETCH___________________________________

// // to get data from the site
// fetch("https://httpbin.org/ip")
// .then((data) => {console.log(data)})
// .catch((err) => {console.log(err)})

// // to post data to the site
// fetch("https://httpbin.org/post",{
//     //change the default method(GET) to (POST)
//     method: "POST",
//     //used to send additional information
//     header: {
//         //tell the reciever the type or format of data
//         "Content-Type": "application/json",
//         //ask the reciver to accept the data
//         "Accept": "appliaction/json"
//     },
//     //body contains the data we want to send here
//     //JSON.stringify()->is used to convert data to json format
//     //mode if set to "no-cor" would not allow javascript to access the data in it but tags can access them like img tag
//     mode:"cors",
//     body: JSON.stringify({message:"does this work"})
// })
// .then((response) => {
//     console.log(response);
//     return response.json();
// })
// .then((data) => {console.log(data)})
// .catch((err) => {console.log(err)})