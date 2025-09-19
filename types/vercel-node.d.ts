declare module "@vercel/node" {
  import type { IncomingMessage, ServerResponse } from "http";

  export interface VercelRequest extends IncomingMessage {
    query: { [key: string]: string | string[] };
    cookies: { [key: string]: string };
    body: any;
  }

  export interface VercelResponse extends ServerResponse {
    json: (body: any) => void;
    status: (statusCode: number) => VercelResponse;
  }
}
