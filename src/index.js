const nlf = require('nlf');
const fs = require('fs');
const path = require('path');
const argv = require('yargs')
  .usage('Usage: -i [string] -o [string] -p [string] -l [number] -d -r')
  .alias('i', 'in-path')
  .default('i', 'NULL_PLACEHOLDER')
  .describe('i', 'the path to a node module')
  .alias('o', 'out-name')
  .default('o', 'NULL_PLACEHOLDER' )
  .describe('o', 'the file name')
  .alias('p', 'out-path')
  .describe('p', 'output base path')
  .default('p', 'NULL_PLACEHOLDER')
  .alias('l', 'limit-depth')
  .describe('l', 'Limit recursion to depth n')
  .default('l', 20)
  .alias('d', 'no-dev')
  .boolean('d')
  .default('d', true)
  .describe('d', 'ignore development dependencies')
  .alias('r', 'raw')
  .boolean('r')
  .default('r', false)
  .argv;

var counter = 0;
const LIMIT = argv.l;
function getBase(base = process.cwd()) {
  try {
    let stat = fs.statSync(path.join(base, 'package.json'));
    return base;
  } catch (err) {
    counter++;
    if (counter < LIMIT) {
      return getBase(path.join(base, '..'));
    } else {
      console.error(`ERROR: Folder depth limit reached in ${base}`);
      process.exit(1);
    }
  }
}

const outPath = (argv.p === 'NULL_PLACEHOLDER') ? getBase() : argv.p;
const inPath = (argv.i === 'NULL_PLACEHOLDER') ? getBase() : argv.i;
const outFile = (argv.o === 'NULL_PLACEHOLDER') ? `${path.normalize(inPath).split(path.sep).pop()}.glr.json` : argv.o;
const production = argv.d ? true : false;

function filterData(obj) {
  if (typeof obj === 'undefined') { return }
  if ('glr' === obj.name) { return }
  let _o = {
    name: obj.name,
    version: obj.version,
    respository: obj.repository,
    license: {
      type: obj.licenseSources.package.sources[0].license
    },
    dependencies: JSON.stringify(JSON.parse(fs.readFileSync(obj.directory + '/package.json'), 'utf8').dependencies)


  }

  if (obj.licenseSources.license.hasOwnProperty('sources')) {
    if (obj.licenseSources.license.sources[0]) {
      _o.license.text = obj.licenseSources.license.sources[0].text;
    } else {
      _o.license.text = "None included. See " + obj.repository;
    }
  }
  return _o;
}


nlf.find({production: production, directory: inPath}, (err, data) => {
  if (err) { console.error(err.message); process.exit(1) }
  else {
    let _out = [];
    for(var x of data) {
      _out.push(filterData(x));
    }
    if (argv.r) {
      fs.writeFile(path.normalize(`${outPath}/all.${outFile}`), JSON.stringify(data, null, 2), (err) => {});
    }
    fs.writeFile(path.normalize(`${outPath}/${outFile}`), JSON.stringify(_out, null, 2), (err) => {
      if (err) { console.error(err); process.exit(1) }
      else {
        console.log(`License data written to ${outFile} in ${outPath}`);
        process.exit(0);
      }
    })
  }
})
