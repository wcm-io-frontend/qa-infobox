QA-Infobox
==========

Displays a modalbox with minimal OS and browser info, plus optional info from JSON files. Formats data with Atlassian confluence markaup.
Developed as a tool to allow QA to determine what system they were testing. ES2015 native.

## Dependencies
None

## installation
```
npm install --save qa-infobox
```

## Usage
In your HTML, include the CSS (adapt the path to your toolchain)
```
<link rel="stylesheet" href="node_modules/qa-infobox/lib/qa-infobox.css">
```

And in your ES 6+ source, simply import the library
```
import QaInfobox from "qa-infobox";

new QaInfobox(options);
```
See the demo for an example.

## Chaging the Styling
Simply create your own CSS files using the default classes from `qa-infobox.css` and include that in your HTML.

## Options
The default fields being shown are: `["useragent", "os", "monitor", "browser", "url", "viewport"]`

| option name | meaning | default |
| ----------- | ------- | ------- |
| id | string | ID attribute which will be attached to topmost element | qa-m-infobox |
| customKey | string | key combination that fires opens and closes it, in format [MODIFIER-]*[KEY], where MODIFIER is either SHIFT, CTRL or ALT and KEY is a single string character (note that if there are more than one the last one will be used) | ALT-SHIFT-Q |
| parent | where to attach the popup | document.body |
| defaultFields | array of fieldnames | only show the default fields in the list (e.g. `["os", "browser"]`) |
| ignoredFields | array of fieldnames | ignore fields you don't want in the popup, wherever they come from |
| customData | object | an object with custom key/value pairs you can manually add. Example {code}QaInfobox.create({ customData: { dad: "Homer", mum: "Marge" }});{code} | none |
| jsonPath | array of strings or single string |  list of paths of JSON files with key value pairs to be shown in popup | none |

## More detailed platform info
OS X/Browser detection is quite complex; to avoid dependencies qa-infobox only detects the most common. If you want more detailed information, it is suggested you use the `platform` package to generate a `customData` object. The demo shows an example of that.


## Demo
To run the demo, simply run
```
npm start
```
It will automatically open http://0.0.0.0:8080/ in your default browser

## Development
Npm scripts are used as build tool. Jest is used for testing. During development you can use
```
npm start              # will rebuild the site whenever you edit a file
npm run watch:test     # runs tests whenever you edit a js file
npm run watch:lint:js  # runs js linting whenever you edit a js file
```
