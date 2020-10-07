const worker = (function() {
    if (globalThis.document) { // if it is not worker
        return new Worker("md5.js");
    } else {
        globalThis.addEventListener("message", async function({data}) {
            const hasher = MD5.byId(data.id)
            if (!hasher.workerInitialised) {
                await hasher.workerInit();
            }
            const result = hasher.hash(data.data);
            console.log(result);

            globalThis.postMessage({result});
            //globalThis.postMessage({result, buffer: data.data}, [data.data]); // send buffer back
        });
        return null;
    }
})();
console.log(worker);


/**
 * A normalised hasher
 * @abstract
 */
class Hasher {
    static binarySupported = true;
    static updateSupported = true;
    static githubName = null;
    static scriptName = null;
    static initialised = false;
    static workerInitialised = false;
    static worker = worker;

    static get id() {
        return this.githubName;
    }
    static async init(min = true) {
        const scriptSrc = "./dist/vendor/" + this.scriptName + (min ? ".min" : "") + ".js";
        await appendScript(scriptSrc);
        this.initialised = true;
    }
    static async workerInit() {
        const scriptSrc = "./dist/vendor/" + this.scriptName + ".min.js";
        await importScripts(scriptSrc);
        this.workerInitialised = true;
    }

    /** @abstract */
    static _hash(data) {
        throw "Not implemented";
    }
    static hash(data, useWorker = true) {
        if (useWorker && this.worker) {
            return this.workerHash(data);
        }
        return this._hash(data);
    }
    static workerHash(data) {
        console.log("data:", data);
        if (isBinary(data)) {
            const buffer = ArrayBuffer.isView(data) ? data.buffer : data;
            console.log("buffer:", data);
            this.worker.postMessage({
                id: this.id,
                data: buffer
            }, [buffer]);
        } else {
            this.worker.postMessage({
                id: this.id,
                data
            });
        }
        return new Promise(resolve => {
            this.worker.onmessage = event => resolve(event.data.result);
        });
    }

    /** @abstract */
    static getInstance(useWorker = true) {
        throw "Not implemented";
    }

    // /** @abstract */
    // _update(data) {
    //     throw "Not implemented";
    // }
    // update(data, useWorker = true) {
    //     if (useWorker && this.worker) {
    //         return this._update(data);
    //     }
    //     return this._update(data);
    // }
}

//todo
// https://stackoverflow.com/questions/1655769/fastest-md5-implementation-in-javascript
// -
// https://github.com/gorhill/yamd5.js/blob/master/yamd5.js
// -
// http://pajhome.org.uk/crypt/md5/md5.html
// -
// http://www.myersdaily.org/joseph/javascript/md5-text.html
// http://www.myersdaily.org/joseph/javascript/md5.js
// -
// https://github.com/cotag/ts-md5


class HasherBlueimp extends Hasher {
    static githubName = "blueimp/JavaScript-MD5";
    static scriptName = "blueimp-md5.rolluped";
    static binarySupported = false;
    static updateSupported = false;
    static _hash(data) {
        if (!isString(data)) {
            throw new TypeError("Data must be a string");
        }
        return blueimpMD5(data);
    }
}

class HasherCryptoJS extends Hasher {
    static githubName = "brix/crypto-js";
    static scriptName = "cryptojs-md5.rolluped";

    /** @private */
    constructor() {
        super();
        this.hasher = CryptoJS.algo.MD5.create();
    }

    static getInstance(useWorker = true) {
        return new HasherCryptoJS();
    }

    static _consumize(data) {
        if (isString(data)) {
            return data;
        } else if (ArrayBuffer.isView(data) || isArrayBuffer(data)) {
            return CryptoJS.lib.WordArray.create(data);
        } else {
            throw new TypeError("Data must be a string or a buffer");
        }
    }

    update(data) {
        const _data = HasherCryptoJS._consumize(data);
        this.hasher.update(_data);
        return this;
    }

    finalize() {
        return this.hasher.finalize().toString();
    }

    static _hash(data) {
        const _data = HasherCryptoJS._consumize(data);
        return CryptoJS.MD5(_data).toString();
    }
}

class HasherCbMD5 extends Hasher {
    static githubName = "crypto-browserify/md5.js";
    static scriptName = "cb-md5.browserified";

    /** @private */
    constructor() {
        super();
        this.hasher = new CbMD5();
    }

    static getInstance(useWorker = true) {
        return new HasherCbMD5();
    }

    _consumize(data) {
        if (isString(data)) {
            return data;
        } else if (ArrayBuffer.isView(data) || isArrayBuffer(data)) {
            return Buffer.from(data);
        } else {
            throw new TypeError("Data must be a string or a buffer");
        }
    }

    update(data) {
        const _data = this._consumize(data);
        this.hasher.update(_data);
        return this;
    }

    finalize() {
        return this.hasher.digest("hex");
    }

    static _hash(data) {
        return new HasherCbMD5().update(data).finalize();
    }
}

class HasherJsMD5 extends Hasher {
    static githubName = "emn178/js-md5";
    static scriptName = "js-md5.rolluped";

    /** @private */
    constructor() {
        super();
        this.hasher = JsMD5.create();
    }

    static getInstance(useWorker = true) {
        return new HasherJsMD5();
    }

    update(data) {
        this.hasher.update(data);
        return this;
    }

    finalize() {
        return this.hasher.hex();
    }

    static _hash(data) {
        return JsMD5(data);
    }
}

class HasherNodeMD5 extends Hasher {
    static githubName = "pvorb/node-md5";
    static scriptName = "node-md5.browserified";
    static updateSupported = false;
    static _consumize(data) {
        if (isString(data)) {
            return data;
        } else if (ArrayBuffer.isView(data) || isArrayBuffer(data)) {
            return Buffer.from(data);
        } else {
            throw new TypeError("Data must be a string or a buffer");
        }
    }

    static _hash(data) {
        return nodeMD5(HasherNodeMD5._consumize(data));
    }
}

class HasherSparkMD5 extends Hasher {
    static githubName = "satazor/js-spark-md5";
    static scriptName = "spark-md5.rolluped";

    /** @private */
    constructor() {
        super();
        this.hasher = new SparkMD5.ArrayBuffer();
    }

    static getInstance(useWorker = true) {
        return new HasherSparkMD5();
    }

    static _consumize(data) {
        if (isString(data)) {
            return new TextEncoder().encode(data);
        }
        return data;
    }

    update(data) {
        const _data = HasherSparkMD5._consumize(data);
        this.hasher.append(_data);
        return this;
    }

    finalize() {
        return this.hasher.end();
    }

    static _hash(data) {
        const _data = HasherSparkMD5._consumize(data);
        return SparkMD5.ArrayBuffer.hash(_data);
    }
}


const MD5 = {};
Object.assign(MD5, {
    Blueimp: HasherBlueimp,
    CryptoJS: HasherCryptoJS,
    Browserify: HasherCbMD5,
    Emn178: HasherJsMD5,
    Node: HasherNodeMD5,
    Spark: HasherSparkMD5,
});

Object.defineProperty(MD5, "list", {
    get: function() {
        return Object.values(this);
    }
});
Object.defineProperty(MD5, "byId", {
    value: function(id) {
        return Object.values(this).find(el => el.id === id);
    }
});
globalThis.MD5 = MD5;

// === Util === //
function isArrayBuffer(data) {
    return data instanceof ArrayBuffer;
}
function isBinary(data) {
    return isArrayBuffer(data) || ArrayBuffer.isView(data);
}
function isString(data) {
    return typeof data === "string" || data instanceof String;
}
function appendScript(src) {
    return new Promise(resolve => {
        const script = document.createElement("script");
        script.onload = resolve;
        script.src = src;
        document.querySelector("head").append(script);
    });
}