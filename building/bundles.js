import {build} from "./common.js";
import {dist, filename, inputOptions, outputOptions} from "./settings.js";

export async function bundleVue(skipMinifying = false) {
    await build(inputOptions, outputOptions, filename, dist, skipMinifying);
}