const state = () => ({
    storeInMemory: false,
    streamType: "FileReader",
    readerChunkSizeMB: 2,
    animation: true,
    fps: 25,
});

const mutations = {
    storeInMemory(state, storeInMemory) {
        state.storeInMemory = storeInMemory;
    },
    streamType(state, streamType) {
        state.streamType = streamType;
    },
    readerChunkSizeMB(state, readerChunkSizeMB) {
        state.readerChunkSizeMB = readerChunkSizeMB;
    },
    animation(state, animation) {
        state.animation = animation;
    },
    fps(state, fps) {
        state.fps = fps;
    },
};

const getters = {
    readerChunkSize(state, getters) {
        return Math.trunc(Number(state.readerChunkSizeMB) * 1024 * 1024);
    },
};

export default {
    namespaced: true,
    state,
    mutations,
    getters
}