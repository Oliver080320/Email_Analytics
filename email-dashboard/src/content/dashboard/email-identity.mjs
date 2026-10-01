const readableName=value=>value.replace(/[._-]+/g,' ').trim().toLowerCase().replace(/\b\p{L}/gu,c=>c.toUpperCase());
// Consumer mailbox domains, not the mail host behind a custom business domain.
const personalDomains=new Set(['gmail.com','googlemail.com','outlook.com','hotmail.com','live.com','msn.com',
 'yahoo.com','ymail.com','rocketmail.com','icloud.com','me.com','mac.com','aol.com','aim.com',
 'proton.me','protonmail.com','protonmail.ch','pm.me','gmx.com','gmx.net','gmx.de','gmx.at','gmx.ch',
 'mail.com','email.com','usa.com','fastmail.com','fastmail.fm','hey.com','tuta.com','tuta.io',
 'tutanota.com','tutanota.de','tutamail.com','keemail.me','rediffmail.com','rediff.com',
 'qq.com','foxmail.com','163.com','126.com','yeah.net','sina.com','sina.cn','sohu.com',
 'yandex.com','yandex.ru','ya.ru','mail.ru','inbox.ru','list.ru','bk.ru','rambler.ru',
 'web.de','freenet.de','laposte.net','orange.fr','wanadoo.fr','libero.it','virgilio.it',
 'naver.com','daum.net','hanmail.net','comcast.net','verizon.net','att.net','sbcglobal.net',
 'btinternet.com','btopenworld.com','talktalk.net','sky.com','bigpond.com','bigpond.net.au','optusnet.com.au']);
export function isPersonalMailbox(value){
 const domain=String(value||'').trim().toLowerCase().split('@').at(-1);
 return personalDomains.has(domain)||/^(yahoo|hotmail|outlook|live)\.(co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})$/.test(domain);
}
export function emailIdentity(value){
 const match=String(value||'').match(/([^\s<>@,;]+)@([^\s<>@,;]+)/);
 if(!match)return {name:'',company:''};
 const parts=match[2].toLowerCase().split('.');
 const suffix=parts.length>1?parts.pop():'';
 // Common country-code suffixes such as .com.au and .co.in.
 if(suffix.length===2&&parts.length>1&&['com','co','net','org','gov','edu','ac'].includes(parts.at(-1)))parts.pop();
 const company=parts.at(-1)||'';
 return {name:readableName(match[1]),company:isPersonalMailbox(match[2])?'':readableName(company)};
}
export function withAssumedIdentity(rows){
 return rows.map(row=>{
  const sender=emailIdentity(row.sender_email),contact=emailIdentity(row.organizationContact);
  const result={...row,senderNameAssumed:sender.name,senderCompanyAssumed:sender.company,contactNameAssumed:contact.name};
  if(isPersonalMailbox(row.organizationContact)&&(row.organization==='Organization not identified'||!row.organization||row.organizationBasis==='Assumed from contact email domain')){
   result.organizationOriginal=row.organizationOriginal||row.organization;
   result.organization='';
   result.organizationBasis='Company blank: personal email provider';
   result.organizationEvidence='No company inferred from a personal email provider, as requested.';
  }
  if((row.organization==='Organization not identified'||row.organizationBasis==='Assumed from contact email domain')&&contact.company){
   result.organizationOriginal=row.organizationOriginal||row.organization;
   result.organization=contact.company+' (assumed)';
   result.organizationBasis='Assumed from contact email domain';
   result.organizationEvidence='User-requested assumption: text after @ in '+row.organizationContact+'. May be an email provider rather than the actual company.';
  }
  return result;
 });
}
