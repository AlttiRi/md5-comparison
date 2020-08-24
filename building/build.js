import {build, inputOptions, outputOptions, filename, dist} from "./common.js";

!async function main() {
    console.time("build");
    await build(inputOptions, outputOptions, filename, dist);
    console.timeEnd("build");
}();