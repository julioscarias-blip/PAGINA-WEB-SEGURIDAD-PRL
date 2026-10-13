const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../sitio/assets/js/diagnostico.js');

const jsContent = `/* =====================================================================
   SEGURIDAD PRL · diagnostico.js  (v1.1)
   "Diagnóstico Rápido de Cumplimiento Normativo" — widget embebible.

   EMBED EN CUALQUIER SITIO (1 contenedor + 1 script):
     <div data-prl-diagnostico
          data-webhook="https://tu-n8n/webhook/seguridadprl-leads"
          data-whatsapp="5492975153035"></div>
     <script src="https://TU-DOMINIO/assets/js/diagnostico.js" defer></script>
   ===================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. MODELO DE PREGUNTAS Y PUNTAJES (editable)
     ------------------------------------------------------------------ */
  var QUESTIONS = [
    {
      id: 'rubro', title: '¿En qué rubro opera tu empresa u obra?',
      hint: 'Podés seleccionar más de una opción si aplica.',
      multiple: true,
      options: [
        { label: 'Petróleo y gas', points: 4, tag: 'alto' },
        { label: 'Minería', points: 4, tag: 'alto' },
        { label: 'Construcción / Obra civil', points: 4, tag: 'obra' },
        { label: 'Actividad marítima / portuaria', points: 4, tag: 'alto' },
        { label: 'Industria / Manufactura', points: 2 },
        { label: 'Logística y transporte', points: 2 },
        { label: 'Comercio / Servicios / Hotelería', points: 1, tag: 'comercio' },
        { label: 'Otro', points: 2 }
      ]
    },
    {
      id: 'dotacion', title: '¿Cuántas personas trabajan (propias + contratistas)?',
      hint: 'Seleccioná la escala aproximada total.',
      multiple: false,
      options: [
        { label: '1 a 15 personas', points: 1 },
        { label: '16 a 50 personas', points: 2 },
        { label: '51 a 150 personas', points: 3, tag: 'grande' },
        { label: 'Más de 150 personas', points: 4, tag: 'grande' }
      ]
    },
    {
      id: 'antecedentes', title: 'En los últimos 12 meses, ¿tuviste inspecciones o incidentes?',
      hint: 'Podés seleccionar varias si ocurrieron distintos eventos.',
      multiple: true,
      options: [
        { label: 'Sin inspecciones con observaciones ni accidentes', points: 0 },
        { label: 'Inspección con observaciones menores', points: 2, tag: 'obs' },
        { label: 'Intimación de ART/autoridad o accidente con días de baja', points: 4, tag: 'intimacion' },
        { label: 'Multa, clausura, paralización o accidente grave', points: 6, tag: 'grave' }
      ]
    },
    {
      id: 'programa', title: '¿Cómo está tu documentación de seguridad?',
      hint: 'Marcá todas las opciones que reflejen tu estado actual.',
      multiple: true,
      options: [
        { label: 'Programa vigente, matriz de riesgos, ATS y procedimientos al día', points: 0 },
        { label: 'Tenemos documentación pero está desactualizada', points: 3, tag: 'doc' },
        { label: 'Solo registros parciales (entrega de EPP, algunas capacitaciones)', points: 5, tag: 'doc' },
        { label: 'No tenemos programa de seguridad ni matriz de riesgos', points: 7, tag: 'sindoc' }
      ]
    },
    {
      id: 'gestion', title: '¿Cómo se gestiona la prevención en el día a día?',
      hint: 'Seleccioná las que mejor describan tu operación.',
      multiple: true,
      options: [
        { label: 'Profesional de HyS con visitas regulares, plan de capacitación y simulacros', points: 0 },
        { label: 'Visitas ocasionales y capacitaciones esporádicas, sin simulacros', points: 3, tag: 'cap' },
        { label: 'Sin profesional asignado, sin registros de capacitación ni plan de emergencia', points: 5, tag: 'sinhys' }
      ]
    }
  ];
  var MAX = 26; // El máximo teórico sumando los máximos de cada pregunta

  var LEVELS = {
    bajo: {
      label: 'Riesgo Bajo', color: '#1fb36b',
      title: 'Base sólida: el desafío es sostenerla',
      text: 'Tu operación muestra una gestión preventiva ordenada. Recomendamos una auditoría externa periódica para verificar el cumplimiento legal, detectar desvíos a tiempo y llegar preparado a inspecciones o auditorías de clientes.'
    },
    medio: {
      label: 'Riesgo Medio', color: '#f2a516',
      title: 'Hay brechas que conviene cerrar antes de una inspección',
      text: 'Existen desvíos documentales u operativos que pueden derivar en observaciones, intimaciones o demoras con comitentes y ART. Priorizá actualizar la documentación y formalizar el seguimiento en campo en las próximas semanas.'
    },
    critico: {
      label: 'Riesgo Crítico', color: '#e5484d',
      title: 'Exposición alta a sanciones y paradas operativas',
      text: 'La combinación de actividad, antecedentes y faltantes documentales configura un escenario de alta exposición: multas, paralización de tareas y, sobre todo, riesgo para las personas. Recomendamos un relevamiento en sitio y un plan de acción inmediato.'
    }
  };

  /* ------------------------------------------------------------------
     2. MOTOR DE CÁLCULO
     ------------------------------------------------------------------ */
  function evaluate(answers) {
    var sum = 0, tags = {};
    QUESTIONS.forEach(function (q) {
      var ans = answers[q.id] || [];
      var maxPts = 0;
      ans.forEach(function(idx) {
        var o = q.options[idx];
        if (o.points > maxPts) maxPts = o.points; // Tomar el mayor riesgo seleccionado en la misma pregunta
        if (o.tag) tags[o.tag] = true;
      });
      sum += maxPts;
    });
    var score = Math.round(sum / MAX * 100);
    if (score > 100) score = 100;
    var level = score >= 60 ? 'critico' : score >= 35 ? 'medio' : 'bajo';

    // Reglas de ajuste
    var highRisk = tags.alto || tags.obra;
    if (tags.grave && level === 'bajo') level = 'medio';
    if (tags.grave && (tags.sindoc || tags.doc)) level = 'critico';
    if (tags.sindoc && highRisk) level = 'critico';
    if (tags.intimacion && level === 'bajo') level = 'medio';

    // Servicios
    var s = [];
    var add = function (x) { if (s.indexOf(x) < 0) s.push(x); };
    if (tags.sindoc || tags.doc) { add('Programas de Seguridad'); add('Matriz de Evaluación de Riesgos'); }
    if (tags.obra || (highRisk && (tags.sindoc || tags.doc))) add('Análisis de Trabajo Seguro (ATS)');
    if (tags.grave || tags.intimacion) { add('Investigación de Accidentes'); add('Auditorías Externas'); }
    if (tags.sinhys || (tags.grande && tags.cap)) add('Servicio de Asistencia Externa a Obras e Industrias');
    if (tags.cap || tags.sinhys) { add('Capacitaciones in Company y Virtual'); add('Planes de Emergencia, Evacuación y Simulacros'); }
    if (tags.comercio) add('Informe de Seguridad para Habilitación Municipal');
    if (highRisk && tags.doc) add('Procedimientos de Seguridad Basados en Riesgos');
    if (tags.grande && level !== 'critico') add('Estadística Mensual de Accidentes');
    if (level === 'bajo') { add('Auditorías Externas'); add('Implementación de Sistemas de Gestión en HyS'); }

    return { score: score, level: level, services: s.slice(0, 4) };
  }

  /* ------------------------------------------------------------------
     3. ESTILOS
     ------------------------------------------------------------------ */
  var CSS = '' +
    '.prld{--a:#006eff;--t:#14d4c9;--k:#1b232a;--c:#37434c;--m:#5d6b76;--l:#dde4ea;font-family:Montserrat,system-ui,sans-serif;color:var(--k);background:#fff;border-radius:20px;box-shadow:0 24px 60px -24px rgba(27,35,42,.35);border:1px solid var(--l);overflow:hidden;position:relative;line-height:1.55}' +
    '.prld *{box-sizing:border-box}.prld__bar{height:5px;background:#eef2f5}.prld__bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--a),var(--t));transition:width .5s cubic-bezier(.2,.7,.2,1)}' +
    '.prld__body{padding:clamp(1.4rem,1rem + 2vw,2.4rem)}.prld__meta{display:flex;justify-content:space-between;align-items:center;font-size:.75rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--a);margin-bottom:1rem}' +
    '.prld h3{font-family:Oswald,"Arial Narrow",sans-serif;text-transform:uppercase;font-weight:500;font-size:clamp(1.35rem,1.1rem + 1vw,1.8rem);line-height:1.15;margin:0 0 .4rem;color:var(--k)}' +
    '.prld__hint{color:var(--m);font-size:.88rem;margin:0 0 1.4rem}.prld__opts{display:grid;gap:.6rem}@media(min-width:620px){.prld__opts--2{grid-template-columns:1fr 1fr}}' +
    '.prld__opt{display:flex;align-items:center;gap:.8rem;width:100%;text-align:left;padding:.9rem 1rem;border:1.5px solid var(--l);border-radius:10px;background:#fff;cursor:pointer;font:inherit;font-size:.92rem;font-weight:500;color:var(--k);transition:border-color .2s,background .2s,transform .2s}' +
    '.prld__opt:hover{border-color:var(--a);transform:translateX(3px)}.prld__opt:focus-visible{outline:3px solid var(--t);outline-offset:2px}' +
    '.prld__opt[aria-pressed=true]{border-color:var(--a);background:rgba(0,110,255,.06)}.prld__radio{width:20px;height:20px;border-radius:50%;border:2px solid #b9c6d0;flex:none;display:grid;place-items:center}' +
    '.prld__radio--chk{border-radius:4px;}' +
    '.prld__opt[aria-pressed=true] .prld__radio{border-color:var(--a)}.prld__opt[aria-pressed=true] .prld__radio::after{content:"";width:10px;height:10px;border-radius:50%;background:var(--a)}' +
    '.prld__opt[aria-pressed=true] .prld__radio--chk::after{border-radius:2px;}' +
    '.prld__nav{display:flex;justify-content:space-between;align-items:center;margin-top:1.6rem;gap:1rem}' +
    '.prld__btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;min-height:48px;padding:.75rem 1.4rem;border-radius:6px;border:2px solid transparent;background:var(--a);color:#fff;font:inherit;font-weight:700;font-size:.9rem;cursor:pointer;text-decoration:none;transition:transform .2s,background .2s}' +
    '.prld__btn:hover{transform:translateY(-2px);background:#0057cc}.prld__btn--ghost{background:transparent;color:var(--c);border-color:var(--l)}.prld__btn--ghost:hover{background:transparent;border-color:var(--a);color:var(--a)}' +
    '.prld__btn--wa{background:#25d366;color:#0b3d20}.prld__btn--wa:hover{background:#1ebe5b}.prld__btn[aria-busy=true]{opacity:.7;pointer-events:none}.prld__btn:disabled{opacity:.45;pointer-events:none}' +
    '.prld__intro ul{list-style:none;padding:0;margin:1.2rem 0 1.6rem;display:grid;gap:.55rem}.prld__intro li{display:flex;gap:.6rem;font-size:.9rem}.prld__intro li::before{content:"";width:18px;height:18px;flex:none;margin-top:.15rem;border-radius:50%;background:rgba(20,212,201,.18) url("data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%230fa89f\\' stroke-width=\\'3\\'%3E%3Cpath d=\\'m5 12 5 5 9-10\\'/%3E%3C/svg%3E") center/12px no-repeat}' +
    '.prld__res{display:grid;gap:1.6rem}@media(min-width:620px){.prld__res-top{display:grid;grid-template-columns:auto 1fr;gap:1.6rem;align-items:center}}' +
    '.prld__light{display:flex;flex-direction:column;gap:.55rem;padding:.8rem;background:#1b232a;border-radius:40px;width:68px;margin-inline:auto;box-shadow:inset 0 0 0 3px #2c3841}' +
    '.prld__lamp{width:52px;height:52px;border-radius:50%;background:#2c3841;transition:background .4s,box-shadow .4s}' +
    '.prld__lamp.on[data-l=critico]{background:#e5484d;box-shadow:0 0 24px #e5484d}.prld__lamp.on[data-l=medio]{background:#f2a516;box-shadow:0 0 24px #f2a516}.prld__lamp.on[data-l=bajo]{background:#1fb36b;box-shadow:0 0 24px #1fb36b}' +
    '.prld__badge{display:inline-block;padding:.35rem .8rem;border-radius:100px;color:#fff;font-size:.78rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:.6rem}' +
    '.prld__score{display:flex;align-items:baseline;gap:.4rem;font-family:Oswald,sans-serif;margin:.2rem 0 .6rem}.prld__score b{font-size:2.6rem;line-height:1}.prld__score span{color:var(--m);font-size:.9rem;font-family:Montserrat,sans-serif}' +
    '.prld__gauge{height:10px;border-radius:10px;background:linear-gradient(90deg,#1fb36b 0 35%,#f2a516 35% 60%,#e5484d 60%);position:relative;margin:.4rem 0 .3rem}.prld__gauge i{position:absolute;top:50%;width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid var(--k);transform:translate(-50%,-50%);transition:left 1s cubic-bezier(.2,.7,.2,1)}' +
    '.prld__box{padding:1.1rem 1.2rem;border-radius:12px;background:#f3f6f8;border:1px solid var(--l)}.prld__box h4{margin:0 0 .6rem;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:var(--a)}' +
    '.prld__box ol{margin:0;padding-left:1.2rem;display:grid;gap:.35rem;font-size:.9rem;font-weight:600}.prld__box p{margin:0;font-size:.9rem;color:var(--c)}' +
    '.prld__form{display:grid;gap:.8rem;padding:1.3rem;border-radius:12px;border:1.5px dashed #b9c6d0}.prld__form h4{margin:0;font-family:Oswald,sans-serif;font-weight:500;text-transform:uppercase;font-size:1.15rem}.prld__form>p{margin:0;font-size:.86rem;color:var(--m)}' +
    '.prld__row{display:grid;gap:.8rem}@media(min-width:620px){.prld__row{grid-template-columns:1fr 1fr}}' +
    '.prld__f{display:grid;gap:.3rem;font-size:.82rem;font-weight:600}.prld__f input{min-height:46px;padding:.65rem .85rem;border:1.5px solid var(--l);border-radius:6px;font:inherit;font-weight:500;font-size:.92rem;width:100%}.prld__f input:focus{outline:none;border-color:var(--a);box-shadow:0 0 0 4px rgba(0,110,255,.14)}' +
    '.prld__f.err input{border-color:#e5484d}.prld__chk{display:flex;gap:.55rem;font-size:.78rem;color:var(--m);align-items:flex-start}.prld__chk input{margin-top:.2rem;accent-color:var(--a)}' +
    '.prld__msg{font-size:.86rem;font-weight:600;padding:.8rem 1rem;border-radius:6px}.prld__msg--ok{background:rgba(31,179,107,.1);color:#12784a}.prld__msg--err{background:rgba(229,72,77,.08);color:#b4272c}' +
    '.prld__legal{font-size:.72rem;color:var(--m);margin:0}.prld__hp{position:absolute;left:-9999px;opacity:0}' +
    '.prld__step{animation:prldIn .45s cubic-bezier(.2,.7,.2,1)}@keyframes prldIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}' +
    '@media(prefers-reduced-motion:reduce){.prld *{animation:none!important;transition:none!important}}';

  function injectCss() {
    if (document.getElementById('prld-css')) return;
    var st = document.createElement('style'); st.id = 'prld-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ------------------------------------------------------------------
     4. ENVÍO
     ------------------------------------------------------------------ */
  function sender(opts) {
    var P = window.PRL && window.PRL.lead;
    if (P) return { build: P.buildPayload, send: function (p) { return opts.webhook && window.PRL.config && !window.PRL.config.webhookUrl ? post(opts.webhook, p) : P.send(p); }, wa: P.waLink };
    return {
      build: function (o) {
        var d = new Date();
        return {
          meta: { lead_id: 'PRL-' + d.toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(), event: o.event, source: o.source, page_url: location.href, submitted_at: d.toISOString(), utm: { source: '', medium: '', campaign: '', term: '', content: '' }, user_agent: navigator.userAgent },
          contact: o.contact, message: o.message || '', diagnostic: o.diagnostic, consent: o.consent
        };
      },
      send: function (p) { return opts.webhook ? post(opts.webhook, p) : Promise.resolve({ ok: true, demo: true, lead_id: p.meta.lead_id }); },
      wa: function (t) { return 'https://wa.me/' + (opts.whatsapp || '') + '?text=' + encodeURIComponent(t || ''); }
    };
  }
  function post(url, p) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(p) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return { ok: true, lead_id: p.meta.lead_id }; });
  }

  /* ------------------------------------------------------------------
     5. COMPONENTE
     ------------------------------------------------------------------ */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function Diagnostico(root) {
    var cfg = (window.PRL && window.PRL.config) || {};
    var opts = { webhook: root.getAttribute('data-webhook') || '', whatsapp: root.getAttribute('data-whatsapp') || cfg.whatsapp || '' };
    var api = sender(opts);
    var state = { step: -1, answers: {}, result: null };

    root.classList.add('prld');
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'Diagnóstico rápido de cumplimiento normativo');
    root.innerHTML = '<div class="prld__bar" aria-hidden="true"><i></i></div><div class="prld__body" aria-live="polite"></div>';
    var body = root.querySelector('.prld__body'), bar = root.querySelector('.prld__bar i');

    function track(n, d) { if (window.PRL && window.PRL.lead) window.PRL.lead.track(n, d); }
    function focusTitle() { var h = body.querySelector('h3'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
    function scrollTop() { var r = root.getBoundingClientRect(); if (r.top < 0) window.scrollBy({ top: r.top - 100, behavior: 'smooth' }); }

    function render() {
      if (state.step === -1) return intro();
      if (state.step < QUESTIONS.length) return question(state.step);
      return result();
    }

    function intro() {
      bar.style.width = '0%';
      body.innerHTML =
        '<div class="prld__step prld__intro">' +
        '<div class="prld__meta"><span>Herramienta gratuita</span><span>⏱ 1 minuto</span></div>' +
        '<h3>Diagnóstico rápido de cumplimiento normativo</h3>' +
        '<p class="prld__hint">Respondé 5 preguntas y obtené un semáforo de riesgo operativo con recomendaciones técnicas inmediatas para tu empresa u obra.</p>' +
        '<ul><li>Basado en Ley 19.587, Dec. 351/79 y Dec. 911/96</li><li>Resultado al instante: Bajo, Medio o Crítico</li><li>Servicios prioritarios según tu situación</li></ul>' +
        '<button type="button" class="prld__btn" data-act="start">Comenzar diagnóstico →</button></div>';
    }

    function question(i) {
      var q = QUESTIONS[i], sel = state.answers[q.id] || [];
      bar.style.width = (i / QUESTIONS.length * 100) + '%';
      var html = '<div class="prld__step">' +
        '<div class="prld__meta"><span>Pregunta ' + (i + 1) + ' de ' + QUESTIONS.length + '</span><span>' + Math.round(i / QUESTIONS.length * 100) + '%</span></div>' +
        '<h3 id="prld-q">' + esc(q.title) + '</h3><p class="prld__hint">' + esc(q.hint) + '</p>' +
        '<div class="prld__opts' + (q.options.length > 4 ? ' prld__opts--2' : '') + '" role="group" aria-labelledby="prld-q">';
      q.options.forEach(function (o, k) {
        var isSel = sel.indexOf(k) > -1;
        html += '<button type="button" class="prld__opt" data-opt="' + k + '" aria-pressed="' + isSel + '">' +
                '<span class="prld__radio' + (q.multiple ? ' prld__radio--chk' : '') + '" aria-hidden="true"></span>' +
                esc(o.label) + '</button>';
      });
      var canNext = sel.length > 0;
      html += '</div><div class="prld__nav">' +
        '<button type="button" class="prld__btn prld__btn--ghost" data-act="back">← Atrás</button>' +
        '<button type="button" class="prld__btn" data-act="next"' + (canNext ? '' : ' disabled') + '>' + (i === QUESTIONS.length - 1 ? 'Ver resultado' : 'Siguiente →') + '</button>' +
        '</div></div>';
      body.innerHTML = html;
    }

    function result() {
      var r = state.result || (state.result = evaluate(state.answers)), L = LEVELS[r.level];
      bar.style.width = '100%';
      track('diagnostico_completado', { level: r.level, score: r.score });
      var lamps = ['critico', 'medio', 'bajo'].map(function (l) { return '<span class="prld__lamp' + (l === r.level ? ' on' : '') + '" data-l="' + l + '"></span>'; }).join('');
      var services = r.services.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
      body.innerHTML =
        '<div class="prld__step prld__res">' +
        '<div class="prld__res-top">' +
        '<div class="prld__light" role="img" aria-label="Semáforo: ' + L.label + '">' + lamps + '</div>' +
        '<div><span class="prld__badge" style="background:' + L.color + '">' + L.label + '</span>' +
        '<h3>' + esc(L.title) + '</h3>' +
        '<div class="prld__score"><b>' + r.score + '</b><span>/ 100 · índice de exposición</span></div>' +
        '<div class="prld__gauge" aria-hidden="true"><i style="left:0%"></i></div></div>' +
        '</div>' +
        '<div class="prld__box"><h4>Recomendación técnica</h4><p>' + esc(L.text) + '</p></div>' +
        (services ? '<div class="prld__box"><h4>Acciones prioritarias sugeridas</h4><ol>' + services + '</ol></div>' : '') +
        '<form class="prld__form" novalidate>' +
        '<h4>Recibí el reporte completo</h4><p>Un profesional revisa tus respuestas y te envía el reporte con el plan de acción sugerido, sin costo.</p>' +
        '<input class="prld__hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<div class="prld__row"><label class="prld__f">Nombre y apellido<input name="nombre" autocomplete="name" required></label>' +
        '<label class="prld__f">Empresa / obra<input name="empresa" autocomplete="organization" required></label></div>' +
        '<div class="prld__row"><label class="prld__f">WhatsApp<input name="telefono" type="tel" inputmode="tel" autocomplete="tel" placeholder="297 4XX XXXX" required></label>' +
        '<label class="prld__f">Email (opcional)<input name="email" type="email" autocomplete="email"></label></div>' +
        '<label class="prld__f">Localidad<input name="localidad" autocomplete="address-level2" placeholder="Ej.: Comodoro Rivadavia" required></label>' +
        '<label class="prld__chk"><input type="checkbox" name="privacidad" required> Acepto ser contactado por WhatsApp/email para recibir el reporte. Mis datos se tratan según la Ley 25.326.</label>' +
        '<div class="prld__msg" hidden></div>' +
        '<div class="prld__nav" style="margin-top:.2rem"><button type="button" class="prld__btn prld__btn--ghost" data-act="restart">Rehacer</button>' +
        '<button type="submit" class="prld__btn">Enviarme el reporte</button></div>' +
        '</form>' +
        '<p class="prld__legal">Resultado orientativo generado a partir de tus respuestas. No reemplaza un relevamiento profesional en sitio.</p>' +
        '</div>';
      requestAnimationFrame(function () { setTimeout(function () { var g = body.querySelector('.prld__gauge i'); if (g) g.style.left = r.score + '%'; }, 60); });
      body.querySelector('form').addEventListener('submit', submit);
    }

    function submit(e) {
      e.preventDefault();
      var f = e.target, msg = f.querySelector('.prld__msg'), btn = f.querySelector('[type=submit]');
      if (f.website.value) return;
      var ok = true;
      [['nombre', function (v) { return v.trim().length >= 2; }], ['empresa', function (v) { return v.trim().length >= 2; }],
       ['telefono', function (v) { return v.replace(/\\D/g, '').length >= 8; }], ['localidad', function (v) { return v.trim().length >= 2; }],
       ['email', function (v) { return !v || /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(v); }]].forEach(function (p) {
        var el = f[p[0]], good = p[1](el.value);
        el.parentNode.classList.toggle('err', !good); el.setAttribute('aria-invalid', String(!good));
        if (!good) ok = false;
      });
      if (!f.privacidad.checked) ok = false;
      if (!ok) { msg.hidden = false; msg.className = 'prld__msg prld__msg--err'; msg.textContent = 'Revisá los campos marcados y aceptá el contacto para recibir el reporte.'; return; }

      var r = state.result, L = LEVELS[r.level];
      var rubro = (state.answers.rubro || []).map(function(k){ return QUESTIONS[0].options[k].label; }).join(' + ');
      var payload = api.build({
        event: 'lead.diagnostico', source: 'diagnostico',
        contact: { nombre: f.nombre.value.trim(), empresa: f.empresa.value.trim(), cargo: '', email: f.email.value.trim().toLowerCase(), telefono: f.telefono.value, rubro: rubro, localidad: f.localidad.value.trim() },
        message: 'Solicitud de reporte completo del Diagnóstico Rápido de Cumplimiento Normativo.',
        diagnostic: {
          score: r.score, level: r.level, level_label: L.label,
          answers: QUESTIONS.map(function (q) { 
            var sel = state.answers[q.id] || [];
            var text = sel.map(function(k){ return q.options[k].label; }).join(' + ');
            var pts = sel.reduce(function(a, k){ return Math.max(a, q.options[k].points); }, 0);
            return { id: q.id, question: q.title, answer: text || 'N/A', points: pts }; 
          }),
          recommendation: L.text, priority_services: r.services
        },
        consent: { privacy_accepted: true, contact_whatsapp: true }
      });
      btn.setAttribute('aria-busy', 'true');
      api.send(payload).then(function (res) {
        track('generate_lead', { form: 'diagnostico', level: r.level, lead_id: res.lead_id });
        var wa = api.wa('Hola SEGURIDAD PRL, soy ' + payload.contact.nombre + ' de ' + payload.contact.empresa + '. Hice el diagnóstico en la web: resultado ' + L.label + ' (' + r.score + '/100). Ref. ' + res.lead_id + '.');
        f.innerHTML = '<h4>¡Listo, ' + esc(payload.contact.nombre.split(' ')[0]) + '!</h4>' +
          '<div class="prld__msg prld__msg--ok">Recibimos tu diagnóstico (ref. ' + esc(res.lead_id) + '). Te enviamos el reporte completo a la brevedad.</div>' +
          '<p>¿Querés adelantar la conversación con un profesional?</p>' +
          '<div><a class="prld__btn prld__btn--wa" href="' + wa + '" target="_blank" rel="noopener">Hablar ahora por WhatsApp</a></div>';
      }).catch(function () {
        msg.hidden = false; msg.className = 'prld__msg prld__msg--err';
        msg.innerHTML = 'No pudimos enviar el reporte. <a href="' + api.wa('Hola, hice el diagnóstico en la web y quiero recibir el reporte.') + '" target="_blank" rel="noopener">Escribinos por WhatsApp</a>.';
        btn.removeAttribute('aria-busy');
      });
    }

    root.addEventListener('click', function (e) {
      var opt = e.target.closest('[data-opt]'), act = e.target.closest('[data-act]');
      if (opt) {
        var q = QUESTIONS[state.step];
        var val = +opt.getAttribute('data-opt');
        var sel = state.answers[q.id] || [];
        
        if (q.multiple) {
          var idx = sel.indexOf(val);
          if (idx > -1) sel.splice(idx, 1); else sel.push(val);
          state.answers[q.id] = sel;
        } else {
          state.answers[q.id] = [val];
        }
        state.result = null;
        
        body.querySelectorAll('[data-opt]').forEach(function (b) { 
          var k = +b.getAttribute('data-opt');
          b.setAttribute('aria-pressed', String((state.answers[q.id] || []).indexOf(k) > -1)); 
        });
        body.querySelector('[data-act=next]').disabled = (state.answers[q.id] || []).length === 0;

        if (!q.multiple) {
          setTimeout(function () { state.step++; render(); focusTitle(); }, 260);
        }
        return;
      }
      if (!act) return;
      var a = act.getAttribute('data-act');
      if (a === 'start') { state.step = 0; track('diagnostico_iniciado'); }
      if (a === 'next') state.step++;
      if (a === 'back') state.step--;
      if (a === 'restart') { state = { step: 0, answers: {}, result: null }; }
      render(); focusTitle(); scrollTop();
    });

    render();
  }

  function boot() {
    injectCss();
    Array.prototype.forEach.call(document.querySelectorAll('[data-prl-diagnostico]'), function (el) {
      if (!el.__prld) { el.__prld = true; Diagnostico(el); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.PRLDiagnostico = { mount: boot, evaluate: evaluate, questions: QUESTIONS };
})();
`

fs.writeFileSync(target, jsContent, 'utf8');
