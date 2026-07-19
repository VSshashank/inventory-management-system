import { Component, input } from '@angular/core';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>{{ title() }}</h1>
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 16px;
      }

      h1 {
        margin: 0;
        color: #14213d;
        font-size: 1.5rem;
        letter-spacing: 0;
      }
    `,
  ],
})
export class PlaceholderPageComponent {
  readonly title = input.required<string>();
}
