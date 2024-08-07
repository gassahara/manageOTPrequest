"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.manageOTPRequest = void 0;
const storage_1 = require("@google-cloud/storage");
const crypto = __importStar(require("crypto"));
const querystring_1 = require("querystring");
const storage = new storage_1.Storage();
const bucketName = 'fs0';
function random_number() {
    const bytes = crypto.randomBytes(1);
    const number = bytes[0] % 20 + 1;
    return number;
}
function getLastModified(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const [metadata] = yield storage.bucket(bucketName).file(filePath).getMetadata();
        const modifiedTime = new Date(metadata.updated || Date.now()).getTime();
        const currentTime = Date.now();
        const timeDifference = currentTime - modifiedTime;
        return { modified_timestamp: modifiedTime, time_difference: timeDifference };
    });
}
function getRandomString(length) {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
}
function encrypt(plaintext, iv_OTP, password) {
    const method = 'aes-256-cbc';
    const key = crypto.createHash('sha256').update(password).digest();
    const iv = Buffer.from(iv_OTP, 'hex');
    console.log({ iv });
    if (iv.length !== 16) {
        throw new Error('IV must be 16 bytes long');
    }
    const cipher = crypto.createCipheriv(method, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const hash = crypto.createHmac('sha256', key).update(encrypted + iv_OTP).digest('hex');
    return { hash, cipher: encrypted };
}
function decrypt(iv_OTPREG, password, ciphertext) {
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
function checkAndCreateFolderInBucket(bucketName, folderName) {
    return __awaiter(this, void 0, void 0, function* () {
        const storage = new storage_1.Storage();
        try {
            const bucket = storage.bucket(bucketName);
            const normalizedFolderName = folderName.endsWith('/') ? folderName : `${folderName}/`;
            const [files] = yield bucket.getFiles({ prefix: normalizedFolderName, delimiter: '/' });
            if (files.length === 0) {
                // Create an empty file to represent the folder
                const file = bucket.file(`${normalizedFolderName}.keep`);
                yield file.save('');
                return { "error": `Folder ${normalizedFolderName} created successfully in bucket ${bucketName}`, "continua": true };
            }
            else {
                return { "error": `Folder ${normalizedFolderName} already exists in bucket ${bucketName}`, "continua": true };
            }
        }
        catch (err) {
            console.error('Error in checkAndCreateFolderInBucket:', err);
            return { "error": JSON.stringify(err), "continua": false };
        }
    });
}
/*
async function handleNewOTPRequest(res: ServerResponse) {
    let fnp = "";
    let password = null;
    let iv_OTPREG = null;
    let resource = "";
    let text = "";
    let filenameErrors = "";
    try {
    try {
        while (true) {
        password = getRandomString(32);
        iv_OTPREG = getRandomString(32);
        const fn = crypto.createHash('sha512').update(password + iv_OTPREG).digest('hex');
        fnp = `msgs/${fn}.js`;
        const [exists] = await storage.bucket(bucketName).file(fnp).exists();
        if (!exists) break;
        }
    } catch (error) {
        console.error('Error in handleNewOTPRequest:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ msg: "Internal Server Error (Creating File)", error }));
        return;
    }
    try {
        await storage.bucket(bucketName).file(fnp).save("");
    } catch (error) {
        console.error('Error in handleNewOTPRequest:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ msg: "Internal Server Error (Saving File)", error }));
        return;
    }
    try {
        const currentDateTime = new Date().toISOString().substring(0, 13); // 'YYYY-MM-DDTHH'
        const encryptedData = encrypt(currentDateTime, iv_OTPREG, password);
        text = Buffer.from(encryptedData.cipher, 'hex').toString('base64');
        resource = "";
        while (true) {
        let fn = getRandomString(4);
        fn = crypto.createHash('sha512').update(fn).digest('hex');
        resource = `msgs/${fn}.js`;
        const [exists] = await storage.bucket(bucketName).file(resource).exists();
        if (!exists) break;
        }
        await storage.bucket(bucketName).file(resource).save(text);
        filenameErrors = `msgs/${crypto.createHash('sha512').update(password + iv_OTPREG).digest('hex')}.js.js`;
        await storage.bucket(bucketName).file(filenameErrors).save("");
    } catch (error) {
        console.error('Error in handleNewOTPRequest:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end({ msg: "Internal Server Error (Setting Date)", error });
        return;
    }
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.end(`var filenamerrors="${filenameErrors}"; var colour_index=${random_number()}; var iv_OTPREG="${iv_OTPREG}"; var OTPREG="${password}";\nvar OTPREG_resource="${resource}";\n regprocessed=255;`);
    } catch (error) {
    console.error('Error in handleNewOTPRequest:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ msg: "Internal Server Error (handleNewOTPRequest)", error }));
    return;
    }
}
*/
function minus(mins) {
    const currentTime = Math.floor(Date.now() / 1000);
    const newTime = currentTime - (mins * 60);
    return new Date(newTime * 1000).toISOString().substring(0, 16).replace('T', ' ');
}
const manageOTPRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.method !== 'POST') {
        //        res.writeHead(405, { 'Content-Type': 'application/json' });
        //        res.end(JSON.stringify({ error: "Method Not Allowed. Please use POST method." }));
        yield handleNewOTPRequest(res);
        return;
    }
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const post = (0, querystring_1.parse)(body);
            if (!post.iv_OTP || !post.OTP_resource || !post.OTP) {
                yield handleNewOTPRequest(res);
            }
            else {
                yield handleExistingOTPRequest(res, post);
            }
        }
        catch (error) {
            console.error('Error in manageOTPRequest:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Internal Server Error" }));
        }
    }));
});
exports.manageOTPRequest = manageOTPRequest;
function handleNewOTPRequest(res) {
    return __awaiter(this, void 0, void 0, function* () {
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
                const [exists] = yield storage.bucket(bucketName).file(filename).exists();
                if (!exists)
                    break;
            }
            yield storage.bucket(bucketName).file(filename).save(ciphertext);
            res.writeHead(200, { 'Content-Type': 'text/javascript' });
            res.end(`var iv_OTP="${iv_OTP}"; var OTP_resource="${OTP_resource}"; var OTP="${OTP}"; var init_OTProcessed=255;error="Success"\n`);
        }
        catch (error) {
            console.error('Error in handleNewOTPRequest:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Internal Server Error" }));
        }
    });
}
function handleExistingOTPRequest(res, post) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const filename = `msgs/${post.OTP_resource}.js`;
            const [ciphertext] = yield storage.bucket(bucketName).file(filename).download();
            const fecha2 = new Date().toISOString().substring(0, 16).replace('T', ' ');
            const fecha1 = decrypt(post.iv_OTP, post.OTP, ciphertext.toString());
            yield storage.bucket(bucketName).file(filename).delete();
            let mins = 0;
            while (mins < 5) {
                if (fecha1 === minus(mins))
                    break;
                mins++;
            }
            if (mins < 5) {
                const newFilename = getRandomString(128);
                yield storage.bucket(bucketName).file(`msgs/${newFilename}.js`).save(post.texto2);
                res.writeHead(200, { 'Content-Type': 'text/javascript' });
                res.end(`var error="Success";var filename="${newFilename}"`);
            }
            else {
                res.writeHead(200, { 'Content-Type': 'text/javascript' });
                res.end(`var error="Could not decrypt ${mins} ${fecha1} ${fecha2}";`);
            }
        }
        catch (error) {
            console.error('Error in handleExistingOTPRequest:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Internal Server Error" }));
        }
    });
}
