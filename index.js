const fs = require('fs');
const path = require('path');
const readline = require('readline');
const events = require('events');
const EventEmitter = require('node:events');
const mongoose = require('mongoose');
const { error } = require('console');
const { File, Status } = require('./src/domain/File');
const { Molecule } = require('./src/domain/Molecule');
const { Atom } = require('./src/domain/Atom');

const emitter = new EventEmitter();

emitter.on('process_archive', async (archive) => {
  const { file, path } = archive;
  let storedArchive = await File.findOne({ name: file }).exec();
  if (!storedArchive) {
    console.log({ file, log: 'Creating register' });
    storedArchive = new File({ name: file, path, status: Status.PENDING });
    await storedArchive.save();
  }
  console.log({ file, log: 'Archive stored' });
  emitter.emit('read_file', storedArchive);
  console.log({ file, log: 'Sent to read file' });
});

emitter.on('process_molecule', async (molecule, archive) => {
  const { title, atoms } = molecule;
  const { name } = archive;
  console.log({ file: name, log: 'Starting to process element' });
  const storedElement = await Molecule.findById({ _id: title }).exec();
  if (!storedElement) {
    console.log({ file: name, log: 'Element not stored.' });
    const mol = new Molecule({ _id: title });
    await mol.save();
    const atomsToStore = atoms.map((atom) => {
      const at = new Atom({ ...atom, molecule_id: title });
      return at.save();
    });
    await Promise.all(atomsToStore);
  }
  console.log({ file: name, log: 'Element stored' });
  await File.findByIdAndUpdate(archive.id, { status: Status.PROCESSED });
  console.log({ file: name, log: 'File updated' });
});

emitter.on('error', async (archive, error) => {
  await File.findByIdAndUpdate(archive.id, { status: Status.ERROR });
  console.log({ file: archive.name, log: 'ERROR ON PROCESSING FILE' });
});

emitter.on('file_processed', (archive) => {
  console.log({ file: archive.name, log: 'File already processed' });
});

emitter.on('file_processing', (archive) => {
  console.log({ file: archive.name, log: 'File processing.' });
});

emitter.on('read_file', async (archive) => {
  const { path: pathToFile, name, status } = archive;

  if (status === Status.PROCESSED) {
    emitter.emit('file_processed', archive);
    return;
  }

  if (status === Status.PENDING) {
    emitter.emit('file_processing', archive);
    return;
  }

  try {
    console.log({ file: name, log: 'Starting to read file' });
    await File.findByIdAndUpdate(archive.id, { status: Status.PROCESSING });
    const reader = readline.createInterface({
      input: fs.createReadStream(pathToFile),
      crlfDelay: Infinity,
    });
    const title = [];
    const atomList = [];

    reader.on('line', (l) => {
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
          name: components[2],
          aminoAcid: components[3],
          chainIdentifier: components[4],
          chainNumber: parseInt(components[5], 10),
          x: parseFloat(components[6]),
          y: parseFloat(components[7]),
          z: parseFloat(components[8]),
          element: components[11],
        });
      }
    });

    await events.once(reader, 'close');
    console.log({ file: name, log: 'Finish to read file' });
    emitter.emit('process_molecule', {
      title: title.join(' '),
      atoms: atomList,
    }, archive);
    console.log({ file: name, log: 'Sent to process file' });
  } catch (err) {
    emitter.emit('error', error);
  }
});

const process = async () => {
  await mongoose.connect('mongodb://localhost:27017/local');

  const folderPath = path.resolve(__dirname, 'archives'); // Replace with the path to your archive folder

  const files = fs.readdirSync(folderPath);

  files.forEach((file) => {
    const archive = {
      file,
      path: folderPath.concat(`/${file}`),
    };
    emitter.emit('process_archive', archive);
  });
};

process();
