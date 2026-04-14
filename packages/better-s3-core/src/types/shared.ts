export type PresignResponse = {
  key: string;
  bucket: string;
  url: string;
  expiresIn: number;
};

export type MultipartInitResponse = {
  key: string;
  bucket: string;
  uploadId: string;
};

export type MultipartPartResponse = {
  presignedUrl: string;
  partNumber: number;
  uploadId: string;
  bucket: string;
  expiresIn: number;
};
