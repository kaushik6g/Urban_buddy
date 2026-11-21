const fs = require('fs/promises');
const path = require('path');
const { cloudinary, hasCloudinaryConfig } = require('../config/cloudinary');

const supabase = require('../config/supabase');
const bucket = 'urbanbuddy-complaint-photos';
const prefix = 'storage:' + bucket + '/';

const signedPhoto = async (value) => {
  if (!value?.startsWith(prefix)) return value;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(value.slice(prefix.length), 3600);
  return error ? '' : data.signedUrl;
};

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

  if (process.env.VERCEL) {
    const key = path.basename(file.path);
    try {
      const bytes = await fs.readFile(file.path);
      const storage = supabase.storage.from(bucket);
      const options = { contentType: file.mimetype };
      let { error } = await storage.upload(key, bytes, options);
      if (error && /bucket not found/i.test(error.message)) {
        const created = await supabase.storage.createBucket(bucket, {
          public: false, allowedMimeTypes: ['image/png', 'image/jpeg'], fileSizeLimit: 5242880
        });
        if (created.error && !/exist/i.test(created.error.message)) throw created.error;
        ({ error } = await storage.upload(key, bytes, options));
      }
      if (error) throw error;
      return prefix + key;
    } finally {
      await fs.unlink(file.path).catch(() => {});
    }
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
  signedPhoto,
};
