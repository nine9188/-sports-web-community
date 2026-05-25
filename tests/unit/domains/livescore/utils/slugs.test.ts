import { describe, expect, it } from 'vitest';

import { slugify } from '@/domains/livescore/utils/slugs';

describe('slugify', () => {
  it.each([
    ['A. Bayındır', 'a-bayindir'],
    ['B. Šeško', 'b-sesko'],
    ['C. Pulišić', 'c-pulisic'],
    ['K. Yıldız', 'k-yildiz'],
    ['F. Kadıoğlu', 'f-kadioglu'],
    ['T. Souček', 't-soucek'],
    ['R. Højlund', 'r-hojlund'],
    ['L. Østigård', 'l-ostigard'],
    ['M. Ødegaard', 'm-odegaard'],
    ['Ł. Skorupski', 'l-skorupski'],
    ['A. Dźwigała', 'a-dzwigala'],
    ['Þ. Helgason', 'th-helgason'],
    ['S. Kılıçsoy', 's-kilicsoy'],
    ['İ. Gündoğan', 'i-gundogan'],
    ['João Palhinha', 'joao-palhinha'],
  ])('normalizes %s', (source, expected) => {
    expect(slugify(source)).toBe(expected);
  });
});
