
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
 *
 * for testing, you pass in library:
 *
 * var testWidg = widgets(fakeLibrary);
 */
var widgets = function (library) {
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
       * editableTitle provides a jQuery Jeditable in-place
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
};
