const state = () => ({
    activeInputType: "text",
    activeInputTypeAutoSwitcher: true
});

const mutations = {
    activeInputType(state, activeInputType) {
        state.activeInputType = activeInputType;
    },
    activeInputTypeAutoSwitcher(state, activeInputTypeAutoSwitcher) {
        state.activeInputTypeAutoSwitcher = activeInputTypeAutoSwitcher;
    }
};

export default {
    namespaced: true,
    state,
    mutations
}