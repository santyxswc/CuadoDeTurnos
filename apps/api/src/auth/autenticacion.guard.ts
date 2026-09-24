import { ForbiddenException, Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { CODIGO_DEBE_CAMBIAR_PASSWORD, type Rol } from '@sgt/shared-types';
import { AlmacenService } from '../almacen/almacen.service';
import { CLAVE_PUBLICO, CLAVE_ROLES, CLAVE_SIN_CAMBIO_PASSWORD, type PeticionAutenticada } from '../comun/decoradores';

export interface CargaToken {
  sub: string;
  sid: string;
  rol: Rol;
}

/**
 * Se aplica a todas las rutas: valida el token, que el usuario siga activo y la sesión no esté revocada,
 * obliga a cambiar la contraseña temporal y verifica el rol.
 */
@Injectable()
export class AutenticacionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly almacen: AlmacenService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const objetivos = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(CLAVE_PUBLICO, objetivos)) return true;

    const peticion = ctx.switchToHttp().getRequest<PeticionAutenticada & { headers: Record<string, string | undefined> }>();
    const [tipo, token] = (peticion.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) throw new UnauthorizedException('Debes iniciar sesión.');

    let carga: CargaToken;
    try {
      carga = await this.jwt.verifyAsync<CargaToken>(token);
    } catch {
      throw new UnauthorizedException('La sesión expiró. Vuelve a iniciar sesión.');
    }

    const usuario = this.almacen.usuarios.obtener(carga.sub);
    const sesion = this.almacen.sesiones.obtener(carga.sid);
    if (!usuario?.activo || !sesion || sesion.revocadaEn) {
      throw new UnauthorizedException('La sesión ya no es válida. Vuelve a iniciar sesión.');
    }

    if (usuario.debeCambiarPassword && !this.reflector.getAllAndOverride<boolean>(CLAVE_SIN_CAMBIO_PASSWORD, objetivos)) {
      throw new ForbiddenException({
        codigo: CODIGO_DEBE_CAMBIAR_PASSWORD,
        message: 'Debes cambiar tu contraseña temporal antes de continuar.',
      });
    }

    const roles = this.reflector.getAllAndOverride<Rol[] | undefined>(CLAVE_ROLES, objetivos);
    if (roles && !roles.includes(usuario.rol)) {
      throw new ForbiddenException('No tienes permiso para esta acción.');
    }

    peticion.usuario = usuario;
    peticion.sesionId = sesion.id;
    return true;
  }
}
