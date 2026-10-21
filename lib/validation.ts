import { z } from 'zod';

export const availabilityOptions = ['Weekday mornings', 'Weekday afternoons', 'Weekday evenings', 'Saturday mornings', 'Saturday afternoons', 'Sundays', 'Flexible availability'] as const;
export const interestOptions = ['Community outreach', 'Meal preparation', 'Food distribution', 'Organizing essential supplies', 'Transportation and logistics', 'Event coordination', 'Fundraising', 'Community partnerships', 'Administrative support', 'Photography and media', 'Other'] as const;
export const skillOptions = ['First aid or CPR', 'EMT or healthcare experience', 'Food preparation or food safety', 'Driving or transportation', 'Logistics and inventory', 'Leadership or team coordination', 'Photography', 'Videography', 'Social media', 'Fundraising', 'Grant writing', 'Bilingual communication', 'Translation', 'Administrative support', 'Technology or website support', 'Other'] as const;
const shortText = z.string().trim().max(2000);
const email = z.string().trim().email().max(254).transform(v => v.toLowerCase());
export const volunteerSchema = z.object({
  fullName: z.string().trim().min(2).max(120), email,
  phone: z.string().trim().min(7).max(40).regex(/^[+\d\s().-]+$/), city: z.string().trim().min(2).max(120),
  communication: z.enum(['Email', 'Phone', 'Text message']),
  availability: z.array(z.enum(availabilityOptions)).min(1).max(availabilityOptions.length),
  scheduling: shortText.default(''), interests: z.array(z.enum(interestOptions)).min(1).max(interestOptions.length),
  skills: z.array(z.enum(skillOptions)).max(skillOptions.length).default([]), skillDetails: shortText.default(''),
  motivation: z.string().trim().min(10).max(2000), serving: shortText.default(''),
  experience: z.enum(['Yes', 'No']), experienceDetails: shortText.default(''),
  acknowledgment: z.literal(true), privacyConsent: z.literal(true), marketingConsent: z.boolean().default(false),
  website: z.string().max(0).default(''),
}).strict();
export const registrationSchema = z.object({fullName: z.string().trim().min(2).max(120), email, availability: shortText.default(''), acknowledgment: z.literal(true), website: z.string().max(0).default('')}).strict();
export const donationSchema = z.object({amount: z.number().finite().min(0.5).max(10000).refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'Use no more than two decimal places.'), frequency: z.enum(['once', 'monthly']), name: z.string().trim().min(2).max(120), email, message: z.string().trim().max(500).default(''), website: z.string().max(0).default('')}).strict().superRefine((v, ctx) => { if (v.frequency === 'monthly' && v.amount < 10) ctx.addIssue({code:'custom',path:['amount'],message:'Monthly giving starts at $10.'}); });
export const eventStatuses = ['Scheduled', 'Tentative', 'Postponed', 'Rescheduled', 'Canceled', 'Completed'] as const;
export const eventSchema = z.object({
  id: z.string().uuid().optional(), title: z.string().trim().min(3).max(160), description: z.string().trim().min(10).max(6000),
  startsAt: z.string().datetime({offset:true}), endsAt: z.string().datetime({offset:true}), timeZone: z.string().max(80).refine(v => { try { new Intl.DateTimeFormat('en', {timeZone:v}); return true; } catch { return false; } }, 'Choose a valid IANA time zone.'),
  publicLocation: z.string().trim().min(2).max(250), privateInstructions: z.string().trim().max(3000).default(''),
  capacity: z.number().int().min(1).max(10000), registrationDeadline: z.string().datetime({offset:true}).nullable(),
  organizerContact: z.string().trim().max(250).default(''), status: z.enum(eventStatuses), published: z.boolean(), registrationOpen: z.boolean(),
}).strict().superRefine((v,ctx) => { if(new Date(v.endsAt) <= new Date(v.startsAt)) ctx.addIssue({code:'custom',path:['endsAt'],message:'End time must be after start time.'}); if(v.registrationDeadline && new Date(v.registrationDeadline) > new Date(v.startsAt))ctx.addIssue({code:'custom',path:['registrationDeadline'],message:'Registration must close before the event starts.'}); });
export const contentSchema = z.object({mission:z.string().trim().min(20).max(2000),vision:z.string().trim().min(20).max(2000)}).strict();
