import {inputOptions, outputOptions, filename, dist} from "./settings.js";
import {build} from "./common.js";

export async function bundle(skipMinifying = false) {
    await build(inputOptions, outputOptions, filename, dist, skipMinifying);
}

!async function main() {
    console.time("build");
    await bundle();
    console.timeEnd("build");
}();