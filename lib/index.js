const UA = navigator.userAgent;

// reduced version of https://github.com/bestiejs/platform.js list
// order is important
const BROWSER_NAMES = [
  "Electron",
  { label: "Microsoft Edge", pattern: "Edge" },
  { label: "Samsung Internet", pattern: "SamsungBrowser" },
  "Opera Mini",
  { label: "Opera Mini", pattern: "OPiOS" },
  "Opera",
  { label: "Opera", pattern: "OPR" },
  "Chrome",
  { label: "Chrome Mobile", pattern: "(?:CriOS|CrMo)" },
  { label: "Firefox", pattern: "(?:Firefox|Minefield)" },
  { label: "Firefox for iOS", pattern: "FxiOS" },
  { label: "IE", pattern: "IEMobile" },
  { label: "IE", pattern: "MSIE" },
  "Safari"
].reverse();

const BROWSER_VERSION_REGEXPS = [
  "(?:Cloud9|CriOS|CrMo|Edge|FxiOS|IEMobile|Iron|Opera ?Mini|OPiOS|OPR|Raven|SamsungBrowser|Silk(?!/[\\d.]+$))",
  "Version",
  "", // here we inject the browser name
  "(?:Firefox|Minefield|NetFront)"
].reverse();

const OSS = [
  "Windows Phone",
  "Android",
  { label: "Chrome OS", pattern: "CrOS" },
  "Mac OS X",
  "Macintosh",
  "Mac",
  "Windows "
].reverse();

/**
 * Private objects containing all methods for collecting data
 * from the browser
 * @private
 *
 * @type {Object}
 */
const getDataStrategy = {
  useragent: () => UA,
  os: () => {
    let counter = OSS.length;
    let os = "";
    while (!os && counter--) {
      const pattern = OSS[counter].pattern || OSS[counter];
      const matches = RegExp(`\\b${pattern}(?:/[\\d.]+|[ \\w.]*)`, "i").exec(UA);
      if (matches) {
        os = matches[0];
      }
    }
    if (!os) {
      os = UA.replace(/^.+?\(([^;)]+).*\).+$/, "$1");
    }
    return os.replace(/_/g, ".");
  },
  monitor: () => `${screen.width} x ${screen.height}`,
  browser: () => {
    let name = "";
    let version = "";
    let counter = BROWSER_NAMES.length;
    while (!name && counter--) {
      const guess = BROWSER_NAMES[counter];
      if (RegExp(`\\b(${guess.pattern || guess})\\b`, "i").exec(UA)) {
        name = (guess.label || guess);
      }
    }
    if (!name) {
      version = UA.replace(/^.+\)(.+)$/, "$1");
    }
    else if (typeof document.documentMode === "number" && (/^(?:Chrome|Firefox)\b/).test(name)) {
      name = "IE";
      version = "11.0";
    }
    else {
      counter = BROWSER_VERSION_REGEXPS.length;
      while (!version && counter--) {
        const pattern = BROWSER_VERSION_REGEXPS[counter] || name;
        const matches = RegExp(`${pattern}(?:-[\\d.]+/|(?: for [\\w-]+)?[ /-])([\\d.]+[^ ();/_-]*)`, "i").exec(UA);
        if (matches) {
          version = matches[1];
        }
      }
    }
    return `${name} ${version}`;
  },
  url: () => `${document.location.href}`,
  viewport: () => {
    const win = window;
    const doc = document;
    const el = doc.documentElement;
    const body = doc.getElementsByTagName("body")[0];
    const width = win.innerWidth || el.clientWidth || body.clientWidth;
    const height = win.innerHeight || el.clientHeight || body.clientHeight;
    return `${width} x ${height}`;
  }
};

/**
 * to easily change which key event toggles window open / close
 * @private
 *
 * @type {String}
 */
const keyEventName = "keydown";

/**
 * knows about the HTML that creates a table row, and creates it
 * @private
 *
 * @param  {Array}  dataToDisplay {K:... v:....}
 * @param  {String} dataLabel     the name of the data attribute attached
 *                                to each table row
 *
 * @return {string}               HTML string, a list of <tr>
 */
const createTableRows = (dataToDisplay = [], dataLabel = "qa-info") => {
  const windowContent = dataToDisplay.reduce((accumulator, current) => {
    return `${accumulator}<tr data-${dataLabel}="${current.k.toLowerCase()}">
        <td class="qa-e-label">${current.k}</td>
        <td class="qa-e-data">${current.v}</td>
      </tr>`;
  }, "");
  return windowContent;
};

/**
 * knows what an boject containing data for a table row should be like
 * @private
 *
 * @param  {string} k
 * @param  {string} v
 *
 * @return {object}   { k, v }
 */
const asKeyValueObject = (k = "", v) => {
  return {
    k,
    v
  };
};

/**
 * like Array.filter, but applied to an object
 * @param  {Object} keyValuePairs the original object
 * @param  {Array} keysToIgnore   a list of keys to ignore
 * @param  {Array} keysToInclude   a list of keys to include
 * @return {Object}
 */
const reduceAndFilterPairs = (keyValuePairs, keysToIgnore = [], keysToInclude) => {
  const shouldBeIncluded = keysToInclude
    ? (k) => !keysToIgnore.includes(k) && keysToInclude.includes(k)
    : (k) => !keysToIgnore.includes(k);

  return Object.keys(keyValuePairs).reduce((accumulator, k) => {
    if (shouldBeIncluded(k)) {
      accumulator[k] = keyValuePairs[k];
    }
    return accumulator;
  }, {});
};

/**
 * creates lovely tables using confluence markup
 *
 * @param  {Array}  dataToDisplay {K:... v:....}
 *
 * @return {string} confluence markup
 */
const formatDataForConfluence = (dataToDisplay = []) => {
  const clipboardString = dataToDisplay.reduce((accumulator, current) => {
    return `${accumulator}||${current.k}|${current.v}|
`;
  }, "");
  return clipboardString;
};

const copyToClipboardId = "js-qa-m-infobox__copytoclipboard";
const closeId = "js-qa-m-infobox__close";
const clipboardId = "js-qa-m-infobox__clipboard";

/**
 * Qainfobox
 * displays a popup window with various information from the browser and
 * a json file. Can be opened with a key shortcut
 *
 * @param {string} className   CSS class which will be attached to topmost
 *                             element; default qa-infobox
 * @param {string} customKey   key combination that fires opens and closes it,
 *                             in format [MODIFIER-]*[KEY], where MODIFIER is
 *                             one of SHIFT, CTRL or ALT and KEY is a single
 *                             string character (note that if there is more
 *                             than one the last one will be used).
 *                             Default: ALT-SHIFT-Q
 * @param {DOMNode} parent     where to attach the popup, default document.body
 * @param {object} customData  an object with custom key/value pairs you can
 *                             manually add. Example:
 *                             QaInfobox.create({ customData: { dad: "Homer", mum: "Marge" }})
 * @param {array|string} jsonPath  list of paths of JSON files with key value
 *                                 pairs to be shown in popup
 *
 */
export default class QaInfobox {

  /**
   * @constructor
   *
   * @param  {String} className
   *
   * @return {void}
   */
  constructor({
    className = "qa-m-infobox",
    customKey = "ALT-SHIFT-Q",
    jsonPath = [],
    parent = document.body,
    customData = {},
    requiredFields = Object.keys(getDataStrategy),
    ignoredFields = []
   } = {}) {
    this.classList = [className];
    this.parent = parent;
    this.isOpen = false;
    this.correctKey = this.decodeCorrectKey(customKey);
    this.jsonPath = Array.isArray(jsonPath)
      ? jsonPath.slice(0)
      : [jsonPath];
    this.clipboardString = "";
    // we can clean up customData now, no need to do it when open is called
    this.customData = Object.keys(customData).reduce((accumulator, fieldName) => {
      if (!ignoredFields.includes(fieldName)) {
        accumulator[fieldName] = customData[fieldName];
      }
      return accumulator;
    }, {});
    this.customData = reduceAndFilterPairs(customData, ignoredFields);
    this.defaultFieldsStrategy = reduceAndFilterPairs(getDataStrategy, ignoredFields, requiredFields);
    this.ignoredFields = ignoredFields;
    document.addEventListener(keyEventName, this);
  }


  /**
   * decodes human readable config into a set of flags
   *
   * @param  {string} customKey ALT-SHIFT-Q etc
   *
   * @return {object}           broken down into keycode, shiftkey, etc
   */
  decodeCorrectKey(customKey) {
    customKey = customKey.toUpperCase();
    const fragments = customKey.split("-");
    let shiftKey = false;
    let altKey = false;
    let ctrlKey = false;
    let keyCode = 0;
    fragments.forEach((fragment) => {
      switch (fragment) {
        case "SHIFT":
          shiftKey = true;
          break;
        case "CTRL":
          ctrlKey = true;
          break;
        case "ALT":
          altKey = true;
          break;
        default:
          keyCode = fragment.charCodeAt(0);
          break;
      }
    });
    const keyObject = {
      keyCode,
      shiftKey,
      altKey,
      ctrlKey
    };
    return keyObject;
  }


  /**
   * wrapper around console.error. Override as needed
   *
   * @param  {*} more
   *
   * @return {void}
   */
  logError(more) {
    window.console.error("QaInfobox Error", more);
  }

  /**
   * calls either open or close depending on state.
   * handleEvent is automagically added as event handler if "this" is
   * the listner. The other option is to have a function this.doTheHandling
   * and then use this.doTheHandling.bind(this) - but doing it that way, you
   * can't remove it anymore.
   *
   * @param {event} event
   *
   * @return {void}
   */
  handleEvent(event) {
    if (this.isCorrectKey(event)) {
      if (this.isOpen) {
        this.close();
      }
      else {
        this.open();
      }
    }
  }


  /**
   * checks whether the pressed key corresponds to expected one stored
   * on config
   *
   * @param  {Event}  event
   *
   * @return {Boolean}       true if it dorresponds
   */
  isCorrectKey(event = {}) {
    return Object.keys(this.correctKey).every((k) => (event[k] || false) === this.correctKey[k]);
  }


  /**
   * the viewport actually needs to be refreshed before each call, as the
   * windows may have been resized
   *
   * @return {void}
   */
  updateViewport () {
    if ("viewport" in this.defaultFieldsStrategy) {
      this.el.querySelector("[data-qa-info='viewport'] .qa-e-data").textContent = this.defaultFieldsStrategy.viewport();
    }
  }

  /**
   * lazily creates popup as needed
   *
   * @return {void}
   *
   */
  open() {
    if (this.el) {
      this.updateViewport();
      this.el.style.display = "block";
    }
    else {
      const dataToDisplay = this.collectDataToDisplay(this.defaultFieldsStrategy, this.customData);
      this.createPopup(dataToDisplay);
      this.clipboardString = formatDataForConfluence(dataToDisplay);

      if (this.jsonPath.length) {
        Promise.all(this.jsonPath.map(this.loadServerInfo.bind(this)))
          .catch((err) => this.logError(err));
      }
    }
    this.isOpen = true;
  }


  /**
   * appends some rows to an already created window. Used to append
   * dynamic data
   *
   * @param  {string} response JSON from server
   *
   * @return {void}
   */
  appendServerInfo(response) {
    let jsonResponse;
    try {
      jsonResponse = reduceAndFilterPairs(JSON.parse(response), this.ignoredFields);
    }
    catch (e) {
      this.logError(e);
    }
    const dataToDisplay = this.collectDataToDisplay(jsonResponse);
    const rowsToAppend = createTableRows(dataToDisplay, "qa-serverinfo");
    const tbody = this.el.querySelector("tbody");
    tbody.innerHTML += rowsToAppend;
    this.clipboardString += formatDataForConfluence(dataToDisplay);
  }


  /**
   * fetches some json from server with extra info.
   *
   * @param {string} url
   *
   * @return {void}
   */
  loadServerInfo(url) {
    const HTTP_SUCCESS_STATUS = 200;

    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();
      req.open("GET", url);
      req.onload = () => {
        if (req.status === HTTP_SUCCESS_STATUS) {
          this.appendServerInfo(req.response);
          resolve(req.response);
        }
        else {
          reject(Error(req.statusText));
        }
      };
      req.onerror = () => {
        reject(Error("Network Error"));
      };
      req.send();
    });
  }


  /**
   *
   * @param {Event=} event
   *
   * @return {void}
   */
  close(event) {
    if (event) {
      event.stopPropagation();
    }
    if (this.el) {
      this.el.querySelector(`#${clipboardId}`).style.display = "none";
      this.el.style.display = "none";
    }
    this.isOpen = false;
    return false;
  }

  /**
   * puts together an object of key value pairs to be displayed. Either
   * from server JSON or using a strategy ojject full of functions
   *
   * @param  {Object} dataSource
   *
   * @return {array}    list of k / v objects
   */
  collectDataToDisplay(...dataSources) {
    const dataToDisplay = [];
    dataSources.forEach((dataSource) => {
      Object.keys(dataSource).forEach((k) => {
        let v = dataSource[k];
        if (v instanceof Function) {
          v = v();
        }
        if (v) {
          dataToDisplay.push(asKeyValueObject(k, v));
        }
      });
    });
    return dataToDisplay;
  }


  /**
   * creates popup for first time
   *
   * @param {Array} dataToDisplay an array of {k, v} objects
   *
   * @return {void}
   */
  createPopup(dataToDisplay = []) {
    this.el = document.createElement("div");
    const DELAY_TO_ALLOW_RENDERING = 200;
    const windowContent = createTableRows(dataToDisplay, "qa-info");
    const htmlTemplate = `<table class="qa-e-content">
     <tr><td colspan="2">
       <button id="${copyToClipboardId}" class="qa-m-infobox__copytoclipboard">
         Copy To Clibboard as Confluence Markup
       </button>
       <button id="${closeId}" class="qa-m-infobox__close">
         X
       </button>
       <textarea id="${clipboardId}" class="qa-m-infobox__clipboard"></textarea>
     </td></tr>
      ${windowContent}
      </table>`;
    // because classList is not an array, you can't simply appends stuff
    // with .push or .concat
    DOMTokenList.prototype.add.apply(this.el.classList, this.classList);
    this.el.innerHTML = htmlTemplate;
    // we need to wait for the DOM to be refreshed before we can attach events
    setTimeout(() => {
      this.el.style.display = "block";
      this.parent.appendChild(this.el);
      document.getElementById(copyToClipboardId).addEventListener("click", this.copyToClipboard.bind(this));
      document.getElementById(closeId).addEventListener("click", this.close.bind(this), false);
      this.el.addEventListener("click", this.close.bind(this), false);
      this.el.querySelector(".qa-e-content").addEventListener("click", (event) => event.stopPropagation(), false);
    }, DELAY_TO_ALLOW_RENDERING);
  }


  /**
   * opens a little textarea and tries to copy content to clipboards
   *
   * @return {void}
   */
  copyToClipboard() {
    const clipboard = this.el.querySelector(`#${clipboardId}`);
    clipboard.innerHTML = this.clipboardString;
    clipboard.style.display = "block";
    clipboard.select();
    try {
      document.execCommand("copy");
    }
    catch (err) {
      alert(`Not able to copy to clipboard with this browser. Please
        copy text below button manually.`);
    }
  }

  /**
   * cleans up after itself
   *
   * @return {void}
   */
  destroy() {
    if (this.el) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
    document.removeEventListener(keyEventName, this);
  }
}
