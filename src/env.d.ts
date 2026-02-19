/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type CloudflareRuntime = import('@cloudflare/workers-types').Runtime;

declare namespace App {
  interface Locals {
    runtime?: CloudflareRuntime;
  }
}