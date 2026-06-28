import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_BASE } from '../../../core/api';
import {
  Outfit,
  OutfitDto,
  OutfitInput,
  OutfitPhotoAnalysis,
  toOutfit,
  toOutfitPayload,
  toOutfitPhotoAnalysis,
} from './outfit.models';

@Injectable({ providedIn: 'root' })
export class OutfitApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/outfits`;

  list(): Observable<Outfit[]> {
    return this.http
      .get<OutfitDto[]>(this.base)
      .pipe(map((dtos) => dtos.map(toOutfit)));
  }

  get(id: number): Observable<Outfit> {
    return this.http.get<OutfitDto>(`${this.base}/${id}`).pipe(map(toOutfit));
  }

  create(input: OutfitInput): Observable<Outfit> {
    return this.http
      .post<OutfitDto>(this.base, toOutfitPayload(input))
      .pipe(map(toOutfit));
  }

  update(id: number, patch: Partial<OutfitInput>): Observable<Outfit> {
    return this.http
      .patch<OutfitDto>(`${this.base}/${id}`, toOutfitPayload(patch))
      .pipe(map(toOutfit));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  analyzeOutfitPhoto(file: File, generateCutout = true): Observable<OutfitPhotoAnalysis> {
    const form = new FormData();
    form.append('file', file);
    const params = new HttpParams().set('generate_cutout', String(generateCutout));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.http
      .post<any>(`${API_BASE}/ai/analyze-outfit-photo`, form, { params })
      .pipe(map(toOutfitPhotoAnalysis));
  }
}
