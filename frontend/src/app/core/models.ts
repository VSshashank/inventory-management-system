export type Role = 'ADMIN' | 'STAFF';
export type TransactionType = 'STOCK_IN' | 'SALE' | 'ADJUSTMENT';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  tokenVersion: number;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface UnitOfMeasure {
  id: number;
  name: string;
  abbreviation: string;
}

export interface Item {
  id: number;
  sku: string;
  name: string;
  description?: string | null;
  categoryId: number;
  category?: Category;
  unitId: number;
  unit?: UnitOfMeasure;
  currentStock: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: string;
}

export interface InventoryTransaction {
  id: number;
  itemId: number;
  item?: Pick<Item, 'id' | 'sku' | 'name'>;
  userId: number;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  type: TransactionType;
  quantity: number;
  unitCost?: number | null;
  unitPrice?: number | null;
  resultingStock: number;
  notes?: string | null;
  isVoided: boolean;
  transactionDate: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface DataResponse<T> {
  data: T;
}

export interface ListResponse<T> {
  data: T[];
}

export interface OrgSettings {
  id: number;
  businessName: string;
  currencySymbol: string;
  defaultLowStockThreshold: number;
  dateFormat: string;
}

export interface SummaryReport {
  totalItems: number;
  lowStockCount: number;
  totalInventoryValue: number;
  todayTransactionCount: number;
  stockByItem: Array<Item & { status: string }>;
  recentTransactions: InventoryTransaction[];
}

export interface SalesReport {
  totals: {
    revenue: number;
    cost: number;
    profit: number;
    profitMargin: number;
  };
  breakdown: Array<{
    itemId: number;
    sku: string;
    name: string;
    quantitySold: number;
    revenue: number;
    cost: number;
    profit: number;
  }>;
}

export interface VelocityReportRow {
  item: Item;
  quantitySoldLast30Days: number;
  averageDailySalesRate: number;
  daysUntilStockOut: number | null;
}
