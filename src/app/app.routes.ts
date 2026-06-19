import { Routes } from '@angular/router';
import { Shell } from './shell/shell';
import { ButtonPage } from './pages/atoms/button/button.page';
import { InstallationPage } from './pages/installation/installation.page';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '',             redirectTo: 'installation', pathMatch: 'full' },
      { path: 'installation', component: InstallationPage },
      { path: 'atoms/button', component: ButtonPage },
    ],
  },
];
