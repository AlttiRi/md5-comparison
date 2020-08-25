import {watch} from "rollup";
import {build, write} from "./common.js";
import {inputOptions, outputOptions} from "./settings.js";

const watchOptions = {
    ...inputOptions,
    // output: [outputOptions],
    watch: {
        skipWrite: true,
    }
};


const watcher = watch(watchOptions);

// damn this unfixed bug
// https://github.com/vuejs/rollup-plugin-vue/issues/238
// "Multiple conflicting contents for sourcemap source" error
// forces me to use the whole `build` function

watcher.on("event", async event => {
    if (event.code === "START") {
        console.time("rebuilt");
        await build();
        console.timeEnd("rebuilt");
    }
});

// UnhandledPromiseRejectionWarning: Error: Multiple conflicting contents for sourcemap source
// watcher.on("event", async event => {
//     console.log(event);
//     if (event.code === "BUNDLE_END") {
//         const res = await event.result.generate(outputOptions);
//         await write(res.output[0].code, res.output[0].map, "index.js");
//     }
// });



// event.code:
//   START        — the watcher is (re)starting
//   BUNDLE_START — building an individual bundle
//   BUNDLE_END   — finished building a bundle
//   END          — finished building all bundles
//   ERROR        — encountered an error while bundling