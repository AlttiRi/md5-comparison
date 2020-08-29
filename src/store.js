import Vue from "vue";
import Vuex from "vuex";

import input from "./store/input.js";


Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        input
    },
    plugins: [logger]
});

function logger(store) {
    store.subscribe((mutation/*, state*/) => {
        console.log(mutation);
    });
}