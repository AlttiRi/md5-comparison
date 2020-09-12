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
        return state.file ? state.file.size : null; // `state.binary.byteLength` for binary
    },
};

const actions = {
    async setBinary({commit, state}, /** @type {File}*/ file) {
        commit("_binaryLoading", true);
        if (state.error) {
            commit("_clearError");
        }

        try {
            const now = performance.now();
            const binary = await file.arrayBuffer();                           // [1]
            /* just to compare arrayBuffer() with FileReader */
            // binary = await (Util.iterateBlob1(file, 1024**4).next()).value; // [2]

            commit("_binary", binary);
            commit("_loadingToMemoryTime", performance.now() - now);
        } catch (error) {
            // When there is not enough memory space:
            // DOMException:
            // The requested file could not be read, typically due to permission problems
            // that have occurred after a reference to a file was acquired.
            console.error(error);
            commit("_error", error);  // error.name === NotReadableError
        }
        commit("_binaryLoading", false);
    },
    async initBinary({dispatch, state}) {
        await dispatch("setBinary", state.file);
    },
    clearBinary({commit, state}) {
        if (state.binary) {
            commit("_binary", null);
            commit("_loadingToMemoryTime", null);
        }
    },

    setFile({commit, state}, file) {
        if (state.error) {
            commit("_clearError");
        }
        commit("_file", file);
    },
    clearFile({dispatch}) {
        dispatch("setFile", null);
    },
}

const mutations = {
    setText(state, text) {
        state.text = text;
    },
    clearText(state) {
        state.text = "";
    },

    _file(state, file) {
        state.file = file;
    },
    _binary(state, binary) {
        state.binary = binary;
    },
    _binaryLoading(state, binaryLoading) {
        state.binaryLoading = binaryLoading;
    },
    _loadingToMemoryTime(state, loadingToMemoryTime) {
        state.loadingToMemoryTime = loadingToMemoryTime;
    },

    _error(state, error) {
        state.error = error;
    },
    _clearError(state) {
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