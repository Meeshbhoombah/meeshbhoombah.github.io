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
      <WorkSection />
      <WritingSection sections={writingSections} />
      <OutputsSection />
      <DigestSection />
      <FollowSection />
    </main>
  );
}
