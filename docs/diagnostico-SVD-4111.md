# Diagnóstico — SVD-4111

## Datos del ticket

| Campo | Valor |
|---|---|
| `id` | SVD-4111 |
| `titulo` | Corte de grabación repetido en cámara 3 |
| `descripcion` | La grabación de la cámara 3 se corta cada noche sobre la misma hora en Sala de servidores. |
| `sistema_afectado` | CCTV / videovigilancia |
| `reportado_por` | Recepción cliente |
| `zona` | Sala de servidores |
| `fecha` | 2026-09-01 |
| `estado` | abierto |

## Diagnóstico

El corte se repite todas las noches a la misma hora, lo que apunta a una causa
programada y recurrente antes que a un fallo puntual: un job de backup o
mantenimiento que satura la red o el almacenamiento del NVR, una reinicialización
automática del grabador, o un conflicto de ancho de banda con otro proceso
nocturno. El patrón horario constante descarta un fallo físico intermitente y
sugiere revisar la configuración/logs del NVR y cualquier tarea programada que
coincida con la hora del corte. Mientras dure, la cámara 3 deja sin cobertura de
vídeo la Sala de servidores durante esa ventana horaria cada noche.

## Prioridad sugerida: Alta

**Justificación:** no es un incidente en curso que requiera respuesta inmediata,
pero es un patrón recurrente y predecible que deja una zona sensible (sala de
servidores) sin vigilancia grabada todas las noches, por lo que debe resolverse
pronto y no como algo de baja urgencia.

## Categoría sugerida: CCTV / videovigilancia

**Justificación:** el ticket ya reporta un fallo directo de grabación de una
cámara, que es exactamente el sistema `sistema_afectado` indicado en el registro
original.
