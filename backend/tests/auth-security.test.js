const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');

const JWT_SECRET = 'test_jwt_secret_12345';
process.env.JWT_SECRET = JWT_SECRET;
process.env.NODE_ENV = 'test';

function res() {
    return {
        statusCode: 200,
        body: null,
        status(n) {
            this.statusCode = n;
            return this;
        },
        json(b) {
            this.body = b;
            return this;
        }
    };
}

// -------------------------------------------------------------
// 1. TESTS FOR GOOGLE LOGIN & ID_TOKEN VERIFICATION
// -------------------------------------------------------------
test('Google login rejects missing idToken and missing OTP with 400', async () => {
    // Sandbox auth controller
    const exports = {};
    const module = { exports };
    const pool = { query: async () => [[]] };
    const sandbox = {
        exports,
        module,
        require: name => (name.includes('database') ? pool : require(name)),
        process: { env: { ...process.env, NODE_ENV: 'test', JWT_SECRET } },
        console,
        Date,
        Map,
        fetch,
        encodeURIComponent
    };

    const filePath = path.join(__dirname, '../controllers/auth.controller.js');
    vm.runInNewContext(fs.readFileSync(filePath, 'utf8'), sandbox);
    const { googleLogin } = sandbox.module.exports;

    const r = res();
    await googleLogin({ body: { email: 'user@gmail.com' } }, r);
    assert.equal(r.statusCode, 400);
    assert.equal(r.body.success, false);
    assert.ok(r.body.message.includes('idToken') || r.body.message.includes('OTP'));
});

test('Google login rejects invalid idToken with 401', async () => {
    const exports = {};
    const module = { exports };
    const pool = { query: async () => [[]] };
    const sandbox = {
        exports,
        module,
        require: name => (name.includes('database') ? pool : require(name)),
        process: { env: { ...process.env, NODE_ENV: 'test', JWT_SECRET } },
        console,
        Date,
        Map,
        fetch: async () => ({
            ok: false,
            json: async () => ({ error_description: 'Invalid Value' })
        }),
        encodeURIComponent
    };

    const filePath = path.join(__dirname, '../controllers/auth.controller.js');
    vm.runInNewContext(fs.readFileSync(filePath, 'utf8'), sandbox);
    const { googleLogin } = sandbox.module.exports;

    const r = res();
    await googleLogin({ body: { idToken: 'invalid_tampered_token_xyz' } }, r);
    assert.equal(r.statusCode, 401);
    assert.equal(r.body.success, false);
    assert.ok(r.body.message.includes('thất bại') || r.body.message.includes('không hợp lệ'));
});

test('Google login accepts valid verified idToken and issues JWT', async () => {
    const mockUser = {
        UserID: 'u-google-1',
        Email: 'test.google@gmail.com',
        FullName: 'Google Test User',
        Role: 'USER',
        Status: 'ACTIVE',
        AvatarURL: 'https://lh3.googleusercontent.com/test'
    };

    const exports = {};
    const module = { exports };
    const pool = {
        query: async (sql) => {
            if (sql.includes('SELECT * FROM Users WHERE Email')) {
                return [[mockUser]];
            }
            if (sql.includes('INSERT INTO Refresh_Tokens')) {
                return [{ affectedRows: 1 }];
            }
            return [[]];
        }
    };

    const sandbox = {
        exports,
        module,
        require: name => (name.includes('database') ? pool : require(name)),
        process: { env: { ...process.env, NODE_ENV: 'test', JWT_SECRET } },
        console,
        Date,
        Map,
        fetch,
        encodeURIComponent
    };

    const filePath = path.join(__dirname, '../controllers/auth.controller.js');
    vm.runInNewContext(fs.readFileSync(filePath, 'utf8'), sandbox);
    const { googleLogin } = sandbox.module.exports;

    const r = res();
    await googleLogin({ body: { idToken: 'mock-google-token-verified-123' } }, r);
    assert.equal(r.statusCode, 200);
    assert.equal(r.body.success, true);
    assert.ok(r.body.accessToken);
    assert.equal(r.body.user.email, 'test.google@gmail.com');
});

// -------------------------------------------------------------
// 2. TESTS FOR BAN/DELETE TOKEN INVALIDATION IN MIDDLEWARE
// -------------------------------------------------------------
test('verifyToken rejects banned user even with valid unexpired JWT', async () => {
    const validToken = jwt.sign({ userId: 'BANNED_USER_ID', role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });

    const pool = {
        query: async (sql, params) => {
            if (sql.includes('FROM Users WHERE UserID')) {
                return [[{ UserID: params[0], Role: 'USER', Status: 'BANNED' }]];
            }
            return [[]];
        }
    };

    const exports = {};
    const module = { exports };
    const sandbox = {
        exports,
        module,
        require: name => (name.includes('database') ? pool : require(name)),
        process: { env: { JWT_SECRET } },
        console
    };

    const filePath = path.join(__dirname, '../middleware/auth.middleware.js');
    vm.runInNewContext(fs.readFileSync(filePath, 'utf8'), sandbox);
    const { verifyToken } = sandbox.module.exports;

    let nextCalled = false;
    const req = {
        headers: { authorization: `Bearer ${validToken}` }
    };
    const r = res();

    await verifyToken(req, r, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(r.statusCode, 403);
    assert.equal(r.body.success, false);
    assert.equal(r.body.code, 'ACCOUNT_BANNED');
});

test('verifyToken rejects deleted user with valid JWT', async () => {
    const validToken = jwt.sign({ userId: 'DELETED_USER_ID', role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });

    const pool = {
        query: async (sql, params) => {
            if (sql.includes('FROM Users WHERE UserID')) {
                return [[{ UserID: params[0], Role: 'USER', Status: 'DELETED' }]];
            }
            return [[]];
        }
    };

    const exports = {};
    const module = { exports };
    const sandbox = {
        exports,
        module,
        require: name => (name.includes('database') ? pool : require(name)),
        process: { env: { JWT_SECRET } },
        console
    };

    const filePath = path.join(__dirname, '../middleware/auth.middleware.js');
    vm.runInNewContext(fs.readFileSync(filePath, 'utf8'), sandbox);
    const { verifyToken } = sandbox.module.exports;

    let nextCalled = false;
    const req = {
        headers: { authorization: `Bearer ${validToken}` }
    };
    const r = res();

    await verifyToken(req, r, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(r.statusCode, 403);
    assert.equal(r.body.success, false);
    assert.equal(r.body.code, 'ACCOUNT_DELETED');
});

test('verifyToken allows active user and populates req.user with DB status', async () => {
    const validToken = jwt.sign({ userId: 'ACTIVE_USER_ID', role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });

    const pool = {
        query: async (sql, params) => {
            if (sql.includes('FROM Users WHERE UserID')) {
                return [[{ UserID: params[0], Role: 'USER', Status: 'ACTIVE', FullName: 'Nguyen Van A', Email: 'a@gmail.com' }]];
            }
            return [[]];
        }
    };

    const exports = {};
    const module = { exports };
    const sandbox = {
        exports,
        module,
        require: name => (name.includes('database') ? pool : require(name)),
        process: { env: { JWT_SECRET } },
        console
    };

    const filePath = path.join(__dirname, '../middleware/auth.middleware.js');
    vm.runInNewContext(fs.readFileSync(filePath, 'utf8'), sandbox);
    const { verifyToken } = sandbox.module.exports;

    let nextCalled = false;
    const req = {
        headers: { authorization: `Bearer ${validToken}` }
    };
    const r = res();

    await verifyToken(req, r, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.user.userId, 'ACTIVE_USER_ID');
    assert.equal(req.user.status, 'ACTIVE');
    assert.equal(req.user.fullName, 'Nguyen Van A');
});
