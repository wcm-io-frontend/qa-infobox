/**
 * Private objects containing all methods for collecting data
 * from the browser
 * @private
 *
 * @type {Object}
 */
const getDataStrategy = {
  os: () => window.navigator.platform,
  monitor: () => `${screen.width} x ${screen.height}`,
  browser: () => `${window.navigator.appName} ${window.navigator.appVersion.replace(/^([\d.]+).*$/, "$1")}`,
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
        <td class="qa-label">${current.k}</td>
        <td class="qa-data">${current.v}</td>
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

const copyToClipboardId = "js-qa-infobox-copytoclipboard";
const closeId = "js-qa-infobox-copy";
const clipboardId = "js-qa-infobox-clipboard";

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
    className = "qa-infobox",
    customKey = "ALT-SHIFT-Q",
    jsonPath = [],
    parent = document.body,
    customData = {}
   } = {}) {
    this.classList = [className];
    this.parent = parent;
    this.isOpen = false;
    this.correctKey = this.decodeCorrectKey(customKey);
    this.jsonPath = jsonPath;
    this.clipboardString = "";
    this.customData = customData;
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
   * generates an instance
   *
   * @param  {Object} options passed on to constructor
   *
   * @return {Qainfobox} a new instance
   */
  static create(options = {}) {
    return new QaInfobox(options);
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
   * handleEvent is automagcially added as aevent handler if "this" is
   * the listnere. The other option is to have a function this.doTheHandling
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
    this.el.querySelector("[data-qa-info='viewport'] .qa-data").textContent = getDataStrategy.viewport();
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
      const dataToDisplay = this.collectDataToDisplay(getDataStrategy, this.customData);
      this.createPopup(dataToDisplay);
      this.clipboardString = formatDataForConfluence(dataToDisplay);

      if (this.jsonPath.length) {
        this.jsonPath.forEach((jsonPath) => {
          this.loadServerInfo(jsonPath)
          .then(this.appendServerInfo.bind(this))
          .catch((err) => this.logError(`Loading JSON ${jsonPath}: ${err}`));
        });
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
    const dataToDisplay = this.collectDataToDisplay(response);
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
    const httpSuccessStatus = 200;
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();

      req.open("GET", url);
      req.onload = () => {
        if (req.status === httpSuccessStatus) {
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
      if (dataSource.substr) {
        try {
          dataSource = JSON.parse(dataSource);
        }
        catch (err) {
          this.logError(err);
        }
      }
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
    const windowContent = createTableRows(dataToDisplay, "qa-info");
    const htmlTemplate = `<table class="qa-content">
     <tr><td colspan="2">
       <button id="${copyToClipboardId}" class="qa-infobox-copytoclipboard">
         Copy To Clibboard as Confluence Markup
       </button>
       <button id="${closeId}" class="qa-infobox-close">
         X
       </button>
       <textarea id="${clipboardId}" class="qa-infobox-clipboard"></textarea>
     </td></tr>
      ${windowContent}
      </table>`;
    // because classList is not an array, you can't simply appends stuff
    // with .push or .concat
    DOMTokenList.prototype.add.apply(this.el.classList, this.classList);
    this.el.innerHTML = htmlTemplate;
    this.el.style.display = "block";
    this.parent.appendChild(this.el);
    const headlessBrowserTimeout = 1000;
    // good old setTimeouts... it takes a while for DOM tree to respond
    // somehow, if you don't wait the listener will not work
    setTimeout(() => {
        // the "if" is purely for headless browser unit tests which
        // for some reason doesn't find 'this.el'
      if (this.el) {
        this.el.querySelector(`#${copyToClipboardId}`)
          .addEventListener("click", this.copyToClipboard.bind(this));
        this.el.querySelector(`#${closeId}`)
          .addEventListener("click", this.close.bind(this));
        this.el.addEventListener("click", this.close.bind(this));
        this.el.querySelector(".qa-content")
          .addEventListener("click", (event) => event.stopPropagation());
      }
    }, headlessBrowserTimeout);
  }


  /**
   * opens a little textarea and tries to copy content to clipboards
   *
   * @return {void}
   */
  copyToClipboard() {
    const clipboard = this.el.querySelector(".qa-infobox-clipboard");
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
    // console.log("DESTROY", document.body.innerHTML.replace(/^[\s\S]+window.__karma__\.loaded\(\);[\s\S]+<\/script>/, ""))
    if (this.el) {
      this.el.parentNode.removeChild(this.el);
      this.el = null;
    }
    document.removeEventListener(keyEventName, this);
  }
}

