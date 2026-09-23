import { Component, booleanAttribute, input } from '@angular/core';

/**
 * Etiqueta de formulario reutilizable. Centraliza el estilo del `<label>` que
 * comparten input/textarea/select y sirve también para controles propios:
 *
 *   <ui-label for="custom" required>Nombre</ui-label>
 *   <mi-control id="custom" />
 */
@Component({
  selector: 'ui-label',
  templateUrl: './label.component.html',
})
export class LabelComponent {
  /** Id del control asociado (alias `for` para usarse como atributo HTML). */
  readonly htmlFor = input<string>('', { alias: 'for' });
  readonly required = input(false, { transform: booleanAttribute });
}
