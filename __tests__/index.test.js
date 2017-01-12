"use strict";

import QaInfobox from "../lib";
import {pressKey, click, sample} from "./helpers";

const className = "qa-m-infobox";
const CLASSNAME_SELECTOR = `.${className}`;
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
// creates a mock for loadServerInfo to avoid loading server data
const stubServerCall = (sut) => {
  // eslint-disable-next-line prefer-arrow-callback
  sut.loadServerInfo = jest.fn(function () {
    sut.appendServerInfo(JSON_DATA);
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
    expect(document.querySelector(CLASSNAME_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    expect(document.querySelector(CLASSNAME_SELECTOR)).not.toBe(null);
  });

  it("should show expected default information in the window", () => {
    sut = new QaInfobox();
    sut.open();
    jest.runAllTimers();
    const mainNode = document.querySelector(CLASSNAME_SELECTOR);
    expect(mainNode).not.toBe(null);
    const contentNode = mainNode.querySelector(CONTENT_SELECTOR);
    expect(contentNode).not.toBe(null);

    ["monitor", "os", "browser", "viewport", "url"].forEach((label) => {
      const selector = `tr[data-qa-info=${label}]`;
      const row = contentNode.querySelector(selector);
      expect(row).not.toBe(null);
      const data = row.querySelector(DATA_SELECTOR);
      expect(data).not.toBe(null);
      expect(data.textContent).not.toBe(false);
    });
  });

  it("should show data passed in", () => {
    const customData = {
      C1: 1,
      C2: 2,
      C3: 3
    };

    sut = new QaInfobox({ customData });
    expect(document.querySelector(CLASSNAME_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    const mainNode = document.querySelector(CLASSNAME_SELECTOR);
    expect(mainNode).not.toBe(null);
    const contentNode = mainNode.querySelector(".qa-e-content");
    expect(contentNode).not.toBe(null);

    Object.keys(customData).forEach((k) => {
      const selector = `tr[data-qa-info="${k.toLowerCase()}"]`;
      const row = contentNode.querySelector(selector);
      expect(row).not.toBe(null);
      let tdNode = row.querySelector(LABEL_SELECTOR);
      expect(tdNode.textContent).toEqual(k);
      tdNode = row.querySelector(DATA_SELECTOR);
      expect(tdNode.textContent).toBe(String(customData[k]));
    });
  });

  it("should close the window with X button", () => {
    sut = new QaInfobox({});
    expect(document.querySelector(CLASSNAME_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    expect(document.querySelector(CLASSNAME_SELECTOR)).not.toBe(null);
    expect(document.querySelector(CLASSNAME_SELECTOR).style.display).toBe("block");
    click("#js-qa-m-infobox__close");
    jest.runAllTimers();
    expect(document.querySelector(CLASSNAME_SELECTOR).style.display).toBe("none");
  });

  it("should close the window by clicking around window", () => {
    sut = new QaInfobox({});
    expect(document.querySelector(CLASSNAME_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    expect(document.querySelector(CLASSNAME_SELECTOR)).not.toBe(null);
    expect(document.querySelector(CLASSNAME_SELECTOR).style.display).toBe("block");
    click(CLASSNAME_SELECTOR);
    jest.runAllTimers();
    expect(document.querySelector(CLASSNAME_SELECTOR).style.display).toBe("none");
  });

  it("should show data loaded from json", () => {
    const jsonPath = JSON_PATH.slice(0);
    sut = new QaInfobox({ jsonPath });
    stubServerCall(sut);
    expect(document.querySelector(CLASSNAME_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    const mainNode = document.querySelector(CLASSNAME_SELECTOR);
    expect(mainNode).not.toBe(null);
    const contentNode = mainNode.querySelector(CONTENT_SELECTOR);
    expect(contentNode).not.toBe(null);
    const selector = "tr[data-qa-serverinfo]";
    const rows = contentNode.querySelectorAll(selector);
    expect(rows.length).toBe(Object.keys(JSON_DATA).length * jsonPath.length);
    Array.from(rows).forEach((row) => {
      const label = row.querySelector(LABEL_SELECTOR).textContent;
      const data = row.querySelector(DATA_SELECTOR).textContent;
      expect(String(JSON_DATA[label])).toBe(String(data));
    });
  });

  it("should show data loaded from multiple json files", () => {
    const jsonPath = JSON_PATH.concat(JSON_PATH, JSON_PATH);
    sut = new QaInfobox({ jsonPath });
    stubServerCall(sut);
    expect(document.querySelector(CLASSNAME_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    const mainNode = document.querySelector(CLASSNAME_SELECTOR);
    expect(mainNode).not.toBe(null);
    const contentNode = mainNode.querySelector(CONTENT_SELECTOR);
    expect(contentNode).not.toBe(null);
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
    expect(document.querySelector(CLASSNAME_SELECTOR)).toBe(null);
    expect(sut.loadServerInfo.mock.calls.length).toBe(0);
    sut.open();
    jest.runAllTimers();
    expect(sut.loadServerInfo.mock.calls.length).toBe(0);
    const mainNode = document.querySelector(CLASSNAME_SELECTOR);
    expect(mainNode).not.toBe(null);
    const contentNode = mainNode.querySelector(CONTENT_SELECTOR);
    expect(contentNode).not.toBe(null);
    const selector = "tr[data-qa-serverinfo]";
    const rows = contentNode.querySelectorAll(selector);
    expect(rows.length).toBe(0);
  });

  it("should close the window", () => {
    sut = new QaInfobox({});
    expect(document.querySelector(CLASSNAME_SELECTOR)).toBe(null);
    sut.open();
    jest.runAllTimers();
    expect(document.querySelector(CLASSNAME_SELECTOR)).not.toBe(null);
    expect(document.querySelector(CLASSNAME_SELECTOR).style.display).toBe("block");
    expect(document.querySelector(CLOSE_SELECTOR)).not.toBe(null);
    sut.close();
    expect(document.querySelector(CLASSNAME_SELECTOR).style.display).toBe("none");
  });

  it("should toggle the window", () => {
    sut = new QaInfobox({});
    expect(document.querySelector(CLASSNAME_SELECTOR)).toBe(null);
    pressKey(DEFAULT_KEY, DEFAULT_KEY_MODIFIERS);
    jest.runAllTimers();
    expect(document.querySelector(CLASSNAME_SELECTOR)).not.toBe(null);
    expect(document.querySelector(CLASSNAME_SELECTOR).style.display).toBe("block");
    pressKey(DEFAULT_KEY, DEFAULT_KEY_MODIFIERS);
    jest.runAllTimers();
    expect(document.querySelector(CLASSNAME_SELECTOR).style.display).toBe("none");
  });

  it("should not open unless correct key shortcut is used", () => {
    const randomKey = () => sample("ABCDEFGHIJKLMNOPRSTUVWXYZ");
    const trueOrFalse = () => sample([true, false]);
    sut = new QaInfobox({});
    expect(document.querySelector(CLASSNAME_SELECTOR)).toBe(null);
    pressKey(randomKey(), { altKey: trueOrFalse(), shiftKey: trueOrFalse() });
    expect(document.querySelector(CLASSNAME_SELECTOR)).toBe(null);
    pressKey(randomKey(), DEFAULT_KEY_MODIFIERS);
    jest.runAllTimers();
    expect(document.querySelector(CLASSNAME_SELECTOR)).toBe(null);
    pressKey(DEFAULT_KEY, { altKey: false, shiftKey: true });
    jest.runAllTimers();
    expect(document.querySelector(CLASSNAME_SELECTOR)).toBe(null);
    pressKey(DEFAULT_KEY, DEFAULT_KEY_MODIFIERS);
    jest.runAllTimers();
    expect(document.querySelector(CLASSNAME_SELECTOR)).not.toBe(null);
  });

  it("should open with custom key shortcut", () => {
    // eslint-disable-next-line no-magic-numbers
    const CUSTOM_KEYS = [74, 75, 77, 87, 93, 52];
    let customKey, shiftKey, altKey, ctrlKey, keyCode;

    keyCode = sample(CUSTOM_KEYS);
    altKey = ctrlKey = shiftKey = false;
    customKey = String.fromCharCode(keyCode);
    sut = new QaInfobox({ customKey });
    expect(document.querySelector(CLASSNAME_SELECTOR)).toBe(null);
    pressKey(keyCode, { altKey, shiftKey, ctrlKey });
    jest.runAllTimers();
    expect(document.querySelector(CLASSNAME_SELECTOR)).not.toBe(null);
    sut.destroy();

    keyCode = sample(CUSTOM_KEYS);
    ctrlKey = shiftKey = false;
    altKey = true;
    customKey = `ALT-${String.fromCharCode(keyCode)}`;
    sut = new QaInfobox({ customKey });
    expect(document.querySelector(CLASSNAME_SELECTOR)).toBe(null);
    pressKey(keyCode, { altKey, shiftKey, ctrlKey });
    jest.runAllTimers();
    expect(document.querySelector(CLASSNAME_SELECTOR)).not.toBe(null);
    sut.destroy();

    keyCode = sample(CUSTOM_KEYS);
    ctrlKey = false;
    altKey = true;
    shiftKey = true;
    customKey = `ALT-SHIFT-${String.fromCharCode(keyCode)}`;
    sut = new QaInfobox({ customKey });
    expect(document.querySelector(CLASSNAME_SELECTOR)).toBe(null);
    pressKey(keyCode, { altKey, shiftKey, ctrlKey });
    jest.runAllTimers();
    expect(document.querySelector(CLASSNAME_SELECTOR)).not.toBe(null);
    sut.destroy();

    keyCode = sample(CUSTOM_KEYS);
    ctrlKey = true;
    altKey = true;
    shiftKey = true;
    customKey = `ALT-SHIFT-CTRL-${String.fromCharCode(keyCode)}`;
    sut = new QaInfobox({ customKey });
    expect(document.querySelector(CLASSNAME_SELECTOR)).toBe(null);
    pressKey(keyCode, { altKey, shiftKey, ctrlKey });
    jest.runAllTimers();
    expect(document.querySelector(CLASSNAME_SELECTOR)).not.toBe(null);
  });
});