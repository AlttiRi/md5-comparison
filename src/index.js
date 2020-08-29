import Vue from "vue";
import store from "./store.js";

import MainContainer from "./components/MainContainer.vue";

new Vue({
    store,
    render: createElement => createElement(MainContainer),
}).$mount("#app");
