import CryptoJS from "crypto-js/core.js";
import MD5 from "crypto-js/md5.js";
import WordArray from "crypto-js/lib-typedarrays.js";

Object.assign(CryptoJS, {
    MD5,
    lib: {
        WordArray
    }
});

globalThis.CryptoJS = CryptoJS;


// "crypto-js": "3.3.0"
// http://github.com/brix/crypto-js"