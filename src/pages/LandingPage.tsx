import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { landingPageContent } from "@/lib/landingContent";

/**
 * LandingPage - Public landing page skeleton
 * Introduces the project and provides CTA to access the demo
 * Supports both Italian and English based on LanguageContext
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const content = landingPageContent[language];

  const handleDemoClick = () => {
    navigate("/demo");
  };

  return (
    <div className="w-full space-y-0">
      {/* Hero Section */}
      <section className="w-full py-16 lg:py-24 bg-gradient-to-b from-card to-background px-4">
        <div className="container mx-auto max-w-4xl space-y-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
            {content.hero.title}
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            {content.hero.description}
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={handleDemoClick}
              className="px-8"
            >
              {content.hero.cta}
            </Button>
          </div>
        </div>
      </section>

      {/* Project Intro Section */}
      <section className="w-full py-16 lg:py-20 border-t border-border px-4">
        <div className="container mx-auto max-w-4xl space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">{content.intro.title}</h2>
            <p className="text-muted-foreground text-lg">
              {content.intro.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {content.intro.cards.map((card, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 lg:py-20 bg-secondary/10 border-t border-border px-4">
        <div className="container mx-auto max-w-4xl space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">{content.features.title}</h2>
          </div>

          <div className="space-y-4">
            {content.features.items.map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="text-primary font-bold text-2xl flex-shrink-0">✓</div>
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="w-full py-16 lg:py-20 border-t border-border px-4">
        <div className="container mx-auto max-w-4xl space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">{content.stack.title}</h2>
            <p className="text-muted-foreground">
              {content.stack.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold">{content.stack.frontend.label}</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                {content.stack.frontend.techs.map((tech, idx) => (
                  <li key={idx}>• {tech}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">{content.stack.backend.label}</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                {content.stack.backend.techs.map((tech, idx) => (
                  <li key={idx}>• {tech}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 lg:py-24 bg-primary/5 border-t border-border px-4">
        <div className="container mx-auto max-w-2xl space-y-6 text-center">
          <h2 className="text-3xl font-bold">{content.cta.title}</h2>
          <p className="text-lg text-muted-foreground">
            {content.cta.description}
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={handleDemoClick}
              className="px-8"
            >
              {content.cta.button}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
