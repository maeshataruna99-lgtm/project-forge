const { parentPort } = require('node:worker_threads');
const { zipSync } = require('fflate');

parentPort.once('message', files => {
  try {
    const archive = zipSync(files, { level: 6 });
    parentPort.postMessage({ archive }, [archive.buffer]);
  } catch {
    parentPort.postMessage({ error: true });
  }
});
