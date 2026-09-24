import { BadRequestException, Body, ConflictException, Controller, Get, HttpCode, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import type { TipoTurnoDto } from '@sgt/shared-types';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { AlmacenService } from '../almacen/almacen.service';
import type { TipoTurnoGuardado, UsuarioGuardado } from '../almacen/modelos';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { Roles, UsuarioActual } from '../comun/decoradores';

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export class TipoTurnoEntradaDto {
  @Matches(/^[A-Z0-9]{1,3}$/, { message: 'El código debe tener de 1 a 3 letras mayúsculas o números.' })
  codigo: string;

  @IsString()
  @IsNotEmpty({ message: 'Escribe el nombre del turno.' })
  @MaxLength(40)
  nombre: string;

  @Matches(HORA, { message: 'La hora de inicio debe tener el formato HH:mm.' })
  horaInicio: string;

  @Matches(HORA, { message: 'La hora de fin debe tener el formato HH:mm.' })
  horaFin: string;

  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'El color debe ser hexadecimal, ej. #f5c451.' })
  color: string;
}

export class TipoTurnoEdicionDto {
  @IsOptional() @Matches(/^[A-Z0-9]{1,3}$/, { message: 'El código debe tener de 1 a 3 letras mayúsculas o números.' }) codigo?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(40) nombre?: string;
  @IsOptional() @Matches(HORA, { message: 'La hora de inicio debe tener el formato HH:mm.' }) horaInicio?: string;
  @IsOptional() @Matches(HORA, { message: 'La hora de fin debe tener el formato HH:mm.' }) horaFin?: string;
  @IsOptional() @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'El color debe ser hexadecimal, ej. #f5c451.' }) color?: string;
}

const aDto = (t: TipoTurnoGuardado): TipoTurnoDto => ({ ...t });

/** Catálogo de tipos de turno (RF-CUA-01). No se borran: se desactivan, porque el cuadro histórico los usa. */
@Controller('tipos-turno')
export class TiposTurnoController {
  constructor(
    private readonly almacen: AlmacenService,
    private readonly auditoria: AuditoriaService,
  ) {}

  @Get()
  listar(@Query('incluirInactivos') incluirInactivos?: string) {
    return this.almacen.tiposTurno
      .filtrar((t) => incluirInactivos === 'true' || t.activo)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio) || a.codigo.localeCompare(b.codigo))
      .map(aDto);
  }

  @Roles('COORDINADOR')
  @Post()
  async crear(@Body() dto: TipoTurnoEntradaDto, @UsuarioActual() actor: UsuarioGuardado) {
    this.validar(dto.codigo, dto.horaInicio, dto.horaFin);
    const t = await this.almacen.tiposTurno.insertar({ id: randomUUID(), ...dto, activo: true });
    await this.auditoria.registrar({ actorId: actor.id, accion: 'TIPO_TURNO_CREADO', entidad: 'tipo_turno', entidadId: t.id, despues: t });
    return aDto(t);
  }

  @Roles('COORDINADOR')
  @Patch(':id')
  async editar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: TipoTurnoEdicionDto, @UsuarioActual() actor: UsuarioGuardado) {
    const antes = this.existente(id);
    const nuevo = { ...antes, ...dto };
    this.validar(nuevo.codigo, nuevo.horaInicio, nuevo.horaFin, id);
    const t = await this.almacen.tiposTurno.actualizar(id, () => nuevo);
    await this.auditoria.registrar({ actorId: actor.id, accion: 'TIPO_TURNO_EDITADO', entidad: 'tipo_turno', entidadId: id, antes, despues: t });
    return aDto(t!);
  }

  @Roles('COORDINADOR')
  @Post(':id/desactivar')
  @HttpCode(200)
  desactivar(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() actor: UsuarioGuardado) {
    return this.cambiarActivo(id, false, actor.id);
  }

  @Roles('COORDINADOR')
  @Post(':id/activar')
  @HttpCode(200)
  activar(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() actor: UsuarioGuardado) {
    return this.cambiarActivo(id, true, actor.id);
  }

  private async cambiarActivo(id: string, activo: boolean, actorId: string) {
    this.existente(id);
    const t = await this.almacen.tiposTurno.actualizar(id, (x) => ({ ...x, activo }));
    await this.auditoria.registrar({ actorId, accion: activo ? 'TIPO_TURNO_ACTIVADO' : 'TIPO_TURNO_DESACTIVADO', entidad: 'tipo_turno', entidadId: id });
    return aDto(t!);
  }

  private existente(id: string) {
    const t = this.almacen.tiposTurno.obtener(id);
    if (!t) throw new NotFoundException('El tipo de turno no existe.');
    return t;
  }

  private validar(codigo: string, inicio: string, fin: string, excepto?: string) {
    if (inicio === fin) throw new BadRequestException('La hora de inicio y la de fin no pueden ser iguales.');
    if (this.almacen.tiposTurno.buscar((t) => t.codigo === codigo && t.id !== excepto)) {
      throw new ConflictException(`Ya existe un tipo de turno con el código ${codigo}.`);
    }
  }
}
