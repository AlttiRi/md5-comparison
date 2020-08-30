(function (Vue$1) {
  'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var Vue__default = /*#__PURE__*/_interopDefaultLegacy(Vue$1);

  /*!
   * vuex v3.5.1
   * (c) 2020 Evan You
   * @license MIT
   */
  function applyMixin (Vue) {
    var version = Number(Vue.version.split('.')[0]);

    if (version >= 2) {
      Vue.mixin({ beforeCreate: vuexInit });
    } else {
      // override init and inject vuex init procedure
      // for 1.x backwards compatibility.
      var _init = Vue.prototype._init;
      Vue.prototype._init = function (options) {
        if ( options === void 0 ) options = {};

        options.init = options.init
          ? [vuexInit].concat(options.init)
          : vuexInit;
        _init.call(this, options);
      };
    }

    /**
     * Vuex init hook, injected into each instances init hooks list.
     */

    function vuexInit () {
      var options = this.$options;
      // store injection
      if (options.store) {
        this.$store = typeof options.store === 'function'
          ? options.store()
          : options.store;
      } else if (options.parent && options.parent.$store) {
        this.$store = options.parent.$store;
      }
    }
  }

  var target = typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
      ? global
      : {};
  var devtoolHook = target.__VUE_DEVTOOLS_GLOBAL_HOOK__;

  function devtoolPlugin (store) {
    if (!devtoolHook) { return }

    store._devtoolHook = devtoolHook;

    devtoolHook.emit('vuex:init', store);

    devtoolHook.on('vuex:travel-to-state', function (targetState) {
      store.replaceState(targetState);
    });

    store.subscribe(function (mutation, state) {
      devtoolHook.emit('vuex:mutation', mutation, state);
    }, { prepend: true });

    store.subscribeAction(function (action, state) {
      devtoolHook.emit('vuex:action', action, state);
    }, { prepend: true });
  }

  /**
   * Get the first item that pass the test
   * by second argument function
   *
   * @param {Array} list
   * @param {Function} f
   * @return {*}
   */
  function find (list, f) {
    return list.filter(f)[0]
  }

  /**
   * Deep copy the given object considering circular structure.
   * This function caches all nested objects and its copies.
   * If it detects circular structure, use cached copy to avoid infinite loop.
   *
   * @param {*} obj
   * @param {Array<Object>} cache
   * @return {*}
   */
  function deepCopy (obj, cache) {
    if ( cache === void 0 ) cache = [];

    // just return if obj is immutable value
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    // if obj is hit, it is in circular structure
    var hit = find(cache, function (c) { return c.original === obj; });
    if (hit) {
      return hit.copy
    }

    var copy = Array.isArray(obj) ? [] : {};
    // put the copy into cache at first
    // because we want to refer it in recursive deepCopy
    cache.push({
      original: obj,
      copy: copy
    });

    Object.keys(obj).forEach(function (key) {
      copy[key] = deepCopy(obj[key], cache);
    });

    return copy
  }

  /**
   * forEach for object
   */
  function forEachValue (obj, fn) {
    Object.keys(obj).forEach(function (key) { return fn(obj[key], key); });
  }

  function isObject (obj) {
    return obj !== null && typeof obj === 'object'
  }

  function isPromise (val) {
    return val && typeof val.then === 'function'
  }

  function partial (fn, arg) {
    return function () {
      return fn(arg)
    }
  }

  // Base data struct for store's module, package with some attribute and method
  var Module = function Module (rawModule, runtime) {
    this.runtime = runtime;
    // Store some children item
    this._children = Object.create(null);
    // Store the origin module object which passed by programmer
    this._rawModule = rawModule;
    var rawState = rawModule.state;

    // Store the origin module's state
    this.state = (typeof rawState === 'function' ? rawState() : rawState) || {};
  };

  var prototypeAccessors = { namespaced: { configurable: true } };

  prototypeAccessors.namespaced.get = function () {
    return !!this._rawModule.namespaced
  };

  Module.prototype.addChild = function addChild (key, module) {
    this._children[key] = module;
  };

  Module.prototype.removeChild = function removeChild (key) {
    delete this._children[key];
  };

  Module.prototype.getChild = function getChild (key) {
    return this._children[key]
  };

  Module.prototype.hasChild = function hasChild (key) {
    return key in this._children
  };

  Module.prototype.update = function update (rawModule) {
    this._rawModule.namespaced = rawModule.namespaced;
    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions;
    }
    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations;
    }
    if (rawModule.getters) {
      this._rawModule.getters = rawModule.getters;
    }
  };

  Module.prototype.forEachChild = function forEachChild (fn) {
    forEachValue(this._children, fn);
  };

  Module.prototype.forEachGetter = function forEachGetter (fn) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn);
    }
  };

  Module.prototype.forEachAction = function forEachAction (fn) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn);
    }
  };

  Module.prototype.forEachMutation = function forEachMutation (fn) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn);
    }
  };

  Object.defineProperties( Module.prototype, prototypeAccessors );

  var ModuleCollection = function ModuleCollection (rawRootModule) {
    // register root module (Vuex.Store options)
    this.register([], rawRootModule, false);
  };

  ModuleCollection.prototype.get = function get (path) {
    return path.reduce(function (module, key) {
      return module.getChild(key)
    }, this.root)
  };

  ModuleCollection.prototype.getNamespace = function getNamespace (path) {
    var module = this.root;
    return path.reduce(function (namespace, key) {
      module = module.getChild(key);
      return namespace + (module.namespaced ? key + '/' : '')
    }, '')
  };

  ModuleCollection.prototype.update = function update$1 (rawRootModule) {
    update([], this.root, rawRootModule);
  };

  ModuleCollection.prototype.register = function register (path, rawModule, runtime) {
      var this$1 = this;
      if ( runtime === void 0 ) runtime = true;

    var newModule = new Module(rawModule, runtime);
    if (path.length === 0) {
      this.root = newModule;
    } else {
      var parent = this.get(path.slice(0, -1));
      parent.addChild(path[path.length - 1], newModule);
    }

    // register nested modules
    if (rawModule.modules) {
      forEachValue(rawModule.modules, function (rawChildModule, key) {
        this$1.register(path.concat(key), rawChildModule, runtime);
      });
    }
  };

  ModuleCollection.prototype.unregister = function unregister (path) {
    var parent = this.get(path.slice(0, -1));
    var key = path[path.length - 1];
    var child = parent.getChild(key);

    if (!child) {
      return
    }

    if (!child.runtime) {
      return
    }

    parent.removeChild(key);
  };

  ModuleCollection.prototype.isRegistered = function isRegistered (path) {
    var parent = this.get(path.slice(0, -1));
    var key = path[path.length - 1];

    return parent.hasChild(key)
  };

  function update (path, targetModule, newModule) {

    // update target module
    targetModule.update(newModule);

    // update nested modules
    if (newModule.modules) {
      for (var key in newModule.modules) {
        if (!targetModule.getChild(key)) {
          return
        }
        update(
          path.concat(key),
          targetModule.getChild(key),
          newModule.modules[key]
        );
      }
    }
  }

  var Vue; // bind on install

  var Store = function Store (options) {
    var this$1 = this;
    if ( options === void 0 ) options = {};

    // Auto install if it is not done yet and `window` has `Vue`.
    // To allow users to avoid auto-installation in some cases,
    // this code should be placed here. See #731
    if (!Vue && typeof window !== 'undefined' && window.Vue) {
      install(window.Vue);
    }

    var plugins = options.plugins; if ( plugins === void 0 ) plugins = [];
    var strict = options.strict; if ( strict === void 0 ) strict = false;

    // store internal state
    this._committing = false;
    this._actions = Object.create(null);
    this._actionSubscribers = [];
    this._mutations = Object.create(null);
    this._wrappedGetters = Object.create(null);
    this._modules = new ModuleCollection(options);
    this._modulesNamespaceMap = Object.create(null);
    this._subscribers = [];
    this._watcherVM = new Vue();
    this._makeLocalGettersCache = Object.create(null);

    // bind commit and dispatch to self
    var store = this;
    var ref = this;
    var dispatch = ref.dispatch;
    var commit = ref.commit;
    this.dispatch = function boundDispatch (type, payload) {
      return dispatch.call(store, type, payload)
    };
    this.commit = function boundCommit (type, payload, options) {
      return commit.call(store, type, payload, options)
    };

    // strict mode
    this.strict = strict;

    var state = this._modules.root.state;

    // init root module.
    // this also recursively registers all sub-modules
    // and collects all module getters inside this._wrappedGetters
    installModule(this, state, [], this._modules.root);

    // initialize the store vm, which is responsible for the reactivity
    // (also registers _wrappedGetters as computed properties)
    resetStoreVM(this, state);

    // apply plugins
    plugins.forEach(function (plugin) { return plugin(this$1); });

    var useDevtools = options.devtools !== undefined ? options.devtools : Vue.config.devtools;
    if (useDevtools) {
      devtoolPlugin(this);
    }
  };

  var prototypeAccessors$1 = { state: { configurable: true } };

  prototypeAccessors$1.state.get = function () {
    return this._vm._data.$$state
  };

  prototypeAccessors$1.state.set = function (v) {
  };

  Store.prototype.commit = function commit (_type, _payload, _options) {
      var this$1 = this;

    // check object-style commit
    var ref = unifyObjectStyle(_type, _payload, _options);
      var type = ref.type;
      var payload = ref.payload;

    var mutation = { type: type, payload: payload };
    var entry = this._mutations[type];
    if (!entry) {
      return
    }
    this._withCommit(function () {
      entry.forEach(function commitIterator (handler) {
        handler(payload);
      });
    });

    this._subscribers
      .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
      .forEach(function (sub) { return sub(mutation, this$1.state); });
  };

  Store.prototype.dispatch = function dispatch (_type, _payload) {
      var this$1 = this;

    // check object-style dispatch
    var ref = unifyObjectStyle(_type, _payload);
      var type = ref.type;
      var payload = ref.payload;

    var action = { type: type, payload: payload };
    var entry = this._actions[type];
    if (!entry) {
      return
    }

    try {
      this._actionSubscribers
        .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
        .filter(function (sub) { return sub.before; })
        .forEach(function (sub) { return sub.before(action, this$1.state); });
    } catch (e) {
    }

    var result = entry.length > 1
      ? Promise.all(entry.map(function (handler) { return handler(payload); }))
      : entry[0](payload);

    return new Promise(function (resolve, reject) {
      result.then(function (res) {
        try {
          this$1._actionSubscribers
            .filter(function (sub) { return sub.after; })
            .forEach(function (sub) { return sub.after(action, this$1.state); });
        } catch (e) {
        }
        resolve(res);
      }, function (error) {
        try {
          this$1._actionSubscribers
            .filter(function (sub) { return sub.error; })
            .forEach(function (sub) { return sub.error(action, this$1.state, error); });
        } catch (e) {
        }
        reject(error);
      });
    })
  };

  Store.prototype.subscribe = function subscribe (fn, options) {
    return genericSubscribe(fn, this._subscribers, options)
  };

  Store.prototype.subscribeAction = function subscribeAction (fn, options) {
    var subs = typeof fn === 'function' ? { before: fn } : fn;
    return genericSubscribe(subs, this._actionSubscribers, options)
  };

  Store.prototype.watch = function watch (getter, cb, options) {
      var this$1 = this;
    return this._watcherVM.$watch(function () { return getter(this$1.state, this$1.getters); }, cb, options)
  };

  Store.prototype.replaceState = function replaceState (state) {
      var this$1 = this;

    this._withCommit(function () {
      this$1._vm._data.$$state = state;
    });
  };

  Store.prototype.registerModule = function registerModule (path, rawModule, options) {
      if ( options === void 0 ) options = {};

    if (typeof path === 'string') { path = [path]; }

    this._modules.register(path, rawModule);
    installModule(this, this.state, path, this._modules.get(path), options.preserveState);
    // reset store to update getters...
    resetStoreVM(this, this.state);
  };

  Store.prototype.unregisterModule = function unregisterModule (path) {
      var this$1 = this;

    if (typeof path === 'string') { path = [path]; }

    this._modules.unregister(path);
    this._withCommit(function () {
      var parentState = getNestedState(this$1.state, path.slice(0, -1));
      Vue.delete(parentState, path[path.length - 1]);
    });
    resetStore(this);
  };

  Store.prototype.hasModule = function hasModule (path) {
    if (typeof path === 'string') { path = [path]; }

    return this._modules.isRegistered(path)
  };

  Store.prototype.hotUpdate = function hotUpdate (newOptions) {
    this._modules.update(newOptions);
    resetStore(this, true);
  };

  Store.prototype._withCommit = function _withCommit (fn) {
    var committing = this._committing;
    this._committing = true;
    fn();
    this._committing = committing;
  };

  Object.defineProperties( Store.prototype, prototypeAccessors$1 );

  function genericSubscribe (fn, subs, options) {
    if (subs.indexOf(fn) < 0) {
      options && options.prepend
        ? subs.unshift(fn)
        : subs.push(fn);
    }
    return function () {
      var i = subs.indexOf(fn);
      if (i > -1) {
        subs.splice(i, 1);
      }
    }
  }

  function resetStore (store, hot) {
    store._actions = Object.create(null);
    store._mutations = Object.create(null);
    store._wrappedGetters = Object.create(null);
    store._modulesNamespaceMap = Object.create(null);
    var state = store.state;
    // init all modules
    installModule(store, state, [], store._modules.root, true);
    // reset vm
    resetStoreVM(store, state, hot);
  }

  function resetStoreVM (store, state, hot) {
    var oldVm = store._vm;

    // bind store public getters
    store.getters = {};
    // reset local getters cache
    store._makeLocalGettersCache = Object.create(null);
    var wrappedGetters = store._wrappedGetters;
    var computed = {};
    forEachValue(wrappedGetters, function (fn, key) {
      // use computed to leverage its lazy-caching mechanism
      // direct inline function use will lead to closure preserving oldVm.
      // using partial to return function with only arguments preserved in closure environment.
      computed[key] = partial(fn, store);
      Object.defineProperty(store.getters, key, {
        get: function () { return store._vm[key]; },
        enumerable: true // for local getters
      });
    });

    // use a Vue instance to store the state tree
    // suppress warnings just in case the user has added
    // some funky global mixins
    var silent = Vue.config.silent;
    Vue.config.silent = true;
    store._vm = new Vue({
      data: {
        $$state: state
      },
      computed: computed
    });
    Vue.config.silent = silent;

    // enable strict mode for new vm
    if (store.strict) {
      enableStrictMode(store);
    }

    if (oldVm) {
      if (hot) {
        // dispatch changes in all subscribed watchers
        // to force getter re-evaluation for hot reloading.
        store._withCommit(function () {
          oldVm._data.$$state = null;
        });
      }
      Vue.nextTick(function () { return oldVm.$destroy(); });
    }
  }

  function installModule (store, rootState, path, module, hot) {
    var isRoot = !path.length;
    var namespace = store._modules.getNamespace(path);

    // register in namespace map
    if (module.namespaced) {
      if (store._modulesNamespaceMap[namespace] && ("production" !== 'production')) {
        console.error(("[vuex] duplicate namespace " + namespace + " for the namespaced module " + (path.join('/'))));
      }
      store._modulesNamespaceMap[namespace] = module;
    }

    // set state
    if (!isRoot && !hot) {
      var parentState = getNestedState(rootState, path.slice(0, -1));
      var moduleName = path[path.length - 1];
      store._withCommit(function () {
        Vue.set(parentState, moduleName, module.state);
      });
    }

    var local = module.context = makeLocalContext(store, namespace, path);

    module.forEachMutation(function (mutation, key) {
      var namespacedType = namespace + key;
      registerMutation(store, namespacedType, mutation, local);
    });

    module.forEachAction(function (action, key) {
      var type = action.root ? key : namespace + key;
      var handler = action.handler || action;
      registerAction(store, type, handler, local);
    });

    module.forEachGetter(function (getter, key) {
      var namespacedType = namespace + key;
      registerGetter(store, namespacedType, getter, local);
    });

    module.forEachChild(function (child, key) {
      installModule(store, rootState, path.concat(key), child, hot);
    });
  }

  /**
   * make localized dispatch, commit, getters and state
   * if there is no namespace, just use root ones
   */
  function makeLocalContext (store, namespace, path) {
    var noNamespace = namespace === '';

    var local = {
      dispatch: noNamespace ? store.dispatch : function (_type, _payload, _options) {
        var args = unifyObjectStyle(_type, _payload, _options);
        var payload = args.payload;
        var options = args.options;
        var type = args.type;

        if (!options || !options.root) {
          type = namespace + type;
        }

        return store.dispatch(type, payload)
      },

      commit: noNamespace ? store.commit : function (_type, _payload, _options) {
        var args = unifyObjectStyle(_type, _payload, _options);
        var payload = args.payload;
        var options = args.options;
        var type = args.type;

        if (!options || !options.root) {
          type = namespace + type;
        }

        store.commit(type, payload, options);
      }
    };

    // getters and state object must be gotten lazily
    // because they will be changed by vm update
    Object.defineProperties(local, {
      getters: {
        get: noNamespace
          ? function () { return store.getters; }
          : function () { return makeLocalGetters(store, namespace); }
      },
      state: {
        get: function () { return getNestedState(store.state, path); }
      }
    });

    return local
  }

  function makeLocalGetters (store, namespace) {
    if (!store._makeLocalGettersCache[namespace]) {
      var gettersProxy = {};
      var splitPos = namespace.length;
      Object.keys(store.getters).forEach(function (type) {
        // skip if the target getter is not match this namespace
        if (type.slice(0, splitPos) !== namespace) { return }

        // extract local getter type
        var localType = type.slice(splitPos);

        // Add a port to the getters proxy.
        // Define as getter property because
        // we do not want to evaluate the getters in this time.
        Object.defineProperty(gettersProxy, localType, {
          get: function () { return store.getters[type]; },
          enumerable: true
        });
      });
      store._makeLocalGettersCache[namespace] = gettersProxy;
    }

    return store._makeLocalGettersCache[namespace]
  }

  function registerMutation (store, type, handler, local) {
    var entry = store._mutations[type] || (store._mutations[type] = []);
    entry.push(function wrappedMutationHandler (payload) {
      handler.call(store, local.state, payload);
    });
  }

  function registerAction (store, type, handler, local) {
    var entry = store._actions[type] || (store._actions[type] = []);
    entry.push(function wrappedActionHandler (payload) {
      var res = handler.call(store, {
        dispatch: local.dispatch,
        commit: local.commit,
        getters: local.getters,
        state: local.state,
        rootGetters: store.getters,
        rootState: store.state
      }, payload);
      if (!isPromise(res)) {
        res = Promise.resolve(res);
      }
      if (store._devtoolHook) {
        return res.catch(function (err) {
          store._devtoolHook.emit('vuex:error', err);
          throw err
        })
      } else {
        return res
      }
    });
  }

  function registerGetter (store, type, rawGetter, local) {
    if (store._wrappedGetters[type]) {
      return
    }
    store._wrappedGetters[type] = function wrappedGetter (store) {
      return rawGetter(
        local.state, // local state
        local.getters, // local getters
        store.state, // root state
        store.getters // root getters
      )
    };
  }

  function enableStrictMode (store) {
    store._vm.$watch(function () { return this._data.$$state }, function () {
    }, { deep: true, sync: true });
  }

  function getNestedState (state, path) {
    return path.reduce(function (state, key) { return state[key]; }, state)
  }

  function unifyObjectStyle (type, payload, options) {
    if (isObject(type) && type.type) {
      options = payload;
      payload = type;
      type = type.type;
    }

    return { type: type, payload: payload, options: options }
  }

  function install (_Vue) {
    if (Vue && _Vue === Vue) {
      return
    }
    Vue = _Vue;
    applyMixin(Vue);
  }

  /**
   * Reduce the code which written in Vue.js for getting the state.
   * @param {String} [namespace] - Module's namespace
   * @param {Object|Array} states # Object's item can be a function which accept state and getters for param, you can do something for state and getters in it.
   * @param {Object}
   */
  var mapState = normalizeNamespace(function (namespace, states) {
    var res = {};
    normalizeMap(states).forEach(function (ref) {
      var key = ref.key;
      var val = ref.val;

      res[key] = function mappedState () {
        var state = this.$store.state;
        var getters = this.$store.getters;
        if (namespace) {
          var module = getModuleByNamespace(this.$store, 'mapState', namespace);
          if (!module) {
            return
          }
          state = module.context.state;
          getters = module.context.getters;
        }
        return typeof val === 'function'
          ? val.call(this, state, getters)
          : state[val]
      };
      // mark vuex getter for devtools
      res[key].vuex = true;
    });
    return res
  });

  /**
   * Reduce the code which written in Vue.js for committing the mutation
   * @param {String} [namespace] - Module's namespace
   * @param {Object|Array} mutations # Object's item can be a function which accept `commit` function as the first param, it can accept anthor params. You can commit mutation and do any other things in this function. specially, You need to pass anthor params from the mapped function.
   * @return {Object}
   */
  var mapMutations = normalizeNamespace(function (namespace, mutations) {
    var res = {};
    normalizeMap(mutations).forEach(function (ref) {
      var key = ref.key;
      var val = ref.val;

      res[key] = function mappedMutation () {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        // Get the commit method from store
        var commit = this.$store.commit;
        if (namespace) {
          var module = getModuleByNamespace(this.$store, 'mapMutations', namespace);
          if (!module) {
            return
          }
          commit = module.context.commit;
        }
        return typeof val === 'function'
          ? val.apply(this, [commit].concat(args))
          : commit.apply(this.$store, [val].concat(args))
      };
    });
    return res
  });

  /**
   * Reduce the code which written in Vue.js for getting the getters
   * @param {String} [namespace] - Module's namespace
   * @param {Object|Array} getters
   * @return {Object}
   */
  var mapGetters = normalizeNamespace(function (namespace, getters) {
    var res = {};
    normalizeMap(getters).forEach(function (ref) {
      var key = ref.key;
      var val = ref.val;

      // The namespace has been mutated by normalizeNamespace
      val = namespace + val;
      res[key] = function mappedGetter () {
        if (namespace && !getModuleByNamespace(this.$store, 'mapGetters', namespace)) {
          return
        }
        return this.$store.getters[val]
      };
      // mark vuex getter for devtools
      res[key].vuex = true;
    });
    return res
  });

  /**
   * Reduce the code which written in Vue.js for dispatch the action
   * @param {String} [namespace] - Module's namespace
   * @param {Object|Array} actions # Object's item can be a function which accept `dispatch` function as the first param, it can accept anthor params. You can dispatch action and do any other things in this function. specially, You need to pass anthor params from the mapped function.
   * @return {Object}
   */
  var mapActions = normalizeNamespace(function (namespace, actions) {
    var res = {};
    normalizeMap(actions).forEach(function (ref) {
      var key = ref.key;
      var val = ref.val;

      res[key] = function mappedAction () {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        // get dispatch function from store
        var dispatch = this.$store.dispatch;
        if (namespace) {
          var module = getModuleByNamespace(this.$store, 'mapActions', namespace);
          if (!module) {
            return
          }
          dispatch = module.context.dispatch;
        }
        return typeof val === 'function'
          ? val.apply(this, [dispatch].concat(args))
          : dispatch.apply(this.$store, [val].concat(args))
      };
    });
    return res
  });

  /**
   * Rebinding namespace param for mapXXX function in special scoped, and return them by simple object
   * @param {String} namespace
   * @return {Object}
   */
  var createNamespacedHelpers = function (namespace) { return ({
    mapState: mapState.bind(null, namespace),
    mapGetters: mapGetters.bind(null, namespace),
    mapMutations: mapMutations.bind(null, namespace),
    mapActions: mapActions.bind(null, namespace)
  }); };

  /**
   * Normalize the map
   * normalizeMap([1, 2, 3]) => [ { key: 1, val: 1 }, { key: 2, val: 2 }, { key: 3, val: 3 } ]
   * normalizeMap({a: 1, b: 2, c: 3}) => [ { key: 'a', val: 1 }, { key: 'b', val: 2 }, { key: 'c', val: 3 } ]
   * @param {Array|Object} map
   * @return {Object}
   */
  function normalizeMap (map) {
    if (!isValidMap(map)) {
      return []
    }
    return Array.isArray(map)
      ? map.map(function (key) { return ({ key: key, val: key }); })
      : Object.keys(map).map(function (key) { return ({ key: key, val: map[key] }); })
  }

  /**
   * Validate whether given map is valid or not
   * @param {*} map
   * @return {Boolean}
   */
  function isValidMap (map) {
    return Array.isArray(map) || isObject(map)
  }

  /**
   * Return a function expect two param contains namespace and map. it will normalize the namespace and then the param's function will handle the new namespace and the map.
   * @param {Function} fn
   * @return {Function}
   */
  function normalizeNamespace (fn) {
    return function (namespace, map) {
      if (typeof namespace !== 'string') {
        map = namespace;
        namespace = '';
      } else if (namespace.charAt(namespace.length - 1) !== '/') {
        namespace += '/';
      }
      return fn(namespace, map)
    }
  }

  /**
   * Search a special module from store by namespace. if module not exist, print error message.
   * @param {Object} store
   * @param {String} helper
   * @param {String} namespace
   * @return {Object}
   */
  function getModuleByNamespace (store, helper, namespace) {
    var module = store._modulesNamespaceMap[namespace];
    return module
  }

  // Credits: borrowed code from fcomb/redux-logger

  function createLogger (ref) {
    if ( ref === void 0 ) ref = {};
    var collapsed = ref.collapsed; if ( collapsed === void 0 ) collapsed = true;
    var filter = ref.filter; if ( filter === void 0 ) filter = function (mutation, stateBefore, stateAfter) { return true; };
    var transformer = ref.transformer; if ( transformer === void 0 ) transformer = function (state) { return state; };
    var mutationTransformer = ref.mutationTransformer; if ( mutationTransformer === void 0 ) mutationTransformer = function (mut) { return mut; };
    var actionFilter = ref.actionFilter; if ( actionFilter === void 0 ) actionFilter = function (action, state) { return true; };
    var actionTransformer = ref.actionTransformer; if ( actionTransformer === void 0 ) actionTransformer = function (act) { return act; };
    var logMutations = ref.logMutations; if ( logMutations === void 0 ) logMutations = true;
    var logActions = ref.logActions; if ( logActions === void 0 ) logActions = true;
    var logger = ref.logger; if ( logger === void 0 ) logger = console;

    return function (store) {
      var prevState = deepCopy(store.state);

      if (typeof logger === 'undefined') {
        return
      }

      if (logMutations) {
        store.subscribe(function (mutation, state) {
          var nextState = deepCopy(state);

          if (filter(mutation, prevState, nextState)) {
            var formattedTime = getFormattedTime();
            var formattedMutation = mutationTransformer(mutation);
            var message = "mutation " + (mutation.type) + formattedTime;

            startMessage(logger, message, collapsed);
            logger.log('%c prev state', 'color: #9E9E9E; font-weight: bold', transformer(prevState));
            logger.log('%c mutation', 'color: #03A9F4; font-weight: bold', formattedMutation);
            logger.log('%c next state', 'color: #4CAF50; font-weight: bold', transformer(nextState));
            endMessage(logger);
          }

          prevState = nextState;
        });
      }

      if (logActions) {
        store.subscribeAction(function (action, state) {
          if (actionFilter(action, state)) {
            var formattedTime = getFormattedTime();
            var formattedAction = actionTransformer(action);
            var message = "action " + (action.type) + formattedTime;

            startMessage(logger, message, collapsed);
            logger.log('%c action', 'color: #03A9F4; font-weight: bold', formattedAction);
            endMessage(logger);
          }
        });
      }
    }
  }

  function startMessage (logger, message, collapsed) {
    var startMessage = collapsed
      ? logger.groupCollapsed
      : logger.group;

    // render
    try {
      startMessage.call(logger, message);
    } catch (e) {
      logger.log(message);
    }
  }

  function endMessage (logger) {
    try {
      logger.groupEnd();
    } catch (e) {
      logger.log('—— log end ——');
    }
  }

  function getFormattedTime () {
    var time = new Date();
    return (" @ " + (pad(time.getHours(), 2)) + ":" + (pad(time.getMinutes(), 2)) + ":" + (pad(time.getSeconds(), 2)) + "." + (pad(time.getMilliseconds(), 3)))
  }

  function repeat (str, times) {
    return (new Array(times + 1)).join(str)
  }

  function pad (num, maxLength) {
    return repeat('0', maxLength - num.toString().length) + num
  }

  var index = {
    Store: Store,
    install: install,
    version: '3.5.1',
    mapState: mapState,
    mapMutations: mapMutations,
    mapGetters: mapGetters,
    mapActions: mapActions,
    createNamespacedHelpers: createNamespacedHelpers,
    createLogger: createLogger
  };

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
          return state.file.size; // `state.binary.byteLength` for binary
      },
  };

  const actions = {
      async setBinary({commit, state}, /** @type {File}*/ file) {
          commit("binaryLoading", true);
          commit("loadingToMemoryTime", null);

          if (state.error) {
              commit("resetError");
          }

          const now = performance.now();

          let binary;
          try {
              binary = await file.arrayBuffer();                                 // [1]
              /* just to compare arrayBuffer() with FileReader */
              // binary = await (Util.iterateBlob1(file, 1024**4).next()).value; // [2]
          } catch (error) {
              // When there is not enough memory space:
              // DOMException:
              // The requested file could not be read, typically due to permission problems
              // that have occurred after a reference to a file was acquired.
              console.error(error);
              commit("error", error);  // error.name === NotReadableError
          }
          commit("setBinary", binary);

          commit("binaryLoading", false);
          commit("loadingToMemoryTime", performance.now() - now);
      },
      async initBinary({dispatch, state}) {
          await dispatch("setBinary", state.file);
      }
  };

  const mutations = {
      setText(state, text) {
          state.text = text;
      },
      clearText(state) {
          state.text = "";
      },

      setFile(state, file) {
          state.file = file;
      },
      clearFile(state) {
          state.file = null;
      },

      setBinary(state, binary) {
          state.binary = binary;
      },
      clearBinary(state) {
          state.binary = null;
      },

      binaryLoading(state, binaryLoading) {
          state.binaryLoading = binaryLoading;
      },
      loadingToMemoryTime(state, loadingToMemoryTime) {
          state.loadingToMemoryTime = loadingToMemoryTime;
      },

      error(state, error) {
          state.error = error;
      },
      resetError(state) {
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
      activeInputType: "text",
      activeInputTypeAutoSwitcher: true
  });

  const mutations$1 = {
      activeInputType(state, activeInputType) {
          state.activeInputType = activeInputType;
      },
      activeInputTypeAutoSwitcher(state, activeInputTypeAutoSwitcher) {
          state.activeInputTypeAutoSwitcher = activeInputTypeAutoSwitcher;
      }
  };

  var inputSwitch = {
      namespaced: true,
      state: state$1,
      mutations: mutations$1
  };

  Vue__default['default'].use(index);

  var store = new index.Store({
      modules: {
          input,
          // ["file-settings"]: fileSettings,
          ["input-switch"]: inputSwitch
      },
      plugins: [logger]
  });

  function logger(store) {
      store.subscribe((mutation/*, state*/) => {
          console.log(mutation);
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

  //

  var script$2 = {
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
          await _hashIterable(iterateBlob2(this.input, this.settings.readerChunkSize), this.input.size);
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
          const settings = self.settings;
          self.progress = 0;
          for await (const data of iterable) {
            if (settings.animation) {
              const newTime = performance.now();
              if (newTime - curTime > (1000 / settings.fps)) {
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
                    _vm.settings.readerChunkSize < 1,
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
    const __vue_scope_id__$2 = "data-v-5e193489";
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
      ...mapState("input", {
        file: state => state.file
      })
    },
    methods: {
      ...mapMutations("input", ["setFile", "clearFile"]),

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
    const __vue_scope_id__$3 = "data-v-8f729f64";
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
        if (this.activeInputType === "file" && this.inputFile) {
          return this.fileByteSize;
        }
        return 0;
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
    const __vue_scope_id__$5 = "data-v-2ef0864e";
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

  var script$6 = {
    name: "MainContainer",
    data() {
      return {
        hashers: MD5.list,
        storeInMemory: false,
        streamType: "FileReader",
        animation: true,
        fps: 25,
        readerChunkSizeMB: 2,
      }
    },
    computed: {
      ...mapState("input", {
        inputText: state => state.text,
        inputFile: state => state.file,
        inputBinary: state => state.binary,

        binaryLoading: state => state.binaryLoading,
        loadingToMemoryTime: state => state.loadingToMemoryTime,

        error: state => state.error,
      }),

      ...mapState("input-switch", {
        activeInputType: state => state.activeInputType,
        activeInputTypeAutoSwitcher: state => state.activeInputTypeAutoSwitcher,
      }),

      input() {
        if (this.activeInputType === "file") {
          return this.inputBinary || this.inputFile;
        } else if (this.activeInputType === "text") {
          return this.inputText;
        }
      },
      readerChunkSize() {
        return Math.trunc(Number(this.readerChunkSizeMB) * 1024 * 1024);
      },
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
    watch: {
      error() {
        this.storeInMemory = false;
      },
    },
    components: {
      TextInput: __vue_component__$4,
      FileInputDragNDrop: __vue_component__$3,
      FormattedNumber: __vue_component__$1,
      HasherItem: __vue_component__$2,
      InputSwitch: __vue_component__$5
    }
  };

  /* script */
  const __vue_script__$6 = script$6;
  /* template */
  var __vue_render__$6 = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c(
      "div",
      { staticClass: "main-container-component" },
      [
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
              _c(
                "div",
                {
                  staticClass: "settings",
                  class: { inactive: _vm.activeInputType !== "file" }
                },
                [
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
                              attrs: {
                                title: _vm.error.name + ": " + _vm.error.message
                              }
                            },
                            [_vm._v("(error...)")]
                          )
                        : _vm.binaryLoading
                        ? _c("span", [_vm._v("(loadings...)")])
                        : _vm.loadingToMemoryTime &&
                          _vm.storeInMemory &&
                          _vm.inputBinary !== null
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
                    _c(
                      "div",
                      { style: { opacity: _vm.storeInMemory ? 0.5 : 1 } },
                      [
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
                              value: "FileReader"
                            },
                            domProps: {
                              checked: _vm._q(_vm.streamType, "FileReader")
                            },
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
                            domProps: {
                              checked: _vm._q(_vm.streamType, "ReadableStream")
                            },
                            on: {
                              change: function($event) {
                                _vm.streamType = "ReadableStream";
                              }
                            }
                          }),
                          _vm._v("ReadableStream")
                        ])
                      ]
                    ),
                    _c(
                      "label",
                      {
                        style: {
                          opacity:
                            _vm.streamType === "ReadableStream" &&
                            !_vm.storeInMemory
                              ? 0.5
                              : 1
                        },
                        attrs: {
                          title: "Chunk size for progressive hashing, Megabytes"
                        }
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
                      {
                        staticClass: "fps",
                        style: { opacity: _vm.animation ? 1 : 0.5 }
                      },
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
                ]
              )
            ],
            1
          )
        ]),
        _c("InputSwitch", { attrs: { "store-in-memory": _vm.storeInMemory } }),
        _c(
          "div",
          { staticClass: "items" },
          _vm._l(_vm.hashers, function(hasher, index) {
            return _c("HasherItem", {
              key: index,
              ref: "items",
              refInFor: true,
              attrs: {
                hasher: hasher,
                input: _vm.input,
                settings: {
                  fps: _vm.fps,
                  animation: _vm.animation,
                  readerChunkSize: _vm.readerChunkSize,
                  streamType: _vm.streamType,
                  loadingToMemoryTime: _vm.loadingToMemoryTime
                }
              }
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
  var __vue_staticRenderFns__$6 = [];
  __vue_render__$6._withStripped = true;

    /* style */
    const __vue_inject_styles__$6 = undefined;
    /* scoped */
    const __vue_scope_id__$6 = "data-v-5699fc21";
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

  new Vue__default['default']({
      store,
      render: createElement => createElement(__vue_component__$6),
  }).$mount("#app");

}(Vue));
//# sourceMappingURL=index.js.map
