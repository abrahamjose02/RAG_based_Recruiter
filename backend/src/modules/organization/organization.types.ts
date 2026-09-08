export interface Organization {
  _id?: string;
  name: string;
  industry?: string;
  description?: string;
  website?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrganizationCreateInput {
  name: string;
  industry?: string;
  description?: string;
  website?: string;
}

export interface OrganizationUpdateInput {
  name?: string;
  industry?: string;
  description?: string;
  website?: string;
}
