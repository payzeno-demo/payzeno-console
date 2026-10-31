import { STAFF_ROLES } from '@payzeno/contracts';

import {
  canPerform,
  canSeeSection,
  describeRequirement,
  hasStaffRole,
} from './staff-roles';
import type { AdminAction, AdminSection } from './staff-roles';

describe('staff roles (RFC platform-v2 §1)', () => {
  it('lets admin through every check', () => {
    const sections: AdminSection[] = ['home', 'merchants', 'reviews', 'disputes', 'settlements', 'support', 'emails'];
    const actions: AdminAction[] = [
      'merchants:decide',
      'reviews:decide',
      'disputes:accept',
      'settlements:retry',
      'support:resolve',
    ];
    for (const section of sections) expect(canSeeSection('admin', section)).toBe(true);
    for (const action of actions) expect(canPerform('admin', action)).toBe(true);
  });

  it('lets every role read merchants, and only risk act on them', () => {
    for (const role of STAFF_ROLES) expect(canSeeSection(role, 'merchants')).toBe(true);
    expect(canPerform('risk', 'merchants:decide')).toBe(true);
    expect(canPerform('support', 'merchants:decide')).toBe(false);
    expect(canPerform('finance', 'merchants:decide')).toBe(false);
  });

  it('gives each peer role its own queue and nothing else', () => {
    expect(canSeeSection('risk', 'reviews')).toBe(true);
    expect(canSeeSection('risk', 'disputes')).toBe(true);
    expect(canSeeSection('risk', 'settlements')).toBe(false);

    expect(canSeeSection('finance', 'settlements')).toBe(true);
    expect(canPerform('finance', 'settlements:retry')).toBe(true);
    expect(canSeeSection('finance', 'reviews')).toBe(false);

    expect(canSeeSection('support', 'support')).toBe(true);
    expect(canSeeSection('support', 'emails')).toBe(true);
    expect(canPerform('support', 'support:resolve')).toBe(true);
    expect(canSeeSection('support', 'disputes')).toBe(false);
  });

  it('denies everything without a role', () => {
    expect(hasStaffRole(null, 'all')).toBe(false);
    expect(canSeeSection(undefined, 'home')).toBe(false);
  });

  it('words a requirement for a disabled button', () => {
    expect(describeRequirement(['risk'])).toBe('the risk role');
    expect(describeRequirement(['risk', 'finance'])).toBe('the risk or finance role');
    expect(describeRequirement('all')).toBe('a staff account');
  });
});
