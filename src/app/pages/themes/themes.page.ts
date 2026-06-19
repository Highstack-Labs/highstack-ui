import { Component, inject } from '@angular/core';
import { ThemeService } from '../../shared/theme.service';

@Component({
  selector: 'app-themes-page',
  templateUrl: './themes.page.html',
})
export class ThemesPage {
  protected readonly theme = inject(ThemeService);
}
