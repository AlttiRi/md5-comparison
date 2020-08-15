import Vue from "vue";
import MainContainer from "./components/MainContainer.vue";

new Vue({
    render: createElement => createElement(MainContainer),
}).$mount("#app");
