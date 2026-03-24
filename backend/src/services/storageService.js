const fs = require('fs/promises');
const path = require('path');
const { cloudinary, hasCloudinaryConfig } = require('../config/cloudinary');

const uploadImage = async (file) => {
  if (!file) return '';

  if (hasCloudinaryConfig) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'urbanbuddy/complaints',
      resource_type: 'image',
    });

    await fs.unlink(file.path).catch(() => {});
    return result.secure_url;
  }

  return `/uploads/${path.basename(file.path)}`;
};

const uploadImages = async (files = []) => {
  if (!files.length) return [];

  const urls = [];
  for (const file of files) {
    const url = await uploadImage(file);
    if (url) {
      urls.push(url);
    }
  }
  return urls;
};

module.exports = {
  uploadImage,
  uploadImages,
};
