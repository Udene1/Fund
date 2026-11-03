import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createSessionToken, sessionCookieName, sessionTtlSeconds } from "@/lib/auth";
export async function POST(request: NextRequest) {
 const expected=process.env.FUND_OWNER_PASSWORD;
 if(!expected) return NextResponse.json({error:"Owner sign-in is not configured."},{status:503});
 const body=await request.json().catch(()=>null); const supplied=typeof body?.password==="string"?body.password:"";
 const a=Buffer.from(expected),b=Buffer.from(supplied);
 if(!supplied||a.length!==b.length||!timingSafeEqual(a,b)) return NextResponse.json({error:"Incorrect password."},{status:401});
 let token:string; try{token=createSessionToken()}catch{return NextResponse.json({error:"Session security is not configured."},{status:503})}
 const response=NextResponse.json({authenticated:true});
 response.cookies.set(sessionCookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:sessionTtlSeconds});
 return response;
}
