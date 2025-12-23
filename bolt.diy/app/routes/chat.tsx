import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { default as IndexRoute, loader as editorLoader } from './editor';

export const loader = editorLoader;
export default IndexRoute;
