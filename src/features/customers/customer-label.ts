import type { Customer } from '@payzeno/contracts';

/** Name, else email, else the id. Every link to a customer shows this. */
export function customerLabel(customer: Pick<Customer, 'id' | 'name' | 'email'>): string {
  return customer.name?.trim() || customer.email?.trim() || customer.id;
}
