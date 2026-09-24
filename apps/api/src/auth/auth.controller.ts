import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import type { UsuarioGuardado } from '../almacen/modelos';
import { PermitirConCambioPendiente, Publico, SesionActual, UsuarioActual } from '../comun/decoradores';
import { aUsuarioDto } from '../usuarios/mapeo';
import { AuthService } from './auth.service';
import { CambiarPasswordDto, LoginDto, RefrescarDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Publico()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.usuario, dto.password, dto.equipo ?? null);
  }

  @Publico()
  @Post('refrescar')
  @HttpCode(200)
  refrescar(@Body() dto: RefrescarDto) {
    return this.auth.refrescar(dto.tokenRefresco);
  }

  @PermitirConCambioPendiente()
  @Post('logout')
  @HttpCode(204)
  async logout(@SesionActual() sesionId: string, @UsuarioActual() usuario: UsuarioGuardado) {
    await this.auth.cerrarSesion(sesionId, usuario.id);
  }

  @PermitirConCambioPendiente()
  @Get('yo')
  yo(@UsuarioActual() usuario: UsuarioGuardado) {
    return aUsuarioDto(usuario);
  }

  @PermitirConCambioPendiente()
  @Post('cambiar-password')
  @HttpCode(200)
  cambiarPassword(@UsuarioActual() usuario: UsuarioGuardado, @SesionActual() sesionId: string, @Body() dto: CambiarPasswordDto) {
    return this.auth.cambiarPassword(usuario, sesionId, dto.actual, dto.nueva);
  }
}
