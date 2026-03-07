export class ApiErrorDto {
  status!: 'error';
  code!: string;
  message!: string;
}