import { projectRequest } from '../../../lib/generation';
export { WebApiRequestError } from '../../../pages/work/adapters/webApi';
type Options = Omit<RequestInit,'body'> & { body?: unknown; skipAuthRedirect?: boolean };
export function requestWebApi<T>(path:string,{body,skipAuthRedirect:_,...options}:Options = {}) {
  return projectRequest<T>(path,{...options,...(body === undefined ? {} : {body:JSON.stringify(body)})});
}
export const getWebApiAssetUrl = (path:string) => path;
