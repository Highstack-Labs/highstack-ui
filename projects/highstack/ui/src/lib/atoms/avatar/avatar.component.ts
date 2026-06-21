import {
  Component,
  computed,
  contentChildren,
  effect,
  input,
  signal,
} from '@angular/core';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';
export type AvatarStatus = 'online' | 'offline' | 'away' | 'busy';

const SIZE_BOX: Record<AvatarSize, string> = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-lg',
};
const STATUS_DOT: Record<AvatarSize, string> = {
  xs: 'size-1.5',
  sm: 'size-2',
  md: 'size-2.5',
  lg: 'size-3',
  xl: 'size-3.5',
};
const STATUS_COLOR: Record<AvatarStatus, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-zinc-400',
  away: 'bg-amber-500',
  busy: 'bg-[var(--color-destructive)]',
};

/** Avatar: imagen con fallback a iniciales, tamaños, forma e indicador de estado. */
@Component({
  selector: 'ui-avatar',
  templateUrl: './avatar.component.html',
  host: { '[class]': 'hostClasses()' },
})
export class AvatarComponent {
  readonly src = input<string>('');
  readonly name = input<string>('');
  readonly alt = input<string>('');
  readonly size = input<AvatarSize>('md');
  readonly shape = input<AvatarShape>('circle');
  readonly status = input<AvatarStatus | null>(null);

  /** Lo controla ui-avatar-group para ocultar los que exceden `max`. */
  readonly hidden = signal(false);

  protected readonly imgError = signal(false);
  protected readonly showImage = computed(() => !!this.src() && !this.imgError());

  protected readonly initials = computed(() => {
    const n = this.name().trim();
    if (!n) return '';
    const parts = n.split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
    return (first + last).toUpperCase();
  });

  protected readonly statusDotClasses = computed(() => {
    const s = this.status();
    if (!s) return '';
    return [
      'absolute bottom-0 right-0 rounded-full ring-2 ring-[var(--color-background)]',
      STATUS_DOT[this.size()],
      STATUS_COLOR[s],
    ].join(' ');
  });

  protected readonly innerClasses = computed(() => {
    const base =
      'inline-flex items-center justify-center size-full overflow-hidden select-none font-medium bg-[var(--color-muted)] text-[var(--color-muted-foreground)]';
    const shape = this.shape() === 'square' ? 'rounded-[var(--radius)]' : 'rounded-full';
    return [base, shape].join(' ');
  });

  protected readonly hostClasses = computed(() => {
    const base = 'relative inline-flex shrink-0';
    const shape = this.shape() === 'square' ? 'rounded-[var(--radius)]' : 'rounded-full';
    const hidden = this.hidden() ? 'hidden' : '';
    // shape en el host también, para que el ring del apilado siga la forma
    return [base, SIZE_BOX[this.size()], shape, hidden].join(' ');
  });

  protected onImgError() {
    this.imgError.set(true);
  }
}

/** Grupo de avatares apilados, con "+N" cuando se supera `max`. */
@Component({
  selector: 'ui-avatar-group',
  template: `
    <ng-content />
    @if (overflow() > 0) {
      <span
        [class]="moreClasses()"
        aria-hidden="true"
      >+{{ overflow() }}</span>
    }
  `,
  host: {
    class:
      'flex items-center [&>ui-avatar]:ring-2 [&>ui-avatar]:ring-[var(--color-background)] [&>ui-avatar:not(:first-child)]:-ml-2',
  },
})
export class AvatarGroupComponent {
  readonly max = input<number | null>(null);
  readonly size = input<AvatarSize>('md');

  private readonly avatars = contentChildren(AvatarComponent);

  protected readonly overflow = computed(() => {
    const m = this.max();
    const n = this.avatars().length;
    return m != null && n > m ? n - m : 0;
  });

  protected readonly moreClasses = computed(() =>
    [
      'relative inline-flex items-center justify-center shrink-0 rounded-full font-medium -ml-2',
      'ring-2 ring-[var(--color-background)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
      SIZE_BOX[this.size()],
    ].join(' '),
  );

  constructor() {
    effect(() => {
      const m = this.max();
      this.avatars().forEach((a, i) => a.hidden.set(m != null && i >= m));
    });
  }
}
