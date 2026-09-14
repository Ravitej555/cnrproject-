import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
for(const file of ['dist/THIRD_PARTY_NOTICES.md','dist/licenses/CC-BY-SA-4.0.txt','dist/licenses/CC-BY-SA-2.1-JP.txt','dist/licenses/CC-BY-SA-2.1-JP-legalcode.html','dist/licenses/THREE-MIT.txt','dist/licenses/DRACO-APACHE-2.0.txt'])assert.ok(fs.existsSync(path.join(root,file)),`missing built legal file ${file}`);
console.log('Built deployment notices and license files verified.');
