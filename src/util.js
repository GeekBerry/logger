const fs = require('fs');
const pathLib = require('path');
const { promisify } = require('util');

// ----------------------------------------------------------------------------
function openWriteStream(path, options) {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(path, options);
    stream.once('error', reject);
    stream.once('open', () => resolve(stream));

    stream.write = promisify(stream.write);
  });
}

// ----------------------------------------------------------------------------
function makeDirectory(path) {
  const { dir } = pathLib.parse(path);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) {
    throw new Error(`dir "${dir}" is not directory`);
  }
}

function createTime(path) {
  try {
    const stat = fs.statSync(path);
    return Math.floor(stat.ctimeMs);
  } catch (e) {
    return 0;
  }
}

function renameFile(oldPath, newPath) {
  try {
    if (fs.statSync(oldPath).isFile() && !fs.existsSync(newPath)) {
      fs.renameSync(oldPath, newPath);
      return true;
    }
  } catch (e) {
    // pass
  }

  return false;
}

function unlinkFile(path) {
  try {
    if (fs.statSync(path).isFile()) {
      fs.unlinkSync(path);
      return true;
    }
  } catch (e) {
    // pass
  }

  return false;
}

// ----------------------------------------------------------------------------
module.exports = {
  makeDirectory,
  renameFile,
  unlinkFile,
  createTime,
  openWriteStream,
};
