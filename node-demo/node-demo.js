import blueimpMD5 from "blueimp-md5";                     // [1]
import CbMD5 from "md5.js"; // crypto-browserify/md5.js   // [2]

import CryptoJS from "crypto-js/core.js";
import MD5 from "crypto-js/md5.js";                       // [3]
import WordArray from "crypto-js/lib-typedarrays.js";
Object.assign(CryptoJS, {MD5, lib: {WordArray}});

import JsMD5 from "js-md5"; // emn178/js-md5              // [4]
import nodeMD5 from "md5";  // pvorb/node-md5             // [5]
import SparkMD5 from "spark-md5";                         // [6]

import perf_hooks from "perf_hooks";
const performance = perf_hooks.performance;


let data1 = "new Uint8Array([0, 0, 0, 0])";
let data2 = new Uint8Array([148, 8, 128, 255]);

// data2 = new TextEncoder().encode(data1);
data1 = new TextDecoder().decode(new Uint8Array(25*1024*1024));


function timeCheck(executable, name) {
    const time1 = performance.now();
    executable();
    console.log(name.toString().padEnd(12), (performance.now() - time1).toFixed(2).toString().padStart(8));
}

timeCheck(_=> console.log(blueimpMD5(data1)),                       "blueimpMD5");
timeCheck(_=> console.log(new CbMD5().update(data1).digest("hex")), "CbMD5");
timeCheck(_=> console.log(CryptoJS.MD5(data1).toString()),          "CryptoJS.MD5");
timeCheck(_=> console.log(JsMD5(data1)),                            "JsMD5");
timeCheck(_=> console.log(nodeMD5(data1)),                          "NodeMD5");
timeCheck(_=> console.log(SparkMD5.hash(data1)),                    "SparkMD5");


console.log();


/* blueimp MD5 does not support neither "ArrayBuffer", nor "Array<Number>", nor "BinaryString" */
console.log(new CbMD5().update(Buffer.from(data2)).digest("hex"));
console.log(CryptoJS.MD5(WordArray.create(data2)).toString());
console.log(JsMD5(data2));
console.log(nodeMD5(Buffer.from(data2)));
console.log(SparkMD5.ArrayBuffer.hash(data2));


console.log();


/* blueimp MD5 does not support `update` method */
console.log(new CbMD5().update(Buffer.from(data2)).update(Buffer.from(data2)).digest("hex"));
const CjsMD5 = CryptoJS.algo.MD5.create(); CjsMD5.update(WordArray.create(data2)); CjsMD5.update(WordArray.create(data2));
console.log(CjsMD5.finalize().toString());
console.log(JsMD5.create().update(data2).update(data2).hex());
/* pvorb/node-md5 does not support `update` method */
console.log(new SparkMD5.ArrayBuffer().append(data2).append(data2).end());