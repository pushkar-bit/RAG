const morgan = require('morgan');

// Standard Morgan logger logic setup to log every request made to the server
const logger = morgan('dev');

module.exports = logger;
