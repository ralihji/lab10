import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

fetch('/assets/env.json')
  .then(response => { if (!response.ok) throw new Error('Configuration unavailable'); return response.json(); })
  .then(env => {
    (window as Window & { env?: { apiUrl: string } }).env = env;
    return bootstrapApplication(AppComponent, appConfig);
  })
  .catch(err => console.error(err));
