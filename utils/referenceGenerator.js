import crypto from "crypto";

export const generateReference = () => {
  // Generate a timestamp
  const timestamp = Date.now().toString();

  // Generate a random string
  const randomBytes = crypto.randomBytes(8);
  const randomString = randomBytes.toString("hex");

  // Combine timestamp and random string
  return `${timestamp}-${randomString}`;
};
