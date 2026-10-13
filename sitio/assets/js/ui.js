/* =====================================================================
   SEGURIDAD PRL · ui.js
   Módulos de interfaz: header, navegación, reveal, servicios, galería,
   enlaces de WhatsApp y formularios de captación.
   Requiere: config.js, lead.js
   ===================================================================== */
(function (PRL) {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: estado scroll + menú móvil ---------- */
  function initHeader() {
    var header = $('[data-header]');
    if (!header) return;
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 24); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

    var toggle = $('[data-nav-toggle]', header);
    if (!toggle) return;
    var close = function () { header.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; };
    toggle.addEventListener('click', function () {
      var open = !header.classList.contains('is-open');
      header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('.nav a', header).forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1080) close(); });
  }

  /* ---------- Link activo según la sección visible ---------- */
  function initScrollSpy() {
    var links = $$('[data-spy]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (l) { map[l.getAttribute('href').slice(1)] = l; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (l) { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
          map[en.target.id].classList.add('is-active'); map[en.target.id].setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- Animaciones de aparición ---------- */
  function initReveal() {
    var els = $$('.reveal');
    if (reduced || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- Contadores de indicadores ---------- */
  function initCounters() {
    var els = $$('[data-count]');
    if (!els.length) return;
    var run = function (el) {
      var end = +el.getAttribute('data-count'), t0 = null, dur = 1400;
      if (reduced) { el.textContent = end; return; }
      var step = function (t) { if (!t0) t0 = t; var p = Math.min((t - t0) / dur, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } }); }, { threshold: .6 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- Tarjetas de servicio: expandir alcance solo al pulsar el desplegable ---------- */
  function initServices() {
    $$('.svc').forEach(function (card) {
      var trigger = $('.svc__hint', card);
      if (!trigger) return;

      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = card.classList.toggle('is-expanded');
        trigger.setAttribute('aria-expanded', String(open));
        var label = $('span', trigger);
        if (label) label.textContent = open ? 'Ocultar alcance' : 'Ver alcance y detalles';
      });
    });

    // Botones "Consultar" precargan el servicio en el formulario y hacen foco
    $$('[data-service]').forEach(function (a) {
      a.addEventListener('click', function () {
        var msg = $('#contact-form [name="mensaje"]');
        if (msg) {
          msg.value = 'Me interesa el servicio: ' + a.getAttribute('data-service') + '. ';
          setTimeout(function () { msg.focus(); }, 150);
        }
      });
    });
  }

  /* ---------- Galería + lightbox accesible ---------- */
  function initGallery() {
    var items = $$('[data-lightbox]');
    if (!items.length) return;
    var box = document.createElement('div');
    box.className = 'lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Galería de imágenes');
    box.innerHTML =
      '<button class="lightbox__btn lightbox__close" aria-label="Cerrar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '<button class="lightbox__btn lightbox__prev" aria-label="Anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg></button>' +
      '<figure style="margin:0"><img alt=""><figcaption class="lightbox__cap"></figcaption></figure>' +
      '<button class="lightbox__btn lightbox__next" aria-label="Siguiente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></button>';
    document.body.appendChild(box);
    var img = $('img', box), cap = $('figcaption', box), idx = 0, last = null;
    var show = function (i) {
      idx = (i + items.length) % items.length;
      var it = items[idx];
      var name = ($('figcaption b', it) && $('figcaption b', it).textContent.trim()) || ($('img', it) && $('img', it).alt) || '';
      img.src = it.getAttribute('data-lightbox');
      img.alt = name;
      cap.textContent = name;
    };
    var open = function (i) { last = document.activeElement; show(i); box.classList.add('is-open'); document.body.style.overflow = 'hidden'; $('.lightbox__close', box).focus(); };
    var close = function () { box.classList.remove('is-open'); document.body.style.overflow = ''; if (last) last.focus(); };
    items.forEach(function (it, i) { it.addEventListener('click', function () { open(i); }); });
    $('.lightbox__close', box).addEventListener('click', close);
    $('.lightbox__prev', box).addEventListener('click', function () { show(idx - 1); });
    $('.lightbox__next', box).addEventListener('click', function () { show(idx + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ---------- Enlaces de WhatsApp y datos de contacto desde config ---------- */
  function initContactLinks() {
    var cfg = PRL.config || {};
    $$('[data-wa]').forEach(function (a) {
      a.href = PRL.lead.waLink(a.getAttribute('data-wa') || cfg.waDefaultText);
      a.target = '_blank'; a.rel = 'noopener';
      a.addEventListener('click', function () { PRL.lead.track('click_whatsapp', { location: a.getAttribute('data-track') || 'generic' }); });
    });
    $$('[data-email]').forEach(function (a) { a.href = 'mailto:' + cfg.email; if (!a.children.length) a.textContent = cfg.email; else { var s = $('strong', a); if (s) s.textContent = cfg.email; } });
    $$('[data-phone]').forEach(function (el) { el.textContent = cfg.phoneDisplay; });
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ---------- Formularios de captación ---------- */
  var RULES = {
    nombre: function (v) { return v.trim().length >= 2 || 'Ingresá tu nombre.'; },
    empresa: function (v) { return v.trim().length >= 2 || 'Ingresá la empresa u obra.'; },
    cargo: function (v) { return v.trim().length >= 2 || 'Ingresá tu cargo.'; },
    rubro: function (v) { return !!v || 'Seleccioná el rubro.'; },
    localidad: function (v) { return v.trim().length >= 2 || 'Indicá la localidad.'; },
    telefono: function (v) { return v.replace(/\D/g, '').length >= 8 || 'Ingresá un WhatsApp válido (con característica).'; },
    email: function (v) { return (v.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) || 'Ingresá un email válido.'; },
    mensaje: function (v) { return v.trim().length >= 3 || 'Ingresá tu mensaje o consulta.'; },
    privacidad: function (v, el) { return el.checked || 'Necesitamos tu aceptación para contactarte.'; }
  };

  function validateField(el) {
    var rule = RULES[el.name];
    if (!rule || !el.required) return true;
    var res = rule(el.value || '', el);
    var field = el.closest('.field') || el.closest('.check');
    var err = field && $('.field__error', field);
    if (field) field.classList.toggle('is-invalid', res !== true);
    if (err) err.textContent = res === true ? '' : res;
    el.setAttribute('aria-invalid', res === true ? 'false' : 'true');
    return res === true;
  }

  function initForms() {
    $$('form[data-lead-form], form#contact-form, form.form').forEach(function (form) {
      var status = $('.form__status', form);
      var btn = $('[type="submit"]', form);
      $$('input, select, textarea', form).forEach(function (el) {
        el.addEventListener('blur', function () { if (el.value) validateField(el); });
        el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') validateField(el); });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (status) { status.textContent = ''; status.className = 'form__status'; }
        if (form.website && form.website.value) return; // honeypot anti-spam
        var ok = true, first = null;
        $$('input, select, textarea', form).forEach(function (el) { if (!validateField(el)) { ok = false; first = first || el; } });
        if (!ok) { first.focus(); return; }

        btn.setAttribute('aria-busy', 'true');

        var action = form.getAttribute('action');
        if (action && action.indexOf('formsubmit.co') !== -1) {
          // Si se abre directo como archivo local (file://), FormSubmit no acepta AJAX: submit directo
          if (location.protocol === 'file:') {
            form.submit();
            return;
          }

          var ajaxUrl = action.replace('formsubmit.co/', 'formsubmit.co/ajax/');
          var fd = new FormData(form);

          fetch(ajaxUrl, {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: fd
          }).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
          }).then(function (data) {
            if (data && (data.success === 'false' || data.success === false)) {
              if (status) {
                status.className = 'form__status form__status--err';
                status.innerHTML = escapeHtml(data.message || 'Se requiere activar el formulario de FormSubmit.');
              }
              return;
            }

            var nombre = (form.querySelector('[name="nombre"]') || {}).value || '';
            var empresa = (form.querySelector('[name="empresa"]') || {}).value || '';
            var loc = (form.querySelector('[name="localidad"]') || {}).value || '';
            var waText = 'Hola, soy ' + nombre + (empresa ? ' de ' + empresa : '') +
              (loc ? ' (' + loc + ')' : '') + '. Acabo de enviar una consulta desde la web.';
            if (status) {
              status.className = 'form__status form__status--ok';
              status.innerHTML = '¡Gracias, ' + escapeHtml(nombre.split(' ')[0] || 'por contactarnos') + '! Recibimos tu consulta en seguridad.prl.ar@gmail.com. ' +
                'Te contactaremos a la brevedad. <a href="' + PRL.lead.waLink(waText) + '" target="_blank" rel="noopener">¿Preferís escribirnos ya por WhatsApp?</a>';
            }
            form.reset();
          }).catch(function () {
            // Fallback nativo directo a FormSubmit
            form.submit();
          }).finally(function () {
            btn.removeAttribute('aria-busy');
          });
          return;
        }

        var fd = new FormData(form), get = function (k) { return (fd.get(k) || '').toString(); };
        var payload = PRL.lead.buildPayload({
          event: form.getAttribute('data-event') || 'lead.contacto',
          source: form.getAttribute('data-source') || 'sitio-web',
          contact: { nombre: get('nombre'), empresa: get('empresa'), cargo: get('cargo'), email: get('email'), telefono: get('telefono'), rubro: get('rubro'), localidad: get('localidad') },
          message: get('mensaje'),
          consent: { privacy_accepted: !!fd.get('privacidad'), contact_whatsapp: true }
        });

        PRL.lead.send(payload).then(function (r) {
          PRL.lead.track('generate_lead', { form: payload.meta.source, lead_id: r.lead_id });
          var waText = 'Hola, soy ' + payload.contact.nombre + ' de ' + payload.contact.empresa +
            ' (' + payload.contact.localidad + '). Acabo de enviar una consulta desde la web (ref. ' + r.lead_id + ').';
          if (status) {
            status.className = 'form__status form__status--ok';
            status.innerHTML = '¡Gracias, ' + escapeHtml(payload.contact.nombre.split(' ')[0]) + '! Recibimos tu consulta (ref. ' + r.lead_id + '). ' +
              'Te contactamos a la brevedad. <a href="' + PRL.lead.waLink(waText) + '" target="_blank" rel="noopener">¿Preferís escribirnos ya por WhatsApp?</a>';
          }
          form.reset();
        }).catch(function () {
          if (status) {
            status.className = 'form__status form__status--err';
            status.innerHTML = 'No pudimos enviar el formulario. Probá de nuevo o <a href="' + PRL.lead.waLink() + '" target="_blank" rel="noopener">escribinos por WhatsApp</a>.';
          }
        }).then(function () { btn.removeAttribute('aria-busy'); });
      });
    });
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  document.documentElement.classList.remove('no-js');
  document.addEventListener('DOMContentLoaded', function () {
    initHeader(); initScrollSpy(); initReveal(); initCounters();
    initServices(); initGallery(); initContactLinks(); initForms();
  });
})(window.PRL = window.PRL || {});
