'use strict';

var nlf = require('nlf');
var fs = require('fs');
var path = require('path');
var argv = require('yargs').usage('Usage: -i [string] -o [string] -p [string] -d').alias('i', 'in-path').default('i', path.normalize(__dirname)).describe('i', 'the path to a node module').alias('o', 'out-name').default('o', process.cwd().split(path.sep).pop() + '.license-report').describe('o', 'the file name').alias('p', 'out-path').describe('p', 'output base path').default('p', path.normalize(__dirname)).alias('d', 'no-dev').boolean('d').default('d', true).describe('d', 'ignore development dependencies').argv;

function filterData(obj) {
  if (typeof obj === 'undefined') {
    return;
  }
  var _o = {
    name: obj.name,
    version: obj.version,
    respository: obj.repository,
    license: {
      type: obj.licenseSources.package.sources[0].license
    }
  };
  if (obj.licenseSources.license.hasOwnProperty('sources')) {
    if (obj.licenseSources.license.sources[0]) {
      _o.license.text = obj.licenseSources.license.sources[0].text;
    } else {
      _o.license.text = "None included. See " + obj.repository;
    }
  }
  return _o;
}

if (!argv.i || !argv.o) {
  console.error("Invalid args");process.exit(1);
} else {
  nlf.find({ production: argv.d, directory: argv.i }, function (err, data) {
    if (err) {
      console.error(err.message);process.exit(1);
    } else {
      var _out = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var x = _step.value;

          _out.push(filterData(x));
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      fs.writeFile(path.normalize(argv.p + '/' + argv.o), JSON.stringify(_out, null, 2), function (err) {
        if (err) {
          console.error(err);process.exit(1);
        } else {
          console.log('License data written to ' + argv.o + ' in ' + argv.p);
          process.exit(0);
        }
      });
    }
  });
}