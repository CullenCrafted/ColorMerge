import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFile, spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";

// A disposable, developer-supplied database only; production credentials are never read.
const database = process.env.TEST_POSTGRES_URL;
test("PostgreSQL wallet functions preserve idempotency and serialize money-derived hearts", {
  skip: !database ? "Set TEST_POSTGRES_URL to a disposable PostgreSQL database" : false,
  timeout: 60_000,
}, async () => {
  const schema = "cm_test_" + randomUUID().replaceAll("-", "");
  const connection = new URL(database!);
  const env = { ...process.env,
    PGHOST: connection.hostname, PGPORT: connection.port || "5432",
    PGDATABASE: decodeURIComponent(connection.pathname.slice(1)),
    PGUSER: decodeURIComponent(connection.username), PGPASSWORD: decodeURIComponent(connection.password),
    PGOPTIONS: "-c search_path=" + schema + ",public",
  };
  const sync = (sql: string, isolated = true) => {
    const result = spawnSync("psql", ["-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", sql], {
      env: isolated ? env : { ...env, PGOPTIONS: "" }, encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    return result.stdout.trim();
  };
  const query = (sql: string) => new Promise<string>((resolve, reject) => {
    execFile("psql", ["-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", sql], { env },
      (error, stdout, stderr) => error ? reject(new Error(String(stderr))) : resolve(String(stdout).trim()));
  });
  const wallet = randomUUID();
  const balance = () => sync("SELECT balance FROM cm_wallets WHERE id='" + wallet + "'");
  const apply = (source: string, delta: number) =>
    "SELECT * FROM cm_wallet_apply('" + wallet + "','" + source + "'," + delta + ",'" + randomUUID() + "')";
  sync("CREATE SCHEMA " + schema, false);
  try {
    const migrations = readdirSync("migrations").filter(name => /^\d+.*\.sql$/.test(name)).sort();
    assert.ok(migrations.includes("002-commerce.sql"), "Commerce migration must be present");
    for (const migration of migrations) sync(readFileSync("migrations/" + migration, "utf8"));
    sync("INSERT INTO cm_wallets(id,token_hash,recovery_hash) VALUES('" + wallet + "','token','recovery')");

    const credit = sync(apply("test:credit", 1));
    const repeat = sync(apply("test:credit", 1));
    assert.equal(credit, repeat, "Duplicate delivery returns the original authorization");
    assert.equal(balance(), "1");
    await assert.rejects(query(apply("test:credit", 2)), /conflicting transaction/);

    const debits = await Promise.allSettled([
      query("BEGIN; " + apply("consume:first", -1) + "; SELECT pg_sleep(0.1); COMMIT;"),
      query("BEGIN; " + apply("consume:second", -1) + "; COMMIT;"),
    ]);
    assert.equal(debits.filter(result => result.status === "fulfilled").length, 1, "Exactly one concurrent debit wins");
    assert.equal(debits.filter(result => result.status === "rejected").length, 1);
    assert.equal(balance(), "0", "Concurrent debits cannot overdraw");
    await assert.rejects(query(apply("consume:empty", -1)), /insufficient hearts/);
    assert.equal(sync("SELECT count(*) FROM cm_wallet_ledger WHERE source='consume:empty'"), "0");

    sync("INSERT INTO cm_ad_challenges(nonce,wallet_id,expires_at) VALUES('first','" + wallet + "',now()+interval '5 minutes'),('second','" + wallet + "',now()+interval '5 minutes')");
    const reward = (nonce: string, transaction: string) =>
      "SELECT cm_ad_reward('" + nonce + "','" + wallet + "','" + transaction + "')";
    sync(reward("first", "ad-transaction"));
    sync(reward("first", "ad-transaction"));
    assert.equal(balance(), "1", "Repeated ad callback credits once");
    await assert.rejects(query(reward("first", "different-transaction")), /challenge consumed/);
    await assert.rejects(query(reward("second", "ad-transaction")), /duplicate key/);
    assert.equal(sync("SELECT transaction_id IS NULL FROM cm_ad_challenges WHERE nonce='second'"), "t", "Failed transaction rolls back challenge consumption");
    assert.equal(balance(), "1");

    const order = randomUUID();
    sync("INSERT INTO cm_orders(id,wallet_id,sku,price_id,hearts,session_id,payment_intent) VALUES('" + order + "','" + wallet + "','pack','price',10,'checkout','payment')");
    sync(apply("stripe:checkout", 10));
    sync("SELECT cm_wallet_refund('payment','charge',1000,250)");
    assert.equal(balance(), "8", "Partial refund removes ceil(10*0.25) hearts");
    sync("SELECT cm_wallet_refund('payment','charge',1000,250)");
    sync("SELECT cm_wallet_refund('payment','charge',1000,100)");
    assert.equal(balance(), "8", "Duplicate or out-of-order refund cannot double-debit");
    sync("SELECT cm_wallet_refund('payment','charge',1000,500)");
    assert.equal(balance(), "6", "Larger refund removes only the incremental amount");
    sync("SELECT cm_wallet_refund('payment','charge',1000,1000)");
    assert.equal(balance(), "1");
    await assert.rejects(query("SELECT cm_wallet_refund('payment','charge',1000,1001)"), /invalid refund/);

    if (migrations.some(name => name.startsWith("004-"))) {
      const nativeEvent = (transaction: string, refund: boolean, hearts = 5, product = "hearts5") =>
        "SELECT cm_native_event('" + transaction + "','" + wallet + "','" + product + "'," + hearts + "," + refund + ")";
      sync(nativeEvent("native-purchase", false));
      sync(nativeEvent("native-purchase", false));
      assert.equal(balance(), "6", "Native transaction credits once");
      await assert.rejects(query(nativeEvent("native-purchase", false, 10)));
      await assert.rejects(query(nativeEvent("native-purchase", false, 5, "different")));
      assert.equal(balance(), "6", "Conflicting product or amount leaves balance unchanged");
      sync(nativeEvent("native-purchase", true));
      sync(nativeEvent("native-purchase", true));
      assert.equal(balance(), "1", "Native refund removes credit once");
      sync(nativeEvent("native-refund-first", true));
      sync(nativeEvent("native-refund-first", false));
      assert.equal(balance(), "1", "Refund tombstone prevents later purchase delivery from granting");
    }

    if (migrations.some(name => name.startsWith("003-"))) {
      const round = randomUUID();
      const state = {
        roundId: round, revision: 7, status: "over",
        engine: { hearts: 0, currentLevel: 3, recipe: { red: 1, white: 2 },
          targetColor: { r: 255, g: 170, b: 170 }, currentColor: { r: 0, g: 0, b: 0 },
          mixCount: 3, chosenColors: ["black", "black", "black"],
          colorClicks: { red: 0, yellow: 0, blue: 0, white: 0, black: 3 }, maxMixes: 3 },
      };
      sync("INSERT INTO colormerge_sessions(id,revision,state,expires_at) VALUES('classic',7,'" + JSON.stringify(state) + "',now()+interval '1 day')");
      const continuation = (expectedRound: string, revision: number) =>
        "SELECT * FROM cm_classic_continue('" + wallet + "','classic','" + expectedRound + "'," + revision + ",'" + randomUUID() + "')";
      await assert.rejects(query(continuation(randomUUID(), 7)));
      assert.equal(balance(), "1", "Stale round does not debit wallet");
      assert.equal(sync("SELECT revision FROM colormerge_sessions WHERE id='classic'"), "7");

      const receipt = sync(continuation(round, 7));
      assert.equal(balance(), "0");
      assert.equal(sync("SELECT state->>'status' FROM colormerge_sessions WHERE id='classic'"), "playing");
      assert.equal(sync("SELECT revision FROM colormerge_sessions WHERE id='classic'"), "8");
      assert.equal(sync("SELECT state#>>'{engine,hearts}' FROM colormerge_sessions WHERE id='classic'"), "1");
      assert.equal(sync("SELECT state#>>'{engine,mixCount}' FROM colormerge_sessions WHERE id='classic'"), "0");
      assert.equal(sync("SELECT state#>'{engine,recipe}' FROM colormerge_sessions WHERE id='classic'"), '{"red": 1, "white": 2}');
      assert.equal(sync(continuation(round, 7)), receipt, "Retried continuation returns its original receipt");
      assert.equal(balance(), "0", "Retried continuation does not spend again");

      const nextRound = randomUUID();
      const exhausted = { ...state, roundId: nextRound, revision: 9 };
      sync("UPDATE colormerge_sessions SET revision=9,state='" + JSON.stringify(exhausted) + "' WHERE id='classic'");
      await assert.rejects(query(continuation(nextRound, 9)), /insufficient hearts/);
      assert.equal(sync("SELECT revision FROM colormerge_sessions WHERE id='classic'"), "9");
      assert.equal(sync("SELECT state#>>'{engine,hearts}' FROM colormerge_sessions WHERE id='classic'"), "0", "Failed debit leaves Classic unchanged");
    }
  } finally {
    sync("DROP SCHEMA " + schema + " CASCADE", false);
  }
});
