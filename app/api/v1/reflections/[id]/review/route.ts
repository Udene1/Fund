import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {authorizeUserOrAgent} from "@/lib/auth";

type Context={params:Promise<{id:string}>};
const schema=z.object({
 action:z.enum(["accept","revise","retire"]),
 observations:z.string().max(10000).optional(),
 interpretation:z.string().max(10000).optional(),
 alternatives:z.string().max(10000).optional(),
 unresolvedQuestions:z.string().max(10000).optional()
});
export async function POST(request:NextRequest,context:Context){
 const denied=authorizeUserOrAgent(request);if(denied)return denied;
 const {id}=await context.params;
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Invalid reflection review",details:parsed.error.flatten()},{status:400});
 const {action,...fields}=parsed.data;
 if(action==="revise"&&!Object.values(fields).some(value=>value!==undefined))return NextResponse.json({error:"Provide at least one revised reflection field."},{status:400});
 try{
  const data=await prisma.reflection.update({where:{id},data:{
   status:action==="accept"?"ACCEPTED":action==="retire"?"RETIRED":"REVISED",
   ...(action==="revise"?fields:{})
  },include:{event:true}});
  return NextResponse.json({data});
 }catch{return NextResponse.json({error:"Reflection not found"},{status:404});}
}
