/*
 * grunt--contrib-hogan
 * https://github.com/vanetix/grunt-templates-hogan
 *
 * Copyright (c) 2012 Matt McFarland
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {

  var Hogan = require('hogan.js'),
      helpers = require('grunt-lib-contrib').init(grunt),
      path = require('path');

  /**
   * Hogan grunt task
   */

  grunt.registerMultiTask('hogan', 'Compile hogan templates.', function() {
    var src, nsInfo, options, compiled,
        srcFiles, filename, output = [],
        head, moduleNames, variableNames;

    options = this.options({
      namespace: "Templates",
      templateOptions: { asString: true },
      defaultName: function(filename) {
        return filename;
      },
      generateTsd: false,
      tsdModuleBase: '',
      tsdExtension: '.d.ts'
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
            output = output.map(function(line) {
              return "  " + line;
            });
          }

          if(options.amdRequire && options.amdRequire instanceof Object) {
            head = ["define(["];
            moduleNames = [];
            variableNames = [];

            for (var key in options.amdRequire) {
              if("string" !== typeof options.amdRequire[key]) {
                grunt.fail.warn("options.amdRequire should be a object of {String:String}.");
                continue;
              }

              moduleNames.push("'" + key + "'");
              variableNames.push(options.amdRequire[key]);
            }

            head.push(moduleNames.join(","));
            head.push("], function(", variableNames.join(","), ") {");
            output.unshift(head.join(''));
          } else {
            output.unshift("define(function() {");
          }

          output.push((options.prettify ? "  " : "") + "return " + nsInfo.namespace + ";\n});");
        }
        if(options.commonJsWrapper) {
          output.push("\nif(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {");
          output.push("  module.exports = " + nsInfo.namespace + ";");
          output.push("}");
        }
        grunt.file.write(files.dest, output.join("\n"));
        grunt.log.writeln("File '" + files.dest + "' created.");
        output = [];
        if(options.generateTsd) {
          var jsExtension = files.orig && files.orig.ext ? files.orig.ext : '.js';
          var modName = path.relative(options.tsdModuleBase, files.dest.replace(jsExtension, ''));

          var tsdTemplate = 'declare module "<%= moduleName %>" {\n  export var <%= filename %>:{\n    render(params?:Object):string;\n  };\n}';
          var tsdOutput = grunt.template.process(tsdTemplate, {data: {moduleName: modName, filename: filename}});
          var tsdDestination = files.dest.replace('.js', options.tsdExtension);

          grunt.file.write(tsdDestination, tsdOutput);
          grunt.log.writeln("TypeScript definition file '" + tsdDestination + " created.");
        }
      }

    });

  });

};
