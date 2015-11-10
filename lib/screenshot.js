var baseClient = require( "./client" ),
  util = require( "util" );

var api = {

  // public API
  getBrowsers: function( fn ) {
    this.request({
      path: this.path( "/browsers.json" )
    }, fn );
  },

  getScreenshot: function( options, fn ) {
    var data = JSON.stringify( options );
    this.request({
      method: "POST",
      path: this.path( "" )
    }, data, fn );
  },

  getJob: function( id, fn ) {
    this.request({
      path: this.path( "/" + id + ".json" )
    }, fn );  
  },


  // internal stuff
  serverHost: "www.browserstack.com",
  path: function( path ) {
    return "/screenshots" + path;
  }

}


module.exports = function( settings ) {
  var client = new baseClient( settings );
  util._extend( client, api);
  return client;
};
