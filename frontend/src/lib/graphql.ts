import { gql } from '@apollo/client';

export type Role = 'MANAGER' | 'STORE_KEEPER';
export type SessionUser = { id: string; email: string; name: string; role: Role };

export type Product = {
  id: string; name: string; sku: string; category: string; unit: string;
  price: number; stock: number; reorderLevel: number; description: string | null;
  createdAt: string; updatedAt: string;
};
export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'description'> & { description: string | null };
export type ProductSortField = 'name' | 'category' | 'price' | 'stock' | 'updatedAt';

export type DashboardStats = {
  totalProducts: number; totalCategories: number; totalUnitsInStock: number; inventoryValue: number; lowStockCount: number;
  categoryBreakdown: { category: string; productCount: number; stock: number; value: number }[];
  lowStockProducts: Product[]; recentUpdates: Product[];
};

const PRODUCT_FIELDS = gql`
  fragment ProductFields on Product {
    id name sku category unit price stock reorderLevel description createdAt updatedAt
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) { login(input: $input) { id email name role } }
`;
export const LOGOUT = gql`mutation Logout { logout }`;

export const PRODUCTS = gql`
  ${PRODUCT_FIELDS}
  query Products($input: ProductsQueryInput) {
    products(input: $input) { total page pageSize items { ...ProductFields } }
    productCategories
  }
`;
export const PRODUCT = gql`
  ${PRODUCT_FIELDS}
  query Product($id: ID!) { product(id: $id) { ...ProductFields } }
`;
export const CREATE_PRODUCT = gql`
  ${PRODUCT_FIELDS}
  mutation CreateProduct($input: ProductInput!) { createProduct(input: $input) { ...ProductFields } }
`;
export const UPDATE_PRODUCT = gql`
  ${PRODUCT_FIELDS}
  mutation UpdateProduct($id: ID!, $input: ProductInput!) { updateProduct(id: $id, input: $input) { ...ProductFields } }
`;
export const DASHBOARD = gql`
  ${PRODUCT_FIELDS}
  query Dashboard {
    dashboardStats {
      totalProducts totalCategories totalUnitsInStock inventoryValue lowStockCount
      categoryBreakdown { category productCount stock value }
      lowStockProducts { ...ProductFields }
      recentUpdates { ...ProductFields }
    }
  }
`;
