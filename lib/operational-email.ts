import { renderMinistryEmail,type MinistryEmail } from './email-design';
type Payload=Record<string,unknown>;
const header=(s:string)=>s.replace(/[\r\n]+/g,' ').slice(0,200);
export function operationalEmail(kind:string,p:Payload,base:string){
 const value=(key:string)=>typeof p[key]==='string'?p[key] as string:'';
 const root=new URL(base);if(!['https:','http:'].includes(root.protocol)||root.username||root.password)throw Error('Invalid site URL');
 const site=root.href.replace(/\/$/,'');
 const footer='Sent to help coordinate your participation with TskAngel. Optional newsletter updates are a separate choice.';
 let message:MinistryEmail|null=null;
 if(kind==='application_received'||kind==='email_design_preview')message={subject:'Thank you for your willingness to serve!',eyebrow:'VOLUNTEER APPLICATION RECEIVED',title:'Thank you for your heart to serve.',paragraphs:[`Hi ${value('name').trim()||'there'},`,'Thank you for offering your time and talents to TskAngel. We’ve received your volunteer application, and we’re grateful for your willingness to care for our neighbors.'],steps:['Our team will review your interests, skills, and availability.','We’ll contact you about suitable opportunities to serve together.'],notice:'Application received · Pending review. A place at an outreach event is confirmed separately.',primary:{label:'Explore the outreach calendar',url:site+'/calendar'},secondary:{label:'Visit TskAngel',url:site},footer:'You received this confirmation because you submitted a volunteer application. You have not been subscribed to newsletters.',preview:kind==='email_design_preview'};
 if(kind==='admin_application')message={subject:'A volunteer application is ready for review',eyebrow:'LEADERSHIP UPDATE',title:'Someone is ready to lend a hand.',paragraphs:['A new volunteer application is waiting in your private dashboard. Sign in to review their interests, availability, and contact information.'],primary:{label:'Review volunteer applications',url:site+'/admin'},notice:'Applicant details are available only after administrator sign-in.',footer:'Private operational notice for authorized TskAngel leadership.'};
 if(kind==='application_status'){
  const status=value('status');const approved=status==='approved',declined=status==='declined';
  message={subject:'An update on your TskAngel volunteer application',eyebrow:'YOUR VOLUNTEER APPLICATION',title:approved?'Your volunteer application is approved.':declined?'An update on your application.':'Your application is under review.',paragraphs:[approved?'Thank you for your willingness to serve. Our team has approved your volunteer application. Explore the calendar for upcoming opportunities.':declined?'Thank you for offering to serve with TskAngel. We’re unable to approve your application at this time. We appreciate the time and care you put into reaching out.':'Thank you for your patience. Our team is reviewing your volunteer application.'],notice:approved?'Event registrations are reviewed separately. Please wait for confirmation before attending.':undefined,primary:{label:'View outreach opportunities',url:site+'/calendar'},footer};
 }
 if(kind==='registration_received'||kind==='event_changed'){
  const changed=kind==='event_changed',title=value('title'),zone=value('timeZone');
  const time=(v:unknown)=>{try{return new Intl.DateTimeFormat('en-US',{dateStyle:'full',timeStyle:'short',timeZone:zone}).format(new Date(String(v)));}catch{return 'Please check the latest event details';}};
  const before=p.before&&typeof p.before==='object'?p.before as Payload:null;
  const details=`${title}\n${time(p.startsAt)} – ${time(p.endsAt)}\nTime zone: ${zone}\nPublic location: ${value('location')}\nEvent status: ${value('status')}`;
  const paragraphs=[changed?'Plans have changed for an outreach event you registered for. Please review the updated details before attending.':'Thank you for offering to serve at this outreach event. Your registration request has been received and is waiting for administrator approval.',details];
  if(before)paragraphs.push(`Previous details\n${time(before.startsAt)} – ${time(before.endsAt)}\n${String(before.location||'')}\nStatus: ${String(before.status||'')}`);
  if(p.published===false)paragraphs.push('This event is no longer publicly listed. Please contact the organizer before attending.');
  message={subject:header((changed?'Outreach update: ':'Registration received: ')+title),eyebrow:changed?'IMPORTANT OUTREACH UPDATE':'EVENT REGISTRATION RECEIVED',title:changed?(value('status')==='Canceled'?'This outreach event is canceled.':'Please review your event update.'):'Thank you for making time to serve.',paragraphs,notice:'Dates, times, and locations may change. Always check the latest calendar before attending.',primary:{label:'View current event details',url:site+'/calendar'+(p.published===false?'':'/'+encodeURIComponent(value('eventId')))},secondary:{label:'Cancel my event registration',url:site+'/registration/cancel?token='+encodeURIComponent(value('cancelToken'))},footer};
 }
 if(kind==='registration_reviewed'){
  const approved=value('status')==='approved';const paragraphs=[approved?'Your place has been approved. We look forward to serving alongside you.':'We’re unable to confirm a place for this event. Thank you for your willingness to help.'];
  if(approved&&value('privateInstructions'))paragraphs.push('Private meeting instructions\n'+value('privateInstructions'));
  message={subject:header(`Registration ${approved?'approved':'update'}: ${value('title')}`),eyebrow:'YOUR EVENT REGISTRATION',title:approved?'Your place is confirmed.':'An update on your registration.',paragraphs,notice:'Please check the latest event date, time, and status before attending.',primary:{label:'Review event details',url:site+'/calendar/'+encodeURIComponent(value('eventId'))},secondary:approved?{label:'Cancel my registration',url:site+'/registration/cancel?token='+encodeURIComponent(value('cancelToken'))}:undefined,footer};
 }
 if(kind==='registration_canceled')message={subject:'Your event registration was canceled',eyebrow:'REGISTRATION CANCELLATION CONFIRMED',title:'Thank you for letting us know.',paragraphs:['Your event registration has been canceled and your place released. We hope another opportunity to serve together will fit your schedule.'],primary:{label:'Find another opportunity',url:site+'/calendar'},footer};
 if(!message)return null;
 if(message.preview)message.subject='[Design preview] '+message.subject;
 return renderMinistryEmail(message);
}
