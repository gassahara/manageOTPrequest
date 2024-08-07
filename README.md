# OTP Management Endpoint

## Overview

This project provides an HTTP endpoint for managing One-Time Passwords (OTPs) using Google Cloud Storage. It includes functionalities for generating, encrypting, and validating OTPs.

## Prerequisites

- Node.js (v12 or later)
- Google Cloud account with Storage enabled
- Google Cloud SDK installed and configured

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Google Cloud Storage:
   - Ensure you have a Google Cloud account and a project set up.
   - Create a Google Cloud Storage bucket and note its name.
   - Update the `bucketName` variable in the code with your bucket name.
   - Authenticate your Google Cloud SDK by running:
     ```bash
     gcloud auth application-default login
     ```

## Usage

The endpoint handles both GET and POST requests for OTP management.

### Endpoints

#### GET /

To request a new OTP, send a GET request to the endpoint.

**Example:**
```bash
curl -L "https://europe-west1-panal-429505.cloudfunctions.net/manageOTPRequest"
```

**Response:**
```javascript
var iv_OTP="33b1494836feb0e39a278f91a65d3d05"; var OTP_resource="f9ec5641b38bb48a792b09aa33cd95dbca301ff8df6be8ff8f5f88e3dce0fed212c9fd170842696d5f6d3c058142d0ae6cca7ea37733b6a29d51dc8c6f572072"; var OTP="d2cd0f4db1e470c0b5e47f41a634e334"; var init_OTProcessed=255;error="Success"
```

This response provides:
- `iv_OTP`: The initialization vector
- `OTP_resource`: A unique resource identifier
- `OTP`: The One-Time Password
- `init_OTProcessed`: A processing flag
- `error`: Status of the request

#### POST /

To validate an existing OTP, send a POST request with the following parameters in the request body:

- `iv_OTP`: The initialization vector
- `OTP_resource`: The resource ID
- `OTP`: The OTP value
- `texto2`: Additional data to be stored (optional)

**Example:**
```bash
curl -X POST "https://europe-west1-panal-429505.cloudfunctions.net/manageOTPRequest" \
     -d "iv_OTP=33b1494836feb0e39a278f91a65d3d05&OTP_resource=f9ec5641b38bb48a792b09aa33cd95dbca301ff8df6be8ff8f5f88e3dce0fed212c9fd170842696d5f6d3c058142d0ae6cca7ea37733b6a29d51dc8c6f572072&OTP=d2cd0f4db1e470c0b5e47f41a634e334"
```

**Response (Success):**
```javascript
var error="Success";var filename="<new_filename>"
```

**Response (Failure):**
```javascript
var error="Could not decrypt <additional_info>";
```

## Error Handling

- If an internal server error occurs, the endpoint will respond with a 500 status code and a JSON object containing an error message.
- If an unsupported HTTP method is used, the endpoint will respond with a 405 status code.

## Security Considerations

- Ensure that your Google Cloud credentials are kept secure and not exposed in your code.
- Use HTTPS in production to encrypt data in transit.
- Regularly rotate your encryption keys and OTPs.
- Implement rate limiting to prevent abuse of the endpoint.
- Be cautious about exposing sensitive information in GET requests, as they may be logged or cached.

## Contributing

Please submit issues and pull requests for any bugs or improvements you'd like to suggest.

## License

[Specify your license here]

