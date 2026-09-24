import { Body, Controller, ForbiddenException, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import type { UsuarioGuardado } from '../almacen/modelos';
import { Roles, UsuarioActual } from '../comun/decoradores';
import { ActualizarUsuarioDto, CrearUsuarioDto, NuevoSalarioDto } from './dto';
import { aUsuarioDto } from './mapeo';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  /** Coordinador: datos completos. Enfermero: solo nombre, rol y cargo de los compañeros activos. */
  @Get()
  listar(@UsuarioActual() actor: UsuarioGuardado) {
    return actor.rol === 'COORDINADOR' ? this.usuarios.listarCompleto() : this.usuarios.listarResumen();
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() actor: UsuarioGuardado) {
    if (actor.rol !== 'COORDINADOR' && actor.id !== id) throw new ForbiddenException('Solo puedes ver tu propia información.');
    return aUsuarioDto(this.usuarios.obtener(id));
  }

  @Roles('COORDINADOR')
  @Post()
  crear(@Body() dto: CrearUsuarioDto, @UsuarioActual() actor: UsuarioGuardado) {
    return this.usuarios.crear(dto, actor.id);
  }

  @Roles('COORDINADOR')
  @Patch(':id')
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarUsuarioDto, @UsuarioActual() actor: UsuarioGuardado) {
    return this.usuarios.actualizar(id, dto, actor.id);
  }

  @Roles('COORDINADOR')
  @Post(':id/salarios')
  nuevoSalario(@Param('id', ParseUUIDPipe) id: string, @Body() dto: NuevoSalarioDto, @UsuarioActual() actor: UsuarioGuardado) {
    return this.usuarios.nuevoSalario(id, dto, actor.id);
  }

  @Roles('COORDINADOR')
  @Post(':id/desactivar')
  @HttpCode(200)
  desactivar(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() actor: UsuarioGuardado) {
    return this.usuarios.cambiarActivo(id, false, actor.id);
  }

  @Roles('COORDINADOR')
  @Post(':id/activar')
  @HttpCode(200)
  activar(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() actor: UsuarioGuardado) {
    return this.usuarios.cambiarActivo(id, true, actor.id);
  }

  @Roles('COORDINADOR')
  @Post(':id/restablecer-password')
  @HttpCode(200)
  restablecer(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() actor: UsuarioGuardado) {
    return this.usuarios.restablecerPassword(id, actor.id);
  }
}
