import {build} from "./common.js";

!async function main() {
    console.time("build");
    await build();
    console.timeEnd("build");
}();