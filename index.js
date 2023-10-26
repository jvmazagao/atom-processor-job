/* eslint-disable no-console */
const cron = require('node-cron');
const events = require('events');
const fs = require('fs');
const readline = require('readline');
const mongoose = require('mongoose');
const { Atom } = require('./src/domain/Atom');
const { Molecule } = require('./src/domain/Molecule');
const { AminoAcid } = require('./src/domain/AminoAcid');

async function processLineByLine() {
  try {
    const rl = readline.createInterface({
      input: fs.createReadStream('pdb7bmx.ent'),
      crlfDelay: Infinity,
    });
    const title = [];
    const atomList = [];

    rl.on('line', (l) => {
      const line = String(l);
      const ATOM = /^ATOM\s+\d+\s+\w+\s+\w+\s+\w+\s+-?\d+\s+-?\d+\.\d+\s+-?\d+\.\d+\s+-?\d+\.\d+\s+\d+\.\d+\s+\d+\.\d+\s+\w+\s*$/;
      if (line.includes('TITLE')) {
        const parse = line.replace(/TITLE/, '');
        title.push(parse.replace(/\s+/, '').trim());
      }
      if (line.match(ATOM)) {
        const components = line.split(/\s+/);
        atomList.push({
          sequence: parseInt(components[1], 10),
          atom: components[2],
          aminoAcid: components[3],
          chainIdentifier: components[4],
          chainNumber: parseInt(components[5], 10),
          xCoordinate: parseFloat(components[6]),
          yCoordinate: parseFloat(components[7]),
          zCoordinate: parseFloat(components[8]),
          occupancy: parseFloat(components[9]),
          temperatureFactor: parseFloat(components[10]),
          element: components[11],
        });
      }
    });

    await events.once(rl, 'close');

    return { title: title.join(' '), atoms: atomList };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

cron.schedule('*/1 * * * *', async () => {
  console.log('Starting Processing file.');
  try {
    await mongoose.connect('mongodb://localhost:27017/local');
    const items = await processLineByLine();
    const { title, atoms } = items;

    const atomsSet = atoms.reduce((prev, acc) => {
      const { atom: name, element } = acc;
      if (!prev[name]) {
        // eslint-disable-next-line no-param-reassign
        prev[name] = { name, element };
      }

      return prev;
    }, {});

    const chainSet = atoms.reduce((prev, acc) => {
      const { aminoAcid, chainNumber } = acc;
      if (!prev[chainNumber]) {
        // eslint-disable-next-line no-param-reassign
        prev[chainNumber] = { aminoAcid };
      }

      return prev;
    }, {});

    const atomListModel = Object.keys(atomsSet).map((atom) => {
      const { name, element } = atomsSet[atom];
      return Atom.findOneAndUpdate(
        { name, element },
        { name, element },
        { upsert: true },
      );
    });
    // Encadear os comportamentos ou fazer o uso de emitters faz sentido.
    const atomsList = await Promise.all(atomListModel);

    const aminoAcidsSet = atoms.reduce((prev, acc) => {
      const { aminoAcid, atom: name } = acc;
      const atom = atomsList.find((a) => a.name === name);
      if (!prev[aminoAcid]) {
        prev[aminoAcid] = [];
      }
      if (!prev[aminoAcid].includes(atom)) {
        prev[aminoAcid].push(atom);
      }
      return prev;
    }, {});

    const acidsModel = Object.keys(aminoAcidsSet).map((aminoAcid) => AminoAcid.findOneAndUpdate(
      { name: aminoAcid },
      { name: aminoAcid, atoms: aminoAcidsSet[aminoAcid] },
      { upsert: true },
    ));
    const aminoAcidsList = await Promise.all(acidsModel);

    const acids = Object.keys(chainSet).map((chain) => {
      const { aminoAcid } = chainSet[chain];
      const amino = aminoAcidsList.find((a) => a.name === aminoAcid);
      return {
        identifier: amino,
        sequence: chain,
      };
    });

    const molecule = new Molecule({ title, aminoAcids: acids });
    await molecule.save();
  } catch (error) {
    console.error(error);
  }
  console.log('Finishing processing file.');
});
