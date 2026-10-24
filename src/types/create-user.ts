export type CreateUser = {
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles: CreateRole[];
};

export type CreateRole = {
  roleName: string;
};
