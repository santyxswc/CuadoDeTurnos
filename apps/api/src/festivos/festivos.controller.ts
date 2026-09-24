import { BadRequestException, Body, ConflictException, Controller, Delete, Get, HttpCode, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { festivosColombia } from '@sgt/rules-engine';
import type { FestivoDto } from '@sgt/shared-types';
import { IsInt, IsNotEmpty, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { AlmacenService } from '../almacen/almacen.service';
import type { UsuarioGuardado } from '../almacen/modelos';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { Roles, UsuarioActual } from '../comun/decoradores';
import { esFechaValida } from '../comun/fechas';

export class FestivoEntradaDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener el formato YYYY-MM-DD.' })
  fecha: string;

  @IsString()
  @IsNotEmpty({ message: 'Escribe el nombre del festivo.' })
  @MaxLength(80)
  nombre: string;
}

export class PrecargarDto {
  @IsInt()
  @Min(2020)
  @Max(2100)
  anio: number;
}

/** Calendario de festivos editable (RF-ADM-02). */
@Controller('festivos')
export class FestivosController {
  constructor(
    private readonly almacen: AlmacenService,
    private readonly auditoria: AuditoriaService,
  ) {}

  @Get()
  listar(@Query('anio') anio?: string): FestivoDto[] {
    return this.almacen.festivos
      .filtrar((f) => !anio || f.fecha.startsWith(`${anio}-`))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map(({ fecha, nombre }) => ({ fecha, nombre }));
  }

  @Roles('COORDINADOR')
  @Post()
  async crear(@Body() dto: FestivoEntradaDto, @UsuarioActual() actor: UsuarioGuardado) {
    if (!esFechaValida(dto.fecha)) throw new BadRequestException('La fecha no existe.');
    if (this.almacen.festivos.obtener(dto.fecha)) throw new ConflictException('Ya hay un festivo en esa fecha.');
    await this.almacen.festivos.insertar({ id: dto.fecha, fecha: dto.fecha, nombre: dto.nombre.trim() });
    await this.auditoria.registrar({ actorId: actor.id, accion: 'FESTIVO_CREADO', entidad: 'festivo', entidadId: dto.fecha, despues: dto });
    return { fecha: dto.fecha, nombre: dto.nombre.trim() };
  }

  @Roles('COORDINADOR')
  @Delete(':fecha')
  @HttpCode(204)
  async eliminar(@Param('fecha') fecha: string, @UsuarioActual() actor: UsuarioGuardado) {
    const antes = this.almacen.festivos.obtener(fecha);
    if (!antes) throw new NotFoundException('No hay festivo en esa fecha.');
    await this.almacen.festivos.eliminar(fecha);
    await this.auditoria.registrar({ actorId: actor.id, accion: 'FESTIVO_ELIMINADO', entidad: 'festivo', entidadId: fecha, antes });
  }

  /** Agrega los festivos oficiales de un año que aún no estén en el calendario. */
  @Roles('COORDINADOR')
  @Post('precargar')
  async precargar(@Body() dto: PrecargarDto, @UsuarioActual() actor: UsuarioGuardado) {
    const nuevos = festivosColombia(dto.anio).filter((f) => !this.almacen.festivos.obtener(f.fecha));
    if (nuevos.length) {
      await this.almacen.festivos.insertarVarios(nuevos.map((f) => ({ ...f, id: f.fecha })));
      await this.auditoria.registrar({ actorId: actor.id, accion: 'FESTIVOS_PRECARGADOS', entidad: 'festivo', despues: { anio: dto.anio, agregados: nuevos.length } });
    }
    return { agregados: nuevos.length };
  }
}
