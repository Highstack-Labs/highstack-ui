import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PageNavService } from '../shared/page-nav.service';
import { ThemeService } from '../shared/theme.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly pageNav = inject(PageNavService);
  protected readonly theme = inject(ThemeService);
}
