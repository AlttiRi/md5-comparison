const state = () => ({
    /** @type {String} */
    text: "",
    /** @type {File} */
    file: null,
    /** @type {ArrayBuffer} */
    binary: null,
});

const getters = {};

const actions = {
    /**
     * @param state
     * @param {File} file
     */
    async setBinary({commit}, file) {
        const binary = await file.arrayBuffer();                                            // [1]
        /* just to compare arrayBuffer() with FileReader */
        // const binary == await (Util.iterateBlob1(this.inputFile, 1024**4).next()).value; // [2]
        commit("setBinary", binary);
    },
    async initBinary({dispatch, state}) {
        dispatch("setBinary", state.file);
    }
}

const mutations = {
    setText(state, text) {
        state.text = text;
    },
    clearText(state) {
        state.text = "";
    },

    setFile(state, file) {
        state.file = file;
    },
    clearFile(state) {
        state.file = null;
    },

    setBinary(state, binary) {
        state.binary = binary;
    },
    clearBinary(state) {
        state.binary = null;
    }
};


export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}