(function (Vue, Vuex) {
    'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var Vue__default = /*#__PURE__*/_interopDefaultLegacy(Vue);
    var Vuex__default = /*#__PURE__*/_interopDefaultLegacy(Vuex);

    const state = () => ({
        /** @type {String} */
        text: "",
        /** @type {File} */
        file: null,

        /** @type {ArrayBuffer} */
        binary: null,
        /** @type {Boolean} */
        binaryLoading: false,
        /** @type {Number} */
        loadingToMemoryTime: null,

        /** @type {DOMException} */
        error: null, // Loading file to memory error
    });

    const getters = {
        textByteSize(state, getters) {
            return new TextEncoder().encode(state.text).byteLength;
        },
        fileByteSize(state, getters) {
            return state.file ? state.file.size : null; // `state.binary.byteLength` for binary
        },
    };

    const actions = {
        async setBinary({commit, state}, /** @type {File}*/ file) {
            commit("_binaryLoading", true);
            if (state.error) {
                commit("_clearError");
            }

            try {
                const now = performance.now();
                const binary = await file.arrayBuffer();                           // [1]
                /* just to compare arrayBuffer() with FileReader */
                // binary = await (Util.iterateBlob1(file, 1024**4).next()).value; // [2]

                commit("_binary", binary);
                commit("_loadingToMemoryTime", performance.now() - now);
            } catch (error) {
                // When there is not enough memory space:
                // DOMException:
                // The requested file could not be read, typically due to permission problems
                // that have occurred after a reference to a file was acquired.
                console.error(error);
                commit("_error", error);  // error.name === NotReadableError
            }
            commit("_binaryLoading", false);
        },
        async initBinary({dispatch, state}) {
            await dispatch("setBinary", state.file);
        },
        clearBinary({commit, state}) {
            if (state.binary) {
                commit("_binary", null);
                commit("_loadingToMemoryTime", null);
            }
        },

        setFile({commit, state}, file) {
            if (state.error) {
                commit("_clearError");
            }
            commit("_file", file);
        },
        clearFile({dispatch}) {
            dispatch("setFile", null);
        },
    };

    const mutations = {
        setText(state, text) {
            state.text = text;
        },
        clearText(state) {
            state.text = "";
        },

        _file(state, file) {
            state.file = file;
        },
        _binary(state, binary) {
            state.binary = binary;
        },
        _binaryLoading(state, binaryLoading) {
            state.binaryLoading = binaryLoading;
        },
        _loadingToMemoryTime(state, loadingToMemoryTime) {
            state.loadingToMemoryTime = loadingToMemoryTime;
        },

        _error(state, error) {
            state.error = error;
        },
        _clearError(state) {
            state.error = null;
        }
    };


    var input = {
        namespaced: true,
        state,
        getters,
        actions,
        mutations
    };

    const state$1 = () => ({
        storeInMemory: false,
        streamType: "FileReader",
        readerChunkSizeMB: 2,
        animation: true,
        fps: 25,
    });

    const mutations$1 = {
        storeInMemory(state, storeInMemory) {
            state.storeInMemory = storeInMemory;
        },
        streamType(state, streamType) {
            state.streamType = streamType;
        },
        readerChunkSizeMB(state, readerChunkSizeMB) {
            state.readerChunkSizeMB = readerChunkSizeMB;
        },
        animation(state, animation) {
            state.animation = animation;
        },
        fps(state, fps) {
            state.fps = fps;
        },
    };

    const getters$1 = {
        readerChunkSize(state, getters) {
            return Math.trunc(Number(state.readerChunkSizeMB) * 1024 * 1024);
        },
    };

    var fileSettings = {
        namespaced: true,
        state: state$1,
        mutations: mutations$1,
        getters: getters$1
    };

    const state$2 = () => ({
        activeInputType: "text",
        activeInputTypeAutoSwitcher: true
    });

    const mutations$2 = {
        activeInputType(state, activeInputType) {
            state.activeInputType = activeInputType;
        },
        activeInputTypeAutoSwitcher(state, activeInputTypeAutoSwitcher) {
            state.activeInputTypeAutoSwitcher = activeInputTypeAutoSwitcher;
        }
    };

    var inputSwitch = {
        namespaced: true,
        state: state$2,
        mutations: mutations$2
    };

    const setImmediate = /*#__PURE__*/ (function() {
        const {port1, port2} = new MessageChannel();
        const queue = [];

        port1.onmessage = function() {
            const callback = queue.shift();
            callback();
        };

        return function(callback) {
            port2.postMessage(null);
            queue.push(callback);
        };
    })();


    async function * iterateReadableStream(stream) {
        const reader = stream.getReader();
        while (true) {
            const {done, /** @type {Uint8Array} */ value} = await reader.read();
            if (done) {
                break;
            }
            yield value;
        }
    }

    // chunkSize is 65536, ReadableStream uses the same size.
    // There is no speed difference between using of different the chunk's sizes.
    function * iterateArrayBuffer(arrayBuffer, chunkSize = 65536) {
        const buffer = new Uint8Array(arrayBuffer);
        let index = 0;
        while (true) {
            const chunk = buffer.subarray(index, index + chunkSize);
            if (!chunk.length) {
                break;
            }
            yield chunk;
            index += chunkSize;
        }
    }

    // It works with the same speed in Chromium, but faster in Firefox
    function * iterateBlob2(blob, chunkSize = 2 * 1024 * 1024) {
        let index = 0;
        while (true) {
            const blobChunk = blob.slice(index, index + chunkSize);
            if (!blobChunk.size) {break;}

            yield read(blobChunk);
            index += chunkSize;
        }

        async function read(blob) {
            return new Uint8Array(await blob.arrayBuffer());
        }
    }


    function isArrayBuffer(data) {
        return data instanceof ArrayBuffer;
    }
    function isBinary(data) {
        return isArrayBuffer(data) || ArrayBuffer.isView(data);
    }
    function isString(data) {
        return typeof data === "string" || data instanceof String;
    }
    function isBlob(data) { // is it Blob or File
        return data instanceof Blob;
    }


    function secondsToFormattedString(seconds) {
        const date = new Date(seconds * 1000);

        // Adds zero padding
        function pad(str) {
            return str.toString().padStart(2, "0");
        }

        return date.getFullYear() + "." + pad(date.getMonth() + 1) + "." + pad(date.getDate()) + " " +
            pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
    }


    function bytesToSize(bytes, decimals = 2) {
        if (bytes === 0) {
            return "0 B";
        }
        const k = 1024;
        decimals = decimals < 0 ? 0 : decimals;
        const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
    }

    Vue__default['default'].use(Vuex__default['default']);

    var store = new Vuex__default['default'].Store({
        modules: {
            input,
            ["file-settings"]: fileSettings,
            ["input-switch"]: inputSwitch
        },
        plugins: [logger]
    });

    function logger(store) {
        store.subscribe((mutation/*, state*/) => {
            // to prevent the large memory leak
            if (isBinary(mutation.payload)) {
                const binary = mutation.payload;

                if (isArrayBuffer(binary)) {
                    console.log({
                        type: mutation.type,
                        payload: "ArrayBuffer(" + binary.byteLength + ")",
                        payloadPreview: new Uint8Array(binary).slice(0, 1024).buffer
                    });
                } else {
                    const cellSize = binary.slice(0, 1).byteLength || 1; // if `length === 0`
                    console.log({
                        type: mutation.type,
                        payload: binary[Symbol.toStringTag] + "(" + binary.length + ")",
                        payloadPreview: binary.slice(0, 1024 / cellSize)
                    });
                }
            } else {
                console.log(mutation);
            }
        });
    }

    //
    //
    //
    //
    //
    //

    var script = {
      name: "NumberTrio",
      props: {
        value: {
          type: String,
          required: true,
          validator(value) {
            return Boolean(value.match(/^\d+$/));
          }
        },
        position: {
          type: Number,
          required: true,
        },
        count: {
          type: Number,
          required: true,
        },
        padding: { // letterSpacing value, e.g., "5px"
          type: String
        },
      },
      computed: {
        part1() {
          return this.parts.part1;
        },
        part2() {
          return this.parts.part2;
        },
        parts() {
          const el = this.value;
          if (this.isLast) {
            return {
              part1: el,
              part2: ""
            };
          } else {
            return {
              part1: el.substring(0, el.length - 1),
              part2: el.substring(el.length - 1)
            };
          }
        },
        isLast() {
          return this.position === this.count - 1;
        }
      }
    };

    function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
        if (typeof shadowMode !== 'boolean') {
            createInjectorSSR = createInjector;
            createInjector = shadowMode;
            shadowMode = false;
        }
        // Vue.extend constructor export interop.
        const options = typeof script === 'function' ? script.options : script;
        // render functions
        if (template && template.render) {
            options.render = template.render;
            options.staticRenderFns = template.staticRenderFns;
            options._compiled = true;
            // functional template
            if (isFunctionalTemplate) {
                options.functional = true;
            }
        }
        // scopedId
        if (scopeId) {
            options._scopeId = scopeId;
        }
        let hook;
        if (moduleIdentifier) {
            // server build
            hook = function (context) {
                // 2.3 injection
                context =
                    context || // cached call
                        (this.$vnode && this.$vnode.ssrContext) || // stateful
                        (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
                // 2.2 with runInNewContext: true
                if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                    context = __VUE_SSR_CONTEXT__;
                }
                // inject component styles
                if (style) {
                    style.call(this, createInjectorSSR(context));
                }
                // register component module identifier for async chunk inference
                if (context && context._registeredComponents) {
                    context._registeredComponents.add(moduleIdentifier);
                }
            };
            // used by ssr in case component is cached and beforeCreate
            // never gets called
            options._ssrRegister = hook;
        }
        else if (style) {
            hook = shadowMode
                ? function (context) {
                    style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
                }
                : function (context) {
                    style.call(this, createInjector(context));
                };
        }
        if (hook) {
            if (options.functional) {
                // register for functional component in vue file
                const originalRender = options.render;
                options.render = function renderWithStyleInjection(h, context) {
                    hook.call(context);
                    return originalRender(h, context);
                };
            }
            else {
                // inject component registration as beforeCreate hook
                const existing = options.beforeCreate;
                options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
            }
        }
        return script;
    }

    /* script */
    const __vue_script__ = script;

    /* template */
    var __vue_render__ = function() {
      var _vm = this;
      var _h = _vm.$createElement;
      var _c = _vm._self._c || _h;
      return _c("span", { staticClass: "trio" }, [
        _vm.part1 ? _c("span", [_vm._v(_vm._s(_vm.part1))]) : _vm._e(),
        _vm.part2
          ? _c(
              "span",
              { staticClass: "padded", style: { letterSpacing: _vm.padding } },
              [_vm._v(_vm._s(_vm.part2))]
            )
          : _vm._e()
      ])
    };
    var __vue_staticRenderFns__ = [];
    __vue_render__._withStripped = true;

      /* style */
      const __vue_inject_styles__ = undefined;
      /* scoped */
      const __vue_scope_id__ = undefined;
      /* module identifier */
      const __vue_module_identifier__ = undefined;
      /* functional template */
      const __vue_is_functional_template__ = false;
      /* style inject */
      
      /* style inject SSR */
      
      /* style inject shadow dom */
      

      
      const __vue_component__ = /*#__PURE__*/normalizeComponent(
        { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
        __vue_inject_styles__,
        __vue_script__,
        __vue_scope_id__,
        __vue_is_functional_template__,
        __vue_module_identifier__,
        false,
        undefined,
        undefined,
        undefined
      );

    //

    var script$1 = {
      name: "FormattedNumber",
      props: {
        number: {
          type: Number,
          required: true,
        },
        precision: { // Count of numbers after the point (the dot), if the integer part contains 1 digit
          type: Number,
          default: 2 // result for "3": "1.123", "10.12", "100.1", "1000"; for "2": "1.01", "10", "100";
        },
        padding: {   // letterSpacing value, e.g., "5px"
          type: String,
          default: null
        }
      },
      computed: {
        /** @returns {Boolean} */
        isNegative() {
          return this.parts.isNegative;
        },
        /** @returns {String} */
        integer() {
          return this.parts.integer;
        },
        /** @returns {String} */
        decimal() {
          return this.parts.decimal;
        },
        parts() {
          const [integer, decimal] = this.number.toString().split(".");
          const isNegative = this.number < 0;
          return {
            isNegative,
            integer: isNegative ? integer.substring(1) : integer,
            decimal
          };
        },
        decimalTrimmed() {
          const [integer, decimal] = [this.integer, this.decimal];
          const precision = this.precision;

          if (decimal) {
            const subDecimal = decimal.substring(0, precision + 1 - integer.length);
            // if contains only zeros
            return subDecimal.match(/^0*$/) ? "" : subDecimal;
          }
          return null;
        },
        integerTrios() {
          return this.getTrios(this.integer);
        }
      },
      methods: {
        getTrios(number) {
          const trios = [];
          const offset = ((number.length % 3) - 3) % 3;
          for (let i = offset; i < number.length; i += 3) {
            const part = number.substring(i, i + 3);
            trios.push(part);
          }
          return trios;
        }
      },
      components: {NumberTrio: __vue_component__}
    };

    /* script */
    const __vue_script__$1 = script$1;

    /* template */
    var __vue_render__$1 = function() {
      var _vm = this;
      var _h = _vm.$createElement;
      var _c = _vm._self._c || _h;
      return _c("span", { staticClass: "formatted-number" }, [
        _vm.isNegative
          ? _c("span", { staticClass: "minus" }, [_vm._v("-")])
          : _vm._e(),
        _c(
          "span",
          { staticClass: "integer" },
          _vm._l(_vm.integerTrios, function(integerTrio, index) {
            return _c("NumberTrio", {
              key: index,
              attrs: {
                value: integerTrio,
                position: index,
                count: _vm.integerTrios.length,
                padding: _vm.padding
              }
            })
          }),
          1
        ),
        _vm.decimalTrimmed
          ? _c("span", { staticClass: "point" }, [_vm._v(".")])
          : _vm._e(),
        _vm.decimalTrimmed
          ? _c("span", { staticClass: "decimal" }, [
              _vm._v(_vm._s(_vm.decimalTrimmed))
            ])
          : _vm._e()
      ])
    };
    var __vue_staticRenderFns__$1 = [];
    __vue_render__$1._withStripped = true;

      /* style */
      const __vue_inject_styles__$1 = undefined;
      /* scoped */
      const __vue_scope_id__$1 = undefined;
      /* module identifier */
      const __vue_module_identifier__$1 = undefined;
      /* functional template */
      const __vue_is_functional_template__$1 = false;
      /* style inject */
      
      /* style inject SSR */
      
      /* style inject shadow dom */
      

      
      const __vue_component__$1 = /*#__PURE__*/normalizeComponent(
        { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 },
        __vue_inject_styles__$1,
        __vue_script__$1,
        __vue_scope_id__$1,
        __vue_is_functional_template__$1,
        __vue_module_identifier__$1,
        false,
        undefined,
        undefined,
        undefined
      );

    const bus = new Vue__default['default']();

    //

    var script$2 = {
      created() {
        bus.$on("input-changed", this.onInputChanged);
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
          if (isString(this.input)) {
            input = this.input;
          } else {
            if (!this.hasher.binarySupported) {
              return;
            }
            if (isBlob(this.input)) {
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
            await _hashIterable(iterateBlob2(this.input, this.readerChunkSize), this.input.size);
          } else if (this.streamMode === "ReadableStream") {
            await _hashIterable(iterateReadableStream(this.input.stream()), this.input.size);
          } else if (this.streamMode === "ArrayBuffer") {
            await _hashIterable(iterateArrayBuffer(this.input), this.input.byteLength);
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
                  await new Promise(resolve => setImmediate(resolve));
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
        ...Vuex.mapState("file-settings", {
          animation: state => state.animation,
          fps: state => state.fps,
          streamType: state => state.streamType,
        }),
        ...Vuex.mapGetters("file-settings", ["readerChunkSize"]),

        ...Vuex.mapState("input", {
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
          return isString(this.input);
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
          if (isArrayBuffer(this.input)) {
            return "ArrayBuffer"
          } else if (isBlob(this.input)) {
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
        FormattedNumber: __vue_component__$1
      }
    };

    /* script */
    const __vue_script__$2 = script$2;
    /* template */
    var __vue_render__$2 = function() {
      var _vm = this;
      var _h = _vm.$createElement;
      var _c = _vm._self._c || _h;
      return _c(
        "div",
        {
          staticClass: "hasher-item-component",
          class: _vm.computing ? "computing" : null
        },
        [
          _c("div", { staticClass: "top" }, [
            _c("div", {
              staticClass: "progress-line",
              style: { width: _vm.progress + "%" }
            }),
            _c("div", { staticClass: "name" }, [
              _vm._v(_vm._s(_vm.hasher.githubName))
            ]),
            _c("div", { staticClass: "compute-buttons" }, [
              _c(
                "button",
                {
                  attrs: {
                    disabled:
                      (!_vm.hasher.binarySupported && !_vm.inputIsString) ||
                      _vm.input === null,
                    title:
                      (!_vm.hasher.binarySupported
                        ? "Does not support ArrayBuffer"
                        : null) ||
                      (_vm.input === null
                        ? "No selected file"
                        : "Compute the hash without data splitting (the whole file will be loaded to memory)")
                  },
                  on: { click: _vm.compute }
                },
                [_vm._v("Compute")]
              ),
              _c(
                "button",
                {
                  attrs: {
                    disabled:
                      !_vm.hasher.updateSupported ||
                      _vm.streamMode === "String" ||
                      _vm.readerChunkSize < 1,
                    title:
                      _vm.unsupportedStreamMethodMessage || _vm.streamMethodMessage
                  },
                  on: { click: _vm.streamCompute }
                },
                [_vm._v("Stream Compute")]
              )
            ])
          ]),
          _c(
            "div",
            {
              staticClass: "middle",
              style: { opacity: _vm.newInput || !_vm.time ? "0.2" : "1" }
            },
            [
              _c("div", { staticClass: "hash-times" }, [
                _c(
                  "div",
                  { staticClass: "hash-time", attrs: { title: "Hashing time" } },
                  [
                    _vm.time
                      ? _c(
                          "span",
                          [
                            _c("FormattedNumber", { attrs: { number: _vm.time } }),
                            _vm._v("\nms")
                          ],
                          1
                        )
                      : _vm._e()
                  ]
                ),
                _c(
                  "div",
                  {
                    staticClass: "file-loading-time",
                    attrs: { title: "Loading to memory time" }
                  },
                  [
                    _vm.loadingToMemoryTime
                      ? _c(
                          "span",
                          [
                            _c("FormattedNumber", {
                              attrs: { number: _vm.loadingToMemoryTime }
                            }),
                            _vm._v("\nms")
                          ],
                          1
                        )
                      : _vm._e()
                  ]
                ),
                _c(
                  "div",
                  {
                    staticClass: "total-hash-time",
                    attrs: { title: "Total time" }
                  },
                  [
                    _vm.totalTime
                      ? _c(
                          "div",
                          [
                            _c("FormattedNumber", {
                              attrs: { number: _vm.totalTime }
                            }),
                            _vm._v("\nms")
                          ],
                          1
                        )
                      : _vm._e()
                  ]
                )
              ])
            ]
          ),
          _c("div", { staticClass: "bottom" }, [
            _c(
              "div",
              {
                staticClass: "hash",
                style: {
                  color: _vm.newInput ? "#ddd" : "#000",
                  opacity: _vm.hash ? 1 : 0
                }
              },
              [_vm._v(_vm._s(_vm.hash))]
            )
          ])
        ]
      )
    };
    var __vue_staticRenderFns__$2 = [];
    __vue_render__$2._withStripped = true;

      /* style */
      const __vue_inject_styles__$2 = undefined;
      /* scoped */
      const __vue_scope_id__$2 = "data-v-16ba8718";
      /* module identifier */
      const __vue_module_identifier__$2 = undefined;
      /* functional template */
      const __vue_is_functional_template__$2 = false;
      /* style inject */
      
      /* style inject SSR */
      
      /* style inject shadow dom */
      

      
      const __vue_component__$2 = /*#__PURE__*/normalizeComponent(
        { render: __vue_render__$2, staticRenderFns: __vue_staticRenderFns__$2 },
        __vue_inject_styles__$2,
        __vue_script__$2,
        __vue_scope_id__$2,
        __vue_is_functional_template__$2,
        __vue_module_identifier__$2,
        false,
        undefined,
        undefined,
        undefined
      );

    //

    var script$3 = {
      data() {
        return {
          dropHover: false
        }
      },
      computed: {
        ...Vuex.mapState("input", {
          file: state => state.file
        })
      },
      methods: {
        ...Vuex.mapActions("input", ["setFile"]),

        secondsToFormattedString: secondsToFormattedString,
        bytesToSize: bytesToSize,

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
    };

    /* script */
    const __vue_script__$3 = script$3;
    /* template */
    var __vue_render__$3 = function() {
      var _vm = this;
      var _h = _vm.$createElement;
      var _c = _vm._self._c || _h;
      return _c(
        "div",
        {
          staticClass: "file-input-drag-n-drop-component",
          class: { "drop-hover": _vm.dropHover },
          on: {
            drop: _vm.onFileDrop,
            dragenter: _vm.onFileDragEnter,
            dragleave: _vm.onFileDragLeave,
            dragover: _vm.onFileDragOver
          }
        },
        [
          _c("label", { attrs: { for: "file-input" } }, [
            !_vm.file
              ? _c(
                  "div",
                  { attrs: { id: "add-files-button" } },
                  [_vm._t("default", [_vm._v("Select file")])],
                  2
                )
              : _vm._e(),
            _c("input", {
              staticStyle: { display: "none" },
              attrs: { id: "file-input", type: "file", accept: "*/*" },
              on: { change: _vm.onFileInputChange }
            }),
            _c("div", { staticClass: "file-info" }, [
              _vm.file
                ? _c(
                    "div",
                    { staticClass: "file-name", attrs: { title: _vm.file.name } },
                    [_vm._v(_vm._s(_vm.file.name))]
                  )
                : _vm._e(),
              _vm.file
                ? _c("div", { staticClass: "file-size" }, [
                    _vm._v(_vm._s(_vm.bytesToSize(_vm.file.size)))
                  ])
                : _vm._e(),
              _vm.file
                ? _c("div", { staticClass: "file-mtime" }, [
                    _vm._v(
                      _vm._s(
                        _vm.secondsToFormattedString(_vm.file.lastModified / 1000)
                      )
                    )
                  ])
                : _vm._e()
            ])
          ])
        ]
      )
    };
    var __vue_staticRenderFns__$3 = [];
    __vue_render__$3._withStripped = true;

      /* style */
      const __vue_inject_styles__$3 = undefined;
      /* scoped */
      const __vue_scope_id__$3 = "data-v-4f3d02fa";
      /* module identifier */
      const __vue_module_identifier__$3 = undefined;
      /* functional template */
      const __vue_is_functional_template__$3 = false;
      /* style inject */
      
      /* style inject SSR */
      
      /* style inject shadow dom */
      

      
      const __vue_component__$3 = /*#__PURE__*/normalizeComponent(
        { render: __vue_render__$3, staticRenderFns: __vue_staticRenderFns__$3 },
        __vue_inject_styles__$3,
        __vue_script__$3,
        __vue_scope_id__$3,
        __vue_is_functional_template__$3,
        __vue_module_identifier__$3,
        false,
        undefined,
        undefined,
        undefined
      );

    //

    var script$4 = {
      name: "TextInput",
      computed: {
        ...Vuex.mapState("input", {
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
        ...Vuex.mapMutations("input", ["setText"])
      }
    };

    /* script */
    const __vue_script__$4 = script$4;
    /* template */
    var __vue_render__$4 = function() {
      var _vm = this;
      var _h = _vm.$createElement;
      var _c = _vm._self._c || _h;
      return _c("div", { staticClass: "text-input-component" }, [
        _c("label", [
          _c("textarea", {
            directives: [
              {
                name: "model",
                rawName: "v-model",
                value: _vm.text,
                expression: "text"
              }
            ],
            attrs: { placeholder: "Type a text here" },
            domProps: { value: _vm.text },
            on: {
              input: function($event) {
                if ($event.target.composing) {
                  return
                }
                _vm.text = $event.target.value;
              }
            }
          })
        ])
      ])
    };
    var __vue_staticRenderFns__$4 = [];
    __vue_render__$4._withStripped = true;

      /* style */
      const __vue_inject_styles__$4 = undefined;
      /* scoped */
      const __vue_scope_id__$4 = "data-v-553cd546";
      /* module identifier */
      const __vue_module_identifier__$4 = undefined;
      /* functional template */
      const __vue_is_functional_template__$4 = false;
      /* style inject */
      
      /* style inject SSR */
      
      /* style inject shadow dom */
      

      
      const __vue_component__$4 = /*#__PURE__*/normalizeComponent(
        { render: __vue_render__$4, staticRenderFns: __vue_staticRenderFns__$4 },
        __vue_inject_styles__$4,
        __vue_script__$4,
        __vue_scope_id__$4,
        __vue_is_functional_template__$4,
        __vue_module_identifier__$4,
        false,
        undefined,
        undefined,
        undefined
      );

    //

    var script$5 = {
      name: "InputSwitch",
      computed: {
        ...Vuex.mapState("file-settings", {
          storeInMemory: state => state.storeInMemory,
        }),

        ...Vuex.mapState("input", {
          inputText: state => state.text,
          inputFile: state => state.file,
        }),
        ...Vuex.mapGetters("input", ["textByteSize", "fileByteSize"]),

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
        ...Vuex.mapActions("input", ["initBinary", "clearBinary"]),
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
        FormattedNumber: __vue_component__$1
      }
    };

    /* script */
    const __vue_script__$5 = script$5;
    /* template */
    var __vue_render__$5 = function() {
      var _vm = this;
      var _h = _vm.$createElement;
      var _c = _vm._self._c || _h;
      return _c("div", { staticClass: "input-switch" }, [
        _c("div", { staticClass: "switch-line" }, [
          _vm._v("Input:"),
          _c("label", [
            _c("input", {
              directives: [
                {
                  name: "model",
                  rawName: "v-model",
                  value: _vm.activeInputType,
                  expression: "activeInputType"
                }
              ],
              attrs: { type: "radio", name: "input", value: "text" },
              domProps: { checked: _vm._q(_vm.activeInputType, "text") },
              on: {
                change: function($event) {
                  _vm.activeInputType = "text";
                }
              }
            }),
            _vm._v("Text")
          ]),
          _c("label", [
            _c("input", {
              directives: [
                {
                  name: "model",
                  rawName: "v-model",
                  value: _vm.activeInputType,
                  expression: "activeInputType"
                }
              ],
              attrs: { type: "radio", name: "input", value: "file" },
              domProps: { checked: _vm._q(_vm.activeInputType, "file") },
              on: {
                change: function($event) {
                  _vm.activeInputType = "file";
                }
              }
            }),
            _vm._v("File")
          ]),
          _c(
            "label",
            {
              staticClass: "input-switch-checkbox",
              attrs: {
                title:
                  "Switch the input type automatically based on the corresponding input change"
              }
            },
            [
              _c("input", {
                directives: [
                  {
                    name: "model",
                    rawName: "v-model",
                    value: _vm.activeInputTypeAutoSwitcher,
                    expression: "activeInputTypeAutoSwitcher"
                  }
                ],
                attrs: { type: "checkbox" },
                domProps: {
                  checked: Array.isArray(_vm.activeInputTypeAutoSwitcher)
                    ? _vm._i(_vm.activeInputTypeAutoSwitcher, null) > -1
                    : _vm.activeInputTypeAutoSwitcher
                },
                on: {
                  change: function($event) {
                    var $$a = _vm.activeInputTypeAutoSwitcher,
                      $$el = $event.target,
                      $$c = $$el.checked ? true : false;
                    if (Array.isArray($$a)) {
                      var $$v = null,
                        $$i = _vm._i($$a, $$v);
                      if ($$el.checked) {
                        $$i < 0 &&
                          (_vm.activeInputTypeAutoSwitcher = $$a.concat([$$v]));
                      } else {
                        $$i > -1 &&
                          (_vm.activeInputTypeAutoSwitcher = $$a
                            .slice(0, $$i)
                            .concat($$a.slice($$i + 1)));
                      }
                    } else {
                      _vm.activeInputTypeAutoSwitcher = $$c;
                    }
                  }
                }
              }),
              _vm._v("Auto-Switch")
            ]
          )
        ]),
        _c("div", { staticClass: "input-info" }, [
          _vm._v("Input size:\n"),
          _vm.activeInputType === "file" && _vm.inputFile === null
            ? _c("span", { staticClass: "red" }, [_vm._v("no file selected")])
            : _c(
                "span",
                [
                  _c("FormattedNumber", { attrs: { number: _vm.inputByteSize } }),
                  _vm._v("\nbytes")
                ],
                1
              )
        ])
      ])
    };
    var __vue_staticRenderFns__$5 = [];
    __vue_render__$5._withStripped = true;

      /* style */
      const __vue_inject_styles__$5 = undefined;
      /* scoped */
      const __vue_scope_id__$5 = "data-v-5f65b728";
      /* module identifier */
      const __vue_module_identifier__$5 = undefined;
      /* functional template */
      const __vue_is_functional_template__$5 = false;
      /* style inject */
      
      /* style inject SSR */
      
      /* style inject shadow dom */
      

      
      const __vue_component__$5 = /*#__PURE__*/normalizeComponent(
        { render: __vue_render__$5, staticRenderFns: __vue_staticRenderFns__$5 },
        __vue_inject_styles__$5,
        __vue_script__$5,
        __vue_scope_id__$5,
        __vue_is_functional_template__$5,
        __vue_module_identifier__$5,
        false,
        undefined,
        undefined,
        undefined
      );

    //

    var script$6 = {
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
          return bytesToSize(this.totalJSHeapSize);
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
    };

    /* script */
    const __vue_script__$6 = script$6;
    /* template */
    var __vue_render__$6 = function() {
      var _vm = this;
      var _h = _vm.$createElement;
      var _c = _vm._self._c || _h;
      return _vm.isSupported
        ? _c(
            "div",
            {
              staticClass: "memory-consuming",
              style: { width: _vm.percent + "%" },
              attrs: { title: "Heap size: " + _vm.formattedSize }
            },
            [
              _c("div", {
                staticClass: "visible",
                class: { over100: _vm.over100 }
              }),
              _c("div", { staticClass: "invisible" })
            ]
          )
        : _vm._e()
    };
    var __vue_staticRenderFns__$6 = [];
    __vue_render__$6._withStripped = true;

      /* style */
      const __vue_inject_styles__$6 = undefined;
      /* scoped */
      const __vue_scope_id__$6 = "data-v-743f0284";
      /* module identifier */
      const __vue_module_identifier__$6 = undefined;
      /* functional template */
      const __vue_is_functional_template__$6 = false;
      /* style inject */
      
      /* style inject SSR */
      
      /* style inject shadow dom */
      

      
      const __vue_component__$6 = /*#__PURE__*/normalizeComponent(
        { render: __vue_render__$6, staticRenderFns: __vue_staticRenderFns__$6 },
        __vue_inject_styles__$6,
        __vue_script__$6,
        __vue_scope_id__$6,
        __vue_is_functional_template__$6,
        __vue_module_identifier__$6,
        false,
        undefined,
        undefined,
        undefined
      );

    //

    var script$7 = {
      name: "FileSettings",
      computed: {
        ...Vuex.mapState("input", {
          loadingToMemoryTime: state => state.loadingToMemoryTime,
          binaryLoading: state => state.binaryLoading,
          error: state => state.error,
        }),

        ...Vuex.mapGetters("file-settings", ["readerChunkSize"]),
        storeInMemory: {
          get() { return this.$store.state["file-settings"].storeInMemory; },
          set(value) { this.$store.commit("file-settings/storeInMemory", value); }
        },
        streamType: {
          get() { return this.$store.state["file-settings"].streamType; },
          set(value) { this.$store.commit("file-settings/streamType", value); }
        },
        readerChunkSizeMB: {
          get() { return this.$store.state["file-settings"].readerChunkSizeMB; },
          set(value) { this.$store.commit("file-settings/readerChunkSizeMB", value); }
        },
        animation: {
          get() { return this.$store.state["file-settings"].animation; },
          set(value) { this.$store.commit("file-settings/animation", value); }
        },
        fps: {
          get() { return this.$store.state["file-settings"].fps; },
          set(value) { this.$store.commit("file-settings/fps", value); }
        }
      },
      watch: {
        error() {
          if (this.error) {
            this.storeInMemory = false;
          }
        },
      },
      components: {
        FormattedNumber: __vue_component__$1
      }
    };

    /* script */
    const __vue_script__$7 = script$7;
    /* template */
    var __vue_render__$7 = function() {
      var _vm = this;
      var _h = _vm.$createElement;
      var _c = _vm._self._c || _h;
      return _c("div", { staticClass: "file-settings" }, [
        _c("div", { staticClass: "store-in-memory" }, [
          _c("label", [
            _c("input", {
              directives: [
                {
                  name: "model",
                  rawName: "v-model",
                  value: _vm.storeInMemory,
                  expression: "storeInMemory"
                }
              ],
              attrs: { type: "checkbox" },
              domProps: {
                checked: Array.isArray(_vm.storeInMemory)
                  ? _vm._i(_vm.storeInMemory, null) > -1
                  : _vm.storeInMemory
              },
              on: {
                change: function($event) {
                  var $$a = _vm.storeInMemory,
                    $$el = $event.target,
                    $$c = $$el.checked ? true : false;
                  if (Array.isArray($$a)) {
                    var $$v = null,
                      $$i = _vm._i($$a, $$v);
                    if ($$el.checked) {
                      $$i < 0 && (_vm.storeInMemory = $$a.concat([$$v]));
                    } else {
                      $$i > -1 &&
                        (_vm.storeInMemory = $$a
                          .slice(0, $$i)
                          .concat($$a.slice($$i + 1)));
                    }
                  } else {
                    _vm.storeInMemory = $$c;
                  }
                }
              }
            }),
            _vm._v("Store in memory\n"),
            _vm.error
              ? _c(
                  "span",
                  {
                    staticClass: "red",
                    attrs: { title: _vm.error.name + ": " + _vm.error.message }
                  },
                  [_vm._v("(error...)")]
                )
              : _vm.binaryLoading
              ? _c("span", [_vm._v("(loadings...)")])
              : _vm.loadingToMemoryTime && _vm.storeInMemory
              ? _c(
                  "span",
                  { attrs: { title: "loaded in" } },
                  [
                    _vm._v("("),
                    _c("FormattedNumber", {
                      attrs: { number: _vm.loadingToMemoryTime }
                    }),
                    _vm._v("\nms)")
                  ],
                  1
                )
              : _vm._e()
          ])
        ]),
        _c("div", { staticClass: "stream-type" }, [
          _c("div", { style: { opacity: _vm.storeInMemory ? 0.5 : 1 } }, [
            _c("label", [
              _c("input", {
                directives: [
                  {
                    name: "model",
                    rawName: "v-model",
                    value: _vm.streamType,
                    expression: "streamType"
                  }
                ],
                attrs: { type: "radio", name: "streamType", value: "FileReader" },
                domProps: { checked: _vm._q(_vm.streamType, "FileReader") },
                on: {
                  change: function($event) {
                    _vm.streamType = "FileReader";
                  }
                }
              }),
              _vm._v("FileReader")
            ]),
            _c("label", [
              _c("input", {
                directives: [
                  {
                    name: "model",
                    rawName: "v-model",
                    value: _vm.streamType,
                    expression: "streamType"
                  }
                ],
                attrs: {
                  type: "radio",
                  name: "streamType",
                  value: "ReadableStream"
                },
                domProps: { checked: _vm._q(_vm.streamType, "ReadableStream") },
                on: {
                  change: function($event) {
                    _vm.streamType = "ReadableStream";
                  }
                }
              }),
              _vm._v("ReadableStream")
            ])
          ]),
          _c(
            "label",
            {
              style: {
                opacity:
                  _vm.streamType === "ReadableStream" && !_vm.storeInMemory
                    ? 0.5
                    : 1
              },
              attrs: { title: "Chunk size for progressive hashing, Megabytes" }
            },
            [
              _vm._v("Chunk size, MB"),
              _c("input", {
                directives: [
                  {
                    name: "model",
                    rawName: "v-model",
                    value: _vm.readerChunkSizeMB,
                    expression: "readerChunkSizeMB"
                  }
                ],
                class: { invalid: _vm.readerChunkSize < 1 },
                attrs: {
                  type: "number",
                  min: "0.1",
                  step: "0.1",
                  title:
                    _vm.readerChunkSize > 0
                      ? ""
                      : "Value must be greater than or equal to 1 byte"
                },
                domProps: { value: _vm.readerChunkSizeMB },
                on: {
                  input: function($event) {
                    if ($event.target.composing) {
                      return
                    }
                    _vm.readerChunkSizeMB = $event.target.value;
                  }
                }
              })
            ]
          )
        ]),
        _c("div", { staticClass: "animation" }, [
          _c("span", { staticClass: "checkbox" }, [
            _c("label", [
              _c("input", {
                directives: [
                  {
                    name: "model",
                    rawName: "v-model",
                    value: _vm.animation,
                    expression: "animation"
                  }
                ],
                attrs: { type: "checkbox" },
                domProps: {
                  checked: Array.isArray(_vm.animation)
                    ? _vm._i(_vm.animation, null) > -1
                    : _vm.animation
                },
                on: {
                  change: function($event) {
                    var $$a = _vm.animation,
                      $$el = $event.target,
                      $$c = $$el.checked ? true : false;
                    if (Array.isArray($$a)) {
                      var $$v = null,
                        $$i = _vm._i($$a, $$v);
                      if ($$el.checked) {
                        $$i < 0 && (_vm.animation = $$a.concat([$$v]));
                      } else {
                        $$i > -1 &&
                          (_vm.animation = $$a
                            .slice(0, $$i)
                            .concat($$a.slice($$i + 1)));
                      }
                    } else {
                      _vm.animation = $$c;
                    }
                  }
                }
              }),
              _vm._v("Animation,\n")
            ])
          ]),
          _c(
            "span",
            { staticClass: "fps", style: { opacity: _vm.animation ? 1 : 0.5 } },
            [
              _c("label", [
                _vm._v("FPS"),
                _c("input", {
                  directives: [
                    {
                      name: "model",
                      rawName: "v-model",
                      value: _vm.fps,
                      expression: "fps"
                    }
                  ],
                  attrs: { type: "number" },
                  domProps: { value: _vm.fps },
                  on: {
                    input: function($event) {
                      if ($event.target.composing) {
                        return
                      }
                      _vm.fps = $event.target.value;
                    }
                  }
                })
              ])
            ]
          )
        ])
      ])
    };
    var __vue_staticRenderFns__$7 = [];
    __vue_render__$7._withStripped = true;

      /* style */
      const __vue_inject_styles__$7 = undefined;
      /* scoped */
      const __vue_scope_id__$7 = "data-v-60ea9f4e";
      /* module identifier */
      const __vue_module_identifier__$7 = undefined;
      /* functional template */
      const __vue_is_functional_template__$7 = false;
      /* style inject */
      
      /* style inject SSR */
      
      /* style inject shadow dom */
      

      
      const __vue_component__$7 = /*#__PURE__*/normalizeComponent(
        { render: __vue_render__$7, staticRenderFns: __vue_staticRenderFns__$7 },
        __vue_inject_styles__$7,
        __vue_script__$7,
        __vue_scope_id__$7,
        __vue_is_functional_template__$7,
        __vue_module_identifier__$7,
        false,
        undefined,
        undefined,
        undefined
      );

    /**
     * A normalised hasher
     * @abstract
     */
    class Hasher {
        static binarySupported = true;
        static updateSupported = true;
    }

    //todo
    // https://stackoverflow.com/questions/1655769/fastest-md5-implementation-in-javascript
    // -
    // https://github.com/gorhill/yamd5.js/blob/master/yamd5.js
    // -
    // http://pajhome.org.uk/crypt/md5/md5.html
    // -
    // http://www.myersdaily.org/joseph/javascript/md5-text.html
    // http://www.myersdaily.org/joseph/javascript/md5.js
    // -
    // https://github.com/cotag/ts-md5


    class HasherBlueimp extends Hasher {
        static githubName = "blueimp/JavaScript-MD5";
        static binarySupported = false;
        static updateSupported = false;
        static hash(data) {
            if (!isString(data)) {
                throw new TypeError("Data must be a string");
            }
            return blueimpMD5(data);
        }
    }

    class HasherCryptoJS extends Hasher {
        static githubName = "brix/crypto-js";
        constructor() {
            super();
            this.hasher = CryptoJS.algo.MD5.create();
        }

        static _consumize(data) {
            if (isString(data)) {
                return data;
            } else if (ArrayBuffer.isView(data) || isArrayBuffer(data)) {
                return CryptoJS.lib.WordArray.create(data);
            } else {
                throw new TypeError("Data must be a string or a buffer");
            }
        }

        update(data) {
            const _data = HasherCryptoJS._consumize(data);
            this.hasher.update(_data);
            return this;
        }

        finalize() {
            return this.hasher.finalize().toString();
        }

        static hash(data) {
            const _data = HasherCryptoJS._consumize(data);
            return CryptoJS.MD5(_data).toString();
        }
    }

    class HasherCbMD5 extends Hasher {
        static githubName = "crypto-browserify/md5.js";
        constructor() {
            super();
            this.hasher = new CbMD5();
        }

        _consumize(data) {
            if (isString(data)) {
                return data;
            } else if (ArrayBuffer.isView(data) || isArrayBuffer(data)) {
                return Buffer.from(data);
            } else {
                throw new TypeError("Data must be a string or a buffer");
            }
        }

        update(data) {
            const _data = this._consumize(data);
            this.hasher.update(_data);
            return this;
        }

        finalize() {
            return this.hasher.digest("hex");
        }

        static hash(data) {
            return new HasherCbMD5().update(data).finalize();
        }
    }

    class HasherJsMD5 extends Hasher {
        static githubName = "emn178/js-md5";
        constructor() {
            super();
            this.hasher = JsMD5.create();
        }

        update(data) {
            this.hasher.update(data);
            return this;
        }

        finalize() {
            return this.hasher.hex();
        }

        static hash(data) {
            return JsMD5(data);
        }
    }

    class HasherNodeMD5 extends Hasher {
        static githubName = "pvorb/node-md5";
        static updateSupported = false;
        static _consumize(data) {
            if (isString(data)) {
                return data;
            } else if (ArrayBuffer.isView(data) || isArrayBuffer(data)) {
                return Buffer.from(data);
            } else {
                throw new TypeError("Data must be a string or a buffer");
            }
        }

        static hash(data) {
            return nodeMD5(HasherNodeMD5._consumize(data));
        }
    }

    class HasherSparkMD5 extends Hasher {
        static githubName = "satazor/js-spark-md5";
        constructor() {
            super();
            this.hasher = new SparkMD5.ArrayBuffer();
        }

        static _consumize(data) {
            if (isString(data)) {
                return new TextEncoder().encode(data);
            }
            return data;
        }

        update(data) {
            const _data = HasherSparkMD5._consumize(data);
            this.hasher.append(_data);
            return this;
        }

        finalize() {
            return this.hasher.end();
        }

        static hash(data) {
            const _data = HasherSparkMD5._consumize(data);
            return SparkMD5.ArrayBuffer.hash(_data);
        }
    }


    const MD5 = {};
    Object.assign(MD5, {
        Blueimp: HasherBlueimp,
        CryptoJS: HasherCryptoJS,
        Browserify: HasherCbMD5,
        Emn178: HasherJsMD5,
        Node: HasherNodeMD5,
        Spark: HasherSparkMD5,
    });
    Object.defineProperty(MD5, "list", { get: function() { return Object.values(this); } });
     // globalThis.MD5 = MD5;

    //

    var script$8 = {
      name: "MainContainer",
      data() {
        return {
          hashers: MD5.list
        }
      },
      computed: {
        ...Vuex.mapState("input", {
          inputText: state => state.text,
          inputFile: state => state.file,
          inputBinary: state => state.binary
        }),

        ...Vuex.mapState("input-switch", {
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
            await new Promise(resolve => setImmediate(resolve));
          }
        },
      },
      components: {
        TextInput: __vue_component__$4,
        FileInputDragNDrop: __vue_component__$3,
        FormattedNumber: __vue_component__$1,
        HasherItem: __vue_component__$2,
        InputSwitch: __vue_component__$5,
        MemoryConsuming: __vue_component__$6,
        FileSettings: __vue_component__$7
      }
    };

    /* script */
    const __vue_script__$8 = script$8;
    /* template */
    var __vue_render__$8 = function() {
      var _vm = this;
      var _h = _vm.$createElement;
      var _c = _vm._self._c || _h;
      return _c(
        "div",
        { staticClass: "main-container-component" },
        [
          _c("MemoryConsuming"),
          _c("div", { staticClass: "inputs" }, [
            _c(
              "div",
              { staticClass: "text-input-wrapper" },
              [
                _c("TextInput", {
                  class: { "selected-input": _vm.activeInputType === "text" }
                })
              ],
              1
            ),
            _c(
              "div",
              { staticClass: "file-group" },
              [
                _c("FileInputDragNDrop", {
                  ref: "fileInputComponent",
                  class: { "selected-input": _vm.activeInputType === "file" }
                }),
                _c("FileSettings", {
                  class: { inactive: _vm.activeInputType !== "file" }
                })
              ],
              1
            )
          ]),
          _c("InputSwitch"),
          _c(
            "div",
            { staticClass: "items" },
            _vm._l(_vm.hashers, function(hasher, index) {
              return _c("HasherItem", {
                key: index,
                ref: "items",
                refInFor: true,
                attrs: { hasher: hasher, input: _vm.input }
              })
            }),
            1
          ),
          _c("div", { staticClass: "interface" }, [
            _c("button", { on: { click: _vm.computeAll } }, [_vm._v("Compute all")])
          ])
        ],
        1
      )
    };
    var __vue_staticRenderFns__$8 = [];
    __vue_render__$8._withStripped = true;

      /* style */
      const __vue_inject_styles__$8 = undefined;
      /* scoped */
      const __vue_scope_id__$8 = "data-v-b277aaf6";
      /* module identifier */
      const __vue_module_identifier__$8 = undefined;
      /* functional template */
      const __vue_is_functional_template__$8 = false;
      /* style inject */
      
      /* style inject SSR */
      
      /* style inject shadow dom */
      

      
      const __vue_component__$8 = /*#__PURE__*/normalizeComponent(
        { render: __vue_render__$8, staticRenderFns: __vue_staticRenderFns__$8 },
        __vue_inject_styles__$8,
        __vue_script__$8,
        __vue_scope_id__$8,
        __vue_is_functional_template__$8,
        __vue_module_identifier__$8,
        false,
        undefined,
        undefined,
        undefined
      );

    new Vue__default['default']({
        store,
        render: createElement => createElement(__vue_component__$8),
    }).$mount("#app");

}(Vue, Vuex));
//# sourceMappingURL=index.js.map
