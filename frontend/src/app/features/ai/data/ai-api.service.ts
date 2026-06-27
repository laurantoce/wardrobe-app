import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_BASE } from '../../../core/api';
import {
  OutfitSuggestion,
  SuggestionRequest,
  SuggestionResponseDto,
  toSuggestions,
} from './ai.models';

@Injectable({ providedIn: 'root' })
export class AiApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/ai`;

  suggest(request: SuggestionRequest): Observable<OutfitSuggestion[]> {
    return this.http
      .post<SuggestionResponseDto>(`${this.base}/suggestions`, request)
      .pipe(map(toSuggestions));
  }
}
