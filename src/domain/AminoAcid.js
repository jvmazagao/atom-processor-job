const { mongoose } = require('mongoose');

const amoniAcidSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  atoms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Atom',
      require: false,
    },
  ],
});

const AminoAcid = mongoose.model('AminoAcid', amoniAcidSchema);

module.exports = { AminoAcid };
