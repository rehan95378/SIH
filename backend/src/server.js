// Server entry point. This file boots the Express app on the configured port.
require('dotenv').config();
const app = require('./app');
const { closeDatabase } = require('./config/db');

const PORT = Number(process.env.PORT || 4000);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

// Start the web server and return it so tests or other code can manage it.
const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });

  // Close HTTP and database connections when the process is stopped.
  const shutDown = async (signal) => {
    console.log(`${signal} received. Closing the backend server.`);
    try {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      await closeDatabase();
      process.exitCode = 0;
    } catch (error) {
      console.error('Could not shut down the backend cleanly.', error);
      process.exitCode = 1;
    }
  };

  process.once('SIGINT', () => {
    shutDown('SIGINT');
  });
  process.once('SIGTERM', () => {
    shutDown('SIGTERM');
  });

  return server;
};

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
