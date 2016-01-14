var BaseClient = require("./client");
var extend = require("./extend");
var util = require("util");

function AutomateClient(settings) {
  this.server = {
    host: "www.browserstack.com"
  };
  BaseClient.call(this, settings);
}

util.inherits(AutomateClient, BaseClient);

// public API
extend(AutomateClient.prototype, {

  getPlan: function(fn) {
    this.request({
      path: this.path("/plan.json")
    }, fn);
  },

  getBrowsers: function(fn) {
    this.request({
      path: this.path("/browsers.json")
    }, fn);
  },

  getProjects: function(fn) {
    this.requestAutomate({
      path: this.path("/projects.json")
    }, fn);
  },

  getProject: function(id, fn) {
    this.requestAutomate({
      path: this.path("/projects/" + id + ".json")
    }, fn);
  },

  getBuilds: function(options, fn) {
    if (typeof fn === "undefined") {
      fn = options;
      options = {};
    }
    this.requestAutomate({
      path: this.path("/builds.json")
    }, fn);
  },

  getSessions: function(buildId, options, fn) {
    if (typeof fn === "undefined") {
      fn = options;
      options = {};
    }
    this.requestAutomate({
      path: this.path("/builds/" + buildId + "/sessions.json")
    }, fn);
  },

  getSession: function(id, fn) {
    this.requestAutomate({
      path: this.path("/sessions/" + id + ".json")
    }, fn);
  },

  updateSession: function(id, options, fn) {
    var data = JSON.stringify(options);
    this.request({
      method: "PUT",
      path: this.path("/sessions/" + id + "/.json")
    }, data, fn);
  }

});

// internal API
extend(AutomateClient.prototype, {

  requestAutomate: function(options, data, fn) {
    if (typeof data === "function") {
      fn = data;
      data = null;
    }
    fn = fn || function() {};

    var self = this;
    this.request(options, data, function(err, res) {
      res = self.cleanResult(res);
      if (typeof res.builds !== "undefined") {
        res.builds = self.cleanResult(res.builds);
      }
      fn(err, res);
    });
  },

  cleanResult: function(res) {
    if (typeof res.forEach === 'function') {
      res.forEach(function(value, index) {
        if (typeof value === 'object' && Object.keys(value).length === 1) {
          res[index] = value[Object.keys(value)[0]];
        }
      });
    } else if (typeof res === 'object' && Object.keys(res).length === 1) {
      res = res[Object.keys(res)[0]];
    }
    return res;
  },

  path: function(path) {
    return "/automate" + path;
  }

});

module.exports = {
  createClient: function(settings) {
    return new AutomateClient(settings);
  }
};
