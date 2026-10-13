const fs = require('fs');
const path = require('path');

const pIndex = path.join(__dirname, '../sitio/index.html');
const pLanding = path.join(__dirname, '../sitio/landing.html');
const pUi = path.join(__dirname, '../sitio/assets/js/ui.js');
const pDiag = path.join(__dirname, '../sitio/assets/js/diagnostico.js');

// 1. Update index.html
let html1 = fs.readFileSync(pIndex, 'utf8');
html1 = html1.replace(/Empresa <small>\(opcional\)<\/small>/g, 'Empresa');
html1 = html1.replace(/Email <small>\(opcional\)<\/small>/g, 'Email');
html1 = html1.replace(/<input id="c-empresa" name="empresa" type="text" autocomplete="organization">/, '<input id="c-empresa" name="empresa" type="text" autocomplete="organization" required>');
html1 = html1.replace(/<input id="c-email" name="email" type="email" autocomplete="email">/, '<input id="c-email" name="email" type="email" autocomplete="email" required>');
html1 = html1.replace(/Cargo <small>\(opcional\)<\/small>/g, 'Cargo');
html1 = html1.replace(/<input id="c-cargo" name="cargo" type="text" autocomplete="organization-title">/, '<input id="c-cargo" name="cargo" type="text" autocomplete="organization-title" required>');
fs.writeFileSync(pIndex, html1, 'utf8');

// 2. Update landing.html
let html2 = fs.readFileSync(pLanding, 'utf8');
html2 = html2.replace(/Empresa <small>\(opcional\)<\/small>/g, 'Empresa');
html2 = html2.replace(/Email <small>\(opcional\)<\/small>/g, 'Email');
html2 = html2.replace(/<input id="l-empresa" name="empresa" type="text" autocomplete="organization">/, '<input id="l-empresa" name="empresa" type="text" autocomplete="organization" required>');
html2 = html2.replace(/<input id="l-email" name="email" type="email" autocomplete="email">/, '<input id="l-email" name="email" type="email" autocomplete="email" required>');
html2 = html2.replace(/Cargo <small>\(opcional\)<\/small>/g, 'Cargo');
html2 = html2.replace(/<input id="l-cargo" name="cargo" type="text" autocomplete="organization-title">/, '<input id="l-cargo" name="cargo" type="text" autocomplete="organization-title" required>');
fs.writeFileSync(pLanding, html2, 'utf8');

// 3. Update ui.js
let ui = fs.readFileSync(pUi, 'utf8');
ui = ui.replace(/empresa: function \(v\) \{ return true; \},/, "empresa: function (v) { return v.trim().length >= 2 || 'Ingresá tu empresa.'; },");
ui = ui.replace(/cargo: function \(v\) \{ return true; \},/, "cargo: function (v) { return v.trim().length >= 2 || 'Ingresá tu cargo.'; },");
ui = ui.replace(/email: function \(v\) \{ return !v \|\| \/\^\[\^\\s@\]\+@\[\^\\s@\]\+\\\\.\[\^\\s@\]\{2,\}\$\/.test\(v\) \|\| 'El email no parece válido.'; \},/, "email: function (v) { return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(v) || 'Ingresá un email válido.'; },");
fs.writeFileSync(pUi, ui, 'utf8');

// 4. Update diagnostico.js
let diag = fs.readFileSync(pDiag, 'utf8');
diag = diag.replace(/Email \(opcional\)/, 'Email');
diag = diag.replace(/<input name="email" type="email" autocomplete="email">/, '<input name="email" type="email" autocomplete="email" required>');
// For diagnostico.js validation: make email mandatory
diag = diag.replace(/!v \|\| \/\^\[\^\\\\s@\]\+@\[\^\\\\s@\]\+\\\\.\[\^\\\\s@\]\{2,\}\$\/.test\(v\)/, "/^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]{2,}$/.test(v)");
fs.writeFileSync(pDiag, diag, 'utf8');
