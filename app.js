/*
 * Hummingbird: A small JavaScript app framework, at your service.
 *
 * The basic idea is to separate concerns, providing the groundwork
 * for an extensible, easy-to-test application.
 *
 *  - jQuery is used to abstract the underlying browser away.
 *  
 *  - 'library' is used to decouple jQuery from all other app code.
 *    This allows another library to be swapped in later with less
 *    pain.
 *  
 *  - 'widgets' is similarly used to decouple jQuery UI from all
 *    other code, by storing preconfigured UI effects.
 *  
 *  - 'events' is a very simple event dispatcher and registry.
 *  
 *  - 'container' manages lifecycle of page component modules.
 *  
 *  - 'sandbox' decouples page component modules from ALL other 
 *    APIs. While this seems crazy at first, it provides a dead
 *    simple way to test modules, since the only mock needed for
 *    testing is a mock sandbox.
 *
 */

/* begin jslint-specific stuff: */

/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, 
  plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, 
  strict: true, maxerr: 100, maxlen: 80, indent: 2 */

/*global $, console */

/* end jslint-specific stuff */

"use strict";

var APP = (function () {

  /*
   * 'library' abstracts the underlying framework (jQuery here).
   * The underlying framework is used to provide effects, as
   * well as browser abstraction.
   *
   * benefits of this library abstraction layer include ease of
   * unit testing and less-painful migration from one underlying
   * framework to another.
   */
  var library = (function () {
    return {

      /*
       * fx: set of cross-browser visual effects. see 'widgets'
       * to understand how effect combinations can be stored in a
       * reusable manner.
       */
      fx: {
        editable: function (cssSelector, ajaxCallback, options) { 
          $(cssSelector).editable(ajaxCallback, options);
        },
        draggable: function (cssSelector, options) { 
          $(cssSelector).draggable(options); 
        },
        resizable: function (cssSelector, options) { 
          $(cssSelector).resizable(options); 
        }
      },

      /*
       * xhr: cross-browser ajax call
       * parameter object format: {url, httpVerb, data, success, failure}
       */
      xhr: function (o) {
        $.ajax({
          url: o.url, 
          type: o.httpVerb, 
          data: o.data, 
          success: o.success, 
          failure: o.failure
        });
      },

      /*
       * log: lowest-level logging method.
       *
       * Following the Java log4j severity convention:
       * TRACE < DEBUG < INFO < WARN < ERROR < FATAL
       *
       * In this case, 'log' just logs to console, but
       * it's possible to phone home using xhr or this trick:
       *   
       *   var img = new Image();
       *   img.src = "log.php?" +
       *     "sev=" + encodeURIComponent(severity) +
       *     "&msg=" + encodeURIComponent(message);
       */
      log: function (severity, message) {
        console.log(severity + ": " + message);
      },

      /*
       * getElementById: return an element with the given id.
       *
       * Accessing DOM elements this way obscures the ease of DOM
       * traversal for which jQuery is justly famous. However, the
       * important thing is to decouple the browser abstraction
       * layer from the rest of the app.
       *
       */
      getElementById: function (id) {
        return $('#' + id).get(0);
      }
    };
  }()),
  
  /*
   * 'widgets' is a collection of larger-scale visual effects
   * along the lines of what's delivered by, say, jQuery UI,
   * in distinction to regular jQuery. 
   *
   * While we could store Ext-style templates, "classical" widget
   * Constructors, and other stuff here, for this example, we
   * just need to decorate already-rendered divs. Hence, the
   * resulting widgets object only contains a 'decorators' sub-
   * object.
   *
   * The concept is this: define all UI effects in this one
   * central location, and let the actual module definitions 
   * just reference the decorators here. This decouples the
   * modules from the underlying effects/UI library implementation.
   *
   * Particular applications might store widget definitions in
   * this object. 
   */
  widgets = (function (library) {
    return { 
      decorators: {
        
        /*
         * simpleEditable adds very basic capabilities to the
         * supplied css selector. This implementation wraps the
         * jQuery Jeditable plugin. See the plugin documentation
         * at: http://www.appelsiini.net/projects/jeditable
         *
         */
        simpleEditable: function (cssSelector) {
          var emptyCallback = function (value, settings) {
             
            return value;
          },
          simpleOptions = {
            type: 'textarea',
            cancel: 'Cancel',
            submit: 'OK',
            onblur: 'ignore',
            event: 'dblclick',
            cols: 20,
            cssclass: "editing"
          };
          library.fx.editable(cssSelector, emptyCallback, simpleOptions);
        },

        /*
         * editableCallback provides a jQuery Jeditable in-place
         * editor, but allows the module to supply a callback method
         * to be called after the updated text is submitted. This
         * callback method might send an xhr to the server-side, 
         * log the change, or simply do nothing. In any case, it
         * must return the value that actually gets inserted.
         * For more information, see the plugin documentation
         * at: http://www.appelsiini.net/projects/jeditable
         */
        editableTitle: function (cssSelector, callback) {
          var eventedCallback = function (value, settings) {
            callback.call(this, value);
            return value;
          },
          simpleTitleOptions = {
            type: 'text', 
            cancel: 'Cancel',
            submit: 'OK',
            onblur: 'ignore',
            event: 'dblclick',
            cssclass: 'editing'
          };
          library.fx.editable(cssSelector, eventedCallback, simpleTitleOptions);
        },

        /*
         * simpleWidget provides simple draggable + resizable
         * capabilities to a given wrapper div. While this 
         * implementation uses jQuery UI, YUI and Ext both
         * provide this basic "widgetyness" without much work.
         */
        simpleWidget: function (cssSelector) {
          var widgetHandle = cssSelector + "-handle";
          library.fx.draggable(cssSelector, {handle: widgetHandle});
          library.fx.resizable(cssSelector);
        }
      }
    };
  }(library)),

  /* 
   * 'events' handles registration and dispatching of events.
   *
   * Note: this is a really thin event registry/dispatcher
   * implementation. It's necessary to attach events.publish
   * as a listener at the document level for events that 
   * bubble.
   *
   */
  events = (function (library) {
    var listeners = {};

    return {

      /*
       * Register a callback for a particular eventType. 
       * This is a very thin implementation. 
       *
       * Ideas include checking the targetElement to reduce 
       * the number of notices sent from DOM events like 
       * 'click'; add code to sandbox to enable multiple 
       * sandboxes to route module-fired events down to events,
       * to allow propagation between sandboxes (for instance,
       * high-security sandboxes vs. regular sandboxes).
       *
       */
      register: function (eventType, callback) {
        if (typeof listeners[eventType] === "undefined") {
          listeners[eventType] = [];
        }
        listeners[eventType].push(callback);
      },

      /*
       * detach is used to remove registered listeners
       * from a given event.
       */
      detach: function (eventType, callback) {
        if (typeof listeners[eventType] === "undefined") {
          throw {
            type: "Error", 
            message: "Cannot detach listener from event " + eventType + 
                     ": no listeners exist for that event." 
          };
        }
        var i, evt = listeners[eventType];
        for (i = 0; i < evt.length; i + 1) {
          if (evt.hasOwnProperty(evt[i]) &&
              (evt[i] === callback)) {
            evt.splice(i, 1); 
          }
        }
      },

      /*
       * detachAll is used to detach all registered listeners
       * at once. 
       */
      detachAll: function () {
        listeners = {};
      },

      /*
       * publish is used to dispatch events to registered
       * listeners for the eventType. Idea is to evoke a 
       * 'publish-subscribe' perspective...probably because
       * my mind has been polluted with Java messaging stuff.
       */
      publish: function (eventType, data) {
        var i, numberOfListeners = listeners[eventType].length;
        for (i = 0; i < numberOfListeners; i + 1) {
          try { 
            listeners[eventType][i].call(library, data);
          } catch (e) {
            library.log('ERROR', 'events.publish uncaught error: ' + e.message);
          }
        }
      }
    };
  }(library)),

  /*
   * 'sandbox' provides a container within which the displayed
   * modules are expected to live out their lives. 
   *
   * sandbox decouples ALL other APIs from the modules. While
   * this can be a serious pain at times, it enables extremely
   * easy unit testing, since any module can be tested by just
   * stubbing out the relevant sandbox methods.
   */
  sandbox = (function (library, widgets, events) {
    return { 

      /*
       * widgets API access
       */
      widgets: {
        simpleWidget: function (cssSelector) { 
          widgets.decorators.simpleWidget(cssSelector);   
        },
        editableTitle: function (cssSelector, callback) { 
          widgets.decorators.editableTitle(cssSelector, callback);  
        },
        simpleEditable: function (cssSelector) { 
          widgets.decorators.simpleEditable(cssSelector); 
        }
      },

      /*
       * library API access
       */
      xhr: function (o /* {url, httpVerb, data, success, failure} */) {
        library.xhr({
          url: o.url, 
          httpVerb: o.httpVerb, 
          data: o.data, 
          success: o.success, 
          failure: o.failure
        });
      },
      getElementById: function (id) {
        return library.getElementById(id);
      },
      log: function (severity, message) {
        library.log(severity, message);
      },

      /*
       * event registry API access
       */
      register: function (eventType, callback) {
        events.register(eventType, callback);
      },
      publish: function (eventType, data) {
        events.publish(eventType, data);
      },
      detach: function (eventType, data) {
        events.detach(eventType, data);
      },
      detachAll: function () {
        events.detachAll();
      }

    };
  }(library, widgets, events)),

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
   */
  container = (function (library, sandbox) {
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
  }(library, sandbox));

  return {
    library: library,
    widgets: widgets,
    events:  events,
    sandbox: sandbox,
    container: container
  };
}());
