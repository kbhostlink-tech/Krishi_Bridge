"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import {
  getTeamMembers,
  getTeamUiLabels,
  teamImageSrc,
  type TeamMember,
} from "@/lib/team-members";

type AboutTeamSectionProps = {
  sectionLabel: string;
};

function useInView(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function TeamCard({
  member,
  visible,
  delay,
  advisorLabel,
  expertiseAreasLabel,
}: {
  member: TeamMember;
  visible: boolean;
  delay: number;
  advisorLabel: string;
  expertiseAreasLabel: string;
}) {
  const isFeatured = member.featured;

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-sage-100 bg-white shadow-sm transition-all hover:border-sage-300 hover:shadow-md ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms`, transitionDuration: "600ms" }}
    >
      <div className={isFeatured ? "lg:flex lg:items-stretch" : ""}>
        <div
          className={`relative shrink-0 overflow-hidden bg-sage-50 ${
            isFeatured ? "aspect-[4/5] lg:aspect-auto lg:w-72 lg:min-h-[20rem]" : "aspect-[4/5]"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={teamImageSrc(member.imageFile)}
            alt={member.name}
            loading="lazy"
            className="h-full w-full object-cover object-[center_12%]"
          />
          {member.group === "advisory" ? (
            <span className="absolute bottom-3 left-3 rounded-full bg-sage-900/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {advisorLabel}
            </span>
          ) : null}
        </div>

        <div className={`flex flex-col p-5 sm:p-6 ${isFeatured ? "lg:justify-center lg:p-8" : ""}`}>
          <div className="border-b border-sage-100 pb-4">
            <p
              className={`font-heading font-semibold text-sage-950 ${
                isFeatured ? "text-2xl sm:text-3xl" : "text-xl"
              }`}
            >
              {member.name}
            </p>
            <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.14em] text-terracotta">
              {member.designation}
            </p>
          </div>

          <p className={`mt-4 leading-7 text-sage-700 ${isFeatured ? "text-base" : "text-sm"}`}>
            {member.bio}
          </p>

          <ul
            className="mt-4 flex flex-wrap gap-2"
            aria-label={`${member.name} — ${expertiseAreasLabel}`}
          >
            {member.expertise.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-sage-100 bg-sage-50/60 px-2.5 py-1 text-[11px] font-semibold text-sage-700"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export function AboutTeamSection({ sectionLabel }: AboutTeamSectionProps) {
  const locale = useLocale();
  const ui = getTeamUiLabels(locale);
  const ordered = getTeamMembers(locale);
  const { ref, visible } = useInView();
  const featured = ordered.find((member) => member.featured);
  const rest = ordered.filter((member) => !member.featured);

  return (
    <div ref={ref} aria-label={sectionLabel}>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-sage-500">{sectionLabel}</p>

      <div className="mt-6 space-y-5">
        {featured ? (
          <TeamCard
            member={featured}
            visible={visible}
            delay={80}
            advisorLabel={ui.advisor}
            expertiseAreasLabel={ui.expertiseAreas}
          />
        ) : null}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {rest.map((member, index) => (
            <TeamCard
              key={member.id}
              member={member}
              visible={visible}
              delay={160 + index * 70}
              advisorLabel={ui.advisor}
              expertiseAreasLabel={ui.expertiseAreas}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
