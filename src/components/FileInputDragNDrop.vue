<template lang="pug">
div.file-input-drag-n-drop-component(
    v-bind:class="{'drop-hover': dropHover}"
    @drop="onFileDrop"
    @dragenter="onFileDragEnter"
    @dragleave="onFileDragLeave"
    @dragover="onFileDragOver")
  label(for="file-input")
    div#add-files-button(v-if="!file")
      slot
        | Select file
    input(id="file-input" type="file" accept="*/*" style="display: none"
          @change="onFileInputChange")
    div.file-info
      div.file-name(v-if="file" :title="file.name")
        | {{ file.name }}
      div.file-size(v-if="file")
        | {{ bytesToSize(file.size) }}
      div.file-mtime(v-if="file")
        | {{ secondsToFormattedString(file.lastModified / 1000) }}
</template>

<script>
import * as Util from "../util.js";
import {mapActions, mapState} from "vuex";

export default {
  data() {
    return {
      dropHover: false
    }
  },
  computed: {
    ...mapState("input", {
      file: state => state.file
    })
  },
  methods: {
    ...mapActions("input", ["setFile"]),

    secondsToFormattedString: Util.secondsToFormattedString,
    bytesToSize: Util.bytesToSize,

    async handleFileData(file) {
      this.setFile(file);
    },

    async onFileInputChange(event) {
      const fileElem = event.target;
      const file = fileElem.files[0];
      await this.handleFileData(file);
      fileElem.value = null;
    },
    async onFileDrop(event) {
      event.preventDefault();
      setTimeout(_ => this.dropHover = false, 50); // stupid blinking
      const file = event.dataTransfer.files[0];
      await this.handleFileData(file);
    },
    onFileDragEnter() {
      setTimeout(_ => this.dropHover = true, 0);   // do after "dragleave"
    },
    onFileDragLeave() {
      this.dropHover = false;
    },
    onFileDragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },

    disableDragOverNonThisComponent() {
      document.querySelector("body").addEventListener("dragover", event => {
        if (!this.$el.contains(/** @type {DragEvent}*/ event.target)) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "none";
        }
      });
    }
  },
  mounted() {
    this.disableDragOverNonThisComponent();
  }
}
</script>

<style lang="scss" scoped>
.file-input-drag-n-drop-component {
  transition: background-color 0.1s;
  border: solid 1px var(--file-input-drag-n-drop-component-border);
  box-sizing: border-box;

  &.drop-hover { /*todo: rename - file-over */
    background-color: var(--drop-file-over);
    transition: background-color 0.1s;
  }
  &:hover {
    background-color: var(--drop-hover);
  }
  &:active {
    background-color: var(--drop-active);
  }

  label {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .file-info {
    max-width: 100%;
    > * {
      padding: 4px 12px;
    }
    .file-name {
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .file-mtime {
      opacity: 0.9;
    }
  }

  #add-files-button {
    font-size: 18px;
  }
}
</style>