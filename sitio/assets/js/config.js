/* =====================================================================
   SEGURIDAD PRL · config.js
   ÚNICO archivo a editar para poner el sitio en producción.
   ===================================================================== */
window.PRL = window.PRL || {};

window.PRL.config = {
  brand: 'SEGURIDAD PRL',

  // [COMPLETAR] Número de WhatsApp comercial en formato internacional SIN "+" ni espacios.
  // Ej. Comodoro Rivadavia: 549297XXXXXXX  (54 país · 9 móvil · característica · número)
  whatsapp: '5492975153035',

  // [COMPLETAR] Datos visibles de contacto
  email: 'seguridad.prl.ar@gmail.com',
  phoneDisplay: '+54 9 297 515-3035',

  // [COMPLETAR] URL del webhook (n8n / Make / Google Apps Script). Ver /automatizaciones/README.md
  // Si queda vacío, el sitio funciona en "modo demo": guarda el lead en localStorage
  // y ofrece continuar la conversación por WhatsApp.
  webhookUrl: '',

  // Mensaje predeterminado del botón de WhatsApp
  waDefaultText: 'Hola SEGURIDAD PRL, quiero solicitar asesoramiento en Higiene y Seguridad.',

  coverage: ['Comodoro Rivadavia', 'Santa Cruz', 'Neuquén', 'Añelo', 'Bahía Blanca', 'Coronel Rosales']
};
