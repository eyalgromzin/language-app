// Mock for Node.js 'events' module to work in React Native
class EventEmitter {
  constructor() {
    this._events = {};
  }

  on(event, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(listener);
    return this;
  }

  once(event, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    const onceWrapper = (...args) => {
      this.removeListener(event, onceWrapper);
      listener.apply(this, args);
    };
    onceWrapper.listener = listener;
    this.on(event, onceWrapper);
    return this;
  }

  emit(event, ...args) {
    if (this._events[event]) {
      const listeners = this._events[event].slice();
      for (let i = 0; i < listeners.length; i++) {
        listeners[i].apply(this, args);
      }
    }
    return this;
  }

  removeListener(event, listener) {
    if (!this._events[event]) {
      return this;
    }
    if (!listener) {
      delete this._events[event];
      return this;
    }
    const listeners = this._events[event];
    for (let i = 0; i < listeners.length; i++) {
      if (listeners[i] === listener || listeners[i].listener === listener) {
        listeners.splice(i, 1);
        break;
      }
    }
    if (listeners.length === 0) {
      delete this._events[event];
    }
    return this;
  }

  removeAllListeners(event) {
    if (event) {
      delete this._events[event];
    } else {
      this._events = {};
    }
    return this;
  }

  listeners(event) {
    return this._events[event] ? this._events[event].slice() : [];
  }
}

module.exports = {
  EventEmitter,
  default: EventEmitter,
};

