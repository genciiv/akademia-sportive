import { redirect } from "next/navigation";
import {
  BadgeCheck,
  Code2,
  Globe2,
  Megaphone,
  Palette,
  TrendingUp,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";

type ServiceCard = {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ElementType;
  items: string[];
  iconClass: string;
};

const serviceCards: ServiceCard[] = [
  {
    eyebrow: "Rritje Online",
    title: "Digital Marketing",
    description:
      "Menaxhim dhe strategji për rrjetet sociale, reklama të paguara dhe automatizim që sjellin kontakte të reja.",
    icon: Megaphone,
    iconClass:
      "bg-sky-50 text-sky-600",
    items: [
      "Social Media Management",
      "Social Media Strategy",
      "Paid Advertising",
      "Meta Ads",
      "Google Ads",
      "TikTok Ads",
      "Lead Generation",
      "Email Marketing",
      "Marketing Automation",
    ],
  },
  {
    eyebrow: "Identitet & Përmbajtje",
    title: "Creative & Branding",
    description:
      "Identiteti vizual dhe përmbajtja që e bëjnë markën tuaj të dallohet — nga logoja te produksioni video.",
    icon: Palette,
    iconClass:
      "bg-indigo-50 text-indigo-600",
    items: [
      "Brand Strategy",
      "Logo Design",
      "Visual Identity",
      "Graphic Design",
      "Creative Campaigns",
      "Content Creation",
      "Photography",
      "Video Production",
      "Motion Graphics",
    ],
  },
  {
    eyebrow: "Website & E-commerce",
    title: "Web & Technology",
    description:
      "Website, dyqane online dhe faqe uljeje të optimizuara për konvertim dhe për t'u gjetur në kërkim.",
    icon: Globe2,
    iconClass:
      "bg-cyan-50 text-cyan-700",
    items: [
      "Website Design",
      "Website Development",
      "E-commerce",
      "Landing Pages",
      "UI/UX Design",
      "SEO",
      "Website Maintenance",
    ],
  },
  {
    eyebrow: "Performancë Komerciale",
    title: "Konsulencë Shitje & Marketing",
    description:
      "Strategji praktike për të përmirësuar shitjet, procesin komercial dhe mënyrën si prezantohen ofertat.",
    icon: TrendingUp,
    iconClass:
      "bg-violet-50 text-violet-600",
    items: [
      "Sales Strategy",
      "Marketing Strategy",
      "Offer Positioning",
      "Sales Process",
      "Customer Journey",
      "Growth Consulting",
    ],
  },
  {
    eyebrow: "Zgjidhje të Personalizuara",
    title: "Software Development",
    description:
      "Aplikacione dhe sisteme të ndërtuara sipas nevojave reale të organizatës dhe proceseve të saj.",
    icon: Code2,
    iconClass:
      "bg-blue-50 text-blue-700",
    items: [
      "Web Applications",
      "Custom Platforms",
      "Process Automation",
      "System Integrations",
      "Internal Tools",
      "Custom SaaS Solutions",
    ],
  },
];

export default async function ServicesPage() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.DASHBOARD_VIEW
    );

  if (!access.ok) {
    if (access.response.status === 401) {
      redirect("/hyrje");
    }

    redirect("/");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1420px] rounded-[24px] bg-white px-5 py-7 sm:px-7 lg:px-9 lg:py-10">
        <section className="mx-auto max-w-4xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
            Shërbimet tona
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
            ZGJIDHJE TË{" "}
            <span className="text-sky-600">
              INTEGRUARA
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            Gjashtë fusha shërbimi që mbulojnë gjithë ciklin —
            nga strategjia dhe krijimtaria, te zbatimi teknik
            dhe menaxhimi fiskal.
          </p>
        </section>

        <section id="sherbimet" className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {serviceCards.map((service) => {
            const Icon = service.icon;

            return (
              <article
                key={service.title}
                className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${service.iconClass}`}
                >
                  <Icon size={21} />
                </div>

                <p className="mt-5 text-[11px] font-bold tracking-[0.18em] text-sky-700">
                  {service.eyebrow}
                </p>

                <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-950">
                  {service.title}
                </h2>

                <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-600">
                  {service.description}
                </p>

                <ul className="mt-5 space-y-2.5">
                  {service.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-slate-600"
                    >
                      <BadgeCheck
                        size={16}
                        className="mt-0.5 shrink-0 text-sky-600"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>

      </div>
    </AppShell>
  );
}