# Third-party notices

These notices travel with the deployed application. ShareAlike requirements apply to the identified asset derivatives; they do not relicense unrelated application code.

## Open3Dmodel skeleton

- Local file: `models/overview-skeleton.glb`
- Work/source: Open3Dmodel Create, Open Anatomy lineage — https://anatomytool.org/open3dmodel-create
- Copyright/attribution: Open3Dmodel contributors / Open Anatomy lineage, as identified by the source project.
- License: Creative Commons Attribution-ShareAlike 4.0 International — https://creativecommons.org/licenses/by-sa/4.0/legalcode
- Deployed license: `licenses/CC-BY-SA-4.0.txt`
- Derivative changes: Draco geometry optimization and level-of-detail preparation; coordinate registration, scale and placement for this atlas; runtime material/group adaptations; and runtime generation of left-side paired bones by mirroring source nodes marked as right-side.
- Obligation: redistributions of this asset or its adaptations must preserve attribution and license notices and distribute adaptations under CC BY-SA 4.0, subject to the official legalcode.

## BodyParts3D skin and organs

- Local files: `models/anatomy-skin.glb`, `models/anatomy-organs.glb`
- Work/source: BodyParts3D version 3.0; mirror — https://github.com/Kevin-Mattheus-Moerman/BodyParts3D; original archive — https://doi.org/10.18908/lsdba.nbdc00837-000
- Copyright/attribution: BodyParts3D, © The Database Center for Life Science.
- License: Creative Commons Attribution-ShareAlike 2.1 Japan — https://creativecommons.org/licenses/by-sa/2.1/jp/legalcode
- Deployed license notice and official-page copy: `licenses/CC-BY-SA-2.1-JP.txt`, `licenses/CC-BY-SA-2.1-JP-legalcode.html`
- Derivative changes: Draco geometry optimization and level-of-detail preparation; coordinate registration with the skeleton and procedural layers; semantic FMA node grouping; and runtime material, transparency, interaction, and physiological-motion adaptations.
- Obligation: redistributions of these assets or their adaptations must preserve attribution and license notices and distribute adaptations under the same license, subject to the official Japanese legalcode.

## Three.js

- Local/runtime use: bundled Three.js library and loaders.
- Copyright: © 2010-2025 three.js authors.
- Source: https://github.com/mrdoob/three.js
- License: MIT; deployed text: `licenses/THREE-MIT.txt`.

## Draco decoder

- Local files: `draco/draco_decoder.js`, `draco/draco_decoder.wasm`, `draco/draco_wasm_wrapper.js`
- Copyright: Copyright 2016 The Draco Authors.
- Source: https://github.com/google/draco
- License: Apache License 2.0; deployed notice and official text URI: `licenses/DRACO-APACHE-2.0.txt`.
