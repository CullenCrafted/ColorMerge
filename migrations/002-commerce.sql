-- Apply before enabling commerce. Amounts are hearts; money stays in Stripe.
CREATE TABLE IF NOT EXISTS cm_wallets (
 id uuid PRIMARY KEY, token_hash text UNIQUE NOT NULL, recovery_hash text UNIQUE NOT NULL,
 balance integer NOT NULL DEFAULT 0 , created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cm_orders (
 id uuid PRIMARY KEY, wallet_id uuid NOT NULL REFERENCES cm_wallets(id),
 sku text NOT NULL, price_id text NOT NULL, hearts integer NOT NULL CHECK (hearts > 0),
 session_id text UNIQUE, payment_intent text UNIQUE, refunded_hearts integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cm_wallet_ledger (
 id uuid PRIMARY KEY, wallet_id uuid NOT NULL REFERENCES cm_wallets(id),
 source text UNIQUE NOT NULL, delta integer NOT NULL, balance_after integer NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
-- Row lock serializes both debits and credits. Unique source prevents duplicate delivery.
CREATE OR REPLACE FUNCTION cm_wallet_apply(p_wallet uuid,p_source text,p_delta integer,p_id uuid)
RETURNS TABLE(authorization_id uuid,balance integer) LANGUAGE plpgsql AS $$
DECLARE current_balance integer; previous cm_wallet_ledger%ROWTYPE;
BEGIN
 SELECT w.balance INTO current_balance FROM cm_wallets w WHERE w.id=p_wallet FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'wallet missing'; END IF;
 SELECT * INTO previous FROM cm_wallet_ledger l WHERE l.source=p_source;
 IF FOUND THEN
   IF previous.wallet_id <> p_wallet OR previous.delta <> p_delta THEN RAISE EXCEPTION 'conflicting transaction'; END IF;
   RETURN QUERY SELECT previous.id,current_balance; RETURN;
 END IF;
 IF p_delta < 0 AND p_source LIKE 'consume:%' AND current_balance+p_delta < 0 THEN RAISE EXCEPTION 'insufficient hearts' USING ERRCODE='P0002'; END IF;
 UPDATE cm_wallets w SET balance=current_balance+p_delta WHERE w.id=p_wallet;
 INSERT INTO cm_wallet_ledger(id,wallet_id,source,delta,balance_after)
 VALUES(p_id,p_wallet,p_source,p_delta,current_balance+p_delta);
 RETURN QUERY SELECT p_id,current_balance+p_delta;
END $$;

-- Refunds can create a debt if already-spent hearts were refunded. Future credits
-- settle that debt; spending remains unavailable until the balance is positive.
CREATE OR REPLACE FUNCTION cm_wallet_refund(p_intent text,p_charge text,p_amount bigint,p_refunded bigint)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE o cm_orders%ROWTYPE; target integer;
BEGIN
 SELECT * INTO o FROM cm_orders WHERE payment_intent=p_intent FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'unsettled order'; END IF;
 IF NOT EXISTS(SELECT 1 FROM cm_wallet_ledger WHERE source='stripe:'||o.session_id) THEN RAISE EXCEPTION 'unsettled order'; END IF;
 IF p_amount <= 0 OR p_refunded < 0 OR p_refunded > p_amount THEN RAISE EXCEPTION 'invalid refund'; END IF;
 target=ceil(o.hearts::numeric*p_refunded/p_amount)::integer;
 IF target <= o.refunded_hearts THEN RETURN; END IF;
 PERFORM * FROM cm_wallet_apply(o.wallet_id,'refund:'||p_charge||':'||p_refunded,(o.refunded_hearts-target),gen_random_uuid());
 UPDATE cm_orders SET refunded_hearts=target WHERE id=o.id;
END $$;

CREATE TABLE IF NOT EXISTS cm_ad_challenges (
 nonce text PRIMARY KEY, wallet_id uuid NOT NULL REFERENCES cm_wallets(id),
 expires_at timestamptz NOT NULL, transaction_id text UNIQUE, authorization_id uuid
);
CREATE OR REPLACE FUNCTION cm_ad_reward(p_nonce text,p_wallet uuid,p_transaction text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE c cm_ad_challenges%ROWTYPE; receipt uuid;
BEGIN
 SELECT * INTO c FROM cm_ad_challenges WHERE nonce=p_nonce FOR UPDATE;
 IF NOT FOUND OR c.wallet_id<>p_wallet THEN RAISE EXCEPTION 'invalid challenge'; END IF;
 IF c.transaction_id IS NOT NULL THEN
  IF c.transaction_id<>p_transaction THEN RAISE EXCEPTION 'challenge consumed'; END IF;
  RETURN;
 END IF;
 IF c.expires_at<now() THEN RAISE EXCEPTION 'expired challenge'; END IF;
 -- Unique transaction constraint is checked before granting.
 UPDATE cm_ad_challenges SET transaction_id=p_transaction WHERE nonce=p_nonce;
 SELECT authorization_id INTO receipt FROM cm_wallet_apply(p_wallet,'admob:'||p_transaction,1,gen_random_uuid());
 UPDATE cm_ad_challenges SET authorization_id=receipt WHERE nonce=p_nonce;
END $$;
