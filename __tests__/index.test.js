

import QaInfobox from "../lib";
import {pressKey, click, randomInt, sample, omit, randomString} from "./helpers";

const COMPONENT_SELECTOR = "#qa-m-infobox";
const CONTENT_SELECTOR = ".qa-e-content";
const CLOSE_SELECTOR = "#js-qa-m-infobox__close";
const LABEL_SELECTOR = ".qa-e-label";
const DATA_SELECTOR = ".qa-e-data";
const JSON_PATH = ["anything_here_it's_mocked_anyway"];
const DEFAULT_KEY = 81;
const DEFAULT_KEY_MODIFIERS = {
  altKey: true,
  shiftKey: true
};
const JSON_DATA = {
  a: 1,
  b: 2,
  c: 3,
  d: 4
};
const CUSTOM_DATA = {
  C1: 1,
  C2: 2,
  C3: 3
};
const DEFAULT_FIELDS = ["useragent", "os", "monitor", "browser", "url", "viewport"];

// a snippet that is repeated for every test
const getContentNode = () => {
  const mainNode = document.querySelector(COMPONENT_SELECTOR);
  expect(mainNode).not.toBe(null);
  const contentNode = mainNode.querySelector(CONTENT_SELECTOR);
  expect(contentNode).not.toBe(null);
  return contentNode;
};

// creates a mock for loadServerInfo to avoid loading server data
const stubServerCall = (sut) => {
  // eslint-disable-next-line prefer-arrow-callback
  sut.loadServerInfo = jest.fn(function () {
    sut.appendServerInfo(JSON.stringify(JSON_DATA));
    return Promise.resolve();
  });
  return sut;
};


jest.useFakeTimers();

describe("basic tests", () => {
  let sut;

  afterEach(() => {
    if (sut) {
      sut.destroy();
    }
    document.body.innerHTML = "";
    jest.clearAllTimers();
  });

  it("instantiates", () => {
    expect(() => {
      sut = new QaInfobox({});
    }).not.toThrow();
  });

  it("should open a popup window", () => {
    sut = new QaInfobox();
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    expect(document.querySelector(COMPONENT_SELECTOR)).not.toBe(null);
  });

  it("should show expected default information in the window", () => {
    sut = new QaInfobox();
    sut.open();
    jest.runAllTimers();
    const contentNode = getContentNode();

    DEFAULT_FIELDS.forEach((label) => {
      const selector = `tr[data-qa-info=${label}]`;
      const row = contentNode.querySelector(selector);
      expect(row).not.toBe(null);
      const data = row.querySelector(DATA_SELECTOR);
      expect(data).not.toBe(null);
      expect(data.textContent).not.toBe(false);
    });
  });

  it("should show data passed in", () => {
    sut = new QaInfobox({ customData: CUSTOM_DATA });
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    const contentNode = getContentNode();

    Object.keys(CUSTOM_DATA).forEach((k) => {
      const selector = `tr[data-qa-info="${k.toLowerCase()}"]`;
      const row = contentNode.querySelector(selector);
      expect(row).not.toBe(null);
      let tdNode = row.querySelector(LABEL_SELECTOR);
      expect(tdNode.textContent).toEqual(k);
      tdNode = row.querySelector(DATA_SELECTOR);
      expect(tdNode.textContent).toBe(String(CUSTOM_DATA[k]));
    });
  });

  it("should close the window with X button", () => {
    sut = new QaInfobox({});
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    expect(document.querySelector(COMPONENT_SELECTOR)).not.toBe(null);
    expect(document.querySelector(COMPONENT_SELECTOR).style.display).toBe("block");
    click("#js-qa-m-infobox__close");
    jest.runAllTimers();
    expect(document.querySelector(COMPONENT_SELECTOR).style.display).toBe("none");
  });

  it("should close the window by clicking around window", () => {
    sut = new QaInfobox({});
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    expect(document.querySelector(COMPONENT_SELECTOR)).not.toBe(null);
    expect(document.querySelector(COMPONENT_SELECTOR).style.display).toBe("block");
    click(COMPONENT_SELECTOR);
    jest.runAllTimers();
    expect(document.querySelector(COMPONENT_SELECTOR).style.display).toBe("none");
  });

  it("allows jsonPath to be defined as string or array", () => {
    let jsonPath, mainNode, contentNode, selector, rows;

    jsonPath = JSON_PATH.slice(0);
    expect(jsonPath).toBeInstanceOf(Array);
    sut = new QaInfobox({ jsonPath });
    stubServerCall(sut);
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    mainNode = document.querySelector(COMPONENT_SELECTOR);
    expect(mainNode).not.toBe(null);
    contentNode = mainNode.querySelector(CONTENT_SELECTOR);
    expect(contentNode).not.toBe(null);
    selector = "tr[data-qa-serverinfo]";
    rows = contentNode.querySelectorAll(selector);
    expect(rows.length).not.toBe(0);
    sut.destroy();
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);

    jsonPath = JSON_PATH[0];
    expect(jsonPath).not.toBeInstanceOf(Array);
    sut = new QaInfobox({ jsonPath });
    stubServerCall(sut);
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    mainNode = document.querySelector(COMPONENT_SELECTOR);
    expect(mainNode).not.toBe(null);
    contentNode = mainNode.querySelector(CONTENT_SELECTOR);
    expect(contentNode).not.toBe(null);
    selector = "tr[data-qa-serverinfo]";
    rows = contentNode.querySelectorAll(selector);
    expect(rows.length).not.toBe(0);
    sut.destroy();
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
  });

  it("should show data loaded from json", () => {
    const jsonPath = JSON_PATH.slice(0);
    sut = new QaInfobox({ jsonPath });
    stubServerCall(sut);
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    const contentNode = getContentNode();
    const selector = "tr[data-qa-serverinfo]";
    const rows = contentNode.querySelectorAll(selector);
    expect(rows.length).toBe(Object.keys(JSON_DATA).length * jsonPath.length);
    Array.from(rows).forEach((row) => {
      const label = row.querySelector(LABEL_SELECTOR).textContent;
      const data = row.querySelector(DATA_SELECTOR).textContent;
      expect(String(JSON_DATA[label])).toBe(String(data));
    });
  });

  it("creates component with default ID unless a custom one is passed", () => {
    const id = randomString();
    const ID_SELECTOR = `#${id}`;
    sut = new QaInfobox();
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    expect(document.querySelector(ID_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    expect(document.querySelector(COMPONENT_SELECTOR)).not.toBe(null);
    expect(document.querySelector(ID_SELECTOR)).toBe(null);
    sut.destroy();
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    expect(document.querySelector(ID_SELECTOR)).toBe(null);

    sut = new QaInfobox({ id });
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    expect(document.querySelector(ID_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    expect(document.querySelector(ID_SELECTOR)).not.toBe(null);
  });

  it("should only display required fields if requiredFields options is passed", () => {
    const soManyFields = randomInt(DEFAULT_FIELDS.length - 2, 1);
    const requiredFields = sample(DEFAULT_FIELDS, soManyFields, true);
    const ignoredFields = omit(DEFAULT_FIELDS, requiredFields);
    sut = new QaInfobox({ requiredFields });
    sut.open();
    jest.runAllTimers();
    const contentNode = getContentNode();
    requiredFields.forEach((label) => {
      const selector = `tr[data-qa-info=${label}]`;
      const row = contentNode.querySelector(selector);
      expect(row).not.toBe(null);
      const data = row.querySelector(DATA_SELECTOR);
      expect(data).not.toBe(null);
      expect(data.textContent).not.toBe(false);
    });
    ignoredFields.forEach((label) => {
      const selector = `tr[data-qa-info=${label}]`;
      const row = contentNode.querySelector(selector);
      expect(row).toBe(null);
    });
  });

  it("should ignore fields if ignoredFields options is passed", () => {
    const soManyFields = randomInt(DEFAULT_FIELDS.length - 2, 1);
    const requiredFields = sample(DEFAULT_FIELDS, soManyFields, true);
    const ignoredFields = omit(DEFAULT_FIELDS, requiredFields);
    sut = new QaInfobox({ ignoredFields });
    sut.open();
    jest.runAllTimers();
    const contentNode = getContentNode();
    requiredFields.forEach((label) => {
      const selector = `tr[data-qa-info=${label}]`;
      const row = contentNode.querySelector(selector);
      expect(row).not.toBe(null);
      const data = row.querySelector(DATA_SELECTOR);
      expect(data).not.toBe(null);
      expect(data.textContent).not.toBe(false);
    });
    ignoredFields.forEach((label) => {
      const selector = `tr[data-qa-info=${label}]`;
      const row = contentNode.querySelector(selector);
      expect(row).toBe(null);
    });
  });

  it("should ignore fields also from json and customData if ignoredFields options is passed", () => {
    const ignoredFields = sample(Object.keys(CUSTOM_DATA))
      .concat(sample(Object.keys(JSON_DATA)));
    const allowedCustomFields = omit(Object.keys(CUSTOM_DATA), ignoredFields);
    const allowedJSONFields = omit(Object.keys(JSON_DATA), ignoredFields);
    sut = new QaInfobox({ ignoredFields, customData: CUSTOM_DATA, jsonPath: JSON_PATH });
    stubServerCall(sut);
    sut.open();
    jest.runAllTimers();
    const contentNode = getContentNode();
    allowedCustomFields.forEach((label) => {
      const selector = `tr[data-qa-info="${label.toLowerCase()}"]`;
      const row = contentNode.querySelector(selector);
      expect(row).not.toBe(null);
      let tdNode = row.querySelector(LABEL_SELECTOR);
      expect(tdNode.textContent).toEqual(label);
      tdNode = row.querySelector(DATA_SELECTOR);
      expect(tdNode.textContent).toBe(String(CUSTOM_DATA[label]));
    });
    allowedJSONFields.forEach((label) => {
      const selector = `tr[data-qa-serverinfo="${label.toLowerCase()}"]`;
      const row = contentNode.querySelector(selector);
      expect(row).not.toBe(null);
      let tdNode = row.querySelector(LABEL_SELECTOR);
      expect(tdNode.textContent).toEqual(label);
      tdNode = row.querySelector(DATA_SELECTOR);
      expect(tdNode.textContent).toBe(String(JSON_DATA[label]));
    });
    ignoredFields.forEach((label) => {
      let selector, row;
      selector = `tr[data-qa-info="${label.toLowerCase()}"]`;
      row = contentNode.querySelector(selector);
      expect(row).toBe(null);
      selector = `tr[data-qa-serverinfo="${label.toLowerCase()}"]`;
      row = contentNode.querySelector(selector);
      expect(row).toBe(null);
    });
  });

  it("should show data loaded from multiple json files", () => {
    const jsonPath = JSON_PATH.concat(JSON_PATH, JSON_PATH);
    sut = new QaInfobox({ jsonPath });
    stubServerCall(sut);
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    const contentNode = getContentNode();
    const selector = "tr[data-qa-serverinfo]";
    const rows = contentNode.querySelectorAll(selector);
    expect(rows.length).toBe(Object.keys(JSON_DATA).length * jsonPath.length);
    Array.from(rows).forEach((row) => {
      const label = row.querySelector(LABEL_SELECTOR).textContent;
      const data = row.querySelector(DATA_SELECTOR).textContent;
      expect(String(JSON_DATA[label])).toBe(String(data));
    });
  });

  it("shouldn't try and load json more than once", () => {
    const jsonPath = JSON_PATH.slice(0);
    sut = new QaInfobox({ jsonPath });
    stubServerCall(sut);
    expect(sut.loadServerInfo.mock.calls.length).toBe(0);
    sut.open();
    jest.runAllTimers();
    expect(sut.loadServerInfo.mock.calls.length).toBe(1);
    sut.open();
    jest.runAllTimers();
    expect(sut.loadServerInfo.mock.calls.length).toBe(1);
    sut.open();
    jest.runAllTimers();
    expect(sut.loadServerInfo.mock.calls.length).toBe(1);
  });

  it("shouldn't try to load data if not initialised with jsonPath parameters", () => {
    sut = new QaInfobox({});
    stubServerCall(sut);
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    expect(sut.loadServerInfo.mock.calls.length).toBe(0);
    sut.open();
    jest.runAllTimers();
    expect(sut.loadServerInfo.mock.calls.length).toBe(0);
    const contentNode = getContentNode();
    const selector = "tr[data-qa-serverinfo]";
    const rows = contentNode.querySelectorAll(selector);
    expect(rows.length).toBe(0);
  });

  it("should close the window", () => {
    sut = new QaInfobox({});
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    expect(document.querySelector(COMPONENT_SELECTOR)).not.toBe(null);
    expect(document.querySelector(COMPONENT_SELECTOR).style.display).toBe("block");
    expect(document.querySelector(CLOSE_SELECTOR)).not.toBe(null);
    sut.close();
    expect(document.querySelector(COMPONENT_SELECTOR).style.display).toBe("none");
  });

  it("should toggle the window", () => {
    sut = new QaInfobox({});
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    pressKey(DEFAULT_KEY, DEFAULT_KEY_MODIFIERS);
    jest.runAllTimers();
    expect(document.querySelector(COMPONENT_SELECTOR)).not.toBe(null);
    expect(document.querySelector(COMPONENT_SELECTOR).style.display).toBe("block");
    pressKey(DEFAULT_KEY, DEFAULT_KEY_MODIFIERS);
    jest.runAllTimers();
    expect(document.querySelector(COMPONENT_SELECTOR).style.display).toBe("none");
  });

  it("should not open unless correct key shortcut is used", () => {
    const randomKey = () => sample("ABCDEFGHIJKLMNOPRSTUVWXYZ");
    const trueOrFalse = () => sample([true, false]);
    sut = new QaInfobox({});
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    pressKey(randomKey(), { altKey: trueOrFalse(), shiftKey: trueOrFalse() });
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    pressKey(randomKey(), DEFAULT_KEY_MODIFIERS);
    jest.runAllTimers();
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    pressKey(DEFAULT_KEY, { altKey: false, shiftKey: true });
    jest.runAllTimers();
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    pressKey(DEFAULT_KEY, DEFAULT_KEY_MODIFIERS);
    jest.runAllTimers();
    expect(document.querySelector(COMPONENT_SELECTOR)).not.toBe(null);
  });

  it("should open with custom key shortcut", () => {
    /* eslint-disable no-magic-numbers, lines-around-comment */
    let customKey, shiftKey, altKey, ctrlKey, keyCode;

    keyCode = 78;
    altKey = ctrlKey = shiftKey = false;
    customKey = String.fromCharCode(keyCode);
    sut = new QaInfobox({ customKey });
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    pressKey(keyCode, { altKey, shiftKey, ctrlKey });
    jest.runAllTimers();
    expect(document.querySelector(COMPONENT_SELECTOR)).not.toBe(null);
    sut.destroy();

    keyCode = 73;
    ctrlKey = shiftKey = false;
    altKey = true;
    customKey = `ALT-${String.fromCharCode(keyCode)}`;
    sut = new QaInfobox({ customKey });
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    pressKey(keyCode, { altKey, shiftKey, ctrlKey });
    jest.runAllTimers();
    expect(document.querySelector(COMPONENT_SELECTOR)).not.toBe(null);
    sut.destroy();

    keyCode = 75;
    ctrlKey = false;
    altKey = true;
    shiftKey = true;
    customKey = `ALT-SHIFT-${String.fromCharCode(keyCode)}`;
    sut = new QaInfobox({ customKey });
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    pressKey(keyCode, { altKey, shiftKey, ctrlKey });
    jest.runAllTimers();
    expect(document.querySelector(COMPONENT_SELECTOR)).not.toBe(null);
    sut.destroy();

    keyCode = 76;
    ctrlKey = true;
    altKey = true;
    shiftKey = true;
    customKey = `ALT-SHIFT-CTRL-${String.fromCharCode(keyCode)}`;
    sut = new QaInfobox({ customKey });
    expect(document.querySelector(COMPONENT_SELECTOR)).toBe(null);
    pressKey(keyCode, { altKey, shiftKey, ctrlKey });
    jest.runAllTimers();
    expect(document.querySelector(COMPONENT_SELECTOR)).not.toBe(null);
    /* eslint-enable */
  });
});