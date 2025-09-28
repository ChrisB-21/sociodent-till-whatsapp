/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RAZORPAY_KEY_ID: string
  readonly VITE_RAZORPAY_SECRET_KEY: string
  // Add other env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}