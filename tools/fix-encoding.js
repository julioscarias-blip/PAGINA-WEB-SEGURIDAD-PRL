const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const initial = content;

  // Replace unicode replacement char + control char or mojibake
  // \uFFFD\u001c or \uFFFD\u001C or \uFFFD
  content = content.replace(/SEGURIDAD PRL\s*\uFFFD[\x00-\x1F]?\s*Inicio/g, 'SEGURIDAD PRL · Inicio');
  content = content.replace(/SEGURIDAD PRL\s*\uFFFD[\x00-\x1F]?\s*Prevenci/g, 'SEGURIDAD PRL · Prevenci');
  content = content.replace(/Laboral\s*\uFFFD[\x00-\x1F]?\s*Prevenci/g, 'Laboral · Prevenci');
  content = content.replace(/industrias\s*\uFFFD[\x00-\x1F]?\s*SEGURIDAD/g, 'industrias · SEGURIDAD');
  content = content.replace(/T\uFFFD0?CNICAS/g, 'TÉCNICAS');
  content = content.replace(/C\uFFFD[\x00-\x1F]?\s*MO TRABAJAMOS/g, 'CÓMO TRABAJAMOS');
  content = content.replace(/DIAGN\uFFFD[\x00-\x1F]?\s*STICO/g, 'DIAGNÓSTICO');
  content = content.replace(/\uFFFD\s*S([^⬝\uFFFD]+)\s*⬝/g, '“$1”');
  content = content.replace(/\uFFFD\s*S/g, '“');
  content = content.replace(/⬝/g, '”');
  content = content.replace(/Seleccion\u00E1\u2B26/g, 'Seleccioná…');
  content = content.replace(/Seleccion\u00E1[\uFFFD\u2B26]/g, 'Seleccioná…');

  // Any remaining \uFFFD
  let remaining = (content.match(/\uFFFD/g) || []).length;
  console.log(`${path.basename(filePath)}: initial \uFFFD count = ${(initial.match(/\uFFFD/g) || []).length}, remaining = ${remaining}`);

  if (content !== initial) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

fixFile(path.join(__dirname, '../sitio/index.html'));
fixFile(path.join(__dirname, '../sitio/landing.html'));
