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

  // Lärarportal – kräver teacher eller admin
  if (pathname.startsWith("/larare")) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/logga-in";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Omdirigera inloggade från /logga-in baserat på roll
  if (pathname === "/logga-in" && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const dest =
      profile?.role === "admin" ? "/admin" :
      profile?.role === "teacher" ? "/larare" :
      "/portal";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return res;
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*", "/larare/:path*", "/logga-in"],
};
