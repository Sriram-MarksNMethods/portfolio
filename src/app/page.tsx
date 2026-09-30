import About from "@/components/About";
import Contact from "@/components/Contact";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Showreel from "@/components/Showreel";
import SmoothScroll from "@/components/SmoothScroll";
import Works from "@/components/Works";
import { getContent } from "@/sanity/content";

// One scrolling page: hero → showreel zoom → works → about me → contact.
// Content comes from the Sanity dashboard (/studio) when connected, else src/data/site.ts.
export default async function Home() {
  const { person, bio, services, tools, showreel, categories } = await getContent();
  return (
    <>
      <SmoothScroll />
      <Header name={person.name} />
      <main>
        <Hero person={person} tools={tools} />
        <Showreel showreel={showreel} categories={categories} />
        <Works categories={categories} />
        <About bio={bio} services={services} />
        <Contact person={person} />
      </main>
    </>
  );
}
