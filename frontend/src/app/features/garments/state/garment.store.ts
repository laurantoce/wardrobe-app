import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  addEntity,
  removeEntity,
  setAllEntities,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { firstValueFrom } from 'rxjs';

import { ApiError } from '../../../core/error.interceptor';
import { GarmentApi } from '../data/garment-api.service';
import { Garment, GarmentInput } from '../data/garment.models';

interface GarmentUiState {
  loading: boolean;
  error: string | null;
  category: string | null;
}

const initial: GarmentUiState = { loading: false, error: null, category: null };

export const GarmentStore = signalStore(
  { providedIn: 'root' },
  withEntities<Garment>(),
  withState(initial),
  withComputed((store) => ({
    count: computed(() => store.entities().length),
    totalValue: computed(() =>
      store.entities().reduce((sum, g) => sum + (g.purchasePrice ?? 0), 0),
    ),
  })),
  withMethods((store, api = inject(GarmentApi)) => {
    async function load(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const items = await firstValueFrom(api.list(store.category() ?? undefined));
        patchState(store, setAllEntities(items), { loading: false });
      } catch (e) {
        patchState(store, { loading: false, error: (e as ApiError).message });
      }
    }

    return {
      load,
      setCategory(category: string | null): Promise<void> {
        patchState(store, { category });
        return load();
      },
      async add(input: GarmentInput): Promise<Garment> {
        const created = await firstValueFrom(api.create(input));
        patchState(store, addEntity(created));
        return created;
      },
      async update(id: number, patch: Partial<GarmentInput>): Promise<void> {
        const updated = await firstValueFrom(api.update(id, patch));
        patchState(store, updateEntity({ id, changes: updated }));
      },
      async remove(id: number): Promise<void> {
        await firstValueFrom(api.remove(id));
        patchState(store, removeEntity(id));
      },
    };
  }),
);
