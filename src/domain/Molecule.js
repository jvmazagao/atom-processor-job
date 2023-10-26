const mongoose = require('mongoose');

const moleuculeSchema = new mongoose.Schema({
  title: {
    type: String,
    require: true,
  },
  aminoAcids: [{
    identifier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AminoAcid',
      require: false,
    },
    sequence: {
      type: Number,
      required: false,
    },
  },
  ],
});

const Molecule = mongoose.model('Molecule', moleuculeSchema);

module.exports = { Molecule };
