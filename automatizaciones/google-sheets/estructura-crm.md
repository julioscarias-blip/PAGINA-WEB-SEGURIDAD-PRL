# Estructura del CRM Liviano en Google Sheets · SEGURIDAD PRL

Este documento define la arquitectura, columnas, validación de datos, estados de embudo y fórmulas sugeridas para operar el CRM comercial de **SEGURIDAD PRL** sobre Google Sheets.

---

## 1. Hoja Principal: `Leads`

| Columna | Nombre | Tipo | Descripción | Validación / Formato |
| :--- | :--- | :--- | :--- | :--- |
| **A** | Fecha/Hora | Datetime | Marca temporal de recepción del lead | `YYYY-MM-DD HH:mm:ss` |
| **B** | Lead ID | String | Identificador único del lead (ej. `PRL-20261005-AB12`) | Formato de texto simple |
| **C** | Origen | Enum | Canal de entrada (`sitio-web`, `landing`, `diagnostico`) | Lista desplegable |
| **D** | Nombre | Text | Nombre y apellido del contacto | Texto |
| **E** | Empresa / Obra | Text | Razón social o nombre del proyecto/obra | Texto |
| **F** | Cargo | Text | Puesto (ej. Gerente de Planta, Jefe de Obra) | Texto |
| **G** | Email | Text | Correo electrónico de contacto | Formato de Email |
| **H** | Teléfono / WA | Text | WhatsApp normalizado (E.164 Argentina) | Formato de Teléfono |
| **I** | Rubro | Enum | Sector industrial de la empresa | Lista desplegable (Petróleo, Minería, etc.) |
| **J** | Localidad | Text | Ciudad u origen de la consulta | Texto |
| **K** | Mensaje / Consulta | Text | Texto libre ingresado por el usuario | Texto multilínea |
| **L** | Score Diag | Integer | Puntaje de exposición del Diagnóstico (0-100) | Número entero |
| **M** | Nivel Riesgo | Enum | Semáforo de riesgo (`Riesgo Bajo`, `Riesgo Medio`, `Riesgo Crítico`) | Formato condicional (Verde, Amarillo, Rojo) |
| **N** | Servicios Sugeridos | Text | Lista de servicios prioritarios recomendados | Texto |
| **O** | UTM Source | Text | Fuente del tráfico (ej. `linkedin`, `google_ads`) | Texto |
| **P** | UTM Campaign | Text | Campaña publicitaria asociada | Texto |
| **Q** | Estado | Enum | Estado actual en el embudo comercial | Lista desplegable (Ver Sección 2) |
| **R** | Responsable | Text | Consultor comercial asignado | Lista desplegable |
| **S** | Notas / Seguimiento | Text | Historial de llamadas o comentarios | Texto multilínea |

---

## 2. Pipeline Comercial (Estados en Columna Q)

1. **Nuevo** *(Verde Claro)*: Lead recién ingresado, pendiente de primer contacto (Meta: responder en <15 min).
2. **Contactado** *(Azul)*: Se envió mensaje de WhatsApp o realizó llamada inicial.
3. **Reunión / Relevamiento** *(Amarillo)*: Cita agendada para evaluar requerimientos de la obra/planta.
4. **Propuesta Enviada** *(Naranja)*: Cotización de servicios enviada por mail/WhatsApp.
5. **Ganado / Cliente** *(Verde Oscuro)*: Contrato o propuesta aceptada.
6. **Perdido / Sin Interés** *(Gris)*: Lead descartado o sin presupuesto.

---

## 3. Vistas y Filtros Recomendados

- **Vista "Alertas Críticas"**: Filtro con `Nivel Riesgo = Riesgo Crítico` y `Estado = Nuevo` para atención prioritaria inmediata.
- **Vista "Embudo Activo"**: Filtro con `Estado <> Ganado` y `Estado <> Perdido` para gestión diaria del equipo comercial.

---

## 4. Fórmulas Útiles para Reporte Gerencial

- **Total de Leads Mensuales**:
  `=COUNTA(A2:A)`
- **Tasa de Conversión a Cliente**:
  `=COUNTIF(Q2:Q; "Ganado / Cliente") / COUNTA(A2:A)`
- **Distribución por Rubro (Petróleo vs Obra Civil vs Otros)**:
  `=COUNTIF(I2:I; "Petróleo y gas")`
