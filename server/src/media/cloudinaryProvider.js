import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../middleware/errors.js';

export function createCloudinaryProvider(config = {}) {
  const { cloudName, apiKey, apiSecret } = config;

  const configured = Boolean(
    cloudName && apiKey && apiSecret
  );

  const credentials = {
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  };

  // Configure the Cloudinary SDK
  if (configured) {
    cloudinary.config(credentials);
  }

  return {
    configured,

    async upload(buffer, publicId) {
      if (!configured) {
        throw new AppError(
          503,
          'MEDIA_NOT_CONFIGURED',
          'Cloudinary is not configured.'
        );
      }

      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            resource_type: 'image',
            overwrite: false,
            timeout: 20000
          },
          (error, result) => {
            if (error) {
              console.error('[Cloudinary upload failed]', {
                status: error.http_code,
                code: error.code,
                name: error.name,
                message: process.env.NODE_ENV === 'development'
                  ? error.message
                  : undefined
              });

              return reject(
                new AppError(
                  502,
                  'MEDIA_UPLOAD_FAILED',
                  'Image storage is unavailable.'
                )
              );
            }

            resolve({
              url: result.secure_url,
              assetId: result.asset_id,
              width: result.width,
              height: result.height,
              bytes: result.bytes
            });
          }
        );

        stream.on('error', (error) => {
          console.error('[Cloudinary stream failed]', {
            code: error.code,
            message: process.env.NODE_ENV === 'development'
              ? error.message
              : undefined
          });

          reject(
            new AppError(
              502,
              'MEDIA_UPLOAD_FAILED',
              'Image upload failed.'
            )
          );
        });

        stream.end(buffer);
      });
    },

    async destroy(publicId) {
      if (!configured) {
        throw new AppError(
          503,
          'MEDIA_NOT_CONFIGURED',
          'Cloudinary is not configured.'
        );
      }

      const result = await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type: 'image',
          invalidate: true,
          timeout: 15000
        }
      );

      if (!['ok', 'not found'].includes(result.result)) {
        throw new AppError(
          502,
          'MEDIA_DELETE_FAILED',
          'Image cleanup failed.'
        );
      }
    }
  };
}
