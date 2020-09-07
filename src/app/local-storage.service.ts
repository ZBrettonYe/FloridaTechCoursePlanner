import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private static VERSION_VALUE = 1;
  private static VERSION_KEY = 'version';

  constructor() {
    const localVersion = this.get(LocalStorageService.VERSION_KEY);
    if (!localVersion || localVersion < LocalStorageService.VERSION_VALUE) {
      this.clear();
    }
  }

  clear() {
    localStorage.clear();
    localStorage.setItem(
      LocalStorageService.VERSION_KEY,
      JSON.stringify(LocalStorageService.VERSION_VALUE)
    );
  }

  get(key: string): any {
    const valueString = localStorage.getItem(key);
    if (valueString) {
      return JSON.parse(valueString);
    }
    return null;
  }

  set(key: string, value: any) {
    if (value) {
      const valueString = JSON.stringify(value);
      localStorage.setItem(key, valueString);
      return;
    }

    localStorage.setItem(key, 'null');
  }
}
