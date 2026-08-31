# Akademia Sportive SaaS — Versioni Fillestar

Ky është versioni i parë i projektit për platformën SaaS të menaxhimit të akademive sportive.

## Çfarë përmban

- Next.js 14 + TypeScript
- Tailwind CSS
- Dashboard profesional në shqip
- Sidebar dhe topbar responsive
- Grafikë performance dhe pjesëmarrjeje
- Ekipet
- Sportistët
- Seancat stërvitore
- Ndeshjet
- Performanca
- Skautimi
- Pagesat
- Financa
- Raportet
- Kalendari
- Ushtrimet
- Taktikat
- Baza e njohurive
- Cilësimet
- Faqe hyrjeje
- Të dhëna demo

## Si ta hapësh në Windows

1. Shkarko ZIP-in.
2. Bëj `Extract All...` në Desktop.
3. Hape folderin `AkademiaSportive` me Visual Studio Code.
4. Në VS Code hap Terminalin: `Terminal > New Terminal`.
5. Ekzekuto:

```powershell
npm install
```

6. Pastaj:

```powershell
npm run dev
```

7. Hape në browser:

```text
http://localhost:3000
```

Faqja e hyrjes është:

```text
http://localhost:3000/hyrje
```

## Nëse PowerShell bllokon npm

Provo:

```powershell
npm.cmd install
npm.cmd run dev
```

## Çfarë bëjmë më pas

Ky version është frontend-i bazë profesional. Hapat e ardhshëm do t'i bëjmë pjesë-pjesë:

1. PostgreSQL + Prisma
2. Multi-tenancy për akademitë
3. Authentication
4. RBAC / role dhe leje
5. CRUD real për sportistët, ekipet, trajnerët
6. Attendance real
7. Stërvitje dhe ndeshje
8. Pagesa dhe financa
9. Storage për dokumente/foto
10. Email / njoftime
11. SaaS plans dhe subscriptions
12. Platform Admin
13. Teste, siguri, deploy dhe UAT
