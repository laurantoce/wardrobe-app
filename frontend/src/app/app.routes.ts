import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in · Wardrobe',
    loadComponent: () =>
      import('./features/auth/pages/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    title: 'Dashboard · Wardrobe',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'items',
    title: 'Items · Wardrobe',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/garments/pages/garment-list.page').then((m) => m.GarmentListPage),
  },
  {
    path: 'items/:id',
    title: 'Item · Wardrobe',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/garments/pages/garment-detail.page').then(
        (m) => m.GarmentDetailPage,
      ),
  },
  {
    path: 'outfits',
    title: 'Outfits · Wardrobe',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/outfits/pages/outfit-list.page').then((m) => m.OutfitListPage),
  },
  {
    path: 'ai',
    title: 'AI Stylist · Wardrobe',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/ai/pages/ai-suggestions.page').then((m) => m.AiSuggestionsPage),
  },
  { path: '**', redirectTo: '' },
];
