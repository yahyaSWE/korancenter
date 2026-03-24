import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  // Skyddade rutter – kräver inloggning
  if (pathname.startsWith("/portal")) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/logga-in";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Admin – kräver admin-roll
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/logga-in", req.url));
    }
    // Rollkontroll sker i komponenten via Supabase
  }

  // Omdirigera inloggade från /logga-in till /portal
  if (pathname === "/logga-in" && user) {
    return NextResponse.redirect(new URL("/portal", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*", "/logga-in"],
};
