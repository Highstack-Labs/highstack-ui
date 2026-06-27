import { Routes } from '@angular/router';
import { Shell } from './shell/shell';
import { ButtonPage } from './pages/atoms/button/button.page';
import { InputPage } from './pages/atoms/input/input.page';
import { BadgePage } from './pages/atoms/badge/badge.page';
import { CardPage } from './pages/atoms/card/card.page';
import { ModalPage } from './pages/atoms/modal/modal.page';
import { DrawerPage } from './pages/atoms/drawer/drawer.page';
import { PopoverPage } from './pages/atoms/popover/popover.page';
import { SeparatorPage } from './pages/atoms/separator/separator.page';
import { CheckboxPage } from './pages/atoms/checkbox/checkbox.page';
import { SwitchPage } from './pages/atoms/switch/switch.page';
import { RadioPage } from './pages/atoms/radio/radio.page';
import { AvatarPage } from './pages/atoms/avatar/avatar.page';
import { TooltipPage } from './pages/atoms/tooltip/tooltip.page';
import { DropdownPage } from './pages/atoms/dropdown/dropdown.page';
import { SelectPage } from './pages/atoms/select/select.page';
import { TabsPage } from './pages/atoms/tabs/tabs.page';
import { AlertPage } from './pages/atoms/alert/alert.page';
import { ToastPage } from './pages/atoms/toast/toast.page';
import { LoadingPage } from './pages/atoms/loading/loading.page';
import { TextareaPage } from './pages/atoms/textarea/textarea.page';
import { AccordionPage } from './pages/atoms/accordion/accordion.page';
import { BreadcrumbPage } from './pages/atoms/breadcrumb/breadcrumb.page';
import { TablePage } from './pages/atoms/table/table.page';
import { PaginationPage } from './pages/atoms/pagination/pagination.page';
import { DialogPage } from './pages/atoms/dialog/dialog.page';
import { StepperPage } from './pages/atoms/stepper/stepper.page';
import { InstallationPage } from './pages/installation/installation.page';
import { ThemesPage } from './pages/themes/themes.page';
import { AiGuidePage } from './pages/ai-guide/ai-guide.page';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '',             redirectTo: 'installation', pathMatch: 'full' },
      { path: 'installation', component: InstallationPage },
      { path: 'themes',       component: ThemesPage },
      { path: 'ai-guide',     component: AiGuidePage },
      { path: 'atoms/button', component: ButtonPage },
      { path: 'atoms/input',  component: InputPage },
      { path: 'atoms/badge',  component: BadgePage },
      { path: 'atoms/card',   component: CardPage },
      { path: 'atoms/modal',  component: ModalPage },
      { path: 'atoms/drawer', component: DrawerPage },
      { path: 'atoms/popover', component: PopoverPage },
      { path: 'atoms/separator', component: SeparatorPage },
      { path: 'atoms/checkbox', component: CheckboxPage },
      { path: 'atoms/switch', component: SwitchPage },
      { path: 'atoms/radio',  component: RadioPage },
      { path: 'atoms/avatar', component: AvatarPage },
      { path: 'atoms/tooltip', component: TooltipPage },
      { path: 'atoms/dropdown', component: DropdownPage },
      { path: 'atoms/select', component: SelectPage },
      { path: 'atoms/tabs',   component: TabsPage },
      { path: 'atoms/alert',  component: AlertPage },
      { path: 'atoms/toast',  component: ToastPage },
      { path: 'atoms/loading', component: LoadingPage },
      { path: 'atoms/textarea', component: TextareaPage },
      { path: 'atoms/accordion', component: AccordionPage },
      { path: 'atoms/breadcrumb', component: BreadcrumbPage },
      { path: 'atoms/table',  component: TablePage },
      { path: 'atoms/pagination', component: PaginationPage },
      { path: 'atoms/dialog', component: DialogPage },
      { path: 'atoms/stepper', component: StepperPage },
    ],
  },
];
