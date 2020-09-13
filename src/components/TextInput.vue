<template lang="pug">
div.text-input-component
  label
    textarea(placeholder="Type a text here" v-model="text")
</template>

<script>
import {mapMutations, mapState} from "vuex";

export default {
  name: "TextInput",
  computed: {
    ...mapState("input", {
      _text: state => state.text,
    }),
    text: {
      get() {
        return this._text;
      },
      set(value) {
        this.setText(value);
      }
    }
  },
  methods: {
    ...mapMutations("input", ["setText"])
  }
}
</script>

<style lang="scss" scoped>
.text-input-component {
  border: solid 1px var(--textarea-wrapper-border);
  box-sizing: border-box;
  width: 100%;
  textarea {
    width: 100%;
    box-sizing: border-box;
    height: calc(100% - 1px); // firefox bug
    border: 0;
    outline: none;
    padding: 5px;
    font-size: 17px;
    &:focus::placeholder {
      opacity: 0;
      transition: opacity 0.25s ease;
    }
  }
}
</style>