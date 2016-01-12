var browserstackApi = require( "./api" ),
	browserstackAutomate = require( "./automate" ),
	browserstackScreenshot = require( "./screenshot" );

module.exports = {
	createClient: browserstackApi.createClient,
	createAutomateClient: browserstackAutomate.createClient,
	createScreenshotClient: browserstackScreenshot.createClient
};
