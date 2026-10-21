import test from 'node:test';
import assert from 'node:assert/strict';
import {donationSeries} from '../lib/dashboard';
import {testimonialSchema} from '../lib/testimonials';
test('donation chart spans six UTC months across years without mixing currencies',()=>{const rows=[{month:'2025-12',currency:'usd',amount_cents:2500,count:2},{month:'2025-12',currency:'cad',amount_cents:9900,count:1}];const data=donationSeries(rows,'usd',new Date('2026-03-20T00:00:00Z'));assert.deepEqual(data.map(r=>r.month),['2025-10','2025-11','2025-12','2026-01','2026-02','2026-03']);assert.equal(data[2].cents,2500);assert.equal(data[2].count,2);assert.equal(data[0].cents,0);});
const draft={display_name:'Approved alias',perspective:'Volunteer',quote:'An authentic statement approved by its author.',consent_confirmed:false,consent_evidence:'',published:false};
test('testimonials may remain private without publication permission',()=>assert.equal(testimonialSchema.safeParse(draft).success,true));
test('publishing requires permission and a documented consent record',()=>{assert.equal(testimonialSchema.safeParse({...draft,published:true}).success,false);assert.equal(testimonialSchema.safeParse({...draft,published:true,consent_confirmed:true}).success,false);assert.equal(testimonialSchema.safeParse({...draft,published:true,consent_confirmed:true,consent_evidence:'Permission recorded by leadership, approved wording and alias.'}).success,true);});
test('withdrawn permission cannot leave a testimonial published',()=>{assert.equal(testimonialSchema.safeParse({...draft,published:true,consent_evidence:'Previous permission withdrawn.'}).success,false);assert.equal(testimonialSchema.safeParse({...draft,published:false,consent_evidence:'Previous permission withdrawn.'}).success,true);});
