/* 
 * 'events' handles registration and dispatching of events.
 *
 * Note: this is a really thin event registry/dispatcher
 * implementation. It's necessary to attach events.publish
 * as a listener at the document level for events that 
 * bubble.
 *
 * for testing, you pass in library:
 *
 * var testEvts = events(fakeLibrary);
 */
var events = function (library) {
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
      /* the callback must be a function */
      if (typeof callback !== "function") {
        throw {
	  type: "Error",
	  message: "callback passed to event type " + eventType +
	   	   "is not a function: " + callback
        };
      }

      /* the eventType must be a string */
      if (typeof eventType !== "string") {
        throw {
	  type: "Error",
	  message: "cannot register event type " + eventType +
	  	   "because it is not a string"
        };
      }

      /* if the eventType is new, create an array of callbacks */
      if (typeof listeners[eventType] === "undefined") {
        listeners[eventType] = [];
      }

      /* if the callback is registered, don't register it again */
      var i, hasCallback = false;
      for (i = 0; i < listeners[eventType].length; i++) {
        if (listeners[eventType][i] === callback) {
	  hasCallback = true;
	}
      }
      if (hasCallback === true) {
        throw {
	  type: "Error",
	  message: "Attempted to register already-registered callback: " + callback
	};
      }

      /* actually register the callback for the event type */
      listeners[eventType].push(callback);
    },

    /*
     * detach is used to remove registered listeners
     * from a given event.
     */
    detach: function (eventType, callback) {

      /* if the eventType is unknown, throw Error */
      if (typeof listeners[eventType] === "undefined") {
        throw {
          type: "Error", 
          message: "Cannot detach listener from event " + eventType + 
                   ": no listeners exist for that event." 
        };
      }
      var i, evt = listeners[eventType];
      for (i = 0; i < evt.length; i = i + 1) {
        if (evt[i] === callback) {
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
      /* if no listeners exist for an event, log it, but don't die */
      if (typeof listeners[eventType] === "undefined") {
	library.log("INFO", "Event " + eventType + " was published, but has " +
				"no registered listeners.");
        return;
      }

      var i, numberOfListeners = listeners[eventType].length;
      for (i = 0; i < numberOfListeners; i = i + 1) {
        try { 
          listeners[eventType][i].call(library, data);
        } catch (e) {
          library.log('ERROR', 'events.publish uncaught error: ' + e.message);
        }
      }
    }
  };
};

