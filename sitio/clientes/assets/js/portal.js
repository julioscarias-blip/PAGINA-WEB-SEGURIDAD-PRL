/* =====================================================================
   SEGURIDAD PRL · Portal de Clientes
   portal.js · Lógica modular de autenticación, sesión y repositorio documental
   ===================================================================== */

(function (window, document) {
  'use strict';

  /* ===================================================================
     1. MÓDULO DE AUTENTICACIÓN (PortalAuth)
     Desacoplado y listo para conectar con Supabase / Firebase / API REST
     =================================================================== */
  var PortalAuth = (function () {
    var STORAGE_KEY = 'PRL_PORTAL_SESSION_V1';
    var listeners = [];

    // Base de datos de prueba de clientes
    var CLIENT_ACCOUNTS = [
      {
        id: 'petroaustral',
        email: 'empresa@petroaustral.com.ar',
        pass: 'demo123',
        companyName: 'PetroAustral S.A.',
        industry: 'Petróleo & Gas · Servicios de Yacimiento',
        location: 'Añelo & Comodoro Rivadavia',
        staffCount: 85,
        art: 'Prevención ART (Contrato N° 94821)',
        serviceHours: '24 hs/mes asignadas (Dec. 1338/96)',
        userName: 'Ing. Martín Benítez',
        userRole: 'Director de Operaciones',
        consultant: {
          name: 'Lic. Carlos Almonacid',
          title: 'Licenciado en Higiene y Seguridad en el Trabajo',
          matricula: 'Mat. Prov. N° 4821 / Reg. SRT',
          phone: '+54 9 297 515-3035',
          email: 'seguridad.prl.ar@gmail.com',
          waText: 'Hola Carlos, me comunico desde el portal de PetroAustral S.A. para coordinar:'
        }
      },
      {
        id: 'patagonica',
        email: 'contacto@patagonicaobras.com.ar',
        pass: 'demo123',
        companyName: 'Constructora Patagónica SRL',
        industry: 'Obras Civiles e Infraestructura',
        location: 'Bahía Blanca & Coronel Rosales',
        staffCount: 42,
        art: 'La Segunda ART (Contrato N° 81204)',
        serviceHours: '16 hs/mes asignadas (Dec. 911/96)',
        userName: 'Arq. Valeria Rossi',
        userRole: 'Jefa de Obra',
        consultant: {
          name: 'Ing. Laura Sotomayor',
          title: 'Especialista en Seguridad en la Construcción',
          matricula: 'Mat. Prov. N° 3914 / Reg. SRT',
          phone: '+54 9 297 515-3035',
          email: 'seguridad.prl.ar@gmail.com',
          waText: 'Hola Laura, me comunico desde el portal de Constructora Patagónica SRL para coordinar:'
        }
      },
      {
        id: 'minera',
        email: 'hys@minerasanjulian.com',
        pass: 'demo123',
        companyName: 'Minera San Julián',
        industry: 'Minería a Cielo Abierto y Planta',
        location: 'Santa Cruz (Zona Centro)',
        staffCount: 160,
        art: 'Experta ART (Contrato N° 10452)',
        serviceHours: '48 hs/mes asignadas (Dec. 1338/96)',
        userName: 'Lic. Gustavo Peralta',
        userRole: 'Superintendente de Mina',
        consultant: {
          name: 'Lic. Carlos Almonacid',
          title: 'Licenciado en Higiene y Seguridad en el Trabajo',
          matricula: 'Mat. Prov. N° 4821 / Reg. SRT',
          phone: '+54 9 297 515-3035',
          email: 'seguridad.prl.ar@gmail.com',
          waText: 'Hola Carlos, te escribo desde el portal de Minera San Julián para coordinar:'
        }
      }
    ];

    function saveSession(session) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch (e) {
        console.warn('Storage error', e);
      }
    }

    function getSession() {
      try {
        var d = localStorage.getItem(STORAGE_KEY);
        return d ? JSON.parse(d) : null;
      } catch (e) {
        return null;
      }
    }

    function clearSession() {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    }

    function notify(user) {
      listeners.forEach(function (fn) { fn(user); });
    }

    return {
      login: function (email, password) {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            var cleanEmail = (email || '').trim().toLowerCase();
            var cleanPass = (password || '').trim();

            var user = CLIENT_ACCOUNTS.find(function (acc) {
              return acc.email.toLowerCase() === cleanEmail && acc.pass === cleanPass;
            });

            if (user) {
              var sessionData = {
                id: user.id,
                email: user.email,
                companyName: user.companyName,
                industry: user.industry,
                location: user.location,
                staffCount: user.staffCount,
                art: user.art,
                serviceHours: user.serviceHours,
                userName: user.userName,
                userRole: user.userRole,
                consultant: user.consultant,
                loginTime: new Date().toISOString()
              };
              saveSession(sessionData);
              notify(sessionData);
              resolve({ ok: true, user: sessionData });
            } else {
              reject(new Error('Credenciales incorrectas. Verificá tu correo y contraseña o usá los accesos de prueba.'));
            }
          }, 350);
        });
      },

      logout: function () {
        clearSession();
        notify(null);
        return Promise.resolve();
      },

      getCurrentUser: function () {
        return getSession();
      },

      isAuthenticated: function () {
        return !!getSession();
      },

      onAuthStateChange: function (fn) {
        if (typeof fn === 'function') listeners.push(fn);
      },

      getDemoAccounts: function () {
        return CLIENT_ACCOUNTS;
      }
    };
  })();

  /* ===================================================================
     2. MÓDULO DE DOCUMENTACIÓN (PortalDocs)
     Base de documentos organizada por empresa y categorías técnicas
     =================================================================== */
  var PortalDocs = (function () {
    var REPOSITORY = {
      petroaustral: [
        {
          id: 'DOC-PS-01',
          title: 'Programa de Seguridad — Operación en Yacimiento Añelo',
          category: 'programas',
          categoryLabel: 'Programas de Seguridad',
          code: 'PS-AÑELO-2026-v3',
          date: '10/01/2026',
          validUntil: '10/01/2027',
          status: 'vigente',
          statusLabel: 'Aprobado ART / Vigente',
          fileSize: '3.4 MB',
          type: 'pdf',
          description: 'Documento integral de identificación de peligros y medidas de prevención conforme a Ley 19.587 y Decreto 351/79 para operaciones de campo y transporte de fluidos.',
          legalBasis: 'Ley 19.587 · Dec. 351/79 · Res. SRT 51/97'
        },
        {
          id: 'DOC-PS-02',
          title: 'Programa de Seguridad — Taller Central de Mantenimiento',
          category: 'programas',
          categoryLabel: 'Programas de Seguridad',
          code: 'PS-TALLER-2026-v1',
          date: '02/02/2026',
          validUntil: '02/02/2027',
          status: 'vigente',
          statusLabel: 'Vigente',
          fileSize: '2.1 MB',
          type: 'pdf',
          description: 'Protocolos de seguridad para soldadura, maquinarias pesadas, oxicorte y almacenamiento de materiales inflamables en base Comodoro Rivadavia.',
          legalBasis: 'Ley 19.587 · Dec. 351/79'
        },
        {
          id: 'DOC-CAP-01',
          title: 'Registro de Capacitación: Trabajos en Altura e Izaje de Cargas',
          category: 'capacitaciones',
          categoryLabel: 'Capacitaciones',
          code: 'CAP-ALT-2026-01',
          date: '15/03/2026',
          validUntil: '15/03/2027',
          status: 'vigente',
          statusLabel: 'Completada (38 Operarios)',
          fileSize: '4.8 MB',
          type: 'pdf',
          description: 'Acta de asistencia firmada, temario teórico-práctico, evaluación de conocimientos y entrega de constancias individuales de capacitación.',
          legalBasis: 'Capítulo 21 Dec. 351/79'
        },
        {
          id: 'DOC-CAP-02',
          title: 'Capacitación: Manejo Defensivo y Seguridad en Caminos de Ripio',
          category: 'capacitaciones',
          categoryLabel: 'Capacitaciones',
          code: 'CAP-MAN-2026-02',
          date: '28/04/2026',
          validUntil: '28/04/2027',
          status: 'vigente',
          statusLabel: 'Completada (24 Choferes)',
          fileSize: '3.2 MB',
          type: 'pdf',
          description: 'Formación para conductores de camionetas 4x4 y camiones cisterna en cuenca neuquina y golfo San Jorge.',
          legalBasis: 'Programa Anual de Capacitación'
        },
        {
          id: 'DOC-CAP-03',
          title: 'Cronograma Anual de Capacitación 2026 (Plan Oficial ante ART)',
          category: 'capacitaciones',
          categoryLabel: 'Capacitaciones',
          code: 'CRON-CAP-2026',
          date: '05/01/2026',
          validUntil: '31/12/2026',
          status: 'vigente',
          statusLabel: 'En Ejecución (65%)',
          fileSize: '1.2 MB',
          type: 'sheet',
          description: 'Planificación anual por módulo: EPP, primeros auxilios, extintores, bloqueo LOTO y ergonomía.',
          legalBasis: 'Res. SRT obligatoria'
        },
        {
          id: 'DOC-INF-01',
          title: 'Relevamiento General de Agentes de Riesgo (RAR 2026)',
          category: 'informes',
          categoryLabel: 'Relevamientos e Informes',
          code: 'RAR-ART-2026',
          date: '12/02/2026',
          validUntil: '12/02/2027',
          status: 'vigente',
          statusLabel: 'Presentado ante ART',
          fileSize: '2.9 MB',
          type: 'pdf',
          description: 'Nómina oficial de trabajadores expuestos a ruido, vibraciones y sustancias químicas, presentada formalmente ante Prevención ART.',
          legalBasis: 'Res. SRT 37/10 y 463/09'
        },
        {
          id: 'DOC-INF-02',
          title: 'Protocolo de Medición de Puesta a Tierra y Continuidad de las Masas',
          category: 'informes',
          categoryLabel: 'Relevamientos e Informes',
          code: 'PAT-RES-900-2026',
          date: '22/03/2026',
          validUntil: '22/03/2027',
          status: 'vigente',
          statusLabel: 'Conforme a Norma IRAM 2281',
          fileSize: '5.1 MB',
          type: 'pdf',
          description: 'Certificado de medición con telurímetro calibrado con certificado oficial INTI, croquis de jabalinas y valores en Ohms.',
          legalBasis: 'Res. SRT 900/15'
        },
        {
          id: 'DOC-INF-03',
          title: 'Informe Técnico de Visita Mensual de HyS (Octubre 2026)',
          category: 'informes',
          categoryLabel: 'Relevamientos e Informes',
          code: 'INF-VISITA-10-2026',
          date: '05/10/2026',
          validUntil: '05/11/2026',
          status: 'vigente',
          statusLabel: 'Al día',
          fileSize: '1.8 MB',
          type: 'pdf',
          description: 'Inspección en locación con registro fotográfico de condiciones, desvíos subsanados y copia de asiento en Libro de Actas rubricado.',
          legalBasis: 'Dec. 1338/96'
        },
        {
          id: 'DOC-MAT-01',
          title: 'Matriz IPER: Identificación de Peligros y Evaluación de Riesgos',
          category: 'matrices',
          categoryLabel: 'Hojas de Seguridad y Matrices',
          code: 'MAT-IPER-PETRO-2026',
          date: '18/01/2026',
          validUntil: '18/01/2027',
          status: 'vigente',
          statusLabel: 'Vigente / Revisión 4',
          fileSize: '3.6 MB',
          type: 'matrix',
          description: 'Matriz cuantitativa de probabilidad y severidad para 26 puestos de trabajo con jerarquía de controles operacionales.',
          legalBasis: 'Estándar ISO 45001 / IRAM 3800'
        },
        {
          id: 'DOC-MAT-02',
          title: 'Plan de Emergencia, Contingencias y Evacuación con Planos',
          category: 'matrices',
          categoryLabel: 'Hojas de Seguridad y Matrices',
          code: 'PLE-AÑELO-2026',
          date: '04/04/2026',
          validUntil: '04/04/2027',
          status: 'vigente',
          statusLabel: 'Vigente con Brigada Asignada',
          fileSize: '7.2 MB',
          type: 'pdf',
          description: 'Asignación de roles de comando, brigada contra incendio, plano de vías de escape, puntos de encuentro y red de comunicaciones.',
          legalBasis: 'Capítulo 18 Dec. 351/79'
        },
        {
          id: 'DOC-MAT-03',
          title: 'Compilado de Fichas de Datos de Seguridad (FDS / MSDS Químicos)',
          category: 'matrices',
          categoryLabel: 'Hojas de Seguridad y Matrices',
          code: 'FDS-QUIMICOS-2026',
          date: '10/05/2026',
          validUntil: '10/05/2027',
          status: 'vigente',
          statusLabel: 'SGA / GHS Conforme',
          fileSize: '6.4 MB',
          type: 'pdf',
          description: 'Hojas de seguridad bajo Sistema Globalmente Armonizado de lubricantes, solventes, combustibles y aditivos de perforación.',
          legalBasis: 'Res. SRT 801/15 (SGA)'
        }
      ],

      patagonica: [
        {
          id: 'DOC-PAT-01',
          title: 'Programa de Seguridad de Obra Civil — Res. SRT 51/97',
          category: 'programas',
          categoryLabel: 'Programas de Seguridad',
          code: 'PS-OBRA-CIVIL-2026',
          date: '12/02/2026',
          validUntil: '12/02/2027',
          status: 'vigente',
          statusLabel: 'Aprobado ART',
          fileSize: '3.1 MB',
          type: 'pdf',
          description: 'Programa presentado y visado ante La Segunda ART para demolición, excavación de bases y estructura de hormigón.',
          legalBasis: 'Dec. 911/96 · Res. SRT 51/97'
        },
        {
          id: 'DOC-PAT-02',
          title: 'Análisis de Trabajo Seguro (ATS) para Montaje de Andamios y Grúa Torre',
          category: 'programas',
          categoryLabel: 'Programas de Seguridad',
          code: 'ATS-ANDAM-2026',
          date: '05/03/2026',
          validUntil: '05/03/2027',
          status: 'vigente',
          statusLabel: 'Vigente',
          fileSize: '1.9 MB',
          type: 'pdf',
          description: 'Procedimiento de verificación previa de elementos de izaje, líneas de vida y arnés con amortiguador de caída.',
          legalBasis: 'Dec. 911/96'
        },
        {
          id: 'DOC-PAT-03',
          title: 'Actas de Capacitación en Obra: Prevención de Caídas y Uso de EPP',
          category: 'capacitaciones',
          categoryLabel: 'Capacitaciones',
          code: 'CAP-OBRA-2026',
          date: '20/04/2026',
          validUntil: '20/04/2027',
          status: 'vigente',
          statusLabel: '28 Operarios Capacitados',
          fileSize: '2.6 MB',
          type: 'pdf',
          description: 'Planillas oficiales firmadas con constancias de entrega de ropa de trabajo y protección craneana/calzado dieléctrico.',
          legalBasis: 'Capítulo 4 Dec. 911/96'
        },
        {
          id: 'DOC-PAT-04',
          title: 'Protocolo de Medición de Ruido Laboral en Frente de Obra',
          category: 'informes',
          categoryLabel: 'Relevamientos e Informes',
          code: 'MED-RUIDO-2026',
          date: '18/05/2026',
          validUntil: '18/05/2027',
          status: 'vigente',
          statusLabel: 'Res. 85/12 Conforme',
          fileSize: '4.2 MB',
          type: 'pdf',
          description: 'Medición con decibelímetro integrador clase 1 calibrado, niveles de presión sonora equivalente y delimitación de áreas de uso obligatorio de protección auditiva.',
          legalBasis: 'Res. SRT 85/12'
        },
        {
          id: 'DOC-PAT-05',
          title: 'Matriz de Peligros y Controles Operativos por Fase Constructiva',
          category: 'matrices',
          categoryLabel: 'Hojas de Seguridad y Matrices',
          code: 'MAT-OBRA-2026',
          date: '15/01/2026',
          validUntil: '15/01/2027',
          status: 'vigente',
          statusLabel: 'Vigente',
          fileSize: '2.8 MB',
          type: 'matrix',
          description: 'Matriz dinámica que contempla etapas de cimientos, mampostería, instalaciones eléctricas y terminaciones.',
          legalBasis: 'Dec. 911/96'
        }
      ],

      minera: [
        {
          id: 'DOC-MIN-01',
          title: 'Manual de Gestión y Programa de Seguridad en Operaciones Mineras',
          category: 'programas',
          categoryLabel: 'Programas de Seguridad',
          code: 'PS-MINA-2026-v4',
          date: '08/01/2026',
          validUntil: '08/01/2027',
          status: 'vigente',
          statusLabel: 'Aprobado Experta ART',
          fileSize: '5.8 MB',
          type: 'pdf',
          description: 'Plan de control operativo en cielo abierto, polvorín, talleres de mantenimiento de camiones fuera de ruta (hauler) y planta de lixiviación.',
          legalBasis: 'Ley 19.587 · Dec. 351/79 · Dec. 249/07 Minería'
        },
        {
          id: 'DOC-MIN-02',
          title: 'Programa Anual y Registro de Simulacro de Evacuación y Rescate en Mina',
          category: 'capacitaciones',
          categoryLabel: 'Capacitaciones',
          code: 'SIM-RESCATE-2026',
          date: '25/03/2026',
          validUntil: '25/03/2027',
          status: 'vigente',
          statusLabel: 'Simulacro Aprobado',
          fileSize: '6.4 MB',
          type: 'pdf',
          description: 'Informe técnico de evacuación de campamento y tajo abierto con brigada especializada de rescate minero y tiempos de respuesta.',
          legalBasis: 'Reglamento de Seguridad Minera'
        },
        {
          id: 'DOC-MIN-03',
          title: 'Protocolo de Iluminación y Ergonomía en Puestos de Control y Cabinas',
          category: 'informes',
          categoryLabel: 'Relevamientos e Informes',
          code: 'INF-ILUM-ERGO-2026',
          date: '14/06/2026',
          validUntil: '14/06/2027',
          status: 'vigente',
          statusLabel: 'Conforme Res. 84/12 y 886/15',
          fileSize: '4.7 MB',
          type: 'pdf',
          description: 'Estudio con luxómetro certificado y planilla ergonómica para operadores de maquinaria pesada y supervisores de sala de control.',
          legalBasis: 'Res. SRT 84/12 y Res. SRT 886/15'
        },
        {
          id: 'DOC-MIN-04',
          title: 'Matriz IPERC General de Mina y Hojas de Datos Químicos (Cianuro / Reactivos)',
          category: 'matrices',
          categoryLabel: 'Hojas de Seguridad y Matrices',
          code: 'MAT-IPERC-MINA-2026',
          date: '20/01/2026',
          validUntil: '20/01/2027',
          status: 'vigente',
          statusLabel: 'Revisión Anual Aprobada',
          fileSize: '8.1 MB',
          type: 'matrix',
          description: 'Matriz de riesgo crítico, procedimientos de manipulación segura de sustancias químicas peligrosas y protocolo de antídotos.',
          legalBasis: 'Código Internacional de Manejo de Cianuro / Dec. 249/07'
        }
      ]
    };

    return {
      getDocuments: function (companyId, options) {
        options = options || {};
        var list = REPOSITORY[companyId] || [];

        // Filtrar por categoría
        if (options.category && options.category !== 'todos') {
          list = list.filter(function (doc) {
            return doc.category === options.category;
          });
        }

        // Filtrar por término de búsqueda
        if (options.query) {
          var q = options.query.trim().toLowerCase();
          list = list.filter(function (doc) {
            return doc.title.toLowerCase().indexOf(q) >= 0 ||
                   doc.code.toLowerCase().indexOf(q) >= 0 ||
                   doc.description.toLowerCase().indexOf(q) >= 0 ||
                   doc.legalBasis.toLowerCase().indexOf(q) >= 0;
          });
        }

        // Filtrar por estado
        if (options.status && options.status !== 'todos') {
          list = list.filter(function (doc) {
            return doc.status === options.status;
          });
        }

        return Promise.resolve(list);
      },

      getDocumentById: function (companyId, docId) {
        var list = REPOSITORY[companyId] || [];
        var doc = list.find(function (d) { return d.id === docId; });
        return Promise.resolve(doc || null);
      },

      getCategoriesCount: function (companyId) {
        var list = REPOSITORY[companyId] || [];
        var counts = {
          todos: list.length,
          programas: 0,
          capacitaciones: 0,
          informes: 0,
          matrices: 0
        };
        list.forEach(function (doc) {
          if (counts[doc.category] !== undefined) counts[doc.category]++;
        });
        return counts;
      },

      downloadDocument: function (doc, companyName) {
        // Genera un archivo con formato técnico real descargable
        var fileName = (doc.code + '_' + doc.title.replace(/[^a-zA-Z0-9]/g, '_')).slice(0, 50) + '.pdf';
        
        var content = 
          "=======================================================================\r\n" +
          "SEGURIDAD PRL · CONSULTORA DE HIGIENE Y SEGURIDAD LABORAL\r\n" +
          "Portal de Clientes Oficial · Copia Auténtica Digital\r\n" +
          "=======================================================================\r\n\r\n" +
          "EMPRESA CLIENTE: " + companyName + "\r\n" +
          "DOCUMENTO: " + doc.title + "\r\n" +
          "CÓDIGO OFICIAL: " + doc.code + "\r\n" +
          "CATEGORÍA: " + doc.categoryLabel + "\r\n" +
          "FECHA DE EMISIÓN: " + doc.date + "\r\n" +
          "VALIDEZ HASTA: " + doc.validUntil + "\r\n" +
          "ESTADO ANTE ORGANISMOS: " + doc.statusLabel + "\r\n" +
          "MARCO NORMATIVO: " + doc.legalBasis + "\r\n\r\n" +
          "RESUMEN TÉCNICO Y ALCANCE:\r\n" +
          doc.description + "\r\n\r\n" +
          "-----------------------------------------------------------------------\r\n" +
          "PROFESIONAL RESPONSABLE TÉCNICO:\r\n" +
          "Lic. Carlos Almonacid · Matrícula Profesional 4821\r\n" +
          "Especialista en Prevención de Riesgos Laborales\r\n" +
          "Firma y sello digital registrado ante la Superintendencia de Riesgos del Trabajo (SRT)\r\n" +
          "-----------------------------------------------------------------------\r\n" +
          "Descargado desde: Portal de Clientes SEGURIDAD PRL (www.seguridadprl.com.ar)\r\n" +
          "Fecha de descarga: " + new Date().toLocaleString() + "\r\n";

        var blob = new Blob([content], { type: 'application/pdf;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      }
    };
  })();

  /* ===================================================================
     3. CONTROLADOR DE INTERFAZ (PortalUI)
     =================================================================== */
  var PortalUI = {
    init: function () {
      this.cacheDOM();
      this.bindEvents();
      this.checkInitialSession();
    },

    cacheDOM: function () {
      this.loginView = document.getElementById('portal-login-view');
      this.dashboardView = document.getElementById('portal-dashboard-view');
      this.loginForm = document.getElementById('login-form');
      this.emailInput = document.getElementById('login-email');
      this.passInput = document.getElementById('login-pass');
      this.loginError = document.getElementById('login-error');
      this.btnTogglePass = document.getElementById('btn-toggle-pass');

      // Dashboard header & user details
      this.headerUserMenu = document.getElementById('header-user-menu');
      this.userNameEl = document.getElementById('user-name');
      this.userCompanyEl = document.getElementById('user-company');
      this.userAvatarEl = document.getElementById('user-avatar');
      this.btnLogout = document.getElementById('btn-logout');

      // Dashboard banner elements
      this.clientCompanyNameEl = document.getElementById('client-company-name');
      this.clientMetaEl = document.getElementById('client-meta');
      this.consultantNameEl = document.getElementById('consultant-name');
      this.consultantMatEl = document.getElementById('consultant-mat');
      this.consultantWaBtn = document.getElementById('btn-consultant-wa');
      this.consultantMailBtn = document.getElementById('btn-consultant-mail');

      // Metrics
      this.metricDocsCountEl = document.getElementById('metric-docs-count');
      this.metricHoursEl = document.getElementById('metric-hours');

      // Document explorer
      this.docsList = document.getElementById('docs-list');
      this.docsSearchInput = document.getElementById('docs-search-input');
      this.categoryPills = document.querySelectorAll('.btn-pill');
      this.pillsCountEls = {
        todos: document.getElementById('count-todos'),
        programas: document.getElementById('count-programas'),
        capacitaciones: document.getElementById('count-capacitaciones'),
        informes: document.getElementById('count-informes'),
        matrices: document.getElementById('count-matrices')
      };

      // Modal preview
      this.modalPreview = document.getElementById('modal-preview');
      this.previewTitle = document.getElementById('preview-doc-title');
      this.previewContent = document.getElementById('preview-doc-content');
      this.previewDownloadBtn = document.getElementById('btn-preview-download');
      this.previewCloseBtns = document.querySelectorAll('[data-close-preview]');

      // Toast
      this.toastEl = document.getElementById('portal-toast');
      this.toastMsg = document.getElementById('toast-msg');

      this.currentFilter = {
        category: 'todos',
        query: '',
        status: 'todos'
      };

      this.activePreviewDoc = null;
    },

    bindEvents: function () {
      var self = this;

      // Submit de login
      if (this.loginForm) {
        this.loginForm.addEventListener('submit', function (e) {
          e.preventDefault();
          self.handleLogin();
        });
      }

      // Ver/ocultar contraseña
      if (this.btnTogglePass) {
        this.btnTogglePass.addEventListener('click', function () {
          var isPass = self.passInput.type === 'password';
          self.passInput.type = isPass ? 'text' : 'password';
          self.btnTogglePass.innerHTML = isPass 
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        });
      }

      // Botones de auto-llenado demo
      document.querySelectorAll('[data-demo-company]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var companyKey = btn.getAttribute('data-demo-company');
          var accounts = PortalAuth.getDemoAccounts();
          var acc = accounts.find(function (a) { return a.id === companyKey; });
          if (acc) {
            self.emailInput.value = acc.email;
            self.passInput.value = acc.pass;
            self.showToast('Credenciales cargadas: ' + acc.companyName);
            self.handleLogin();
          }
        });
      });

      // Logout
      if (this.btnLogout) {
        this.btnLogout.addEventListener('click', function () {
          PortalAuth.logout().then(function () {
            self.showLoginView();
            self.showToast('Sesión cerrada correctamente');
          });
        });
      }

      // Filtro de categorías (Pastillas)
      this.categoryPills.forEach(function (pill) {
        pill.addEventListener('click', function () {
          self.categoryPills.forEach(function (p) { p.classList.remove('is-active'); });
          pill.classList.add('is-active');
          self.currentFilter.category = pill.getAttribute('data-category');
          self.renderDocuments();
        });
      });

      // Búsqueda en tiempo real
      if (this.docsSearchInput) {
        this.docsSearchInput.addEventListener('input', function (e) {
          self.currentFilter.query = e.target.value;
          self.renderDocuments();
        });
      }

      // Cierre de modal de previsualización
      this.previewCloseBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.closePreviewModal();
        });
      });

      if (this.modalPreview) {
        this.modalPreview.addEventListener('click', function (e) {
          if (e.target === self.modalPreview) self.closePreviewModal();
        });
      }

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') self.closePreviewModal();
      });

      // Descargar desde el modal
      if (this.previewDownloadBtn) {
        this.previewDownloadBtn.addEventListener('click', function () {
          if (self.activePreviewDoc) {
            var user = PortalAuth.getCurrentUser();
            PortalDocs.downloadDocument(self.activePreviewDoc, user ? user.companyName : 'Empresa');
            self.showToast('Descargando: ' + self.activePreviewDoc.code + '.pdf');
          }
        });
      }
    },

    checkInitialSession: function () {
      var user = PortalAuth.getCurrentUser();
      if (user) {
        this.showDashboardView(user);
      } else {
        this.showLoginView();
      }
    },

    handleLogin: function () {
      var self = this;
      var email = this.emailInput.value;
      var pass = this.passInput.value;

      this.loginError.classList.remove('is-visible');
      var submitBtn = this.loginForm.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Verificando credenciales...';

      PortalAuth.login(email, pass)
        .then(function (res) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
          self.showDashboardView(res.user);
          self.showToast('¡Bienvenido, ' + res.user.userName + '!');
        })
        .catch(function (err) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
          self.loginError.textContent = err.message || 'Error al iniciar sesión';
          self.loginError.classList.add('is-visible');
        });
    },

    showLoginView: function () {
      if (this.loginView) this.loginView.style.display = 'flex';
      if (this.dashboardView) this.dashboardView.style.display = 'none';
      if (this.headerUserMenu) this.headerUserMenu.style.display = 'none';
      if (this.loginError) this.loginError.classList.remove('is-visible');
    },

    showDashboardView: function (user) {
      if (this.loginView) this.loginView.style.display = 'none';
      if (this.dashboardView) this.dashboardView.style.display = 'block';
      if (this.headerUserMenu) this.headerUserMenu.style.display = 'flex';

      // Población de datos de usuario
      if (this.userNameEl) this.userNameEl.textContent = user.userName;
      if (this.userCompanyEl) this.userCompanyEl.textContent = user.companyName;
      if (this.userAvatarEl) this.userAvatarEl.textContent = user.userName.charAt(0);

      // Banner de empresa
      if (this.clientCompanyNameEl) this.clientCompanyNameEl.textContent = user.companyName;
      if (this.clientMetaEl) {
        this.clientMetaEl.textContent = user.industry + ' · Dotación: ' + user.staffCount + ' trabajadores · Sede: ' + user.location + ' · ' + user.art;
      }

      // Consultor asignado
      if (this.consultantNameEl) this.consultantNameEl.textContent = user.consultant.name;
      if (this.consultantMatEl) this.consultantMatEl.textContent = user.consultant.matricula;
      if (this.consultantWaBtn) {
        var cleanPhone = user.consultant.phone.replace(/[^0-9]/g, '');
        this.consultantWaBtn.href = 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(user.consultant.waText);
        this.consultantWaBtn.target = '_blank';
        this.consultantWaBtn.rel = 'noopener';
      }
      if (this.consultantMailBtn) {
        this.consultantMailBtn.href = 'mailto:' + user.consultant.email + '?subject=' + encodeURIComponent('Consulta Portal Clientes · ' + user.companyName);
      }

      // Horas profesionales
      if (this.metricHoursEl) this.metricHoursEl.textContent = user.serviceHours.split(' ')[0] || '24';

      // Actualizar contadores de categorías
      var counts = PortalDocs.getCategoriesCount(user.id);
      if (this.pillsCountEls.todos) this.pillsCountEls.todos.textContent = counts.todos;
      if (this.pillsCountEls.programas) this.pillsCountEls.programas.textContent = counts.programas;
      if (this.pillsCountEls.capacitaciones) this.pillsCountEls.capacitaciones.textContent = counts.capacitaciones;
      if (this.pillsCountEls.informes) this.pillsCountEls.informes.textContent = counts.informes;
      if (this.pillsCountEls.matrices) this.pillsCountEls.matrices.textContent = counts.matrices;
      if (this.metricDocsCountEl) this.metricDocsCountEl.textContent = counts.todos + ' / ' + counts.todos;

      // Renderizar listado de documentos
      this.renderDocuments();
    },

    renderDocuments: function () {
      var self = this;
      var user = PortalAuth.getCurrentUser();
      if (!user) return;

      PortalDocs.getDocuments(user.id, this.currentFilter).then(function (docs) {
        if (!docs.length) {
          self.docsList.innerHTML = 
            '<div class="docs-empty">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
            '<h3>No se encontraron documentos</h3>' +
            '<p>Probá cambiando la categoría o usando otros términos en el buscador.</p>' +
            '</div>';
          return;
        }

        var html = docs.map(function (doc) {
          var typeClass = doc.type === 'pdf' ? 'doc-card__type-icon--pdf' : doc.type === 'matrix' ? 'doc-card__type-icon--matrix' : 'doc-card__type-icon--sheet';
          var typeIconSvg = doc.type === 'pdf' 
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6M9 17h4"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>';

          return (
            '<article class="doc-card">' +
              '<div class="doc-card__main">' +
                '<div class="doc-card__type-icon ' + typeClass + '">' + typeIconSvg + '</div>' +
                '<div class="doc-card__info">' +
                  '<div class="doc-card__badges">' +
                    '<span class="badge-cat">' + doc.categoryLabel + '</span>' +
                    '<span class="badge-status badge-status--vigente">● ' + doc.statusLabel + '</span>' +
                  '</div>' +
                  '<h3 class="doc-card__title">' + doc.title + '</h3>' +
                  '<div class="doc-card__meta">' +
                    '<span><strong>Código:</strong> ' + doc.code + '</span>' +
                    '<span><strong>Emisión:</strong> ' + doc.date + '</span>' +
                    '<span><strong>Validez:</strong> ' + doc.validUntil + '</span>' +
                    '<span><strong>Tamaño:</strong> ' + doc.fileSize + '</span>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="doc-card__actions">' +
                '<button type="button" class="btn-doc-action btn-doc-action--preview" data-preview-id="' + doc.id + '">' +
                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
                  'Previsualizar' +
                '</button>' +
                '<button type="button" class="btn-doc-action btn-doc-action--download" data-download-id="' + doc.id + '">' +
                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
                  'Descargar' +
                '</button>' +
              '</div>' +
            '</article>'
          );
        }).join('');

        self.docsList.innerHTML = html;

        // Binds de los botones recién renderizados
        self.docsList.querySelectorAll('[data-preview-id]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var docId = btn.getAttribute('data-preview-id');
            self.openPreviewModal(docId);
          });
        });

        self.docsList.querySelectorAll('[data-download-id]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var docId = btn.getAttribute('data-download-id');
            PortalDocs.getDocumentById(user.id, docId).then(function (doc) {
              if (doc) {
                PortalDocs.downloadDocument(doc, user.companyName);
                self.showToast('Descargando: ' + doc.code + '.pdf');
              }
            });
          });
        });
      });
    },

    openPreviewModal: function (docId) {
      var self = this;
      var user = PortalAuth.getCurrentUser();
      if (!user) return;

      PortalDocs.getDocumentById(user.id, docId).then(function (doc) {
        if (!doc) return;
        self.activePreviewDoc = doc;
        self.previewTitle.textContent = doc.title;

        self.previewContent.innerHTML = 
          '<div class="preview-sheet">' +
            '<div class="preview-sheet__header">' +
              '<div>' +
                '<div class="preview-sheet__brand">SEGURIDAD<span>PRL</span></div>' +
                '<p style="margin:0;font-size:.78rem;color:#64748b;font-weight:600;">PREVENCIÓN DE RIESGOS LABORALES · REGISTRO PROFESIONAL</p>' +
              '</div>' +
              '<div class="preview-sheet__stamp">DOCUMENTO VÁLIDO ANTE ART<br>CÓDIGO: ' + doc.code + '</div>' +
            '</div>' +
            '<h2>' + doc.title + '</h2>' +
            '<p style="font-size:.9rem;color:#475569;margin-bottom:1.2rem;">' + doc.description + '</p>' +
            '<table>' +
              '<tr><th>Razón Social</th><td>' + user.companyName + '</td></tr>' +
              '<tr><th>Ubicación / Operación</th><td>' + user.location + '</td></tr>' +
              '<tr><th>Aseguradora de Riesgos del Trabajo</th><td>' + user.art + '</td></tr>' +
              '<tr><th>Marco Legal de Aplicación</th><td>' + doc.legalBasis + '</td></tr>' +
              '<tr><th>Fecha de Homologación</th><td>' + doc.date + ' (Vence: ' + doc.validUntil + ')</td></tr>' +
              '<tr><th>Estado de Vigencia</th><td><b style="color:#059669;">' + doc.statusLabel + '</b></td></tr>' +
            '</table>' +
            '<div style="margin-top:1.5rem;font-size:.84rem;color:#334155;background:#f8fafc;padding:1rem;border-radius:6px;border-left:4px solid #006eff;">' +
              '<strong>DICTAMEN TÉCNICO:</strong> La presente documentación cumple íntegramente con los requisitos técnicos y documentales exigidos por la legislación laboral nacional y la Superintendencia de Riesgos del Trabajo (SRT).' +
            '</div>' +
            '<div class="preview-sheet__signatures">' +
              '<div class="preview-sheet__sig">' +
                '____________________________________' +
                '<strong>' + user.userName + '</strong>' +
                '<span>' + user.userRole + ' · ' + user.companyName + '</span>' +
              '</div>' +
              '<div class="preview-sheet__sig">' +
                '____________________________________' +
                '<strong>' + user.consultant.name + '</strong>' +
                '<span>' + user.consultant.title + '<br>' + user.consultant.matricula + '</span>' +
              '</div>' +
            '</div>' +
          '</div>';

        self.modalPreview.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      });
    },

    closePreviewModal: function () {
      if (this.modalPreview) this.modalPreview.classList.remove('is-open');
      document.body.style.overflow = '';
      this.activePreviewDoc = null;
    },

    showToast: function (msg) {
      var self = this;
      if (!this.toastEl) return;
      this.toastMsg.textContent = msg;
      this.toastEl.classList.add('is-active');
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(function () {
        self.toastEl.classList.remove('is-active');
      }, 3500);
    }
  };

  // Inicialización al cargar el DOM
  document.addEventListener('DOMContentLoaded', function () {
    PortalUI.init();
  });

  // Exportar para integración externa si se requiere
  window.PRL = window.PRL || {};
  window.PRL.PortalAuth = PortalAuth;
  window.PRL.PortalDocs = PortalDocs;
  window.PRL.PortalUI = PortalUI;

})(window, document);
