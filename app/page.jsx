import {
  HeroSection,
  WorkSection,
  WritingSection,
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
      <FollowSection />
      <DigestSection />
      <WritingSection sections={writingSections} />
    </main>
  );
}
