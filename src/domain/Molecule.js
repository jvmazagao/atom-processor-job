const mongoose = require('mongoose');

const moleuculeSchema = new mongoose.Schema({
  _id: {
    type: String,
    require: true,
  },
}, { timestamps: true });

const Molecule = mongoose.model('Molecule', moleuculeSchema);

module.exports = { Molecule };
