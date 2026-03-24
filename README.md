# Korancenter – Hemsida

Online-institut för koranundervisning för kvinnor.

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** – styling
- **Supabase** – databas, autentisering, RLS
- **Klarna** – betalning (kort + Swish)
- **Resend** – transaktionella e-post
- **Vercel** – deployment

---

## Kom igång

### 1. Installera beroenden
```bash
npm install
```

### 2. Konfigurera miljövariabler
```bash
cp .env.local.example .env.local
```
Fyll i dina nycklar för Supabase, Klarna och Resend i `.env.local`.

### 3. Sätt upp Supabase-databasen
1. Skapa ett projekt på [supabase.com](https://supabase.com)
2. Gå till **SQL Editor**
3. Kör hela innehållet i `supabase/schema.sql`

### 4. Starta lokalt
```bash
npm run dev
```
Öppna [http://localhost:3000](http://localhost:3000)

---

## Projektstruktur

```
korancenter/
├── app/
│   ├── page.tsx                  # Startsida
│   ├── om-oss/page.tsx           # Om oss
│   ├── kurser/page.tsx           # Kurser & Priser
│   ├── kontakt/page.tsx          # Kontakt
│   ├── logga-in/page.tsx         # Inloggning
│   ├── aterstall-losenord/       # Återställ lösenord
│   ├── portal/                   # Elevportal (skyddad)
│   │   ├── layout.tsx            # Sidebar-layout
│   │   ├── page.tsx              # Dashboard
│   │   ├── kurser/               # Mina kurser
│   │   ├── schema/               # Lektionsschema
│   │   ├── material/             # Lektionsmaterial
│   │   └── meddelanden/          # Meddelanden
│   ├── admin/page.tsx            # Adminpanel
│   └── api/
│       ├── auth/callback/        # Supabase auth callback
│       ├── klarna/               # Klarna-integration
│       └── resend/               # E-post (kontakt + bekräftelse)
├── components/
│   ├── Navbar.tsx
│   └── Footer.tsx
├── lib/supabase/
│   ├── client.ts                 # Client-side Supabase
│   └── server.ts                 # Server-side Supabase
├── middleware.ts                  # Auth-skydd för /portal och /admin
└── supabase/schema.sql           # Databasschema + RLS
```

---

## Driftsättning på Vercel

1. Pusha koden till GitHub
2. Importera repot på [vercel.com](https://vercel.com)
3. Lägg till miljövariabler under Settings i Vercel-projektet
4. Deployera – Vercel hanterar SSL automatiskt

---

## Klarna-integration

Klarna Payments används för betalning vid kursanmälan.

- **Testmiljö:** `https://api.playground.klarna.com`
- **Produktion:** `https://api.klarna.com`
- Sätt `KLARNA_ENV=sandbox` för test, `KLARNA_ENV=production` för live

---

## Resend – E-post

Två e-postflöden:
1. **Kontaktformulär** – `/api/resend/contact`
2. **Betalningsbekräftelse** – `/api/resend/confirmation`

Konfigurera din domän på [resend.com](https://resend.com) och lägg till DNS-poster.
