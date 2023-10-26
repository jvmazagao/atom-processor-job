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
});

const Atom = mongoose.model('Atom', atomSchema);

module.exports = { Atom };
