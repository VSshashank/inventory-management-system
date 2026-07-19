import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/auth.guard';
import { AppShellComponent } from './shared/app-shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((module) => module.LoginComponent),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((module) => module.DashboardComponent),
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory-list.component').then((module) => module.InventoryListComponent),
      },
      {
        path: 'inventory/new',
        loadComponent: () => import('./features/inventory/item-form.component').then((module) => module.ItemFormComponent),
      },
      {
        path: 'inventory/:id',
        loadComponent: () => import('./features/inventory/item-detail.component').then((module) => module.ItemDetailComponent),
      },
      {
        path: 'inventory/:id/edit',
        loadComponent: () => import('./features/inventory/item-form.component').then((module) => module.ItemFormComponent),
      },
      {
        path: 'transactions/new',
        loadComponent: () =>
          import('./features/transactions/transaction-form.component').then((module) => module.TransactionFormComponent),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/transactions-list.component').then((module) => module.TransactionsListComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then((module) => module.ReportsComponent),
      },
      {
        path: 'settings',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/settings/settings.component').then((module) => module.SettingsComponent),
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/users/users.component').then((module) => module.UsersComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
