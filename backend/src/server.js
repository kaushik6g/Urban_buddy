const app = require('./app');
const env = require('./config/env');

app.listen(env.port, () => {
  console.log(`UrbanBuddy backend running on port ${env.port}`);
});
