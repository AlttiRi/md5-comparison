import {appendFinally, css} from "./rollup-plugins.js";
import vue from "rollup-plugin-vue";
import replace from "@rollup/plugin-replace";
import resolve from "@rollup/plugin-node-resolve";
import {sourceMappingURL, getVueStylesWriter} from "./common.js";

export const dist = "../static/dist/";
export const filename = "index";
const input = `../src/${filename}.js`;

/** @type {import("rollup").InputOptions} */
export const inputOptions = {
    input,
    plugins: [
        css(getVueStylesWriter("style.css", dist)),
        vue({
            css: false,
            needMap: true,
        }),
        replace({
            "process.env.NODE_ENV": "\"production\"" // or "develop" // needed only if you bundle Vue in
        }),
        resolve({
            browser: true
        }),
        appendFinally(sourceMappingURL(filename))
    ],
    external: ["vue", "vuex"], // I load it from CDN
};

/** @type {import("rollup").OutputOptions} */
export const outputOptions = {
    format: "iife",
    globals: {
        "vue": "Vue",
        "vuex": "Vuex"
    },
    sourcemap: true,
};

export const pathsMapping = [
    ["../node_modules/", "node-modules:///"],
    ["../", "source-maps:///"],
];