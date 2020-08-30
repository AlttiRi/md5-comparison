import Vue from "vue";
import Vuex from "vuex";

import input from "./store/input.js";
// import fileSettings from "./store/file-settings.js";
import inputSwitch from "./store/input-switch.js";


Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        input,
        // ["file-settings"]: fileSettings,
        ["input-switch"]: inputSwitch
    },
    plugins: [logger]
});

function logger(store) {
    store.subscribe((mutation/*, state*/) => {
        console.log(mutation);
    });
}