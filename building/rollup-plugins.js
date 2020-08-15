import MagicString from "magic-string";

// It's used to append `//# sourceMappingURL=name.js.map`
export function appendFinally(text) {
    return {
        name: "append-text-before-end",
        renderChunk(code, chunkInfo, outputOptions) {
            if (!code) {
                return null;
            }

            const magicString = new MagicString(code);
            magicString.append(text);
            code = magicString.toString();
            const map = magicString.generateMap({
                hires: true,
                includeContent: true,
            });
            return {code, map};
        }
    };
}

// "rollup-plugin-css-only@2.1.0" works with some bugs
// (when `input` field of Rollup's `inputOptions` contains `../`)
// So I wrote this plugin:
export function css(handler) {
    const stylesMap = new Map();
    return {
        name: "css-singe-file",
        /**
         * @param {String} code
         * @param {String} id - full filepath
         * @returns {string|null}
         */
        transform(code, id) {
            if (!id.match(/\.css$/)) {
                return null;
            }
            stylesMap.set(id, code);
            return "";
        },
        /**
         * @param {import("rollup").NormalizedOutputOptions} options
         * @param {import("rollup").OutputBundle} bundle
         * @param {Boolean} isWrite
         */
        generateBundle(options, bundle, isWrite) {
            const css = [...stylesMap.values()].reduce((pre, cur) => pre + cur, "");
            handler(css, stylesMap, bundle);
        }
    }
}
