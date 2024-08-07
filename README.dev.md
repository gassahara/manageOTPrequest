# README.dev.md

## Overview

This module provides various cryptographic and storage-related functions using the Google Cloud Storage service and the `crypto` library in Node.js. It includes functionalities for generating random numbers, encrypting and decrypting data, handling HTTP requests, and interacting with Google Cloud Storage.

## Functions

### `random_number()`

Generates a random number between 1 and 20.

**Usage:**
```typescript
const number = random_number();
console.log(number);
```

### `getLastModified(filePath: string)`

Gets the last modified timestamp of a file in Google Cloud Storage and calculates the time difference from the current time.

**Parameters:**
- `filePath`: The path of the file in the bucket.

**Usage:**
```typescript
const { modified_timestamp, time_difference } = await getLastModified('path/to/your/file');
console.log(modified_timestamp, time_difference);
```

### `getRandomString(length: number)`

Generates a random string of the specified length.

**Parameters:**
- `length`: The length of the random string.

**Usage:**
```typescript
const randomStr = getRandomString(16);
console.log(randomStr);
```

### `encrypt(plaintext: string, iv_OTP: string, password: string)`

Encrypts a plaintext using AES-256-CBC.

**Parameters:**
- `plaintext`: The text to encrypt.
- `iv_OTP`: The initialization vector (must be 16 bytes in hex format).
- `password`: The password to derive the encryption key.

**Usage:**
```typescript
const { hash, cipher } = encrypt('your plaintext', 'your iv_OTP', 'your password');
console.log(hash, cipher);
```

### `decrypt(iv_OTPREG: string, password: string, ciphertext: string)`

Decrypts a ciphertext using AES-256-CBC.

**Parameters:**
- `iv_OTPREG`: The initialization vector (must be 16 bytes in hex format).
- `password`: The password to derive the decryption key.
- `ciphertext`: The encrypted text.

**Usage:**
```typescript
const plaintext = decrypt('your iv_OTPREG', 'your password', 'your ciphertext');
console.log(plaintext);
```

### `checkAndCreateFolderInBucket(bucketName: string, folderName: string)`

Checks if a folder exists in the specified Google Cloud Storage bucket and creates it if it doesn't.

**Parameters:**
- `bucketName`: The name of the Google Cloud Storage bucket.
- `folderName`: The name of the folder to check/create.

**Returns:**
An `ErrorResponse` object with `error` and `continua` properties.

**Usage:**
```typescript
const result = await checkAndCreateFolderInBucket('your-bucket-name', 'your-folder-name');
console.log(result);
```

### `minus(mins: number)`

Calculates a timestamp in the past based on the given number of minutes.

**Parameters:**
- `mins`: The number of minutes to subtract from the current time.

**Returns:**
A string representation of the calculated timestamp.

**Usage:**
```typescript
const pastTimestamp = minus(5);
console.log(pastTimestamp);
```

## HTTP Request Handlers

### `manageOTPRequest(req: IncomingMessage, res: ServerResponse)`

The main function to handle OTP-related HTTP requests. It determines whether to handle a new OTP request or an existing OTP request based on the incoming POST data.

### `handleNewOTPRequest(res: ServerResponse)`

Handles new OTP requests by generating an OTP, encrypting it, and saving it to Google Cloud Storage.

### `handleExistingOTPRequest(res: ServerResponse, post: any)`

Handles existing OTP requests by decrypting the OTP and validating it.

## Error Handling

Most functions include error handling and logging. Errors are typically logged to the console and, in the case of HTTP handlers, sent back to the client as error responses.

## Security Considerations

- Ensure proper access controls are in place for Google Cloud Storage.
- Use HTTPS in production to encrypt data in transit.
- Regularly rotate encryption keys and OTPs.
- Implement rate limiting to prevent abuse of the endpoints.
- Be cautious about exposing sensitive information in logs or error messages.

