<template>
  <div class="main-container-component">
    <div class="inputs">
      <div class="text-input">
        <div class="textarea-wrapper"
             :class="{'selected-input': activeInputType === 'text'}">
          <textarea placeholder="Type a text here" v-model="inputText"/>
        </div>
      </div>
      <div class="file-group">
        <FileInputDragNDrop
            :class="{'selected-input': activeInputType === 'file'}"
            ref="fileInputComponent"
            @file-input-change="onFileInputChange"
            :file="inputFile"
        ></FileInputDragNDrop>

        <div class="settings"
             :class="{inactive: activeInputType !== 'file'}">
          <div class="store-in-memory">
            <label>
              <input type="checkbox"
                     v-model="storeInMemory"
              > Store in memory {{ binaryLoading ? ' (loadings...)' : '' }}
              <span title="loaded in"
                    v-if="loadingToMemoryTime && storeInMemory && inputBinary !== null"
              >(<FormattedNumber :number="loadingToMemoryTime"/> ms)</span>
            </label>
          </div>

          <div class="stream-type">
            <div :style="{opacity: storeInMemory ? 0.5 : 1}">
              <label><input type="radio" name="streamType" value="FileReader"
                            v-model="streamType"
              > FileReader</label>
              <label><input type="radio" name="streamType" value="ReadableStream"
                            v-model="streamType"
              > ReadableStream</label>
            </div>
            <label title="Chunk size for progressive hashing, Megabytes"
                   :style="{opacity: streamType === 'ReadableStream' && !storeInMemory ? 0.5 : 1}"
            >Chunk size, MB
              <input type="number" min="0.1" step="0.1"
                     v-model="readerChunkSizeMB"
                     :class="{invalid: readerChunkSize < 1}"
                     :title="readerChunkSize > 0 ? '' : 'Value must be greater than or equal to 1 byte'"
              ></label>
          </div>
          <div class="animation">
            <span class="checkbox">
              <label><input type="checkbox" v-model="animation"> Animation, </label>
            </span>
            <span class="fps" :style="{opacity: animation ? 1 : 0.5}">
              <label>FPS <input type="number" v-model="fps"></label>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="input-switch">
      <div class="switch-line">
        Input:
        <label>
          <input type="radio" name="input" value="text" v-model="activeInputType"> Text</label>
        <label>
          <input type="radio" name="input" value="file" v-model="activeInputType"> File</label>
        <label
            class="input-switch-checkbox"
            title="Switch the input type automatically based on the corresponding input change">
          <input type="checkbox" v-model="activeInputTypeAutoSwitcher"> Auto-Switch</label>
      </div>
      <div class="input-info">Input size:
        <span class="red" v-if="activeInputType === 'file' && inputFile === null">no file selected</span>
        <span v-else><formatted-number :number="inputByteSize"/> bytes</span>
      </div>
    </div>

    <div class="items">
      <HasherItem
          v-for="(hasher, index) of hashers"
          :hasher="hasher"
          :key="index"
          :input="input"
          :settings="{
            fps,
            animation,
            readerChunkSize,
            streamType,
            loadingToMemoryTime
          }"
          ref="items"
      ></HasherItem>
    </div>

    <div class="interface">
      <button @click="computeAll">Compute all</button>
      <!-- <button @click="clearInputData">Clear input data</button>-->
      <!-- <button @click="clearInputText">Clear input text</button>-->
    </div>
  </div>
</template>

<script>
import HasherItem from "./HasherItem.vue";
import FileInputDragNDrop from "./FileInputDragNDrop.vue";
import FormattedNumber from "./FormattedNumber.vue";
import {bus} from "./bus.js";
import * as Util from "../util.js";
import MD5 from "../md5-provider.js";

export default {
  name: "MainContainer",
  components: {
    HasherItem,
    FileInputDragNDrop,
    FormattedNumber
  },
  data() {
    return {
      inputText: "",
      inputFile: null,
      inputBinary: null,
      storeInMemory: false,
      binaryLoading: false,
      loadingToMemoryTime: 0,
      streamType: "FileReader",
      animation: true,
      fps: 25,
      readerChunkSizeMB: 2,
      activeInputType: "text",
      activeInputTypeAutoSwitcher: true,
    }
  },
  computed: {
    inputByteSize() {
      if (this.activeInputType === "text") {
        return new TextEncoder().encode(this.inputText).byteLength;
      }
      if (this.activeInputType === "file" && this.inputFile) {
        return this.inputFile.size/* || this.inputBinary.byteLength*/;
      }
      return 0;
    },
    hashers() {
      return MD5.list;
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
    inputFile() {
      if (this.activeInputTypeAutoSwitcher) {
        this.activeInputType = "file";
      }
      bus.$emit("input-changed");
      this.updateInputBinary();
    },
    inputText() {
      if (this.activeInputTypeAutoSwitcher) {
        this.activeInputType = "text";
      }
      bus.$emit("input-changed");
    },
    activeInputType() {
      bus.$emit("input-changed");
    },
    storeInMemory() {
      this.updateInputBinary();
    },
  },
  methods: {
    async computeAll() {
      bus.$emit("input-changed"); // todo rename
      for (const item of this.$refs.items) {
        await item.compute();
        await new Promise(resolve => Util.setImmediate(resolve));
      }
    },
    clearInputData() {
      this.inputFile = null;
      this.inputBinary = null;
    },
    clearInputText() {
      this.inputText = "";
    },
    async onFileInputChange(file) {
      this.inputFile = file;
    },
    async updateInputBinary() {
      // load file to the memory
      if (this.storeInMemory && this.inputFile) {
        this.loadingToMemoryTime = null;
        this.binaryLoading = true;
        const now = performance.now();
        this.inputBinary = await this.inputFile.arrayBuffer();                                 // [1]
        /* just to compare arrayBuffer() with FileReader */
        // this.inputBinary = await (Util.iterateBlob1(this.inputFile, 1024**4).next()).value; // [2]
        this.loadingToMemoryTime = performance.now() - now;
        this.binaryLoading = false;
      } else {
        this.inputBinary = null;
      }
    }
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

    .text-input {
      display: flex;
      align-self: stretch;
      box-sizing: border-box;
      .textarea-wrapper {
        border: solid 1px var(--textarea-wrapper-border);
        box-sizing: border-box;
        textarea {
          width: 310px;
          box-sizing: border-box;
          display: block;
          height: 100%;
          border: 0;
          outline: none;
          min-height: 100px;
          padding: 5px;
          font-size: 17px;
          &:focus::placeholder {
            opacity: 0;
            transition: opacity 0.25s ease;
          }
        }
      }
    }

    .file-group {
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;

      > div {
        width: 312px;
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

          &.invalid {
            border: 2px solid var(--red);
            outline: none;
            box-shadow: 0px 0px 1px 0px var(--red);
          }
        }

        .stream-type input {
          margin: 4px;
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
  .main-container-component .inputs .text-input .textarea-wrapper textarea {
    width: 630px;
  }
}

@media all and (min-width: 960px) {
  .main-container-component .inputs > * {
    margin-left: 4px;
    margin-right: 4px;
  }
}
</style>