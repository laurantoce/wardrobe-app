import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Dashboard · Wardrobe',
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'items',
    title: 'Items · Wardrobe',
    loadComponent: () =>
      import('./features/garments/pages/garment-list.page').then((m) => m.GarmentListPage),
  },
  {
    path: 'items/:id',
    title: 'Item · Wardrobe',
    loadComponent: () =>
      import('./features/garments/pages/garment-detail.page').then(
        (m) => m.GarmentDetailPage,
      ),
  },
  {
    path: 'outfits',
    title: 'Outfits · Wardrobe',
    loadComponent: () =>
      import('./features/outfits/pages/outfit-list.page').then((m) => m.OutfitListPage),
  },
  {
    path: 'ai',
    title: 'AI Stylist · Wardrobe',
    loadComponent: () =>
      import('./features/ai/pages/ai-suggestions.page').then((m) => m.AiSuggestionsPage),
  },
  { path: '**', redirectTo: '' },
];
