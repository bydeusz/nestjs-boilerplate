export interface JwtPayload {
  sub: string;
  email: string;
  isAdmin: boolean;
  organisationId: string | null;
}
