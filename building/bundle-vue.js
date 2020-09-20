import {bundleVue} from "./bundles.js";

!async function main() {
    console.time("build-vue");
    await bundleVue();
    console.timeEnd("build-vue");
}();