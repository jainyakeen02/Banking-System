/*
 * End-to-end API smoke test.
 * Requires: npm start running with a connected MongoDB database.
 * Creates two clearly marked test customers and records one online transfer.
 */
const baseUrl = process.env.API_BASE || "http://localhost:3000";
const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) },
    method: options.method || "GET",
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path}: ${response.status} ${data.message || "failed"}`);
  return data;
}

async function main() {
  const health = await request("/api/health");
  if (health.database !== "connected") throw new Error("MongoDB is not connected");

  const admin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@ledgerbank.com", password: "Admin@Ledger2026" }
  });
  const alice = { name: `Smoke Alice ${suffix}`, email: `smoke.alice.${suffix}@example.test`, password: "SmokePass123" };
  const bob = { name: `Smoke Bob ${suffix}`, email: `smoke.bob.${suffix}@example.test`, password: "SmokePass123" };
  const aliceOnboarded = await request("/api/admin/onboard-customer", { method: "POST", token: admin.token, body: { ...alice, initialDeposit: 1000 } });
  const bobOnboarded = await request("/api/admin/onboard-customer", { method: "POST", token: admin.token, body: { ...bob, initialDeposit: 0 } });
  const customer = await request("/api/auth/login", { method: "POST", body: { email: alice.email, password: alice.password } });
  await request("/api/auth/set-pin", { method: "POST", token: customer.token, body: { pin: "1234" } });
  await request("/api/transactions", {
    method: "POST",
    token: customer.token,
    body: { fromAccount: aliceOnboarded.customer.accountNumber, toAccount: bobOnboarded.customer.accountNumber, amount: 250, transactionPin: "1234", idempotencyKey: `smoke-transfer-${suffix}` }
  });
  const customerHistory = await request("/api/transactions", { token: customer.token });
  const audit = await request("/api/admin/transactions", { token: admin.token });
  if (!customerHistory.transactions.some(item => item.operation === "TRANSFER") || !audit.transactions.some(item => item.operation === "TRANSFER" && item.channel === "ONLINE")) {
    throw new Error("Transfer was not returned by both history endpoints");
  }
  console.log("API smoke test passed.");
  console.log(`Created test accounts: ${aliceOnboarded.customer.accountNumber}, ${bobOnboarded.customer.accountNumber}`);
}

main().catch(error => { console.error(`API smoke test failed: ${error.message}`); process.exitCode = 1; });
