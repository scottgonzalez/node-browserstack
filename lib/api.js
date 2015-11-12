var baseClient = require( "./client" ),
  util = require( "util" ),
  extend = require( "extend" );


// client
function apiClient( settings ) {
  baseClient.call( this, settings );
}
util.inherits( apiClient, baseClient );


extend( apiClient.prototype, {

  // public api
  getBrowsers: function( fn ) {
    this._getBrowsers( function( error, browsers ) {
      if ( !error ) {
        this.updateLatest( browsers );
      }

      fn( error, browsers );
    }.bind( this ) );
  },

  createWorker: function( options, fn ) {
    if ( options[ this.versionField ] === "latest" ) {
      return this.getLatest( options, function( error, version ) {
        if ( error ) {
          return fn( error );
        }

        options = extend( {}, options );
        options[ this.versionField ] = version;
        this.createWorker( options, fn );
      }.bind( this ) );
    }

    var data = JSON.stringify( options );
    this.request({
      path: this.path( "/worker" ),
      method: "POST"
    }, data, fn );
  },

  getWorker: function( id, fn ) {
    this.request({
      path: this.path( "/worker/" + id )
    }, fn );
  },

  changeUrl: function( id, options, fn ) {
    var data = JSON.stringify( options );
    this.request({
      path: this.path( "/worker/" + id + "/url.json" ),
      method: "PUT"
    }, data, fn );
  },

  terminateWorker: function( id, fn ) {
    this.request({
      path: this.path( "/worker/" + id ),
      method: "DELETE"
    }, fn );
  },

  getWorkers: function( fn ) {
    this.request({
      path: this.path( "/workers" )
    }, fn );
  },

  getLatest: function( browser, fn ) {
    var latest = this.latest,
      browserId = this.getBrowserId( browser );

    if ( typeof browser === "function" ) {
      fn = browser;
      browser = null;
    }

    // there may be a lot of createWorker() calls with "latest" version
    // so minimize the number of calls to getBrowsers()
    if ( this.latestPending ) {
      return setTimeout(function() {
        this.getLatest( browser, fn );
      }.bind( this ), 50 );
    }

    // only cache browsers for one day
    if ( !latest || this.latestUpdate < (new Date() - 864e5) ) {
      this.latestPending = true;
      return this.getBrowsers(function( error ) {
        this.latestPending = false;

        if ( error ) {
          return fn( error );
        }

        this.getLatest( browser, fn );
      }.bind( this ) );
    }

    process.nextTick(function() {
      fn( null, browser ? latest[ browserId ] : extend( {}, latest ) );
    });
  },

  takeScreenshot: function( id, fn ) {
    this.request({
      path: this.path( "/worker/" + id + "/screenshot.json" )
    }, fn );
  },
  

  // internal stuff
  server: {
    host: "api.browserstack.com"
  },
  latest: null,
  latestUpdate: 0,
  latestPending: false,

  path: function( path ) {
    return "/" + this.version + path;
  },

  updateLatest: function( browsers ) {
    var latest = this.latest = {},
      getBrowserId = this.getBrowserId,
      versionField = this.versionField;

    this.latestUpdate = new Date();
    browsers.forEach(function( browser ) {
      var version = browser[ versionField ],
        browserId = getBrowserId( browser );

      // ignore devices that don't have versions
      if ( !version ) {
        return;
      }

      // ignore pre-release versions
      if ( /\s/.test( version ) ) {
        return;
      }

      if ( parseFloat( version ) >
          (parseFloat( latest[ browserId ] ) || 0) ) {
        latest[ browserId ] = version;
      }
    });
  }
});


// Versions
var apiVersions = {

  1: {
    useHttp: true,

    versionField: "version",

    _getBrowsers: function( fn ) {
      this.request({
        path: this.path( "/browsers" )
      }, fn );
    },

    getBrowserId: function( browser ) {
      return browser.browser;
    }
  },

  2: {
    useHttp: true,

    versionField: "version",

    _getBrowsers: function( fn ) {
      this.request({
        path: this.path( "/browsers" )
      }, function( error, osBrowsers ) {
        if ( error ) {
          return fn( error );
        }

        fn( null, [].concat.apply( [],
          Object.keys( osBrowsers ).map(function( os ) {
            return osBrowsers[ os ].map(function( browser ) {
              browser.os = os;
              return browser;
            });
          })
        ));
      });
    },

    getBrowserId: function( browser ) {
      return browser.os + ":" + (browser.browser || browser.device);
    }
  },

  3: {
    useHttp: true,

    versionField: "browser_version",

    _getBrowsers: function( fn ) {
      this.request({
        path: this.path( "/browsers?flat=true" )
      }, fn );
    },

    getBrowserId: function( browser ) {
      var id = browser.os + ":" + browser.os_version + ":" + browser.browser;
      if ( browser.device ) {
        id += ":" + browser.device;
      }

      return id;
    },

    getApiStatus: function( fn ) {
      this.request({
        path: this.path( "/status" )
      }, fn );
    }
  },

  4: {
    versionField: "browser_version",

    _getBrowsers: function( fn ) {
      this.request({
        path: this.path( "/browsers?flat=true" )
      }, fn );
    },

    getBrowserId: function( browser ) {
      var id = browser.os + ":" + browser.os_version + ":" + browser.browser;
      if ( browser.device ) {
        id += ":" + browser.device;
      }

      return id;
    },

    getApiStatus: function( fn ) {
      this.request({
        path: this.path( "/status" )
      }, fn );
    }

  }

}


module.exports = {
  createClient: function ( settings ) {

    // get version-specific properties
    var version = settings.version || Math.max.apply(null, Object.keys(apiVersions));
    var versionSettings = apiVersions[ version ];
    if ( !versionSettings ) {
      throw new Error( "Invalid version" );
    }
    apiClient.prototype.version = version;
    extend( apiClient.prototype, versionSettings);

    return new apiClient( settings );
  }
};
