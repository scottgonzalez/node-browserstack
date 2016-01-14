var browserstackApi = require("./api");
var browserstackScreenshot = require("./screenshot");
var browserstackAutomate = require("./automate");

module.exports = {
	createClient: browserstackApi.createClient,
	createAutomateClient: browserstackAutomate.createClient,
	createScreenshotClient: browserstackScreenshot.createClient
};
