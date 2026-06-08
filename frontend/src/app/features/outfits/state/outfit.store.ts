import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import {
  addEntity,
  removeEntity,
  setAllEntities,
  withEntities,
} from '@ngrx/signals/entities';
import { firstValueFrom } from 'rxjs';

import { ApiError } from '../../../core/error.interceptor';
import { OutfitApi } from '../data/outfit-api.service';
import { Outfit, OutfitInput } from '../data/outfit.models';

interface OutfitUiState {
  loading: boolean;
  error: string | null;
}

export const OutfitStore = signalStore(
  { providedIn: 'root' },
  withEntities<Outfit>(),
  withState<OutfitUiState>({ loading: false, error: null }),
  withComputed((store) => ({
    count: computed(() => store.entities().length),
  })),
  withMethods((store, api = inject(OutfitApi)) => ({
    async load(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const items = await firstValueFrom(api.list());
        patchState(store, setAllEntities(items), { loading: false });
      } catch (e) {
        patchState(store, { loading: false, error: (e as ApiError).message });
      }
    },
    async add(input: OutfitInput): Promise<Outfit> {
      const created = await firstValueFrom(api.create(input));
      patchState(store, addEntity(created));
      return created;
    },
    async remove(id: number): Promise<void> {
      await firstValueFrom(api.remove(id));
      patchState(store, removeEntity(id));
    },
  })),
);
