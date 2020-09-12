<template lang="pug">
div.main-container-component
  MemoryConsuming
  div.inputs
    div.text-input-wrapper
      TextInput(:class="{'selected-input': activeInputType === 'text'}")
    div.file-group
      FileInputDragNDrop(
          :class="{'selected-input': activeInputType === 'file'}"
          ref="fileInputComponent")
      FileSettings(:class="{inactive: activeInputType !== 'file'}")
  InputSwitch
  div.items
    HasherItem(
        v-for="(hasher, index) of hashers"
        :hasher="hasher"
        :key="index"
        :input="input"
        ref="items")
  div.interface
    button(@click="computeAll")
      | Compute all
</template>

<script>
import HasherItem from "./HasherItem.vue";
import FileInputDragNDrop from "./FileInputDragNDrop.vue";
import TextInput from "./TextInput.vue";
import InputSwitch from "./InputSwitch.vue";
import FormattedNumber from "./FormattedNumber.vue";
import MemoryConsuming from "./MemoryConsuming.vue";
import FileSettings from "./FileSettings.vue";

import {bus} from "./bus.js";
import * as Util from "../util.js";
import MD5 from "../md5-provider.js";
import {mapState} from "vuex";

export default {
  name: "MainContainer",
  data() {
    return {
      hashers: MD5.list
    }
  },
  computed: {
    ...mapState("input", {
      inputText: state => state.text,
      inputFile: state => state.file,
      inputBinary: state => state.binary
    }),

    ...mapState("input-switch", {
      activeInputType: state => state.activeInputType
    }),

    input() {
      if (this.activeInputType === "file") {
        return this.inputBinary || this.inputFile;
      } else if (this.activeInputType === "text") {
        return this.inputText;
      }
    }
  },
  methods: {
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
    InputSwitch,
    MemoryConsuming,
    FileSettings
  }
};
</script>

<style lang="scss" scoped>
.main-container-component::v-deep .formatted-number .trio > .padded {
  letter-spacing: 4px;
}

.main-container-component {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  .inputs {
    margin-top: 12px;
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;

    > * {
      margin: 4px 0;
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
    }
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