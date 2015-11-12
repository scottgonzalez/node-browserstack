var browserstackAPI = require( "./api" ),
  browserstackScreenshot = require( "./screenshot" );

module.exports = {
  createClient: browserstackAPI.createClient,
  createScreenshotClient: browserstackScreenshot.createClient
};
