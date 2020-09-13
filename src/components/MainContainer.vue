<template lang="pug">
div.main-container-component
  MemoryConsuming
  div.inputs
    TextInput(:class="{'selected-input': activeInputType === 'text'}")
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
.main-container-component::v-deep .formatted-number-component .number-trio-component > .padded {
  letter-spacing: 3px;
}

.main-container-component {
  padding: 10px;
  box-sizing: border-box;

  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  .inputs {
    width: 100%;
    max-width: calc(930px + 40px);
    display: grid;
    justify-content: center;
    grid-template-columns: repeat(auto-fill, 280px);
    grid-gap: 10px;
    grid-auto-rows: 1fr;

    .selected-input {
      border: solid 1px var(--selected-input-border);
      box-sizing: border-box;
      box-shadow: 0 0 10px var(--selected-input-box-shadow);
    }

    .text-input-component {
      @media all and (min-width: 580px) and (max-width: 894px) {
        grid-column: 1 / 3;
      }
    }

    @media all and (max-width: 579px) {
      grid-template-columns: repeat(auto-fill, minmax(280px, 360px));
    }
  }

  .input-switch-component {
    padding: 6px;
    margin-top: 12px;
    margin-bottom: 12px;
    background-color:    rgba(0,0,0,0.01);
    box-shadow: 0 0 12px rgba(0,0,0,0.01);
  }

  .items {
    width: 100%;
    display: grid;
    justify-content: center;
    grid-template-columns: repeat(auto-fill, 280px);
    grid-gap: 10px;
  }

  .interface {
    margin-top: 12px;
    display: flex;
    justify-content: center;
  }
}
</style>