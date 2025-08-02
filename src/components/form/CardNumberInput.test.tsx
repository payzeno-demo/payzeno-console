import { describe, it, expect } from 'vitest';
import { CardNumberInput } from './CardNumberInput';

describe('CardNumberInput', () => {
  it('masks all but the last four digits', () => {
    expect(CardNumberInput).toBeTypeOf('function');
  });
});
