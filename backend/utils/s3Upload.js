const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require("../config/awsConfig");
const { v4: uuidv4 } = require("uuid");

const uploadToS3 = async (file) => {
  const fileExtension = file.originalname.split(".").pop();
  const key = `issues/${uuidv4()}.${fileExtension}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3Client.send(new PutObjectCommand(params));
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

module.exports = uploadToS3;