export type DonationMonth={month:string;currency:string;amount_cents:number;count:number};
export function donationSeries(rows:DonationMonth[],currency:string,now=new Date()){
 const current=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1);
 return Array.from({length:6},(_,i)=>{const d=new Date(current);d.setUTCMonth(d.getUTCMonth()-5+i);const key=d.toISOString().slice(0,7);const match=rows.find(r=>r.month===key&&r.currency===currency);return {month:key,label:d.toLocaleDateString('en-US',{month:'short',year:'numeric',timeZone:'UTC'}),cents:match?.amount_cents??0,count:match?.count??0};});
}
