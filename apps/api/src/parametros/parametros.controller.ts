import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import type { ValorParametro } from '@sgt/shared-types';
import { IsDefined, IsString, Matches } from 'class-validator';
import type { UsuarioGuardado } from '../almacen/modelos';
import { Roles, UsuarioActual } from '../comun/decoradores';
import { esFechaValida } from '../comun/fechas';
import { ParametrosService } from './parametros.service';

export class NuevoParametroDto {
  @IsString()
  clave: string;

  @IsDefined({ message: 'Falta el valor.' })
  valor: ValorParametro;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener el formato YYYY-MM-DD.' })
  vigenteDesde: string;
}

@Controller('parametros')
export class ParametrosController {
  constructor(private readonly parametros: ParametrosService) {}

  /** Valores vigentes en una fecha (por defecto hoy). Todos los usuarios los necesitan para ver sus horas. */
  @Get()
  vigentes(@Query('fecha') fecha?: string) {
    if (fecha && !esFechaValida(fecha)) throw new BadRequestException('La fecha debe tener el formato YYYY-MM-DD.');
    return this.parametros.vigentes(fecha);
  }

  @Roles('COORDINADOR')
  @Get('historial')
  historial() {
    return this.parametros.historial();
  }

  @Roles('COORDINADOR')
  @Post()
  crear(@Body() dto: NuevoParametroDto, @UsuarioActual() actor: UsuarioGuardado) {
    if (!esFechaValida(dto.vigenteDesde)) throw new BadRequestException('La fecha no existe.');
    return this.parametros.crear(dto.clave, dto.valor, dto.vigenteDesde, actor.id);
  }
}
