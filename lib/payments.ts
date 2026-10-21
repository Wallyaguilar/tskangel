import Stripe from 'stripe';
export function paymentsReady(){return Boolean(process.env.STRIPE_SECRET_KEY&&/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY)&&process.env.STRIPE_WEBHOOK_SECRET&&process.env.SITE_URL&&process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY);}
export function stripe(){if(!paymentsReady())throw new Error('TEST_PAYMENTS_NOT_CONFIGURED');return new Stripe(process.env.STRIPE_SECRET_KEY!);}
