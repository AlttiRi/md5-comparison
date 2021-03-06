<template lang="pug">
div.input-switch-component
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
</template>

<script>
import {bus} from "./bus.js";
import FormattedNumber from "./FormattedNumber.vue";
import {mapActions, mapGetters, mapState} from "vuex";

export default {
  name: "InputSwitch",
  computed: {
    ...mapState("file-settings", {
      storeInMemory: state => state.storeInMemory,
    }),

    ...mapState("input", {
      inputText: state => state.text,
      inputFile: state => state.file,
    }),
    ...mapGetters("input", ["textByteSize", "fileByteSize"]),

    activeInputType: {
      get() { return this.$store.state["input-switch"].activeInputType; },
      set(value) { this.$store.commit("input-switch/activeInputType", value); }
    },
    activeInputTypeAutoSwitcher: {
      get() { return this.$store.state["input-switch"].activeInputTypeAutoSwitcher; },
      set(value) { this.$store.commit("input-switch/activeInputTypeAutoSwitcher", value); }
    },

    inputByteSize() {
      if (this.activeInputType === "text") {
        return this.textByteSize;
      }
      if (this.activeInputType === "file") {
        return this.fileByteSize;
      }
      return null;
    }
  },
  methods: {
    ...mapActions("input", ["initBinary", "clearBinary"]),
    async updateBinary() {
      if (this.storeInMemory) {
        if (this.inputFile) {
          await this.initBinary();
        }
      } else {
        this.clearBinary();
      }
    }
  },
  watch: {
    activeInputType() {
      bus.$emit("input-changed");
    },
    async storeInMemory() {
      await this.updateBinary();
    },
    async inputFile() {
      if (this.activeInputTypeAutoSwitcher && this.activeInputType !== "file") {
        this.activeInputType = "file";
      } else {
        bus.$emit("input-changed");
      }
      await this.updateBinary();
    },
    inputText() {
      if (this.activeInputTypeAutoSwitcher && this.activeInputType !== "text") {
        this.activeInputType = "text";
      } else {
        bus.$emit("input-changed");
      }
    },
  },
  components: {
    FormattedNumber
  }
}
</script>

<style lang="scss" scoped>
.input-switch-component {
  > * {
    padding: 0 2px;
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
</style>