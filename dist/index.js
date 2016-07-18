'use strict';

var nlf = require('nlf');
var fs = require('fs');
var path = require('path');
var argv = require('yargs').usage('Usage: -i [string] -o [string] -p [string] -l [number] -d -r').alias('i', 'in-path').default('i', 'NULL_PLACEHOLDER').describe('i', 'the path to a node module').alias('o', 'out-name').default('o', 'NULL_PLACEHOLDER').describe('o', 'the file name').alias('p', 'out-path').describe('p', 'output base path').default('p', 'NULL_PLACEHOLDER').alias('l', 'limit-depth').describe('l', 'Limit recursion to depth n').default('l', 20).alias('d', 'no-dev').boolean('d').default('d', true).describe('d', 'ignore development dependencies').alias('r', 'raw').boolean('r').default('r', false).argv;

var counter = 0;
var LIMIT = argv.l;
function getBase() {
  var base = arguments.length <= 0 || arguments[0] === undefined ? process.cwd() : arguments[0];

  try {
    var stat = fs.statSync(path.join(base, 'package.json'));
    return base;
  } catch (err) {
    counter++;
    if (counter < LIMIT) {
      return getBase(path.join(base, '..'));
    } else {
      console.error('ERROR: Folder depth limit reached in ' + base);
      process.exit(1);
    }
  }
}

var outPath = argv.p === 'NULL_PLACEHOLDER' ? getBase() : argv.p;
var inPath = argv.i === 'NULL_PLACEHOLDER' ? getBase() : argv.i;
var outFile = argv.o === 'NULL_PLACEHOLDER' ? path.normalize(inPath).split(path.sep).pop() + '.glr.json' : argv.o;
var production = argv.d ? true : false;

function filterData(obj) {
  if (typeof obj === 'undefined') {
    return;
  }
  if ('glr' === obj.name) {
    return;
  }
  var _o = {
    name: obj.name,
    version: obj.version,
    respository: obj.repository,
    license: {
      type: obj.licenseSources.package.sources[0].license
    },
    dependencies: JSON.stringify(JSON.parse(fs.readFileSync(obj.directory + '/package.json'), 'utf8').dependencies)

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

nlf.find({ production: production, directory: inPath }, function (err, data) {
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

    if (argv.r) {
      fs.writeFile(path.normalize(outPath + '/all.' + outFile), JSON.stringify(data, null, 2), function (err) {});
    }
    fs.writeFile(path.normalize(outPath + '/' + outFile), JSON.stringify(_out, null, 2), function (err) {
      if (err) {
        console.error(err);process.exit(1);
      } else {
        console.log('License data written to ' + outFile + ' in ' + outPath);
        process.exit(0);
      }
    });
  }
});