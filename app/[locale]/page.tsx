import { getProfiles, getAgencies } from '@/lib/supabase';
import { HomeClient } from '@/components/HomeClient';
import { ServiceType, District } from '@/lib/types';

export const revalidate = 10; // Revalidate every 10 seconds for fresh data

export default async function HomePage() {
  const [profiles, agencies] = await Promise.all([
    getProfiles(),
    getAgencies()
  ]);

  // Filter out disabled profiles
  const activeProfiles = profiles.filter(p => !p.isDisabled);

  // Calculate counts
  const totalCount = activeProfiles.length;
  const outcallCount = activeProfiles.filter(p => p.services.includes(ServiceType.OUTCALL)).length;
  const incallCount = activeProfiles.filter(p => p.services.includes(ServiceType.INCALL)).length;
  const massageCount = activeProfiles.filter(p => p.services.includes(ServiceType.MASSAGE)).length;

  // Count profiles per district
  const districtCounts = Object.values(District).reduce((acc, dist) => {
    const count = activeProfiles.filter(p => p.district === dist).length;
    if (count > 0) acc[dist] = count;
    return acc;
  }, {} as Record<string, number>);

  // Sort premium profiles
  const premiumProfiles = activeProfiles
    .filter(p => p.isPremium)
    .sort((a, b) => {
      const aUnavailable = a.isOnline === false;
      const bUnavailable = b.isOnline === false;
      if (aUnavailable && !bUnavailable) return 1;
      if (!aUnavailable && bUnavailable) return -1;
      const dateA = new Date(a.lastActive || 0).getTime();
      const dateB = new Date(b.lastActive || 0).getTime();
      return dateB - dateA;
    });

  // Sort standard profiles
  const standardProfiles = activeProfiles
    .filter(p => !p.isPremium)
    .sort((a, b) => {
      const aUnavailable = a.isOnline === false;
      const bUnavailable = b.isOnline === false;
      if (aUnavailable && !bUnavailable) return 1;
      if (!aUnavailable && bUnavailable) return -1;
      const dateA = new Date(a.lastActive || 0).getTime();
      const dateB = new Date(b.lastActive || 0).getTime();
      return dateB - dateA;
    });

  return (
    <HomeClient
      premiumProfiles={premiumProfiles}
      standardProfiles={standardProfiles}
      agencies={agencies}
      counts={{
        total: totalCount,
        outcall: outcallCount,
        incall: incallCount,
        massage: massageCount,
        districts: districtCounts
      }}
    />
  );
}
