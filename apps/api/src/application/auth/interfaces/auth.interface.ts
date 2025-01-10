export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface RegisterRequestDTO {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponseDTO {
  user: {
    id: string;
    email: string;
    name: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface OtpRequestDTO {
  identifier: string;
  type: "EMAIL" | "PHONE";
}

export interface OtpVerifyRequestDTO extends OtpRequestDTO {
  otp: string;
}

export interface TokenRefreshRequestDTO {
  refreshToken: string;
}

export interface TokenResponseDTO {
  accessToken: string;
  refreshToken: string;
}
