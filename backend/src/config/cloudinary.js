const { v2: cloudinary } = require('cloudinary');
const env = require('./env');

const hasCloudinaryConfig =
  Boolean(env.cloudinary.cloudName) &&
  Boolean(env.cloudinary.apiKey) &&
  Boolean(env.cloudinary.apiSecret);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

module.exports = {
  cloudinary,
  hasCloudinaryConfig,
};
