import { Routes } from '@angular/router';
import { ButtonPage } from './pages/atoms/button/button.page';

export const routes: Routes = [
  { path: '',             redirectTo: 'atoms/button', pathMatch: 'full' },
  { path: 'atoms/button', component: ButtonPage },
];
