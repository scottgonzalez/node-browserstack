var https = require( "https" ),
  http = require( "http" ),
  util = require( "util" ),
  userAgent = getUA();

function getUA() {
  var os = require( "os" ),
    version = require( "../package.json" ).version;
  return os.platform() + "/" + os.release() + " " +
    "node/" + process.versions.node + " " +
    "node-browserstack/" + version;
}

var baseClient = function ( settings ) {
  if ( !settings.username ) {
    throw new Error( "Username is required." );
  }
  if ( !settings.password ) {
    throw new Error( "Password is required." );
  }

  util._extend( this, settings );
  this.authHeader = "Basic " +
    new Buffer( this.username + ":" + this.password ).toString( "base64" );
}

baseClient.prototype.request = function( options, data, fn ) {
  if ( typeof data === "function" ) {
    fn = data;
    data = null;
  }

  fn = fn || function() {};

  var reqOptions = {
    host: this.serverHost,
    method: "GET",
    headers: {
      authorization: this.authHeader,
      "content-type": "application/json",
      "user-agent": userAgent,
      "content-length": typeof data === "string" ? data.length : 0
    }
  };
  util._extend(reqOptions, options);

  var req = (this.useHttp ? http : https).request( reqOptions, function( res ) {
    var response = "";
    res.setEncoding( "utf8" );
    res.on( "data", function( chunk ) {
      response += chunk;
    });
    res.on( "end", function() {
      if ( res.statusCode !== 200 ) {
        var message;
        if ( res.headers[ "content-type" ].indexOf( "json" ) !== -1 ) {
          response = JSON.parse( response );
          message = response.message;
          if ( response.errors && response.errors.length ) {
            message += " - " + response.errors.map(function( error ) {
              return "`" + error.field + "` " + error.code;
            }).join( ", " );
          }
        } else {
          message = response;
        }
        if ( !message && res.statusCode === 403 ) {
          message = "Forbidden";
        }
        fn( new Error( message ) );
      } else {
        fn( null, JSON.parse( response ) );
      }
    });
  });

  req.on( "error", fn );

  if ( data ) {
    req.write( data );
  }

  req.end();
};

module.exports = baseClient;
