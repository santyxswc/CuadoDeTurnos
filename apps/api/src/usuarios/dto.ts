import { Cargo, Rol } from '@sgt/shared-types';
import { IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min, ValidateIf } from 'class-validator';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export class CrearUsuarioDto {
  @Matches(/^[A-Za-z0-9]{3,20}$/, { message: 'El documento debe tener entre 3 y 20 letras o números, sin espacios.' })
  documento: string;

  @IsString()
  @IsNotEmpty({ message: 'Escribe los nombres.' })
  @MaxLength(120)
  nombres: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsEmail({}, { message: 'El correo no es válido.' })
  email?: string | null;

  @IsIn(Object.values(Rol), { message: 'Rol no válido.' })
  rol: Rol;

  @IsIn(Object.values(Cargo), { message: 'Cargo no válido.' })
  cargo: Cargo;

  @Matches(FECHA, { message: 'La fecha de ingreso debe tener el formato YYYY-MM-DD.' })
  fechaIngreso: string;

  @IsInt({ message: 'El salario debe ser un número entero.' })
  @Min(0)
  salarioBase: number;
}

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombres?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsEmail({}, { message: 'El correo no es válido.' })
  email?: string | null;

  @IsOptional()
  @IsIn(Object.values(Rol))
  rol?: Rol;

  @IsOptional()
  @IsIn(Object.values(Cargo))
  cargo?: Cargo;

  @IsOptional()
  @Matches(FECHA, { message: 'La fecha de ingreso debe tener el formato YYYY-MM-DD.' })
  fechaIngreso?: string;
}

export class NuevoSalarioDto {
  @IsInt({ message: 'El salario debe ser un número entero.' })
  @Min(0)
  salarioBase: number;

  @Matches(FECHA, { message: 'La fecha debe tener el formato YYYY-MM-DD.' })
  vigenteDesde: string;
}
