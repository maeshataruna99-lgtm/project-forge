export const ecommercePermissionCodes = ['products:read', 'products:manage'] as const;
export type EcommercePermissionCode = typeof ecommercePermissionCodes[number];
