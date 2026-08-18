//apps/showcase/src/features/home/pages/HomePage.tsx
import PageShell from '../../../components/PageShell';
import Hero from '../components/Hero';
import ProblemSection from '../components/ProblemSection';
import HowItWorks from '../components/HowItWorks';
import DifferentiatorsSection from '../components/DifferentiatorsSection';
import CTASection from '../components/CTASection';

export default function HomePage() {
  return (
    <PageShell>
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <DifferentiatorsSection />
      <CTASection />
    </PageShell>
  );
}