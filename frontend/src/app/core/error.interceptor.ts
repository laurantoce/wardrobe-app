import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/** Normalizes backend errors into `{ status, message }`. Our FastAPI layer returns
 *  `{ detail: "..." }` for domain errors (404/400) — surface that as the message. */
export interface ApiError {
  status: number;
  message: string;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const detail = err.error?.detail;
      const message =
        typeof detail === 'string' ? detail : (err.message ?? 'Request failed');
      const apiError: ApiError = { status: err.status, message };
      return throwError(() => apiError);
    }),
  );
