import cloudinary from '../config/cloudinary.js';

export const uploadCustomDesign = async (req, res) => {
  try {
    const { imageData } = req.body || {};

    if (!imageData) {
      return res.status(400).json({ error: 'imageData (data URL or base64) is required' });
    }

    const result = await cloudinary.uploader.upload(imageData, {
      folder: 'shophub/custom-designs',
      resource_type: 'image',
    });

    return res.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return res.status(500).json({ error: 'Failed to upload custom design' });
  }
};

