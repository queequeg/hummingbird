/*
 * 'sandbox' provides a container within which the displayed
 * modules are expected to live out their lives. 
 *
 * sandbox decouples ALL other APIs from the modules. While
 * this can be a serious pain at times, it enables extremely
 * easy unit testing, since any module can be tested by just
 * stubbing out the relevant sandbox methods.
 *
 * for testing, you pass in library, widgets, and events:
 *
 * var sandyTest = sandbox(fakeLibrary, fakeWidgets, fakeEvents);
 *
 * or, if you aren't going to lean on, say, event features,
 * save yourself some trouble and pass in {} or leave it undefined:
 *
 * var sandyLibraryTest = sandbox(fakeLibrary, {}, {});
 */
sandbox = function (library, widgets, events) {
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
};
