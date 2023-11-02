// This file is only used for development purpose
// The function just upload some files for testing

const {Storage} = require("@google-cloud/storage");

const ProjectId = "vehiclehubdev";
const BUCKET_NAME = "vehiclehubdev.appspot.com";

const storage = new Storage({
  projectId: ProjectId,
});

module.exports = () => {
  const bucket = storage.bucket(BUCKET_NAME);
  bucket.upload(
      "D:/my_avatar.png",
      {
        destination: "folder1/avatar.png",
      },
      (err, file) => {
        if (err) {
          console.error(err);
        } else {
          console.log("Success");
        }
      },
  );

  process.stdin.resume();
};
