//Utilities

function isIterable(obj) {
    // checks for null and undefined
    if (obj == null)
      return false;
    return typeof obj[Symbol.iterator] === 'function';
  }

function isString(x) {
return Object.prototype.toString.call(x) === "[object String]"
}

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}
