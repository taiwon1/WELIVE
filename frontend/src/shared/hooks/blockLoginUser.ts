import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';

interface DecodedToken {
  id: string;
  role: string;
}

export function blockLoginUser<P>(
  getServerSidePropsFunc?: (ctx: GetServerSidePropsContext) => Promise<GetServerSidePropsResult<P>>,
) {
  return async function (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> {
    const cookieHeader = ctx.req?.headers?.cookie ?? '';
    const cookies = cookie.parse(cookieHeader);
    const token = cookies['access_token'];

    if (token) {
      try {
        const decoded = jwt.decode(token) as DecodedToken;
        const isLoggedIn = !!decoded?.id && !!decoded?.role;

        if (isLoggedIn) {
          return {
            redirect: {
              destination: '/denied',
              permanent: false,
            },
          };
        }
      } catch {}
    }

    if (getServerSidePropsFunc) {
      return await getServerSidePropsFunc(ctx);
    }

    return {
      props: {} as P,
    };
  };
}
