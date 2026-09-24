import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { UsuarioConPasswordTemporalDto, UsuarioDto } from '@sgt/shared-types';
import { randomUUID } from 'node:crypto';
import { AlmacenService } from '../almacen/almacen.service';
import type { UsuarioGuardado } from '../almacen/modelos';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AuthService } from '../auth/auth.service';
import { generarPasswordTemporal, hashPassword } from '../auth/passwords';
import { esFechaValida } from '../comun/fechas';
import { ParametrosService } from '../parametros/parametros.service';
import type { ActualizarUsuarioDto, CrearUsuarioDto, NuevoSalarioDto } from './dto';
import { aResumenDto, aUsuarioDto } from './mapeo';

const normalizarEmail = (e?: string | null) => (e ? e.trim().toLowerCase() : null);

@Injectable()
export class UsuariosService {
  constructor(
    private readonly almacen: AlmacenService,
    private readonly auditoria: AuditoriaService,
    private readonly parametros: ParametrosService,
    private readonly auth: AuthService,
  ) {}

  listarCompleto(): UsuarioDto[] {
    return this.almacen.usuarios.todos().sort((a, b) => a.nombres.localeCompare(b.nombres)).map(aUsuarioDto);
  }

  /** Lo que ve un enfermero de sus compañeros: sin documento, salario ni correo. */
  listarResumen() {
    return this.almacen.usuarios.filtrar((u) => u.activo).sort((a, b) => a.nombres.localeCompare(b.nombres)).map(aResumenDto);
  }

  obtener(id: string): UsuarioGuardado {
    const u = this.almacen.usuarios.obtener(id);
    if (!u) throw new NotFoundException('El usuario no existe.');
    return u;
  }

  async crear(dto: CrearUsuarioDto, actorId: string): Promise<UsuarioConPasswordTemporalDto> {
    if (!esFechaValida(dto.fechaIngreso)) throw new BadRequestException('La fecha de ingreso no existe.');
    const email = normalizarEmail(dto.email);
    this.validarUnicos(dto.documento, email);
    const passwordTemporal = generarPasswordTemporal();
    const usuario = await this.almacen.usuarios.insertar({
      id: randomUUID(),
      documento: dto.documento,
      nombres: dto.nombres.trim(),
      email,
      rol: dto.rol,
      cargo: dto.cargo,
      fechaIngreso: dto.fechaIngreso,
      activo: true,
      hashPassword: await hashPassword(passwordTemporal),
      debeCambiarPassword: true,
      salarios: [{ salarioBase: dto.salarioBase, vigenteDesde: dto.fechaIngreso }],
      creadoEn: new Date().toISOString(),
    });
    await this.auditoria.registrar({ actorId, accion: 'USUARIO_CREADO', entidad: 'usuario', entidadId: usuario.id, despues: aUsuarioDto(usuario) });
    return { usuario: aUsuarioDto(usuario), passwordTemporal, advertencias: this.advertenciasSalario(dto.salarioBase) };
  }

  async actualizar(id: string, dto: ActualizarUsuarioDto, actorId: string): Promise<UsuarioDto> {
    const antes = this.obtener(id);
    if (dto.fechaIngreso && !esFechaValida(dto.fechaIngreso)) throw new BadRequestException('La fecha de ingreso no existe.');
    const email = dto.email === undefined ? antes.email : normalizarEmail(dto.email);
    this.validarUnicos(antes.documento, email, id);
    if (dto.rol && dto.rol !== 'COORDINADOR' && antes.rol === 'COORDINADOR') this.exigirOtroCoordinador(id);

    const despues = await this.almacen.usuarios.actualizar(id, (u) => ({
      ...u,
      nombres: dto.nombres?.trim() ?? u.nombres,
      email,
      rol: dto.rol ?? u.rol,
      cargo: dto.cargo ?? u.cargo,
      fechaIngreso: dto.fechaIngreso ?? u.fechaIngreso,
    }));
    await this.auditoria.registrar({ actorId, accion: 'USUARIO_EDITADO', entidad: 'usuario', entidadId: id, antes: aUsuarioDto(antes), despues: aUsuarioDto(despues!) });
    return aUsuarioDto(despues!);
  }

  /** Nuevo salario con vigencia; el historial se conserva para calcular recargos de meses anteriores. */
  async nuevoSalario(id: string, dto: NuevoSalarioDto, actorId: string) {
    const antes = this.obtener(id);
    if (!esFechaValida(dto.vigenteDesde)) throw new BadRequestException('La fecha no existe.');
    if (antes.salarios.some((s) => s.vigenteDesde === dto.vigenteDesde)) {
      throw new ConflictException('Ya hay un salario registrado con esa fecha de inicio.');
    }
    const despues = await this.almacen.usuarios.actualizar(id, (u) => ({
      ...u,
      salarios: [...u.salarios, { salarioBase: dto.salarioBase, vigenteDesde: dto.vigenteDesde }].sort((a, b) => a.vigenteDesde.localeCompare(b.vigenteDesde)),
    }));
    await this.auditoria.registrar({ actorId, accion: 'SALARIO_REGISTRADO', entidad: 'usuario', entidadId: id, antes: antes.salarios, despues: despues!.salarios });
    return { usuario: aUsuarioDto(despues!), advertencias: this.advertenciasSalario(dto.salarioBase, dto.vigenteDesde) };
  }

  /** Los usuarios nunca se borran, se desactivan (RF-AUT-03). */
  async cambiarActivo(id: string, activo: boolean, actorId: string): Promise<UsuarioDto> {
    const antes = this.obtener(id);
    if (!activo) {
      if (id === actorId) throw new BadRequestException('No puedes desactivar tu propio usuario.');
      if (antes.rol === 'COORDINADOR') this.exigirOtroCoordinador(id);
    }
    const despues = await this.almacen.usuarios.actualizar(id, (u) => ({ ...u, activo }));
    if (!activo) await this.auth.revocarSesiones(id);
    await this.auditoria.registrar({ actorId, accion: activo ? 'USUARIO_ACTIVADO' : 'USUARIO_DESACTIVADO', entidad: 'usuario', entidadId: id });
    return aUsuarioDto(despues!);
  }

  async restablecerPassword(id: string, actorId: string): Promise<UsuarioConPasswordTemporalDto> {
    this.obtener(id);
    const passwordTemporal = generarPasswordTemporal();
    const hash = await hashPassword(passwordTemporal);
    const despues = await this.almacen.usuarios.actualizar(id, (u) => ({ ...u, hashPassword: hash, debeCambiarPassword: true }));
    await this.auth.revocarSesiones(id);
    await this.auditoria.registrar({ actorId, accion: 'PASSWORD_RESTABLECIDA', entidad: 'usuario', entidadId: id });
    return { usuario: aUsuarioDto(despues!), passwordTemporal, advertencias: [] };
  }

  private validarUnicos(documento: string, email: string | null, excepto?: string) {
    const otros = this.almacen.usuarios.filtrar((u) => u.id !== excepto);
    if (!excepto && otros.some((u) => u.documento.toLowerCase() === documento.toLowerCase())) {
      throw new ConflictException('Ya existe un usuario con ese documento.');
    }
    if (email && otros.some((u) => u.email === email)) throw new ConflictException('Ya existe un usuario con ese correo.');
  }

  /** Siempre debe quedar al menos un coordinador activo. */
  private exigirOtroCoordinador(id: string) {
    if (!this.almacen.usuarios.buscar((u) => u.id !== id && u.activo && u.rol === 'COORDINADOR')) {
      throw new BadRequestException('Debe quedar al menos un coordinador activo.');
    }
  }

  private advertenciasSalario(salario: number, fecha?: string): string[] {
    const smmlv = this.parametros.valor('nomina.smmlv', fecha);
    return salario < smmlv ? [`El salario es inferior al salario mínimo de referencia ($${smmlv.toLocaleString('es-CO')}).`] : [];
  }
}
