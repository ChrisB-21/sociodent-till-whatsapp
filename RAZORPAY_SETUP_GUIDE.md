# Razorpay Configuration Guide

## Current Issue
The current live Razorpay credentials (`rzp_live_`) are causing authentication failures, likely because:
1. The live account may not be fully activated
2. Live credentials require additional verification from Razorpay
3. Some features may be restricted in live mode without proper business verification

## Test Credentials (For Development)
For testing purposes, you should use test credentials that start with `rzp_test_`. 
You can get test credentials from your Razorpay dashboard:

1. Go to Razorpay Dashboard
2. Switch to "Test Mode" 
3. Get your test Key ID and Key Secret
4. Update the .env files with test credentials

## Example Test Configuration
```bash
# For development/testing - these won't charge real money
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_key_secret

# For production - only use when live account is fully activated
RAZORPAY_KEY_ID=rzp_live_IdmsDlhHXg0haO
RAZORPAY_KEY_SECRET=kNVGp1kMbI0JHB8yZC4Du3Yn
```

## Current Setup
The application is configured with live credentials but they appear to be causing authentication issues.

## Quick Fix
To resolve immediately, either:
1. Get test credentials from Razorpay dashboard and use them for development
2. Contact Razorpay support to activate your live account
3. Use the mock payment system I'm creating below for testing
