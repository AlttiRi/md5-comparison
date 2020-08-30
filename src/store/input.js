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
    loadingToMemoryTime: null,

    /** @type {DOMException} */
    error: null, // Loading file to memory error
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
    async setBinary({commit, state}, /** @type {File}*/ file) {
        commit("binaryLoading", true);
        commit("loadingToMemoryTime", null);

        if (state.error) {
            commit("resetError");
        }

        const now = performance.now();

        let binary;
        try {
            binary = await file.arrayBuffer();                                 // [1]
            /* just to compare arrayBuffer() with FileReader */
            // binary = await (Util.iterateBlob1(file, 1024**4).next()).value; // [2]
        } catch (error) {
            // When there is not enough memory space:
            // DOMException:
            // The requested file could not be read, typically due to permission problems
            // that have occurred after a reference to a file was acquired.
            console.error(error);
            commit("error", error);  // error.name === NotReadableError
        }
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
        state.binaryLoading = binaryLoading;
    },
    loadingToMemoryTime(state, loadingToMemoryTime) {
        state.loadingToMemoryTime = loadingToMemoryTime;
    },

    error(state, error) {
        state.error = error;
    },
    resetError(state) {
        state.error = null;
    }
};


export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}