import platform from "platform";

import QaInfobox from "../lib/index";


// example custom data
const customData = {
  layout: platform.layout,
  manufacturer: platform.manufacturer,
  "better os": platform.os
};

// we ignore some comedy fields (they are in the json files)
const ignoredFields = ["cocktails", "good vibes"];

// we decide which of the default fields we want
// (in this case it would have been easier to add "os" to the ignoredFields,
// but it's just a demo to show how it works)
const requiredFields = ["useragent", "monitor", "browser", "url", "viewport"];

// eslint-disable-next-line no-new
new QaInfobox({
  customData,
  ignoredFields,
  requiredFields,
  id: "a-custom-id",
  jsonPath: ["/demo/data1.json", "/demo/data2.json"]
});