import { Coffee, Hand, Lightbulb, Moon, Smile, Sparkles, Sun, Sunrise, SunMoon, WandSparkles } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';


const timeGreetings = [
  { key: 'create.greetingMorning', Icon: Sun },
  { key: 'create.greetingAfternoon', Icon: SunMoon },
  { key: 'create.greetingEvening', Icon: Moon },
] as const;
const greetings = [
  { key: 'create.greetingGoodToSee', Icon: Hand },
  { key: 'create.greetingWelcomeBack', Icon: Smile },
  { key: 'create.greetingReady', Icon: Sparkles },
  { key: 'create.greetingIdeas', Icon: Lightbulb },
  { key: 'create.greetingMake', Icon: WandSparkles },
  { key: 'create.greetingFresh', Icon: Sunrise },
  { key: 'create.greetingTakeYourTime', Icon: Coffee },
] as const;
type Greeting = (typeof timeGreetings)[number] | (typeof greetings)[number];
const storageKey = 'yrkie.create.greeting.v1';
let lastGreeting: string | null = null;

function timeGreeting() {
  const hour = new Date().getHours();
  return timeGreetings[hour < 12 ? 0 : hour < 18 ? 1 : 2];
}

export function CreateHeading({ userName }: { userName: string }) {
  const { t } = useTranslation('dashboard');
  const [greeting, setGreeting] = useState<Greeting>(timeGreeting);
  const selected = useRef(false);

  useLayoutEffect(() => {
    // Select once per visit, including React StrictMode's effect replay.
    if (selected.current) return;
    selected.current = true;
    let previous = lastGreeting;
    try { previous = sessionStorage.getItem(storageKey) ?? previous; } catch { /* Keep the in-memory previous greeting when storage is unavailable. */ }
    const choices = [timeGreeting(), ...greetings].filter(item => item.key !== previous);
    const next = choices[Math.floor(Math.random() * choices.length)];
    lastGreeting = next.key;
    try { sessionStorage.setItem(storageKey, next.key); } catch { /* The greeting still rotates within this page session. */ }
    setGreeting(next);
  }, []);

  const { Icon } = greeting;
  return <div className="dashboard-create-heading">
    <div className="dashboard-create-eyebrow" data-greeting={greeting.key}>
      <Icon aria-hidden="true" />
      <span>{t(greeting.key, { name: userName })}</span>
    </div>
    <h1>{t('create.title')}</h1>
  </div>;
}

