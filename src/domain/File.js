const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
    index: true,
  },
  path: {
    type: String,
    require: true,
  },
  status: {
    type: String,
    require: true,
  },
}, { timestamps: true });

const File = mongoose.model('File', fileSchema);

const Status = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PROCESSED: 'PROCESSED',
  ERROR: 'ERROR',
};

module.exports = { File, Status };
