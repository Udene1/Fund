import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeUserOrAgent } from "@/lib/auth";
const schema=z.object({title:z.string().trim().min(1).max(160),originalAccount:z.string().trim().min(1).max(30000),occurredAt:z.string().datetime().optional(),occurredAtNote:z.string().max(160).optional(),context:z.string().max(10000).optional(),tags:z.array(z.string().trim().min(1).max(40)).max(20).optional(),importance:z.number().int().min(1).max(5).optional()});
export async function POST(request:NextRequest){
 const denied=authorizeUserOrAgent(request);if(denied)return denied;
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Please provide a title and account of what happened.",details:parsed.error.flatten()},{status:400});
 const input=parsed.data;
 const event=await prisma.event.create({data:{title:input.title,originalAccount:input.originalAccount,occurredAt:input.occurredAt?new Date(input.occurredAt):undefined,occurredAtNote:input.occurredAtNote,context:input.context,tags:input.tags??[],importance:input.importance??3}});
 return NextResponse.json({data:event},{status:201});
}
