<template lang="pug">
div.main-container-component
  div.inputs
    div.text-input-wrapper
      TextInput(:class="{'selected-input': activeInputType === 'text'}")
    div.file-group
      FileInputDragNDrop(
          :class="{'selected-input': activeInputType === 'file'}"
          ref="fileInputComponent")

      div.settings(:class="{inactive: activeInputType !== 'file'}")
        div.store-in-memory
          label
            input(type="checkbox" v-model="storeInMemory")
            | Store in memory {{ binaryLoading ? ' (loadings...)' : '' }}
            span(title="loaded in" v-if="loadingToMemoryTime && storeInMemory && inputBinary !== null")
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

  div.input-switch
    div.switch-line
      | Input:
      label
        input(type="radio" name="input" value="text" v-model="activeInputType")
        | Text
      label
        input(type="radio" name="input" value="file" v-model="activeInputType")
        | File
      label(
          class="input-switch-checkbox"
          title="Switch the input type automatically based on the corresponding input change")
        input(type="checkbox" v-model="activeInputTypeAutoSwitcher")
        | Auto-Switch
    div.input-info
      | Input size:
      |
      span(class="red" v-if="activeInputType === 'file' && inputFile === null")
        | no file selected
      span(v-else)
        FormattedNumber(:number="inputByteSize")
        |
        | bytes

  div.items
    HasherItem(
        v-for="(hasher, index) of hashers"
        :hasher="hasher"
        :key="index"
        :input="input"
        :settings=`{
          fps,
          animation,
          readerChunkSize,
          streamType,
          loadingToMemoryTime
        }`
        ref="items")

  div.interface
    button(@click="computeAll")
      | Compute all
</template>

<script>
import HasherItem from "./HasherItem.vue";
import FileInputDragNDrop from "./FileInputDragNDrop.vue";
import TextInput from "./TextInput.vue";
import FormattedNumber from "./FormattedNumber.vue";
import {bus} from "./bus.js";
import * as Util from "../util.js";
import MD5 from "../md5-provider.js";
import {mapActions, mapMutations, mapState, mapGetters} from "vuex";

export default {
  name: "MainContainer",
  data() {
    return {
      hashers: MD5.list,
      storeInMemory: false,
      streamType: "FileReader",
      animation: true,
      fps: 25,
      readerChunkSizeMB: 2,
      activeInputType: "text",
      activeInputTypeAutoSwitcher: true,
    }
  },
  computed: {
    ...mapState("input", {
      inputText: state => state.text,
      inputFile: state => state.file,
      inputBinary: state => state.binary,

      binaryLoading: state => state.binaryLoading,
      loadingToMemoryTime: state => state.loadingToMemoryTime,
    }),
    ...mapGetters("input", ["textByteSize", "fileByteSize"]),

    // loadingToMemoryTime: {
    //   set(value) { this.$store.commit("input/loadingToMemoryTime", value); },
    //   get() { return this.$store.state["input"].loadingToMemoryTime; }
    // },

    inputByteSize() {
      if (this.activeInputType === "text") {
        return this.textByteSize;
      }
      if (this.activeInputType === "file" && this.inputFile) {
        return this.fileByteSize;
      }
      return 0;
    },
    input() {
      if (this.activeInputType === "file") {
        return this.inputBinary || this.inputFile;
      } else if (this.activeInputType === "text") {
        return this.inputText;
      }
    },
    readerChunkSize() {
      return Math.trunc(Number(this.readerChunkSizeMB) * 1024 * 1024);
    },
  },
  watch: {
    async storeInMemory() {
      if (this.storeInMemory) {
        if (this.inputFile) {
          await this.initBinary();
        }
      } else {
        this.clearBinary();
      }
    },
    async inputFile() {
      if (this.activeInputTypeAutoSwitcher) {
        this.activeInputType = "file";
      }
      if (this.activeInputType === "file") {
        bus.$emit("input-changed");
      }

      if (this.storeInMemory) {
        if (this.inputFile) {
          await this.initBinary();
        } else {
          this.clearBinary();
        }
      }
    },

    inputText() {
      if (this.activeInputTypeAutoSwitcher) {
        this.activeInputType = "text";
      }
      if (this.activeInputType === "text") {
        bus.$emit("input-changed");
      }
    },
    activeInputType() {
      bus.$emit("input-changed");
    },
  },
  methods: {
    ...mapActions("input", ["initBinary"]),
    ...mapMutations("input", ["clearBinary"]),
    async computeAll() {
      bus.$emit("input-changed"); // todo rename
      for (const item of this.$refs.items) {
        await item.compute();
        await new Promise(resolve => Util.setImmediate(resolve));
      }
    },
  },
  components: {
    TextInput,
    FileInputDragNDrop,
    FormattedNumber,
    HasherItem,
  }
};
</script>

<style lang="scss" scoped>
.main-container-component::v-deep .formatted-number .trio > .padded {
  letter-spacing: 4px;
}

.main-container-component {
  display: flex;
  flex-direction: column;
  align-items: center;

  .inputs {
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;

    > * {
      margin: 4px 0px;
    }

    .selected-input {
      border: solid 1px var(--selected-input-border);
      box-sizing: border-box;
      box-shadow: 0 0 10px var(--selected-input-box-shadow);
    }

    .text-input-wrapper {
      display: flex;
      align-self: stretch;
      width: 312px;
    }

    .file-group {
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;

      > div {
        width: 312px;
        min-height: 6em;
      }

      .settings {
        width: 320px;
        padding: 6px 8px;
        box-sizing: border-box;

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
            box-shadow: 0px 0px 1px 0px var(--red);
          }
        }
      }
    }
  }

  .input-switch {
    padding: 6px;
    margin-top: 12px;
    margin-bottom: 24px;
    > * {
      padding: 0px 2px;
    }
    > div {
      padding-bottom: 6px;
    }

    .input-switch-checkbox {
      opacity: 0;
      transition: opacity 0.4s ease;
      &:hover {
        opacity: 1;
        transition: opacity 0.25s ease;
      }
    }
  }

  .red {
    color: var(--red);
  }

  .items {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
  }

  .interface {
    display: flex;
    justify-content: center;
    margin: 4px;
  }
}

/* scrollbar breaks it a bit for 961px - 974px */
/* todo use grid */
@media all and (min-width: 640px) and (max-width: 960px) {
  .main-container-component .inputs .text-input-wrapper {
    width: 632px;
  }
}

@media all and (min-width: 960px) {
  .main-container-component .inputs > * {
    margin-left: 4px;
    margin-right: 4px;
  }
}
</style>