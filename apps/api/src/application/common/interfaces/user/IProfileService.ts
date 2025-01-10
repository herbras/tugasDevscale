export interface ProfileResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  position?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  roles: string[];
}

export interface UpdateProfileRequest {
  fullName?: string;
  position?: string;
}

export interface IProfileService {
  getProfile(userId: string): Promise<ProfileResponse>;
  updateProfile(
    userId: string,
    data: UpdateProfileRequest,
  ): Promise<ProfileResponse>;
}
