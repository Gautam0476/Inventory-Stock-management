const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.locals.dbStatus = 'connecting';

app.listen(PORT, HOST, () => {
  console.log(`API running on http://${HOST}:${PORT}`);
});

connectDB()
  .then(() => {
    app.locals.dbStatus = 'connected';
  })
  .catch((error) => {
    app.locals.dbStatus = 'failed';
    console.error('Failed to connect MongoDB:', error.message);
  });
