import { Routes } from '@angular/router';
import { Shell } from './shell/shell';
import { ButtonPage } from './pages/atoms/button/button.page';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '',             redirectTo: 'atoms/button', pathMatch: 'full' },
      { path: 'atoms/button', component: ButtonPage },
    ],
  },
];
