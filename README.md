QA-Infobox
==========

Displays a modalbox with minimal OS and browser info, plus optional info from JSON files. Developed as a tool to allow QA to determine what system they were testing. ES2015 native.

## Dependencies
None

## installation
```
npm install --save qa-infobox
```

## Usage
```
import QaInfobox from "qa-infobox";

QaInfobox.create(options);
```

## Options
| option name | meaning | default |
| ----------- | ------- | ------- |
| className | string | CSS class which will be attached to topmost element. NOTE: if you change it the default CSS will no longer apply | qa-infobox |
| customKey | string | key combination that fires opens and closes it, in format [MODIFIER-]*[KEY], where MODIFIER is either SHIFT, CTRL or ALT and KEY is a single string character (note that if there are more than one the last one will be used) | ALT-SHIFT-Q |
| parent | where to attach the popup | document.body |
| customData | object | an object with custom key/value pairs you can manually add. Example {code}QaInfobox.create({ customData: { dad: "Homer", mum: "Marge" }});{code} | none |
| jsonPath | array of strings or single string |  list of paths of JSON files with key value pairs to be shown in popup | none |


## Demo
To run the demo, simply run
```
npm start
```
It will automatically open http://0.0.0.0:8080/ in your default browser

## Development
Npm scripts are used as build tool. Jest is used for testing. Use
```
npm run watch
```
doing development