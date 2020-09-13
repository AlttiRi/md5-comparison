<template lang="pug">
div.memory-consuming-component(
    v-if="isSupported"
    :style="{width: percent + '%'}"
    :title="'Heap size: ' + formattedSize")
  div.visible(:class="{over100}")
  div.invisible
</template>

<script>
import * as Util from "../util.js";

export default {
  name: "MemoryConsuming",
  data() {
    return {
      memory: performance.memory,
      intervalId: null,
      over100: false
    }
  },
  computed: {
    jsHeapSizeLimit() {return this.memory.jsHeapSizeLimit},
    totalJSHeapSize() {return this.memory.totalJSHeapSize},
    usedJSHeapSize()  {return this.memory.usedJSHeapSize},
    percent() {
      const percent = this.totalJSHeapSize / (this.jsHeapSizeLimit / 100);
      this.over100 = percent > 100;
      return this.over100 ? 100 : percent;
    },
    formattedSize() {
      return Util.bytesToSize(this.totalJSHeapSize);
    },
    isSupported() {
      return this.memory;
    }
  },
  mounted() {
    if (!this.isSupported) {
      return;
    }
    this.intervalId = setInterval(() => {
      this.memory = performance.memory;
    }, 1000);
  },
  beforeDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
</script>

<style lang="scss" scoped>
.memory-consuming-component {
  position: absolute;
  left: 0;
  top: 0;

  > div {
    width: 100%;
  }
  .visible {
    background-color: #415aff;
    height: 2px;
    &.over100 {
      background-color: #e30000;
    }
  }
  .invisible {
    height: 3px;
  }
}
</style>