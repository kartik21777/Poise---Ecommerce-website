import Stripe from 'stripe';
import { env } from './env.js';

let stripeClient: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeClient) {
    if (!env.stripe.secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    stripeClient = new Stripe(env.stripe.secretKey);
  }
  return stripeClient;
};
