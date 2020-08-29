<template lang="pug">
div.textarea-wrapper
  label
    textarea(placeholder="Type a text here" v-model="inputText")
</template>

<script>
import {mapMutations, mapState} from "vuex";

export default {
  name: "TextInput",
  computed: {
    ...mapState("input", {
      _inputText: state => state.text,
    }),
    inputText: {
      get() {
        return this._inputText;
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

/* scrollbar breaks it a bit for 961px - 974px */
/* todo use grid */
@media all and (min-width: 640px) and (max-width: 960px) {
  .textarea-wrapper textarea {
    width: 630px;
  }
}
</style>