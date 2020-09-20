import {rollup} from "rollup";
import {minify as terser} from "terser";
import fs from "fs/promises";
import {pathsMapping} from "./settings.js";


export async function build(inputOptions, outputOptions, filename, dist, skipMinifying) {
    const promises = [];
    const {code, map} = await bundle(inputOptions, outputOptions);
    const written = write(code, map, filename + ".js", dist);
    promises.push(written);

    if (!skipMinifying) {
        const {code: codeMin, map: mapMin} = await minify(code, map, filename);
        const writtenMin = write(codeMin, mapMin, filename + ".min.js", dist);
        promises.push(writtenMin);
    }

    return Promise.all(promises);
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

export function getVueStylesWriter(name, dist) {
    /**
     * @param {String} cssBundle
     * @param {Map<String, String>} stylesMap
     * @param meta
     * @returns {Promise<void>}
     */
    return async function writeVueStyles(cssBundle, stylesMap, meta) {
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
        await write(styleBunch, null, name, dist);
    }
}

export async function write(code, map, name, dist) {
    await fs.mkdir(dist, {recursive: true});
    await fs.writeFile(`${dist}${name}`, code);
    if (map) {
        let _map = changeSourceMapPaths(map);
        _map = JSON.stringify(_map);
        await fs.writeFile(`${dist}${name}.map`, _map);
    }
}

function changeSourceMapPaths(map) {
    function _beautify(str) {
        return pathsMapping.reduce((pre, [value, replacer]) => {
            return pre.replace(value, replacer)
        }, str);
    }
    for (let i = 0; i < map.sources.length; i++) {
        map.sources[i] = _beautify(map.sources[i]);
    }
    return map;
}

export function sourceMappingURL(name, ext = "js") {
    return `\n//# sourceMappingURL=${name}.${ext}.map`
}