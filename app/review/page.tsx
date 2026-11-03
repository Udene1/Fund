import Link from "next/link";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {verifySessionToken,sessionCookieName} from "@/lib/auth";
import ReviewQueue from "./review-queue";

export const dynamic="force-dynamic";
export default async function ReviewPage(){
 const jar=await cookies();if(!verifySessionToken(jar.get(sessionCookieName)?.value))redirect("/login");
 const [lessons,policies]=await Promise.all([
  prisma.lesson.findMany({where:{status:"PROPOSED"},include:{events:{include:{event:{select:{id:true,title:true}}}}},orderBy:{createdAt:"asc"}}),
  prisma.policy.findMany({where:{status:"PROPOSED"},include:{events:{include:{event:{select:{id:true,title:true}}}}},orderBy:{createdAt:"asc"}})
 ]);
 return <main className="shell"><header className="topbar"><Link href="/" className="back-link">← fund</Link><span className="private">REVIEW QUEUE</span></header><section className="detail-hero"><p className="eyebrow">YOUR APPROVAL REQUIRED</p><h1>What should become<br/>part of your memory?</h1><p className="intro">AI-generated lessons and policies stay inactive until you accept them. Check the evidence and limitations before approving.</p></section>
 <section className="detail-section"><div className="section-heading"><div><p className="eyebrow">PROPOSALS</p><h2>{lessons.length+policies.length} awaiting review</h2></div><span>{lessons.length} lessons · {policies.length} policies</span></div>
 {lessons.length+policies.length===0?<div className="empty">Nothing needs your approval right now.</div>:<ReviewQueue lessons={lessons.map(x=>({id:x.id,statement:x.statement,limitations:x.limitations,events:x.events.map(y=>({event:y.event}))}))} policies={policies.map(x=>({id:x.id,title:x.title,triggerConditions:x.triggerConditions,response:x.response,rationale:x.rationale,exceptions:x.exceptions,events:x.events.map(y=>({event:y.event}))}))}/>}
 </section><footer><Link href="/">← Back to your memory</Link></footer></main>;
}
