import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_BASE } from '../../../core/api';
import { Outfit, OutfitDto, OutfitInput, toOutfit, toOutfitPayload } from './outfit.models';

@Injectable({ providedIn: 'root' })
export class OutfitApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/outfits`;

  list(): Observable<Outfit[]> {
    return this.http
      .get<OutfitDto[]>(this.base)
      .pipe(map((dtos) => dtos.map(toOutfit)));
  }

  create(input: OutfitInput): Observable<Outfit> {
    return this.http
      .post<OutfitDto>(this.base, toOutfitPayload(input))
      .pipe(map(toOutfit));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
