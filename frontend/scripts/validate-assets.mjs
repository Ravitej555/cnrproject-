import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { transformedPositionBounds } from '../src/anatomy/gltfBounds.js';

const root=path.resolve(import.meta.dirname,'..');
const files={skin:'public/models/anatomy-skin.glb',organs:'public/models/anatomy-organs.glb',skeleton:'public/models/overview-skeleton.glb'};
function glb(relative){const file=path.join(root,relative);assert.ok(fs.existsSync(file),`missing ${relative}`);const bytes=fs.readFileSync(file);assert.equal(bytes.toString('ascii',0,4),'glTF',`${relative} is not GLB`);const jsonLength=bytes.readUInt32LE(12);assert.equal(bytes.toString('ascii',16,20),'JSON');return JSON.parse(bytes.subarray(20,20+jsonLength).toString().replace(/\0+$/,''));}
function positionBounds(json,node){return transformedPositionBounds(json,json.nodes.indexOf(node));}
function close(actual,expected,tolerance,label){assert.ok(Math.abs(actual-expected)<=tolerance,`${label}: ${actual} not within ${tolerance} of ${expected}`);}

const skin=glb(files.skin),organs=glb(files.organs),skeleton=glb(files.skeleton);
for(const legal of ['public/THIRD_PARTY_NOTICES.md','public/licenses/CC-BY-SA-4.0.txt','public/licenses/CC-BY-SA-2.1-JP.txt','public/licenses/CC-BY-SA-2.1-JP-legalcode.html','public/licenses/THREE-MIT.txt','public/licenses/DRACO-APACHE-2.0.txt'])assert.ok(fs.existsSync(path.join(root,legal)),`missing deployment notice ${legal}`);
const skinNode=skin.nodes.find(n=>n.name==='skin__FMA7163');assert.ok(skinNode,'semantic skin node missing');
const sb=positionBounds(skin,skinNode),expected={min:[-1.33905,-3.534865,-.187946],max:[1.33396,3.183290,.971386]};
for(let i=0;i<3;i++){close(sb.min[i],expected.min[i],.001,`skin min axis ${i}`);close(sb.max[i],expected.max[i],.001,`skin max axis ${i}`);} close(sb.max[1]-sb.min[1],6.7181547,.001,'skin height');
const required=['stomach','liver','kidneys','lungs','heart','intestines','brain'];for(const id of required)assert.ok(organs.nodes.some(n=>n.name?.startsWith(`${id}__FMA`)),`semantic ${id} node missing`);
const heartNode=organs.nodes.find(n=>n.name==='heart__FMA7274');const hb=positionBounds(organs,heartNode);const heartExpected={min:[-.14748,1.32703,.27221],max:[.32138,1.75458,.71691]};for(let i=0;i<3;i++){close(hb.min[i],heartExpected.min[i],.001,`heart min axis ${i}`);close(hb.max[i],heartExpected.max[i],.001,`heart max axis ${i}`);assert.ok(hb.min[i]>=expected.min[i]-.001&&hb.max[i]<=expected.max[i]+.001,`heart axis ${i} escapes skin bounds`);}
assert.ok(skeleton.nodes.length>=140,'unexpectedly small skeleton node set');const names=skeleton.nodes.map(n=>n.name||'');const right=names.filter(n=>/\.r\.?$/i.test(n));assert.ok(right.length>=40,'right-side source laterality convention changed');assert.equal(names.filter(n=>/\.l$/i.test(n)).length,0,'source unexpectedly contains generated left-side suffixes');
console.log(`Asset validation passed: skin ${sb.min.join(',')} → ${sb.max.join(',')}; heart ${hb.min.join(',')} → ${hb.max.join(',')}; skeleton ${skeleton.nodes.length} nodes, ${right.length} mirrored-right candidates.`);
