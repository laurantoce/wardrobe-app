import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiError } from '../../../core/error.interceptor';
import { OutfitApi } from '../data/outfit-api.service';
import { Outfit, OutfitInput } from '../data/outfit.models';

@Injectable({ providedIn: 'root' })
export class OutfitStore {
  private readonly api = inject(OutfitApi);

  readonly entities = signal<Outfit[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly count = computed(() => this.entities().length);

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const items = await firstValueFrom(this.api.list());
      this.entities.set(items);
      this.loading.set(false);
    } catch (e) {
      this.loading.set(false);
      this.error.set((e as ApiError).message);
    }
  }

  async add(input: OutfitInput): Promise<Outfit> {
    const created = await firstValueFrom(this.api.create(input));
    this.entities.update((items) => [...items, created]);
    return created;
  }

  async remove(id: number): Promise<void> {
    await firstValueFrom(this.api.remove(id));
    this.entities.update((items) => items.filter((item) => item.id !== id));
  }
}
