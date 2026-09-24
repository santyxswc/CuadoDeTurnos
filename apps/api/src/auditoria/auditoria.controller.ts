import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { Roles } from '../comun/decoradores';
import { AuditoriaService } from './auditoria.service';

@Roles('COORDINADOR')
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoria: AuditoriaService) {}

  @Get()
  listar(@Query('limite', new DefaultValuePipe(100), ParseIntPipe) limite: number) {
    return this.auditoria.ultimos(Math.min(Math.max(limite, 1), 1000));
  }
}
