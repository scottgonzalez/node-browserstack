var browserstackApi = require("./api");
var browserstackScreenshot = require("./screenshot");

module.exports = {
	createClient: browserstackApi.createClient,
	createScreenshotClient: browserstackScreenshot.createClient
};
