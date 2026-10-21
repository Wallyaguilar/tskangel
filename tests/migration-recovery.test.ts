import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const container=process.env.DASHBOARD_TEST_DB_CONTAINER;
if(container&&!/^tskangel-.*test$/.test(container))throw Error('Use only a dedicated local test container.');
test('dashboard migration fails atomically without newsletter setup and recovers safely after setup, retry and partial earlier update',{skip:!container},()=>{
 const name=`recovery_${process.pid}`;
 function sql(input:string,db='postgres'){const p=spawnSync('docker',['exec','-i',container!,'psql','-U','postgres','-d',db,'-v','ON_ERROR_STOP=1','-qAt'],{input,encoding:'utf8'});if(p.status!==0)throw Error(p.stderr);return p.stdout.trim();}
 sql(`create database ${name};`);
 try{sql('create schema auth;create table auth.users(id uuid primary key);',name);const migration=(file:string)=>readFileSync(new URL(`../supabase/migrations/${file}`,import.meta.url),'utf8');sql(migration('001_outreach_platform.sql'),name);const update=migration('003_leadership_dashboard.sql');assert.throws(()=>sql(update,name),/Newsletter setup is missing/);assert.equal(sql("select to_regclass('public.testimonials') is null;",name),'t');sql(migration('002_newsletters.sql'),name);sql(update,name);sql(update,name);assert.equal(sql("set role service_role;select leadership_metrics()->>'applications';",name),'0');sql('drop function public.leadership_metrics();',name);sql(update,name);assert.equal(sql("select has_function_privilege('anon','leadership_metrics()','execute'),has_table_privilege('authenticated','testimonials','select');",name),'f|f');}finally{sql(`drop database ${name};`);}
});
