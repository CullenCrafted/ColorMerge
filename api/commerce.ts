import type { Request, Response } from 'express';
import { commerceHandler } from '../server/commerce/handler.js';
export const config={api:{bodyParser:false}};
export default async function handler(req: Request,res: Response) {
 if(!Buffer.isBuffer(req.body)) {
  const chunks: Buffer[]=[]; let size=0;
  for await(const chunk of req) {
   const bytes=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
   size+=bytes.length; if(size>262144) return res.status(413).end();
   chunks.push(bytes);
  }
  req.body=Buffer.concat(chunks);
 }
 return commerceHandler(req,res);
}
