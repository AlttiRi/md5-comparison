import {build, minify, sourceMappingURL, write} from "./common.js";
import {dist as _dist} from "./settings.js";
import {appendFinally} from "./rollup-plugins.js";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import browserify from "browserify";

/** @returns {import("rollup").InputOptions} */
function getInputOptions(input, filename) {
    return {
        input,
        plugins: [
            commonjs(),
            resolve({
                browser: true,
            }),
            appendFinally(sourceMappingURL(filename))
        ]
    }
}

/** @type {import("rollup").OutputOptions} */
const outputOptions = {
    format: "iife",
    sourcemap: true
};


!async function main() {
    const promises = [];

    const dist = _dist + "./vendor/";
    const hashers = ["js-md5", "spark-md5", "blueimp-md5", "cryptojs-md5"];

    for (const hasher of hashers) {
        const input = `../vendor/exposes/${hasher}.es.js`;
        const filename = `${hasher}.rolluped`;

        console.log(`[${hasher}]`);
        const done = await build(getInputOptions(input, filename), outputOptions, filename, dist);
        promises.push(done);
    }

    const hashers2 = ["cb-md5", "node-md5"];

    for (const hasher of hashers2) {
        const input = `../vendor/exposes/${hasher}.cjs.js`;
        const filename = `${hasher}.browserified`;

        console.log(`[${hasher}]`);
        const bs = browserify(input, {debug: true});
        const output = await new Promise(resolve => bs.bundle((error, body) => resolve(body.toString())));

        const sourceMappingString = "//# sourceMappingURL=data:application/json;charset=utf-8;base64,"
        const offset = output.lastIndexOf(sourceMappingString);
        const mapBase64 = output.substring(offset + sourceMappingString.length);

        const map = JSON.parse(Buffer.from(mapBase64, "base64").toString("binary"));
        const code = output.substring(0, offset) + sourceMappingURL(filename);

        const written = write(code, map, filename + ".js", dist);

        const {code: codeMin, map: mapMin} = await minify(code, map, filename);
        const writtenMin = write(codeMin, mapMin, filename + ".min.js", dist);

        promises.push(written, writtenMin);
    }

    await Promise.all(promises);
}();