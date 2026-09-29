import Link from "next/link";
import Card from "@/components/ui/Card";

const features = [
  { icon: "🎤", title: "Interview Practice", text: "Practice with AI-evaluated questions across eight tracks, from quick drills to timed mock interviews." },
  { icon: "🏛️", title: "System Design", text: "Walk through a 14-stage design process and get challenged on your trade-offs." },
  { icon: "🐞", title: "Debug Lab", text: "Investigate realistic production incidents: observe, locate, identify, fix and verify." },
];

const btn = "rounded-lg px-6 py-3 text-lg font-medium";

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="py-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Master Software Engineering Interviews</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Practice real questions, design systems and debug incidents with instant AI feedback and spaced repetition.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/register" className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Get Started</Link>
          <Link href="/login" className={`${btn} border border-gray-300 bg-white hover:bg-gray-100`}>Log In</Link>
        </div>
      </section>
      <section className="grid gap-6 md:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title}>
            <div className="mb-3 text-4xl">{f.icon}</div>
            <h3 className="text-xl font-semibold">{f.title}</h3>
            <p className="mt-2 text-gray-600">{f.text}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
