import { dehydrate } from "@tanstack/react-query";
import { WhopIframeSdkProvider } from "@whop/react";
import { Theme } from "frosted-ui";
import { WhopProvider } from "~/components/whop-context";
import {
  serverQueryClient,
  whopExperienceQuery,
  whopUserQuery,
} from "~/components/whop-context/whop-queries";

export const experimental_ppr = true;

export default async function ExperienceLayout({
  children,
  params,
}: LayoutProps<"/experiences/[experienceId]">) {
  const { experienceId } = await params;

  // Removed server-side prefetch - causes SSR crashes in production
  // Data will load client-side instead
  // serverQueryClient.prefetchQuery(whopExperienceQuery(experienceId));
  // serverQueryClient.prefetchQuery(whopUserQuery(experienceId));

  return (
    <WhopIframeSdkProvider>
      <Theme accentColor="blue" grayColor="slate">
        <WhopProvider
          state={dehydrate(serverQueryClient)}
          experienceId={experienceId}
        >
          {children}
        </WhopProvider>
      </Theme>
    </WhopIframeSdkProvider>
  );
}
