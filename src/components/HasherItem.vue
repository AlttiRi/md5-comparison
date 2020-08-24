<template>
  <div class="hasher-item-component"
       :class="computing ? 'computing' : null">
    <div class="top">
      <div class="progress-line"
           :style="{width: progress+'%'}"
      ></div>
      <div class="name">{{ hasher.githubName }}</div>
      <div class="compute-buttons">
        <button
            @click="compute"
            :disabled="(!hasher.binarySupported && !inputIsString) ||
                                     (input === null)"
            :title="(!hasher.binarySupported ? 'Does not support ArrayBuffer' : null) ||
                                  (input === null ? 'No selected file' : 'Compute the hash without data splitting (the whole file will be loaded to memory)')"
        >Compute
        </button>
        <button
            @click="streamCompute"
            :disabled="!hasher.updateSupported || streamMode === 'String' || settings.readerChunkSize < 1"
            :title="unsupportedStreamMethodMessage || streamMethodMessage"
        >Stream Compute
        </button>
      </div>

    </div>
    <div class="middle"
         :style="{opacity: newInput || !time ? '0.2' : '1'}"
    >
      <div class="hash-times">
        <div class="hash-time"
             title="Hashing time"
        >
          <span v-if="time"><FormattedNumber :number="time"/> ms</span>
        </div>
        <div class="file-loading-time"
             title="Loading to memory time"
        >
          <span v-if="loadingToMemoryTime"><FormattedNumber :number="loadingToMemoryTime"/> ms</span>
        </div>
        <div class="total-hash-time"
             title="Total time"
        >
          <div v-if="totalTime"><FormattedNumber :number="totalTime"/> ms</div>
        </div>
      </div>

    </div>
    <div class="bottom">
      <div class="hash"
           :style="{
                   color: newInput ? '#ddd' : '#000',
                   opacity: hash ? 1 : 0,
                 }"
      >{{ hash }}</div>
    </div>
  </div>
</template>

<script>
import FormattedNumber from "./FormattedNumber.vue";
import {bus} from "./bus.js";
import * as Util from "../util.js";

export default {
  created() {
    bus.$on("input-changed", this.onInputChanged);
  },
  props: ["hasher", "input", "settings"],
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
          this.loadingToMemoryTime = this.settings.loadingToMemoryTime;
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
        console.log(this.settings.readerChunkSize);
        await _hashIterable(Util.iterateBlob2(this.input, this.settings.readerChunkSize), this.input.size);
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
        const settings = self.settings;
        self.progress = 0;
        for await (const data of iterable) {
          if (settings.animation) {
            const newTime = performance.now();
            if (newTime - curTime > (1000 / settings.fps)) {
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
        return (Number(this.time) + Number(this.loadingToMemoryTime)).toFixed(2);
      } else {
        return null;
      }
    },
    streamMode() {
      if (Util.isArrayBuffer(this.input)) {
        return "ArrayBuffer"
      } else if (Util.isBlob(this.input)) {
        if (this.settings.streamType === "FileReader") {
          return "FileReader"
        }
        if (this.settings.streamType === "ReadableStream") {
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
  width: 310px;
  height: 200px;
  border: 1px solid dimgray;
  /*box-sizing: border-box;*/
  margin: 4px 4px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hasher-item-component .name {
  padding: 6px 0;
}

.hasher-item-component > div {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}


.hasher-item-component button {
  user-select: none;
}

.hasher-item-component .hash {
  display: flex;
  justify-content: center;
  padding-bottom: 4px;
  padding-top: 4px;
  border-top: 1px solid darkgrey;
  width: 100%;

}

.hasher-item-component .progress-line {
  background-color: var(--light-blue);
  min-height: 4px;
}


.middle {
  height: 100%;
  position: relative;
}

.hash-times {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.hash-time {
  font-size: 18px;
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

.hash {
  height: 20px;
}


.computing .hash-time {
  opacity: 0.3;
}


.hash-time {
  text-shadow: var(--light-blue) 0 0 30px, var(--light-blue) 0 0 1px;
  color: var(--dark-blue);
}


@media all and (min-width: 1280px) {
  .hasher-item-component {
    width: 280px;
  }
}

</style>