var browserstackAPI = require( "./api" ),
  browserstackScreenshot = require( "./screenshot" );

module.exports = {
  createClient: function( settings ) {
    return browserstackAPI( settings );
  },
  createScreenshotClient: function( settings ) {
    return browserstackScreenshot( settings );
  }
};
