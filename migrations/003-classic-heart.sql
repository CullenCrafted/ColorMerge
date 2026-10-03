-- Apply after 001-secure-game.sql and 002-commerce.sql.
-- A paid Classic continuation is one atomic debit + authoritative state update.
CREATE OR REPLACE FUNCTION cm_classic_continue(
 p_wallet uuid, p_session text, p_round text, p_revision bigint, p_receipt uuid
) RETURNS TABLE(authorization_id uuid,balance integer) LANGUAGE plpgsql AS $$
DECLARE
 current_run jsonb; current_revision bigint; receipt uuid; wallet_balance integer;
 transaction_source text; previous cm_wallet_ledger%ROWTYPE;
BEGIN
 SELECT s.state,s.revision INTO current_run,current_revision
 FROM colormerge_sessions s WHERE s.id=p_session AND s.expires_at>now() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'game expired' USING ERRCODE='P0003'; END IF;
 transaction_source='consume:classic:'||p_wallet||':'||p_session||':'||p_round||':'||p_revision;
 SELECT * INTO previous FROM cm_wallet_ledger l WHERE l.source=transaction_source;
 IF FOUND THEN
  SELECT w.balance INTO wallet_balance FROM cm_wallets w WHERE w.id=p_wallet;
  RETURN QUERY SELECT previous.id,wallet_balance; RETURN;
 END IF;
 IF current_revision<>p_revision OR current_run->>'roundId'<>p_round
 OR current_run->>'status'<>'over' OR (current_run#>>'{engine,hearts}')::integer<>0
 THEN RAISE EXCEPTION 'game changed' USING ERRCODE='P0003'; END IF;
 SELECT a.authorization_id,a.balance INTO receipt,wallet_balance
 FROM cm_wallet_apply(p_wallet,transaction_source,-1,p_receipt) a;
 current_run=jsonb_set(current_run,'{engine,hearts}','1'::jsonb);
 current_run=jsonb_set(current_run,'{engine,currentColor}','{"r":255,"g":255,"b":255}'::jsonb);
 current_run=jsonb_set(current_run,'{engine,mixCount}','0'::jsonb);
 current_run=jsonb_set(current_run,'{engine,chosenColors}','[]'::jsonb);
 current_run=jsonb_set(current_run,'{engine,colorClicks}','{"red":0,"blue":0,"yellow":0,"white":0,"black":0}'::jsonb);
 current_run=jsonb_set(current_run,'{status}','"playing"'::jsonb);
 current_run=jsonb_set(current_run,'{revision}',to_jsonb(current_revision+1));
 UPDATE colormerge_sessions s SET state=current_run,revision=current_revision+1,
 expires_at=now()+interval '30 days' WHERE s.id=p_session;
 RETURN QUERY SELECT receipt,wallet_balance;
END $$;
