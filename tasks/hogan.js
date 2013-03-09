/*
 * grunt--contrib-hogan
 * https://github.com/vanetix/grunt-contrib-hogan
 *
 * Copyright (c) 2012 Matt McFarland
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {

  var Hogan = require('hogan.js'),
      helpers = require('grunt-lib-contrib').init(grunt);

  /**
   * Hogan grunt task
   */

  grunt.registerMultiTask('hogan', 'Compile hogan templates.', function() {
    var src, nsInfo, options, compiled,
        srcFiles, filename, output = [];

    options = this.options({
      namespace: "Templates",
      templateOptions: { asString: true },
      defaultName: function(filename) {
        return filename;
      }
    });

    nsInfo = helpers.getNamespaceDeclaration(options.namespace);

    this.files.forEach(function(files) {
      files.src.forEach(function(file) {
        src = grunt.file.read(file);

        /**
         * Log the error to the console if an error is thrown
         * while compiling template
         */

        try {
          compiled = Hogan.compile(src, options.templateOptions);
        }
        catch(e) {
          grunt.log.error(e);
          grunt.fail.warn("Hogan failed to compile \"" + file + "\".");
        }

        if(options.prettify) {
          compiled = compiled.replace(/\t+|\n+/g, '');
        }

        filename = options.defaultName(file);
        output.push(nsInfo.namespace +
          "[" + JSON.stringify(filename) + "] = new Hogan.Template(" + compiled + ");");
      });

      if(output.length > 0) {
        output.unshift(nsInfo.declaration);

        if(options.amdWrapper) {
          if(options.prettify) {
            output.forEach(function(line, idx) {
              output[idx] = "  " + line;
            });
          }
          output.unshift("define(function() {");
          output.push("  return " + nsInfo.namespace + ";\n});");
        }
        if(options.commonJsWrapper) {
          output.push("module.exports = " + nsInfo.namespace + ";");
        }
        grunt.file.write(files.dest, output.join("\n\n"));
        grunt.log.writeln("File '" + files.dest + "' created.");
      }

    });

  });

};
