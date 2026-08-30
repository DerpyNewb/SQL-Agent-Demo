import assert from 'node:assert';
import { validateSelectOnly } from './src/validateSql.js';

assert.equal(validateSelectOnly('SELECT * FROM products').ok, true);
assert.equal(validateSelectOnly('select id from orders;').ok, true);
assert.equal(validateSelectOnly('DROP TABLE products').ok, false);
assert.equal(validateSelectOnly("SELECT * FROM products; DROP TABLE products;").ok, false);
assert.equal(validateSelectOnly('UPDATE products SET price=0').ok, false);
assert.equal(validateSelectOnly("SELECT * FROM products WHERE name = 'x' -- pragma tricks").ok, false);

console.log('validateSql: all checks passed');
