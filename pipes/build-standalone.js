/* build-standalone.js — run with:  node build-standalone.js
 * Makes ONE file (pipe-reference-standalone.html) with the data and
 * logic pasted inside, so you can email it / copy it to a phone and it
 * works offline on its own. Edit the source files, then re-run this.
 */
const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
for (const file of ['pipe-data.js', 'pipe-logic.js', 'pipe-drawing.js']) {
  const code = fs.readFileSync(file, 'utf8');
  html = html.replace(`<script src="${file}"></script>`, () => `<script>\n${code}\n</script>`);
}
fs.writeFileSync('pipe-reference-standalone.html', html);
console.log('Wrote pipe-reference-standalone.html (' + Math.round(html.length / 1024) + ' kB)');
