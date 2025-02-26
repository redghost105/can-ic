-- process_successful_payment.sql
-- Function to process a successful payment transaction
-- This function updates both the payment record and service request status in a single transaction

CREATE OR REPLACE FUNCTION process_successful_payment(
  p_payment_id UUID,
  p_service_request_id UUID,
  p_payment_intent_id TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Begin transaction
  BEGIN
    -- Update payment status
    UPDATE payments
    SET
      status = 'completed',
      paid_at = NOW(),
      updated_at = NOW()
    WHERE
      id = p_payment_id AND
      payment_intent_id = p_payment_intent_id;
      
    -- Check if the payment was updated
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Payment record not found or already processed';
    END IF;
    
    -- Update service request status
    UPDATE service_requests
    SET
      status = 'paid',
      updated_at = NOW()
    WHERE
      id = p_service_request_id AND
      status = 'pending_payment';
      
    -- Check if the service request was updated
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Service request not found or not in pending_payment status';
    END IF;
    
    -- Commit the transaction
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback the transaction in case of any error
      ROLLBACK;
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT process_successful_payment(
--   '123e4567-e89b-12d3-a456-426614174000',  -- payment_id
--   '123e4567-e89b-12d3-a456-426614174001',  -- service_request_id
--   'pi_123456789'                           -- payment_intent_id
-- ); 