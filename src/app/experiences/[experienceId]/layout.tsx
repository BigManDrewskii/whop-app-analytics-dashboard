'use client'

import { use } from "react";
import { WhopIframeSdkProvider } from "@whop/react";
import { Theme } from "frosted-ui";
import { WhopProvider } from "~/components/whop-context";

export default function ExperienceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = use(params);

  return (
    <WhopIframeSdkProvider>
      <Theme accentColor="blue" grayColor="slate">
        <WhopProvider
          state={{ queries: [], mutations: [] }}
          experienceId={experienceId}
        >
          {children}
        </WhopProvider>
      </Theme>
    </WhopIframeSdkProvider>
  );
}
