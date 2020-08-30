const state = () => ({
    /** @type {String} */
    text: "",
    /** @type {File} */
    file: null,

    /** @type {ArrayBuffer} */
    binary: null,
    /** @type {Boolean} */
    binaryLoading: false,
    /** @type {Number} */
    loadingToMemoryTime: null
});

const getters = {
    textByteSize(state, getters) {
        return new TextEncoder().encode(state.text).byteLength;
    },
    fileByteSize(state, getters) {
        return state.file.size; // `state.binary.byteLength` for binary
    },
};

const actions = {
    /**
     * @param state
     * @param {File} file
     */
    async setBinary({commit}, file) {
        commit("binaryLoading", true);
        commit("loadingToMemoryTime", null);
        const now = performance.now();

        const binary = await file.arrayBuffer();                                            // [1]
        /* just to compare arrayBuffer() with FileReader */
        // const binary == await (Util.iterateBlob1(this.inputFile, 1024**4).next()).value; // [2]
        commit("setBinary", binary);

        commit("binaryLoading", false);
        commit("loadingToMemoryTime", performance.now() - now);
    },
    async initBinary({dispatch, state}) {
        await dispatch("setBinary", state.file);
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
    },

    binaryLoading(state, binaryLoading) {
        state.binary = binaryLoading;
    },
    loadingToMemoryTime(state, loadingToMemoryTime) {
        state.loadingToMemoryTime = loadingToMemoryTime;
    },
};


export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}