
import React from 'react';

const FeatureCard = ({ icon, title, desc, color }: { icon: string, title: string, desc: string, color: string }) => (
  <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group flex flex-col items-center text-center md:items-start md:text-left">
    <div className={`w-16 h-16 rounded-3xl ${color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm`}>
      <i className={`fa-solid ${icon} text-2xl text-bee-black`}></i>
    </div>
    <h3 className="text-2xl font-black text-bee-black mb-4 tracking-tight italic">{title}</h3>
    <p className="text-bee-grey font-medium leading-relaxed">{desc}</p>
  </div>
);

const Features: React.FC<{ t: any }> = ({ t }) => {
  return (
    <section id="services" className="py-32 bg-bee-light">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-24">
          <h2 className="text-5xl md:text-8xl font-black text-bee-black tracking-tighter italic mb-8 animate-fade-in-up leading-tight">
            {t.title}
          </h2>
          <div className="flex justify-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="h-2 w-24 bg-bee-yellow rounded-full"></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon="fa-truck-fast"
            title={t.f1_t}
            desc={t.f1_d}
            color="bg-bee-yellow"
          />
          <FeatureCard
            icon="fa-box-archive"
            title={t.f2_t}
            desc={t.f2_d}
            color="bg-bee-blue"
          />
          <FeatureCard
            icon="fa-map-location-dot"
            title={t.f3_t}
            desc={t.f3_d}
            color="bg-bee-yellow"
          />
        </div>
      </div>
    </section>
  );
};

export default Features;
