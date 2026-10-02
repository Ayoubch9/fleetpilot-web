-- READ-ONLY MileVoxa Public Beta billing audit.
-- Run before production rollout to identify any existing paying customers.
-- This file does not update, cancel, refund, or create subscriptions.

select
  company_id,
  subscription_status,
  stripe_customer_id is not null as has_stripe_customer,
  stripe_subscription_id is not null as has_stripe_subscription,
  current_period_end,
  created_at,
  updated_at
from public.billing_customers
where lower(coalesce(subscription_status, '')) in (
  'active', 'paid', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired'
)
   or stripe_subscription_id is not null
order by created_at asc;
