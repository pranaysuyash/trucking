import http from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStorageService } from './src/storage-service.mjs';

const file = resolve(dirname(fileURLToPath(import.meta.url)), '../../.local/storage-server/store.json');
const service = await createStorageService({ file });
http.createServer(service).listen(5182, '127.0.0.1', () => {
  console.log('Storage server listening on http://127.0.0.1:5182');
});
