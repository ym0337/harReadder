const path = require('path');

const DICTIONNARY_PATH = path.resolve(__dirname, '..', 'dictionnary');
const HAR_PATH = path.resolve(__dirname, '..', 'har');
const RESPONSE_PATH = path.resolve(__dirname, '..', 'response');
const UPLOADFILE_PATH = path.resolve(__dirname, '..', 'uploadFile');
const PORT = 3011;

module.exports = {
  DICTIONNARY_PATH,
  HAR_PATH,
  RESPONSE_PATH,
  UPLOADFILE_PATH,
  PORT,
}