import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

type MockData = {
  name: string;
  pages: Array<{
    number: number;
    imageUrl: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly _http = inject(HttpClient);

  getMockData() {
    return this._http.get<MockData>('src/app/assets/mock-data.json');
  }
}
