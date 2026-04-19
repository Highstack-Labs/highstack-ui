import { TestBed } from '@angular/core/testing';
import { ButtonPage } from './button.page';

describe('ButtonPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonPage],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ButtonPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render button heading', async () => {
    const fixture = TestBed.createComponent(ButtonPage);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('highstack-ui');
  });
});
