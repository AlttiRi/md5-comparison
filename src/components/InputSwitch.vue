<template lang="pug">
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
</template>

<script>
import {bus} from "./bus.js";
import FormattedNumber from "./FormattedNumber.vue";
import {mapActions, mapGetters, mapMutations, mapState} from "vuex";

export default {
  name: "InputSwitch",
  props: ["storeInMemory"],
  computed: {
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
    ...mapActions("input", ["initBinary"]),
    ...mapMutations("input", ["clearBinary", "resetError"]),
  },
  watch: {
    activeInputType() {
      bus.$emit("input-changed");
    },
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
      this.resetError();

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
  },
  components: {
    FormattedNumber
  }
}
</script>

<style lang="scss" scoped>
.input-switch {
  padding: 6px;
  margin-top: 12px;
  margin-bottom: 24px;
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