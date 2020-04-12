var functions = require("firebase-functions");
var admin = require("firebase-admin");
var cors = require("cors")({ origin: true });
var webpush = require("web-push");
var formidable = require("formidable");
var fs = require("fs");
var UUID = require("uuid-v4");
var os = require("os");
var Busboy = require("busboy");
var path = require('path');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

var serviceAccount = require("./pwagram-fb-key.json");

var gcconfig = {
  projectId: "pwagram-47bee",
  keyFilename: "pwagram-fb-key.json"
};

var gcs = require("@google-cloud/storage")(gcconfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pwagram-47bee.firebaseio.com/"
});

exports.storePostData = functions.https.onRequest(function(request, response) {
  cors(request, response, function() {
    var uuid = UUID();

    const busboy = new Busboy({ headers: request.headers });
    // These objects will store the values (file + fields) extracted from busboy
    let upload;
    const fields = {};

    // This callback will be invoked for each file uploaded
    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      console.log(
        `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
      );
      const filepath = path.join(os.tmpdir(), filename);
      upload = { file: filepath, type: mimetype };
      file.pipe(fs.createWriteStream(filepath));
    });

    // This will invoked on every field detected
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
      fields[fieldname] = val;
    });

    // This callback will be invoked after all uploaded files are saved.
    busboy.on("finish", () => {
      var bucket = gcs.bucket("pwagram-47bee.appspot.com");
      bucket.upload(
        upload.file,
        {
          uploadType: "media",
          metadata: {
            metadata: {
              contentType: upload.type,
              firebaseStorageDownloadTokens: uuid
            }
          }
        },
        function(err, uploadedFile) {
          if (!err) {
            admin
              .database()
              .ref("posts")
              .push({
                id: fields.id,
                title: fields.title,
                location: fields.location,
                // (7) adding raw location 
                rawLocation: {
                  lat: fields.rawLocationLat,
                  lng: fields.rawLocationLng
                },
                image:
                  "https://firebasestorage.googleapis.com/v0/b/" +
                  bucket.name +
                  "/o/" +
                  encodeURIComponent(uploadedFile.name) +
                  "?alt=media&token=" +
                  uuid
              })
              .then(function() {
                webpush.setVapidDetails("mailto:chiragvaid88@gmail.com","BAnhVcH4f9c8Bmf-KoJFtDuHeIUphsiQvcioazqSwI33ibAlpzYBH95SOb4kTAm6_6iuNtZ5h-wuxSU-qbLwEqY","_zsrD71Sb_hJxZ1NV-Ap-qJq0RlJwHusRRjbFHeKGiY")
                // webpush.setVapidDetails(
                //   "mailto:business@academind.com",
                //   "BKapuZ3XLgt9UZhuEkodCrtnfBo9Smo-w1YXCIH8YidjHOFAU6XHpEnXefbuYslZY9vtlEnOAmU7Mc-kWh4gfmE",
                //   "AyVHwGh16Kfxrh5AU69E81nVWIKcUwR6a9f1X4zXT_s"
                // );
                return admin
                  .database()
                  .ref("subscriptions")
                  .once("value");
              })
              .then(function(subscriptions) {
                subscriptions.forEach(function(sub) {
                  var pushConfig = {
                    endpoint: sub.val().endpoint,
                    keys: {
                      auth: sub.val().keys.auth,
                      p256dh: sub.val().keys.p256dh
                    }
                  };

                  webpush
                    .sendNotification(
                      pushConfig,
                      JSON.stringify({
                        title: "New Post",
                        content: "New Post added!",
                        openUrl: "/help"
                      })
                    )
                    .catch(function(err) {
                      console.log(err);
                    });
                });
                response
                  .status(201)
                  .json({ message: "Data stored", id: fields.id });
              })
              .catch(function(err) {
                response.status(500).json({ error: err });
              });
          } else {
            console.log(err);
          }
        }
      );
    });

    // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
    // a callback when it's finished.
    busboy.end(request.rawBody);
    // formData.parse(request, function(err, fields, files) {
    //   fs.rename(files.file.path, "/tmp/" + files.file.name);
    //   var bucket = gcs.bucket("YOUR_PROJECT_ID.appspot.com");
    // });
  });
});







// var functions = require('firebase-functions');
// var admin = require('firebase-admin');
// //this package is used to send cors with the origin set to true 
// var cors = require('cors')({origin: true});
// //this package is used to generate vipid keys so that no user can send the push notifications to the users
// var webpush = require("web-push");
// //(STEP 4 OF ENABLING CAMERA)these two package are installed to send data to firebase storage mainly image
// var fs = require("fs");
// var UUID = require("uuid-v4");
// var os = require("os");
// var Busboy = require("busboy");
// var path = require('path');
// // // Create and Deploy Your First Cloud Functions
// // // https://firebase.google.com/docs/functions/write-firebase-functions
// //

// //___________________________________________________________________GENERATED FROM GOOGLE FIREBASE IN SETTING________________________________________________________
// var serviceAccount = require("./pwagram-fb-key.json");

// //________________(STEP 4)Sending camera data____________________
// //this configration is added to store file in google storage (npm i --save busboy @google-cloud/storage)
// //project id from the name of project in firebase and keyFileName from above
// var gcconfig = {
//   projectId: "pwagram-47bee",
//   keyFilename:"pwagram-fb-key.json"
// }
// var gcs = require("@google-cloud/storage")(gcconfig);
// //_____________________till here________________________________

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: 'https://pwagram-47bee.firebaseio.com/'
// });
// //____________________________________________________________________________________________________________________________________________________________________

// exports.storePostData = functions.https.onRequest(function(request, response) {
// //here reques and response is passe dof above function to the cors
//  cors(request, response, function() {
//   //______________________________________________(STEP 4)STORING CAMERA FILE___________________________________________________
//   var uuid = UUID();
   
//   const busboy = new Busboy({ headers: request.headers });
//   // These objects will store the values (file + fields) extracted from busboy
//   let upload;
//   const fields = {};

//   // This callback will be invoked for each file uploaded
//   busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
//     console.log(
//       `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
//     );
//     const filepath = path.join(os.tmpdir(), filename);
//     upload = { file: filepath, type: mimetype };
//     file.pipe(fs.createWriteStream(filepath));
//   });

//   // This will invoked on every field detected
//   busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
//     fields[fieldname] = val;
//   });

//   // This callback will be invoked after all uploaded files are saved.
//   busboy.on("finish", () => {
//     var bucket = gcs.bucket("pwagram-47bee.appspot.com");
//     bucket.upload(
//       upload.file,
//       {
//         uploadType: "media",
//         metadata: {
//           metadata: {
//             contentType: upload.type,
//             firebaseStorageDownloadTokens: uuid
//           }
//         }
//       },
//       function(err,uploadedFile){
//       if(!err){
//         admin.database().ref('posts').push({
//           id:       fields.body.id,
//           title:    fields.body.title,
//           location: fields.body.location,
//           image:    "https://firebasestorage.googleapis.com/v0/b/" + bucket.name + "/o/" + encodeURIComponent(uploadedFile.name) + "?alt=media&token=" + uuid
//         })
//         //_______________________________________________________________________STEP 4 WEBPUSH____________________________________________________________________________
//           .then(function() {
//              //firstParameter->your business email_________________second->Public Key________________third->Private key
//              webpush.setVapidDetails("mailto:chiragvaid88@gmail.com","BAnhVcH4f9c8Bmf-KoJFtDuHeIUphsiQvcioazqSwI33ibAlpzYBH95SOb4kTAm6_6iuNtZ5h-wuxSU-qbLwEqY","_zsrD71Sb_hJxZ1NV-Ap-qJq0RlJwHusRRjbFHeKGiY")
//              //to access the database->named "subsription"->only once
//              return admin.database().ref("subscription").once("value");
//           })
//           .then(function(subscriptions){
//               subscriptions.forEach(function(sub){
//                   var pushConfig={
//                       //here through this we will get the value of endpoint of subscription database on firebase
//                       //val()-> to get javascript value
//                       //endpoint->the variable whose value is accessed 
//                      endpoint: sub.val().endpoint,
//                      keys:{
//                          auth:sub.val().keys.auth,
//                          p256dh: sub.val().keys.p256dh
//                      }
//                   };
//                   //here this line sends the push type request to service worker to display notification(REFER STEP 5 UNDER "PUSH NOTIFICATION")
//                   webpush.sendNotification(  pushConfig , JSON.stringify({
//                       title: "New Post",
//                        content: "New Poat Added!",
//                        openUrl: "/help"
//                      }))
//                      .catch(function(err){console.log(err)})
//               });
//               response.status(201).json({message:"Data Stored", id: fields.id})
//           })
//           .catch(function(err) {
//             response.status(500).json({error: err});
//           });
//       }else{
//         console.log(err); 
//       }
//     })
//    })
//    // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
//     // a callback when it's finished.
//     busboy.end(request.rawBody);
//     // formData.parse(request, function(err, fields, files) {
//     //   fs.rename(files.file.path, "/tmp/" + files.file.name);
//     //   var bucket = gcs.bucket("YOUR_PROJECT_ID.appspot.com");
//     // });
// //_______________________________________________________________END STORING CAMERA FILE_________________________________________________________________
   
//  });
// });