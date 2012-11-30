module.exports = function( grunt ) {

grunt.initConfig({
	lint: {
		files: [ "grunt.js", "lib/*.js", "bin/*.js" ]
	}
});

grunt.registerTask( "default", "lint" );

};
