import { Controller, Get } from '@nestjs/common';
import { ZONA_HORARIA } from '@sgt/shared-types';

@Controller('salud')
export class SaludController {
  /** Verificación de disponibilidad. Devuelve la hora del servidor, que es la que vale para las marcaciones (ADR-005). */
  @Get()
  obtener() {
    return {
      estado: 'ok',
      horaServidor: new Date().toISOString(),
      zonaHoraria: ZONA_HORARIA,
    };
  }
}
