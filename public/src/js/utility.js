//here we are opening a new browser dataBase
//first argument-> is the name of database
//second argument-> is the version of database
//third argument-> is the call back function which returns the database in which we can store data 
var dbPromise = idb.open("feed-store",1, function(db){
    //here we are checking wether there already exist a object of name post and if not then we create a "post" object
    //this is used here because each time we would call "dbPromise" to store data if this condition is not checked then it would create a new db each time it is called
    if(!db.objectStoreNames.contains("posts")){
      db.createObjectStore("posts",{keyPath: 'id'});
    }
    //this is a new store set up to store the post in offline mode and upload them once online
    if(!db.objectStoreNames.contains("sync-posts")){
        db.createObjectStore("sync-posts",{keyPath: 'id'});
      }
  });

//this function is used in sw.js and more places to write data in IndexedDB of the browser
  function writeData(st,data){
     return dbPromise
        .then(function(db){
          //here we are creating a transaction i.e setting the property where first one is the name of the store in IndexedDB while second one is type of that is "read-write" in this
          //here "st"-> is the store where we want to store data (EX-> posts)
          var tx = db.transaction(st,"readwrite");
          //opening the store via the transaction "tx" to give read-write property to the store
          var store = tx.objectStore(st);
          //to store the data in the store  and the key is the one we added up in the begining "id" to actually store the data
          store.put(data);
          //to complete the transaction(this is performed only on write operations)
          return tx.complete;
        })
  }
//st-> here is the name of the store to be targeted
function readAllData(st) {
  return dbPromise
    .then(function(db) {
      var tx = db.transaction(st, 'readonly');
      var store = tx.objectStore(st);
      return store.getAll();
      //here we have not returned tx.complete because it is a read only operation while tx.complete() is used in operation where we write
    });
}

//this is used to clear the data from indexedDB because suppose if some data is deleted from network it would still be reflected in the 
//app in ofline mode to prevent this we delete the data and re-write it
function clearAllData(st){
 return dbPromise
    .then(function(db){
        var tx = db.transaction(st,"readwrite");
        var store = tx.objectStore(st);
        store.clear();
        //to complete the transaction(this is performed only on write operations)
        return tx.complete;
    })
}

function deleteSingleItem(st,id){
    return dbPromise
        .then(function(db){
            var tx = db.transaction(st,"readwrite");
            var store = tx.objectStore(st);
            store.delete(id);
            return tx.complete;
        })
        .then(function(){
            console.log("Item Deleted");
        })
}