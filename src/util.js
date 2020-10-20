export const setImmediate = /*#__PURE__*/ (function() {
    const {port1, port2} = new MessageChannel();
    const queue = [];

    port1.onmessage = function() {
        const callback = queue.shift();
        callback();
    };

    return function(callback) {
        port2.postMessage(null);
        queue.push(callback);
    };
})();


export async function * iterateReadableStream(stream) {
    const reader = stream.getReader();
    while (true) {
        const {done, /** @type {Uint8Array} */ value} = await reader.read();
        if (done) {
            break;
        }
        yield value;
    }
}

// chunkSize is 65536, ReadableStream uses the same size.
// There is no speed difference between using of different the chunk's sizes.
export function * iterateArrayBuffer(arrayBuffer, chunkSize = 65536) {
    const buffer = new Uint8Array(arrayBuffer);
    let index = 0;
    while (true) {
        const chunk = buffer.subarray(index, index + chunkSize);
        if (!chunk.length) {
            break;
        }
        yield chunk;
        index += chunkSize;
    }
}

// Iterate Blob (or File)
// Note: `chunkSize` affects the execution speed
// It works with the same speed in Chromium, but a bit faster in Firefox (in comparison with `iterateBlob_v1`)
export function * iterateBlob(blob, chunkSize = 2 * 1024 * 1024) {
    let index = 0;
    while (true) {
        const blobChunk = blob.slice(index, index + chunkSize);
        if (!blobChunk.size) {break;}

        yield read(blobChunk);
        index += chunkSize;
    }

    async function read(blob) {
        return new Uint8Array(await blob.arrayBuffer());
    }
}

export function * iterateBlob_v1(blob, chunkSize = 2 * 1024 * 1024) {
    let index = 0;
    const reader = new FileReader();

    while (true) {
        const blobChunk = blob.slice(index, index + chunkSize);
        if (!blobChunk.size) {break;}

        yield read(blobChunk);
        index += chunkSize;
    }

    async function read(blob) {
        reader.readAsArrayBuffer(blob);
        /** @type {ArrayBuffer} */
        const result = await new Promise(resolve => {
            reader.onload = () => resolve(reader.result);
        });
        return new Uint8Array(result);
    }
}

export function isArrayBuffer(data) {
    return data instanceof ArrayBuffer;
}
export function isBinary(data) {
    return isArrayBuffer(data) || ArrayBuffer.isView(data);
}
export function isString(data) {
    return typeof data === "string" || data instanceof String;
}
export function isBlob(data) { // is it Blob or File
    return data instanceof Blob;
}


export function secondsToFormattedString(seconds) {
    const date = new Date(seconds * 1000);

    // Adds zero padding
    function pad(str) {
        return str.toString().padStart(2, "0");
    }

    return date.getFullYear() + "." + pad(date.getMonth() + 1) + "." + pad(date.getDate()) + " " +
        pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
}


export function bytesToSize(bytes, decimals = 2) {
    if (bytes === 0) {
        return "0 B";
    }
    const k = 1024;
    decimals = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
}