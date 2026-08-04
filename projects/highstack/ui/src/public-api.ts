/*
 * Public API Surface of @highstacklabs2026/ui
 */

export * from './lib/atoms/accordion/accordion.component';
export * from './lib/atoms/alert/alert.component';
export * from './lib/atoms/avatar/avatar.component';
export * from './lib/atoms/badge/badge.component';
export * from './lib/atoms/breadcrumb/breadcrumb.component';
export * from './lib/atoms/button/button.component';
export * from './lib/atoms/calendar/calendar.component';
export * from './lib/atoms/card/card.component';
export * from './lib/atoms/checkbox/checkbox.component';
export * from './lib/atoms/datepicker/datepicker.component';
export * from './lib/atoms/dialog/dialog.types';
export * from './lib/atoms/dialog/dialog.service';
export * from './lib/atoms/dialog/dialog-outlet.component';
export * from './lib/atoms/drawer/drawer.component';
export * from './lib/atoms/dropdown/dropdown.component';
export * from './lib/atoms/input/input.component';
export * from './lib/atoms/label/label.component';
export * from './lib/atoms/popover/popover.component';
export * from './lib/atoms/separator/separator.component';
export * from './lib/atoms/loading/loading.component';
export * from './lib/atoms/modal/modal.component';
export * from './lib/atoms/pagination/pagination.component';
export * from './lib/atoms/phone-input/phone-input.component';
/**
 * Nombrado a propósito, no `export *`: `phone-utils` tiene una docena de
 * helpers internos (parseo, formateo, la tabla de países) y abrirlos todos los
 * volvería API pública para siempre. `checkE164` es lo único que un formulario
 * necesita de ahí: cerrar el botón de envío mientras el número esté incompleto.
 */
export { checkE164 } from './lib/atoms/phone-input/phone-utils';
export * from './lib/atoms/radio/radio.component';
export * from './lib/atoms/segmented/segmented.component';
export * from './lib/atoms/select/select.component';
export * from './lib/atoms/stepper/stepper.component';
export * from './lib/atoms/table/table.types';
export * from './lib/atoms/table/table.component';
export * from './lib/atoms/tabs/tabs.component';
export * from './lib/atoms/textarea/textarea.component';
export * from './lib/atoms/timepicker/timepicker.component';
export * from './lib/atoms/toast/toast.types';
export * from './lib/atoms/toast/toast.service';
export * from './lib/atoms/tooltip/tooltip.directive';
export * from './lib/atoms/switch/switch.component';
export * from './lib/providers';

