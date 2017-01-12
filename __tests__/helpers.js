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


const randomInt = (hi, lo = 0) => {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
};

/**
 * a version of lodash sample which works on array or strings. It picks a
 * random element (value or char)
 * @param  {String|Array} haystack the set from which to pick a random element
 * @return {String|Array}
 */
const sample = (haystack = "", howMany = 1, unique = false) => {
  let length = haystack.length;
  let result;

  if (length) {
    const isArgumentAString = haystack.substr;
    result = [];
    let haystackCopy = isArgumentAString
      ? haystack.split("")
      : haystack.slice(0);

    if (length <= howMany) {
      result = haystackCopy;
    }
    else if (howMany > 0) {
      while (howMany--) {
        let random = randomInt(length - 1);
        let runningResult;
        if (unique) {
          runningResult = haystackCopy.splice(random, 1)[0];
          length -= 1;
        }
        else {
          runningResult = haystackCopy[random];
        }
        result.push(runningResult);
      }
    }
    if (isArgumentAString ) {
      result = result.join("");
    }
  }
  return result;
};

export {
  click,
  pressKey,
  randomInt,
  sample
};