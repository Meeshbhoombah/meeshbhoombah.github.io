import {
  HeroSection,
  WorkSection,
  WritingSection,
  OutputsSection,
  DigestSection,
  FollowSection,
} from './components/home';
import { getLiveWritingByCategory } from './lib/writing';

export default function HomePage() {
  const writingSections = getLiveWritingByCategory();

  return (
    <main className="content home-content">
      <HeroSection />
      <FollowSection />
      <WritingSection sections={writingSections} />
      <OutputsSection />
      <DigestSection />
      <WorkSection />
    </main>
  );
}
