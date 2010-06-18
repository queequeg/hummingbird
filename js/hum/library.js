/*
 * 'library' abstracts the underlying framework (jQuery here).
 * The underlying framework is used to provide effects, as
 * well as browser abstraction.
 *
 * benefits of this library abstraction layer include ease of
 * unit testing and less-painful migration from one underlying
 * framework to another.
 *
 * for testing, you pass in $ and console:
 *
 * var testLib = library(fake$, fakeConsole);
 */
var library = function ($, console) {
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
};
