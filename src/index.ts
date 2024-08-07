import { Storage } from '@google-cloud/storage';
import * as crypto from 'crypto';
import { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'querystring';

interface FileContent {
    file_content: string;
}

interface ErrorResponse {
    error: string,
    continua: boolean
}


const storage = new Storage();
const bucketName = 'fs0';

function random_number(): number {
  const bytes = crypto.randomBytes(1);
  const number = bytes[0] % 20 + 1;
  return number;
}

async function getLastModified(filePath: string) {
  const [metadata] = await storage.bucket(bucketName).file(filePath).getMetadata();
  const modifiedTime = new Date(metadata.updated || Date.now()).getTime();
  const currentTime = Date.now();
  const timeDifference = currentTime - modifiedTime;
  return { modified_timestamp: modifiedTime, time_difference: timeDifference };
}

function getRandomString(length: number): string {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
}

function encrypt(plaintext: string, iv_OTP: string, password: string) {
  const method = 'aes-256-cbc';
  const key = crypto.createHash('sha256').update(password).digest();
    const iv = Buffer.from(iv_OTP, 'hex');
    console.log({iv});
  if (iv.length !== 16) {
    throw new Error('IV must be 16 bytes long');
  }

  const cipher = crypto.createCipheriv(method, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const hash = crypto.createHmac('sha256', key).update(encrypted + iv_OTP).digest('hex');
  return { hash, cipher: encrypted };
}

function decrypt(iv_OTPREG: string, password: string, ciphertext: string) {
  const method = 'aes-256-cbc';
  const key = crypto.createHash('sha256').update(password).digest();
  const iv = Buffer.from(iv_OTPREG, 'hex');
  
  if (iv.length !== 16) {
    throw new Error('IV must be 16 bytes long');
  }

  const decipher = crypto.createDecipheriv(method, key, iv);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function checkAndCreateFolderInBucket(bucketName: string, folderName: string): Promise<ErrorResponse> {
  const storage = new Storage();
  try {
    const bucket = storage.bucket(bucketName);
    const normalizedFolderName = folderName.endsWith('/') ? folderName : `${folderName}/`;
    const [files] = await bucket.getFiles({ prefix: normalizedFolderName, delimiter: '/' });
    if (files.length === 0) {
      const file = bucket.file(`${normalizedFolderName}.keep`);
      await file.save('');
      return {"error": `Folder ${normalizedFolderName} created successfully in bucket ${bucketName}`, "continua": true};
    } else {
      return {"error": `Folder ${normalizedFolderName} already exists in bucket ${bucketName}`, "continua": true};
    }
  } catch (err) {
    console.error('Error in checkAndCreateFolderInBucket:', err);
    return {"error": JSON.stringify(err), "continua": false};
  }
}
function minus(mins: number): string {
    const currentTime = Math.floor(Date.now() / 1000);
    const newTime = currentTime - (mins * 60);
    return new Date(newTime * 1000).toISOString().substring(0, 16).replace('T', ' ');
}

export const manageOTPRequest = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'POST') {
        await handleNewOTPRequest(res);
        return;
    }

    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const post = parse(body);
            if (!post.iv_OTP || !post.OTP_resource || !post.OTP) {
                await handleNewOTPRequest(res);
            } else {
                await handleExistingOTPRequest(res, post);
            }
        } catch (error) {
            console.error('Error in manageOTPRequest:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Internal Server Error" }));
        }
    });
};

async function handleNewOTPRequest(res: ServerResponse) {
    try {
        let OTP_resource = getRandomString(128);
        const OTP = getRandomString(32);
        const iv_OTP = getRandomString(32);

        const fecha = new Date().toISOString().substring(0, 16).replace('T', ' ');
        const ciphertext = encrypt(fecha, iv_OTP, OTP).cipher;

        let filename = "";
        while (true) {
            OTP_resource = getRandomString(128);
            filename = `msgs/${OTP_resource}.js`;
            const [exists] = await storage.bucket(bucketName).file(filename).exists();
            if (!exists) break;
        }
        await storage.bucket(bucketName).file(filename).save(ciphertext);
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.end(`var iv_OTP="${iv_OTP}"; var OTP_resource="${OTP_resource}"; var OTP="${OTP}"; var init_OTProcessed=255;error="Success"\n`);
    } catch (error) {
        console.error('Error in handleNewOTPRequest:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
}

async function handleExistingOTPRequest(res: ServerResponse, post: any) {
    try {
        const filename = `msgs/${post.OTP_resource}.js`;
        const [ciphertext] = await storage.bucket(bucketName).file(filename).download();

        const fecha2 = new Date().toISOString().substring(0, 16).replace('T', ' ');
        const fecha1 = decrypt(post.iv_OTP, post.OTP, ciphertext.toString());

        await storage.bucket(bucketName).file(filename).delete();

        let mins = 0;
        while (mins < 5) {
            if (fecha1 === minus(mins)) break;
            mins++;
        }

        if (mins < 5) {
            const newFilename = getRandomString(128);
            await storage.bucket(bucketName).file(`msgs/${newFilename}.js`).save(post.texto2);
            res.writeHead(200, { 'Content-Type': 'text/javascript' });
            res.end(`var error="Success";var filename="${newFilename}"`);
        } else {
            res.writeHead(200, { 'Content-Type': 'text/javascript' });
            res.end(`var error="Could not decrypt ${mins} ${fecha1} ${fecha2}";`);
        }
    } catch (error) {
        console.error('Error in handleExistingOTPRequest:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
}
