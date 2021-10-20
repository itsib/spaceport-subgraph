const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

const network = process.argv[2] || 'undefined';
const configFile = path.resolve(`${__dirname}/../config/${network}.json`);
const subgraphTmplFile = path.resolve(`${__dirname}/subgraph.mustache`);
const dexTmplFile = path.resolve(`${__dirname}/variables.mustache`);

if (!fs.existsSync(configFile)) {
  console.error(`ERR: File config/${network}.json do not exist`);
  process.exit(-1);
}
if (!fs.existsSync(subgraphTmplFile)) {
  console.error('ERR: File subgraph.mustache not exist');
  process.exit(-1);
}
if (!fs.existsSync(dexTmplFile)) {
  console.error('ERR: File addresses.mustache not exist');
  process.exit(-1);
}

const subgraphTmpl = fs.readFileSync(subgraphTmplFile, 'utf-8');
const dexTmpl = fs.readFileSync(dexTmplFile, 'utf-8');

const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));

fs.writeFileSync(path.resolve(`${__dirname}/../subgraph.yaml`), handlebars.compile(subgraphTmpl)(config));
fs.writeFileSync(path.resolve(`${__dirname}/../src/constants/variables.ts`), handlebars.compile(dexTmpl)(config));

