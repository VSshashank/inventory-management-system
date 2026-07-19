import { inject, Injectable } from '@angular/core';
import type {
  Category,
  DataResponse,
  InventoryTransaction,
  Item,
  ListResponse,
  OrgSettings,
  PaginatedResponse,
  SalesReport,
  SummaryReport,
  UnitOfMeasure,
  User,
  VelocityReportRow,
} from './models';
import { ApiClient } from './api-client';

@Injectable({ providedIn: 'root' })
export class InventoryApiService {
  private readonly api = inject(ApiClient);

  categories() {
    return this.api.get<ListResponse<Category>>('/categories');
  }

  createCategory(name: string) {
    return this.api.post<DataResponse<Category>>('/categories', { name });
  }

  units() {
    return this.api.get<ListResponse<UnitOfMeasure>>('/units');
  }

  createUnit(data: Pick<UnitOfMeasure, 'name' | 'abbreviation'>) {
    return this.api.post<DataResponse<UnitOfMeasure>>('/units', data);
  }

  items(query?: Record<string, string | number | boolean | null | undefined>) {
    return this.api.get<PaginatedResponse<Item>>('/items', query);
  }

  item(id: number) {
    return this.api.get<DataResponse<Item>>(`/items/${id}`);
  }

  createItem(data: Partial<Item>) {
    return this.api.post<DataResponse<Item>>('/items', data);
  }

  updateItem(id: number, data: Partial<Item>) {
    return this.api.put<DataResponse<Item>>(`/items/${id}`, data);
  }

  deleteItem(id: number) {
    return this.api.delete<void>(`/items/${id}`);
  }

  itemHistory(id: number, query?: Record<string, string | number>) {
    return this.api.get<PaginatedResponse<InventoryTransaction>>(`/items/${id}/history`, query);
  }

  transactions(query?: Record<string, string | number | null | undefined>) {
    return this.api.get<PaginatedResponse<InventoryTransaction>>('/transactions', query);
  }

  createTransaction(data: Record<string, unknown>) {
    return this.api.post<{ data: InventoryTransaction; warning?: string }>('/transactions', data);
  }

  undoTransaction(id: number) {
    return this.api.post<{ data: InventoryTransaction; warning?: string }>(`/transactions/${id}/undo`, {});
  }

  summary() {
    return this.api.get<DataResponse<SummaryReport>>('/reports/summary');
  }

  sales(query?: Record<string, string | null | undefined>) {
    return this.api.get<DataResponse<SalesReport>>('/reports/sales', query);
  }

  velocity() {
    return this.api.get<DataResponse<VelocityReportRow[]>>('/reports/velocity');
  }

  excel(query?: Record<string, string | null | undefined>) {
    return this.api.download('/reports/export/excel', query);
  }

  settings() {
    return this.api.get<DataResponse<OrgSettings>>('/settings');
  }

  updateSettings(data: Partial<OrgSettings>) {
    return this.api.put<DataResponse<OrgSettings>>('/settings', data);
  }

  users() {
    return this.api.get<ListResponse<User>>('/users');
  }

  createUser(data: { name: string; email: string; password: string; role: string }) {
    return this.api.post<DataResponse<User>>('/users', data);
  }

  updateUser(id: number, data: Partial<User> & { password?: string }) {
    return this.api.patch<DataResponse<User>>(`/users/${id}`, data);
  }
}
