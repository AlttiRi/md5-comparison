import {appendFinally, css} from "./rollup-plugins.js";
import {rollup} from "rollup";
import vue from "rollup-plugin-vue";
import replace from "@rollup/plugin-replace";
import resolve from "@rollup/plugin-node-resolve";
import {minify as terser} from "terser";
import fs from "fs/promises";

export const dist = "../dist/";
export const filename = "index";
const input = `../src/${filename}.js`;


export const inputOptions = {
    input,
    plugins: [
        css(writeVueStyles),
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
    external: ["vue"], // I load it from CDN
};

/**
 * @type {import("rollup").OutputOptions}
 */
export const outputOptions = {
    format: "iife",
    globals: {
        "vue": "Vue"
    },
    sourcemap: true,
};

export async function build(inputOptions, outputOptions, filename, dist) {
    const {code, map} = await bundle(inputOptions, outputOptions);
    const written = write(code, map, filename + ".js", dist);

    const {code: codeMin, map: mapMin} = await minify(code, map, filename);
    const writtenMin = write(codeMin, mapMin, filename + ".min.js", dist);

    return Promise.all([written, writtenMin]);
}

/** @returns {Promise<{code: String, map: import("rollup").SourceMap}>} */
export async function bundle(inputOptions, outputOptions) {
    const bundle = await rollup(inputOptions);
    const result = await bundle.generate(outputOptions);

    /** @type {String} */
    const code = result.output[0].code;
    /** @type {import("rollup").SourceMap} */
    const map = result.output[0].map;

    return {code, map};
}

/** @returns {Promise<{code: String, map: import("terser").RawSourceMap}>} */
export async function minify(code, map, filename) {
    /** @type {import("terser").MinifyOptions} */
    const options = {
        sourceMap: {
            content: map,
            url: filename + ".min.js.map",
            includeSources: true,
        },
        compress: false,
        mangle: true
    };

    /** @type {{code: string, map: string}} */
    const result = await terser(code, options);
    return {
        code: result.code,
        map: JSON.parse(result.map)
    };
}

/**
 *
 * @param {String} cssBundle
 * @param {Map<String, String>} stylesMap
 * @param meta
 * @returns {Promise<void>}
 */
async function writeVueStyles(cssBundle, stylesMap, meta) {
    const styleBunch = [...stylesMap.values()]
        .filter(text => text.trim())
        .map(text => {
            if (text.includes("sourceMappingURL")) {
                const style = text.match(/[\s\S]+(?=\/\*# sourceMappingURL)/)[0];
                const filename = text.match(/(?<=\/\*# sourceMappingURL=).+(?=\.map \*\/)/)[0];
                return "/* " + filename + " */\n" + style;
            }
            return text;
        })
        .reduce((pre, acc) => pre + acc, "");
    await write(styleBunch, null, `style.css`, dist);
}

export async function write(code, map, name, dist) {
    await fs.mkdir(dist, {recursive: true});
    await fs.writeFile(`${dist}${name}`, code);
    if (map) {
        await fs.writeFile(`${dist}${name}.map`, JSON.stringify(map));
    }
}

export function sourceMappingURL(name, ext = "js") {
    return `\n//# sourceMappingURL=${name}.${ext}.map`
}