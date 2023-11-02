/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

const {onRequest} = require("firebase-functions/v2/https");
const {PassThrough} = require("stream");
const {Storage} = require("@google-cloud/storage");

const archiver = require("archiver");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

const config = require("./config/config");
const serviceAccount = require("./config/vehiclehubdev-firebase-adminsdk.json");

const ProjectId = config.ProjectId;
const BUCKET_NAME = config.BUCKET_NAME;

// storage/bucket
const storage = new Storage({
  projectId: ProjectId,
  keyFilename: "./config/vehiclehubdev-firebase-adminsdk.json",
});

const bucket = storage.bucket(BUCKET_NAME);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/**
 * @method GET
 * @desc Zip file download endpoint
 */
exports.download = onRequest(async (request, response) => {
  /** response data */
  const res = {
    success: false,
    signedUrl: null,
    errors: [],
  };
  let files = request.query.files;
  const destFilename = `Download-${Date.now()}-${Math.floor(Math.random() * 1E5)}.zip`;

  // parse `files`
  try {
    files = JSON.parse(files);
  } catch (err) {
    res.success = false;
    res.errors.push("missing files param");
    return response.status(400).json(res);
  }

  // ReadStreams => Archiver => PassThrough(uploadstream) => WriteStream(zipFile)

  // Where the zip file will be uploaded in firebase storage
  /** Destination zip file */
  const zipFile = bucket.file(destFilename);
  const writeStream = zipFile.createWriteStream();

  // Use passthrough stream as a middleman between archiver and cloud storage
  const uploadStream = new PassThrough();

  // Pipe the archive data to the file
  uploadStream.pipe(writeStream);

  // Initialize the archiver
  const archive = archiver("zip", {
    zlib: {level: 9}, // Sets the compression level.
  });

  archive.pipe(uploadStream);

  await Promise.all(files.map(async (filename) => {
    const file = bucket.file(filename);

    // Filter files that are not exists.
    const exists = await file.exists().then((res) => res[0]);

    if (exists) {
      archive.append(file.createReadStream(), {name: filename});
    } else {
      logger.error(`Requested file ${filename} does not exists.`);

      res.errors.push(`Requested file ${filename} does not exists.`);
    }
  }));

  archive.finalize();

  // End archiving (piping streams, not real writing)
  // Start downloading

  writeStream.on("finish", () => {
    // Return url to download

    const config = {
      action: "read",
      expires: Date.now() + 1000 * 60 * 60, // 1 hour available
    };

    zipFile.getSignedUrl(config, (err, url) => {
      if (err) {
        logger.error(err);

        res.success = false;
        res.errors.push("Cannot get signed url of zip file");
        response.status(500).json(res);
      } else {
        res.success = true;
        res.signedUrl = url;
        response.status(200).json(res);
      }
    });
  });

  writeStream.on("error", () => {
    logger.error("Error happened while writing.");

    res.success = false;
    res.errors.push("Error happened while writing.");
    response.status(500).json(res);
  });
});
