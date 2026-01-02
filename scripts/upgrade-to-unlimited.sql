-- Upgrade existing Mistyk Media customer to unlimited
UPDATE customers 
SET 
  plan_type = 'owner',
  rate_limit_per_hour = 999999,
  rate_limit_per_day = 999999,
  rag_enabled = 1,
  custom_branding = 1,
  updated_at = unixepoch()
WHERE 
  email LIKE '%mistyk%' 
  OR company_name LIKE '%Mistyk%'
  OR website_url LIKE '%mistykmedia.com%';

-- Verify the update
SELECT customer_id, email, company_name, plan_type, rate_limit_per_hour, rate_limit_per_day, api_key 
FROM customers 
WHERE plan_type = 'owner';
