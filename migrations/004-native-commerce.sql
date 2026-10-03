CREATE TABLE IF NOT EXISTS cm_native_transactions (
 transaction_id text PRIMARY KEY, wallet_id uuid NOT NULL REFERENCES cm_wallets(id),
 product_id text NOT NULL, hearts integer NOT NULL CHECK(hearts>0),
 refunded boolean NOT NULL DEFAULT false, credited boolean NOT NULL DEFAULT false
);
-- Refund-first delivery creates a tombstone; a later purchase cannot resurrect it.
CREATE OR REPLACE FUNCTION cm_native_event(p_tx text,p_wallet uuid,p_product text,p_hearts integer,p_refund boolean)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE t cm_native_transactions%ROWTYPE;
BEGIN
 INSERT INTO cm_native_transactions(transaction_id,wallet_id,product_id,hearts)
 VALUES(p_tx,p_wallet,p_product,p_hearts) ON CONFLICT DO NOTHING;
 SELECT * INTO t FROM cm_native_transactions WHERE transaction_id=p_tx FOR UPDATE;
 IF t.wallet_id<>p_wallet OR t.product_id<>p_product OR t.hearts<>p_hearts THEN RAISE EXCEPTION 'transaction conflict'; END IF;
 IF p_refund THEN
  IF t.refunded THEN RETURN; END IF;
  IF t.credited THEN PERFORM * FROM cm_wallet_apply(p_wallet,'native-refund:'||p_tx,-p_hearts,gen_random_uuid()); END IF;
  UPDATE cm_native_transactions SET refunded=true WHERE transaction_id=p_tx;
 ELSIF NOT t.refunded AND NOT t.credited THEN
  PERFORM * FROM cm_wallet_apply(p_wallet,'native:'||p_tx,p_hearts,gen_random_uuid());
  UPDATE cm_native_transactions SET credited=true WHERE transaction_id=p_tx;
 END IF;
END $$;
