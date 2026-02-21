/// <reference types="@sveltejs/kit" />

declare namespace App {
  interface Error {
    message: string;
    code?: number;
  }
  
  interface Locals {}
  interface PageData {}
  interface Platform {}
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      HENRIK_KEY: string;
      PORT?: string;
      ORIGIN?: string;
    }
  }
}

export {};
