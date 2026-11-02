# Frutos del Bosque · Vivero · Patagonia

Catálogo web público del vivero frutal **Frutos del Bosque**, independiente del catálogo de Arelauquen.

## Qué incluye

- Portada adaptable a celular y computadora, categorías, buscador y fichas de plantas.
- Carrito con cantidades y subtotal, preparado para pedir por WhatsApp.
- Consulta de Airtable mediante una función privada en Netlify; sin clave en el navegador ni en GitHub.
- Publicación **solo** de lotes autorizados en Airtable. El inventario interno nunca se entrega al navegador.

## Inventario conectado

**Base Airtable:** Frutos del Bosque — Vivero Frutal `appahdL1aANYpyxk5`
**Tabla:** Inventario y seguimiento `tblTLVGFoUwg6mI8O`

La función `netlify/functions/catalogo.mjs` publica un lote únicamente cuando cumple **todas** estas condiciones:
1. `Estado comercial` = **Disponible**.
2. `Visible en catálogo` = marcado.
3. `Cantidad disponible para venta` mayor que cero.
4. `Precio confirmado ARS` mayor que cero.
5. Tiene `Foto real` cargada (no publica fotos de referencia con licencia sin verificar).

Utiliza `Nombre para catálogo`, `Descripción corta para catálogo` y `Grupo`. No publica notas internas, origen de stock, ubicación ni cantidades en crecimiento.

**Estado inicial:** en la base existen 25 lotes de seguimiento, pero ninguno está habilitado para la venta. El sitio mostrará una portada y un aviso de próxima disponibilidad, no inventará productos ni precios.

## Pasos de instalación en Netlify

1. Abrir [Netlify](https://app.netlify.com/) y elegir **Add new project → Import an existing project → GitHub**.
2. Seleccionar `jeanstudler/frutos-del-bosque-catalogo`, rama `main`.
3. Configurar **Publish directory**: `public`. Build command: vacío. Functions: `netlify/functions` (configurado también en `netlify.toml`).
4. Crear una variable de entorno en Netlify llamada **`AIRTABLE_TOKEN`** con un token personal Airtable de **solo lectura** (`data.records:read`) y acceso limitado **únicamente** a la base `Frutos del Bosque — Vivero Frutal`. Puede generarse en https://airtable.com/create/tokens.
5. Desplegar. Visitar `https://TU-SITIO.netlify.app/api/catalogo`: debe responder `{"ok":true,"items":[]}` inicialmente (sin registros aprobados). Si devuelve error de configuración, revisar la variable en Netlify y redeploy.
6. **No subir a GitHub ni enviar por chat el token de Airtable**.

## WhatsApp y pedidos

En `public/pedido-config.js`, completar `window.FRUTOS_WHATSAPP` con **el número del vivero frutal** en formato internacional, sin +, espacios, 0 ni 15. Ejemplo de formato argentino: `549` + código de área + número móvil. **No usar automáticamente el número de Arelauquen**: son emprendimientos separados.

Hasta definir ese número, el carrito permite **copiar el pedido** y el botón de WhatsApp queda deshabilitado. El usuario debe confirmar y enviar el mensaje; el sitio no registra reservas ni descuenta automáticamente inventario.

## Fotografías

Las fotos de las fichas vienen de `Foto real` en Airtable. No se ofrecen fotografías genéricas como si fueran ejemplares del vivero. La portada tiene una ilustración original en SVG; cuando haya una buena fotografía panorámica propia puede sustituirse.

## Actualizaciones

La web consulta `/api/catalogo` al abrirse, al pulsar “Actualizar” y cada 5 minutos mientras está abierta; la función usa caché de aproximadamente 1 minuto. Cambios de precios, cantidades o visibilidad hechos en Airtable no requieren modificar archivos de GitHub.

## Privacidad y alcance

El sitio es **público para quien conozca su URL**. No hay cuentas, pago en línea ni contraseñas. Los datos internos permanecen en Airtable; solo se devuelven campos autorizados de lotes habilitados.
