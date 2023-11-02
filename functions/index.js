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

const ProjectId = "vehiclehubdev";
const BUCKET_NAME = "vehiclehubdev.appspot.com";

const storage = new Storage({
  projectId: ProjectId,
});

// dev
const bucket = storage.bucket(BUCKET_NAME);
console.log(bucket.getFiles().then(console.log));


exports.helloWorld = onRequest(async (request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  console.log(request.body, request.query);

  const files = ["avatar.jpg", "folder1/avatar.png"];
  // const files = ["avatar.png"];
  const destFilename = "my_archive.zip";

  //

  const bucket = storage.bucket(BUCKET_NAME);

  // Where the zip file will be uploaded in firebase storage
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

  files.forEach((filename) => {
    const file = bucket.file(filename);
    archive.append(file.createReadStream(), { name: filename });
  });

  archive.finalize();

  writeStream.on("finish", () => {
    // Start downloading

    response.setHeader("Content-Disposition", `attachment; filename*=utf-8''${encodeURIComponent(fileName)}`);
    const readStream = file.createReadStream();

    readStream.on("error", (err) => {
      console.error(err);
      response.status(500).end();
    });

    readStream.pipe(response);
  });

});

// exports.downloadZip = onRequest((request, response) => {
//   const bucket = storage.bucket(BUCKET_NAME);

//   const fileName = 'my_archive.zip';
//   const file = bucket.file(fileName);
// });