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

//_______________________________________________________________ENABLE PUSH MESSAGE NOTIFICATION(STEP 1)_________________________________________________________________________________________

//STEP 2->in sw.js to listen to the action button in option of notification.
//STEP 3->below in enable push notification.
//Step 4->changes in the backend
//STEP 5->sw.js under puch notification
//to target all the button elements with class .enable-notifications
var enableNotificationButtons = document.querySelectorAll(".enable-notifications");
//(3)
function displayConfirmNotification(){
    
    if("serviceWorker" in navigator){
        navigator.serviceWorker.ready
            //here the "swreg"-> has the access to the registration part of the serviceworker
            //"swreg"-> basically listen to new incoming data from server to be displayed on screem
            .then(function(swreg){
                //_______________________________________________DIFFERENT FEATURES TO BE SHOWN IN NOTIFICATION_____________________________________________________________
                //the options below are used to display different messages in the push notification window
                //but remember not all options would be shown here only those options would be shown that are a part of the respective browser.
                var options = {
                    body: "you have subscribed to our notification service",
                    icon: "/src/images/icons/app-icon-96x96.png",
                    image: "/src/images/sf-boat.jpg",
                    dir: "ltr",
                    lang: "en-US",
                    //this means first vib for 100ms stop for 50ms and again vibrate for 200ms basically a pattern of vibration
                    vibrate:[100,50,200],
                    //this is the small black and white icon in the notification bar which would be shown when taskbar of android is small
                    badge: "/src/images/icons/app-icon-96x96.png",
                    //this tag option is used to display the notification one below the other i.e multiple or just one at a time
                    //the notification with same tag name would occour in one window only while with diff tag name would come one after other
                    tag: "confirm-notification",
                    //this options if set true would vibrate and give same feeling if the same tag data occours again but if set to false it dont do that
                    renotify: true,
                    //actions are the button in the notification it may depend on the bowser if actions would be shown because they are less supported
                    actions: [
                        //type of action----name of button-----any icon with the button shown 
                        {action: "confirm", title: "Okay", icon: "/src/images/icons/app-icon-96x96.png"},
                        {action: "cancel", title: "Cancel", icon: "/src/images/icons/app-icon-96x96.png"}
                    ]
                }
                //__________________________________________________________________________________________________________________________________________________________
                console.log("i am called",options); 
                //is used to show the notification
                swreg.showNotification("Successfully subscribed!",options);
            })
        }
        //___________________________________________TO SHOW NOTIFICATION WITHOUT SERVICE WORKER_______________________________________
        // var options = {
        //     body: "you have subscribed to our notification service"
        // } 
        // new Notification("Successfully subscribed!",options)
    }

//______________________________________________________(STEP 3)PUSH NOTIFICATION VIA BACKEND____________________________________________________________
//STEP 3-> (1)"npm i --save web-push"->to install dependency of web push that would generate vapid keys
//(2)inside package.json ---under script tag add --- "web-push":"web-push"
//(3)"npm run web-push generate-vapid-keys"-> this would give us two keys one public and one private to be executed only once per app
//(4)added a new function to utility to covert base64 to binary array ->"urlBase64ToBinary8Array"
//(5)changes made in function/index.js to use this vivid keys

function configurePushSub(){
    if(!("serviceWorker" in navigator)){
        //if there is no service worker is there this return statement would take us out of the if block
        return;
    }
    var reg;
    navigator.serviceWorker.ready
        .then(function(swreg){
            //this would return a promise which would inturn return a subscription
            reg=swreg;
            return swreg.pushManager.getSubscription();
        })
        .then(function(sub){
            if( sub === null){
                //create a new subscription
                var vapidPublicKey ="BAnhVcH4f9c8Bmf-KoJFtDuHeIUphsiQvcioazqSwI33ibAlpzYBH95SOb4kTAm6_6iuNtZ5h-wuxSU-qbLwEqY";
                //function in utility.js to convert base64 to binary array and return the array
                var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
                //this step is to prevent user from sending custom push messages if the somehow find out our subscription and keys
                return reg.pushManager.subscribe({ 
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidPublicKey
                });
            }else{
                //we have a subscription
            }
        })
        .then(function(newSub){
            //this line would target the subscription data base on firebase (making a new DB of name subscription)
            //REMEBER-> each time you target a data base you are required to write .json at the end this is just firebase things
            fetch("https://pwagram-47bee.firebaseio.com/subscription.json",{
                method: "POST",
                headers: {   
                    "Content-Type": "application/json",
                    "Accept": "appliaction/json"
                },
                body: JSON.stringify(newSub)
            })
                .then(function(res){
                    if(res.ok){
                        displayConfirmNotification()
                    }
                })
                .catch(function(err){
                    console.log(err);
                })
        })
}
//___________________________________________________________________________________________________________________________________________________

//(2)
function askForNotificationPermission() {
    //this is the in window function of the browser to ask the person for the permission of showing notification & push messages
    //.requestPermission is the function to get the user permission
    Notification.requestPermission(function(result){
        console.log("User Choice",result);
        if(result !== "granted"){
            console.log("No notification permission granted");
        }else{
            configurePushSub();
            // displayConfirmNotification();
        }
    });
}

//to check if browser supports push notifications   (1)
if("Notification" in window && "serviceWorker" in navigator){
    for(var i=0;i< enableNotificationButtons.length; i++)
    {
        //this step is to show the buttons by changing the display to inline-block
        enableNotificationButtons[i].style.display=("inline-block");
        enableNotificationButtons[i].addEventListener("click",askForNotificationPermission);
    }
}










//_________________________________________________________________________________________________________________________________________________________________________________________________

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