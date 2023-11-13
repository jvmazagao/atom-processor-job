const mongoose = require('mongoose');

const atomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true,
  },
  element: {
    type: String,
    required: true,
  },
  sequence: {
    type: Number,
    required: true,
  },
  aminoAcid: {
    type: String,
    required: true,
  },
  chainIdentifier: {
    type: String,
    required: true,
  },
  chainNumber: {
    type: Number,
    required: true,
  },
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  },
  z: {
    type: Number,
    required: true,
  },
  molecule_id: { type: mongoose.Schema.Types.String, ref: 'Molecule' },
}, { timestamps: true });

const Atom = mongoose.model('Atom', atomSchema);

module.exports = { Atom };
