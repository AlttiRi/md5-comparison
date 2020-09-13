<template lang="pug">
div.hasher-item-component(:class="computing ? 'computing' : null")

  div.top
    div.progress-line(:style="{width: progress+'%'}")
    div.name
      | {{ hasher.githubName }}
    div.compute-buttons
      button(
          @click="compute"
          :disabled="(!hasher.binarySupported && !inputIsString) || (input === null)"
          :title=`(!hasher.binarySupported ? 'Does not support ArrayBuffer' : null) ||
                  (input === null ?
                     'No selected file' :
                     'Compute the hash without data splitting (the whole file will be loaded to memory)')`)
        | Compute
      button(
          @click="streamCompute"
          :disabled="!hasher.updateSupported || streamMode === 'String' || readerChunkSize < 1"
          :title="unsupportedStreamMethodMessage || streamMethodMessage")
        | Stream Compute

  div.middle(:style="{opacity: newInput || !time ? '0.2' : '1'}")
    div.hash-times
      div.hash-time(title="Hashing time")
        span(v-if="time")
          FormattedNumber(:number="time")
          |
          | ms
      div.file-loading-time(title="Loading to memory time")
        span(v-if="loadingToMemoryTime")
          FormattedNumber(:number="loadingToMemoryTime")
          |
          | ms
      div.total-hash-time(title="Total time")
        div(v-if="totalTime")
          FormattedNumber(:number="totalTime")
          |
          | ms

  div.bottom
    div.hash(
        :style=`{
          color: newInput ? '#ddd' : '#000',
          opacity: hash ? 1 : 0,
        }`)
      | {{ hash }}
</template>

<script>
import FormattedNumber from "./FormattedNumber.vue";
import {bus} from "./bus.js";
import * as Util from "../util.js";
import {mapState, mapGetters} from "vuex";

export default {
  created() {
    bus.$on("input-changed", this.onInputChanged);
  },
  beforeDestroy() {
    bus.$off("input-changed", this.onInputChanged);
  },
  props: ["hasher", "input"],
  methods: {
    onInputChanged() {
      this.newInput = true;
    },
    async compute() {
      this.computing = true;
      this.time = 0;
      this.progress = 0;
      this.$forceUpdate();
      await new Promise(resolve => setTimeout(resolve, 16));

      let input;
      if (Util.isString(this.input)) {
        input = this.input;
      } else {
        if (!this.hasher.binarySupported) {
          return;
        }
        if (Util.isBlob(this.input)) {
          const start = performance.now();
          input = await this.input.arrayBuffer();
          this.loadingToMemoryTime = performance.now() - start;
        } else {
          input = this.input;
          this.loadingToMemoryTime = this._loadingToMemoryTime;
        }
        this.$forceUpdate();
        await new Promise(resolve => setTimeout(resolve, 16));
      }

      const start = performance.now();
      this.hash = this.hasher.hash(input);
      this.progress = 100;
      this.time = performance.now() - start;
      this.newInput = false;

      this.computing = false;
    },
    async streamCompute() {
      this.computing = true;
      this.progress = 0;
      await new Promise(resolve => setTimeout(resolve, 16));

      const self = this;
      this.loadingToMemoryTime = null;

      if (this.streamMode === "FileReader") {
        console.log(this.readerChunkSize);
        await _hashIterable(Util.iterateBlob2(this.input, this.readerChunkSize), this.input.size);
      } else if (this.streamMode === "ReadableStream") {
        await _hashIterable(Util.iterateReadableStream(this.input.stream()), this.input.size);
      } else if (this.streamMode === "ArrayBuffer") {
        await _hashIterable(Util.iterateArrayBuffer(this.input), this.input.byteLength);
      }
      this.newInput = false;
      this.computing = false;

      async function _hashIterable(iterable, length) {
        const hasher = new self.hasher();
        const start = performance.now();
        let curTime = start;
        let totalRead = 0;
        self.progress = 0;
        for await (const data of iterable) {
          if (self.animation) {
            const newTime = performance.now();
            if (newTime - curTime > (1000 / self.fps)) {
              curTime = newTime;
              self.progress = (totalRead / length) * 100;
              await new Promise(resolve => Util.setImmediate(resolve));
            }
            totalRead += data.length;
          }

          hasher.update(data);
        }
        self.progress = 100;

        self.hash = hasher.finalize();
        self.time = performance.now() - start;
      }
    }
  },
  data() {
    return {
      hash: "",
      time: "",
      progress: 0,
      loadingToMemoryTime: null,
      newInput: true,
      computing: false,
    }
  },
  computed: {
    ...mapState("file-settings", {
      animation: state => state.animation,
      fps: state => state.fps,
      streamType: state => state.streamType,
    }),
    ...mapGetters("file-settings", ["readerChunkSize"]),

    ...mapState("input", {
      _loadingToMemoryTime: state => state.loadingToMemoryTime,
    }),

    streamMethodMessage() {
      if (this.streamMode === "ArrayBuffer") {
        return "Iterate ArrayBuffer chunks of the file loaded in the memory";
      }
      if (this.streamMode === "FileReader") {
        return "Stream reading of the file via FileReader";
      }
      if (this.streamMode === "ReadableStream") {
        return "Stream reading of the file via ReadableStream";
      }
    },
    unsupportedStreamMethodMessage() {
      if (!this.hasher.updateSupported) {
        return "Does not support `update` method";
      }
      if (this.streamMode === "String") {
        return "I see no sense to use progressive hashing for the text input";
      }
    },
    inputIsString() {
      return Util.isString(this.input);
    },
    totalTime() {
      if (this.loadingToMemoryTime && this.time) {
        const total = Number(this.time) + Number(this.loadingToMemoryTime);
        return Number(total.toFixed(2));
      } else {
        return null;
      }
    },
    streamMode() {
      if (Util.isArrayBuffer(this.input)) {
        return "ArrayBuffer"
      } else if (Util.isBlob(this.input)) {
        if (this.streamType === "FileReader") {
          return "FileReader"
        }
        if (this.streamType === "ReadableStream") {
          return "ReadableStream"
        }
      }
      return "String";
    }
  },
  components: {
    FormattedNumber
  }
};
</script>

<style lang="scss" scoped>
.hasher-item-component {
  height: 200px;
  border: 1px solid dimgray;
  box-sizing: border-box;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  > div {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .top {
    .progress-line {
      background-color: var(--light-blue);
      min-height: 4px;
    }
    .name {
      padding: 6px 0;
    }
    .compute-buttons {
      button {
        user-select: none;
      }
    }
  }

  .middle {
    height: 100%;
    position: relative;
    .hash-times {
      height: 100%;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      .hash-time {
        font-size: 18px;
        text-shadow: var(--light-blue) 0 0 30px, var(--light-blue) 0 0 1px;
        color: var(--dark-blue);
        &.computing {
          opacity: 0.3;
        }
      }
      .file-loading-time {
        position: absolute;
        left: 0;
        bottom: 0;
        padding: 6px 18px;
        opacity: 0.7;
      }
      .total-hash-time {
        position: absolute;
        right: 0;
        bottom: 0;
        padding: 6px 18px;
        opacity: 0.8;
      }
    }
  }

  .bottom {
    .hash {
      display: flex;
      justify-content: center;
      padding-bottom: 4px;
      padding-top: 4px;
      border-top: 1px solid darkgrey;
      width: 100%;
      height: 20px;
    }
  }
}
</style>