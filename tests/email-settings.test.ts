import test from 'node:test';
import assert from 'node:assert/strict';
import {emailReplyTo} from '../lib/email-settings';
test('reply-to accepts a single monitored mailbox and trims surrounding spaces',()=>{assert.equal(emailReplyTo(' ministry@example.test '),'ministry@example.test');assert.equal(emailReplyTo(''),undefined);});
test('reply-to rejects header injection, recipient lists and invalid addresses',()=>{for(const value of ['ministry@example.test\r\nBcc: hidden@example.test','a@example.test,b@example.test','not an email','Name <a@example.test>'])assert.throws(()=>emailReplyTo(value));});
