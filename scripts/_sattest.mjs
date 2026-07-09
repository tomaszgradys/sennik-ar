import satori from "satori";
import sharp from "sharp";
import { readFileSync } from "node:fs";
const f = readFileSync("scripts/fonts/Almarai.ttf");
const line = (label, txt, dir) => ({ type:"div", props:{ style:{ display:"flex", fontFamily:"AR", fontSize:70, color:"#fff", fontWeight:700, marginBottom:24, direction: dir },
  children: txt } });
const el = { type:"div", props:{ style:{ width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"flex-end",justifyContent:"center",padding:"40px",backgroundColor:"#182344" },
  children:[
    line("A","سمك القرش الكبير","rtl"),
    line("B","سمك القرش الكبير","ltr"),
  ] } };
const svg = await satori(el,{width:1200,height:630,fonts:[{name:"AR",data:f,weight:700,style:"normal"}]});
await sharp(Buffer.from(svg)).png().toFile("scripts/_sat_single.png");
console.log("ok");
