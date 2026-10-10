const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { ratingColumns } = require('../utils/tourRatings');

async function list(query) {
    const calls = [];
    const pool = { query: async (sql, params) => {
        calls.push({ sql, params: [...params] });
        return sql.startsWith('SELECT COUNT') ? [[{ total: 0 }]] : [[]];
    } };
    const sandbox = { module: { exports: {} }, require: name => name.includes('database') ? pool : { ratingColumns } };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../controllers/tourController.js'), 'utf8'), sandbox);
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    await sandbox.module.exports.getAll({ query }, res, error => { throw error; });
    return { calls, res };
}

test('invalid price, date and pagination filters return 400 without database queries', async () => {
    for (const query of [{ minPrice: '-1' }, { maxPrice: 'abc' }, { minPrice: '200', maxPrice: '100' },
        { startDate: '2026-02-30' }, { startDate: '2026-11-02', endDate: '2026-11-01' }, { page: '0' }, { limit: '101' }]) {
        const { calls, res } = await list(query);
        assert.equal(res.code, 400);
        assert.equal(calls.length, 0);
    }
});

test('combined filters search all linked destinations and include the entire last day', async () => {
    const { calls, res } = await list({ keyword: '  Sa Pa ', minPrice: '0', maxPrice: '5000000', startDate: '2026-11-01', endDate: '2026-11-30', page: '2', limit: '9' });
    assert.equal(res.code, 200);
    assert.ok(calls[0].sql.includes('EXISTS'));
    assert.ok(calls[0].sql.includes('searchD.Name LIKE ?'));
    assert.ok(calls[0].sql.includes('t.StartDate < DATE_ADD(?, INTERVAL 1 DAY)'));
    assert.deepEqual(calls[0].params, ['%Sa Pa%', '%Sa Pa%', 0, 5000000, '2026-11-01', '2026-11-30']);
    assert.deepEqual(calls[1].params.slice(-2), [9, 9]);
});

test('promotion list only includes discounts with remaining seats', async () => {
    const { calls, res } = await list({ promotion: 'true', limit: '4' });
    assert.equal(res.code, 200);
    assert.ok(calls[0].sql.includes('t.OriginalPrice > t.Price AND t.AvailableSlots > 0'));
    assert.ok(calls[0].sql.includes("t.Status = 'PUBLISHED' AND t.StartDate > NOW()"));
    assert.ok(calls[1].sql.includes('t.OriginalPrice'));
});
