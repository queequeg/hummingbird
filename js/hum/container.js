/*
 * 'container' is a very simple container in the Java-ish
 * "managed services" sense: it manages the lifecycle of
 * all modules within the application. Following YUI, a
 * module is taken to mean the HTML, CSS, and JS comprising
 * a self-contained page component.
 *
 * Following with the Java-ish model, every module is
 * expected to provide:
 * - an init() method, which is fired on startup;
 * - a render() method, which is fired after app 
 *   initialization is complete;
 * - a destroy() method, which may be fired on module 
 *   shutdown.
 *
 * for testing, you pass in library and sandbox:
 *
 * var containerToTest = container(fakeLibrary, fakeSandbox);
 *
 */
container = function (library, sandbox) {
  var modules = {};
  return {
    /*
     * register a module with the container.
     *
     * include the name of the module, and its builder fn.
     */
    register: function (moduleName, builder) {
      if (container.hasModule(moduleName)) {
        throw {
          type: "Error", 
          message: "Cannot register module " + moduleName + 
                   ": it is already registered." 
        };
      }
      modules[moduleName] = { 
        builder: builder, 
        instance: null 
      };
    },

    /*
     * unregister a module from the container.
     * complain if the module is not found.
     */
    unregister: function (moduleName) {
      if (!container.hasModule(moduleName)) {
        throw {
          type: "Error",
          message: "Cannot unregister module " + moduleName +
                    ": it does not exist in the registry."
        };
      }
      delete modules[moduleName];
    },

    hasModule: function (moduleName) {
      return (typeof modules[moduleName] !== "undefined");
    },

    /*
     * initialize the 'moduleName' module by calling its init() method.
     */
    start: function (moduleName) {
      if (!container.hasModule(moduleName)) {
        throw {
          name: 'Error', 
          message: "Unable to initialize module " + moduleName + 
                    ": module not found in registry."
        };
      }
      var mod = modules[moduleName];
      try {
        mod.instance = mod.builder(sandbox);
        mod.instance.init();
      } catch (e) {
        library.log('ERROR', 'Unable to initialize module ' +
                     moduleName + ': ' + e.message);
      }
    },

    /*
     * mass-initialize all registered modules.
     */
    startAll: function () {
      for (var moduleName in modules) {
        if (modules.hasOwnProperty(moduleName)) {
          container.start(moduleName);
        }
      }
    },

    /*
     * render the 'moduleName' module by calling its render() method.
     *
     * Many modules will just add functionality to already-rendered
     * HTML; it's perfectly fine for this method to be empty, but it 
     * is expected that it will be present.
     *
     * On the other hand, render can be used to unhide data that is
     * preloaded as HTML with display:none.
     */
    render: function (moduleName) {
      if (!container.hasModule(moduleName)) {
        throw {
          name: "Error", 
          message: "Unable to render module " + moduleName + 
                    ": module not found in registry."
        };
      }
      var mod = modules[moduleName];
      try {
        mod.instance.render();
      } catch (e) {
        library.log('ERROR', 'Unable to render module ' + moduleName +
                    ': ' + e.message);
      }
    },

    /*
     * mass-render all registered modules.
     */
    renderAll: function () {
      for (var moduleName in modules) {
        if (modules.hasOwnProperty(moduleName)) {
          container.render(moduleName); 
        }
      }
    },

    /*
     * destroy the 'moduleName' module, calling its destroy() method.
     *
     * The most important function of destroy is to provide modules a
     * chance to unset DOM listeners as the page unloads, preventing
     * memory leaks in IE.
     *
     * While these lifecycle methods could be DRYed up, it would 
     * definitely make the resulting code much less readable overall.
     */
    destroy: function (moduleName) {
      if (!container.hasModule(moduleName)) {
        throw {
          name: "Error", 
          message: "Unable to destroy module " + moduleName + 
                    ": module not found in registry."
        };
      }
      var mod = modules[moduleName];
      try {
        mod.instance.destroy();
      } catch (e) {
        library.log("ERROR", "Unable to destroy module " + moduleName +
                    ': ' + e.message);
      }
    },

    /*
     * mass-destroy all registered modules. used on page unload.
     */
    destroyAll: function () {
      for (var moduleName in modules) {
        if (modules.hasOwnProperty(moduleName)) {
          container.destroy(moduleName);
        }
      }
    }
  };
};
