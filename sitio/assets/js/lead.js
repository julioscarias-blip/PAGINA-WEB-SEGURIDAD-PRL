/* =====================================================================
   SEGURIDAD PRL · lead.js
   Construcción del payload estándar y envío al webhook.
   Contrato: /automatizaciones/payload.schema.json
   ===================================================================== */
(function (PRL) {
  'use strict';
  var cfg = function () { return PRL.config || {}; };

  /* --- UTM: se capturan en la primera visita y persisten en la sesión --- */
  function captureUtm() {
    var keys = ['source', 'medium', 'campaign', 'term', 'content'];
    var params = new URLSearchParams(location.search);
    var stored = {};
    try { stored = JSON.parse(sessionStorage.getItem('prl_utm') || '{}'); } catch (e) { stored = {}; }
    var utm = {};
    keys.forEach(function (k) { utm[k] = params.get('utm_' + k) || stored[k] || ''; });
    try { sessionStorage.setItem('prl_utm', JSON.stringify(utm)); } catch (e) { }
    return utm;
  }
  var UTM = captureUtm();

  function pad(n) { return String(n).padStart(2, '0'); }
  function isoLocal(d) {
    var off = -d.getTimezoneOffset(), sign = off >= 0 ? '+' : '-';
    off = Math.abs(off);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' +
      pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + sign + pad(Math.floor(off / 60)) + ':' + pad(off % 60);
  }
  function leadId(d) {
    var rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
    return 'PRL-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + rnd;
  }

  /* Normaliza teléfonos argentinos a E.164 (+549...) de forma tolerante */
  function normalizePhone(raw) {
    var d = String(raw || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.indexOf('00') === 0) d = d.slice(2);
    if (d.indexOf('54') === 0) {
      d = d.slice(2);
      if (d.charAt(0) !== '9') d = '9' + d;
      return '+54' + d;
    }
    if (d.charAt(0) === '0') d = d.slice(1);       // 0297 -> 297
    d = d.replace(/^(\d{2,4})15(\d{6,8})$/, '$1$2'); // quita el 15 local
    return d.length >= 10 ? '+549' + d : '+' + d;
  }

  /**
   * @param {Object} o
   * @param {'lead.contacto'|'lead.landing'|'lead.diagnostico'} o.event
   * @param {'sitio-web'|'landing'|'diagnostico'} o.source
   * @param {Object} o.contact  {nombre, empresa, cargo, email, telefono, rubro, localidad}
   * @param {string} [o.message]
   * @param {Object|null} [o.diagnostic]
   * @param {Object} [o.consent]
   */
  function buildPayload(o) {
    var now = new Date(), c = o.contact || {};
    return {
      meta: {
        lead_id: leadId(now),
        event: o.event,
        source: o.source,
        page_url: location.href,
        submitted_at: isoLocal(now),
        utm: UTM,
        user_agent: navigator.userAgent
      },
      contact: {
        nombre: (c.nombre || '').trim(),
        empresa: (c.empresa || '').trim(),
        cargo: (c.cargo || '').trim(),
        email: (c.email || '').trim().toLowerCase(),
        telefono: normalizePhone(c.telefono),
        rubro: c.rubro || '',
        localidad: (c.localidad || '').trim()
      },
      message: (o.message || '').trim(),
      diagnostic: o.diagnostic || null,
      consent: o.consent || { privacy_accepted: true, contact_whatsapp: true }
    };
  }

  /**
   * Envía el payload. Usa text/plain para evitar el preflight CORS
   * (n8n, Make y Apps Script lo reciben y parsean como JSON).
   * @returns {Promise<{ok:boolean, demo?:boolean, lead_id:string}>}
   */
  function send(payload) {
    var url = cfg().webhookUrl;
    if (!url) {
      try {
        var list = JSON.parse(localStorage.getItem('prl_leads_demo') || '[]');
        list.push(payload); localStorage.setItem('prl_leads_demo', JSON.stringify(list));
      } catch (e) { }
      if (window.console) console.info('[SEGURIDAD PRL] Modo demo – payload generado:', payload);
      return new Promise(function (r) { setTimeout(function () { r({ ok: true, demo: true, lead_id: payload.meta.lead_id }); }, 700); });
    }
    var isGoogleScript = url.indexOf('script.google.com') !== -1;
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;
    var fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    };
    if (isGoogleScript) {
      fetchOptions.mode = 'no-cors';
    }

    return fetch(url, fetchOptions).then(function (res) {
      if (timer) clearTimeout(timer);
      if (!isGoogleScript && !res.ok) throw new Error('HTTP ' + res.status);
      return { ok: true, lead_id: payload.meta.lead_id };
    }).catch(function (err) {
      if (timer) clearTimeout(timer);
      if (isGoogleScript) {
        return { ok: true, lead_id: payload.meta.lead_id };
      }
      throw err;
    });
  }

  function waLink(text) {
    return 'https://wa.me/' + (cfg().whatsapp || '') + '?text=' + encodeURIComponent(text || cfg().waDefaultText || '');
  }

  function track(name, data) {
    // Hook para GA4 / Meta Pixel / LinkedIn Insight si se instalan
    if (typeof window.gtag === 'function') window.gtag('event', name, data || {});
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(Object.assign({ event: name }, data || {}));
  }

  PRL.lead = { buildPayload: buildPayload, send: send, waLink: waLink, normalizePhone: normalizePhone, track: track };
})(window.PRL = window.PRL || {});
