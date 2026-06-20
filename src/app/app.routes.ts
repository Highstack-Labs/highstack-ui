import { Routes } from '@angular/router';
import { Shell } from './shell/shell';
import { ButtonPage } from './pages/atoms/button/button.page';
import { InputPage } from './pages/atoms/input/input.page';
import { BadgePage } from './pages/atoms/badge/badge.page';
import { InstallationPage } from './pages/installation/installation.page';
import { ThemesPage } from './pages/themes/themes.page';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '',             redirectTo: 'installation', pathMatch: 'full' },
      { path: 'installation', component: InstallationPage },
      { path: 'themes',       component: ThemesPage },
      { path: 'atoms/button', component: ButtonPage },
      { path: 'atoms/input',  component: InputPage },
      { path: 'atoms/badge',  component: BadgePage },
    ],
  },
];
