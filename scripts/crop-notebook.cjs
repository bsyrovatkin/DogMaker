// Square-crop the daughter's notebook photos for the corner backdrops:
// take a centred square (so the page is flat, no tilt) and write 4 corner-ready images.
// Source files keep their original aspect; this gives us a clean, parallel-to-screen plane.
const fs = require('fs'), path = require('path'), { PNG } = require('pngjs')
// pngjs only reads PNGs — fall back to running once via sharp-less approach using Canvas? We're in Node,
// so use a pure-JS path: read JPEG by spawning ffmpeg if available; otherwise just centre-crop with pngjs
// after re-encoding. Simpler: rely on the browser-side `object-fit:cover` to crop. So this script
// just COPIES the chosen 4 photos and renames them as bg-1..4.
const SRC = 'D:/Projects/DogMaker/public/notebook'
const DST = SRC
const picks = ['page2.jpg', 'page3.jpg', 'page4.jpg', 'page5.jpg']
picks.forEach((p, i) => { fs.copyFileSync(path.join(SRC, p), path.join(DST, 'bg-' + (i + 1) + '.jpg')); console.log('bg-' + (i + 1), '<-', p) })
console.log('done — corner backdrops are notebook/bg-1..4.jpg')
