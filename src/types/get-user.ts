export type GetUser = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: GetRole[];
};

export type GetRole = {
  roleName: string;
};

export type UserPage = {
  content: GetUser[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};
