import Vue from "vue";
import Vuex from "vuex";

import input from "./store/input.js";
import fileSettings from "./store/file-settings.js";
import inputSwitch from "./store/input-switch.js";
import * as Util from "./util.js";


Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        input,
        ["file-settings"]: fileSettings,
        ["input-switch"]: inputSwitch
    },
    plugins: [logger]
});

function logger(store) {
    store.subscribe((mutation/*, state*/) => {
        // to prevent the large memory leak
        if (Util.isBinary(mutation.payload)) {
            const binary = mutation.payload;

            if (Util.isArrayBuffer(binary)) {
                console.log({
                    type: mutation.type,
                    payload: "ArrayBuffer(" + binary.byteLength + ")",
                    payloadPreview: new Uint8Array(binary).slice(0, 1024).buffer
                });
            } else {
                const cellSize = binary.slice(0, 1).byteLength || 1; // if `length === 0`
                console.log({
                    type: mutation.type,
                    payload: binary[Symbol.toStringTag] + "(" + binary.length + ")",
                    payloadPreview: binary.slice(0, 1024 / cellSize)
                });
            }
        } else {
            console.log(mutation);
        }
    });
}