import type { APIRoute } from 'astro';
import type { R2Bucket } from '@cloudflare/workers-types';

export const prerender = false;

interface CloudflareEnv {
  R2_FILESTORE?: R2Bucket;
}

interface ResourceConfig {
  r2Key: string;
  filename: string;
}

/**
 * Configuration mapping for downloadable resources.
 *
 * Each key represents a unique resource identifier, mapped to a configuration object containing:
 * - `r2Key`: The object key/path used to locate the file in Cloudflare R2 storage
 * - `filename`: The desired filename for the downloaded file as presented to the user
 *
 * @example
 * ```ts
 * const config = RESOURCES['we-serve-award'];
 * // Use config.r2Key to fetch from R2
 * ```
 */
const RESOURCES: Record<string, ResourceConfig> = {
  'we-serve-award': {
    r2Key: 'we-serve-award.pdf',
    filename: 'ManheimLions-We-Serve-Award.pdf',
  }
};

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const resource = url.searchParams.get('resource');

    if (!resource) {
      return new Response('Missing resource parameter', { status: 400 });
    }

    const resourceConfig = RESOURCES[resource];
    if (!resourceConfig) {
      return new Response('Invalid resource', { status: 404 });
    }

    // Get runtime environment
    const env = locals.runtime?.env as CloudflareEnv | undefined;


    // Get file from R2
    if (!env?.R2_FILESTORE) {
      return new Response('Storage not configured', { status: 500 });
    }

    const object = await env.R2_FILESTORE.get(resourceConfig.r2Key);

    if (!object) {
      return new Response('File not found', { status: 404 });
    }

    // Stream the file to the user
    return new Response(object.body as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${resourceConfig.filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return new Response('Server error', { status: 500 });
  }
};