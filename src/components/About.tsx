import { ServiceIcon } from "./icons";

export default function About({ bio, services }: { bio: string[]; services: { name: string; icon: string }[] }) {
  return (
    <section id="about" className="px-5">
      <div className="mt-[70px] border-t-[3px] border-ink pt-2.5 pb-[18px]">
        <h2 className="m-0 font-display text-[clamp(34px,5vw,64px)] leading-[.9] uppercase">About me</h2>
      </div>
      <div className="grid gap-5 pt-2.5 pb-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <span className="font-mono text-[13px] tracking-[.06em] uppercase">Bio</span>
        <div>
          {bio.map((paragraph) => (
            <p key={paragraph} className="mt-0 mb-[18px] max-w-[36ch] text-[clamp(19px,2vw,26px)] leading-[1.35]">
              {paragraph}
            </p>
          ))}
          <span className="font-mono text-[13px] tracking-[.06em] uppercase">Services</span>
          <ul className="mt-2.5 grid list-none gap-x-6 p-0 sm:grid-cols-2">
            {services.map((service) => (
              <li key={service.name} className="flex items-center gap-3 border-t border-ink py-3 text-[17px] leading-[1.3]">
                <ServiceIcon icon={service.icon} className="size-6 flex-none" />
                {service.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
