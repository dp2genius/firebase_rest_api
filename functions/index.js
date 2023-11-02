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
const {Storage} = require("@google-cloud/storage");
const logger = require("firebase-functions/logger");
const archiver = require('archiver');
// const cors = require("cors");
const {PassThrough} = require('stream');

// env
const ProjectId = "vehiclehubdev";
const BUCKET_NAME = "vehiclehubdev.appspot.com";

// storage/bucket
const storage = new Storage({
  projectId: ProjectId,
});

const bucket = storage.bucket(BUCKET_NAME);

/**
 * @method GET
 * @desc Zip file download endpoint
 */
exports.download = onRequest(async (request, response) => {
  let files = request.query.files;
  const destFilename = `Download-${Date.now()}-${Math.floor(Math.random() * 1E5)}.zip`;

  // parse `files`
  try {
    files = JSON.parse(files);
  } catch(err) {
    return response.status(400).end("missing files param");
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
    zlib: { level: 9 } // Sets the compression level.
  });

  archive.pipe(uploadStream);

  await Promise.all(files.map(async (filename) => {
    const file = bucket.file(filename);

    // Filter files that are not exists.
    const exists = await file.exists().then(res => res[0]);

    if (exists) {
      archive.append(file.createReadStream(), { name: filename });
    } else {
      logger.error(`Requested file ${filename} does not exists.`);
    }
  }));

  archive.finalize();

  // End archiving (piping streams, not real writing)
  // Start downloading

  writeStream.on("finish", () => {

    response.setHeader("Content-Disposition", `attachment; filename*=utf-8''${encodeURIComponent(destFilename)}`);
    const readStream = zipFile.createReadStream();

    readStream.on("error", (err) => {
      logger.error("Error happend while reading.");
      response.status(500).end();
    });

    readStream.pipe(response);
  });

  writeStream.on("error", (err) => {
    logger.error("Error happened while writing.");
    response.status(500).end();
  });

});
