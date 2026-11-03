import Link from "next/link";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {verifySessionToken,sessionCookieName} from "@/lib/auth";
import ReviewQueue from "./review-queue";

export const dynamic="force-dynamic";
export default async function ReviewPage(){
 const jar=await cookies();if(!verifySessionToken(jar.get(sessionCookieName)?.value))redirect("/login");
 const [lessons,policies,reflections]=await Promise.all([
  prisma.lesson.findMany({where:{status:"PROPOSED"},include:{events:{include:{event:{select:{id:true,title:true}}}}},orderBy:{createdAt:"asc"}}),
  prisma.policy.findMany({where:{status:"PROPOSED"},include:{events:{include:{event:{select:{id:true,title:true}}}}},orderBy:{createdAt:"asc"}}),
  prisma.reflection.findMany({where:{status:"PROPOSED"},include:{event:{select:{id:true,title:true}}},orderBy:{createdAt:"asc"}})
 ]);
 const count=lessons.length+policies.length+reflections.length;
 return <main className="shell"><header className="topbar"><Link href="/" className="back-link">← fund</Link><span className="private">REVIEW QUEUE</span></header>
  <section className="detail-hero"><p className="eyebrow">YOUR APPROVAL REQUIRED</p><h1>What should become<br/>part of your memory?</h1><p className="intro">AI-generated reflections, lessons and policies stay marked as proposals until you accept them. Check the source events and limitations before approving.</p></section>
  <section className="detail-section"><div className="section-heading"><div><p className="eyebrow">PROPOSALS</p><h2>{count} awaiting review</h2></div><span>{reflections.length} reflections · {lessons.length} lessons · {policies.length} policies</span></div>
   {count===0?<div className="empty">Nothing needs your approval right now.</div>:<ReviewQueue
    reflections={reflections.map(x=>({id:x.id,observations:x.observations,interpretation:x.interpretation,alternatives:x.alternatives,unresolvedQuestions:x.unresolvedQuestions,event:x.event}))}
    lessons={lessons.map(x=>({id:x.id,statement:x.statement,limitations:x.limitations,events:x.events.map(y=>({event:y.event}))}))}
    policies={policies.map(x=>({id:x.id,title:x.title,triggerConditions:x.triggerConditions,response:x.response,rationale:x.rationale,exceptions:x.exceptions,events:x.events.map(y=>({event:y.event}))}))}
   />}
  </section><footer><Link href="/">← Back to your memory</Link></footer>
 </main>;
}
