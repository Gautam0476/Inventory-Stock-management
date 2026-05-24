const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

app.locals.dbStatus = 'connecting';

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

connectDB()
  .then(() => {
    app.locals.dbStatus = 'connected';
  })
  .catch((error) => {
    app.locals.dbStatus = 'failed';
    console.error('Failed to connect MongoDB:', error.message);
  });
