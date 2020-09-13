<template lang="pug">
div.file-settings-component
  div.store-in-memory
    label
      input(type="checkbox" v-model="storeInMemory")
      | Store in memory
      |
      span(v-if="error" :title="error.name + ': ' + error.message" class="red")
        | (error...)
      span(v-else-if="binaryLoading")
        | (loadings...)
      span(title="loaded in" v-else-if="loadingToMemoryTime && storeInMemory")
        | (
        FormattedNumber(:number="loadingToMemoryTime")
        |
        | ms)

  div.stream-type
    div(:style="{opacity: storeInMemory ? 0.5 : 1}")
      label
        input(type="radio" name="streamType" value="FileReader" v-model="streamType")
        | FileReader
      label
        input(type="radio" name="streamType" value="ReadableStream" v-model="streamType")
        | ReadableStream

    label(
      title="Chunk size for progressive hashing, Megabytes"
      :style="{opacity: streamType === 'ReadableStream' && !storeInMemory ? 0.5 : 1}")
      | Chunk size, MB
      input(
        type="number" min="0.1" step="0.1"
        v-model="readerChunkSizeMB"
        :class="{invalid: readerChunkSize < 1}"
        :title="readerChunkSize > 0 ? '' : 'Value must be greater than or equal to 1 byte'")

  div.animation
    span.checkbox
      label
        input(type="checkbox" v-model="animation")
        | Animation,
        |
    span.fps(:style="{opacity: animation ? 1 : 0.5}")
      label
        | FPS
        input(type="number" v-model="fps")
</template>

<script>
import {mapState, mapGetters} from "vuex";
import FormattedNumber from "./FormattedNumber.vue";

export default {
  name: "FileSettings",
  computed: {
    ...mapState("input", {
      loadingToMemoryTime: state => state.loadingToMemoryTime,
      binaryLoading: state => state.binaryLoading,
      error: state => state.error,
    }),

    ...mapGetters("file-settings", ["readerChunkSize"]),
    storeInMemory: {
      get() { return this.$store.state["file-settings"].storeInMemory; },
      set(value) { this.$store.commit("file-settings/storeInMemory", value); }
    },
    streamType: {
      get() { return this.$store.state["file-settings"].streamType; },
      set(value) { this.$store.commit("file-settings/streamType", value); }
    },
    readerChunkSizeMB: {
      get() { return this.$store.state["file-settings"].readerChunkSizeMB; },
      set(value) { this.$store.commit("file-settings/readerChunkSizeMB", value); }
    },
    animation: {
      get() { return this.$store.state["file-settings"].animation; },
      set(value) { this.$store.commit("file-settings/animation", value); }
    },
    fps: {
      get() { return this.$store.state["file-settings"].fps; },
      set(value) { this.$store.commit("file-settings/fps", value); }
    }
  },
  watch: {
    error() {
      if (this.error) {
        this.storeInMemory = false;
      }
    },
  },
  components: {
    FormattedNumber
  }
}
</script>

<style lang="scss" scoped>
.file-settings-component {
  padding: 6px 4px;
  box-sizing: border-box;
  margin: 0 4px;

  &.inactive {
    opacity: 0.5;
  }

  > * {
    margin: 6px;
  }

  input[type="number"] {
    max-width: 42px;
    margin-left: 4px;
    margin-top: 4px;

    &.invalid {
      border: 2px solid var(--red);
      outline: none;
      box-shadow: 0 0 1px 0 var(--red);
    }
  }
}

.red {
  color: var(--red);
}
</style>