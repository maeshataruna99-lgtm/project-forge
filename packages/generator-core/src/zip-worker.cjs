const { parentPort } = require('node:worker_threads');
const { zipSync } = require('fflate');
const archiveMtime = new Date('1980-01-01T00:00:00.000Z');

parentPort.once('message', files => {
  try {
    const archive = zipSync(files, { level: 6, mtime: archiveMtime });
    parentPort.postMessage({ archive }, [archive.buffer]);
  } catch {
    parentPort.postMessage({ error: true });
  }
});
