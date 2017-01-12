/**
 * vanilla js keypress event
 * @param  {string} code      charcodeat of key
 * @param  {Object} modifiers
 * @return {void}
 */
const pressKey = (code, modifiers = {}) => {
  const keyEvent = document.createEventObject
    ? document.createEventObject()
    : document.createEvent("Events");

  if (keyEvent.initEvent) {
    keyEvent.initEvent("keydown", true, true);
  }
  keyEvent.keyCode = code;
  keyEvent.which = code;
  Object.keys(modifiers).forEach((k) => {
    keyEvent[k] = modifiers[k];
  });
  if (document.dispatchEvent) {
    document.dispatchEvent(keyEvent);
  }
  else {
    document.fireEvent("onkeydown", keyEvent);
  }
};

/**
 * vanilla jquery click event
 * @param  {String} selector
 * @return {void}
 */
const click = (selector = "") => {
  let event;

  if (selector) {
    if (window.CustomEvent) {
      event = new CustomEvent("click");
    }
    else {
      event = document.createEvent("CustomEvent");
      event.initCustomEvent("click", true, true);
    }
    const el = document.querySelector(selector);
    if (el) {
      el.dispatchEvent(event);
    }
  }
};

/**
 * a version of lodash sample which works on array or strings. It picks a
 * random element (value or char)
 * @param  {String|array} haystack the set from which to pick a random element
 * @return {*}
 */
const sample = (haystack = "") => {
  const length = haystack.length;
  let result;

  if (length) {
    const random = Math.floor(Math.random() * length);
    if (Array.isArray(haystack) || haystack.splice) {
      result = haystack[random];
    }
  }
  return result;
};

export {
  click,
  pressKey,
  sample
};