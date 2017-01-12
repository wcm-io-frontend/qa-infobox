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
 * @param  {number} hi
 * @param  {number} lo
 * @return {number}
 */
const randomInt = (hi, lo = 0) => {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
};


/**
 * similar to lodash omit but for array. Given an array, returns a copy
 * without all the entries in omitThese
 * @param  {Array}  haystack  original array
 * @param  {Array}  omitThese entries to omit
 * @return {Array}
 */
const omit = (haystack = [], omitThese = []) => {
  return haystack.filter((fieldName) => !omitThese.includes(fieldName));
};

/**
 * a version of lodash sample which works on array or strings. It picks a
 * random element (value or char)
 * @param {String|Array} haystack the set from which to pick a random element
 * @param {Number} soMany number of results to return
 * @param {Boolean} unique if soMany is used, toggles whether the results can
 *                         be repeating or not
 * @return {String|Array}
 */
const sample = (haystack = "", soMany = 1, unique = false) => {
  let length = haystack.length;
  let result;

  if (length) {
    const isArgumentAString = haystack.substr;
    result = [];
    const haystackCopy = isArgumentAString
      ? haystack.split("")
      : haystack.slice(0);

    if (unique && (length <= soMany)) {
      result = haystackCopy;
    }
    else if (soMany > 0) {
      while (soMany--) {
        const random = randomInt(length - 1);
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
    if (isArgumentAString) {
      result = result.join("");
    }
  }
  return result;
};

export {
  click,
  omit,
  pressKey,
  randomInt,
  sample
};