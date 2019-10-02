/* eslint-disable no-console */
// This script must run after 'zip -r dist/dist.zip dist'
const path = require("path");
const fs = require("fs");
const Client = require("ssh2-sftp-client");
const nodemiral = require("nodemiral");
const { USER, USER_PASSWD, ZLDLWQ_IP } = process.env;
const ZIP_NAME = "dist.zip";
const LOCAL_DIR = path.resolve(__dirname, "../dist");
const REMOTE_DIR = "/home/zldl/zldlwq-fe";

const client = new Client();
const data = fs.createReadStream(path.join(LOCAL_DIR, ZIP_NAME));
const remoteZipName = path.join(REMOTE_DIR, ZIP_NAME);
client
  .connect({
    host: ZLDLWQ_IP,
    port: 22,
    username: USER,
    password: USER_PASSWD
  })
  .then(() => {
    // remove remote dist dir
    return client.rmdir(path.join(REMOTE_DIR, "dist"), true).catch(e => e);
  })
  .then(() => {
    // delete zip
    return client.delete(remoteZipName).catch(e => e);
  })
  .then(() => {
    // upload zip
    return client.put(data, remoteZipName).catch(e => e);
  })
  .then(() => {
    // unzip
    const shellCommand = `unzip ${remoteZipName} -d ${REMOTE_DIR}`;
    nodemiral
      .session(ZLDLWQ_IP, {
        username: USER,
        password: USER_PASSWD
      })
      .execute(shellCommand, (err, code, logs) => {
        console.log(`'${shellCommand}' executed`);
        if (err) {
          console.error({ err, code, logs });
        }
      });
    return client.end();
  })
  .catch(err => {
    console.error(err.message);
  });
