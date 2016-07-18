var p = require('commander');
var nlf = require('nlf');
var fs = require('fs');
var path = require('path');
var outContent = [];
var options = {
  prodution: true,
  directory: path.normalize(__dirname)
};
var config = {
  out_dir: path.normalize(__dirname),
  out_file: (process.cwd().split(path.sep).pop() + '.licenses.json' )
}
function toggleDev(value, inOpts) {
  if (typeof value === 'undefined') {inOpts = options; value = false}
  else if (typeof value === 'object') { inOpts = value; value = false}
  else if (typeof inOpts === 'undefined') { inOpts = options }
  inOpts.production = value;
  return inOpts.production;
}
function setDir(value, inOpts) {
  if (typeof value === 'undefined') {inOpts = options; value = '.'}
  else if (typeof value === 'object') { inOpts = value; value = '.'}
  else if (typeof inOpts === 'undefined') { inOpts = options }
  inOpts.directory = path.normalize(value);
  return inOpts.directory;
}

function setOutPath(value, inConf) {
  if (typeof value === 'undefined') {inConf = config; value = '.'}
  else if (typeof value === 'object') { inConf = value; value = '.'}
  else if (typeof inConf === 'undefined') { inConf = config }
  inConf.out_dir = path.normalize(value);
  return inConf.out_dir;
}

function setOutFile(value, inConf) {
  if (typeof value === 'undefined') {inConf = config; value = config.out_file }
  else if (typeof value === 'object') { inConf = value; value = config.out_file }
  else if (typeof inConf === 'undefined') { inConf = config }
  inConf.out_file = value;
  console.log(inConf.out_file);
  return inConf.out_file;
}
function addToOut(obj) {
  if (typeof obj === 'undefined') { return }
  var _o = {
    name: obj.name,
    version: obj.version,
    respository: obj.repository,
    license: {
      type: obj.licenseSources.package.sources[0].license
    }
  }
  if (obj.licenseSources.license.hasOwnProperty('sources')) {
    if (obj.licenseSources.license.sources[0]) {
      _o.license.text = obj.licenseSources.license.sources[0].text;
    } else {
      _o.license.text = "None included. See " + obj.repository;
    }
  }
  outContent.push(_o);

}
p
  .version('1.0.0')
  .option('-p, --path [path]', 'Project path', setDir, options)
  .option('-d, --no-dev', 'Exclude dev dependencies', toggleDev, options)
  .option('-o, --output [out_path]', 'Output path', setOutPath, config )
  .option('-n, --name [name]', 'Output File Name', setOutFile, config )
  .parse(process.argv);

if (!p.path) {
  console.error(p.path + 'does not exist');
  process.exit(1);
} else {
  nlf.find(options, function (err, data) {
    if (err) { console.error(err.message); process.exit(1) }
    else if (data) {
      data.forEach(addToOut);
      fs.writeFile(path.normalize(config.out_dir + '/' + config.out_file), JSON.stringify(outContent, null, 2), 'utf-8', function(err) {
        if (err) { console.error(err); process.exit(1) }
        else {

          console.log('License details written to ' + config.out_file);
          process.exit(0);
        }
      })
    }
  });
}
