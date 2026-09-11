import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from '../src/lib/jsonld';

describe('serializeJsonLd', () => {
  it('cannot terminate the containing script element', () => {
    const payload = { name: '</script><script>alert(1)</script>', note: 'A&B' };
    const serialized = serializeJsonLd(payload);
    expect(serialized.toLowerCase()).not.toContain('</script');
    expect(JSON.parse(serialized)).toEqual(payload);
  });
});
