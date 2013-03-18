# node-browserstack

A node.js JavaScript client for working with [BrowserStack](http://browserstack.com) through its [API](https://github.com/browserstack/api).

## Installation

*Note that this fork adds support for BrowserStack API v3, and is forked from the main repo at [https://github.com/scottgonzalez/node-browserstack](https://github.com/scottgonzalez/node-browserstack)*

Installation instructions require install grom Github until these changes are merged into the main repo above.

```
npm install git://github.com/ably-forks/node-browserstack.git
```

or add the following to your package.json file

```javascript
{
  ...
  "dependencies": {
    ...
    "browserstack": "git://github.com/ably-forks/node-browserstack.git"
    ...
  },
  ...
}
```

## Usage

```javascript
var BrowserStack = require( "browserstack" );
var client = BrowserStack.createClient({
	username: "foo",
	password: "p455w0rd!!1"
});

client.getBrowsers(function( error, browsers ) {
	console.log( "The following browsers are available for testing" );
	console.log( browsers );
});
```

## API

### browser objects

A common pattern in the API is a "browser object" which is just a plain object with the following properties:

* `os`: The operating system.
* `os_version`: The operating system version.
* `browser`: The browser name.
* `browser_version`: The browser or device version.
* `device`: The device name.

#### API V2 uses the following:

* `os`: The operating system.
* `browser`: The browser name.
* `device`: The device name.
* `version`: The browser or device version.

A browser object may only have one of `browser` or `device` set; which property is set will depend on `os`.

#### API V1 varies as follows:

*V1 does not support multiple operating systems.
As such, there is no `os` version, and browser objects will always use `browser`.*

### worker objects

Worker objects are extended [browser objects](#browser-objects) which contain the following additional properties:

* `id`: The worker id.
* `status`: A string representing the current status of the worker.
  * Possible statuses: `"running"`, `"queue"`.

### BrowserStack.createClient( settings )

Creates a new client instance.

* `settings`: A hash of settings that apply to all requests for the new client.
  * `username`: The username for the BrowserStack account.
  * `password`: The password for the BrowserStack account.
  * `version` (optional; default: `3`): Which version of the BrowserStack API to use.  Please refer to [BrowserStack API](https://github.com/browserstack/api/) for a list of API versions by branch.
  * `server` (optional; default: `{ host: "api.browserstack.com", port: 80 }`): An object containing `host` and `port` to connect to a different BrowserStack API compatible service.

### client.getBrowsers( callback )

Gets the list of available browsers.

* `callback` (`function( error, browsers )`): A callback to invoke when the API call is complete.
  * `browsers`: An array of [browser objects](#browser-objects).

### client.createWorker( settings, callback )

Creates a worker.

* `settings`: A hash of settings for the worker (an extended [browser object](#browser-objects)).
  * `os`: Which OS to use for the new worker.
  * `os_version`: Which OS version to use for the new worker.
  * `browser`/`device`: Which browser/device to use in the new worker. Which property to use depends on the OS.
  * `browser_versoin`: Which version of the specified browser to use.
  * `url` (optional): Which URL to navigate to upon creation.
  * `timeout` (optional): Maximum life of the worker (in seconds). Use 0 for "forever" (BrowserStack will kill the worker after 1,800 seconds).
* `callback` (`function( error, worker )`): A callback to invoke when the API call is complete.
  * `worker` A [worker object](#worker-objects).

*Note: A special value of "latest" is supported for `version`, which will use the latest stable version.*

*API Note: The above parameters are compatible with [version 3 of the API](https://github.com/browserstack/api/tree/v3). [Version 2](https://github.com/browserstack/api/tree/v2) and [Version 1](https://github.com/browserstack/api/tree/v1) are also supported*

### client.getWorker( id, callback )

Gets the status of a worker.

* `id`: The id of the worker.
* `callback` (`function( error, worker )`): A callback to invoke when the API call is complete.
  * `worker`: A [worker object](#worker-objects).

### client.terminateWorker( id, callback )

Terminates an active worker.

* `id`: The id of the worker to terminate.
* `callback` (`function( error, data )`): A callback to invoke when the API call is complete.
  * `data`: An object with a `time` property indicating how long the worker was alive.

### client.getWorkers( callback )

Gets the status of all workers.

* `callback` (`function( error, workers )`): A callback to invoke when the API call is complete.
  * `workers`: An array of [worker objects](#worker-objects).

### client.getLatest( browser, callback )

Gets the latest version of a browser.

* `browser`: Which browser to get the latest version for.
* `callback` (`function( error, version )`): A callback to invoke when the version is determined.
  * `version`: The latest version of the browser.

### client.getLatest( callback )

Gets the latest version of all browsers.

* `callback` (`function( error, versions )`): A callback to invoke when the versions are determined.
  * `versions`: A hash of browser names and versions.

### client.getApiStatus( callback )

Gets the status of your API, see [BrowserStack API Status](https://github.com/browserstack/api#getting-api-status).

* `callback` (`function( error, versions )`): A callback to invoke when the versions are determined.
  * `status`: A hash representing the API status.

## License

node-browserstack is licensed under the MIT license.
