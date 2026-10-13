/**
 * SEGURIDAD PRL - Google Apps Script Web App (Webhook de Leads)
 * 
 * Este script:
 * 1. Registra automáticamente cada consulta en una planilla Google Sheets ("Leads").
 * 2. Envía un correo con formato profesional al email de la empresa (por defecto: seguridad.prl.ar@gmail.com).
 * 3. (Opcional) Envía alerta inmediata a Telegram si configurás el bot.
 * 4. Devuelve respuesta 200 OK con lead_id a la página web.
 * 
 * GUÍA DE INSTALACIÓN PASO A PASO (Menos de 3 minutos):
 * -------------------------------------------------------------
 * 1. Abrí Google Drive y creá una hoja de cálculo nueva (por ej.: "CRM SEGURIDAD PRL").
 * 2. En el menú superior de la hoja, hacé clic en: Extensiones -> Apps Script.
 * 3. Borrá cualquier código existente, pegá TODO este archivo y guardalo (ícono de disco o Ctrl+S).
 * 4. Hacé clic en el botón azul "Implementar" (arriba a la derecha) -> "Nueva implementación".
 * 5. Hacé clic en la rueda de engranaje ⚙️ junto a "Seleccionar tipo" y elegí: "Aplicación web".
 * 6. Completá los campos:
 *    - Descripción: Webhook Leads SEGURIDAD PRL
 *    - Ejecutar como: "Yo" (tu cuenta de Google)
 *    - Quién tiene acceso: "Cualquier persona" (Anyone)   <--- ¡MUY IMPORTANTE!
 * 7. Hacé clic en "Implementar", autorizá los permisos con tu cuenta de Google.
 * 8. Copiá la "URL de la aplicación web" que te entrega Google (termina en `/exec`).
 * 9. Pegá esa URL en el archivo de tu web: `sitio/assets/js/config.js` en la propiedad `webhookUrl`.
 * ¡Y listo! Cada formulario y diagnóstico llegará a tu correo y a tu hoja de cálculo.
 */

// Email de destino para recibir las consultas (podés cambiarlo aquí o en Propiedades del Script)
var DEFAULT_NOTIFICATION_EMAIL = 'seguridad.prl.ar@gmail.com';

function doPost(e) {
  try {
    var rawContents = e.postData.contents;
    var data = typeof rawContents === 'string' ? JSON.parse(rawContents) : rawContents;
    
    var meta = data.meta || {};
    var contact = data.contact || {};
    var diag = data.diagnostic || null;
    var isCritico = diag && diag.level === 'critico';
    
    // 1. Registrar en la hoja "Leads"
    var sheet = getOrCreateSheet('Leads');
    sheet.appendRow([
      meta.submitted_at || new Date().toISOString(),
      meta.lead_id || '',
      meta.source || '',
      contact.nombre || '',
      contact.empresa || '',
      contact.cargo || '',
      contact.email || '',
      contact.telefono || '',
      contact.rubro || '',
      contact.localidad || '',
      data.message || '',
      diag ? diag.score : '',
      diag ? diag.level_label || diag.level : '',
      diag ? (diag.priority_services || []).join('; ') : '',
      meta.utm ? meta.utm.source || '' : '',
      meta.utm ? meta.utm.campaign || '' : '',
      'Nuevo' // Estado inicial del Lead en el CRM
    ]);
    
    // 2. Enviar notificación por Email directo a la casilla
    try {
      sendEmailNotification(meta, contact, data.message, diag, isCritico);
    } catch (mailErr) {
      Logger.log('Error enviando email: ' + mailErr.toString());
    }
    
    // 3. Enviar notificación a Telegram (opcional)
    try {
      sendTelegramNotification(meta, contact, data.message, diag, isCritico);
    } catch (tgErr) {
      Logger.log('Error enviando Telegram: ' + tgErr.toString());
    }
    
    // 4. Responder 200 OK con JSON al front-end
    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      lead_id: meta.lead_id,
      status: 'success'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    Logger.log('Error general en doPost: ' + err.toString());
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    // Encabezados estándar del CRM
    sheet.appendRow([
      'Fecha/Hora', 'Lead ID', 'Origen', 'Nombre', 'Empresa', 'Cargo', 
      'Email', 'Teléfono / WA', 'Rubro', 'Localidad', 'Mensaje / Consulta', 
      'Score Diag', 'Nivel Riesgo', 'Servicios Sugeridos', 'UTM Source', 'UTM Campaign', 'Estado'
    ]);
    sheet.getRange(1, 1, 1, 17).setFontWeight('bold').setBackground('#14d4c9').setFontColor('#1b232a');
  }
  return sheet;
}

function sendEmailNotification(meta, contact, message, diag, isCritico) {
  var props = PropertiesService.getScriptProperties();
  var destEmail = props.getProperty('NOTIFICATION_EMAIL') || DEFAULT_NOTIFICATION_EMAIL;
  
  var subject = (isCritico ? '🔴 [URGENTE] Consulta Crítica Web' : '📥 Nueva Consulta Web') + 
                ' - ' + (contact.empresa ? contact.empresa + ' (' + contact.nombre + ')' : contact.nombre || 'SEGURIDAD PRL') + 
                ' [' + (meta.lead_id || '') + ']';

  var cleanPhone = (contact.telefono || '').replace(/\D/g, '');
  var waUrl = cleanPhone ? 'https://wa.me/' + cleanPhone : '';

  var htmlBody = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;border:1px solid #dde4ea;border-radius:10px;padding:24px;background:#ffffff;color:#2a333a;">' +
    '<div style="border-bottom:3px solid #14d4c9;padding-bottom:14px;margin-bottom:18px;">' +
      '<h2 style="margin:0;color:#1b232a;font-size:22px;">' + (isCritico ? '🔴 Nueva Consulta con Riesgo Crítico' : '📥 Nueva Consulta desde la Web') + '</h2>' +
      '<p style="margin:6px 0 0;color:#5d6b76;font-size:13px;">Referencia: <strong>' + (meta.lead_id || '-') + '</strong> · Origen: <strong>' + (meta.source || 'sitio-web') + '</strong></p>' +
    '</div>' +
    
    '<h3 style="color:#006eff;font-size:16px;margin:16px 0 10px;">Datos del Contacto</h3>' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.7;">' +
      '<tr><td style="padding:4px 0;width:130px;color:#5d6b76;"><strong>Nombre:</strong></td><td style="color:#1b232a;font-weight:600;">' + (contact.nombre || '-') + '</td></tr>' +
      '<tr><td style="padding:4px 0;color:#5d6b76;"><strong>Empresa / Obra:</strong></td><td style="color:#1b232a;font-weight:600;">' + (contact.empresa || '-') + '</td></tr>' +
      '<tr><td style="padding:4px 0;color:#5d6b76;"><strong>Cargo:</strong></td><td>' + (contact.cargo || '-') + '</td></tr>' +
      '<tr><td style="padding:4px 0;color:#5d6b76;"><strong>Localidad:</strong></td><td>' + (contact.localidad || '-') + '</td></tr>' +
      '<tr><td style="padding:4px 0;color:#5d6b76;"><strong>Rubro:</strong></td><td>' + (contact.rubro || '-') + '</td></tr>' +
      '<tr><td style="padding:4px 0;color:#5d6b76;"><strong>WhatsApp:</strong></td><td>' + 
        (contact.telefono ? '<a href="' + waUrl + '" style="color:#006eff;font-weight:bold;text-decoration:none;">' + contact.telefono + ' 📲 Abrir chat</a>' : '-') + 
      '</td></tr>' +
      '<tr><td style="padding:4px 0;color:#5d6b76;"><strong>Email:</strong></td><td>' + 
        (contact.email ? '<a href="mailto:' + contact.email + '" style="color:#006eff;text-decoration:none;">' + contact.email + '</a>' : '-') + 
      '</td></tr>' +
    '</table>';

  if (message) {
    htmlBody += '<div style="margin-top:18px;padding:14px;background:#f3f6f8;border-left:4px solid #006eff;border-radius:4px;">' +
      '<strong style="display:block;margin-bottom:6px;color:#1b232a;font-size:14px;">Mensaje / Consulta:</strong>' +
      '<p style="margin:0;font-size:14px;white-space:pre-wrap;color:#2a333a;">' + message + '</p>' +
    '</div>';
  }

  if (diag) {
    var diagBg = isCritico ? '#ffeef0' : '#fff9e6';
    var diagBorder = isCritico ? '#e5484d' : '#f2a516';
    htmlBody += '<div style="margin-top:18px;padding:14px;background:' + diagBg + ';border-left:4px solid ' + diagBorder + ';border-radius:4px;">' +
      '<strong style="display:block;margin-bottom:6px;color:#1b232a;font-size:14px;">Diagnóstico de Cumplimiento: ' + (diag.level_label || diag.level) + ' (Puntaje: ' + diag.score + '/100)</strong>' +
      '<p style="margin:0;font-size:13px;color:#5d6b76;"><strong>Servicios prioritarios sugeridos:</strong> ' + ((diag.priority_services || []).join(', ') || 'General') + '</p>' +
    '</div>';
  }

  htmlBody += '<div style="margin-top:24px;padding-top:16px;border-top:1px solid #dde4ea;text-align:center;">' +
    (waUrl ? '<a href="' + waUrl + '" style="display:inline-block;padding:10px 18px;background:#25d366;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;margin:4px 6px;">Contactar por WhatsApp</a>' : '') +
    (contact.email ? '<a href="mailto:' + contact.email + '" style="display:inline-block;padding:10px 18px;background:#006eff;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;margin:4px 6px;">Responder por Email</a>' : '') +
  '</div>' +
  '</div>';

  MailApp.sendEmail({
    to: destEmail,
    subject: subject,
    htmlBody: htmlBody
  });
}

function sendTelegramNotification(meta, contact, message, diag, isCritico) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TELEGRAM_BOT_TOKEN');
  var chatId = props.getProperty('TELEGRAM_CHAT_ID');
  
  if (!token || !chatId) return;
  
  var text = (isCritico ? '🔴 <b>ALERTA LEAD CRÍTICO</b>' : '📥 <b>NUEVO LEAD DE WEB</b>') + ' - SEGURIDAD PRL\n\n';
  text += '<b>Ref:</b> <code>' + (meta.lead_id || '') + '</code>\n';
  text += '<b>Origen:</b> ' + (meta.source || 'web') + '\n\n';
  text += '👤 <b>Nombre:</b> ' + (contact.nombre || '-') + '\n';
  text += '🏢 <b>Empresa:</b> ' + (contact.empresa || '-') + '\n';
  text += '📍 <b>Localidad:</b> ' + (contact.localidad || '-') + '\n';
  text += '🏭 <b>Rubro:</b> ' + (contact.rubro || '-') + '\n';
  text += '📱 <b>Tel/WA:</b> ' + (contact.telefono || '-') + '\n';
  text += '✉️ <b>Email:</b> ' + (contact.email || '-') + '\n\n';
  
  if (message) {
    text += '💬 <b>Mensaje:</b> ' + message + '\n\n';
  }
  
  if (diag) {
    text += '📊 <b>DIAGNÓSTICO:</b> ' + (diag.level_label || diag.level) + ' (' + diag.score + '/100)\n';
    text += '• <b>Sugerencias:</b> ' + (diag.priority_services || []).join(', ') + '\n';
  }
  
  var payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML'
  };
  
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}
